import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

export const uploadWorkProof = async (uid: string, jobId: string, fileUri: string, fileName: string): Promise<string> => {
    try {
        const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
        const timestamp = Date.now();

        const filePath = `jobs/${uid}/${jobId}/${timestamp}-${fileName}`;
        const fileExt = fileName.split('.').pop()?.toLowerCase();
        const contentType = fileExt === 'png' ? 'image/png' : (fileExt === 'jpg' || fileExt === 'jpeg' ? 'image/jpeg' : 'application/octet-stream');

        const { error } = await supabase.storage
            .from('proof-of-work')
            .upload(filePath, decode(base64), {
                contentType,
                upsert: false,
            });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
            .from('proof-of-work')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    } catch (error) {
        console.error("Error uploading work proof:", error);
        throw error;
    }
};
