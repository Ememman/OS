import { useEffect, useRef } from "react";
import { useOS, APPS } from "../store/useOS";
import { soundFx } from "../lib/soundFx";
import {
  GIconClose,
  GIconSquare,
  GIconLayoutCells,
  GIconTerminal,
  GIconLibrary,
  GIconMusic,
  GIconUpdates,
  GIconChats,
  GIconGallery,
  GIconGames,
  GIconFiles,
  GIconSettings,
  GIconResume,
  GIconNotes,
  GIconCalculator,
  GIconActivity,
  GIconBookOpen,
  GIconCode,
} from "./icons/GravityIcons";

const ICON_MAP: Record<string, any> = {
  terminal: { icon: GIconTerminal, color: "#22c55e" },
  notes: { icon: GIconNotes, color: "#f59e0b" },
  calculator: { icon: GIconCalculator, color: "#06b6d4" },
  activity: { icon: GIconActivity, color: "#10b981" },
  guestbook: { icon: GIconBookOpen, color: "#8b5cf6" },
  library: { icon: GIconLibrary, color: "#5BB8B0" },
  music: { icon: GIconMusic, color: "#D9678C" },
  updates: { icon: GIconUpdates, color: "#5FBF7C" },
  chats: { icon: GIconChats, color: "#8E7BE0" },
  gallery: { icon: GIconGallery, color: "#B8C25A" },
  games: { icon: GIconGames, color: "#D98A4E" },
  files: { icon: GIconFiles, color: "#E0B84E" },
  settings: { icon: GIconSettings, color: "#8892A6" },
  resume: { icon: GIconResume, color: "#4B5A73" },
  codeplay: { icon: GIconCode, color: "#38bdf8" },
};

export default function MissionControl() {
  const {
    missionControlOpen,
    closeMissionControl,
    windows,
    focusWindow,
    closeWindow,
    closeAllWindows,
    minimizeAllWindows,
    openApp,
    osMode,
    systemSounds,
  } = useOS();

  const isWin = osMode === "win";

  // Escape key closes Mission Control
  useEffect(() => {
    if (!missionControlOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMissionControl();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [missionControlOpen, closeMissionControl]);

  if (!missionControlOpen) return null;

  const handleSelectWindow = (id: string) => {
    if (systemSounds) soundFx.playClick();
    focusWindow(id);
    useOS.setState({
      windows: windows.map((w) => (w.id === id ? { ...w, minimized: false } : w)),
    });
    closeMissionControl();
  };

  const handleCloseSingleWindow = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    closeWindow(id);
  };

  return (
    <div
      onClick={closeMissionControl}
      className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-8 animate-fade-in select-none"
    >
      {/* Top Header */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full flex items-center justify-between border-b border-white/10 pb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
            <GIconLayoutCells size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white">
              {isWin ? "Task View" : "Mission Control"}
            </h2>
            <p className="text-xs text-white/50">
              {windows.length} {windows.length === 1 ? "window" : "windows"} open
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {windows.length > 0 && (
            <>
              <button
                onClick={() => {
                  minimizeAllWindows();
                  closeMissionControl();
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white/80 transition"
              >
                Show Desktop
              </button>
              <button
                onClick={() => {
                  closeAllWindows();
                  closeMissionControl();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs transition border border-rose-500/30"
              >
                Close All
              </button>
            </>
          )}
          <button
            onClick={closeMissionControl}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition ml-1"
            title="Close (Esc)"
          >
            <GIconClose size={16} />
          </button>
        </div>
      </div>

      {/* Middle Grid Area */}
      <div className="flex-1 flex items-center justify-center py-6 overflow-y-auto thin-scroll">
        {windows.length === 0 ? (
          /* Empty State: Suggest Apps */
          <div
            onClick={(e) => e.stopPropagation()}
            className="text-center space-y-4 max-w-md p-6 glass rounded-3xl border border-white/10"
          >
            <h3 className="text-base font-semibold text-white">No Active Windows</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Open an application from the desktop or choose one below to get started:
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {[
                { app: "resume", label: "Resume" },
                { app: "library", label: "Library" },
                { app: "codeplay", label: "CodePlay" },
                { app: "terminal", label: "Terminal" },
                { app: "notes", label: "Notes" },
                { app: "games", label: "Games" },
              ].map((item) => (
                <button
                  key={item.app}
                  onClick={() => {
                    openApp(item.app);
                    closeMissionControl();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-accent hover:text-white text-xs font-medium text-white/80 transition"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Window Tiles Grid */
          <div
            onClick={(e) => e.stopPropagation()}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-6xl max-h-[70vh] overflow-y-auto thin-scroll p-2"
          >
            {windows.map((w) => {
              const meta = ICON_MAP[w.app] || { icon: GIconSquare, color: "#888" };
              const Icon = meta.icon;

              return (
                <div
                  key={w.id}
                  onClick={() => handleSelectWindow(w.id)}
                  className="group relative flex flex-col rounded-2xl glass border border-white/15 hover:border-accent hover:shadow-2xl hover:shadow-accent/20 transition-all duration-200 cursor-pointer p-3 transform hover:-translate-y-1"
                >
                  {/* Card Title Bar */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center border border-white/10 shrink-0"
                        style={{ background: `${meta.color}30` }}
                      >
                        <Icon size={14} color={meta.color} />
                      </div>
                      <span className="text-xs font-semibold text-white truncate">
                        {w.title}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleCloseSingleWindow(e, w.id)}
                      className="opacity-60 group-hover:opacity-100 hover:bg-rose-500/30 hover:text-rose-300 p-1 rounded-lg text-white/60 transition"
                      title="Close Window"
                    >
                      <GIconClose size={12} />
                    </button>
                  </div>

                  {/* Window Mock Canvas / Preview */}
                  <div className="aspect-video w-full rounded-xl bg-black/40 border border-white/5 flex flex-col items-center justify-center p-4 relative overflow-hidden group-hover:bg-black/30 transition">
                    <Icon size={36} color={meta.color} className="opacity-75 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-[11px] text-white/45 mt-2 font-mono">
                      {w.w} × {w.h}
                    </span>
                    {w.minimized && (
                      <span className="absolute bottom-2 left-2 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        Minimized
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Footer hint */}
      <div className="text-center text-xs text-white/40 font-mono">
        Click any window to bring it to focus · Press Esc to dismiss
      </div>
    </div>
  );
}

