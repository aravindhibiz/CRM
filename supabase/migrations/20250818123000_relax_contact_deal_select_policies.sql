-- Relax RLS policies on contacts and deals to allow all authenticated users to view them.

-- 1. Update Contacts Policies

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


-- 2. Update Deals Policies

-- Drop the old, restrictive policy
DROP POLICY IF EXISTS "users_manage_own_deals" ON public.deals;

-- Create a new policy that allows any authenticated user to view all deals
CREATE POLICY "Allow all authenticated users to read deals"
ON public.deals
FOR SELECT
TO authenticated
USING (true);

-- Re-apply policies for INSERT, UPDATE, DELETE to ensure users can still manage their own deals
CREATE POLICY "Users can insert their own deals"
ON public.deals
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own deals"
ON public.deals
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own deals"
ON public.deals
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());
