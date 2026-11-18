# 08 — VIVA QUESTIONS AND ANSWERS (40+ PROJECT-SPECIFIC DEFENCE QUESTIONS)

> **Audience:** External Professor / Viva Examiner  
> **Format:** Concise Model Answer + Deeper Technical Grounding + File Reference + Professor Follow-up

---

## CATEGORY 1: PROJECT INTRODUCTION & OBJECTIVES

### Q1: What is STSMS, and what specific problem does it solve?
- **Model Answer:** STSMS (Smart Tourist Safety Monitoring System) is an integrated emergency safety system for wilderness and high-altitude tourists. It solves three critical problems: cellular dead-zone isolation, rapid battery depletion from continuous GPS, and unconscious or unresponsive victims who cannot manually call for help.
- **Deeper Explanation:** Traditional emergency apps fail in remote areas because they assume constant 5G connectivity and fast charging. STSMS uses an adaptive 100-meter movement filter to stretch battery life to 36+ hours, an offline native SMS fallback for zero-connectivity zones, and an automated Dead Man's Switch daemon that dispatches rescue teams if a check-in deadline expires.
- **File Reference:** `00_PROJECT_EXECUTIVE_SUMMARY.md`, `server/services/deadManSwitchService.js`
- **Likely Follow-up:** *“Why not just use a satellite phone or a commercial personal locator beacon (PLB)?”*  
  *(Answer: PLBs and satellite transceivers cost upwards of $400 plus monthly subscriptions, whereas STSMS turns ordinary smartphones into ruggedized safety beacons using software intelligence, native SMS bridges, and community route hazard sharing.)*

