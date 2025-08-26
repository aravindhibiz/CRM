-- Enable admin access to user management while maintaining security
-- This migration adds admin-specific RLS policies for user management

-- Create function to check admin role from user_profiles table
-- This is safe because it uses a pattern specifically designed for admin access
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'
)
$$;

-- Add admin policy for user_profiles to allow admins to see all users
-- This supplements the existing "users_manage_own_user_profiles" policy
CREATE POLICY "admin_can_manage_all_users"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Add admin policy for user_profiles updates (for activate/deactivate/delete)
CREATE POLICY "admin_can_update_all_users"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add admin policy for user_profiles deletion (soft delete via deactivation)
CREATE POLICY "admin_can_delete_all_users"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Add some additional sample user data to demonstrate the user management interface
DO $$
DECLARE
    sales_rep_id UUID := gen_random_uuid();
    manager_id UUID := gen_random_uuid();
BEGIN
    -- Create additional auth users with different roles for testing
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (sales_rep_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'sarah.connor@salesflow.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Sarah Connor"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (manager_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'mike.johnson@salesflow.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Mike Johnson"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Create corresponding user_profiles records
    INSERT INTO public.user_profiles (
        id, email, first_name, last_name, role, is_active, phone, territory, created_at, updated_at
    ) VALUES
        (sales_rep_id, 'sarah.connor@salesflow.com', 'Sarah', 'Connor', 'sales_rep', true, '+1-555-0123', 'West Coast', now(), now()),
        (manager_id, 'mike.johnson@salesflow.com', 'Mike', 'Johnson', 'manager', true, '+1-555-0456', 'East Coast', now(), now());

    RAISE NOTICE 'Added sample users: Sarah Connor (sales_rep) and Mike Johnson (manager)';

EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'Sample users already exist, skipping creation';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating sample users: %', SQLERRM;
END $$;

-- Add index for role-based queries to improve admin user management performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_active ON public.user_profiles(role, is_active);

-- Add comment for documentation
COMMENT ON FUNCTION public.is_admin() IS 'Checks if the current authenticated user has admin role for user management access';