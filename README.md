# Smart Tourist Safety Monitoring System (STSMS) — Admin Portal

> **B.Tech Minor Project** | Full Stack Admin Safety Command Portal

The **Smart Tourist Safety Monitoring System (STSMS)** is an emergency monitoring platform designed to improve the safety of travelers visiting remote, forest, mountain, wildlife, trekking, or disaster-prone areas.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, HTML5, CSS3, JavaScript ES6+, Tailwind CSS
- **Icons**: Lucide React
- **Maps**: Leaflet & OpenStreetMap (`react-leaflet`)
- **Charts**: Chart.js & `react-chartjs-2`
- **Notifications**: React Toastify
- **State Management**: React Context API (`AuthContext`, `ThemeContext`)
- **Backend**: Node.js & Express.js REST API Server
- **Database Engine**: File-based JSON Database Engine (`server/json/`), architected for seamless MongoDB integration
- **Security**: JWT (JSON Web Tokens) & `bcryptjs` password hashing

---

## 📂 Project Architecture

```text
stsms-admin/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
├── server/
│   ├── server.js               # Express API entry point (Port 5001)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── userController.js
│   │   ├── tripController.js
│   │   ├── monitoringController.js
│   │   ├── alertController.js
│   │   ├── reportController.js
│   │   ├── notificationController.js
│   │   └── settingController.js
│   ├── routes/                 # Express API Routes
│   ├── middlewares/            # JWT Auth & Central Error Handlers
│   ├── utils/                  # JSON Database Driver (jsonDb.js)
│   └── json/                   # JSON Mock DB (users, trips, alerts, admins, notifications)
└── src/
    ├── components/
    │   ├── Sidebar.jsx
    │   ├── Navbar.jsx
    │   ├── Cards/
    │   ├── Charts/
    │   ├── Map/
    │   ├── Users/
    │   ├── Trips/
    │   ├── Monitoring/
    │   ├── Emergency/
    │   └── Common/
    ├── context/
    │   ├── AuthContext.jsx
    │   └── ThemeContext.jsx
    ├── pages/                  # All 10 Module Views
    ├── services/               # Frontend API Services
    └── styles/
        └── globals.css         # Apple/Vercel Dark & Light Theme System
```

---

## 🚀 How to Run the Project

1. **Install Dependencies** (if not already installed):
   ```bash
   npm install
   ```

2. **Start Backend & Frontend Concurrently**:
   ```bash
   npm start
   ```
   - **Frontend Admin Portal**: `http://localhost:3009`
   - **Backend Express API**: `http://localhost:5001`

3. **Login Credentials**:
   - **Email**: `admin@stsms.gov`
   - **Password**: `Admin@123`

---

## 📡 API Endpoints Reference

### Authentication
- `POST /api/auth/login` — Admin login with JWT & bcrypt
- `POST /api/auth/register` — Register new admin account
- `POST /api/auth/forgot-password` — Password reset trigger
- `GET /api/auth/me` — Get current logged-in admin profile

### Dashboard & Analytics
- `GET /api/dashboard/stats` — Get 7 core metric stats
- `GET /api/dashboard/charts` — Get Chart.js datasets
- `GET /api/dashboard/recent-activity` — Recent alerts & system logs

### Tourist Users (`/users`)
- `GET /api/users` — List, search & filter tourists
- `POST /api/users` — Register new tourist
- `GET /api/users/:id` — Get tourist details with telemetry, guardians, & trip history
- `PUT /api/users/:id` — Update tourist profile & telemetry
- `DELETE /api/users/:id` — Delete tourist profile

### Expedition Trips (`/trips`)
- `GET /api/trips` — List & filter expedition trips
- `POST /api/trips` — Configure new trip with geofence radius
- `GET /api/trips/:id` — Fetch trip details with checkpost timeline
- `PUT /api/trips/:id` — Update trip settings
- `DELETE /api/trips/:id` — Delete trip record
- `POST /api/trips/:id/checkpoints` — Log checkpost ping to timeline

### Live Monitoring (`/monitoring`)
- `GET /api/monitoring/live-locations` — Live GPS coordinates, speed, & compass heading telemetry
- `GET /api/monitoring/history/:id` — Tourist movement breadcrumb timeline

### Emergency Commands (`/emergency`)
- `GET /api/alerts` — Fetch emergency incidents
- `GET /api/alerts/:id` — Fetch incident details & rescue logs
- `PUT /api/alerts/:id/status` — Update incident status & rescue notes
- `POST /api/alerts/notify-guardian` — Dispatch automated SMS to primary guardian
- `POST /api/alerts/simulate` — Create simulated test SOS alert

### Reports & Export (`/reports`)
- `GET /api/reports` — Generate reports with CSV & PDF printable export payloads

### Notifications (`/notifications`)
- `GET /api/notifications` — Fetch system alerts & guardian SMS logs
- `PUT /api/notifications/mark-read` — Mark notifications as read
- `DELETE /api/notifications/clear` — Clear notification history

### Settings & Backup (`/settings`)
- `GET /api/settings` — Get system configuration
- `PUT /api/settings` — Update preferences & siren sound alerts
- `GET /api/settings/backup` — Export full JSON database snapshot file (`stsms-backup.json`)

---

## 🗺️ Full-India Hazard & POI Data Pipeline (OSM + MoRTH)

The STSMS hazard ingestion pipeline provides nationwide spatial coverage across India combining OpenStreetMap (OSM), MoRTH Highway Blackspots, and Crowdsourced Community Intelligence:

### 1. OpenStreetMap (OSM) Full-India Pipeline
- **Extract & Filtering**: OSM coverage spans all of India via Geofabrik extracts + `osmium` / Overpass API filters, generating `server/data/osm/india-pois.geojson`.
- **Query-Time Route Buffer**: POIs and hazard-tagged nodes (`smoothness`, `lit`, `access`, `wheelchair`, `hazard`) are dynamically filtered at query time using Haversine distance (`importForRoute(routeCoords, bufferKm)`) for any trip corridor in India instead of hardcoded bounding boxes.
- **NPM Script**: `npm run setup:osm-india` (runs `server/scripts/setup-india-osm.sh`).

### 2. MoRTH Government Accident Blackspot Pipeline
- **API Data Fetching**: State accident datasets are automatically fetched via Data.gov.in using `DATA_GOV_IN_API_KEY`.
- **State Resource ID Mapping**: MoRTH coverage depends on state datasets configured in `fetchMorthFromDataGovIn.js`'s `STATE_RESOURCE_IDS` mapping object. *Note: Each state dataset on Data.gov.in requires a manual one-time lookup for its `resource_id`, as Data.gov.in does not provide a single unified full-catalog search API.*
- **NPM Script**: `npm run import:morth` (runs `fetchMorthFromDataGovIn.js` then `importMorthBlackspots.js`).

### 3. Non-Destructive Data Merging
- All importers (OSM, MoRTH, Community) merge safely into `server/json/hazards.json` without overwriting or deleting entries with `source: "community"`.

