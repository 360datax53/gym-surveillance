-- 1. Create/Update Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT DEFAULT 'United Kingdom',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Create/Update User-Org Mapping Table
CREATE TABLE IF NOT EXISTS public.user_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, organization_id)
);

ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- 3. Setup Simplified Permissions (To avoid "Chicken & Egg" isolation issues)
DROP POLICY IF EXISTS "Allow users to read their organizations" ON public.organizations;
CREATE POLICY "Allow all authenticated users to read organizations" ON public.organizations
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admins to insert organizations" ON public.organizations;
CREATE POLICY "Allow all authenticated users to insert organizations" ON public.organizations
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admins to update their organizations" ON public.organizations;
CREATE POLICY "Allow all authenticated users to update organizations" ON public.organizations
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view their own links" ON public.user_organizations;
CREATE POLICY "Allow all authenticated users to view links" ON public.user_organizations
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow initial link creation" ON public.user_organizations;
CREATE POLICY "Allow all authenticated users to create links" ON public.user_organizations
    FOR INSERT TO authenticated WITH CHECK (true);
