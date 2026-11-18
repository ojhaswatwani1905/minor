# 03 — COMPLETE API DOCUMENTATION

> **Base URL:** `http://localhost:5001/api` (or `http://<LAN_IP>:5001/api`)  
> **Server Entry:** `server/server.js`  
> **Authentication Standard:** Bearer JSON Web Token (JWT) passed in `Authorization: Bearer <token>` header  
> **Public Endpoints:** Mobile SOS distress beacon, background location pings, trip check-ins, LAN IP discovery, health check  
> **Protected Endpoints:** All administrative management and dashboard operations

---

## 1. Complete API Route Catalog

The following 33 endpoints represent all verified routes mounted across the 11 Express router modules:

### Module 1: Emergency Alerts (`/api/alerts`) — `alertRoutes.js`

| Method | Path | Auth Required? | Purpose | Request Body / Query | Success Response Structure | Database / Storage Accessed | Callers |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/alerts/sos` | **Public** | Dispatches real tourist SOS emergency alert with GNSS telemetry | `{ userId, userName, type, priority, message, location: {lat, lng}, batteryLevel, tripId }` | `201 Created` / `200 OK` (if updated)<br/>`{ success: true, message, alert: {...} }` | Supabase `alerts`, `alert_events`, `users.json` | Mobile App (`HomeScreen.jsx`, `emergencyService.js`) |
| `POST` | `/api/alerts` | **Public** | Alias for `/api/alerts/sos` | Same as `/api/alerts/sos` | Same as `/api/alerts/sos` | Supabase `alerts`, `alert_events` | Fallback client callers |
| `POST` | `/api/alerts/simulate` | **Public** | Triggers simulated SOS distress alert for operator demonstration | `{ userName, message, batteryLevel }` (optional) | `201 Created`<br/>`{ success: true, alert: {...} }` | Supabase `alerts`, `alert_events`, `users.json` | Command Center Simulator button |
| `GET` | `/api/alerts` | **Protected (JWT)** | Retrieves all emergency alerts with search, status, and priority filters | Query: `?search=&status=&priority=` | `200 OK`<br/>`{ success: true, count, alerts: [...] }` | Supabase `alerts` (with `profiles`, `trips` joins) | Admin Web (`App.jsx` 3s poller, `EmergencyPage.jsx`) |
| `GET` | `/api/alerts/:id` | **Protected (JWT)** | Fetches single emergency alert by ID with audit logs | Param: `:id` (UUID / String) | `200 OK`<br/>`{ success: true, alert: {...} }` | Supabase `alerts`, `alert_events` | Admin Web (`AlertDetailModal.jsx`) |
| `PUT` | `/api/alerts/:id/status`| **Protected (JWT)** | Updates alert status (`Acknowledged`, `Active Rescue`, `Resolved`) | Param: `:id`<br/>Body: `{ status: string, note: string }` | `200 OK`<br/>`{ success: true, message, alert: {...} }` | Supabase `alerts`, `alert_events` | Admin Web (`AlertDetailModal.jsx`, `RescuePlaybookModal.jsx`) |
| `POST` | `/api/alerts/notify-guardian`| **Protected (JWT)** | Triggers automated SMS alert to registered guardian | Body: `{ alertId: string }` | `200 OK`<br/>`{ success: true, message, alert: {...} }` | Supabase `alerts`, `profiles`, `alert_events` | Admin Web (`AlertDetailModal.jsx`) |

---

### Module 2: Live Monitoring & Telemetry (`/api/monitoring`) — `monitoringRoutes.js`

| Method | Path | Auth Required? | Purpose | Request Body / Query | Success Response Structure | Database / Storage Accessed | Callers |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/monitoring/location-update` | **Public** | Ingests background GPS coordinates & battery level from mobile devices | `{ userId, email, lat, lng, locationName, speedKmH, batteryLevel, networkSignal }` | `200 OK`<br/>`{ success: true, message }` | `users.json` | Mobile App (`useLocation.js`, `locationService.js`) |
| `GET` | `/api/monitoring/live-locations` | **Protected (JWT)** | Merges Supabase alerts, profiles, and cached telemetry for map radar | None | `200 OK`<br/>`{ success: true, count, locations: [...] }` | Supabase `alerts`, `profiles`, `users.json`, `trips.json` | Admin Web (`LiveMap.jsx`, `QuickMapPreview.jsx`) |
| `GET` | `/api/monitoring/history/:id` | **Protected (JWT)** | Retrieves GPS breadcrumb path history for a given tourist | Param: `:id` | `200 OK`<br/>`{ success: true, history: [...] }` | `users.json` | Admin Web (`TouristTelemetryPanel.jsx`) |

