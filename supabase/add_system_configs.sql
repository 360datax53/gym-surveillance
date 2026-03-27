-- Create system_configs table to support auto-discovery of local AI services
CREATE TABLE IF NOT EXISTS public.system_configs (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read system configs (or restrict to authenticated if needed)
CREATE POLICY "Allow public read-only access to system_configs"
ON public.system_configs
FOR SELECT
USING (true);

-- Allow service role (or AI service) to upsert
-- Since AI Service uses ANON key, we might need a more permissive policy or a service role
CREATE POLICY "Allow anon update for system_configs"
ON public.system_configs
FOR ALL
USING (true)
WITH CHECK (true);

-- Initial fallback
INSERT INTO public.system_configs (key, value)
VALUES ('ai_service_host', 'localhost')
ON CONFLICT (key) DO NOTHING;