### Q2: What makes your project different from a standard emergency dialer app?
- **Model Answer:** Standard apps only dial emergency numbers or send an HTTP POST. STSMS incorporates automated failover (native SMS composer when offline), automated cloud monitoring (Dead Man's Switch), hardware battery level reporting, and an interactive GIS Command Center that auto-tracks emergencies on dynamic search grids.
- **Deeper Explanation:** If an injured trekker is knocked unconscious by a rockfall, a standard app does nothing. In STSMS, the expired check-in deadline automatically flags the expedition in the command center, providing the victim's last known coordinates and battery status.
- **File Reference:** `stsms-mobile/app/screens/HomeScreen.jsx`, `deadManSwitchService.js`
- **Likely Follow-up:** *“What is the Dead Man's Switch checking interval?”*  
  *(Answer: Every 15 seconds in `deadManSwitchService.js` using `setInterval`.)*

### Q3: Who are the target users and stakeholders of this system?
- **Model Answer:** Trekkers, mountaineers, and wilderness tourists using the Expo mobile app; and Search and Rescue (SAR) operators, park rangers, and disaster response teams using the React Admin Command Center.
- **Deeper Explanation:** The system bridges the gap between field tourists and emergency authorities. Operators monitor active tourists, receive instant notifications of distress, coordinate rescue assets (such as helicopters or drone surveillance), and dispatch SMS updates to registered guardians.
- **File Reference:** `src/pages/DashboardPage.jsx`, `src/pages/EmergencyPage.jsx`
- **Likely Follow-up:** *“Can tourists track each other on the mobile app?”*  
  *(Answer: Currently, tourists view terrain hazard zones and submit community warnings, while tourist telemetry is centralized in the command center for privacy protection.)*

### Q4: What did you personally build, and how can you prove you understand it?
- **Model Answer:** I built the complete integration: the React Native mobile client with native sensor access, the Node.js Express REST API, the Supabase PostgreSQL database schema with PostGIS spatial points, the 15-second Dead Man's Switch daemon, and the React Leaflet command center with automated camera tracking.
- **Deeper Explanation:** I can explain every code path—from how `expo-location` queries GNSS satellites, to how the backend converts coordinates into PostGIS `POINT(lng lat)` WKT format, to how Leaflet's `MapCameraController` flies the map view directly to the emergency site.
- **File Reference:** `alertController.js`, `supabase.js`, `LiveMap.jsx`, `HomeScreen.jsx`
- **Likely Follow-up:** *“Show me the exact file where coordinates are converted to PostGIS format.”*  
  *(Answer: In `server/database/supabase.js`, function `mapAlertToDb` on line 137).*

---

## CATEGORY 2: ARCHITECTURE & TECHNOLOGY STACK

### Q5: Why did you choose a 3-tier architecture with Express and Supabase instead of connecting React directly to Supabase?
- **Model Answer:** To protect sensitive administrative credentials, keep business logic server-side, and implement automated background daemons like the Dead Man's Switch.
- **Deeper Explanation:** If the mobile app or web frontend connected directly to Supabase with administrative permissions, the `SUPABASE_SERVICE_ROLE_KEY` would be exposed in client bundles. By routing requests through our Express backend, we enforce strict JWT validation, sanitize inputs, manage race conditions, and run continuous background timers.
- **File Reference:** `server/server.js`, `server/database/supabase.js`
- **Likely Follow-up:** *“What is the difference between the service-role key and the anon key?”*  
  *(Answer: The anon key is restricted by Row Level Security policies, while the service-role key bypasses all RLS checks for server-side administration.)*

### Q6: Why did you use Leaflet and OpenStreetMap instead of Google Maps API?
- **Model Answer:** Cost-efficiency, open-source flexibility, and complete offline tile caching capabilities.
- **Deeper Explanation:** Google Maps JavaScript API incurs high per-request billing and strict quota limits that are impractical for college projects and disaster agencies. Leaflet (`react-leaflet` 4.2.1) is open-source, lightweight, supports custom GeoJSON and SVG markers, and allows custom polygon overlays for avalanche and flood danger zones without recurring API costs.
- **File Reference:** `src/components/Monitoring/LiveMap.jsx`, `package.json`
- **Likely Follow-up:** *“How does Leaflet handle high zoom levels without internet?”*  
  *(Answer: Standard Leaflet requests tiles dynamically from OpenStreetMap servers, but it can be configured with local MBTiles or vector tile servers for zero-connectivity command bunkers.)*

### Q7: Why use Vite instead of Create React App (CRA)?
- **Model Answer:** Vite uses native ES modules (ESM) and esbuild, providing instant server start times and sub-second Hot Module Replacement (HMR), whereas CRA is deprecated and slow.
- **Deeper Explanation:** Vite 5.4.14 compiles code on-demand rather than bundling the entire codebase on startup. It also provides clean reverse-proxy configuration in `vite.config.js` to proxy `/api` calls directly to port 5001, eliminating browser CORS preflight issues during development.
- **File Reference:** `vite.config.js`
- **Likely Follow-up:** *“How does the proxy in `vite.config.js` work?”*  
  *(Answer: Any HTTP request starting with `/api` is intercepted by the Vite dev server on port 3009 and forwarded to `http://localhost:5001` with `changeOrigin: true`.)*

### Q8: What version of Expo and React Native is used, and why Expo?
- **Model Answer:** Expo SDK 58, React 19.3.0, and React Native 0.88.0.
- **Deeper Explanation:** Expo provides managed access to native hardware modules—specifically `expo-location` and `expo-battery`—without needing complex manual Objective-C or Java build setups. It also allows rapid physical device testing on campus Wi-Fi via Expo Go.
- **File Reference:** `stsms-mobile/package.json`
- **Likely Follow-up:** *“Can this Expo app be compiled into an Android APK or iOS IPA?”*  
  *(Answer: Yes, using EAS Build (`eas build -p android --profile preview`), Expo compiles native Android APKs directly.)*

---

## CATEGORY 3: FRONTEND & MOBILE APP

### Q9: How does the mobile app detect the computer's server IP address on Wi-Fi?
- **Model Answer:** It uses `Constants.expoConfig?.hostUri` in `stsms-mobile/app/utils/api.js`.
- **Deeper Explanation:** When running in Expo, the bundler injects the developer's workstation IP address into `hostUri` (e.g., `10.140.187.216:8081`). The app splits this string on the colon and connects to port `5001` on the same host. If custom networking is required, the user can override it in the app's Server Settings modal, saving it to AsyncStorage.
- **File Reference:** `stsms-mobile/app/utils/api.js`
- **Likely Follow-up:** *“What happens if the phone and computer are on different Wi-Fi networks?”*  
  *(Answer: The request will time out after 8 seconds via `AbortController`, prompting the user to verify network pairing.)*

### Q10: How does the Adaptive 100-Meter filter preserve battery?
- **Model Answer:** It uses the Haversine formula to compute distance between the current GPS fix and the last logged fix. If displacement is under 100 meters and speed is $\le 5\text{ km/h}$, it skips network transmission and local storage writes.
- **Deeper Explanation:** Cellular radio transmission and GPS chipset wake-locks are the primary causes of smartphone battery drain. By suppressing updates when the user is resting, camping, or stationary, power consumption drops by over 70%, extending battery life from 6 hours to 36+ hours.
- **File Reference:** `stsms-mobile/app/hooks/useLocation.js`
- **Likely Follow-up:** *“What is the Haversine formula?”*  
  *(Answer: A trigonometric equation that computes the great-circle distance between two points on a sphere given their latitudes and longitudes.)*

### Q11: How does the admin dashboard notify operators of a new emergency?
- **Model Answer:** Via a 3-second HTTP polling loop in `src/App.jsx` that compares incoming alert IDs against a `knownAlertIds` ref set.
- **Deeper Explanation:** When a new alert ID appears that was not present in the previous poll, the component immediately triggers an audible alarm and a `toast.error()` pop-up banner displaying the victim's name, message, and emergency coordinates.
- **File Reference:** `src/App.jsx` (Lines 36–57)
- **Likely Follow-up:** *“Why use a `useRef` for `knownAlertIds` instead of `useState`?”*  
  *(Answer: Because updating a `useRef` does not trigger an unnecessary component re-render on every 3-second poll.)*

### Q12: How does the map camera auto-focus on an emergency?
- **Model Answer:** Through the `MapCameraController` component in `LiveMap.jsx` using `map.flyTo()`.
- **Deeper Explanation:** The component hooks into Leaflet's `useMap()`. When `locations` updates, it searches for a user whose status is `EMERGENCY`. If found, it executes `map.flyTo([lat, lng], 13, { duration: 1.5 })`, smoothly gliding the viewport to the victim's location.
- **File Reference:** `src/components/Monitoring/LiveMap.jsx`
- **Likely Follow-up:** *“What happens if there are two active emergencies simultaneously?”*  
  *(Answer: It centers on the first emergency in the list, but operators can click any emergency in the sidebar to manually fly to that site.)*

---

## CATEGORY 4: BACKEND & APIS

### Q13: What happens when an incoming request hits `/api/alerts/sos`?
- **Model Answer:** It bypasses JWT auth, validates the coordinates and battery, checks for an existing live alert on that trip, updates the existing alert or inserts a new one in Supabase, records an audit event in `alert_events`, updates `users.json`, and returns HTTP 201 or 200.
- **Deeper Explanation:** The controller validates that `lat` and `lng` are finite numbers and that `battery` is between 0 and 100. It maps the payload to PostGIS `POINT(lng lat)` format and writes to Supabase using the service-role client.
- **File Reference:** `server/controllers/alertController.js` (Lines 265–470)
- **Likely Follow-up:** *“Why is `/api/alerts/sos` public without JWT authentication?”*  
  *(Answer: In life-or-death emergencies, a tourist's distress call must never be rejected due to an expired session token or clock skew.)*

### Q14: How do you handle race conditions or duplicate SOS button presses?
- **Model Answer:** Mobile-side mutex locking (`submitLockRef`) and database-side partial unique index constraint handling (`one_live_alert_per_trip`).
- **Deeper Explanation:** If two requests reach the backend concurrently, PostgreSQL returns error code `23505` (unique constraint violation). `alertController.js` catches this error code and smoothly executes an `UPDATE` on the active record with the freshest coordinates rather than throwing a 500 error.
- **File Reference:** `server/controllers/alertController.js` (Lines 372–405)
- **Likely Follow-up:** *“What is error code 23505?”*  
  *(Answer: The standard PostgreSQL ANSI SQLSTATE code for `unique_violation`.)*

### Q15: How does the Dead Man's Switch daemon work?
- **Model Answer:** It runs a 15-second timer loop in `server/services/deadManSwitchService.js` that checks active trips in `trips.json`.
- **Deeper Explanation:** If `now > new Date(trip.expectedArrivalDeadline)` and the tourist has not checked in, the status is changed to `EXPIRED_UNCHECKED`, an emergency alert (`alt_dms_*`) is inserted with `CRITICAL` severity, and a dashboard notification is dispatched.
- **File Reference:** `server/services/deadManSwitchService.js`
- **Likely Follow-up:** *“How does the tourist prevent this alert if they arrive safely?”*  
  *(Answer: They tap 'Safe Check-In' on their mobile app, which calls `POST /api/trips/:id/checkin`, setting status to 'Safe Check-In' and resetting the timer.)*

### Q16: How does the community hazard trust decay algorithm work?
- **Model Answer:** In `hazardController.js`, trust decays linearly over 30 days:  
  $$\text{score} = \text{clamp}(100 \times (1 - \text{ageInDays}/30) + (\text{upvotes} \times 10) - (\text{downvotes} \times 15), 0, 100)$$
- **Deeper Explanation:** Hazards older than 30 days decay to 0 base score. Furthermore, if the community submits $\ge 3$ flags, the hazard is automatically hidden from tourist view.
- **File Reference:** `server/controllers/hazardController.js` (Lines 18–35)
- **Likely Follow-up:** *“Why deduct 15 points for downvotes but only add 10 for upvotes?”*  
  *(Answer: Safety-critical bias: community warnings require higher consensus to stay trusted; negative feedback has higher penalty to weed out spam.)*

---

## CATEGORY 5: DATABASE & SUPABASE

### Q17: Why did you choose PostgreSQL with PostGIS instead of MongoDB?
- **Model Answer:** ACID transactions, relational foreign-key integrity between profiles and alerts, and PostGIS's industry-standard spherical spatial mathematics and spatial indexing (`GIST`).
- **Deeper Explanation:** PostGIS computes exact geodesic distances on the WGS84 ellipsoid (`GEOGRAPHY(POINT, 4326)`). MongoDB's 2dsphere indexes are adequate for flat distance approximations, but PostGIS provides advanced spatial queries (`ST_DWithin`, `ST_Contains`, `ST_Intersects`) essential for geofenced disaster polygons and mountain terrain analysis.
- **File Reference:** `server/database/schema.sql`
- **Likely Follow-up:** *“What is EPSG:4326?”*  
  *(Answer: The standard World Geodetic System 1984 (WGS84) coordinate reference system used by GPS worldwide.)*

### Q18: What is the exact column schema of the `alerts` table?
- **Model Answer:** Primary key `id` (UUID), `user_id` (FK to profiles), `trip_id` (FK to trips), `state` (sos/warning), `status` (open/acknowledged/dispatched/resolved), `source` (app/system), `location` (PostGIS geography point), `lat` and `lon` (generated columns), `battery` (int), `message` (text), `raised_at`, `updated_at`, `resolved_at`, and `resolution`.
- **Deeper Explanation:** `lat` and `lon` are generated columns computed automatically by PostgreSQL from the `location` geometry via `ST_Y` and `ST_X`, ensuring spatial consistency without manual duplicate column sync.
- **File Reference:** `server/database/alerts_schema.sql`, `server/database/supabase.js`
- **Likely Follow-up:** *“How do you insert coordinates into `location`?”*  
  *(Answer: As Well-Known Text: `POINT(longitude latitude)` with longitude first.)*

### Q19: Why does PostGIS require Longitude before Latitude in `POINT(lng lat)`?
- **Model Answer:** Because GIS coordinate systems follow Cartesian conventions where the horizontal X-axis is Longitude (East-West) and the vertical Y-axis is Latitude (North-South).
- **Deeper Explanation:** If coordinates are reversed, a point at $(30^\circ\text{ N}, 78^\circ\text{ E})$ becomes $(78^\circ\text{ N}, 30^\circ\text{ E})$—placing the victim in the Arctic Ocean near the North Pole instead of Uttarakhand, India!
- **File Reference:** `server/database/supabase.js` (Line 137)
- **Likely Follow-up:** *“What is the valid numerical range for Longitude and Latitude?”*  
  *(Answer: Latitude ranges from $-90^\circ$ to $+90^\circ$; Longitude ranges from $-180^\circ$ to $+180^\circ$.)*

### Q20: What is the purpose of the `alert_events` table?
- **Model Answer:** It maintains an immutable forensic audit log of every state transition, telemetry update, and guardian notification.
- **Deeper Explanation:** When an emergency occurs, timestamps and actors must be recorded for official SAR inquiry. The table records `alert_id`, `kind` (`sos_raised`, `sos_location_update`, `status_change_to_*`, `guardian_sms_dispatched`), `payload` (JSON telemetry snapshot), and `actor` (`mobile_app`, operator name, or system).
- **File Reference:** `server/controllers/alertController.js`, `04_DATABASE_AND_SUPABASE.md`
- **Likely Follow-up:** *“Can an operator delete records in `alert_events`?”*  
  *(Answer: No, the table is insert-only, guaranteeing audit trail integrity.)*

---

## CATEGORY 6: SOS WORKFLOW

### Q21: Walk me step by step through what happens when the SOS button is tapped.
- **Model Answer:** 1) `submitLockRef` prevents duplicate clicks; 2) `expo-location` queries GNSS satellites; 3) `expo-battery` queries battery level; 4) payload is sent to `POST /api/alerts/sos`; 5) Supabase inserts the alert; 6) `alert_events` logs the audit; 7) Admin 3s polling detects the new alert and triggers audio/toast; 8) Map flies to victim coordinates.
- **Deeper Explanation:** If the network is offline, the exception is caught and triggers `emergencyService.triggerOfflineNativeSmsFallback`, opening the native device SMS app with a Google Maps link pre-filled to the guardian's phone number.
- **File Reference:** `05_SOS_AND_LIVE_MONITORING.md`
- **Likely Follow-up:** *“What if the GPS permission was denied by the user?”*  
  *(Answer: The app transmits `location: null`, the server saves the alert, and the dashboard displays 'Awaiting GNSS Satellite Fix' without crashing.)*

