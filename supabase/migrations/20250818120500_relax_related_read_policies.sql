-- Relax RLS policies on contacts, deals, and user_profiles to allow all authenticated users to read.
-- This is necessary for features like the global activity timeline to work correctly.

-- 1. Relax Contact Policies
DROP POLICY IF EXISTS "users_manage_own_contacts" ON public.contacts;

CREATE POLICY "Allow all authenticated users to read contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own contacts"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own contacts"
ON public.contacts
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own contacts"
ON public.contacts
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());


-- 2. Relax Deal Policies
DROP POLICY IF EXISTS "users_manage_own_deals" ON public.deals;

CREATE POLICY "Allow all authenticated users to read deals"
ON public.deals
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own deals"
ON public.deals
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own deals"
ON public.deals
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own deals"
ON public.deals
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());


-- 3. Relax User Profile Policies
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;

CREATE POLICY "Allow all authenticated users to read user profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own user profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid());