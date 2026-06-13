import { supabase } from '../lib/supabase';

const BUCKET_NAME = "proof-of-work";

export const uploadProfileMedia = async (
    uid: string,
    fileUri: string,
    folder: 'logo' | 'cover' | 'gallery'
): Promise<string> => {
    try {
        const isPng = fileUri.toLowerCase().endsWith('.png');
        const extension = isPng ? 'png' : 'jpg';
        const mimeType = isPng ? 'image/png' : 'image/jpeg';
        const filePath = `${uid}/${folder}/${Date.now()}.${extension}`;

        const fileResponse = await fetch(fileUri);
        const blob = await fileResponse.blob();

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, blob, {
                contentType: blob.type && blob.type !== 'application/octet-stream' ? blob.type : mimeType,
                upsert: false,
            });

        if (error) throw error;

        const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error(`Error uploading ${folder}:`, error);
        throw error;
    }
};