---

### Module 3: Expedition & Check-In Management (`/api/trips`) — `tripRoutes.js`

| Method | Path | Auth Required? | Purpose | Request Body / Query | Success Response Structure | Database / Storage Accessed | Callers |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/trips` | **Public** | Creates new expedition with destination, route, and check-in deadline | `{ userId, userName, destination, route, expectedArrivalDeadline, guardianPhone, boundaryRadiusKm }` | `201 Created`<br/>`{ success: true, trip: {...} }` | `trips.json` | Mobile App (`CreateTripScreen.jsx`) & Admin Web |
| `POST` | `/api/trips/:id/checkin` | **Public** | Confirms safe arrival, resetting Dead Man's Switch timer | Param: `:id` | `200 OK`<br/>`{ success: true, message, trip: {...} }` | `trips.json` | Mobile App (`TripDetailScreen.jsx`) |
| `POST` | `/api/trips/:id/extend-deadline` | **Public** | Extends expected arrival deadline when delayed on trail | Param: `:id`<br/>Body: `{ additionalMinutes: int, newDeadline: ISOString }` | `200 OK`<br/>`{ success: true, message, trip: {...} }` | `trips.json` | Mobile App (`TripDetailScreen.jsx`) |
| `GET` | `/api/trips` | **Protected (JWT)** | Lists all expeditions with search, status, and geofence filters | Query: `?search=&status=&geofence=` | `200 OK`<br/>`{ success: true, count, trips: [...] }` | `trips.json` | Admin Web (`TripsPage.jsx`) |
| `GET` | `/api/trips/:id` | **Protected (JWT)** | Retrieves trip details with tourist profile and associated alerts | Param: `:id` | `200 OK`<br/>`{ success: true, trip: {...} }` | `trips.json`, `users.json`, `alerts.json` | Admin Web (`TripDetailModal.jsx`) |
| `PUT` | `/api/trips/:id` | **Protected (JWT)** | Updates expedition status, route, or geofence boundary radius | Param: `:id`<br/>Body: `{ status, boundaryRadiusKm, ... }` | `200 OK`<br/>`{ success: true, trip: {...} }` | `trips.json` | Admin Web (`TripFormModal.jsx`) |
| `DELETE`| `/api/trips/:id` | **Protected (JWT)** | Deletes an expedition record | Param: `:id` | `200 OK`<br/>`{ success: true, message }` | `trips.json` | Admin Web (`TripsPage.jsx`) |
| `POST` | `/api/trips/:id/checkpoints`| **Protected (JWT)** | Appends a physical checkpoint verification to the trip | Param: `:id`<br/>Body: `{ name: string, status: string }` | `200 OK`<br/>`{ success: true, trip: {...} }` | `trips.json` | Admin Web & Mobile |

---

### Module 4: Authentication & Session (`/api/auth`) — `authRoutes.js`

| Method | Path | Auth Required? | Purpose | Request Body / Query | Success Response Structure | Database / Storage Accessed | Callers |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | **Public** | Authenticates admin or tourist via email/password, issues 7-day JWT | `{ email, password }` | `200 OK`<br/>`{ success: true, token, admin: {...} }` | `admins.json` | Admin Web (`LoginPage.jsx`) & Mobile (`LoginScreen.jsx`) |
| `POST` | `/api/auth/register`| **Public** | Registers new account, generates bcrypt hash, syncs to `users.json` | `{ name, email, password, phone, guardianPhone, department, role }` | `201 Created`<br/>`{ success: true, token, user: {...} }` | `admins.json`, `users.json` | Mobile App (`RegisterScreen.jsx`) & Admin Web |
| `POST` | `/api/auth/forgot-password`| **Public** | Password reset trigger (returns generic success to prevent email enumeration)| `{ email }` | `200 OK`<br/>`{ success: true, message }` | `admins.json` | Admin Web (`ForgotPasswordPage.jsx`) |
| `GET` | `/api/auth/me` | **Protected (JWT)** | Returns active authenticated user identity from token payload | None | `200 OK`<br/>`{ success: true, admin: {...} }` | `admins.json` | Admin Web (`AuthContext.jsx`) |

---

### Module 5: Command Center Dashboard (`/api/dashboard`) — `dashboardRoutes.js`

| Method | Path | Auth Required? | Purpose | Request Body / Query | Success Response Structure | Database / Storage Accessed | Callers |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | **Protected (JWT)** | Computes high-level counts: active tourists, open SOS, resolved alerts | None | `200 OK`<br/>`{ success: true, stats: { totalUsers, activeTourists, openAlerts, resolvedAlerts, ... } }` | Supabase `alerts`, `users.json`, `trips.json` | Admin Web (`DashboardPage.jsx`) |
| `GET` | `/api/dashboard/charts` | **Protected (JWT)** | Aggregates monthly user growth, emergency response stats, and trip types | None | `200 OK`<br/>`{ success: true, charts: {...} }` | Supabase `alerts`, `trips.json` | Admin Web (`DashboardPage.jsx`) |
| `GET` | `/api/dashboard/recent-activity`| **Protected (JWT)** | Returns latest 10 emergency actions and dispatch logs | None | `200 OK`<br/>`{ success: true, activities: [...] }` | Supabase `alerts`, `alert_events` | Admin Web (`DashboardPage.jsx`) |

---

### Module 6: Route Hazards & Community Intelligence (`/api/hazards`) — `hazardRoutes.js`

| Method | Path | Auth Required? | Purpose | Request Body / Query | Success Response Structure | Database / Storage Accessed | Callers |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/hazards/overview` | **Public** | Returns weather layers, danger polygons, drones, and trust-decayed hazards | None | `200 OK`<br/>`{ success: true, weather, hazardZones, communityHazards: [...] }` | `hazards.json` | Admin Web & Mobile (`CommunityHazardsScreen.jsx`) |
| `POST` | `/api/hazards/community`| **Public** | Submits community hazard report (avalanche, landslide, stray animals) | `{ title, description, category, lat, lng, severity }` | `201 Created`<br/>`{ success: true, hazard: {...} }` | `hazards.json` | Mobile App (`CommunityHazardsScreen.jsx`) |
| `POST` | `/api/hazards/community/:id/vote`| **Public** | Upvotes or downvotes community hazard, altering trust score | Param: `:id`<br/>Body: `{ type: 'UP' | 'DOWN' }` | `200 OK`<br/>`{ success: true, trustScore }` | `hazards.json` | Mobile App (`CommunityHazardsScreen.jsx`) |
| `POST` | `/api/hazards/community/:id/flag`| **Public** | Flags inaccurate report (auto-hides when flag count $\ge 3$) | Param: `:id` | `200 OK`<br/>`{ success: true, message }` | `hazards.json` | Mobile App (`CommunityHazardsScreen.jsx`) |
| `POST` | `/api/hazards/dispatch-drone`| **Public** | Simulates aerial SAR surveillance drone launch to emergency site | `{ hazardId, droneId }` | `200 OK`<br/>`{ success: true, drone: {...} }` | `hazards.json` | Admin Web (`DeadManSwitchAndOpenDataPanel.jsx`) |
| `POST` | `/api/hazards/broadcast` | **Public** | Dispatches geofenced emergency broadcast message to tourists | `{ message, radiusKm, lat, lng }` | `200 OK`<br/>`{ success: true, recipientCount }` | `hazards.json` | Admin Web (`GeofenceBroadcastModal.jsx`) |

---

### Module 7: Tourist Registry (`/api/users`) — `userRoutes.js`

| Method | Path | Auth Required? | Purpose | Request Body / Query | Success Response Structure | Database / Storage Accessed | Callers |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | **Protected (JWT)** | Retrieves registered tourist registry with status, phone, and last ping | Query: `?search=&status=` | `200 OK`<br/>`{ success: true, count, users: [...] }` | `users.json` | Admin Web (`UsersPage.jsx`) |
| `POST` | `/api/users` | **Protected (JWT)** | Creates tourist profile with emergency contacts and safety pass | Body: `{ fullName, email, phone, emergencyContact, ... }` | `201 Created`<br/>`{ success: true, user: {...} }` | `users.json` | Admin Web (`UserFormModal.jsx`) |
| `GET` | `/api/users/:id` | **Protected (JWT)** | Retrieves single tourist profile with guardian contacts and active trips | Param: `:id` | `200 OK`<br/>`{ success: true, user: {...} }` | `users.json`, `trips.json` | Admin Web (`UserDetailModal.jsx`) |
| `PUT` | `/api/users/:id` | **Protected (JWT)** | Updates tourist status, medical notes, or emergency contacts | Param: `:id`<br/>Body: `{ status, phone, emergencyContact, ... }` | `200 OK`<br/>`{ success: true, user: {...} }` | `users.json` | Admin Web (`UserFormModal.jsx`) |
| `DELETE`| `/api/users/:id` | **Protected (JWT)** | Deletes tourist record from registry | Param: `:id` | `200 OK`<br/>`{ success: true, message }` | `users.json` | Admin Web (`UserTable.jsx`) |

---

### Module 8: Notifications, Reports, Settings, & Utilities

