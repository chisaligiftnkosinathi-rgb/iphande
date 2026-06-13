import { supabase } from '../lib/supabase';

export const uploadPaymentProof = async (
    uid: string,
    fileUri: string,
    fileName: string
): Promise<string> => {
    try {
        const timestamp = Date.now();
        const safeFileName = fileName.replace(/\s+/g, '-').toLowerCase();
        const filePath = `payment-proofs/${uid}/${timestamp}-${safeFileName}`;

        const fileExt = safeFileName.split('.').pop()?.toLowerCase();
        const contentType =
            fileExt === 'png'
                ? 'image/png'
                : fileExt === 'jpg' || fileExt === 'jpeg'
                    ? 'image/jpeg'
                    : 'application/octet-stream';

        const fileResponse = await fetch(fileUri);
        const blob = await fileResponse.blob();

        const { error } = await supabase.storage
            .from('proof-of-work')
            .upload(filePath, blob, {
                contentType,
                upsert: false,
            });

        if (error) throw error;

        const { data } = supabase.storage
            .from('proof-of-work')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading payment proof:', error);
        throw error;
    }
};
