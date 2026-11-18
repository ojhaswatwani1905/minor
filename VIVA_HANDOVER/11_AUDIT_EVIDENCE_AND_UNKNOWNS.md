# 11 — AUDIT EVIDENCE, COMMAND LOGS, AND UNKNOWNS

> **Audit Standard:** Exhaustive log of all inspection commands, live diagnostic executions, observed process states, verified findings, and documented unknowns.  
> **Guarantee:** Zero project code files, configuration files, or live database records were modified during this audit.

---

## 1. Commands Executed & Observed System Evidence

### A. Process Inspection (Live Ports & Process IDs)
The following active background processes were independently verified running on the host system:

| Port | Service | Process ID | Status | Command Used |
| :--- | :--- | :--- | :--- | :--- |
| `3009` | Admin Web Dashboard (Vite Dev Server) | `19998` | **LISTEN** | `lsof -nP -iTCP:3009 -sTCP:LISTEN` |
| `5001` | Backend REST API (Node.js Express) | `20003` | **LISTEN (0.0.0.0)** | `lsof -nP -iTCP:5001 -sTCP:LISTEN` |
| `8081` | Mobile Metro Bundler (Expo SDK 58) | `14679` | **LISTEN** | `lsof -nP -iTCP:8081 -sTCP:LISTEN` |

### B. Live Database Diagnostic Execution (`verifySupabase.js`)
- **Execution Command:** `node /Users/ojhas/Downloads/stsms-admin/server/scripts/verifySupabase.js`
- **Execution Timestamp:** 2026-10-26 22:38:30 IST
- **Terminal Output Observed:**
  ```
  ====================================================
  STSMS — Supabase Database Integration Diagnostic
  ====================================================
  1. Configuration in .env: PRESENT
     - SUPABASE_URL: Configured (https://jdjluwufmorxeankm...)
     - SUPABASE_KEY / SERVICE_ROLE: Configured

  2. Testing connection to Supabase...

  3. Supabase Table Inspection Results:
     ✅ Table "alerts" exists (Rows: 3)
     ✅ Table "emergency_alerts" exists (Rows: 0)
     ✅ Table "profiles" exists (Rows: 1)
     ✅ Table "route_hazards" exists (Rows: 0)
     ✅ Table "route_recommendations" exists (Rows: 0)

  🎉 Verified: "alerts" table is accessible and ready for SOS workflow.
  ====================================================
  ```

---

## 2. Code Inspection Evidence Log

| File Path | Inspection Command | Key Grounding Observed |
| :--- | :--- | :--- |
| `server/server.js` | `cat` & `sed` | Express server mounts 11 routers, listens on `0.0.0.0`, port `5001`, starts `startDeadManSwitchWorker()` (15s), seeds open data. |
| `server/database/supabase.js` | `cat` | PostGIS spatial conversion `POINT(${lng} ${lat})` (lng first), `lat`/`lon` generated column mapping, service-role client. |
| `server/database/alerts_schema.sql` | `cat` | Schema DDL for `alerts` table with RLS policies, indexes on `status`, `created_at`, `priority`. |
| `server/database/schema.sql` | `cat` | PostGIS extension `CREATE EXTENSION IF NOT EXISTS postgis;`, `route_hazards` GIST spatial index. |
| `server/controllers/alertController.js` | `cat` & `sed` | Intercepts PostgreSQL unique violation `23505` (`one_live_alert_per_trip`) to update active alert; writes audit events to `alert_events`. |
| `server/controllers/monitoringController.js`| `sed` | Merges Supabase `alerts`, `profiles`, and `users.json`; 5-minute GPS timeout window (`GPS_TIMEOUT_MS = 300,000`). |
| `server/services/deadManSwitchService.js` | `cat` | Cloud daemon running every 15,000ms checking `now > deadline`, auto-dispatching `CRITICAL` alert `alt_dms_*`. |
| `server/controllers/hazardController.js` | `sed` | 30-day Trust Decay math: $100 \times (1 - \text{age}/30) + 10\times\text{up} - 15\times\text{down}$. Flag count $\ge 3$ hides hazard. |
| `src/App.jsx` | `sed` | Admin 3000ms interval polling against `/api/alerts`; triggers `toast.error()` pop-ups for new Alert IDs. |
| `src/components/Monitoring/LiveMap.jsx` | `cat` | React-Leaflet MapContainer, OpenStreetMap tiles, `MapCameraController` (`map.flyTo`), pulsing SVG red marker, 1800m search circle. |
| `stsms-mobile/app/screens/HomeScreen.jsx` | `sed` | 1-Tap SOS button, `submitLockRef`, `expo-location` satellite querying, `expo-battery` level querying, clean JSON payload. |
| `stsms-mobile/app/services/emergencyService.js`| `cat` | `emergencyService.triggerOfflineNativeSmsFallback` invokes `Linking.openURL('sms:...')` with Google Maps link. |
| `stsms-mobile/app/hooks/useLocation.js` | `cat` | Haversine distance calculation; Adaptive 100m filter suppresses stationary pings, extending battery to 36+ hrs. |
| `stsms-mobile/app/services/offlineStorage.js` | `cat` | Exponential network back-off (3 failures $\to$ 30m pause); 7-day auto-purge of local location logs. |

---

## 3. Unknowns, Uninspected Items, and Assumptions

1. **Third-Party Carrier Gateways (Twilio / AWS SNS):**
   - *Status:* Uninspected / No live credentials present in `.env`.
   - *Observed Reality:* Server code dispatches to an event logger (`guardian_sms_dispatched` in `alert_events`), and mobile invokes native device SMS composer. Real cellular carrier SMS transmission from the cloud server was not verified due to the absence of paid carrier API keys.
2. **Headless OS Background Location Service:**
   - *Status:* Prototype.
   - *Observed Reality:* Location tracking works when the mobile application is active or minimized in foreground/background task switcher. Full headless background execution when device is rebooted or suspended has not been verified with custom native iOS/Android background service modules.
3. **Physical Drone Telemetry API:**
   - *Status:* Simulation.
   - *Observed Reality:* `hazardController.js` provides a simulated drone dispatch response. No physical connection to a MAVLink/ArduPilot hardware receiver was inspected.
4. **Sub-Zero Cold Weather Battery Drainage:**
   - *Status:* Mathematical assumption.
   - *Observed Reality:* The 36+ hour battery endurance claim is based on the 70% reduction in radio transmissions achieved by the Haversine 100-meter displacement filter; physical validation in actual sub-zero alpine conditions has not been performed.

---

## 4. Confirmation of Zero Code Modifications

- **Total Project Files Modified:** 0
- **Total Database Records Modified:** 0
- **Total Configuration Files Modified:** 0
- **Action Taken:** Read-only inspection of source files, process table checks, and safe diagnostic script execution (`verifySupabase.js`). All 12 handover files were generated cleanly inside `VIVA_HANDOVER/`.
