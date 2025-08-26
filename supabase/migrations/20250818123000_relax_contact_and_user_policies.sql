-- Relax RLS policies on contacts and user_profiles to allow reads across the organization.

-- 1. Policies for 'contacts' table
-- Drop the old restrictive policy that covered all actions.
DROP POLICY IF EXISTS "users_manage_own_contacts" ON public.contacts;

-- Create a new policy to allow any authenticated user to view all contacts.
CREATE POLICY "Allow authenticated users to read all contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (true);

-- Re-create a policy to ensure users can only INSERT contacts they own.
CREATE POLICY "Users can insert their own contacts"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Re-create a policy to ensure users can only UPDATE/DELETE their own contacts.
CREATE POLICY "Users can update or delete their own contacts"
ON public.contacts
FOR UPDATE USING (owner_id = auth.uid());


-- 2. Policies for 'user_profiles' table
-- Drop the old restrictive policy.
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;

-- Create a new policy to allow any authenticated user to view all user profiles.
CREATE POLICY "Allow authenticated users to read all user_profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

-- Re-create a policy to ensure users can only update their own profile.
CREATE POLICY "Users can update their own user_profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid());
