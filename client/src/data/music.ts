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
    id: "lofi",
    name: "Lo-fi Focus",
    tracks: [
      {
        id: "t1",
        title: "Cafe Focus Lofi Beats",
        artist: "Lofi Jazz Terrace",
        genre: "Lo-fi",
        duration: 203,
        src: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c9/d0/93/c9d093e1-3e68-d549-5e3c-1a9f64278fe8/mzaf_4642192532866473385.plus.aac.p.m4a",
        cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/51/d5/b7/51d5b74f-2423-43cb-9376-655cf669079e/4550795087947_cover.jpg/400x400bb.jpg",
        isPreview: true,
      },
      {
        id: "t2",
        title: "Espresso Morning Jazz Beats",
        artist: "Lofi Jazz Terrace",
        genre: "Lo-fi",
        duration: 174,
        src: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/4d/e4/ca/4de4caf5-d529-5aaf-8ddd-0b2802bea43b/mzaf_9265399535109872864.plus.aac.p.m4a",
        cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/51/d5/b7/51d5b74f-2423-43cb-9376-655cf669079e/4550795087947_cover.jpg/400x400bb.jpg",
        isPreview: true,
      },
      {
        id: "t3",
        title: "Cafe Chill Beats",
        artist: "Creamy Panda",
        genre: "Lo-fi",
        duration: 151,
        src: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c6/ca/b3/c6cab358-8bd9-c9eb-78b1-e9d9b24d7b88/mzaf_4550525515756835011.plus.aac.p.m4a",
        cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f4/08/92/f4089263-8485-0e4c-688a-3f3b93a5ff7d/4550795560600_cover.png/400x400bb.jpg",
        isPreview: true,
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
        duration: 188,
        src: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/72/6e/53/726e5378-97ff-c63c-af17-aeb9f4a185df/mzaf_11070341839405879292.plus.aac.p.m4a",
        cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/c9/9e/ee/c99eee4f-23ff-cd0b-a35d-87482dbbd631/rls00108652.jpg/400x400bb.jpg",
        isPreview: true,
      },
      {
        id: "t5",
        title: "Freestyler (Synth Retro Beat)",
        artist: "Aries Beats",
        genre: "Synthwave",
        duration: 252,
        src: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/bc/45/b1/bc45b1ec-8b86-cc6f-a73c-fcb7493a24ba/mzaf_11040802461335981372.plus.aac.p.m4a",
        cover: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/80/28/cc/8028cca3-8641-0304-f469-3bcdbcc82f33/4050215702370.jpg/400x400bb.jpg",
        isPreview: true,
      },
      {
        id: "t6",
        title: "Retro Wave",
        artist: "Synthwave Nation",
        genre: "Synthwave",
        duration: 69,
        src: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/af/f9/ef/aff9efdc-2f3f-a672-8c0b-c0a67fd5c7fb/mzaf_9820658369298347795.plus.aac.p.m4a",
        cover: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/cd/88/a6/cd88a6ba-4cb1-8f75-c0c8-003d2a7bd49d/11937.jpg/400x400bb.jpg",
        isPreview: true,
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
        duration: 153,
        src: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/54/35/e9/5435e963-cea7-435c-6f79-e5bd9d80779a/mzaf_5276581093914584798.plus.aac.p.m4a",
        cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/e9/d0/99/e9d099a8-7ebd-d1d0-b232-2ed017d32035/055120361616.png/400x400bb.jpg",
        isPreview: true,
      },
      {
        id: "t8",
        title: "Acoustic Morning",
        artist: "Jazz Guitar Music Zone",
        genre: "Chill",
        duration: 156,
        src: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e7/a7/ce/e7a7ce2c-2f28-30c0-db1d-b14c99ce7c0f/mzaf_6358069312631873878.plus.aac.p.m4a",
        cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e0/74/93/e07493ac-cc74-d4e1-2a61-7a05287f937e/cover.jpg/400x400bb.jpg",
        isPreview: true,
      },
      {
        id: "t9",
        title: "Wild Horses",
        artist: "Acoustic Guitar Chill",
        genre: "Chill",
        duration: 197,
        src: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/b9/77/8b/b9778bab-c3c2-fc21-9564-fe866490bac0/mzaf_18180449607820326137.plus.aac.p.m4a",
        cover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/e9/d0/99/e9d099a8-7ebd-d1d0-b232-2ed017d32035/055120361616.png/400x400bb.jpg",
        isPreview: true,
      },
    ],
  },
];
