# 07 — FEATURE STATUS AND FUTURE SCOPE

> **Audit Standard:** Objective classification of all system features into four verification tiers based strictly on inspected source code and live diagnostics.

---

## 1. Feature Classification Matrix

| Feature | Status | Source Location | Grounding Details & What Exists Today |
| :--- | :--- | :--- | :--- |
| **1-Tap Manual SOS Button** | **Implemented & Verified** | `HomeScreen.jsx`, `emergencyService.js` | Full hardware sensor reading, API submission, and success/error state UI. |
| **Supabase PostGIS Emergency Storage** | **Implemented & Verified** | `supabase.js`, `alerts_schema.sql` | PostGIS spatial conversion, generated columns, and database insertion verified. |
| **Hardware GPS & Battery Telemetry** | **Implemented & Verified** | `expo-location`, `expo-battery` | Native hardware querying with fallback to last known hardware fix. |
| **Zero-Network Native SMS Fallback** | **Implemented & Verified** | `emergencyService.js` | Invokes native SMS composer (`Linking.openURL('sms:...')`) with Google Maps URL. |
| **Adaptive 100m Polling (Haversine)** | **Implemented & Verified** | `useLocation.js` | Movement threshold filter suppresses stationary pings, preserving battery for 36+ hrs. |
| **Dead Man's Switch Daemon** | **Implemented & Verified** | `deadManSwitchService.js` | 15s interval cloud loop; auto-dispatches emergency on expired arrival deadline. |
| **Admin Audio & Toast Alerts** | **Implemented & Verified** | `src/App.jsx` | 3s polling loop catches new Alert IDs and fires `toast.error()` pop-ups. |
| **Geospatial Map Camera Tracking** | **Implemented & Verified** | `LiveMap.jsx`, `QuickMapPreview.jsx` | `MapCameraController` flies camera (`map.flyTo`) directly to active emergency coordinates. |
| **Pulsing SOS Marker & 1.8km Grid** | **Implemented & Verified** | `LiveMap.jsx` | Custom Leaflet `divIcon` with pulsing red SVG glow and dashed search grid circle. |
| **Emergency Status Transition Workflow**| **Implemented & Verified** | `alertController.js` | Transitions through `open` $\to$ `acknowledged` $\to$ `dispatched` $\to$ `resolved`. |
| **Audit Event Trail (`alert_events`)** | **Implemented & Verified** | `alertController.js` | Inserts immutable log rows for creation, telemetry updates, and status changes. |
| **Community Hazard Trust Decay Score** | **Implemented & Verified** | `hazardController.js` | 30-day decay math ($100 \times (1 - \text{age}/30) + 10\times\text{up} - 15\times\text{down}$). Auto-hides on $\ge 3$ flags. |
| **Dynamic LAN IP Discovery** | **Implemented & Verified** | `server.js`, `api.js` | `/api/network-ip` queries host interfaces to pair mobile app automatically on campus Wi-Fi. |
| **QR-Based Tourist Pairing** | **Implemented & Verified** | `AppQRPage.jsx` | Generates QR code encoding local server connection URL for instant mobile onboarding. |
| **Offline Telemetry Queue & Purge** | **Implemented but not fully tested** | `offlineStorage.js` | Buffers coordinates locally; purges logs $>7$ days old; network flush needs real carrier dead zone test. |
| **Expedition Checkpoint Verification** | **Implemented but not fully tested** | `tripController.js` | Adds physical trail checkpoint records; verified on server, partially tested on device. |
| **Geofence Boundary Violation Detection**| **Partially Implemented** | `TripsPage.jsx`, `LiveMap.jsx` | Visual radius circles render on map; automated server violation webhook is prototype. |
| **SMS/Email Carrier Gateway (Twilio)** | **Partially Implemented** | `alertController.js` | Guardian phone queried and event logged; external carrier API integration simulated. |
| **Headless Background OS Tracking** | **Partially Implemented** | `useLocation.js` | Active while app is open/foreground; headless background tasks require native background task setup. |
| **Predictive Risk & Disaster Radar** | **Partially Implemented** | `PredictiveRiskWidget.jsx` | Renders danger indices and weather widgets based on seed data rather than live live IMD radar API. |
| **Fall Detection (Accelerometer)** | **Planned / Not Implemented** | N/A | High-G sudden impact detection via `expo-sensors` accelerometer is planned for Phase 2. |
| **Push Notifications (FCM / APNs)** | **Planned / Not Implemented** | N/A | System currently uses 3s HTTP polling and native SMS fallback rather than push notification tokens. |
| **Supabase Realtime WebSockets** | **Planned / Not Implemented** | N/A | Web dashboard uses 3-second HTTP interval polling rather than `supabase.channel().on(...)`. |

---

## 2. In-Depth Investigation of Planned Features

### 1. Guardian Details & Emergency Contacts
- **What Exists Today:** Stored in `profiles` (Supabase) and `users.json`. Tapping "Notify Guardian" queries phone number and writes to `alert_events`. Mobile app pre-populates SMS to guardian.
- **What is Missing:** Direct integration with an enterprise SMS carrier (e.g., Twilio or AWS SNS) to send automated out-of-band SMS messages from the cloud server.
- **What is Needed to Complete:** Add a Twilio API SDK (`npm install twilio`), configure `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` in `.env`, and dispatch carrier SMS in `alertController.notifyGuardian`.

### 2. Geofence Boundary Detection
- **What Exists Today:** Trips have a `boundaryRadiusKm` attribute. `LiveMap.jsx` draws a visual blue/red circular perimeter on the map.
- **What is Missing:** Server-side automated detection comparing current GPS coordinates against the trip starting point and triggering an automated alert if distance exceeds the radius.
- **What is Needed to Complete:** Utilize PostGIS `ST_DWithin(user_location, trip_center, radius_meters)` inside `monitoringController.updateLocation` to auto-trigger a `deviation` alert.

### 3. Continuous Headless Background Tracking
- **What Exists Today:** The app tracks GPS while active in foreground using `Location.getCurrentPositionAsync` every 10 seconds.
- **What is Missing:** Operating-system-level background task execution when the tourist locks their screen or switches apps.
- **What is Needed to Complete:** Configure `expo-task-manager` and `Location.startLocationUpdatesAsync` with `FOREGROUND_SERVICE` and `ACCESS_BACKGROUND_LOCATION` permissions in Android manifest.

### 4. Fall Detection & Accelerometer Triggers
- **What Exists Today:** Not implemented.
- **What is Missing:** Real-time sensor sampling of rapid G-force changes followed by inactivity.
- **What is Needed to Complete:** Install `expo-sensors`, subscribe to `Accelerometer.addListener`, detect acceleration spikes $> 3.5g$ followed by 60 seconds of zero motion, and present a 30-second cancellation countdown before automatically firing an SOS.
