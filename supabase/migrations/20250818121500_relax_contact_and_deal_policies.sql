-- Relax RLS policies on contacts and deals to allow reads across the organization.
-- This is necessary for features like the global activity timeline to work correctly.

-- 1. Policies for 'contacts' table
-- Drop the old restrictive policy that covered all actions.
DROP POLICY IF EXISTS "users_manage_own_contacts" ON public.contacts;

-- Allow any authenticated user to view all contacts.
CREATE POLICY "Allow all authenticated users to read contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert contacts and assign ownership to themselves.
CREATE POLICY "Users can insert their own contacts"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Allow users to update only their own contacts.
CREATE POLICY "Users can update their own contacts"
ON public.contacts
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Allow users to delete only their own contacts.
CREATE POLICY "Users can delete their own contacts"
ON public.contacts
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());


-- 2. Policies for 'deals' table
-- Drop the old restrictive policy.
DROP POLICY IF EXISTS "users_manage_own_deals" ON public.deals;

-- Allow any authenticated user to view all deals.
CREATE POLICY "Allow all authenticated users to read deals"
ON public.deals
FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert deals and assign ownership to themselves.
CREATE POLICY "Users can insert their own deals"
ON public.deals
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Allow users to update only their own deals.
CREATE POLICY "Users can update their own deals"
ON public.deals
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Allow users to delete only their own deals.
CREATE POLICY "Users can delete their own deals"
ON public.deals
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());
