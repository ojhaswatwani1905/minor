# System Architecture & Technical Specifications

### 1. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                        1. MOBILE CLIENT (React Native / Expo)                     |
|                                                                                   |
|   [ Direct GNSS Hardware ] -------------> Captures GPS in Airplane Mode           |
|              │                                                                    |
|              ▼                                                                    |
|   [ Local SQLite Store ] --------------> Queues location pings & caches vector maps |
|              │                                                                    |
|     Check Connection State                                                        |
|     /                  \                                                          |
|   ONLINE               OFFLINE                                                    |
|    │                      │                                                       |
|    ▼                      ▼                                                       |
| [Supabase REST]      [Native Device SMS API]                                      |
| Syncs background     Fires direct SMS with coordinates                            |
| queue to DB          if user triggers SOS manually                                |
+-----------------------------------------------------------------------------------+
│
If user goes missing / loses signal completely
│
▼
+-----------------------------------------------------------------------------------+
|                       2. SUPABASE CLOUD BACKEND ENGINE                            |
|                                                                                   |
|   [ PostgreSQL + PostGIS ] ------------> Stores merged open data & user reviews   |
|              │                                                                    |
|   [ pg_cron Scheduler ]                                                           |
|   Runs every 5 mins to check safety check-in deadlines.                           |
|   If timer expires with no check-in ---> Fires HTTP Webhook to Make.com / Twilio   |
+-----------------------------------------------------------------------------------+
│
▼
+-----------------------------------------------------------------------------------+
|                       3. AUTOMATED DISPATCH & ALERTS                              |
|                                                                                   |
|   [ Emergency Contacts ] --------------> Receives SMS/Email with GPS link          |
+-----------------------------------------------------------------------------------+
```

### 2. Supabase SQL Database Schema

```sql
-- 1. Enable PostGIS Spatial Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. User Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  emergency_contact_email TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Route Hazards & Reviews Table
CREATE TABLE route_hazards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  selected_tags TEXT[] NOT NULL,
  review_title TEXT NOT NULL,
  review_body TEXT NOT NULL,
  severity INT DEFAULT 2 CHECK (severity BETWEEN 1 AND 3),
  photo_url TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  upvotes INT DEFAULT 1,
  downvotes INT DEFAULT 0,
  is_verified_traveler BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX route_hazards_geo_idx ON route_hazards USING GIST(location);

-- 4. Route Recommendations Table
CREATE TABLE route_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  origin_city TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  upvotes INT DEFAULT 1,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX route_recs_geo_idx ON route_recommendations USING GIST(location);
```