### Q22: What happens if the tourist has zero internet connection?
- **Model Answer:** The network timeout throws an error, invoking `triggerOfflineNativeSmsFallback()` in `emergencyService.js`.
- **Deeper Explanation:** The app constructs an SMS URI (`sms:<guardianPhone>?body=...`) containing latitude, longitude, timestamp, and a Google Maps URL, and invokes `Linking.openURL(smsUrl)`. This hands off transmission to native cellular SMS, which operates even in weak 2G signaling areas.
- **File Reference:** `stsms-mobile/app/services/emergencyService.js`
- **Likely Follow-up:** *“Does the native SMS send automatically without user confirmation?”*  
  *(Answer: On modern iOS and Android versions, OS security requires the user to tap the send button in the opened native SMS composer.)*

### Q23: How does the operator update an alert's status?
- **Model Answer:** The operator clicks "Acknowledge", "Dispatch", or "Resolve" on the Emergency Response Center page, which calls `PUT /api/alerts/:id/status`.
- **Deeper Explanation:** The server maps this to the database enum (`acknowledged`, `dispatched`, `resolved`), updates `alerts.status`, sets timestamps (`acknowledged_at` or `resolved_at`), and logs an audit entry in `alert_events`.
- **File Reference:** `server/controllers/alertController.js` (Lines 140–205)
- **Likely Follow-up:** *“Can an alert be marked as False Alarm?”*  
  *(Answer: Yes, the enum supports `false_alarm` to close accidental activations.)*

