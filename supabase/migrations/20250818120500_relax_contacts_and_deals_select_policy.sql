-- Relax RLS policies on contacts and deals to allow reads across the organization.

-- Drop the old restrictive policies that covered all actions (SELECT, INSERT, UPDATE, DELETE).
DROP POLICY IF EXISTS "users_manage_own_contacts" ON public.contacts;
DROP POLICY IF EXISTS "users_manage_own_deals" ON public.deals;

-- === CONTACTS POLICIES ===

-- 1. Allow authenticated users to read all contacts.
CREATE POLICY "Allow authenticated users to read contacts" 
ON public.contacts
FOR SELECT 
TO authenticated 
USING (true);

-- 2. Allow users to insert contacts for themselves.
CREATE POLICY "Users can insert their own contacts" 
ON public.contacts
FOR INSERT 
TO authenticated 
WITH CHECK (owner_id = auth.uid());

-- 3. Allow users to update their own contacts.
CREATE POLICY "Users can update their own contacts" 
ON public.contacts
FOR UPDATE 
TO authenticated 
USING (owner_id = auth.uid());

-- 4. Allow users to delete their own contacts.
CREATE POLICY "Users can delete their own contacts" 
ON public.contacts
FOR DELETE 
TO authenticated 
USING (owner_id = auth.uid());


-- === DEALS POLICIES ===

-- 1. Allow authenticated users to read all deals.
CREATE POLICY "Allow authenticated users to read deals" 
ON public.deals
FOR SELECT 
TO authenticated 
USING (true);

-- 2. Allow users to insert deals for themselves.
CREATE POLICY "Users can insert their own deals" 
ON public.deals
FOR INSERT 
TO authenticated 
WITH CHECK (owner_id = auth.uid());

-- 3. Allow users to update their own deals.
CREATE POLICY "Users can update their own deals" 
ON public.deals
FOR UPDATE 
TO authenticated 
USING (owner_id = auth.uid());

-- 4. Allow users to delete their own deals.
CREATE POLICY "Users can delete their own deals" 
ON public.deals
FOR DELETE 
TO authenticated 
USING (owner_id = auth.uid());
