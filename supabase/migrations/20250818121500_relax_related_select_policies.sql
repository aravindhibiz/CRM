-- Relax RLS policies for contacts, deals, and user_profiles to allow team-wide visibility.

-- 1. Contacts
-- Drop the restrictive all-in-one policy
DROP POLICY IF EXISTS "users_manage_own_contacts" ON public.contacts;

-- Create a permissive SELECT policy
CREATE POLICY "Allow authenticated users to read contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (true);

-- Re-create restrictive policies for modification
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


-- 2. Deals
-- Drop the restrictive all-in-one policy
DROP POLICY IF EXISTS "users_manage_own_deals" ON public.deals;

-- Create a permissive SELECT policy
CREATE POLICY "Allow authenticated users to read deals"
ON public.deals
FOR SELECT
TO authenticated
USING (true);

-- Re-create restrictive policies for modification
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


-- 3. User Profiles
-- Drop the restrictive all-in-one policy
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;

-- Create a permissive SELECT policy
CREATE POLICY "Allow authenticated users to read user profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

-- Re-create restrictive policies for modification
CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid());
