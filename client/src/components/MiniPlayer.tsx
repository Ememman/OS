import { useState, useEffect } from "react";
import { usePlayer } from "../store/usePlayer";
import { useOS } from "../store/useOS";
import { useIsMobile } from "../lib/useMediaQuery";
import EqualizerBars from "./EqualizerBars";
import {
  GIconPlay,
  GIconPause,
  GIconBackward,
  GIconForward,
  GIconMusic,
  GIconMinus,
  GIconClose,
  GIconChevronDown,
  GIconChevronUp,
} from "./icons/GravityIcons";

export default function MiniPlayer() {
  const { queue, queueIdx, playing, togglePlay, next, prev } = usePlayer();
  const { windows, openApp, osMode } = useOS();
  const isMobile = useIsMobile();
  const track = queue[queueIdx];

  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Re-arm player when track changes
  useEffect(() => {
    setIsDismissed(false);
  }, [track?.id, track?.title]);

  const musicWin = windows.find((w) => w.app === "music");
  const musicVisible = musicWin && !musicWin.minimized;

  // Only surface when there is an active track, music window isn't currently open, and not dismissed
  if (!track || musicVisible || isDismissed) return null;

  const bottomClearance = osMode === "win" ? "bottom-[76px]" : "bottom-20";

  // Minimized state: sleek floating disc/pill that never obstructs content
  if (isMinimized) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsMinimized(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsMinimized(false);
          }
        }}
        className={`fixed ${
          isMobile
            ? "top-11 right-3"
            : `${bottomClearance} left-1/2 -translate-x-1/2`
        } z-[850] glass rounded-full border border-white/20 shadow-2xl pl-1.5 pr-2.5 py-1.5 flex items-center gap-2 backdrop-blur-xl transition-all duration-200 cursor-pointer select-none hover:border-white/35 active:scale-95`}
        title={`${track.title} · ${track.artist} (Click to expand)`}
        aria-label="Expand music player"
      >
        <div
          className={`w-7 h-7 rounded-full overflow-hidden bg-white/10 shrink-0 relative flex items-center justify-center ${
            playing ? "ring-2 ring-accent/80" : ""
          }`}
        >
          {track.cover ? (
            <img src={track.cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <GIconMusic size={12} className="text-white/60" />
          )}
        </div>

        {playing && <EqualizerBars className="shrink-0" />}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="w-6 h-6 rounded-full flex items-center justify-center bg-accent text-white shadow-md shadow-accent/30 hover:brightness-110 active:scale-90 transition cursor-pointer"
          title={playing ? "Pause" : "Play"}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <GIconPause size={10} /> : <GIconPlay size={10} className="ml-0.5" />}
        </button>

        <span className="text-white/60 hover:text-white transition">
          {isMobile ? <GIconChevronDown size={11} /> : <GIconChevronUp size={11} />}
        </span>
      </div>
    );
  }

  // Expanded state: full controls with minimize and dismiss actions
  return (
    <div
      role="region"
      aria-label="Floating Music Player"
      className={`fixed ${
        isMobile
          ? "top-11 left-1/2 -translate-x-1/2"
          : `${bottomClearance} left-1/2 -translate-x-1/2`
      } z-[850] glass rounded-2xl border border-white/15 shadow-2xl pl-2.5 pr-2.5 py-2 flex items-center gap-2 sm:gap-2.5 backdrop-blur-xl transition-all duration-200 max-w-[calc(100vw-24px)] select-none`}
    >
      {/* Cover / Open app button */}
      <button
        type="button"
        onClick={() => openApp("music")}
        className={`w-8 h-8 rounded-lg overflow-hidden bg-white/5 shrink-0 relative cursor-pointer group ${
          playing ? "ring-2 ring-accent/60" : ""
        }`}
        title="Open Music app"
        aria-label="Open Music app"
      >
        {track.cover ? (
          <img src={track.cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <GIconMusic size={14} className="text-white/40" />
          </div>
        )}
      </button>

      {/* Track Info */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => openApp("music")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openApp("music");
          }
        }}
        className="text-left min-w-0 max-w-[110px] sm:max-w-44 cursor-pointer"
        title="Open Music app"
      >
        <div className="flex items-center gap-1.5">
          <div className="text-[11px] font-medium truncate text-white/95">{track.title}</div>
          {playing && <EqualizerBars className="shrink-0" />}
        </div>
        <div className="text-[9px] text-white/50 truncate leading-tight">{track.artist}</div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={prev}
          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-colors text-white/70 hover:text-white cursor-pointer"
          title="Previous Track"
          aria-label="Previous Track"
        >
          <GIconBackward size={11} />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-accent hover:brightness-110 active:scale-95 transition text-white shadow-md shadow-accent/30 cursor-pointer"
          title={playing ? "Pause" : "Play"}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <GIconPause size={12} /> : <GIconPlay size={12} className="ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={next}
          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-colors text-white/70 hover:text-white cursor-pointer"
          title="Next Track"
          aria-label="Next Track"
        >
          <GIconForward size={11} />
        </button>
      </div>

      {/* Subtle Divider */}
      <div className="w-px h-5 bg-white/15 mx-0.5" />

      {/* Minimize & Close Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={() => setIsMinimized(true)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:scale-90 transition cursor-pointer"
          title="Minimize player"
          aria-label="Minimize player"
        >
          <GIconMinus size={11} />
        </button>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-rose-400 hover:bg-white/10 active:scale-90 transition cursor-pointer"
          title="Dismiss player"
          aria-label="Dismiss player"
        >
          <GIconClose size={11} />
        </button>
      </div>
    </div>
  );
}
