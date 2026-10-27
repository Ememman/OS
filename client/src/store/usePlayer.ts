import { create } from "zustand";
import type { MusicTrack } from "../data/music";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

interface PlayerState {
  queue: MusicTrack[];
  queueIdx: number;
  playing: boolean;
  progress: number;
  duration: number;
  volume: number;
  audioEl: HTMLAudioElement | null;
  analyser: AnalyserNode | null;
  visualizerLive: boolean;
  _audioCtx: AudioContext | null;
  registerAudioEl: (el: HTMLAudioElement | null) => void;
  ensureVisualizer: () => void;
  playQueueAt: (queue: MusicTrack[], idx: number) => void;
  togglePlay: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  setProgress: (p: number) => void;
  setDuration: (d: number) => void;
}

// Playback state lives here instead of inside the Music app component, so
// the actual <audio> element (rendered once in App.jsx, outside any window)
// keeps playing no matter what happens to the Music window — minimized,
// closed, whatever. Only an explicit pause/stop, or the track ending, stops
// it. This is the same model Spotify/Apple Music use: the window is just a
// view into playback state that lives independently of it.
export const usePlayer = create<PlayerState>((set, get) => ({
  queue: [],
  queueIdx: 0,
  playing: false,
  progress: 0,
  duration: 0,
  volume: 0.7,
  audioEl: null, // set once by GlobalAudioPlayer on mount
  analyser: null,
  visualizerLive: false,
  _audioCtx: null,

  registerAudioEl: (el) => set({ audioEl: el }),

  // `createMediaElementSource` can only ever be called once per <audio>
  // element for its entire lifetime — call it twice and the Web Audio API
  // throws. Since the audio element is now a permanent singleton (mounted
  // once in GlobalAudioPlayer, never torn down), the analyser has to be a
  // singleton too, set up lazily on the first user-triggered play (an
  // AudioContext can't start without a user gesture).
  ensureVisualizer: () => {
    const { audioEl, analyser } = get();
    if (!audioEl) return;
    if (analyser) {
      const ctx = get()._audioCtx;
      if (ctx?.state === "suspended") ctx.resume();
      return;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const node = ctx.createAnalyser();
      node.fftSize = 64;
      const source = ctx.createMediaElementSource(audioEl);
      source.connect(node);
      node.connect(ctx.destination);
      set({ analyser: node, visualizerLive: true, _audioCtx: ctx });
    } catch {
      // CORS-restricted source (common for external catalogs) or unsupported
      // browser — playback still works, visualizer just won't get real data.
      set({ visualizerLive: false });
    }
  },

  playQueueAt: (queue, idx) => {
    set({ queue, queueIdx: idx, playing: true });
  },

  togglePlay: () => {
    const { queue, playing } = get();
    if (!queue.length) return;
    set({ playing: !playing });
  },

  pause: () => set({ playing: false }),

  next: () => {
    const { queue, queueIdx } = get();
    if (!queue.length) return;
    set({ queueIdx: (queueIdx + 1) % queue.length, playing: true });
  },

  prev: () => {
    const { queue, queueIdx } = get();
    if (!queue.length) return;
    set({ queueIdx: (queueIdx - 1 + queue.length) % queue.length, playing: true });
  },

  seek: (t) => {
    const { audioEl } = get();
    if (audioEl) audioEl.currentTime = t;
    set({ progress: t });
  },

  setVolume: (v) => set({ volume: v }),
  setProgress: (p) => set({ progress: p }),
  setDuration: (d) => set({ duration: d }),
}));
