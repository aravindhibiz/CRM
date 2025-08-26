-- Relax RLS policies for contacts, deals, and user_profiles to allow reads across the organization.

-- 1. Contacts
-- Drop the old restrictive policy that covers all actions.
DROP POLICY IF EXISTS "users_manage_own_contacts" ON public.contacts;

-- Create a permissive SELECT policy.
CREATE POLICY "Allow all authenticated users to read contacts"
ON public.contacts FOR SELECT TO authenticated USING (true);

-- Re-create specific policies for other actions.
CREATE POLICY "Users can insert their own contacts"
ON public.contacts FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own contacts"
ON public.contacts FOR UPDATE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own contacts"
ON public.contacts FOR DELETE TO authenticated USING (owner_id = auth.uid());


-- 2. Deals
-- Drop the old restrictive policy.
DROP POLICY IF EXISTS "users_manage_own_deals" ON public.deals;

-- Create a permissive SELECT policy.
CREATE POLICY "Allow all authenticated users to read deals"
ON public.deals FOR SELECT TO authenticated USING (true);

-- Re-create specific policies for other actions.
CREATE POLICY "Users can insert their own deals"
ON public.deals FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own deals"
ON public.deals FOR UPDATE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own deals"
ON public.deals FOR DELETE TO authenticated USING (owner_id = auth.uid());


-- 3. User Profiles
-- Drop the old restrictive policy.
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;

-- Create a permissive SELECT policy.
CREATE POLICY "Allow all authenticated users to read user profiles"
ON public.user_profiles FOR SELECT TO authenticated USING (true);

-- Re-create the UPDATE policy. INSERT is handled by a trigger.
CREATE POLICY "Users can update their own user profile"
ON public.user_profiles FOR UPDATE TO authenticated USING (id = auth.uid());
