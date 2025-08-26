-- Relax RLS policies on contacts, deals, and user_profiles to allow team-wide visibility.

-- 1. Relax 'contacts' table policies
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "users_manage_own_contacts" ON public.contacts;

-- Allow any authenticated user to read all contacts
CREATE POLICY "Allow authenticated read access to all contacts" ON public.contacts FOR SELECT TO authenticated USING (true);

-- Re-create specific policies for write operations to maintain ownership
CREATE POLICY "Users can insert their own contacts" ON public.contacts FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update their own contacts" ON public.contacts FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can delete their own contacts" ON public.contacts FOR DELETE TO authenticated USING (owner_id = auth.uid());


-- 2. Relax 'deals' table policies
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "users_manage_own_deals" ON public.deals;

-- Allow any authenticated user to read all deals
CREATE POLICY "Allow authenticated read access to all deals" ON public.deals FOR SELECT TO authenticated USING (true);

-- Re-create specific policies for write operations
CREATE POLICY "Users can insert their own deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update their own deals" ON public.deals FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can delete their own deals" ON public.deals FOR DELETE TO authenticated USING (owner_id = auth.uid());


-- 3. Relax 'user_profiles' table policies
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;

-- Allow any authenticated user to read all user profiles
CREATE POLICY "Allow authenticated read access to all user profiles" ON public.user_profiles FOR SELECT TO authenticated USING (true);

-- Re-create specific policy for updating own profile
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
-- Note: INSERT is handled by a trigger from auth.users. DELETE is intentionally not granted to users.