| Method | Path | Auth Required? | Purpose | Request Body / Query | Database / Storage Accessed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | **Protected (JWT)** | Fetches operator notification feed | None | `notifications.json` |
| `PUT` | `/api/notifications/mark-read` | **Protected (JWT)** | Marks all notifications as read | None | `notifications.json` |
| `DELETE`| `/api/notifications/clear` | **Protected (JWT)** | Clears notification feed | None | `notifications.json` |
| `GET` | `/api/reports` | **Protected (JWT)** | Returns incident and SAR response history | Query: `?type=&startDate=` | `reports.json` |
| `GET` | `/api/settings` | **Protected (JWT)** | Retrieves system thresholds (GPS timeout, dead man interval) | None | `settings.json` |
| `PUT` | `/api/settings` | **Protected (JWT)** | Updates system thresholds and alert sound parameters | Body: `{ gpsTimeoutMinutes, ... }` | `settings.json` |
| `GET` | `/api/settings/backup` | **Protected (JWT)** | Downloads complete JSON database archive backup | None | All JSON files |
| `GET` | `/api/health` | **Public** | Express health check endpoint | None | Memory status |
| `GET` | `/api/network-ip` | **Public** | Inspects host OS network interfaces and returns active IPv4 LAN address | None | Host `os.networkInterfaces()` |

---

## 2. Request & Response Lifecycle and Middleware Architecture

### Middleware Execution Order
Every incoming HTTP request traverses the following pipeline in `server/server.js`:
```
[Incoming Request]
       │
       ▼
1. cors({ origin: '*' }) ──────────────── Allows cross-origin requests from Vite (3009) & Expo (8081)
       │
       ▼
2. express.json({ limit: '10mb' }) ───── Parses JSON payloads; rejects malformed bodies with 400
       │
       ▼
3. express.urlencoded({ extended: true }) Parses URL-encoded parameters
       │
       ▼
4. Route Router Matching (e.g. /api/alerts)
       │
       ├─► (Public Route: /sos) ───────── Directly executes Controller Handler
       │
       └─► (Protected Route: /) ───────── Passes through authMiddleware.js (protect)
                 │
                 ├── Checks headers.authorization for 'Bearer <token>'
                 ├── Verifies token using jsonwebtoken.verify(token, JWT_SECRET)
                 ├── Sets req.admin = decoded payload
                 └── On Failure: Returns 401 Unauthorized ({ success: false, message: '...' })
       │
       ▼
5. Controller Business Logic ────────── Supabase CRUD / JSON CRUD
       │
       ▼
6. errorHandler Middleware ──────────── Catches unhandled exceptions, returns 500 JSON
```

---

## 3. Real Payload Contract Examples

### A. Manual SOS Distress Request (`POST /api/alerts/sos`)
```json
{
  "userId": "usr_1729900000000",
  "userName": "Shivam Ojha",
  "type": "MANUAL_SOS",
  "priority": "CRITICAL",
  "message": "🚨 MANUAL SOS triggered by Shivam Ojha! Immediate emergency SAR response required.",
  "location": {
    "lat": 30.3165,
    "lng": 78.0322,
    "name": "GPS Fix (Lat: 30.3165, Lng: 78.0322)"
  },
  "batteryLevel": 88,
  "networkStatus": "Online (LAN Wi-Fi)",
  "deviceInfo": {
    "platform": "ios",
    "osVersion": "18.1",
    "model": "iPhone 15 Pro"
  },
  "tripId": "trip_him_01",
  "tripInfo": "Expedition to Kedarnath Ridge",
  "timestamp": "2026-10-26T17:00:00.000Z"
}
```

### B. SOS Distress Response (`201 Created`)
```json
{
  "success": true,
  "message": "Emergency SOS Alert logged and broadcast to Command Center.",
  "alert": {
    "id": "e4b3c2a1-0000-4000-8000-abcdef123456",
    "userId": "usr_1729900000000",
    "userName": "Shivam Ojha",
    "tripId": "trip_him_01",
    "tripInfo": "Expedition to Kedarnath Ridge",
    "type": "MANUAL_SOS",
    "priority": "CRITICAL",
    "message": "🚨 MANUAL SOS triggered by Shivam Ojha! Immediate emergency SAR response required.",
    "location": {
      "lat": 30.3165,
      "lng": 78.0322,
      "name": "GPS Fix (30.3165, 78.0322)"
    },
    "batteryLevel": 88,
    "networkStatus": "Mobile App (Cellular/Wi-Fi)",
    "deviceInfo": {
      "source": "app"
    },
    "timestamp": "2026-10-26T17:00:01.120Z",
    "status": "Pending",
    "guardianNotified": false,
    "rescueNotes": []
  }
}
```
