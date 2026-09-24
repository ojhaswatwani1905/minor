# Implementation Roadmap & System Phases

### Phase 1: Database & PostGIS Setup
- [x] **Supabase schema migrations**: `profiles`, `route_hazards`, `route_recommendations` tables with PostGIS extension.
- [x] **pg_cron Dead Man's Switch logic**: Periodic check-in deadline monitoring worker & automated emergency dispatch webhook triggers.

### Phase 2: Data Ingestion & Seeding Engine
- [x] **OSM Overpass Ingestion Script**: Node.js script (`server/scripts/importOpenData.js`) parsing `tourism=*` nodes with infrastructure/hazard tags (`smoothness`, `lit`, `access`, `wheelchair`, `hazard`).
- [x] **MoRTH Government Blackspot & NDMA Datasets**: Pre-seeding highway accident blackspots, flash flood corridors, landslide sectors, and wildlife conflict zones.
- [x] **Review Negative Safety Filter**: TripAdvisor & Google Places negative keyword filter (`unsafe`, `scam`, `no lights`, `pickpocket`).
- [x] **Spatial Indexing**: Enforced PostGIS GIST & SQLite R-Tree spatial indexing for fast radial queries.

### Phase 3: Offline Mobile Storage Engine (Expo + SQLite)
- [x] **SQLite Offline Store**: R-Tree spatial index configuration & background location queue storage in SQLite.
- [x] **50km Geo-Fenced BBox Sync**: Radial BBox vector tile & POI caching module for low-connectivity zones.
- [x] **Zero-Network Native SMS Fallback**: Direct device native SMS dispatch with GPS coordinates when cellular data is unavailable.

### Phase 4: MapLibre UI & Clustering
- [x] **AMOLED True Black Theme**: Clean `#000000` dark mode design system across React Native screens & Admin Dashboard.
- [x] **Clustered Map Layers**: Interactive map rendering for Tourist Spots, Hazards, Government Blackspots, and Dhabas.
- [x] **Dead Man's Switch Countdown Screen**: Live check-in deadline timer with one-tap "I am Safe" check-in button.

### Phase 5: Field Testing & Launch
- [x] **Forced Airplane Mode Testing**: Simulated zero-connectivity navigation & manual SOS SMS triggers along Guna-Raghogarh route.
- [x] **Production Deployment**: Supabase Cloud API engine, Node.js background workers, and Expo production build bundle setup.

