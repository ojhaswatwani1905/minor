# 02 — CODEBASE MAP AND TECHNOLOGY STACK

> **Project Name:** Smart Tourist Safety Monitoring System (STSMS)  
> **Repository Path:** `/Users/ojhas/Downloads/stsms-admin`  
> **Mobile Repository Path:** `/Users/ojhas/Downloads/stsms-admin/stsms-mobile`

---

## 1. Verified Technology Stack Table

All versions below have been verified directly from `package.json` in root and `stsms-mobile/package.json`:

| Layer | Technology | Actual Version | Purpose & Rationale | File Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Runtime** | Node.js | v20+ / ES Modules | High-performance asynchronous non-blocking event loop ideal for concurrent telemetry pings. | `server/server.js` |
| **Backend Framework**| Express.js | `4.18.3` | Minimalist routing framework for handling RESTful endpoints and middleware. | `server/package.json` |
| **Cloud Database** | Supabase Cloud | Hosted PostgreSQL | Managed PostgreSQL engine with enterprise reliability, row mappers, and cloud backups. | `server/database/supabase.js` |
| **Spatial Engine** | PostGIS | `postgis` extension | Spatial indexing (`GIST`) and native spherical geographic coordinate math (`GEOGRAPHY(POINT, 4326)`). | `server/database/schema.sql` |
| **DB Client** | `@supabase/supabase-js` | `2.118.0` | Official client SDK for executing queries, updates, and spatial inserts. | `server/database/supabase.js` |
| **Admin Web App** | React | `18.2.0` | Component-driven UI framework for the real-time Emergency Response Command Center. | `package.json` |
| **Build Tool** | Vite | `5.4.14` | High-speed ESM bundler with hot module replacement and `/api` reverse proxying. | `vite.config.js` |
| **Geospatial UI** | Leaflet & React-Leaflet | `1.9.4` & `4.2.1` | Lightweight, open-source mapping engine utilizing OpenStreetMap tiles without costly Google Maps billing. | `src/components/Monitoring/LiveMap.jsx` |
| **Mobile Runtime** | React Native / Expo | RN `0.88.0` / Expo `58.0.0` | Cross-platform native mobile runtime allowing rapid sensor integration on Android and iOS. | `stsms-mobile/package.json` |
| **Hardware GPS** | `expo-location` | `~58.0.19` | Direct access to native GNSS hardware chip for latitude, longitude, speed, and accuracy. | `stsms-mobile/app/screens/HomeScreen.jsx` |
| **Hardware Battery**| `expo-battery` | `~58.0.3` | Access to device power manager for battery percentage and charging state. | `stsms-mobile/app/hooks/useLocation.js` |
| **Auth & Security** | `jsonwebtoken` & `bcryptjs` | `9.0.2` & `2.4.3` | Cryptographic password hashing (salt rounds = 10) and stateless Bearer token issuance. | `server/controllers/authController.js` |
| **Visual Charts** | Chart.js & react-chartjs-2 | `4.4.1` & `5.2.0` | Renders rescue response times, monthly user registrations, and incident trends. | `src/components/Charts/` |
| **Icons & Alerts** | Lucide React & React-Toastify| `0.344.0` & `10.0.4` | Modern vector iconography and real-time pop-up notification toasts. | `src/App.jsx` |

---

## 2. Directory Tree Map

