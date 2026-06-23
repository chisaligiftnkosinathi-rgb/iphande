// Governed registry and vocabulary for sensory continuity (Media)
// Media preserves context. It does not manufacture proof.

export type MediaSemanticFamily =
    | 'image' | 'photograph' | 'thumbnail' | 'poster' | 'artwork' | 'diagram'
    | 'audio' | 'voice_note' | 'music'
    | 'video'
    | 'document_attachment';

export type MediaOrigin =
    | 'STEWARD_UPLOADED' | 'STEWARD_RECORDED' | 'SYSTEM_GENERATED'
    | 'AI_ASSISTED' | 'REPLAY_BOUND' | 'EXTERNAL_LINKED';

export type MediaAuthenticityState =
    | 'DECLARED' | 'UNVERIFIED' | 'EVIDENCE_SUPPORTED'
    | 'AI_ASSISTED' | 'DERIVED';

export type MediaVisibility = 'PUBLIC' | 'STEWARD_ONLY' | 'LINEAGE_RESTRICTED';

export type MediaBindingMode =
    | 'LOOSE_CONTEXT'    // Profile banners, general marketing
    | 'STRICT_EVIDENCE'  // Invoices, proofs, completion photos
    | 'DOCUMENT_EMBED'   // Embedded into a PDF or Scroll
    | 'TIMELINE_ANCHOR'; // Directly attached to a replay event

export type MediaRetentionPolicy = 'INDEFINITE_APPEND_ONLY' | 'SOFT_ARCHIVABLE';

export interface MediaTemporalContext {
    capturedAt?: string | null;
    uploadedAt: string;
    replayBoundAt?: string | null;
    modifiedAt?: string | null;
    aiEnhancedAt?: string | null;
}

export interface MediaIntegrityLayer {
    fileHash: string;
    mimeType: string;
    byteSize: number;
    transformationHistory: string[]; // e.g., ['cropped', 'color_corrected']
    compressionHistory: string[];    // e.g., ['original_heic', 'compressed_jpeg_85']
    derivativeChain: string[];       // Array of parent media IDs if this is a derived artifact (e.g., thumbnail)
}

export interface MediaPreservationStandard {
    standardKey: string;             // e.g., 'PREMIS', 'ISO-14721', 'Dublin Core'
    appliedDiscipline: string;       // e.g., 'Dictates cryptographic hashing and transformation logging.'
}

export interface MediaTypeDefinition {
    typeKey: string;
    semanticFamily: MediaSemanticFamily;
    allowedOrigins: MediaOrigin[];
    defaultVisibility: MediaVisibility;
    defaultBinding: MediaBindingMode;
    retention: MediaRetentionPolicy;
    governanceBoundary: string;
}

export const MEDIA_TYPE_REGISTRY: MediaTypeDefinition[] = [
    {
        typeKey: 'MED-PHOTO-001',
        semanticFamily: 'photograph',
        allowedOrigins: ['STEWARD_UPLOADED', 'STEWARD_RECORDED'],
        defaultVisibility: 'LINEAGE_RESTRICTED',
        defaultBinding: 'STRICT_EVIDENCE',
        retention: 'INDEFINITE_APPEND_ONLY',
        governanceBoundary: 'Image provides physical context. It does not independently verify the commercial or spiritual claim.'
    },
    {
        typeKey: 'MED-VOICE-001',
        semanticFamily: 'voice_note',
        allowedOrigins: ['STEWARD_RECORDED', 'STEWARD_UPLOADED'],
        defaultVisibility: 'LINEAGE_RESTRICTED',
        defaultBinding: 'TIMELINE_ANCHOR',
        retention: 'INDEFINITE_APPEND_ONLY',
        governanceBoundary: 'Audio preserves human declaration. It does not guarantee the truthfulness or fulfillment of the intent.'
    },
    {
        typeKey: 'MED-ART-001',
        semanticFamily: 'artwork',
        allowedOrigins: ['STEWARD_UPLOADED', 'AI_ASSISTED', 'SYSTEM_GENERATED'],
        defaultVisibility: 'PUBLIC',
        defaultBinding: 'LOOSE_CONTEXT',
        retention: 'SOFT_ARCHIVABLE',
        governanceBoundary: 'Artwork provides expression and branding. It is not factual evidence of operational continuity.'
    },
    {
        typeKey: 'MED-THUMB-001',
        semanticFamily: 'thumbnail',
        allowedOrigins: ['SYSTEM_GENERATED', 'AI_ASSISTED'],
        defaultVisibility: 'PUBLIC',
        defaultBinding: 'DOCUMENT_EMBED',
        retention: 'SOFT_ARCHIVABLE',
        governanceBoundary: 'System-generated media assists navigation. It does not substitute human curation or represent raw reality.'
    }
];
