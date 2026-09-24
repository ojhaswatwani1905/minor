# Engineering Rules & Standards
*Core Technical Constraints & Best Practices*

### 1. Non-Negotiable System Laws

* **RULE 1: Absolute Offline-First Execution**
  No critical safety, map navigation, or SOS triggering feature can rely on an active internet connection. All location logs must be written to local SQLite first before attempting cloud sync.

* **RULE 2: Strict Battery Budgeting (100m Polling)**
  Continuous GPS polling at 1-second intervals is strictly forbidden during background safety tracking. Polling must use distance filtering (`distanceInterval >= 100 meters`) to guarantee 36+ hours of operation.

* **RULE 3: Cloud-Hosted Timer Fail-Safe**
  Safety monitoring timers ("Dead Man's Switch") MUST run server-side in Supabase (`pg_cron`). Client-only timers are prohibited because they fail if the phone is destroyed or loses power.

### 2. Guidelines & Code Quality Standards

* **Exponential Network Back-off:** If 3 consecutive background network sync calls fail, pause background sync for 30 minutes to conserve modem power.
* **Spatial Index Enforcement:** All geography tables in PostgreSQL MUST use PostGIS GIST indexes (`USING GIST(location)`) for sub-10ms spatial queries.
* **Automated Content Moderation:** Any user review receiving 3 or more flag reports is automatically set to `is_active = FALSE` pending manual review.
* **Data Privacy:** Local SQLite location logs are encrypted at rest and auto-purged after 7 days.