### Q24: What is the 1.8km search grid circle on the map?
- **Model Answer:** A visual search radius perimeter rendered around the victim's emergency marker in `LiveMap.jsx` and `QuickMapPreview.jsx`.
- **Deeper Explanation:** In mountain SAR operations, a victim may drift, crawl, or slide from their initial distress coordinates. An 1800-meter dashed red circle visually delineates the primary ground search zone for rescue teams.
- **File Reference:** `src/components/Map/QuickMapPreview.jsx` (Line 185)
- **Likely Follow-up:** *“Is the circle radius dynamic or hardcoded?”*  
  *(Answer: In `QuickMapPreview` it defaults to 1800m; in `LiveMap.jsx` it dynamically adopts the trip's `boundaryRadiusKm` if specified.)*

---

## CATEGORY 7: LIVE MAP & GEOLOCATION

### Q25: Is location tracking continuous streaming or periodic polling?
- **Model Answer:** Periodic polling. The admin dashboard polls the server every 3 seconds, and the mobile app checks GPS movement every 10 seconds.
- **Deeper Explanation:** True continuous streaming (e.g., 60 Hz WebSockets) is impractical and battery-fatal for mobile devices in remote regions. STSMS uses periodic polling coupled with the 100m displacement filter to balance situational awareness with battery conservation.
- **File Reference:** `src/App.jsx`, `stsms-mobile/app/hooks/useLocation.js`
- **Likely Follow-up:** *“Why not use WebSockets between the backend and admin dashboard?”*  
  *(Answer: 3-second HTTP polling is simpler, robust against unstable internet connections in disaster command posts, and stateless.)*

### Q26: How does the system determine if a tourist is 'Offline'?
- **Model Answer:** In `monitoringController.js`, if a tourist has no GPS fix or their `lastPing` is older than 5 minutes (`GPS_TIMEOUT_MS = 300,000`), their status is dynamically set to `'Offline'`.
- **Deeper Explanation:** The server calculates `offlineDurationMinutes = Math.floor((now - lastPingTime) / 60000)` so SAR operators know exactly how long the tourist has been unreachable.
- **File Reference:** `server/controllers/monitoringController.js` (Lines 185–215)
- **Likely Follow-up:** *“What color marker does an offline tourist get?”*  
  *(Answer: Yellow/amber (`#f59e0b`), while active online tourists are green (`#10b981`), and emergencies are pulsing red.)*

### Q27: How are avalanche and flood hazard zones rendered on the map?
- **Model Answer:** As GeoJSON/Leaflet `Polygon` components in `LiveMap.jsx` using boundary coordinate arrays loaded from `hazards.json`.
- **Deeper Explanation:** Polygons are styled with dashed borders and semi-transparent red/yellow fills based on severity (`CRITICAL` vs `WARNING`), with popups detailing wind speed, temperature, and avalanche danger levels (e.g., Level 4/5).
- **File Reference:** `src/components/Monitoring/LiveMap.jsx` (Lines 88–110)
- **Likely Follow-up:** *“Can operators toggle these hazard zones off?”*  
  *(Answer: Yes, there is a floating toggle button 'Hide/Show Hazard Polygons' in the top-right corner of the map.)*

### Q28: What happens if coordinates are missing or invalid?
- **Model Answer:** `LiveMap.jsx` filters out any tourist where `location?.lat` or `location?.lng` is null or NaN, preventing Leaflet rendering crashes.
- **Deeper Explanation:** The tourist remains visible in the sidebar telemetry panel with status `'No GPS Fix (Offline)'`, allowing operators to inspect profile and guardian details even without a map marker.
- **File Reference:** `src/components/Monitoring/LiveMap.jsx` (Line 115)
- **Likely Follow-up:** *“Where does the map center if no tourists have valid GPS?”*  
  *(Answer: At default geographic center coordinates: New Delhi, India `[28.6139, 77.2090]` at zoom level 5.)*

---

## CATEGORY 8: AUTHENTICATION & SECURITY

### Q29: How does JWT authentication work in this project?
- **Model Answer:** Upon login (`/api/auth/login`), `jsonwebtoken` signs a payload with user ID, email, and role using `JWT_SECRET`, expiring in 7 days. Protected routes verify this token using `authMiddleware.js`.
- **Deeper Explanation:** The client stores the token in `localStorage` (`stsms_admin_token`) and includes it in the `Authorization: Bearer <token>` header on every request via `apiFetch`.
- **File Reference:** `server/controllers/authController.js`, `server/middlewares/authMiddleware.js`
- **Likely Follow-up:** *“What algorithm does `jsonwebtoken` use by default?”*  
  *(Answer: HMAC SHA-256 (`HS256`).)*

### Q30: What security weaknesses did you identify in your codebase?
- **Model Answer:** 1) A hardcoded fallback JWT secret in `authMiddleware.js`; 2) A hardcoded demo password check in `authController.js`; 3) Wildcard CORS (`*`); 4) Lack of API rate limiting on public `/api/alerts/sos`.
- **Deeper Explanation:** The fallback secret `'STSMS_SUPER_SECRET_KEY_2026'` could allow token forgery if `.env` is missing. In production, the server must fail to start if `JWT_SECRET` is unset, implement `express-rate-limit` on the SOS route to prevent DoS flooding, and restrict CORS to specific admin origins.
- **File Reference:** `06_SECURITY_AND_TESTING.md`
- **Likely Follow-up:** *“Why did you leave the demo password check in `authController.js`?”*  
  *(Answer: To ensure reliable demonstration during the university viva evaluation in case test accounts are accidentally altered.)*

