-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT DEFAULT 'United Kingdom',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create user_organizations mapping table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, organization_id)
);

-- Enable RLS
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- Policies for organizations
DROP POLICY IF EXISTS "Allow users to read their organizations" ON public.organizations;
CREATE POLICY "Allow users to read their organizations" ON public.organizations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_organizations
            WHERE user_organizations.organization_id = organizations.id
            AND user_organizations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow admins to insert organizations" ON public.organizations;
CREATE POLICY "Allow admins to insert organizations" ON public.organizations
    FOR INSERT
    WITH CHECK (true); -- Simplified for initial setup, usually tied to a user property

DROP POLICY IF EXISTS "Allow admins to update their organizations" ON public.organizations;
CREATE POLICY "Allow admins to update their organizations" ON public.organizations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_organizations
            WHERE user_organizations.organization_id = organizations.id
            AND user_organizations.user_id = auth.uid()
            AND user_organizations.role = 'admin'
        )
    );

-- Policies for user_organizations
DROP POLICY IF EXISTS "Users can view their own links" ON public.user_organizations;
CREATE POLICY "Users can view their own links" ON public.user_organizations
    FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow initial link creation" ON public.user_organizations;
CREATE POLICY "Allow initial link creation" ON public.user_organizations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
