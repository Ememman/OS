import { create } from "zustand";
import { playlists, type MusicTrack } from "../data/music";

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

const initialTracks = playlists[0]?.tracks || [];

export const usePlayer = create<PlayerState>((set, get) => ({
  queue: initialTracks,
  queueIdx: 0,
  playing: false,
  progress: 0,
  duration: initialTracks[0]?.duration || 30,
  volume: 0.7,
  audioEl: null,
  analyser: null,
  visualizerLive: true,
  _audioCtx: null,

  registerAudioEl: (el) => {
    if (el) {
      el.volume = get().volume;
    }
    set({ audioEl: el });
  },

  ensureVisualizer: () => {
    set({ visualizerLive: true });
  },

  playQueueAt: (queue, idx) => {
    set({ queue, queueIdx: idx, playing: true });
  },

  togglePlay: () => {
    const { queue, playing, audioEl } = get();
    if (!queue.length) return;
    const nextPlaying = !playing;
    set({ playing: nextPlaying });
    if (audioEl) {
      if (nextPlaying) {
        audioEl.muted = false;
        audioEl.volume = get().volume;
        audioEl.play().catch((err: any) => {
          if (err?.name !== "AbortError") {
            console.warn("Playback error:", err);
          }
        });
      } else {
        audioEl.pause();
      }
    }
  },

  pause: () => {
    const { audioEl } = get();
    if (audioEl) audioEl.pause();
    set({ playing: false });
  },

  next: () => {
    const { queue, queueIdx } = get();
    if (!queue.length) return;
    const nextIdx = (queueIdx + 1) % queue.length;
    set({ queueIdx: nextIdx, playing: true });
  },

  prev: () => {
    const { queue, queueIdx, audioEl, progress } = get();
    if (!queue.length) return;
    if (progress > 3 && audioEl) {
      audioEl.currentTime = 0;
      set({ progress: 0 });
      return;
    }
    const prevIdx = (queueIdx - 1 + queue.length) % queue.length;
    set({ queueIdx: prevIdx, playing: true });
  },

  seek: (t) => {
    const { audioEl } = get();
    if (audioEl) audioEl.currentTime = t;
    set({ progress: t });
  },

  setVolume: (v) => {
    const safeVol = Math.max(0, Math.min(1, v));
    const { audioEl } = get();
    if (audioEl) audioEl.volume = safeVol;
    set({ volume: safeVol });
  },

  setProgress: (p) => set({ progress: p }),
  setDuration: (d) => set({ duration: d }),
}));
