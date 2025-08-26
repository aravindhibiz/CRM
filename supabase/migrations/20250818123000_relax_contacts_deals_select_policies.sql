-- Relax RLS policies on contacts and deals to allow all authenticated users to view them.

-- 1. Policies for Contacts

-- Drop the old, restrictive policy that covered all actions
DROP POLICY IF EXISTS "users_manage_own_contacts" ON public.contacts;

-- Create a new, permissive SELECT policy
CREATE POLICY "Allow authenticated users to read all contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (true);

-- Re-apply specific policies for other actions
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


-- 2. Policies for Deals

-- Drop the old, restrictive policy
DROP POLICY IF EXISTS "users_manage_own_deals" ON public.deals;

-- Create a new, permissive SELECT policy
CREATE POLICY "Allow authenticated users to read all deals"
ON public.deals
FOR SELECT
TO authenticated
USING (true);

-- Re-apply specific policies for other actions
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
