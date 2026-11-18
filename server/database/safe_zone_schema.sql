-- =========================================================================
-- STSMS — Safe Travel Zone & Automatic Geofence SOS Migration
-- Run this in your Supabase SQL Editor if upgrading existing tables.
-- =========================================================================

-- 1. Ensure PostGIS is enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Extend trips table with safe zone attributes if they do not exist
DO $$
BEGIN
  -- Safe Zone Destination Name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='destination_name') THEN
    ALTER TABLE public.trips ADD COLUMN destination_name TEXT;
  END IF;

  -- Safe Zone Destination Coordinates
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='destination_lat') THEN
    ALTER TABLE public.trips ADD COLUMN destination_lat NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='destination_lon') THEN
    ALTER TABLE public.trips ADD COLUMN destination_lon NUMERIC;
  END IF;

  -- Safe Zone Boundary Radius in Meters (Default 5,000m = 5km)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='radius_m') THEN
    ALTER TABLE public.trips ADD COLUMN radius_m NUMERIC DEFAULT 5000;
  END IF;

  -- Geofence Monitoring State: APPROACHING | ACTIVE | WARNING | BREACHED | PAUSED | COMPLETED
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='geofence_status') THEN
    ALTER TABLE public.trips ADD COLUMN geofence_status TEXT DEFAULT 'APPROACHING';
  END IF;

  -- Tracking flags and telemetry
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='has_entered_zone') THEN
    ALTER TABLE public.trips ADD COLUMN has_entered_zone BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='entered_zone_at') THEN
    ALTER TABLE public.trips ADD COLUMN entered_zone_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='last_accuracy_m') THEN
    ALTER TABLE public.trips ADD COLUMN last_accuracy_m NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='distance_from_dest_m') THEN
    ALTER TABLE public.trips ADD COLUMN distance_from_dest_m NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='consecutive_outside_count') THEN
    ALTER TABLE public.trips ADD COLUMN consecutive_outside_count INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='breach_confirmed_at') THEN
    ALTER TABLE public.trips ADD COLUMN breach_confirmed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trips' AND column_name='metadata') THEN
    ALTER TABLE public.trips ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 3. Dedicated safe_zone_trips table (provides standalone storage with foreign keys)
CREATE TABLE IF NOT EXISTS public.safe_zone_trips (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_email TEXT,
  destination_name TEXT NOT NULL,
  destination_lat NUMERIC NOT NULL,
  destination_lon NUMERIC NOT NULL,
  radius_m NUMERIC NOT NULL DEFAULT 5000,
  status TEXT NOT NULL DEFAULT 'APPROACHING', -- 'APPROACHING' | 'ACTIVE' | 'WARNING' | 'BREACHED' | 'PAUSED' | 'COMPLETED'
  has_entered_zone BOOLEAN DEFAULT FALSE,
  entered_zone_at TIMESTAMPTZ,
  current_lat NUMERIC,
  current_lon NUMERIC,
  current_accuracy_m NUMERIC,
  distance_from_dest_m NUMERIC,
  battery_level INT,
  consecutive_outside_count INT DEFAULT 0,
  warning_started_at TIMESTAMPTZ,
  breach_confirmed_at TIMESTAMPTZ,
  active_alert_id TEXT,
  last_location_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Geofence Transition & Audit Log
CREATE TABLE IF NOT EXISTS public.geofence_events (
  id BIGSERIAL PRIMARY KEY,
  trip_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'ZONE_CREATED' | 'ZONE_ENTERED' | 'BOUNDARY_WARNING' | 'BREACH_CONFIRMED' | 'SAFE_CONFIRMED' | 'MONITORING_PAUSED' | 'MONITORING_RESUMED' | 'TRIP_COMPLETED'
  previous_status TEXT,
  new_status TEXT,
  lat NUMERIC,
  lon NUMERIC,
  accuracy_m NUMERIC,
  distance_from_dest_m NUMERIC,
  distance_outside_m NUMERIC,
  battery INT,
  notes TEXT,
  actor TEXT DEFAULT 'SYSTEM',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes for high-performance geospatial and status lookups
CREATE INDEX IF NOT EXISTS safe_zone_status_idx ON public.safe_zone_trips(status);
CREATE INDEX IF NOT EXISTS safe_zone_user_idx ON public.safe_zone_trips(user_id);
CREATE INDEX IF NOT EXISTS geofence_events_trip_idx ON public.geofence_events(trip_id);
CREATE INDEX IF NOT EXISTS geofence_events_created_idx ON public.geofence_events(created_at DESC);

-- 6. Enable RLS
ALTER TABLE public.safe_zone_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service_role full access to safe_zone_trips" ON public.safe_zone_trips
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon and auth read access to safe_zone_trips" ON public.safe_zone_trips
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anon and auth insert/update to safe_zone_trips" ON public.safe_zone_trips
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full access to geofence_events" ON public.geofence_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon and auth read access to geofence_events" ON public.geofence_events
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anon and auth insert access to geofence_events" ON public.geofence_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);

