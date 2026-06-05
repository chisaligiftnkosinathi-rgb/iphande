export interface MusicTrack {
    id: string;
    title: string;
    description: string;
    uri: string;
    origin: 'system_curated';
    visibility: 'public';
    usage: 'listened_only';
}

export const MUSIC_TRACKS: MusicTrack[] = [
    {
        id: 'track_1',
        title: 'Roots of Continuity',
        description: 'A reflective ambient piece to encourage truthful and diligent stewardship.',
        uri: 'https://example.com/audio/roots-of-continuity.mp3', // Placeholder until actual assets are hosted
        origin: 'system_curated',
        visibility: 'public',
        usage: 'listened_only'
    }
];
