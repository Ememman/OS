import { Play, Pause, SkipBack, SkipForward, Music2 } from "lucide-react";
import { usePlayer } from "../store/usePlayer";
import { useOS } from "../store/useOS";
import EqualizerBars from "./EqualizerBars";

export default function MiniPlayer() {
  const { queue, queueIdx, playing, togglePlay, next, prev } = usePlayer();
  const { windows, openApp, osMode } = useOS();
  const track = queue[queueIdx];

  const musicWin = windows.find((w) => w.app === "music");
  const musicVisible = musicWin && !musicWin.minimized;

  // Only surface this when there's actually something to show for it — a
  // track loaded, and the Music window itself isn't already visible (it has
  // its own full player bar in that case, no need to duplicate it).
  if (!track || musicVisible) return null;

  const bottomClearance = osMode === "win" ? "bottom-[76px]" : "bottom-20 sm:bottom-20";

  return (
    <button
      onClick={() => openApp("music")}
      className={`absolute ${bottomClearance} left-1/2 -translate-x-1/2 z-[850] glass rounded-2xl border border-white/10 shadow-2xl pl-2 pr-3 py-2 flex items-center gap-2.5 hover:border-white/25 transition-colors reveal-fade max-w-[calc(100vw-24px)]`}
      title="Reopen Music"
    >
      <div className={`w-8 h-8 rounded-lg overflow-hidden bg-white/5 shrink-0 relative ${playing ? "ring-2 ring-accent/60" : ""}`}>
        {track.cover ? (
          <img src={track.cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Music2 size={14} className="text-white/40" /></div>
        )}
      </div>
      <div className="text-left min-w-0 max-w-[120px] sm:max-w-[160px]">
        <div className="flex items-center gap-1.5">
          <div className="text-[11px] font-medium truncate">{track.title}</div>
          {playing && <EqualizerBars className="shrink-0" />}
        </div>
        <div className="text-[9px] text-white/45 truncate">{track.artist}</div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button onClick={prev} className="p-1 hover:bg-white/10 rounded-full transition-colors" title="Previous">
          <SkipBack size={11} />
        </button>
        <button onClick={togglePlay} className="p-1.5 bg-accent rounded-full hover:brightness-110 active:scale-95 transition" title={playing ? "Pause" : "Play"}>
          {playing ? <Pause size={11} /> : <Play size={11} />}
        </button>
        <button onClick={next} className="p-1 hover:bg-white/10 rounded-full transition-colors" title="Next">
          <SkipForward size={11} />
        </button>
      </div>
    </button>
  );
}
