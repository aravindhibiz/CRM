-- Relax RLS policies on contacts and deals to allow all authenticated users to view them.
-- This is necessary for the activities timeline to correctly join and display related data.

-- 1. Update Contact Policies

-- Drop the old, all-encompassing policy
DROP POLICY IF EXISTS "users_manage_own_contacts" ON public.contacts;

-- Create a new policy that allows any authenticated user to view all contacts
CREATE POLICY "Allow authenticated read access to all contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (true);

-- Re-apply restrictive policies for write operations
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


-- 2. Update Deal Policies

-- Drop the old, all-encompassing policy
DROP POLICY IF EXISTS "users_manage_own_deals" ON public.deals;

-- Create a new policy that allows any authenticated user to view all deals
CREATE POLICY "Allow authenticated read access to all deals"
ON public.deals
FOR SELECT
TO authenticated
USING (true);

-- Re-apply restrictive policies for write operations
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
