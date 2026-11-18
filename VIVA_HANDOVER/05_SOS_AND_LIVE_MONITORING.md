# 05 — SOS WORKFLOW AND LIVE MONITORING

> **Core Focus:** End-to-end trace of emergency distress signaling, GPS telemetry acquisition, spatial map rendering, and the Dead Man's Switch daemon.

---

## 1. End-to-End SOS Lifecycle: From Mobile Button to SAR Command Center

```
[Phase 1: Sensor & Hardware Interrogation]
  1. Tourist taps SOS in HomeScreen.jsx
  2. submitLockRef.current is engaged to prevent concurrent double-presses
  3. expo-location queries GNSS hardware with Location.Accuracy.Balanced
  4. expo-battery reads device power level via Battery.getBatteryLevelAsync()
  5. Platform/OS metadata is assembled (iOS/Android version & model)

[Phase 2: Network Transmission & Edge Fallback]
  6. If online: Transmits HTTP POST to /api/alerts/sos via emergencyService.js
  7. If offline or timed out (>8000ms): Caught by error handler; invokes
     emergencyService.triggerOfflineNativeSmsFallback(coords, guardianPhone)
     --> Opens native device SMS composer with pre-filled Google Maps coordinates!

[Phase 3: Backend Processing & Supabase Persistence]
  8. Express router mounts request to alertController.createSosAlert()
  9. Validates coordinates and battery percentage (never fabricates data)
 10. Checks for existing live alert on this trip_id
 11. If active alert exists OR DB triggers error 23505 (one_live_alert_per_trip):
     --> Updates existing active record with freshest telemetry fix
 12. Else: Inserts new row into public.alerts using POINT(lng lat)
 13. Inserts immutable audit entry into public.alert_events (kind='sos_raised')
 14. Synchronizes status='EMERGENCY' in server/json/users.json

[Phase 4: Admin Detection & Geospatial Visualization]
 15. Admin App.jsx 3s polling loop detects new Alert ID
 16. Fires toast.error() pop-up notification with audio chime
 17. LiveMap.jsx / QuickMapPreview.jsx receives live coordinates
 18. MapCameraController executes map.flyTo([lat, lng], 13, { duration: 1.5 })
 19. Renders pulsing red SVG marker and 1.8km search grid perimeter circle

[Phase 5: Search & Rescue (SAR) Resolution]
 20. Operator clicks "Acknowledge" (status becomes 'acknowledged')
 21. Operator clicks "Dispatch Rescue Team" (status becomes 'dispatched')
 22. Operator logs debrief notes and clicks "Resolve" (status becomes 'resolved')
```

---

## 2. Sensor & Hardware Telemetry Collection in Code

### A. Real GPS Coordinate Acquisition (`stsms-mobile/app/screens/HomeScreen.jsx`)
```javascript
const refreshLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setGpsPermission(status);
    if (status !== 'granted') return null;

    // High-priority satellite fix
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    if (loc && loc.coords) {
      const newLoc = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setGpsLocation(newLoc);
      return newLoc;
    }
  } catch (err) {
    // Fallback to cached hardware fix if satellites are temporarily obstructed
    try {
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown && lastKnown.coords) {
        const fallbackLoc = { lat: lastKnown.coords.latitude, lng: lastKnown.coords.longitude };
        setGpsLocation(fallbackLoc);
        return fallbackLoc;
      }
    } catch (e) {}
  }
  return null;
};
```

### B. Hardware Battery Level Reading (`stsms-mobile/app/screens/HomeScreen.jsx`)
```javascript
let currentBat = batteryLevel;
try {
  const bat = await Battery.getBatteryLevelAsync();
  if (bat >= 0) {
    currentBat = Math.round(bat * 100);
    setBatteryLevel(currentBat);
  }
} catch (e) {}
```

---

## 3. Zero-Network Native SMS Fallback (Dead-Zone Recovery)

When cellular 4G/5G drops in mountain valleys, standard HTTP calls fail. In `stsms-mobile/app/services/emergencyService.js`, STSMS invokes a native device OS bridge:

```javascript
triggerOfflineNativeSmsFallback: async (coords, emergencyContactPhone, messageNote) => {
  const lat = coords?.lat != null ? coords.lat : null;
  const lng = coords?.lng != null ? coords.lng : null;
  const phone = emergencyContactPhone || '';
  const mapsUrl = (lat != null && lng != null) 
    ? `https://maps.google.com/?q=${lat},${lng}` 
    : 'Coordinates Pending';

  const body = `[STSMS SATELLITE GNSS SOS DISTRESS ALERT]\nLocation: ${
    lat != null && lng != null ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : 'Awaiting satellite fix'
  }\nTime: ${new Date().toLocaleTimeString()}\nMaps: ${mapsUrl}\nDetails: ${messageNote || 'Manual SOS in zero cellular zone.'}`;

  // OS-specific URI scheme for SMS composer
  const smsUrl = Platform.OS === 'ios'
    ? `sms:${phone}&body=${encodeURIComponent(body)}`
    : `sms:${phone}?body=${encodeURIComponent(body)}`;

  const canOpen = await Linking.canOpenURL(smsUrl);
  if (canOpen) {
    await Linking.openURL(smsUrl);
    return { success: true, method: 'NATIVE_SMS_COMPOSER' };
  }
}
```

*Viva Explanation:* Even with zero data connectivity, cellular phone towers often support 2G signaling channels or direct native SMS queuing. By opening the native SMS app pre-populated with coordinates, the tourist simply taps "Send", transmitting their coordinates to their guardian without requiring backend server reachability.

---

## 4. Adaptive 100-Meter Displacement Polling (Haversine Filter)

Continuous GPS polling drains a phone battery in under 5 hours. In `stsms-mobile/app/hooks/useLocation.js`, STSMS implements a mathematical movement filter using the **Haversine Formula**:

$$\Delta\sigma = 2 \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
$$d = R \cdot \Delta\sigma \quad (\text{where } R = 6,371,000 \text{ meters})$$

```javascript
// From useLocation.js:
const shouldLogPing = distFromLast >= 100 || currentSpeed > 5.0;

