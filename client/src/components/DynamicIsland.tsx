import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOS } from "../store/useOS";
import { usePlayer } from "../store/usePlayer";
import { useIsMobile } from "../lib/useMediaQuery";
import { soundFx } from "../lib/soundFx";
import EqualizerBars from "./EqualizerBars";
import {
  GIconPlay,
  GIconPause,
  GIconBackward,
  GIconForward,
  GIconMusic,
  GIconVolume,
  GIconMoon,
  GIconSparkles,
  GIconClose,
  GIconCheck,
  GIconSliders,
  GIconSearch,
  GIconCode,
  GIconTerminal,
  GIconNotes,
  GIconCalculator,
  GIconGames,
} from "./icons/GravityIcons";

export default function DynamicIsland() {
  const {
    dynamicIslandEnabled,
    osMode,
    windows,
    openApp,
    notification,
    themeMode,
    setThemeMode,
    systemSounds,
    startLiveShow,
    openSpotlight,
    toggleControlCenter,
  } = useOS();

  const {
    queue,
    queueIdx,
    playing,
    progress,
    duration,
    volume,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
  } = usePlayer();

  const isMobile = useIsMobile();
  const track = queue[queueIdx];

  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [activeTab, setActiveTab] = useState<"media" | "quick" | "timer">("media");
  const [recentNotification, setRecentNotification] = useState<typeof notification | null>(null);

  // Timer state (Focus / Pomodoro timer built into the island)
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-switch to media if track exists, otherwise quick hub
  useEffect(() => {
    if (!track && activeTab === "media") {
      setActiveTab("quick");
    }
  }, [track, activeTab]);

  // Catch system notifications and flash the Island
  useEffect(() => {
    if (notification) {
      setRecentNotification(notification);
      const timer = setTimeout(() => {
        setRecentNotification(null);
      }, (notification.durationMs || 3500));
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Countdown timer logic
  useEffect(() => {
    if (!timerRunning || timerSeconds === null) return;
    if (timerSeconds <= 0) {
      setTimerRunning(false);
      setTimerSeconds(null);
      soundFx.playNotification();
      return;
    }
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  // Click outside listener to collapse pinned island
  useEffect(() => {
    if (!isPinned) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPinned(false);
        setIsHovered(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPinned(false);
        setIsHovered(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPinned]);

  if (!dynamicIslandEnabled) return null;

  const isExpanded = isHovered || isPinned;

  // Active top window title
  const activeWin = windows.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0];
  const activeAppTitle = activeWin ? activeWin.title : "Portfolio OS";

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 100);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isPinned) setIsHovered(false);
    }, 250);
  };

  const handleIslandClick = () => {
    if (systemSounds) soundFx.playPop();
    setIsPinned((prev) => !prev);
    setIsHovered(true);
  };

  const isMac = osMode === "mac";
  const topPosition = isMac ? "top-0.5 sm:top-1" : "top-2 sm:top-2.5";

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed ${topPosition} left-1/2 -translate-x-1/2 z-[1001] select-none flex flex-col items-center pointer-events-auto`}
    >
      <motion.div
        layout
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 32,
          mass: 0.8,
        }}
        onClick={!isExpanded ? handleIslandClick : undefined}
        className={`relative overflow-hidden cursor-pointer text-white bg-black/95 backdrop-blur-3xl border border-white/15 shadow-[0_18px_50px_rgba(0,0,0,0.8),0_0_1px_rgba(255,255,255,0.3)] transition-colors duration-200 ${
          isExpanded
            ? isMobile
              ? "rounded-[24px] p-3 w-[calc(100vw-24px)]"
              : "rounded-[28px] sm:rounded-[32px] p-3.5 sm:p-4.5 w-[350px] sm:w-[390px]"
            : "rounded-full px-2.5 sm:px-3 h-7 sm:h-7.5 flex items-center gap-2 hover:border-white/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
        }`}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* ================= COMPACT PILL STATE ================= */
            <motion.div
              key="compact"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between w-full h-full gap-2 sm:gap-2.5"
            >
              {/* Notification Banner State */}
              {recentNotification ? (
                <div className="flex items-center gap-2 min-w-0 max-w-[240px] sm:max-w-[280px]">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <GIconCheck size={10} />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-300 truncate">
                    {recentNotification.title}
                  </span>
                  <span className="text-[10px] text-white/50 truncate hidden sm:inline">
                    {recentNotification.message}
                  </span>
                </div>
              ) : timerRunning && timerSeconds !== null ? (
                /* Timer Running State */
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span className="text-[11px] font-mono font-semibold text-amber-300">
                    {formatTime(timerSeconds)}
                  </span>
                </div>
              ) : track && playing ? (
                /* Music Playing State */
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-4.5 h-4.5 rounded-full overflow-hidden border border-white/20 shrink-0 animate-[spin_6s_linear_infinite]">
                      <img src={track.cover} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] font-medium text-white/95 truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[140px]">
                      {track.title}
                    </span>
                  </div>
                  <div className="shrink-0 pl-0.5">
                    <EqualizerBars size="sm" />
                  </div>
                </>
              ) : track ? (
                /* Music Paused State */
                <>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-4 h-4 rounded-md overflow-hidden border border-white/15 shrink-0 opacity-80">
                      <img src={track.cover} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] font-medium text-white/75 truncate max-w-[90px] xs:max-w-[110px] sm:max-w-[130px]">
                      {track.title}
                    </span>
                  </div>
                  <GIconMusic size={11} className="text-white/40 shrink-0" />
                </>
              ) : (
                /* Default Idle State */
                <>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isMac ? (
                      <GIconCode size={12} className="text-accent shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-sm bg-accent shrink-0 shadow-xs" />
                    )}
                    <span className="text-[11px] font-medium text-white/80 truncate max-w-[90px] xs:max-w-[110px] sm:max-w-[130px]">
                      {activeAppTitle}
                    </span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </>
              )}
            </motion.div>
          ) : (
            /* ================= EXPANDED CARD STATE ================= */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 cursor-default"
            >
              {/* Top Header Row with Tabs and Close Button */}
              <div className="flex items-center justify-between gap-1 pb-1 border-b border-white/10">
                <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      if (systemSounds) soundFx.playClick();
                      setActiveTab("media");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                      activeTab === "media"
                        ? "bg-accent text-accent-contrast shadow-xs"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <GIconMusic size={11} />
                    <span>Media</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (systemSounds) soundFx.playClick();
                      setActiveTab("quick");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                      activeTab === "quick"
                        ? "bg-accent text-accent-contrast shadow-xs"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <GIconSliders size={11} />
                    <span>Quick Hub</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (systemSounds) soundFx.playClick();
                      setActiveTab("timer");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                      activeTab === "timer"
                        ? "bg-accent text-accent-contrast shadow-xs"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <GIconSparkles size={11} />
                    <span>Timer</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (systemSounds) soundFx.playClose();
                    setIsPinned(false);
                    setIsHovered(false);
                  }}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
                  title="Collapse Dynamic Island"
                >
                  <GIconClose size={11} />
                </button>
              </div>

              {/* TAB 1: MEDIA PLAYER */}
              {activeTab === "media" && (
                <div className="space-y-3">
                  {track ? (
                    <>
                      {/* Album Art + Title + Open Music App */}
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => openApp("music")}
                          className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-white/15 shadow-xl shrink-0 cursor-pointer group"
                          title="Open Music app"
                        >
                          <img
                            src={track.cover}
                            alt={track.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <GIconMusic size={14} className="text-white drop-shadow-md" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4
                            onClick={() => openApp("music")}
                            className="text-xs sm:text-sm font-bold text-white truncate cursor-pointer hover:text-accent transition-colors"
                          >
                            {track.title}
                          </h4>
                          <p className="text-[11px] text-white/50 truncate font-medium">
                            {track.artist}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-mono text-accent bg-accent/15 px-1.5 py-0.5 rounded-md border border-accent/25">
                              {playing ? "Playing" : "Paused"}
                            </span>
                            <span className="text-[9px] text-white/35 font-mono truncate">
                              {track.album || "Portfolio Music"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Scrubber Progress Bar */}
                      <div className="space-y-1">
                        <div
                          className="relative w-full h-1.5 bg-white/15 rounded-full cursor-pointer overflow-hidden group/bar"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pos = (e.clientX - rect.left) / rect.width;
                            seek(pos * duration);
                          }}
                        >
                          <div
                            className="absolute top-0 bottom-0 left-0 bg-accent rounded-full transition-all duration-100"
                            style={{
                              width: `${Math.min(100, Math.max(0, (progress / (duration || 1)) * 100))}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-white/40">
                          <span>{formatTime(progress)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      {/* Controls Bar */}
                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (systemSounds) soundFx.playClick();
                              prev();
                            }}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
                            title="Previous track"
                          >
                            <GIconBackward size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (systemSounds) soundFx.playPop();
                              togglePlay();
                            }}
                            className="w-10 h-10 rounded-full bg-accent text-accent-contrast shadow-lg shadow-accent/30 flex items-center justify-center transition hover:scale-105 active:scale-95 cursor-pointer"
                            title={playing ? "Pause" : "Play"}
                          >
                            {playing ? <GIconPause size={16} /> : <GIconPlay size={16} />}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (systemSounds) soundFx.playClick();
                              next();
                            }}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
                            title="Next track"
                          >
                            <GIconForward size={13} />
                          </button>
                        </div>

                        {/* Volume Quick Control */}
                        <div className="flex items-center gap-1.5 w-24 sm:w-28">
                          <GIconVolume size={12} className="text-white/40 shrink-0" />
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.02}
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full accent-accent h-1 bg-white/20 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 space-y-2">
                      <p className="text-xs text-white/60">No music loaded in queue</p>
                      <button
                        type="button"
                        onClick={() => openApp("music")}
                        className="px-3.5 py-1.5 rounded-xl bg-accent text-accent-contrast text-xs font-semibold shadow-md cursor-pointer"
                      >
                        Open Music Library
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: QUICK HUB */}
              {activeTab === "quick" && (
                <div className="space-y-3">
                  {/* System Fast Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (systemSounds) soundFx.playClick();
                        setThemeMode(themeMode === "night" ? "dark" : "night");
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer text-left"
                    >
                      <GIconMoon size={14} className="text-accent shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-white truncate">Theme</div>
                        <div className="text-[9px] text-white/40 truncate">
                          {themeMode === "night" ? "OLED Pitch" : "Balanced Slate"}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (systemSounds) soundFx.playClick();
                        startLiveShow();
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer text-left"
                    >
                      <GIconSparkles size={14} className="text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-white truncate">Live Show</div>
                        <div className="text-[9px] text-white/40 truncate">Dark Nature</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (systemSounds) soundFx.playClick();
                        openSpotlight();
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer text-left"
                    >
                      <GIconSearch size={14} className="text-cyan-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-white truncate">Spotlight</div>
                        <div className="text-[9px] text-white/40 truncate">Quick Search</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (systemSounds) soundFx.playClick();
                        toggleControlCenter();
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer text-left"
                    >
                      <GIconSliders size={14} className="text-purple-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-white truncate">Control Center</div>
                        <div className="text-[9px] text-white/40 truncate">System Panel</div>
                      </div>
                    </button>
                  </div>

                  {/* App Quick Launcher Row */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="text-[9px] uppercase tracking-wider text-white/40 font-semibold mb-1.5 px-0.5">
                      Quick Launch
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      {[
                        { id: "terminal", label: "Terminal", icon: GIconTerminal, color: "text-emerald-400" },
                        { id: "notes", label: "Notes", icon: GIconNotes, color: "text-amber-400" },
                        { id: "calculator", label: "Calc", icon: GIconCalculator, color: "text-cyan-400" },
                        { id: "games", label: "Games", icon: GIconGames, color: "text-rose-400" },
                        { id: "music", label: "Music", icon: GIconMusic, color: "text-accent" },
                      ].map((app) => {
                        const Icon = app.icon;
                        return (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => {
                              if (systemSounds) soundFx.playOpen();
                              openApp(app.id);
                              setIsPinned(false);
                              setIsHovered(false);
                            }}
                            className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/5 flex flex-col items-center gap-1 transition cursor-pointer group"
                            title={app.label}
                          >
                            <Icon size={14} className={`${app.color} group-hover:scale-110 transition-transform`} />
                            <span className="text-[9px] text-white/60 group-hover:text-white truncate">
                              {app.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FOCUS TIMER */}
              {activeTab === "timer" && (
                <div className="space-y-3 text-center py-1">
                  <div className="text-3xl font-mono font-light tracking-tight text-white">
                    {formatTime(timerSeconds ?? 0)}
                  </div>

                  {/* Presets */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: "5 Mins", secs: 300 },
                      { label: "15 Mins", secs: 900 },
                      { label: "25 Mins", secs: 1500 },
                    ].map((p) => (
                      <button
                        key={p.secs}
                        type="button"
                        onClick={() => {
                          if (systemSounds) soundFx.playClick();
                          setTimerSeconds(p.secs);
                          setTimerRunning(true);
                        }}
                        className={`py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                          timerSeconds === p.secs
                            ? "bg-accent/20 border-accent text-accent font-semibold"
                            : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Actions: Start, Pause, Reset */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {timerSeconds !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          if (systemSounds) soundFx.playClick();
                          setTimerRunning((prev) => !prev);
                        }}
                        className={`px-4 py-1.5 rounded-xl text-xs font-semibold shadow-md transition cursor-pointer ${
                          timerRunning
                            ? "bg-amber-500 hover:bg-amber-400 text-black"
                            : "bg-emerald-500 hover:bg-emerald-400 text-black"
                        }`}
                      >
                        {timerRunning ? "Pause Timer" : "Start Timer"}
                      </button>
                    )}

                    {timerSeconds !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          if (systemSounds) soundFx.playClose();
                          setTimerRunning(false);
                          setTimerSeconds(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-medium transition cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