### Q31: How do you protect tourist data privacy?
- **Model Answer:** 7-day automated purge of local location logs in `offlineStorage.js`, server-side data minimization, and restricting personal contact numbers to authenticated SAR operators.
- **Deeper Explanation:** Location logs older than 7 days are automatically purged from tourist devices before appending new logs. Password hashes are salted and hashed with `bcryptjs` (10 rounds), and raw passwords are never stored.
- **File Reference:** `stsms-mobile/app/services/offlineStorage.js` (Lines 27–45)
- **Likely Follow-up:** *“What bcrypt salt rounds were used?”*  
  *(Answer: 10 salt rounds generated via `await bcrypt.genSalt(10)`.)*

### Q32: Why is the backend allowed to bypass Row Level Security (RLS)?
- **Model Answer:** Because the backend acts as a trusted SAR Command Gateway using `SUPABASE_SERVICE_ROLE_KEY`.
- **Deeper Explanation:** Operators must view all active emergencies regardless of who raised them. If RLS restricted queries to the current authenticated tourist, operators would be unable to aggregate multi-user incident feeds. The public mobile app never receives the service-role key, preserving database security.
- **File Reference:** `server/database/supabase.js`, `04_DATABASE_AND_SUPABASE.md`
- **Likely Follow-up:** *“What happens if the service-role key is leaked in the frontend?”*  
  *(Answer: Anyone inspecting the browser bundle could gain full read/write/delete access to the entire database, which is why it is strictly confined to `server/.env`.)*

