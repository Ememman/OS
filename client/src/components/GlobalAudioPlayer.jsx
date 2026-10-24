import { useEffect, useRef } from "react";
import { usePlayer } from "../store/usePlayer";

export default function GlobalAudioPlayer() {
  const audioRef = useRef(null);
  const { queue, queueIdx, playing, volume, registerAudioEl, setProgress, setDuration, next } = usePlayer();
  const track = queue[queueIdx];

  useEffect(() => {
    registerAudioEl(audioRef.current);
  }, [registerAudioEl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !track) return;
    if (playing) a.play().catch(() => usePlayer.setState({ playing: false }));
    else a.pause();
    // Intentionally re-runs on `track` too — a new track means a new `src`,
    // and we want it to auto-play immediately when the queue advances.
  }, [playing, track]);

  return (
    <audio
      ref={audioRef}
      src={track?.src}
      crossOrigin="anonymous"
      onTimeUpdate={(e) => setProgress(e.target.currentTime)}
      onLoadedMetadata={(e) => setDuration(e.target.duration)}
      onEnded={next}
      className="hidden"
    />
  );
}
