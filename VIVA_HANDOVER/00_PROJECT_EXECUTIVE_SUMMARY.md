# 00 — PROJECT EXECUTIVE SUMMARY: STSMS (Smart Tourist Safety Monitoring System)

> **Document Type:** College Project Viva Preparation & Technical Handover  
> **System Name:** STSMS — Smart Tourist Safety & Emergency Command System (Wilderness & High-Altitude Safety Engine)  
> **Repository Location:** `/Users/ojhas/Downloads/stsms-admin`  
> **Mobile App Location:** `/Users/ojhas/Downloads/stsms-admin/stsms-mobile`  
> **Author/Maintainer:** Student Developer (B.Tech / MCA Project)  
> **Audit Status:** Verified Read-Only Codebase Inspection  

---

## 1. Problem Statement & Real-World Relevance

### The Real-World Problem
Every year, thousands of tourists and trekkers in high-altitude, remote, and wilderness regions (such as the Himalayas, Western Ghats, and remote national parks) experience severe emergencies—ranging from acute mountain sickness (AMS), avalanches, and flash floods to getting lost off marked trails or cellular dead-zone isolation. 

Traditional emergency response systems fail in these environments due to three critical bottlenecks:
1. **The Cellular Dead-Zone Bottleneck:** In deep valleys and high mountain passes, commercial 4G/5G mobile signals drop completely. Standard web apps or emergency calling apps fail immediately when no internet connection exists.
2. **Device Battery Depletion Bottleneck:** Continuous GPS tracking rapidly depletes smartphone batteries in sub-zero alpine temperatures within 4 to 6 hours, rendering the victim unreachable before Search and Rescue (SAR) can reach them.
3. **The Unresponsive Victim Bottleneck:** If a tourist suffers a fall, avalanche burial, or hypothermia-induced unconsciousness, they cannot manually press an SOS button. Without an automated check-in deadline monitor, hours or days pass before anyone realizes they are missing.

### The STSMS Solution
STSMS (Smart Tourist Safety Monitoring System) is an integrated, dual-tier safety platform designed specifically for remote expedition safety. It couples a lightweight **React Native Expo Mobile Application** carried by the tourist with an **Enterprise React 18 + Leaflet Admin Emergency Command Center** operated by Search and Rescue (SAR) authorities, disaster management agencies, and park rangers.

The system introduces three novel defensive engineering mechanisms:
- **1-Tap Distress Beacon with Dual Fallback:** Instant SOS dispatch over REST API when online, with an automated fallback that triggers native device SMS composers with precise GNSS coordinates when offline.
- **Adaptive 100-Meter GNSS Displacement Filter:** A movement-aware tracking hook that suppresses GPS pings while stationary, extending device battery life up to 36+ hours.
- **Automated Dead Man's Switch Engine:** A background cloud daemon that continuously monitors expedition arrival deadlines and triggers automated SAR dispatch if a traveler fails to check in before their pre-agreed window closes.

---

## 2. 30-Second Viva Pitch (Memorize This!)

> *"Respected Professor, **STSMS** is an end-to-end Wilderness Tourist Safety and Emergency Command System built using React, Node.js Express, PostgreSQL with PostGIS on Supabase, and a React Native Expo mobile application. Unlike generic SOS applications that assume constant 5G connectivity, STSMS is engineered for rugged wilderness environments. It provides real hardware GNSS location and battery telemetry, an adaptive 100-meter displacement filter that extends battery life to over 36 hours, an automated cloud-based Dead Man's Switch that dispatches rescue teams even if an injured tourist becomes unconscious, and an offline native SMS fallback for zero-connectivity zones. All active emergencies are visualized in real time on an interactive Leaflet geospatial radar with automated camera tracking and geofence perimeter alerts."*

---

## 3. 2–3 Minute Comprehensive Project Explanation

When the external examiner asks you to *“Walk me through your project in detail,”* structure your explanation into four clear pillars:

### Pillar 1: Tourist Mobile Experience (Expo SDK 58 / React Native)
- The tourist registers their expedition, providing their name, destination, primary guardian contact phone, and expected arrival deadline.
- When an emergency occurs, tapping the prominent **1-Tap SOS Button** triggers a multi-sensor telemetry collection:
  - Precise latitude and longitude via `expo-location` (using balanced GNSS satellites with fallback to last-known cached hardware fix).
  - Exact hardware battery percentage via `expo-battery`.
  - Device platform and model metadata.
