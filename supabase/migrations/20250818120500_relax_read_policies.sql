-- Relax RLS policies on user_profiles and contacts to allow read access for all authenticated users.
-- This is necessary for joined queries, like in the activity timeline, to work correctly.

-- 1. Relax user_profiles read policy
-- Drop the old restrictive policy that covered all actions.
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;

-- Create a new policy to allow any authenticated user to read any profile.
CREATE POLICY "Allow authenticated users to read user profiles"
ON public.user_profiles FOR SELECT
TO authenticated
USING (true);

-- Re-create a policy that only allows users to update their own profile.
CREATE POLICY "Allow user to update their own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());


-- 2. Relax contacts read policy
-- Drop the old restrictive policy that covered all actions.
DROP POLICY IF EXISTS "users_manage_own_contacts" ON public.contacts;

-- Create a new policy to allow any authenticated user to read any contact.
CREATE POLICY "Allow authenticated users to read contacts"
ON public.contacts FOR SELECT
TO authenticated
USING (true);

-- Re-create policies to ensure users can only write/modify/delete their own contacts.
CREATE POLICY "Users can insert their own contacts"
ON public.contacts FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own contacts"
ON public.contacts FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own contacts"
ON public.contacts FOR DELETE
TO authenticated
USING (owner_id = auth.uid());
