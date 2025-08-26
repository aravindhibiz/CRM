import { supabase } from '../lib/supabase';

export const dealDocumentsService = {
  // Get all documents for a specific deal
  async getDealDocuments(dealId) {
    if (!dealId) {
      throw new Error('Deal ID is required');
    }

    try {
      const { data, error } = await supabase?.from('documents')?.select(`
          *,
          uploaded_by:uploaded_by(id, first_name, last_name, email)
        `)?.eq('deal_id', dealId)?.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform data for UI
      return data?.map(doc => ({
        id: doc?.id,
        name: doc?.name,
        size: this.formatFileSize(doc?.file_size),
        type: this.getFileExtension(doc?.name),
        uploadedAt: doc?.created_at,
        uploadedBy: doc?.uploaded_by ? `${doc?.uploaded_by?.first_name} ${doc?.uploaded_by?.last_name}` : 'Unknown User',
        dealId: doc?.deal_id,
        fileUrl: doc?.file_url,
        fileSize: doc?.file_size,
        fileType: doc?.file_type,
        documentType: doc?.document_type
      })) || [];
    } catch (error) {
      console.error('Error fetching deal documents:', error);
      throw error;
    }
  },

  // Upload a document to Supabase Storage and save metadata
  async uploadDocument(file, dealId, documentType = 'other') {
    try {
      const { data: user } = await supabase?.auth?.getUser();
      if (!user?.user?.id) {
        throw new Error('User must be logged in to upload documents');
      }

      if (!file || !dealId) {
        throw new Error('File and Deal ID are required');
      }

      // Create unique file path
      const timestamp = Date.now();
      const fileName = `${user?.user?.id}/${dealId}/${timestamp}-${file?.name}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase?.storage?.from('deal-documents')?.upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Save document metadata to database
      const { data, error } = await supabase?.from('documents')?.insert([{
          name: file?.name,
          file_url: uploadData?.path,
          file_size: file?.size,
          file_type: file?.type,
          document_type: documentType,
          deal_id: dealId,
          uploaded_by: user?.user?.id,
          created_at: new Date()?.toISOString()
        }])?.select(`
          *,
          uploaded_by:uploaded_by(id, first_name, last_name, email)
        `)?.single();

      if (error) {
        // Clean up uploaded file if database insert fails
        await supabase?.storage?.from('deal-documents')?.remove([uploadData?.path]);
        throw error;
      }

      // Transform data for UI
      return {
        id: data?.id,
        name: data?.name,
        size: this.formatFileSize(data?.file_size),
        type: this.getFileExtension(data?.name),
        uploadedAt: data?.created_at,
        uploadedBy: data?.uploaded_by ? `${data?.uploaded_by?.first_name} ${data?.uploaded_by?.last_name}` : 'Unknown User',
        dealId: data?.deal_id,
        fileUrl: data?.file_url,
        fileSize: data?.file_size,
        fileType: data?.file_type,
        documentType: data?.document_type
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // Delete a document from both storage and database
  async deleteDocument(documentId, filePath) {
    try {
      const { data: user } = await supabase?.auth?.getUser();
      if (!user?.user?.id) {
        throw new Error('User must be logged in to delete documents');
      }

      // Delete from storage first
      const { error: storageError } = await supabase?.storage?.from('deal-documents')?.remove([filePath]);

      if (storageError) {
        console.warn('Storage deletion failed:', storageError);
      }

      // Delete metadata from database
      const { error: dbError } = await supabase?.from('documents')?.delete()?.eq('id', documentId)?.eq('uploaded_by', user?.user?.id); // Only allow deleting own documents

      if (dbError) {
        throw dbError;
      }

      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  // Get signed URL for private document access
  async getDocumentUrl(filePath) {
    try {
      const { data, error } = await supabase?.storage?.from('deal-documents')?.createSignedUrl(filePath, 60 * 60); // 1 hour expiry

      if (error) {
        throw error;
      }

      return data?.signedUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      throw error;
    }
  },

  // Subscribe to document changes for real-time updates
  subscribeToDocumentChanges(dealId, callback) {
    if (!dealId || !callback) {
      throw new Error('Deal ID and callback are required for subscription');
    }

    const channel = supabase?.channel(`deal_documents_${dealId}`)?.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `deal_id=eq.${dealId}`
        },
        (payload) => {
          callback(payload);
        }
      )?.subscribe();

    return channel;
  },

  // Unsubscribe from document changes
  unsubscribeFromDocumentChanges(channel) {
    if (channel) {
      supabase?.removeChannel(channel);
    }
  },

  // Helper method to format file size
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(1)) + ' ' + sizes?.[i];
  },

  // Helper method to get file extension
  getFileExtension(filename) {
    if (!filename) return 'unknown';
    
    const extension = filename?.split('.')?.pop()?.toLowerCase();
    return extension || 'unknown';
  },

  // Helper method to get file icon based on type
  getFileIcon(filename) {
    const extension = this.getFileExtension(filename);
    const iconMap = {
      pdf: 'FileText',
      doc: 'FileText',
      docx: 'FileText',
      xls: 'FileSpreadsheet',
      xlsx: 'FileSpreadsheet',
      ppt: 'Presentation',
      pptx: 'Presentation',
      jpg: 'Image',
      jpeg: 'Image',
      png: 'Image',
      gif: 'Image',
      txt: 'FileText',
      zip: 'Archive',
      rar: 'Archive'
    };
    
    return iconMap?.[extension] || 'File';
  }
};

export default dealDocumentsService;