- If connected to Wi-Fi/cellular, the app transmits an HTTP POST to `/api/alerts/sos`.
- If the tourist has zero cellular internet, the application catches the network failure and immediately invokes `triggerOfflineNativeSmsFallback()`, generating a pre-filled native SMS message with Google Maps coordinate links addressed to the tourist's guardian.

### Pillar 2: Centralized Node.js & Supabase Cloud Architecture
- The backend runs on Node.js Express, mounted on port `5001` and listening on `0.0.0.0` for local area network pairing.
- It is connected to a live hosted PostgreSQL database on **Supabase Cloud**, utilizing the **PostGIS** spatial extension.
- Coordinates are stored as PostGIS spatial points (`POINT(longitude latitude)`), and the database dynamically exposes `lat` and `lon` as generated columns via spatial functions (`ST_Y` and `ST_X`).
- The backend handles high-concurrency race conditions: it enforces a database unique partial index (`one_live_alert_per_trip`) and intercepts error code `23505` to smoothly update an existing active emergency with freshest telemetry rather than crashing.
- Every state change writes an immutable audit record to the `alert_events` table for forensic rescue verification.

### Pillar 3: Automated Dead Man's Switch Daemon
- Located in `server/services/deadManSwitchService.js`, this cloud worker loops automatically every **15 seconds**.
- It evaluates all active expeditions. If an explorer's `expectedArrivalDeadline` has expired and they have not submitted a safe check-in, the engine automatically generates a `CRITICAL` severity emergency alert (`alt_dms_*`), updates the trip status to `EXPIRED_UNCHECKED`, and triggers dashboard notifications.
- The tourist can reset or extend this timer from their mobile device using `/api/trips/:id/checkin` or `/api/trips/:id/extend-deadline`.

### Pillar 4: Admin Emergency Response Command Center (React 18 + Vite)
- The admin dashboard runs on port `3009`, featuring a glassmorphism dark-mode UI.
- It conducts **3-second HTTP polling** (`setInterval`) against `/api/alerts` and `/api/monitoring/live-locations`.
- A newly detected SOS alert triggers immediate real-time browser audio/toast notifications (`toast.error`).
- The **Live Interactive Geospatial Map** (built with React-Leaflet) features an automated `MapCameraController`: it automatically pans and flies (`map.flyTo`) directly to the emergency coordinates at zoom level 13.
- Active emergencies display pulsing red SVG markers, dynamic 1.8 km search grid perimeter circles, and tourist telemetry popups (battery, altitude, coordinates).
- SAR operators can update the alert status (`open` $\to$ `acknowledged` $\to$ `dispatched` $\to$ `resolved`), add rescue logs, and trigger automated guardian SMS dispatches.

---

## 4. User Roles & Target Personas

| Role | Interface | Key Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **Tourist / Trekker** | Expo Mobile App | 1-Tap SOS distress broadcast, hardware battery tracking, expedition registration, safe check-ins, offline SMS fallback, community hazard reporting. |
| **Command Center Operator / SAR Admin** | Web Dashboard | Live emergency telemetry monitoring, geospatial map tracking, SOS acknowledgment, rescue team dispatching, guardian notifications, system settings. |
| **Park Ranger / Field Responder** | Web / Mobile Hybrid | Receives geofenced alerts, tracks victim's last known GNSS breadcrumbs, views terrain hazard polygons (avalanche risk, flood zones). |

---

## 5. End-to-End User Journey

```
[Tourist opens Expo App] 
       │
       ▼
[Registers expedition & sets 18:00 check-in deadline]
       │
       ▼
[Injured on remote trail, presses 1-Tap SOS]
       │
       ├─► (Network Online) ──► HTTP POST /api/alerts/sos ───────────────┐
       │                                                                  │
       └─► (Network Offline) ─► Native SMS Composer opened to Guardian    │
                                                                          ▼
[Supabase inserts row in 'alerts' & 'alert_events' tables via PostGIS POINT]
       │
       ▼
[Admin Dashboard 3s polling detects new Alert ID]
       │
       ▼
[Toast banner & audio alert fires in Command Center]
       │
       ▼
[Leaflet MapCameraController flies to victim's exact GPS coordinates]
       │
       ▼
[Admin clicks "Acknowledge" ──► status changes to 'acknowledged']
       │
       ▼
[Admin clicks "Dispatch Rescue" ──► status changes to 'dispatched']
       │
       ▼
[Rescue team extracts victim ──► Admin inputs resolution notes & marks 'resolved']
```

