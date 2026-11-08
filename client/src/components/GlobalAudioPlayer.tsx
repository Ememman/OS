import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../store/usePlayer";
import { resolveAudioSrc } from "../lib/audioUrl";

export default function GlobalAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { queue, queueIdx, playing, volume, registerAudioEl, setProgress, setDuration, next } = usePlayer();
  const track = queue[queueIdx];
  const [activeSrc, setActiveSrc] = useState<string>("");

  useEffect(() => {
    if (audioRef.current) {
      registerAudioEl(audioRef.current);
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
      audioRef.current.muted = false;
    }
  }, [registerAudioEl, volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
      audioRef.current.muted = false;
    }
  }, [volume]);

  // Resolve audio source (converts remote Apple streams into safe audio/mp4 Blobs
  // so Windows Media Foundation never silences them as DRM audio/x-m4p)
  useEffect(() => {
    if (!track?.src) {
      setActiveSrc("");
      return;
    }

    let cancelled = false;
    resolveAudioSrc(track.src).then((resolved) => {
      if (!cancelled) {
        setActiveSrc(resolved);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [track?.src]);

  // Synchronize playback when active source or playing state changes
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !activeSrc) return;

    if (playing) {
      a.muted = false;
      a.volume = Math.max(0, Math.min(1, volume));
      const playPromise = a.play();
      if (playPromise !== undefined) {
        playPromise.catch((err: any) => {
          if (err?.name !== "AbortError") {
            console.warn("Audio playback failed:", err);
          }
        });
      }
    } else {
      a.pause();
    }
  }, [playing, activeSrc, volume]);

  return (
    <audio
      ref={audioRef}
      src={activeSrc || undefined}
      preload="auto"
      onTimeUpdate={(e: any) => setProgress(e.target.currentTime)}
      onLoadedMetadata={(e: any) => {
        if (e.target.duration && !Number.isNaN(e.target.duration)) {
          setDuration(e.target.duration);
        }
      }}
      onDurationChange={(e: any) => {
        if (e.target.duration && !Number.isNaN(e.target.duration)) {
          setDuration(e.target.duration);
        }
      }}
      onEnded={next}
      onError={() => {
        if (!activeSrc) return;
        console.warn("Track failed to load:", track?.title);
      }}
      className="hidden"
    />
  );
}