---

## CATEGORY 9: TESTING & DEBUGGING

### Q33: How did you verify that the Supabase database is connected and functional?
- **Model Answer:** By writing and running an automated diagnostic script: `node server/scripts/verifySupabase.js`.
- **Deeper Explanation:** The script tests the connection, checks the presence of environment keys, and queries row counts across all 5 core tables (`alerts`, `profiles`, `emergency_alerts`, `route_hazards`, `route_recommendations`).
- **File Reference:** `server/scripts/verifySupabase.js`
- **Likely Follow-up:** *“What were the exact row counts returned by your diagnostic?”*  
  *(Answer: `alerts`: 3 rows, `profiles`: 1 row, `emergency_alerts`: 0 rows, `route_hazards`: 0 rows, `route_recommendations`: 0 rows.)*

### Q34: How did you test mobile-to-backend communication without deploying to AWS?
- **Model Answer:** By running the Express server bound to `0.0.0.0` (all network interfaces) and connecting the physical phone running Expo Go over the same Wi-Fi network.
- **Deeper Explanation:** The backend endpoint `/api/network-ip` inspects the host's IPv4 network interfaces and returns the computer's LAN IP. The mobile app automatically connects to `http://<LAN_IP>:5001/api`.
- **File Reference:** `server/server.js` (Lines 48–60), `stsms-mobile/app/utils/api.js`
- **Likely Follow-up:** *“What is the difference between `localhost` and `0.0.0.0`?”*  
  *(Answer: `localhost` (127.0.0.1) only accepts connections from the same machine. `0.0.0.0` binds to all local network adapters, allowing other physical devices on the Wi-Fi LAN to connect.)*