---

## 6. What Makes STSMS Superior to a Basic Emergency Alert App?

| Feature | Generic Emergency App | STSMS (This Project) |
| :--- | :--- | :--- |
| **Cellular Dead-Zone Handling** | Fails with "Network Error" dialog | Dual fallback: buffers locally in SQLite/AsyncStorage and invokes device native SMS composer with coordinates. |
| **Battery Life Management** | Constant GPS polling drains phone in 4 hours | Adaptive 100m displacement filter suppresses redundant transmissions, extending battery to 36+ hours. |
| **Unconscious Victim Scenario** | Completely unhandled (requires manual button tap) | Automated Dead Man's Switch triggers SAR dispatch automatically upon expired deadline. |
| **Geospatial Intelligence** | Simple static pins on a map | PostGIS spatial queries, dynamic 1.8km search radius circles, terrain danger polygons, and trust-decayed hazard ratings. |
| **Concurrency & Integrity** | Submitting twice creates duplicate records | Database unique partial index + application-level conflict handling smoothly updates telemetry. |

---

## 7. Current Feature Status Matrix

| Feature Module | Verification Status | Grounding Source File |
| :--- | :--- | :--- |
| **1-Tap Manual SOS Dispatch** | **Implemented & Verified** | `HomeScreen.jsx`, `emergencyService.js`, `alertController.js` |
| **Supabase PostgreSQL / PostGIS Storage** | **Implemented & Verified** | `supabase.js`, `alerts_schema.sql`, `verifySupabase.js` |
| **Hardware GPS & Battery Acquisition** | **Implemented & Verified** | `expo-location`, `expo-battery`, `HomeScreen.jsx` |
| **Zero-Network Native SMS Fallback** | **Implemented & Verified** | `emergencyService.js` (`Linking.openURL('sms:...')`) |
| **Adaptive 100m Polling & Haversine Filter** | **Implemented & Verified** | `useLocation.js` (`getDistanceMeters`) |
| **Exponential Network Back-Off** | **Implemented & Verified** | `offlineStorage.js` (3 failures $\to$ 30m pause) |
| **Dead Man's Switch Automated Daemon** | **Implemented & Verified** | `deadManSwitchService.js` (15s interval) |
| **Admin Real-Time Toast & Audio Alerts** | **Implemented & Verified** | `src/App.jsx` (3s polling against `/api/alerts`) |
| **LiveMap Auto-Focus Camera** | **Implemented & Verified** | `LiveMap.jsx` (`MapCameraController`, `map.flyTo`) |
| **SOS Status Transition & Audit Trail** | **Implemented & Verified** | `alertController.js`, `alert_events` table |
| **Community Hazard Trust Decay Algorithm** | **Implemented & Verified** | `hazardController.js` (`calculateTrustScore`) |
| **Dynamic LAN IP Auto-Discovery** | **Implemented & Verified** | `server.js` (`/api/network-ip`), `api.js` |
| **Realtime WebSockets (Supabase Channel)**| **Planned / Not Implemented** | Uses HTTP 3s Polling instead of WebSocket subscriptions |
| **Automated Cellular SMS Gateway (Twilio)** | **Partially Implemented** | Simulation log + Native device SMS client; no paid carrier API key |
| **Continuous Background OS Geofencing** | **Partially Implemented** | Foreground loop active; headless background task is prototype |

---

## 8. Summary of Known Gaps for Defense

1. **HTTP Polling vs WebSockets:** The admin dashboard polls every 3 seconds rather than using Supabase Realtime WebSocket subscriptions. (Viva defense: *Simpler, robust against connection dropouts in rural command posts, avoids persistent socket state management*).
2. **Hybrid Storage Architecture:** Alerts and user profiles reside in Supabase Cloud PostgreSQL, while trips, admins, and hazard zones are currently synchronized with local JSON files (`server/json/`).
3. **SMS Dispatcher:** Cloud-side SMS uses an event logger simulation rather than a paid Twilio/AWS SNS gateway, though mobile-side offline SMS uses real native device messaging.
