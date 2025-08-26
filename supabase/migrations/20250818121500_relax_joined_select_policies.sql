-- Relax RLS policies on deals, contacts, and user_profiles to allow reads from any authenticated user.
-- This is necessary for the activities timeline to be able to join related data from different owners.

-- 1. User Profiles
-- Drop the old policy that only allowed users to see their own profile.
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;

-- Allow any authenticated user to view any user profile.
CREATE POLICY "Allow authenticated read access to user profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

-- Keep the policy that allows users to update their own profile.
CREATE POLICY "Allow users to update their own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());


-- 2. Contacts
-- Drop the old, restrictive policy.
DROP POLICY IF EXISTS "users_manage_own_contacts" ON public.contacts;

-- Allow any authenticated user to view all contacts.
CREATE POLICY "Allow authenticated read access to contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (true);

-- Keep policies that restrict write operations to the owner.
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


-- 3. Deals
-- Drop the old, restrictive policy.
DROP POLICY IF EXISTS "users_manage_own_deals" ON public.deals;

-- Allow any authenticated user to view all deals.
CREATE POLICY "Allow authenticated read access to deals"
ON public.deals
FOR SELECT
TO authenticated
USING (true);

-- Keep policies that restrict write operations to the owner.
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