```
stsms-admin/
├── .env                              # Environment configuration (secrets redacted)
├── index.html                        # Web app entry point
├── package.json                      # Web & server dependencies
├── vite.config.js                    # Vite bundler configuration & proxy definition
│
├── server/                           # Backend Node.js Express Application (Port 5001)
│   ├── server.js                     # Server entry point, middleware, routes, daemons
│   ├── controllers/                  # Route controller implementations (business logic)
│   │   ├── alertController.js        # SOS creation, status updates, guardian notifications
│   │   ├── authController.js         # Admin/tourist authentication, bcrypt login, JWT sign
│   │   ├── dashboardController.js    # Metric aggregations for command center cards
│   │   ├── hazardController.js       # 30-day Trust Decay score, community hazards
│   │   ├── monitoringController.js   # Live tourist locations, GPS parsing, history
│   │   ├── notificationController.js # Command center notification state management
│   │   ├── profileController.js      # Operator profile management & password reset
│   │   ├── reportController.js       # Incident reports & SAR dispatch logs
│   │   ├── settingController.js      # System configuration & JSON database backup
│   │   ├── tripController.js         # Expedition lifecycle, safe check-in, deadline extensions
│   │   └── userController.js         # Tourist registry management
│   ├── database/                     # Database connectivity and schemas
│   │   ├── supabase.js               # Supabase client instantiation & row mappers
│   │   ├── schema.sql                # PostGIS extension & spatial table DDL
│   │   └── alerts_schema.sql         # Supabase PostgreSQL alerts table migration
│   ├── json/                         # Local storage & cache layer
│   │   ├── admins.json               # Operator credentials and profiles
│   │   ├── alerts.json               # Local alerts archive
│   │   ├── hazards.json              # Terrain danger zones and weather layers
│   │   ├── openDataPois.json         # Seeded Open Data POIs (police, hospitals)
│   │   ├── trips.json                # Active expeditions and check-in deadlines
│   │   └── users.json                # Registered tourists and last known telemetry
│   ├── middlewares/
│   │   ├── authMiddleware.js         # JWT verification middleware (protect)
│   │   └── errorMiddleware.js        # Centralized HTTP error handler
│   ├── routes/                       # Express router definitions (11 modules)
│   ├── scripts/
│   │   └── verifySupabase.js         # Live Supabase connection & table inspection script
│   ├── services/
│   │   ├── deadManSwitchService.js   # 15s automated check-in deadline monitor daemon
│   │   └── openDataService.js        # Open Data integration & POI merger
│   └── utils/
│       └── jsonDb.js                 # Safe JSON read/write file utilities
│
├── src/                              # Admin Command Center Web Application (Port 3009)
│   ├── App.jsx                       # Root router, global 3s notification polling loop
│   ├── main.jsx                      # React 18 DOM mount
│   ├── index.css                     # Tailwind CSS & custom Leaflet styling
│   ├── components/                   # Reusable UI component modules
│   │   ├── Cards/StatCard.jsx        # Metric summary card
│   │   ├── Charts/                   # Chart.js visualization components
│   │   ├── Common/                   # Modal, Loader, StatusBadge, Pagination
│   │   ├── Emergency/                # AlertCard, AlertDetailModal, RescuePlaybookModal
│   │   ├── Map/QuickMapPreview.jsx   # Dashboard interactive mini-radar map
│   │   ├── Monitoring/               # LiveMap.jsx, TouristTelemetryPanel.jsx
│   │   ├── Navbar.jsx                # Command header with system status indicators
│   │   ├── Sidebar.jsx               # Navigation bar
│   │   ├── Trips/                    # TripTable, TripFormModal, TripDetailModal
│   │   └── Users/                    # UserTable, UserFormModal, UserDetailModal
│   ├── context/
│   │   ├── AuthContext.jsx           # Client-side JWT session state provider
│   │   └── ThemeContext.jsx          # Light / Dark mode state provider
│   ├── pages/                        # View route containers
│   │   ├── DashboardPage.jsx         # Command overview, radar, incident stats
│   │   ├── EmergencyPage.jsx         # Emergency response center, triage, playbook
│   │   ├── MonitoringPage.jsx        # Fullscreen geospatial map with telemetry
│   │   ├── TripsPage.jsx             # Active expeditions management
│   │   ├── UsersPage.jsx             # Tourist registry & safety pass records
│   │   └── LoginPage.jsx             # Administrator login view
│   ├── services/                     # Frontend API client abstraction layer
│   └── utils/api.js                  # Fetch wrapper with Bearer token injector
│
└── stsms-mobile/                     # Tourist Mobile Application (Expo SDK 58 - Port 8081)
    ├── App.js                        # Mobile root entry wrapper
    ├── app.json                      # Expo application metadata & configuration
    ├── package.json                  # Mobile dependencies (expo-location, expo-battery)
    └── app/
        ├── App.jsx                   # Navigation container & auth provider
        ├── hooks/
        │   └── useLocation.js        # Adaptive 100m displacement filter & battery hook
        ├── screens/
        │   ├── HomeScreen.jsx        # 1-Tap SOS Button, hardware telemetry, server setup
        │   ├── LiveMapScreen.jsx     # Mobile terrain map view
        │   ├── LoginScreen.jsx       # Tourist login view
        │   ├── RegisterScreen.jsx    # Tourist expedition onboarding
        │   └── TripDetailScreen.jsx  # Expedition details & safe check-in action
        ├── services/
        │   ├── emergencyService.js   # SOS API dispatch & zero-network native SMS fallback
        │   ├── locationService.js    # Location update API client
        │   └── offlineStorage.js     # SQLite/AsyncStorage buffer, 7-day purge, backoff
        └── utils/
            ├── api.js                # Mobile dynamic LAN IP auto-discovery & fetch client
            └── storage.js            # Platform-aware persistent storage abstraction
```

