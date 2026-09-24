-- Supabase PostgreSQL + PostGIS Migration Script
-- Wilderness Safety & Community Route Intelligence System

-- 1. Enable PostGIS Spatial Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. User Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  emergency_contact_email TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Route Hazards & Reviews Table
CREATE TABLE IF NOT EXISTS route_hazards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  selected_tags TEXT[] NOT NULL, -- ['PICKPOCKETING', 'POOR_LIGHTING', 'STRAY_ANIMALS', 'UNSAFE_NIGHT', 'SCAMS']
  review_title TEXT NOT NULL,
  review_body TEXT NOT NULL,
  severity INT DEFAULT 2 CHECK (severity BETWEEN 1 AND 3),
  photo_url TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  upvotes INT DEFAULT 1,
  downvotes INT DEFAULT 0,
  flag_count INT DEFAULT 0,
  is_verified_traveler BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS route_hazards_geo_idx ON route_hazards USING GIST(location);

-- 4. Route Recommendations Table
CREATE TABLE IF NOT EXISTS route_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  origin_city TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'FOOD_REST', 'FUEL_SERVICE', 'SCENIC_SPOT', 'ROAD_TIP'
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  upvotes INT DEFAULT 1,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS route_recs_geo_idx ON route_recommendations USING GIST(location);
