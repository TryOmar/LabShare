import { createClient } from "@/lib/supabase/server";

/**
 * Storage helper functions for submission attachments
 */

/**
 * Upload a file to the submission-attachments bucket
 * @param submissionId - The submission ID
 * @param filename - The filename
 * @param fileBuffer - The file data as Buffer (raw binary, not ArrayBuffer)
 * @param mimeType - The MIME type of the file
 * @returns The storage path if successful, or error
 */
export async function uploadAttachment(
  submissionId: string,
  filename: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ path: string } | { error: string }> {
  try {
    // Use anon client with RLS policies
    // API route validates ownership, so this is safe
    // Service role was causing signature verification issues
    const supabase = await createClient();
    
    // Sanitize filename to prevent path traversal
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `submissions/${submissionId}/${sanitizedFilename}`;

    // Convert Buffer to Uint8Array for Supabase Storage
    // Supabase Storage client expects ArrayBuffer, Uint8Array, or Blob
    const uint8Array = new Uint8Array(fileBuffer);

    // Upload using Supabase Storage client with anon key
    // RLS policies allow uploads to submission folders
    // API route validates ownership before calling this function
    const { data, error } = await supabase.storage
      .from('submission-attachments')
      .upload(filePath, uint8Array, {
        contentType: mimeType,
        upsert: false,
        cacheControl: '3600',
      });

    if (error) {
      console.error('Error uploading file:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return { error: error.message || 'Failed to upload file' };
    }

    if (!data) {
      return { error: 'Upload succeeded but no data returned' };
    }

    return { path: filePath };
  } catch (err: any) {
    console.error('Unexpected error in uploadAttachment:', err);
    return { error: err.message || 'Unexpected error during upload' };
  }
}

/**
 * Generate a signed URL for downloading an attachment
 * @param filePath - The storage path of the file
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns The signed URL or null if error
 */
export async function getAttachmentDownloadUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from('submission-attachments')
    .createSignedUrl(filePath, expiresIn);

  if (error || !data) {
    console.error('Error creating signed URL:', error);
    return { error: error?.message || 'Failed to create download URL' };
  }

  return { url: data.signedUrl };
}

/**
 * Delete an attachment from storage using SQL function
 * @param filePath - The storage path of the file to delete
 * @returns Success or error
 */
export async function deleteAttachment(
  filePath: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc('delete_storage_file', {
      bucket_name: 'submission-attachments',
      file_path: filePath
    });
    
    if (error) {
      return { error: error.message };
    }
    
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to delete file' };
  }
}

/**
 * Delete specific files from storage by their paths using SQL function
 * @param filePaths - Array of storage paths to delete
 * @returns Success or error
 */
export async function deleteSubmissionFiles(
  filePaths: string[]
): Promise<{ success: boolean } | { error: string }> {
  if (!filePaths || filePaths.length === 0) {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    
    // Delete files using SQL function (bypasses RLS)
    await Promise.all(
      filePaths.map(filePath =>
        supabase.rpc('delete_storage_file', {
          bucket_name: 'submission-attachments',
          file_path: filePath
        })
      )
    );
    
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting files:', err);
    return { error: err.message || 'Failed to delete files' };
  }
}

/**
 * Delete all files in a submission folder from storage using SQL function
 * @param submissionId - The submission ID
 * @returns Success or error
 */
export async function deleteSubmissionFolder(
  submissionId: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    const folderPath = `submissions/${submissionId}`;
    const supabase = await createClient();
    
    // List files in the folder
    const { data: files, error: listError } = await supabase.storage
      .from('submission-attachments')
      .list(folderPath, { limit: 1000 });
    
    if (listError) {
      return { error: listError.message };
    }
    
    if (!files || files.length === 0) {
      return { success: true };
    }
    
    // Delete all files using SQL function
    const filePaths = files.map(file => `${folderPath}/${file.name}`);
    await Promise.all(
      filePaths.map(filePath =>
        supabase.rpc('delete_storage_file', {
          bucket_name: 'submission-attachments',
          file_path: filePath
        })
      )
    );
    
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting folder:', err);
    return { error: err.message || 'Failed to delete folder' };
  }
}

/**
 * Get file metadata from storage
 * @param filePath - The storage path of the file
 * @returns File metadata or null if error
 */
export async function getAttachmentMetadata(
  filePath: string
): Promise<{ size: number; mimeType: string; lastModified: string } | { error: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from('submission-attachments')
    .list(filePath.split('/').slice(0, -1).join('/'), {
      search: filePath.split('/').pop() || '',
    });

  if (error || !data || data.length === 0) {
    return { error: error?.message || 'File not found' };
  }

  const file = data[0];
  return {
    size: file.metadata?.size || 0,
    mimeType: file.metadata?.mimetype || 'application/octet-stream',
    lastModified: file.updated_at || file.created_at || new Date().toISOString(),
  };
}