---

## 3. Key Source Files & Their Architectural Responsibilities

### 1. `server/controllers/alertController.js`
- **Responsibility:** Core emergency engine. Receives manual SOS requests, maps parameters to the Supabase PostgreSQL schema, manages race condition constraints, updates tourist telemetry in local storage, writes audit events to `alert_events`, and processes status changes.
- **Key Functions:**
  - `createSosAlert(req, res, next)`: Validates GPS coordinates and battery, checks for active trip alerts, inserts or updates the `alerts` table.
  - `updateAlertStatus(req, res, next)`: Modifies alert status (`open`, `acknowledged`, `dispatched`, `resolved`, `false_alarm`) and records operator audit trails.
  - `notifyGuardian(req, res, next)`: Queries registered phone numbers from Supabase `profiles` and triggers SMS logging.

### 2. `server/database/supabase.js`
- **Responsibility:** Cloud database connectivity and spatial conversion layer.
- **Key Functions:**
  - `getSupabaseClient()`: Instantiates the Supabase client using `SUPABASE_SERVICE_ROLE_KEY`.
  - `mapAlertToDb(payload, defaultUserId, defaultTripId)`: Formats incoming JSON into PostgreSQL column names, converting coordinates to PostGIS `POINT(lng lat)`.
  - `mapAlertFromDb(row)`: Translates database rows into the standard JSON response consumed by the frontend and mobile apps.
  - `verifySupabaseConnection()`: Diagnostic method to test connection and query health.

### 3. `server/services/deadManSwitchService.js`
- **Responsibility:** Automated expedition safety monitor.
- **Key Functions:**
  - `startDeadManSwitchWorker()`: Starts a 15-second background interval loop.
  - `checkDeadManSwitch()`: Inspects active expeditions in `trips.json`. If `now > expectedArrivalDeadline` and the traveler has not checked in, it automatically creates an emergency alert (`alt_dms_*`) with `CRITICAL` severity and dispatches SAR notifications.

### 4. `src/components/Monitoring/LiveMap.jsx`
- **Responsibility:** Interactive command center map.
- **Key Features:**
  - `MapCameraController`: React hook controller that smoothly executes `map.flyTo([lat, lng], 13)` upon receiving active emergency coordinates.
  - `createEmergencyMarkerIcon(name)`: Custom Leaflet `divIcon` rendering a red SVG pulsing beacon with a floating nameplate.
  - Renders dynamic search grid circles (`Circle`, radius = 1800m) and avalanche/flood danger zones (`Polygon`).

### 5. `stsms-mobile/app/screens/HomeScreen.jsx`
- **Responsibility:** Primary mobile interface for the tourist.
- **Key Features:**
  - Large, high-visibility 1-Tap SOS Button.
  - Fetches real hardware coordinates via `expo-location` and battery percentage via `expo-battery`.
  - Enforces `submitLockRef` to prevent double-taps.
  - Displays dynamic server connectivity status and provides a manual IP configuration modal for campus Wi-Fi pairing.

### 6. `stsms-mobile/app/hooks/useLocation.js`
- **Responsibility:** Battery-efficient location tracking engine.
- **Key Features:**
  - Implements the **Adaptive 100-Meter Filter** using the mathematical Haversine formula (`getDistanceMeters`).
  - Suppresses GPS network pings if the user has moved $< 100$ meters and speed is $\le 5\text{ km/h}$, extending smartphone endurance to 36+ hours.
  - Interacts with `offlineStorage.js` to buffer coordinates locally when offline.
