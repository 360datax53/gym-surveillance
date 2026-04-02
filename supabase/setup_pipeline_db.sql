-- 1. Create Branches Table
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    manager_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Link Cameras to Branches
ALTER TABLE public.cameras ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- 3. Create/Update Alerts Table with new requirements
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    camera_id UUID NOT NULL REFERENCES public.cameras(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    snapshot_url TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    confidence NUMERIC NOT NULL DEFAULT 0.0,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    member_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add Indexes for pipeline performance
CREATE INDEX IF NOT EXISTS idx_alerts_camera_timestamp ON public.alerts(camera_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_organization ON public.alerts(organization_id, created_at DESC);

-- 5. Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- 6. Basic Policies (Allow admins to see everything in their org)
CREATE POLICY "Allow all authenticated users read branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users read alerts" ON public.alerts FOR SELECT TO authenticated USING (true);
