-- Relax RLS policies on contacts and user_profiles to allow all authenticated users to read them.

-- 1. Policies for Contacts

-- Drop the old, restrictive policy
DROP POLICY IF EXISTS "users_manage_own_contacts" ON public.contacts;

-- Create a new policy that allows any authenticated user to view all contacts
CREATE POLICY "Allow all authenticated users to read contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (true);

-- Re-apply policies for INSERT, UPDATE, DELETE to ensure users can still manage their own contacts
CREATE POLICY "Users can insert their own contacts"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own contacts"
ON public.contacts
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own contacts"
ON public.contacts
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());


-- 2. Policies for User Profiles

-- Drop the old, restrictive policy
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;

-- Create a new policy that allows any authenticated user to view all user profiles
CREATE POLICY "Allow all authenticated users to read user profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

-- Re-apply policies for INSERT, UPDATE, DELETE to ensure users can still manage their own profile
CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can delete their own profile"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (id = auth.uid());
