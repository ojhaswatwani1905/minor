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

-- Backend Service Role Policy:
-- All write operations (INSERT, UPDATE, DELETE) and authoritative state transitions
-- are strictly restricted to the backend service role.
DROP POLICY IF EXISTS "Allow service_role full access to deadman_sessions" ON public.deadman_sessions;
CREATE POLICY "Allow service_role full access to deadman_sessions" 
  ON public.deadman_sessions
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Authenticated Tourist Policy (Read-Only Least Privilege):
-- Mobile tourists access Dead Man's Switch exclusively through backend REST APIs.
-- To protect against client-side tampering with deadlines, escalation states,
-- or incident references, direct database writes (INSERT, UPDATE, DELETE) are PROHIBITED.
-- Only read-only SELECT is permitted, strictly scoped to the tourist's own rows.
DROP POLICY IF EXISTS "Allow authenticated read own deadman_sessions" ON public.deadman_sessions;
CREATE POLICY "Allow authenticated read own deadman_sessions" 
  ON public.deadman_sessions
  FOR SELECT 
  TO authenticated 
  USING (auth.uid()::text = user_id);

-- Clean up any legacy or overly permissive write policies
DROP POLICY IF EXISTS "Allow authenticated insert own deadman_sessions" ON public.deadman_sessions;
DROP POLICY IF EXISTS "Allow authenticated update own deadman_sessions" ON public.deadman_sessions;
