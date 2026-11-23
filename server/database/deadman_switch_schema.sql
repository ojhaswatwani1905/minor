-- =========================================================================
-- STSMS — Dead Man's Switch PostgreSQL Schema & Migration
-- Authoritative Production Database Schema for Supabase / PostgreSQL
-- =========================================================================

-- 1. Create deadman_sessions table
CREATE TABLE IF NOT EXISTS public.deadman_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT,
  interval_seconds INT NOT NULL DEFAULT 900 CHECK (interval_seconds >= 10),
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'STOPPED', 'ESCALATED', 'SUPERSEDED'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_check_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_deadline_at TIMESTAMPTZ NOT NULL,
  paused_at TIMESTAMPTZ,
  paused_remaining_ms BIGINT,
  escalation_processed BOOLEAN NOT NULL DEFAULT FALSE,
  escalation_incident_id TEXT,
  escalated_at TIMESTAMPTZ,
  last_known_location JSONB, -- { lat, lng, accuracy, name, timestamp }
  hardware_telemetry JSONB,  -- { batteryLevel, networkSignal, deviceModel }
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for high-performance atomic worker polling & user filtering
CREATE INDEX IF NOT EXISTS deadman_status_deadline_idx 
  ON public.deadman_sessions (status, next_deadline_at) 
  WHERE escalation_processed = FALSE;

CREATE INDEX IF NOT EXISTS deadman_user_idx 
  ON public.deadman_sessions (user_id);

CREATE INDEX IF NOT EXISTS deadman_created_idx 
  ON public.deadman_sessions (created_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.deadman_sessions ENABLE ROW LEVEL SECURITY;

-- Service role policy (backend operations bypass RLS)
DROP POLICY IF EXISTS "Allow service_role full access to deadman_sessions" ON public.deadman_sessions;
CREATE POLICY "Allow service_role full access to deadman_sessions" 
  ON public.deadman_sessions
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Authenticated tourist policies: tourists can only inspect & modify their own sessions
DROP POLICY IF EXISTS "Allow authenticated read own deadman_sessions" ON public.deadman_sessions;
CREATE POLICY "Allow authenticated read own deadman_sessions" 
  ON public.deadman_sessions
  FOR SELECT 
  TO authenticated 
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Allow authenticated insert own deadman_sessions" ON public.deadman_sessions;
CREATE POLICY "Allow authenticated insert own deadman_sessions" 
  ON public.deadman_sessions
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Allow authenticated update own deadman_sessions" ON public.deadman_sessions;
CREATE POLICY "Allow authenticated update own deadman_sessions" 
  ON public.deadman_sessions
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid()::text = user_id);
