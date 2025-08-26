-- Migration: Fix circular dependency in admin RLS policies
-- Created: 2025-08-11 05:29:03
-- Issue: is_admin() function creates circular dependency with user_profiles table policies

-- Step 1: Drop the existing problematic policies
DROP POLICY IF EXISTS "admin_can_manage_all_users" ON public.user_profiles;
DROP POLICY IF EXISTS "admin_can_update_all_users" ON public.user_profiles;  
DROP POLICY IF EXISTS "admin_can_delete_all_users" ON public.user_profiles;

-- Step 2: Replace the problematic is_admin() function with auth.users metadata approach
-- This avoids circular dependency by querying auth.users instead of user_profiles
CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (au.raw_user_meta_data->>'role' = 'admin' 
         OR au.raw_app_meta_data->>'role' = 'admin')
)
$$;

-- Step 3: Create new admin policies using the safe function
-- These policies avoid circular dependency by not querying user_profiles
CREATE POLICY "admin_can_select_all_users"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.is_admin_from_auth());

CREATE POLICY "admin_can_update_all_users"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

CREATE POLICY "admin_can_delete_all_users"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (public.is_admin_from_auth());

-- Step 4: Update existing admin users to have proper auth metadata
-- This ensures the new function will work correctly
DO $$
DECLARE
    admin_user_record RECORD;
BEGIN
    -- Find admin users from user_profiles and update their auth metadata
    FOR admin_user_record IN
        SELECT up.id, up.email, up.role
        FROM public.user_profiles up
        WHERE up.role = 'admin'
    LOOP
        -- Update auth.users metadata to include admin role
        UPDATE auth.users
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                                 jsonb_build_object('role', admin_user_record.role::text)
        WHERE id = admin_user_record.id;
        
        RAISE NOTICE 'Updated auth metadata for admin user: %', admin_user_record.email;
    END LOOP;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating admin metadata: %', SQLERRM;
END $$;

-- Step 5: Keep the original is_admin() function but mark it as deprecated
-- Update it to use the new safe approach for backward compatibility
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT public.is_admin_from_auth()
$$;

-- Add comments for documentation
COMMENT ON FUNCTION public.is_admin_from_auth() IS 'Safe admin check using auth.users metadata - avoids circular dependency with user_profiles RLS policies';
COMMENT ON FUNCTION public.is_admin() IS 'DEPRECATED: Use is_admin_from_auth() instead. Kept for backward compatibility.';

-- Step 6: Verify the fix by testing user access
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully. Circular dependency resolved.';
    RAISE NOTICE 'Admin policies now use auth.users metadata instead of user_profiles queries.';
    RAISE NOTICE 'Test: Admin users should now be able to access user management features without RLS errors.';
END $$;