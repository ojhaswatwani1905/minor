# Architectural Memory & Tech Stack

### 1. Key Architectural Decisions (ADRs)
* **ADR 01: Supabase + PostGIS vs Custom Node.js Server:** Supabase chosen for native spatial querying, low latency, and built-in `pg_cron` scheduling without maintaining server infrastructure.
* **ADR 02: Cloud Dead Man's Switch:** Server-side countdown chosen over client app timers so emergency alerts trigger even if the phone is lost, damaged, or powered down.
* **ADR 03: 100m Distance-Based GPS Polling:** Adopted over 1-second continuous polling to extend battery runtime from 3 hours to 36+ hours.

### 2. Package Dependency Index

| Package Name | Role / Purpose |
| :--- | :--- |
| `expo` (SDK 51+) | Core Application Engine |
| `@supabase/supabase-js` | Backend Client & Auth API |
| `expo-location` & `expo-task-manager` | Background Location Hardware Access |
| `expo-sqlite` | Local Offline Transaction Queue |
| `@react-native-community/netinfo` | Offline/Online Network State Listener |
| `expo-sms` | Zero-Network Native Device SMS Fallback |
| `@maplibre/maplibre-react-native` | Offline Vector Map Tile Rendering |
