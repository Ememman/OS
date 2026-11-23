import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOS } from "../store/useOS";
import { usePlayer } from "../store/usePlayer";
import { useIsMobile } from "../lib/useMediaQuery";
import { soundFx } from "../lib/soundFx";
import { getSocket, getCachedChatInit } from "../lib/socket";
import { getChatSession } from "../lib/chatSession";
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
  GIconChats,
  GIconUpdates,
  GIconPaperPlane,
  GIconRotateRight,
  GIconRocket,
  GIconClock,
  GIconActivity,
} from "./icons/GravityIcons";

interface ChatSnippet {
  id: string;
  name: string;
  text: string;
  ts: number;
}

interface UpdateSnippet {
  id: string;
  version?: string;
  title: string;
  tag: "feature" | "fix" | "critical";
  date: string;
  author: string;
}

const DEFAULT_UPDATES: UpdateSnippet[] = [
  {
    id: "pr-280",
    version: "PR #280",
    title: "Updated Main: Core system improvements & repository synchronization",
    tag: "feature",
    date: "2026-11-23",
    author: "Ememman",
  },
  {
    id: "pr-279",
    version: "PR #279",
    title: "Strict 5-Second Auto-Dismiss Limit & Visual Countdown Progress Bar",
    tag: "fix",
    date: "2026-11-23",
    author: "Ememman",
  },
  {
    id: "v2.0-dynamic-island",
    version: "v2.0",
    title: "iPhone-Style Dynamic Island with live Chats, Updates, & Media Hub",
    tag: "feature",
    date: "2026-11-23",
    author: "Ememman",
  },
  {
    id: "pr-190",
    title: "Safari & Chrome Browser visual enhancements & responsive layout",
    tag: "feature",
    date: "2026-11-20",
    author: "Ememman",
  },
  {
    id: "pr-189",
    title: "Desktop item dragging, safe widget boundary avoidance & folders",
    tag: "feature",
    date: "2026-11-13",
    author: "EmanExe",
  },
  {
    id: "pr-186",
    title: "Production build pipeline, static export & deployment fixes",
    tag: "fix",
    date: "2026-11-13",
    author: "EmanExe",
  },
  {
    id: "pr-185",
    title: "Calculator programmer mode, bitwise ops & glassmorphism refinement",
    tag: "fix",
    date: "2026-11-13",
    author: "EmanExe",
  },
];

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
    unreadChatCount,
    clearUnreadChat,
    notify,
    dismissNotification,
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
  const [activeTab, setActiveTab] = useState<"media" | "chats" | "updates" | "timer" | "quick">("media");
  const [recentNotification, setRecentNotification] = useState<typeof notification | null>(null);

  // Incoming live chat pop banner state
  const [recentChatMessage, setRecentChatMessage] = useState<{ sender: string; text: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatSnippet[]>([]);
  const [quickChatInput, setQuickChatInput] = useState("");
  const [onlineCount, setOnlineCount] = useState(1);

  // Updates state
  const [updateFilter, setUpdateFilter] = useState<"all" | "feature" | "fix">("all");
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  // Timer state (Focus / Pomodoro timer)
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInitial, setTimerInitial] = useState(1500); // 25 mins default

  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial chat snippets from cache if available
  useEffect(() => {
    const cached = getCachedChatInit();
    if (cached) {
      if (typeof cached.online === "number") setOnlineCount(cached.online);
      if (Array.isArray(cached.history) && cached.history.length > 0) {
        const lastSlice = cached.history.slice(-5).map((m: any) => ({
          id: m.id || String(m.ts || Math.random()),
          name: m.name || "Guest",
          text: m.text || "",
          ts: m.ts || Date.now(),
        }));
        setChatMessages(lastSlice);
      }
    }
  }, []);

  // Socket listener for real-time chat messages & presence in the Dynamic Island
  useEffect(() => {
    let socket: any = null;
    try {
      socket = getSocket();
    } catch {
      return;
    }

    const onMessage = (msg: any) => {
      const curSession = getChatSession();
      const isFromMe = Boolean(
        (msg?.senderId && msg.senderId === curSession.clientId) ||
        (curSession.name && msg?.name && msg.name.toLowerCase() === curSession.name.toLowerCase())
      );

      const snippet: ChatSnippet = {
        id: msg.id || String(Date.now()),
        name: msg.name || "Guest",
        text: msg.text || "",
        ts: msg.ts || Date.now(),
      };

      setChatMessages((prev) => [...prev.slice(-6), snippet]);

      // Pop the Island with the incoming message if not from current user
      if (!isFromMe) {
        setRecentChatMessage({ sender: snippet.name, text: snippet.text });
        const timer = setTimeout(() => {
          setRecentChatMessage(null);
        }, 4200);
        return () => clearTimeout(timer);
      }
    };

    const onPresence = (data: any) => {
      if (typeof data?.online === "number") {
        setOnlineCount(data.online);
      }
    };

    socket.on("chat:message", onMessage);
    socket.on("chat:presence", onPresence);

    return () => {
      socket.off("chat:message", onMessage);
      socket.off("chat:presence", onPresence);
    };
  }, []);

  // Catch system notifications and flash the Island, strictly clearing within 5 seconds
  useEffect(() => {
    if (!notification) {
      setRecentNotification(null);
      return;
    }

    setRecentNotification(notification);

    // Guaranteed to be gone within 5 seconds (5000ms max)
    const duration = Math.min(5000, Math.max(1500, notification.durationMs || 4000));

    const timer = setTimeout(() => {
      setRecentNotification(null);
      if (notification.id) {
        dismissNotification(notification.id);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [notification, dismissNotification]);

  // Countdown timer logic
  useEffect(() => {
    if (!timerRunning || timerSeconds === null) return;
    if (timerSeconds <= 0) {
      setTimerRunning(false);
      setTimerSeconds(null);
      soundFx.playNotification();
      notify("Focus Session Complete", "Great job! Time for a short break.", "success", 4000);
      return;
    }
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, notify]);

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

  const isExpanded = isHovered || isPinned;

  // Active top window title
  const activeWin = windows.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0];
  const activeAppTitle = activeWin ? activeWin.title : "Portfolio OS";
  const hasActiveWindow = windows.some((w) => !w.minimized);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 100);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
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

  const handleDismissNotification = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (systemSounds) soundFx.playPop();
    if (recentNotification?.id) {
      dismissNotification(recentNotification.id);
    }
    setRecentNotification(null);
  };

  // Send quick reply directly from Dynamic Island
  const handleSendQuickChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickChatInput.trim()) return;

    try {
      const curSession = getChatSession();
      const socket = getSocket();
      const payload = {
        text: quickChatInput.trim(),
        name: curSession.name || "Guest",
        senderId: curSession.clientId,
      };

      socket.emit("chat:message", payload);
      setChatMessages((prev) => [
        ...prev.slice(-6),
        {
          id: String(Date.now()),
          name: curSession.name || "You",
          text: quickChatInput.trim(),
          ts: Date.now(),
        },
      ]);
      setQuickChatInput("");
      soundFx.playClick();
    } catch {
      notify("Chat Offline", "Could not broadcast message.", "error", 2200);
    }
  };

  const handleCheckUpdates = () => {
    if (systemSounds) soundFx.playClick();
    setIsCheckingUpdates(true);
    setTimeout(() => {
      setIsCheckingUpdates(false);
      soundFx.playNotification();
      notify("System Up to Date", "Portfolio OS v2.0 is the latest build.", "success", 2500);
    }, 900);
  };

  const filteredUpdates = useMemo(() => {
    if (updateFilter === "all") return DEFAULT_UPDATES;
    return DEFAULT_UPDATES.filter((u) => u.tag === updateFilter);
  }, [updateFilter]);

  const isMac = osMode === "mac";

  // Responsive, non-overlapping positioning:
  // On Mobile:
  //   - When on desktop (no active window, MenuBar is visible): float below MenuBar at top-9.5 (38px)
  //   - When an app window is active (MenuBar is hidden): float at top-1.5 like true iPhone notch
  // On Desktop:
  //   - macOS: centered inside MenuBar at top-0.5 sm:top-1
  //   - Windows: floating at top-2 sm:top-2.5
  const topPosition = isMobile
    ? hasActiveWindow
      ? "top-1.5"
      : "top-9.5"
    : isMac
      ? "top-0.5 sm:top-1"
      : "top-2 sm:top-2.5";

  if (!dynamicIslandEnabled) return null;

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed ${topPosition} left-1/2 -translate-x-1/2 z-[1001] select-none flex flex-col items-center pointer-events-auto transition-[top] duration-200`}
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
        className={`relative overflow-hidden cursor-pointer text-white bg-black/95 backdrop-blur-3xl border border-white/15 shadow-[0_18px_50px_rgba(0,0,0,0.85),0_0_1px_rgba(255,255,255,0.3)] transition-colors duration-200 ${
          isExpanded
            ? isMobile
              ? "rounded-[24px] p-3 w-[calc(100vw-20px)] max-w-[390px] max-h-[82vh] overflow-y-auto thin-scroll"
              : "rounded-[28px] sm:rounded-[32px] p-3.5 sm:p-4.5 w-[390px] sm:w-[420px] max-h-[85vh] overflow-y-auto thin-scroll"
            : "rounded-full px-2.5 sm:px-3 h-7 sm:h-7.5 flex items-center justify-center gap-2 hover:border-white/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
        }`}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* ================= COMPACT PILL STATE (True iPhone Minimalism) ================= */
            <motion.div
              key="compact"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between w-full h-full gap-2 sm:gap-2.5"
            >
              {/* 1. Live Notification Banner (Auto-dismisses within 5s or on click) */}
              {recentNotification ? (
                <div
                  onClick={handleDismissNotification}
                  className="flex items-center gap-1.5 min-w-0 max-w-[140px] sm:max-w-[280px] cursor-pointer group relative"
                  title="Click to dismiss notification"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <GIconCheck size={9} />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-300 truncate">
                    {recentNotification.title}
                  </span>
                  <span className="text-[10px] text-white/50 truncate hidden sm:inline">
                    {recentNotification.message}
                  </span>
                  <button
                    type="button"
                    onClick={handleDismissNotification}
                    className="p-0.5 rounded text-white/30 hover:text-white/80 transition-colors ml-0.5 shrink-0"
                    title="Dismiss notification"
                  >
                    <GIconClose size={9} />
                  </button>
                  {/* Subtle 5-second countdown progress bar */}
                  <div className="absolute -bottom-1 left-0 right-0 h-[1.5px] bg-white/10 rounded-full overflow-hidden pointer-events-none">
                    <div
                      className="h-full bg-emerald-400 opacity-80"
                      style={{
                        animation: `shrinkWidth ${Math.min(5000, Math.max(1500, recentNotification.durationMs || 4000))}ms linear forwards`,
                      }}
                    />
                  </div>
                </div>
              ) : recentChatMessage ? (
                /* 2. Incoming Live Chat Pop (Pops for 4s on message arrival) */
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab("chats");
                    setIsPinned(true);
                  }}
                  className="flex items-center gap-1.5 min-w-0 max-w-[130px] sm:max-w-[240px]"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 animate-pulse">
                    <GIconChats size={9} />
                  </div>
                  <span className="text-[11px] font-semibold text-sky-300 truncate">
                    {recentChatMessage.sender}:
                  </span>
                  <span className="text-[10px] text-white/70 truncate hidden sm:inline">
                    {recentChatMessage.text}
                  </span>
                </div>
              ) : timerRunning && timerSeconds !== null ? (
                /* 3. Timer Running State */
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span className="text-[11px] font-mono font-semibold text-amber-300">
                    {formatTime(timerSeconds)}
                  </span>
                </div>
              ) : track && playing ? (
                /* 4. Music Playing State (iPhone Style: No overflowing text on mobile!) */
                <>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20 shrink-0 animate-[spin_6s_linear_infinite]">
                      <img src={track.cover} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] font-medium text-white/95 truncate hidden sm:inline max-w-[130px]">
                      {track.title}
                    </span>
                  </div>
                  <div className="shrink-0 pl-0.5">
                    <EqualizerBars size="sm" />
                  </div>
                </>
              ) : track ? (
                /* 5. Music Paused State */
                <>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-3.5 h-3.5 rounded-md overflow-hidden border border-white/15 shrink-0 opacity-80">
                      <img src={track.cover} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] font-medium text-white/75 truncate hidden sm:inline max-w-[120px]">
                      {track.title}
                    </span>
                  </div>
                  <GIconMusic size={11} className="text-white/40 shrink-0" />
                </>
              ) : unreadChatCount > 0 ? (
                /* 6. Unread Chat Badge */
                <div className="flex items-center gap-1.5">
                  <GIconChats size={11} className="text-sky-400 shrink-0" />
                  <span className="text-[10px] font-semibold text-sky-300">
                    {unreadChatCount} new
                  </span>
                </div>
              ) : (
                /* 7. Default Idle State (Minimal hardware cutout capsule on mobile) */
                <>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isMac ? (
                      <GIconCode size={11} className="text-accent shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-sm bg-accent shrink-0" />
                    )}
                    <span className="text-[11px] font-medium text-white/80 truncate hidden sm:inline max-w-[120px]">
                      {activeAppTitle}
                    </span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </>
              )}
            </motion.div>
          ) : (
            /* ================= EXPANDED CARD STATE (Multi-Feature Hub) ================= */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 cursor-default"
            >
              {/* Top Navigation Tabs Header */}
              <div className="flex items-center justify-between gap-1 pb-1 border-b border-white/10">
                <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10 overflow-x-auto thin-scroll">
                  {/* Media Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      if (systemSounds) soundFx.playClick();
                      setActiveTab("media");
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 ${
                      activeTab === "media"
                        ? "bg-accent text-accent-contrast shadow-xs"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <GIconMusic size={11} />
                    <span>Media</span>
                  </button>

                  {/* Chats Tab (NEW!) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (systemSounds) soundFx.playClick();
                      setActiveTab("chats");
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 relative ${
                      activeTab === "chats"
                        ? "bg-accent text-accent-contrast shadow-xs"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <GIconChats size={11} />
                    <span>Chats</span>
                    {unreadChatCount > 0 && (
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] flex items-center justify-center font-bold">
                        {unreadChatCount}
                      </span>
                    )}
                  </button>

                  {/* Updates Tab (NEW!) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (systemSounds) soundFx.playClick();
                      setActiveTab("updates");
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 ${
                      activeTab === "updates"
                        ? "bg-accent text-accent-contrast shadow-xs"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <GIconUpdates size={11} />
                    <span>Updates</span>
                  </button>

                  {/* Focus Timer Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      if (systemSounds) soundFx.playClick();
                      setActiveTab("timer");
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 ${
                      activeTab === "timer"
                        ? "bg-accent text-accent-contrast shadow-xs"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <GIconClock size={11} />
                    <span>Focus</span>
                  </button>

                  {/* Quick Hub Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      if (systemSounds) soundFx.playClick();
                      setActiveTab("quick");
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 ${
                      activeTab === "quick"
                        ? "bg-accent text-accent-contrast shadow-xs"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <GIconSliders size={11} />
                    <span>Hub</span>
                  </button>
                </div>

                {/* Close / Collapse Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (systemSounds) soundFx.playClick();
                    setIsPinned(false);
                    setIsHovered(false);
                  }}
                  className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
                  title="Collapse Dynamic Island"
                >
                  <GIconClose size={12} />
                </button>
              </div>

              {/* ================= TAB 1: MEDIA PLAYER ================= */}
              {activeTab === "media" && (
                <div className="space-y-3">
                  {track ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-lg border border-white/20 shrink-0">
                          <img src={track.cover} alt="" className="w-full h-full object-cover" />
                          {playing && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <EqualizerBars size="sm" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {track.title}
                          </h4>
                          <p className="text-[11px] text-white/60 truncate">{track.artist}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                              Now Playing
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Scrubber Progress Bar */}
                      <div className="space-y-1">
                        <div
                          className="h-1.5 bg-white/15 rounded-full overflow-hidden cursor-pointer relative"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickPos = (e.clientX - rect.left) / rect.width;
                            seek(clickPos * duration);
                          }}
                        >
                          <div
                            className="h-full bg-accent transition-all duration-100"
                            style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-white/40">
                          <span>{formatTime(progress)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      {/* Playback Controls & Volume */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (systemSounds) soundFx.playClick();
                              prev();
                            }}
                            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
                          >
                            <GIconBackward size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (systemSounds) soundFx.playPop();
                              togglePlay();
                            }}
                            className="w-9 h-9 rounded-full bg-accent hover:brightness-110 text-accent-contrast shadow-md flex items-center justify-center transition cursor-pointer"
                          >
                            {playing ? <GIconPause size={16} /> : <GIconPlay size={16} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (systemSounds) soundFx.playClick();
                              next();
                            }}
                            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
                          >
                            <GIconForward size={14} />
                          </button>
                        </div>

                        {/* Interactive Volume Slider */}
                        <div className="flex items-center gap-1.5 max-w-[120px]">
                          <GIconVolume size={12} className="text-white/40 shrink-0" />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-16 sm:w-20 accent-accent cursor-pointer h-1"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-4 text-center text-white/50 space-y-2">
                      <GIconMusic size={24} className="mx-auto text-white/30" />
                      <p className="text-xs">No media queue active</p>
                      <button
                        type="button"
                        onClick={() => openApp("music")}
                        className="px-3 py-1 rounded-xl bg-accent/20 text-accent text-xs font-semibold hover:bg-accent/30 transition cursor-pointer"
                      >
                        Launch Music App
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ================= TAB 2: CHATS & LIVE PRESENCE (NEW!) ================= */}
              {activeTab === "chats" && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-white/5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-semibold text-white/90">
                        {onlineCount} {onlineCount === 1 ? "Visitor" : "Visitors"} Active
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadChatCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            clearUnreadChat();
                            if (systemSounds) soundFx.playClick();
                          }}
                          className="text-[10px] text-accent hover:underline cursor-pointer"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          openApp("chats");
                          setIsPinned(false);
                          setIsHovered(false);
                        }}
                        className="text-[10px] text-white/50 hover:text-white px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer"
                      >
                        Open Chats ↗
                      </button>
                    </div>
                  </div>

                  {/* Recent Messages Stream */}
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto thin-scroll pr-1">
                    {chatMessages.length > 0 ? (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2 text-xs"
                        >
                          <div className="w-5 h-5 rounded-full bg-accent/20 text-accent font-bold text-[10px] flex items-center justify-center shrink-0 border border-accent/30">
                            {msg.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-white/90 text-[11px] truncate">
                                {msg.name}
                              </span>
                              <span className="text-[9px] text-white/35 font-mono shrink-0">
                                {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-[11px] text-white/70 break-words mt-0.5">
                              {msg.text}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-white/40 text-xs">
                        No recent messages yet. Say hello below!
                      </div>
                    )}
                  </div>

                  {/* Inline Quick Message Composer */}
                  <form onSubmit={handleSendQuickChat} className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={quickChatInput}
                      onChange={(e) => setQuickChatInput(e.target.value)}
                      placeholder="Quick reply to guestbook..."
                      className="flex-1 bg-white/10 text-white text-xs px-2.5 py-1.5 rounded-xl border border-white/15 focus:outline-hidden focus:border-accent"
                    />
                    <button
                      type="submit"
                      disabled={!quickChatInput.trim()}
                      className="p-2 rounded-xl bg-accent text-accent-contrast disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition cursor-pointer shrink-0"
                      title="Send message"
                    >
                      <GIconPaperPlane size={13} />
                    </button>
                  </form>
                </div>
              )}

              {/* ================= TAB 3: UPDATES & CHANGELOG (NEW!) ================= */}
              {activeTab === "updates" && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-white/5">
                    <div className="flex items-center gap-1.5">
                      <GIconRocket size={13} className="text-purple-400" />
                      <span className="text-xs font-bold text-white">Portfolio OS Updates</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        v2.0
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleCheckUpdates}
                        className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
                        title="Check for updates"
                      >
                        <GIconRotateRight
                          size={12}
                          className={isCheckingUpdates ? "animate-spin text-accent" : ""}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          openApp("updates");
                          setIsPinned(false);
                          setIsHovered(false);
                        }}
                        className="text-[10px] text-white/50 hover:text-white px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer"
                      >
                        View Full ↗
                      </button>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 text-[10px]">
                    {(["all", "feature", "fix"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => {
                          if (systemSounds) soundFx.playClick();
                          setUpdateFilter(filter);
                        }}
                        className={`px-2 py-0.5 rounded-md font-medium capitalize transition cursor-pointer ${
                          updateFilter === filter
                            ? "bg-white/20 text-white font-semibold"
                            : "text-white/45 hover:text-white/80"
                        }`}
                      >
                        {filter === "all" ? "All Updates" : filter === "feature" ? "Features" : "Fixes"}
                      </button>
                    ))}
                  </div>

                  {/* Update Cards */}
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto thin-scroll pr-1">
                    {filteredUpdates.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          openApp("updates");
                          setIsPinned(false);
                          setIsHovered(false);
                        }}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`text-[8px] font-bold uppercase px-1.5 py-0.2 rounded-full border ${
                                u.tag === "feature"
                                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                  : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              }`}
                            >
                              {u.tag}
                            </span>
                            {u.version && (
                              <span className="text-[9px] font-mono text-purple-300">
                                {u.version}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-white/40 font-mono">{u.date}</span>
                        </div>
                        <p className="text-[11px] font-medium text-white/90 line-clamp-2">
                          {u.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= TAB 4: FOCUS / POMODORO TIMER ================= */}
              {activeTab === "timer" && (
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center py-2 space-y-2">
                    <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white drop-shadow-md">
                      {timerSeconds !== null ? formatTime(timerSeconds) : formatTime(timerInitial)}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-white/60">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          timerRunning ? "bg-amber-400 animate-pulse" : "bg-white/30"
                        }`}
                      />
                      <span>{timerRunning ? "Focus Session in Progress" : "Ready to Focus"}</span>
                    </div>
                  </div>

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: "5m", sec: 300, sub: "Quick" },
                      { label: "15m", sec: 900, sub: "Short" },
                      { label: "25m", sec: 1500, sub: "Pomodoro" },
                      { label: "45m", sec: 2700, sub: "Deep" },
                    ].map((preset) => (
                      <button
                        key={preset.sec}
                        type="button"
                        onClick={() => {
                          if (systemSounds) soundFx.playClick();
                          setTimerInitial(preset.sec);
                          setTimerSeconds(preset.sec);
                          setTimerRunning(false);
                        }}
                        className={`p-1.5 rounded-xl border text-center transition cursor-pointer ${
                          timerInitial === preset.sec
                            ? "bg-accent/20 border-accent text-accent"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        <div className="text-xs font-bold">{preset.label}</div>
                        <div className="text-[9px] text-white/40">{preset.sub}</div>
                      </button>
                    ))}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (systemSounds) soundFx.playPop();
                        if (!timerRunning && timerSeconds === null) {
                          setTimerSeconds(timerInitial);
                        }
                        setTimerRunning((prev) => !prev);
                      }}
                      className="px-5 py-2 rounded-xl bg-accent text-accent-contrast font-semibold text-xs shadow-md hover:brightness-110 transition cursor-pointer flex items-center gap-1.5"
                    >
                      {timerRunning ? <GIconPause size={13} /> : <GIconPlay size={13} />}
                      <span>{timerRunning ? "Pause" : "Start"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (systemSounds) soundFx.playClick();
                        setTimerRunning(false);
                        setTimerSeconds(timerInitial);
                      }}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 font-semibold text-xs transition cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {/* ================= TAB 5: QUICK HUB ================= */}
              {activeTab === "quick" && (
                <div className="space-y-3">
                  {/* System Actions Bar */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (systemSounds) soundFx.playClick();
                        setThemeMode(themeMode === "oled" ? "dark" : themeMode === "dark" ? "light" : "oled");
                      }}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer flex flex-col items-center justify-center gap-1"
                    >
                      <GIconMoon size={14} className="text-indigo-400" />
                      <span className="text-[10px] text-white/80 font-medium capitalize">
                        {themeMode}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (systemSounds) soundFx.playClick();
                        startLiveShow();
                        setIsPinned(false);
                        setIsHovered(false);
                      }}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer flex flex-col items-center justify-center gap-1"
                    >
                      <GIconSparkles size={14} className="text-emerald-400" />
                      <span className="text-[10px] text-white/80 font-medium">Live Show</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (systemSounds) soundFx.playClick();
                        openSpotlight();
                        setIsPinned(false);
                        setIsHovered(false);
                      }}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer flex flex-col items-center justify-center gap-1"
                    >
                      <GIconSearch size={14} className="text-amber-400" />
                      <span className="text-[10px] text-white/80 font-medium">Search</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (systemSounds) soundFx.playClick();
                        toggleControlCenter();
                        setIsPinned(false);
                        setIsHovered(false);
                      }}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer flex flex-col items-center justify-center gap-1"
                    >
                      <GIconSliders size={14} className="text-cyan-400" />
                      <span className="text-[10px] text-white/80 font-medium">Controls</span>
                    </button>
                  </div>

                  {/* Quick App Launchers Grid */}
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5 px-0.5">
                      Launch Quick Apps
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: "terminal", label: "Terminal", icon: GIconTerminal, color: "text-green-400 bg-green-500/10 border-green-500/20" },
                        { id: "notes", label: "Notes", icon: GIconNotes, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                        { id: "calculator", label: "Calc", icon: GIconCalculator, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
                        { id: "activity", label: "Activity", icon: GIconActivity, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                        { id: "games", label: "Games", icon: GIconGames, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
                        { id: "codeplay", label: "CodePlay", icon: GIconCode, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
                      ].map((app) => {
                        const Icon = app.icon;
                        return (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => {
                              if (systemSounds) soundFx.playClick();
                              openApp(app.id as any);
                              setIsPinned(false);
                              setIsHovered(false);
                            }}
                            className="p-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] transition cursor-pointer flex flex-col items-center justify-center gap-1"
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${app.color}`}>
                              <Icon size={14} />
                            </div>
                            <span className="text-[10px] text-white/80 font-medium truncate w-full text-center">
                              {app.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
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
