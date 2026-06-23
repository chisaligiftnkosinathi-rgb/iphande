import { decode } from 'base64-arraybuffer';
import { supabase } from '../config/supabase';

export async function uploadProofOfWorkImage(params: {
    base64Data: string;
    ownerId: string;
    profileId: string;
    fileName?: string;
    folder?: 'logo' | 'cover' | 'gallery' | 'payments';
    contentType?: string;
}): Promise<string> {
    const {
        base64Data,
        ownerId,
        profileId,
        fileName = `proof-${Date.now()}.jpg`,
        folder = 'gallery',
        contentType = 'image/jpeg',
    } = params;

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
    const storagePath = `${ownerId}/${profileId}/${folder}/${Date.now()}-${safeFileName}`;
    console.log('[UPLOAD] Path', storagePath);

    const { data, error } = await supabase.storage
        .from('proof-of-work')
        .upload(storagePath, decode(base64Data), {
            contentType,
            upsert: false,
        });

    console.log('[UPLOAD RESULT]', data);

    if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data: publicData } = supabase.storage
        .from('proof-of-work')
        .getPublicUrl(data.path);

    return publicData.publicUrl;
}
