-- Relax RLS policies on contacts and deals to allow read access for all users.
-- This is required for the activity timeline to properly join and display related data.

-- 1. Contacts Policies

-- Drop the old, all-encompassing policy
DROP POLICY IF EXISTS "users_manage_own_contacts" ON public.contacts;

-- Create a new, permissive SELECT (read) policy
CREATE POLICY "Allow all authenticated users to read contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (true);

-- Re-create restrictive policies for insert, update, delete
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


-- 2. Deals Policies

-- Drop the old, all-encompassing policy
DROP POLICY IF EXISTS "users_manage_own_deals" ON public.deals;

-- Create a new, permissive SELECT (read) policy
CREATE POLICY "Allow all authenticated users to read deals"
ON public.deals
FOR SELECT
TO authenticated
USING (true);

-- Re-create restrictive policies for insert, update, delete
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