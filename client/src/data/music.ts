export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: number;
  src: string;
  cover: string;
  isPreview?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: MusicTrack[];
}

export const playlists: Playlist[] = [
  {
    id: "vocal",
    name: "Pop & Vocal Hits",
    tracks: [
      {
        id: "v1",
        title: "Photograph",
        artist: "Ed Sheeran",
        genre: "Pop",
        duration: 30,
        src: "/audio/v1.m4a",
        cover: "/covers/v1.jpg",
        isPreview: false,
      },
      {
        id: "v2",
        title: "Yellow",
        artist: "Coldplay",
        genre: "Alternative",
        duration: 30,
        src: "/audio/v2.m4a",
        cover: "/covers/v2.jpg",
        isPreview: false,
      },
      {
        id: "v3",
        title: "Anti-Hero",
        artist: "Taylor Swift",
        genre: "Pop",
        duration: 30,
        src: "/audio/v3.m4a",
        cover: "/covers/v3.jpg",
        isPreview: false,
      },
      {
        id: "v4",
        title: "Blinding Lights",
        artist: "The Weeknd",
        genre: "Pop",
        duration: 30,
        src: "/audio/v4.m4a",
        cover: "/covers/v4.jpg",
        isPreview: false,
      },
      {
        id: "v5",
        title: "About You",
        artist: "The 1975",
        genre: "Indie Pop",
        duration: 30,
        src: "/audio/v5.m4a",
        cover: "/covers/v5.jpg",
        isPreview: false,
      },
    ],
  },
  {
    id: "lofi",
    name: "Lo-fi Focus",
    tracks: [
      {
        id: "t1",
        title: "Cafe Focus Lofi Beats",
        artist: "Lofi Jazz Terrace",
        genre: "Lo-fi",
        duration: 30,
        src: "/audio/t1.m4a",
        cover: "/covers/c1.jpg",
        isPreview: false,
      },
      {
        id: "t2",
        title: "Espresso Morning Jazz Beats",
        artist: "Lofi Jazz Terrace",
        genre: "Lo-fi",
        duration: 30,
        src: "/audio/t2.m4a",
        cover: "/covers/c2.jpg",
        isPreview: false,
      },
      {
        id: "t3",
        title: "Cafe Chill Beats",
        artist: "Creamy Panda",
        genre: "Lo-fi",
        duration: 30,
        src: "/audio/t3.m4a",
        cover: "/covers/c3.jpg",
        isPreview: false,
      },
    ],
  },
  {
    id: "synth",
    name: "Synthwave",
    tracks: [
      {
        id: "t4",
        title: "Synthwave Piano (Space Wave Mix)",
        artist: "Aries Beats",
        genre: "Synthwave",
        duration: 30,
        src: "/audio/t4.m4a",
        cover: "/covers/c4.jpg",
        isPreview: false,
      },
      {
        id: "t5",
        title: "Freestyler (Synth Retro Beat)",
        artist: "Aries Beats",
        genre: "Synthwave",
        duration: 30,
        src: "/audio/t5.m4a",
        cover: "/covers/c5.jpg",
        isPreview: false,
      },
      {
        id: "t6",
        title: "Retro Wave",
        artist: "Synthwave Nation",
        genre: "Synthwave",
        duration: 30,
        src: "/audio/t6.m4a",
        cover: "/covers/c6.jpg",
        isPreview: false,
      },
    ],
  },
  {
    id: "chill",
    name: "Acoustic & Chill",
    tracks: [
      {
        id: "t7",
        title: "Yellowstone",
        artist: "Acoustic Guitar Chill",
        genre: "Chill",
        duration: 30,
        src: "/audio/t7.m4a",
        cover: "/covers/c7.jpg",
        isPreview: false,
      },
      {
        id: "t8",
        title: "Acoustic Morning",
        artist: "Jazz Guitar Music Zone",
        genre: "Chill",
        duration: 30,
        src: "/audio/t8.m4a",
        cover: "/covers/c8.jpg",
        isPreview: false,
      },
      {
        id: "t9",
        title: "Wild Horses",
        artist: "Acoustic Guitar Chill",
        genre: "Chill",
        duration: 30,
        src: "/audio/t9.m4a",
        cover: "/covers/c9.jpg",
        isPreview: false,
      },
    ],
  },
];
