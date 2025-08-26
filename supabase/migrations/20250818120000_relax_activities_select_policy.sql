-- Relax RLS policy on activities to allow all authenticated users to view all activities.

-- Drop the old, restrictive policy
DROP POLICY IF EXISTS "users_manage_own_activities" ON public.activities;

-- Create a new policy that allows any authenticated user to view all activities
CREATE POLICY "Allow all authenticated users to read activities"
ON public.activities
FOR SELECT
TO authenticated
USING (true);

-- Re-apply policies for INSERT, UPDATE, DELETE to ensure users can still manage their own activities
CREATE POLICY "Users can insert their own activities"
ON public.activities
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own activities"
ON public.activities
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own activities"
ON public.activities
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
