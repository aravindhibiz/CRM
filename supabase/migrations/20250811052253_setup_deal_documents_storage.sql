-- Migration: Setup deal documents storage bucket and policies
-- Created: 2025-08-11 05:22:53

-- Create storage bucket for deal documents (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'deal-documents',
    'deal-documents',
    false, -- Private bucket for security
    10485760, -- 10MB limit
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed'
    ]
);

-- RLS Policy: Users can view documents they uploaded or that belong to their deals
CREATE POLICY "users_view_deal_documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'deal-documents' 
    AND (
        owner = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM public.deals d
            WHERE d.owner_id = auth.uid()
            AND (storage.foldername(name))[2] = d.id::text
        )
    )
);

-- RLS Policy: Authenticated users can upload to their own deal folders
CREATE POLICY "users_upload_deal_documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'deal-documents' 
    AND owner = auth.uid()
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
        SELECT 1 FROM public.deals d
        WHERE d.owner_id = auth.uid()
        AND d.id::text = (storage.foldername(name))[2]
    )
);

-- RLS Policy: Users can update their own document files
CREATE POLICY "users_update_deal_documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'deal-documents' 
    AND owner = auth.uid()
)
WITH CHECK (
    bucket_id = 'deal-documents' 
    AND owner = auth.uid()
);

-- RLS Policy: Users can delete their own document files
CREATE POLICY "users_delete_deal_documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'deal-documents' 
    AND owner = auth.uid()
);

-- Add comment for documentation
COMMENT ON POLICY "users_view_deal_documents" ON storage.objects IS 
'Allows users to view documents they uploaded or documents in deals they own';

COMMENT ON POLICY "users_upload_deal_documents" ON storage.objects IS 
'Allows authenticated users to upload documents to their own deal folders with format: user_id/deal_id/filename';

COMMENT ON POLICY "users_update_deal_documents" ON storage.objects IS 
'Allows users to update metadata of documents they uploaded';

COMMENT ON POLICY "users_delete_deal_documents" ON storage.objects IS 
'Allows users to delete documents they uploaded';