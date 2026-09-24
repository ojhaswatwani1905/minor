# Product Requirement Document (PRD)
## Wilderness Safety & Community Route Intelligence System

### 1. Vision & Core Objectives
The Wilderness Safety & Community Route Intelligence Companion is an offline-first mobile platform designed for travelers, commuters, and hikers navigating remote stretches or low-connectivity zones (e.g., Guna to Raghogarh route). It ensures personal safety using satellite GNSS tracking, cloud-hosted automated dispatchers ("Dead Man's Switch"), adaptive battery management, merged open data, and real-time community reviews.

### 2. Technical Bottlenecks & Solutions

#### A. Zero Cellular Signal (Dead Zones)
* **Problem:** Mobile data drops completely in remote highway stretches and wilderness areas.
* **Solution:** Hardware mobile chips receive satellite GNSS signals without internet. Location pings are stored locally in SQLite. If completely offline during a manual SOS, the app triggers native device SMS directly to emergency contacts.

#### B. Severe Battery Exhaustion
* **Problem:** Continuous 1-second GPS polling drains phone batteries within 3 hours.
* **Solution:** Distance-based polling (100-meter interval) combined with speed detection, extending operational battery life to 36+ hours.

#### C. User Incapacitation (The "Dead Man's Switch")
* **Problem:** Manual SOS buttons fail if the user is unconscious or loses their device.
* **Solution:** Before starting a trip, the user sets an expected arrival deadline. A server-side `pg_cron` task monitors this timer. If it expires without a "Safe Check-In", the cloud auto-dispatches SMS/Email alerts to emergency contacts even if the phone is destroyed.

#### D. Cold Start / Zero-User Pre-Seeding
* **Problem:** New route navigation apps lack community reviews prior to user growth.
* **Solution:** Pre-seed the database using a Node.js script that merges free datasets from OpenStreetMap (Overpass API) for dhabas/fuel stations and Data.gov.in for government highway accident blackspots.

### 3. Core Feature Matrix

| Module | Feature Name | Functionality | Priority |
| :--- | :--- | :--- | :--- |
| **Safety SOS** | Cloud Dead Man's Switch | PostgreSQL `pg_cron` server timer auto-dispatches alerts if safe check-in deadline expires. | **Critical** |
| **Safety SOS** | Zero-Network SMS Fallback | Detects offline state and fires direct native SMS with GPS coordinates to contacts. | **Critical** |
| **Location** | Adaptive 100m GPS Polling | Distance-aware background location tracking to preserve battery up to 36+ hours. | **Critical** |
| **Community** | Preset Tags & Custom Reviews | Preset hazard tags (`Pickpocketing`, `Unsafe Night`, `Low Lighting`, `Scams`, `Stray Animals`) + custom reviews & photos. | **High** |
| **Community** | Upvotes & Trust Decay | +1/-1 community voting, 30-day automated hazard decay, and "Verified Traveler" badges. | **High** |
| **Data Engine** | Merged Open Data Import | Script to seed DB with OpenStreetMap POIs and Government Highway Blackspots. | **Medium** |
