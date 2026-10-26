-- =========================================================================
-- STSMS — Emergency Alerts Supabase Table Migration
-- Run this in your Supabase SQL Editor if the 'alerts' table is not yet created.
-- =========================================================================

-- 1. Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT NOT NULL,
  trip_id TEXT,
  trip_info TEXT,
  type TEXT NOT NULL DEFAULT 'MANUAL_SOS',
  priority TEXT NOT NULL DEFAULT 'CRITICAL',
  message TEXT NOT NULL,
  location JSONB, -- { lat: number, lng: number, name: string } or NULL if GPS unavailable
  battery_level INT, -- 0 to 100 or NULL if battery unavailable
  network_status TEXT,
  device_info JSONB, -- { platform: string, osVersion: string, model: string } or NULL
  status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Acknowledged', 'Resolved'
  guardian_notified BOOLEAN DEFAULT FALSE,
  rescue_notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for fast status filtering and chronological sorting
CREATE INDEX IF NOT EXISTS alerts_status_idx ON public.alerts (status);
CREATE INDEX IF NOT EXISTS alerts_created_at_idx ON public.alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS alerts_priority_idx ON public.alerts (priority);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- 4. Policies:
-- Allow server-side service role full read/write access
CREATE POLICY "Allow service_role full access" ON public.alerts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated and anon clients to insert manual SOS records
CREATE POLICY "Allow public insert for SOS distress" ON public.alerts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to read alerts
CREATE POLICY "Allow read access to alerts" ON public.alerts
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to update alert status
CREATE POLICY "Allow update access to alerts" ON public.alerts
  FOR UPDATE
  TO anon, authenticated
  USING (true);