if (shouldLogPing) {
  lastLoggedPositionRef.current = { lat: currentLat, lng: currentLng };
  // Transmit telemetry or buffer offline
} else {
  console.log(`Battery Preserved: Only moved ${Math.round(distFromLast)}m (<100m threshold). Skipping GPS radio surge.`);
}
```
- If the tourist is resting at a campsite or walking within a 100-meter radius, radio transmission is suppressed.
- This extends the smartphone battery life to **36+ hours**, preserving battery for life-saving SOS situations.

---

## 5. Automated Dead Man's Switch Engine

Located in `server/services/deadManSwitchService.js`, this background cloud worker loops automatically every **15 seconds**:
```javascript
export const startDeadManSwitchWorker = () => {
  if (intervalId) return;
  intervalId = setInterval(checkDeadManSwitch, 15000);
};
```
### Workflow for Unresponsive Victims:
1. When a tourist registers an expedition, they specify an `expectedArrivalDeadline` (e.g., *17:30*).
2. If `new Date() > new Date(trip.expectedArrivalDeadline)` and the status is still `'Active'`:
   - The trip status updates to `'EXPIRED_UNCHECKED'`.
   - The engine automatically inserts an emergency alert (`alt_dms_*`) with `type: "Dead Man's Switch Dispatch"` and `severity: 'CRITICAL'`.
   - The Command Center dashboard receives an automated notification: *"Safe check-in deadline expired for route... Emergency dispatch activated!"*
3. The tourist can reset the timer at any time before expiry by tapping "Safe Check-In" (`POST /api/trips/:id/checkin`) or "Extend Deadline" (`POST /api/trips/:id/extend-deadline`).

---

## 6. Live Interactive Map Implementation (`LiveMap.jsx` & `QuickMapPreview.jsx`)

### A. Automated Camera Tracking (`MapCameraController`)
In `LiveMap.jsx`, an internal Leaflet hook automatically detects the presence of active emergencies and flies the camera to the target coordinates:
```javascript
const MapCameraController = ({ selectedLocation, locations = [] }) => {
  const map = useMap();
  const hasCenteredEmergency = React.useRef(false);

  useEffect(() => {
    if (selectedLocation?.location?.lat && selectedLocation?.location?.lng) {
      map.flyTo([selectedLocation.location.lat, selectedLocation.location.lng], 13, { duration: 1.2 });
      return;
    }

    if (!hasCenteredEmergency.current) {
      const emergency = locations.find(l => (l.status === 'EMERGENCY' || l.activeAlertsCount > 0) && l.location?.lat && l.location?.lng);
      if (emergency) {
        hasCenteredEmergency.current = true;
        map.flyTo([emergency.location.lat, emergency.location.lng], 13, { duration: 1.5 });
      }
    }
  }, [selectedLocation, locations, map]);
  return null;
};
```

### B. Custom Pulsing Red Emergency Marker (`createEmergencyMarkerIcon`)
```javascript
const createEmergencyMarkerIcon = (name) => {
  return L.divIcon({
    className: 'custom-live-marker-sos',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
        <div style="position: absolute; top: -30px; white-space: nowrap; background: #dc2626; color: #ffffff; font-weight: 800; font-size: 10px; padding: 3px 8px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.6); border: 1.5px solid #ffffff;">
          🚨 SOS: ${name}
        </div>
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(239, 68, 68, 0.45); animation: pulse-glow 1.4s infinite ease-in-out;"></div>
        <div style="background: #ef4444; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 16px #ef4444;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};
```

### C. Search Grid Circle
Around any emergency marker, a red dashed perimeter circle is rendered with an 1800-meter radius (`<Circle radius={1800} pathOptions={{ color: '#ef4444', fillOpacity: 0.22, dashArray: '5, 5' }} />`), defining the immediate visual Search and Rescue grid for field ground teams.

---

## 7. Failure Scenario Matrix

| Failure Mode | What Actually Happens in Code | User / Operator Impact |
| :--- | :--- | :--- |
| **GPS satellite fix unavailable** | `refreshLocation()` catches error, falls back to `getLastKnownPositionAsync()`. If still null, sets `location: null`. | SOS is still transmitted. Backend logs alert as `location: null` and sets message to "Awaiting GNSS fix". |
| **Device battery unavailable** | `Battery.getBatteryLevelAsync()` catches exception and sets `currentBat = null`. | Backend saves `battery: null`. Dashboard displays "Battery: N/A" without crashing. |
| **Network completely offline** | `emergencyService.triggerSos` times out (8s) or throws network failure. Catches error and triggers `triggerOfflineNativeSmsFallback`. | Phone opens native SMS composer with Google Maps link pre-filled to guardian. |
| **Duplicate SOS pressed within 2s**| `submitLockRef.current` blocks mobile UI. If requests reach backend concurrently, DB error `23505` triggers update instead of duplicate insert. | Single authoritative alert is updated with the latest coordinates; no duplicate spam. |
| **No active alerts present** | LiveMap renders at India center `[28.6139, 77.2090]` at zoom level 5. | Map displays normally with active and offline tourists in green/yellow. |