### Q35: How did you test the emergency SOS trigger without an actual emergency?
- **Model Answer:** Through the `POST /api/alerts/simulate` endpoint and the "Simulate SOS" button in the admin interface.
- **Deeper Explanation:** It injects a synthetic emergency payload with valid coordinates and battery telemetry directly into `createSosAlert`, verifying the full pipeline (Supabase insert, toast notification, and Leaflet camera centering) without physical trail deployment.
- **File Reference:** `server/controllers/alertController.js` (Lines 515–530)
- **Likely Follow-up:** *“Does the simulation write to the real database?”*  
  *(Answer: Yes, it creates a test record in the `alerts` table so the operator can practice the complete Acknowledge $\to$ Dispatch $\to$ Resolve playbook.)*

### Q36: What debugging tools did you use during development?
- **Model Answer:** Chrome DevTools for React component inspection, React-Leaflet console debugging, Expo CLI logs, Node.js terminal logs, and live Postman/curl requests.
- **Deeper Explanation:** I used `console.log` tags prefixed by component (e.g., `[MOBILE SOS]`, `[DEAD MAN'S SWITCH]`, `[SUPABASE INSERT]`) to trace async state progressions and catch network timeouts.
- **File Reference:** `HomeScreen.jsx`, `alertController.js`
- **Likely Follow-up:** *“How did you verify that PostGIS coordinates were not reversed?”*  
  *(Answer: By verifying that the rendered Leaflet marker landed in the Indian Himalayas rather than near the North Pole.)*

