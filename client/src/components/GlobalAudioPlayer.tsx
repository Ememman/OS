import { useEffect, useRef } from "react";
import { usePlayer } from "../store/usePlayer";

export default function GlobalAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { queue, queueIdx, playing, volume, registerAudioEl, setProgress, setDuration, next } = usePlayer();
  const track = queue[queueIdx];

  useEffect(() => {
    if (audioRef.current) {
      registerAudioEl(audioRef.current);
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [registerAudioEl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !track?.src) return;

    if (playing) {
      const playPromise = a.play();
      if (playPromise !== undefined) {
        playPromise.catch((err: any) => {
          if (err?.name !== "AbortError") {
            console.warn("Audio playback failed:", err);
            usePlayer.setState({ playing: false });
          }
        });
      }
    } else {
      a.pause();
    }
  }, [playing, track?.src]);

  return (
    <audio
      ref={audioRef}
      src={track?.src}
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
        if (!track?.src) return;
        console.warn("Track failed to load:", track?.title);
      }}
      className="hidden"
    />
  );
}
