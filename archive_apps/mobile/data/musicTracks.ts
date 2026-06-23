export interface MusicTrack {
    id: string;
    title: string;
    album?: string;
    caption: string;
    description: string;
    originStory?: string;
    duration?: string;
    uri: any;
    origin: 'system_curated';
    visibility: 'public';
    usage: 'listened_only';
    createdDate?: string;
    replayTags?: string[];
}

export const MUSIC_TRACKS: MusicTrack[] = [
    {
        id: 'a_song_1',
        title: 'Dreams Bigger Than Home',
        album: 'Dreams Bigger Than Home',
        caption: 'A song of origin, memory, and stewardship — reminding the steward why the work must continue.',
        description: 'Reflective arrangement for grounding and intentionality.',
        originStory: 'Inspired by the invisible builders of the past.',
        duration: '04:12',
        uri: require('../../assets/audio/Track 01 - Dreams Bigger Than Home.mp3'),
        origin: 'system_curated',
        visibility: 'public',
        usage: 'listened_only',
        createdDate: '2026-06-01',
        replayTags: ['hope', 'continuity', 'family', 'stewardship', 'future']
    },
    {
        id: 'a_song_2',
        title: 'The People Who Were Hidden',
        album: 'Dreams Bigger Than Home',
        caption: 'A song for overlooked people whose work, pain, skill, and sacrifice were present but unseen by systems.',
        description: 'Introducing the hustlers, mechanics, and honest workers who remain unseen.',
        originStory: 'The world was full of skill… but invisible.',
        duration: '03:45',
        uri: require('../../assets/audio/Track 02 -  The People Who Were Hidden.mp3'),
        origin: 'system_curated',
        visibility: 'public',
        usage: 'listened_only',
        createdDate: '2026-06-01',
        replayTags: ['hidden', 'visibility', 'workers', 'dignity', 'community']
    },
    {
        id: 'a_song_3',
        title: 'Algorithms Don\'t Know My Mother',
        album: 'Dreams Bigger Than Home',
        caption: 'A reflection on visibility and why human stories matter beyond the digital noise.',
        description: 'Honoring the dignity of work that goes unseen by modern systems.',
        originStory: 'A response to the realization that modern systems value engagement more than truth.',
        duration: '03:20',
        uri: require('../../assets/audio/Track 03 -  Algorithms Don’t Know My Mother.mp3'),
        origin: 'system_curated',
        visibility: 'public',
        usage: 'listened_only',
        createdDate: '2026-06-01',
        replayTags: ['visibility', 'truth', 'dignity', 'humanity', 'mothers']
    },
    {
        id: 'a_song_4',
        title: 'The Builders',
        album: 'Dreams Bigger Than Home',
        caption: 'A tribute to stewardship and honoring those who built before us.',
        description: 'Recognizing the quiet, unseen labor that holds communities and civilization together.',
        originStory: 'Dedicated to the ordinary people who keep building truthfully.',
        duration: '04:05',
        uri: require('../../assets/audio/Track 04 -  The Builders.mp3'),
        origin: 'system_curated',
        visibility: 'public',
        usage: 'listened_only',
        createdDate: '2026-06-01',
        replayTags: ['stewardship', 'labor', 'builders', 'legacy', 'community']
    }
];
