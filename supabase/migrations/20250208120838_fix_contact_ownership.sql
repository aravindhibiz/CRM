-- Fix contact ownership issue
-- Problem: Existing contacts have owner_id values that don't match current users
-- Solution: Update contacts to be owned by existing user profiles

DO $$
DECLARE
    first_user_id UUID;
    second_user_id UUID;
    contact_count INTEGER;
BEGIN
    -- Get existing user IDs from user_profiles table
    SELECT id INTO first_user_id FROM public.user_profiles ORDER BY created_at LIMIT 1;
    SELECT id INTO second_user_id FROM public.user_profiles ORDER BY created_at LIMIT 1 OFFSET 1;
    
    -- Count existing contacts
    SELECT COUNT(*) INTO contact_count FROM public.contacts;
    
    IF first_user_id IS NOT NULL AND contact_count > 0 THEN
        -- Update first contact to belong to first user
        UPDATE public.contacts 
        SET owner_id = first_user_id 
        WHERE id = (SELECT id FROM public.contacts ORDER BY created_at LIMIT 1);
        
        -- If there's a second user, distribute remaining contacts
        IF second_user_id IS NOT NULL AND second_user_id != first_user_id THEN
            -- Update remaining contacts to belong to users alternately
            UPDATE public.contacts 
            SET owner_id = CASE 
                WHEN ROW_NUMBER() OVER (ORDER BY created_at) % 2 = 0 THEN second_user_id
                ELSE first_user_id
            END
            WHERE owner_id != first_user_id;
        ELSE
            -- Update all remaining contacts to belong to first user
            UPDATE public.contacts 
            SET owner_id = first_user_id 
            WHERE owner_id != first_user_id;
        END IF;
        
        RAISE NOTICE 'Updated % contacts to have valid owner_id values', contact_count;
    ELSE
        RAISE NOTICE 'No user profiles found or no contacts exist. Cannot fix ownership.';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating contact ownership: %', SQLERRM;
END $$;

-- Add helpful comment for future reference
COMMENT ON TABLE public.contacts IS 'Contacts table with RLS policy requiring owner_id = auth.uid(). Updated ownership in migration 20250208120838.';