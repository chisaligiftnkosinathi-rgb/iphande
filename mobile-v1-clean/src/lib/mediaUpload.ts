import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export type BucketName = 'profile-logos' | 'business-documents' | 'proof-of-work' | 'payment-proofs';

export interface UploadOptions {
    bucketName: BucketName;
    filePath: string; // Local URI from picker
    fileName: string;
    mimeType: string;
}

/**
 * Uploads a file directly to Supabase Storage.
 * Must be used by an authenticated user.
 */
export async function uploadToSupabaseStorage({ bucketName, filePath, fileName, mimeType }: UploadOptions): Promise<string> {
    try {
        // Read file as base64 string
        const base64 = await FileSystem.readAsStringAsync(filePath, { encoding: FileSystem.EncodingType.Base64 });
        
        // Supabase requires ArrayBuffer for React Native base64 uploads
        const arrayBuffer = decode(base64);

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, arrayBuffer, {
                contentType: mimeType,
                upsert: false,
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw new Error(`Failed to upload to Supabase: ${error.message}`);
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(data.path);

        return publicUrlData.publicUrl;
    } catch (e) {
        console.error('Upload utility error:', e);
        throw e;
    }
}