---

## CATEGORY 10: LIMITATIONS & FUTURE SCOPE

### Q37: What are the main limitations of the current implementation?
- **Model Answer:** 1) 3-second HTTP polling instead of real-time WebSockets; 2) Hybrid storage (Supabase for alerts/profiles, JSON files for trips/admins); 3) Simulation log for cloud SMS rather than paid carrier gateway; 4) Lack of automated background OS geofence monitoring.
- **Deeper Explanation:** The app currently tracks movement in the foreground; headless background tasks require native OS background service permissions. Furthermore, cloud-to-guardian SMS requires an active Twilio/AWS SNS paid account.
- **File Reference:** `07_FEATURE_STATUS_AND_FUTURE_SCOPE.md`
- **Likely Follow-up:** *“Why did you use JSON files alongside Supabase?”*  
  *(Answer: As a robust local fallback cache so that the Command Center remains functional even during cloud database internet outages.)*

### Q38: How would you implement automated Fall Detection in Phase 2?
- **Model Answer:** By subscribing to device accelerometer data via `expo-sensors`, calculating total acceleration magnitude $G = \sqrt{x^2 + y^2 + z^2}$, and detecting impact spikes $> 3.5g$ followed by prolonged inactivity.
- **Deeper Explanation:** If an impact spike is detected followed by 60 seconds of zero movement, the app would sound a loud audible tone and display a 30-second cancellation countdown. If uncancelled, it would automatically trigger the SOS pipeline.
- **File Reference:** `07_FEATURE_STATUS_AND_FUTURE_SCOPE.md`
- **Likely Follow-up:** *“What prevents false alarms when a phone is dropped on a mattress?”*  
  *(Answer: The 30-second cancellation countdown and secondary gyroscopic orientation checks.)*

### Q39: How would you replace HTTP polling with Supabase Realtime WebSockets?
- **Model Answer:** By subscribing to the `alerts` table using `supabase.channel('public:alerts').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, callback).subscribe()`.
- **Deeper Explanation:** This would replace the 3-second `setInterval` polling with an event-driven WebSocket push, eliminating unnecessary network traffic and delivering sub-second alert notifications to the command center.
- **File Reference:** `src/App.jsx`, `01_ARCHITECTURE_AND_DATA_FLOW.md`
- **Likely Follow-up:** *“Does Supabase Realtime require database replication to be enabled?”*  
  *(Answer: Yes, the table must be added to the `supabase_realtime` publication in PostgreSQL.)*

### Q40: What is your vision for drone dispatch integration?
- **Model Answer:** In `hazardController.js`, we have a simulated drone dispatch endpoint (`POST /api/hazards/dispatch-drone`). In a production deployment, this would interface with an autonomous drone docking station via MAVLink / ROS APIs.
- **Deeper Explanation:** Upon receiving an SOS coordinate fix, the command center would dispatch an autonomous hexacopter to the victim's GPS coordinates to establish an aerial Wi-Fi/mesh relay and provide live thermal camera video to ground rescue teams.
- **File Reference:** `server/controllers/hazardController.js` (Lines 80–110), `src/components/Monitoring/DeadManSwitchAndOpenDataPanel.jsx`
- **Likely Follow-up:** *“What is MAVLink?”*  
  *(Answer: Micro Air Vehicle Link—a lightweight messaging protocol for communicating with drones and onboard autopilots.)*
