import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  GIconPersons,
} from "./icons/GravityIcons";

interface ChatSnippet {
  id: string;
  name: string;
  text: string;
  ts: number;
  reactions?: Record<string, number>;
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
    author: "Ememman",
  },
];

type AmbientType = "rain" | "forest" | "waves" | "whitenoise" | null;

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
    playQueueAt,
  } = usePlayer();

  const isMobile = useIsMobile();
  const track = queue[queueIdx];

  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [activeTab, setActiveTab] = useState<"media" | "chats" | "updates" | "focus" | "hub">("media");
  const [recentNotification, setRecentNotification] = useState<typeof notification | null>(null);

  // Incoming live chat pop banner state
  const [recentChatMessage, setRecentChatMessage] = useState<{ sender: string; text: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatSnippet[]>([]);
  const [quickChatInput, setQuickChatInput] = useState("");
  const [onlineCount, setOnlineCount] = useState(2);

  // Queue peek in Media Tab
  const [showQueuePeek, setShowQueuePeek] = useState(false);

  // Updates state
  const [updateFilter, setUpdateFilter] = useState<"all" | "feature" | "fix">("all");
  const [prSearchQuery, setPrSearchQuery] = useState("");
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  // Focus & Timer state
  const [focusMode, setFocusMode] = useState<"timer" | "stopwatch">("timer");
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInitial, setTimerInitial] = useState(1500); // 25 mins default
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);

  // Ambient sound generator state
  const [activeAmbient, setActiveAmbient] = useState<AmbientType>(null);
  const ambientAudioCtxRef = useRef<AudioContext | null>(null);
  const ambientSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);

  // Quick Scratchpad memo in Hub tab
  const [quickMemo, setQuickMemo] = useState(() => {
    try {
      return localStorage.getItem("os_quick_memo") || "";
    } catch {
      return "";
    }
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial chat snippets from cache if available
  useEffect(() => {
    const cached = getCachedChatInit();
    if (cached) {
      if (typeof cached.online === "number") setOnlineCount(Math.max(1, cached.online));
      if (Array.isArray(cached.history) && cached.history.length > 0) {
        const lastSlice = cached.history.slice(-6).map((m: any) => ({
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
        }, 4500);
        return () => clearTimeout(timer);
      }
    };

    const onPresence = (data: any) => {
      if (typeof data?.online === "number") {
        setOnlineCount(Math.max(1, data.online));
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

    // Guaranteed to auto-dismiss within 5 seconds (5000ms max)
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

  // Stopwatch timer logic
  useEffect(() => {
    if (!stopwatchRunning) return;
    const interval = setInterval(() => {
      setStopwatchSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [stopwatchRunning]);

  // Web Audio ambient sound synthesizer
  const stopAmbient = useCallback(() => {
    try {
      if (ambientSourceRef.current) {
        ambientSourceRef.current.stop();
        ambientSourceRef.current.disconnect();
        ambientSourceRef.current = null;
      }
      if (ambientAudioCtxRef.current) {
        ambientAudioCtxRef.current.close().catch(() => {});
        ambientAudioCtxRef.current = null;
      }
    } catch {}
    setActiveAmbient(null);
  }, []);

  const playAmbient = useCallback((type: AmbientType) => {
    stopAmbient();
    if (!type) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      ambientAudioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate pink/brownian noise for realistic rain / waves
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === "rain") {
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 3.5;
        } else if (type === "waves") {
          lastOut = (lastOut + 0.015 * white) / 1.015;
          data[i] = lastOut * 4.0;
        } else if (type === "forest") {
          lastOut = (lastOut + 0.03 * white) / 1.03;
          data[i] = lastOut * 2.5;
        } else {
          // White noise
          data[i] = white * 0.15;
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = type === "rain" ? "lowpass" : type === "waves" ? "bandpass" : "lowpass";
      filter.frequency.value = type === "rain" ? 900 : type === "waves" ? 450 : 1200;

      const gain = ctx.createGain();
      gain.gain.value = 0.25;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      ambientSourceRef.current = noise;
      ambientGainRef.current = gain;
      setActiveAmbient(type);
    } catch {
      setActiveAmbient(null);
    }
  }, [stopAmbient]);

  // Clean up ambient audio on unmount
  useEffect(() => {
    return () => {
      stopAmbient();
    };
  }, [stopAmbient]);

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
      soundFx.playPop();
    } catch {
      notify("Chat Offline", "Could not broadcast message.", "error", 2200);
    }
  };

  // Quick emoji react to chat message
  const handleQuickReact = (msgId: string, emoji: string) => {
    if (systemSounds) soundFx.playClick();
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              reactions: {
                ...(m.reactions || {}),
                [emoji]: ((m.reactions?.[emoji] as number) || 0) + 1,
              },
            }
          : m
      )
    );
  };

  const handleCheckUpdates = () => {
    if (systemSounds) soundFx.playClick();
    setIsCheckingUpdates(true);
    setTimeout(() => {
      setIsCheckingUpdates(false);
      soundFx.playNotification();
      notify("System Up to Date", "Portfolio OS v2.0 is the latest build.", "success", 2500);
    }, 800);
  };

  const filteredUpdates = useMemo(() => {
    let list = DEFAULT_UPDATES;
    if (updateFilter !== "all") {
      list = list.filter((u) => u.tag === updateFilter);
    }
    if (prSearchQuery.trim()) {
      const q = prSearchQuery.toLowerCase().trim();
      list = list.filter((u) => u.title.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
    }
    return list;
  }, [updateFilter, prSearchQuery]);

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
              : "rounded-[28px] sm:rounded-[32px] p-4 sm:p-5 w-[460px] sm:w-[540px] md:w-[600px] max-w-[94vw] max-h-[85vh] overflow-y-auto thin-scroll"
            : "rounded-full px-2.5 sm:px-4 md:px-5 h-7 sm:h-8 flex items-center justify-center gap-2 sm:gap-2.5 min-w-[110px] sm:min-w-[180px] md:min-w-[220px] hover:border-white/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
        }`}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* ================= COMPACT PILL STATE (Clean Minimal Hardware Pill) ================= */
            <motion.div
              key="compact"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between w-full h-full gap-2 sm:gap-2.5"
            >
              {/* 1. Live Notification Banner */}
              {recentNotification ? (
                <div
                  onClick={handleDismissNotification}
                  className="flex items-center gap-1.5 min-w-0 max-w-[140px] sm:max-w-[320px] md:max-w-[400px] cursor-pointer group relative"
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
                  className="flex items-center gap-1.5 min-w-0 max-w-[130px] sm:max-w-[280px] md:max-w-[360px]"
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
              ) : stopwatchRunning ? (
                /* Stopwatch Running */
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <span className="text-[11px] font-mono font-semibold text-cyan-300">
                    {formatTime(stopwatchSeconds)}
                  </span>
                </div>
              ) : track && playing ? (
                /* 4. Music Playing State (iPhone Style: No overflowing text on mobile!) */
                <>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20 shrink-0 animate-[spin_6s_linear_infinite]">
                      <img src={track.cover} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] font-medium text-white/95 truncate hidden sm:inline max-w-[130px] sm:max-w-[200px] md:max-w-[260px]">
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
                    <span className="text-[11px] font-medium text-white/75 truncate hidden sm:inline max-w-[120px] sm:max-w-[180px] md:max-w-[240px]">
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
                /* 7. Default Idle State (Minimal hardware cutout capsule, NO green dot) */
                <div className="flex items-center gap-1.5 min-w-0">
                  {isMac ? (
                    <GIconCode size={11} className="text-accent shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-xs bg-accent shrink-0" />
                  )}
                  <span className="text-[11px] font-medium text-white/80 truncate hidden sm:inline max-w-[120px] sm:max-w-[180px] md:max-w-[230px]">
                    {activeAppTitle}
                  </span>
                </div>
              )}
            </motion.div>
          ) : (
            /* ================= EXPANDED CARD STATE (Organized Multi-Hub) ================= */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 cursor-default"
            >
              {/* Organized Top Navigation Bar with Segmented Control */}
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/10">
                {/* Unified Segmented Tab Bar */}
                <div className="flex items-center gap-1 bg-white/[0.06] p-1 rounded-2xl border border-white/10 flex-1 overflow-x-auto no-scrollbar shadow-inner">
                  {/* Media Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      if (systemSounds) soundFx.playClick();
                      setActiveTab("media");
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 flex-1 shrink-0 ${
                      activeTab === "media"
                        ? "bg-accent text-accent-contrast shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <GIconMusic size={12} />
                    <span>Media</span>
                  </button>

                  {/* Chats Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      if (systemSounds) soundFx.playClick();
                      setActiveTab("chats");
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 flex-1 shrink-0 relative ${
                      activeTab === "chats"
                        ? "bg-accent text-accent-contrast shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <GIconChats size={12} />
                    <span>Chats</span>
                    {unreadChatCount > 0 && (
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] flex items-center justify-center font-bold">
                        {unreadChatCount}
                      </span>
                    )}
                  </button>

                  {/* Updates Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      if (systemSounds) soundFx.playClick();
                      setActiveTab("updates");
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 flex-1 shrink-0 ${
                      activeTab === "updates"
                        ? "bg-accent text-accent-contrast shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <GIconUpdates size={12} />
                    <span>Updates</span>
                  </button>

                  {/* Focus Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      if (systemSounds) soundFx.playClick();
                      setActiveTab("focus");
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 flex-1 shrink-0 ${
                      activeTab === "focus"
                        ? "bg-accent text-accent-contrast shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <GIconClock size={12} />
                    <span>Focus</span>
                  </button>

                  {/* Hub Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      if (systemSounds) soundFx.playClick();
                      setActiveTab("hub");
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 flex-1 shrink-0 ${
                      activeTab === "hub"
                        ? "bg-accent text-accent-contrast shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <GIconSliders size={12} />
                    <span>Hub</span>
                  </button>
                </div>

                {/* Symmetrical Frosted Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (systemSounds) soundFx.playClick();
                    setIsPinned(false);
                    setIsHovered(false);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/60 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-sm"
                  title="Collapse Dynamic Island"
                >
                  <GIconClose size={13} />
                </button>
              </div>

              {/* ================= TAB 1: MEDIA PLAYER & QUEUE PEEK ================= */}
              {activeTab === "media" && (
                <div className="space-y-3">
                  {track ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-lg border border-white/20 shrink-0">
                          <img src={track.cover} alt="" className="w-full h-full object-cover" />
                          {playing && (
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center backdrop-blur-[1px]">
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
                            <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                              {playing ? "Playing" : "Paused"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowQueuePeek(!showQueuePeek)}
                              className="text-[10px] text-white/50 hover:text-white transition cursor-pointer"
                            >
                              {showQueuePeek ? "Hide Queue" : "Next Up ▾"}
                            </button>
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
                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (systemSounds) soundFx.playClick();
                              prev();
                            }}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
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
                            className="w-10 h-10 rounded-full bg-accent hover:brightness-110 active:scale-95 text-accent-contrast shadow-md flex items-center justify-center transition cursor-pointer"
                            title={playing ? "Pause" : "Play"}
                          >
                            {playing ? <GIconPause size={17} /> : <GIconPlay size={17} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (systemSounds) soundFx.playClick();
                              next();
                            }}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
                            title="Next track"
                          >
                            <GIconForward size={13} />
                          </button>
                        </div>

                        {/* Interactive Volume Slider */}
                        <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10">
                          <GIconVolume size={13} className="text-white/50 shrink-0" />
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

                      {/* Next Up Queue Peek */}
                      {showQueuePeek && (
                        <div className="pt-2 border-t border-white/10 space-y-1 max-h-36 overflow-y-auto thin-scroll">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 px-1">
                            Playlist Queue ({queue.length} Tracks)
                          </div>
                          {queue.map((t, idx) => (
                            <div
                              key={t.id || idx}
                              onClick={() => {
                                if (systemSounds) soundFx.playClick();
                                playQueueAt(queue, idx);
                              }}
                              className={`flex items-center gap-2 p-1.5 rounded-xl cursor-pointer transition ${
                                queueIdx === idx
                                  ? "bg-accent/20 border border-accent/30 text-white font-medium"
                                  : "hover:bg-white/5 text-white/70 hover:text-white"
                              }`}
                            >
                              <div className="w-6 h-6 rounded-md overflow-hidden shrink-0">
                                <img src={t.cover} alt="" className="w-full h-full object-cover" />
                              </div>
                              <span className="text-[11px] truncate flex-1">{t.title}</span>
                              <span className="text-[9px] text-white/40 font-mono">
                                {formatTime(t.duration || 30)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-5 text-center text-white/50 space-y-2">
                      <GIconMusic size={26} className="mx-auto text-white/30" />
                      <p className="text-xs">No media queue loaded</p>
                      <button
                        type="button"
                        onClick={() => openApp("music")}
                        className="px-4 py-1.5 rounded-xl bg-accent text-accent-contrast text-xs font-semibold hover:brightness-110 transition cursor-pointer"
                      >
                        Launch Music App
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ================= TAB 2: CHATS & ORGANIZED IPHONE COMPOSER ================= */}
              {activeTab === "chats" && (
                <div className="space-y-2.5">
                  {/* Clean Sub-header (NO GREEN DOT) */}
                  <div className="flex items-center justify-between pb-1 border-b border-white/5">
                    {/* Organized visitor count badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
                      <GIconPersons size={12} className="text-white/60" />
                      <span className="font-semibold text-white/90">
                        {onlineCount} {onlineCount === 1 ? "Visitor" : "Visitors"} in Chat
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {unreadChatCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            clearUnreadChat();
                            if (systemSounds) soundFx.playClick();
                          }}
                          className="px-2 py-0.5 rounded-lg text-[10px] text-accent hover:bg-accent/15 transition font-semibold cursor-pointer"
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
                        className="px-2.5 py-1 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                      >
                        <span>Open Full App</span>
                        <span>↗</span>
                      </button>
                    </div>
                  </div>

                  {/* Recent Messages Stream with reactions */}
                  <div className="space-y-1.5 max-h-[175px] overflow-y-auto thin-scroll pr-1">
                    {chatMessages.length > 0 ? (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition flex items-start gap-2.5 text-xs group"
                        >
                          <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-accent/40 to-accent/10 text-accent font-bold text-[10px] flex items-center justify-center shrink-0 border border-accent/25 shadow-xs">
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
                            <p className="text-[11px] text-white/80 leading-relaxed break-words mt-0.5">
                              {msg.text}
                            </p>

                            {/* Quick Emoji Reaction Action Bar */}
                            <div className="flex items-center gap-1 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              {["❤️", "🔥", "🚀", "👍"].map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleQuickReact(msg.id, emoji)}
                                  className="text-[10px] hover:scale-125 active:scale-95 transition-transform p-0.5 cursor-pointer"
                                >
                                  {emoji} {msg.reactions?.[emoji] ? `(${msg.reactions[emoji]})` : ""}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-white/40 text-xs">
                        No recent messages yet. Say hello below!
                      </div>
                    )}
                  </div>

                  {/* Organized Unified iMessage Capsule Composer */}
                  <form onSubmit={handleSendQuickChat} className="pt-1">
                    <div className="rounded-full bg-white/[0.08] hover:bg-white/[0.12] focus-within:bg-white/[0.12] border border-white/15 focus-within:border-accent p-1 pl-3.5 flex items-center gap-2 transition-all shadow-inner">
                      <input
                        type="text"
                        value={quickChatInput}
                        onChange={(e) => setQuickChatInput(e.target.value)}
                        placeholder="Message visitors as Guest..."
                        className="flex-1 bg-transparent text-xs text-white placeholder:text-white/40 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!quickChatInput.trim()}
                        className="w-7 h-7 rounded-full bg-accent text-accent-contrast disabled:opacity-30 disabled:scale-95 hover:scale-105 active:scale-95 flex items-center justify-center transition cursor-pointer shrink-0 shadow-sm"
                        title="Send message"
                      >
                        <GIconPaperPlane size={11} />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ================= TAB 3: UPDATES & REAL PR FEED ================= */}
              {activeTab === "updates" && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-white/5">
                    <div className="flex items-center gap-1.5">
                      <GIconRocket size={13} className="text-purple-400" />
                      <span className="text-xs font-bold text-white">Changelog & PRs</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                        280 Total
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
                        Open Updates ↗
                      </button>
                    </div>
                  </div>

                  {/* Search Bar + Filter Pills */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs">
                      <GIconSearch size={11} className="text-white/40 shrink-0" />
                      <input
                        type="text"
                        value={prSearchQuery}
                        onChange={(e) => setPrSearchQuery(e.target.value)}
                        placeholder="Search 280 PRs by title..."
                        className="bg-transparent text-[11px] text-white placeholder:text-white/40 outline-none w-full"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-[10px]">
                      {(["all", "feature", "fix"] as const).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => {
                            if (systemSounds) soundFx.playClick();
                            setUpdateFilter(filter);
                          }}
                          className={`px-2.5 py-0.5 rounded-lg font-medium capitalize transition cursor-pointer ${
                            updateFilter === filter
                              ? "bg-white/20 text-white font-semibold"
                              : "text-white/45 hover:text-white/80"
                          }`}
                        >
                          {filter === "all" ? "All" : filter === "feature" ? "Features" : "Fixes"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PR Changelog Cards */}
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
                              <span className="text-[9px] font-mono text-purple-300 font-semibold">
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

              {/* ================= TAB 4: FOCUS / STOPWATCH & AMBIENT SOUNDS ================= */}
              {activeTab === "focus" && (
                <div className="space-y-3">
                  {/* Focus Sub-mode Switcher */}
                  <div className="flex items-center justify-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10 max-w-[200px] mx-auto">
                    <button
                      type="button"
                      onClick={() => setFocusMode("timer")}
                      className={`flex-1 py-1 text-[10px] font-semibold rounded-lg transition cursor-pointer ${
                        focusMode === "timer" ? "bg-white/20 text-white shadow-xs" : "text-white/50 hover:text-white"
                      }`}
                    >
                      Pomodoro Timer
                    </button>
                    <button
                      type="button"
                      onClick={() => setFocusMode("stopwatch")}
                      className={`flex-1 py-1 text-[10px] font-semibold rounded-lg transition cursor-pointer ${
                        focusMode === "stopwatch" ? "bg-white/20 text-white shadow-xs" : "text-white/50 hover:text-white"
                      }`}
                    >
                      Stopwatch
                    </button>
                  </div>

                  {focusMode === "timer" ? (
                    <>
                      {/* Big Digital Countdown */}
                      <div className="flex flex-col items-center justify-center py-1 space-y-1">
                        <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white drop-shadow-md">
                          {timerSeconds !== null ? formatTime(timerSeconds) : formatTime(timerInitial)}
                        </div>
                        <div className="text-[11px] text-white/60">
                          {timerRunning ? "Focus Session in Progress" : "Ready to Focus"}
                        </div>
                      </div>

                      {/* Presets Grid */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: "5m", sec: 300, sub: "Quick" },
                          { label: "15m", sec: 900, sub: "Short" },
                          { label: "25m", sec: 1500, sub: "Pomo" },
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
                      <div className="flex items-center justify-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (systemSounds) soundFx.playPop();
                            if (!timerRunning && timerSeconds === null) {
                              setTimerSeconds(timerInitial);
                            }
                            setTimerRunning((prev) => !prev);
                          }}
                          className="px-5 py-2 rounded-xl bg-accent text-accent-contrast font-semibold text-xs shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
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
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white/80 font-semibold text-xs transition cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Stopwatch Display */}
                      <div className="flex flex-col items-center justify-center py-2 space-y-1">
                        <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-cyan-300 drop-shadow-md">
                          {formatTime(stopwatchSeconds)}
                        </div>
                        <div className="text-[11px] text-white/60">
                          {stopwatchRunning ? "Elapsed Time Tracking" : "Stopwatch Paused"}
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (systemSounds) soundFx.playPop();
                            setStopwatchRunning((prev) => !prev);
                          }}
                          className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
                        >
                          {stopwatchRunning ? <GIconPause size={13} /> : <GIconPlay size={13} />}
                          <span>{stopwatchRunning ? "Pause" : "Start"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (systemSounds) soundFx.playClick();
                            setStopwatchRunning(false);
                            setStopwatchSeconds(0);
                          }}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white/80 font-semibold text-xs transition cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>
                    </>
                  )}

                  {/* Ambient Focus Sounds Selector */}
                  <div className="pt-2 border-t border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-white/50 px-1 font-semibold uppercase tracking-wider">
                      <span>Ambient Focus Atmosphere</span>
                      {activeAmbient && (
                        <button
                          type="button"
                          onClick={stopAmbient}
                          className="text-accent hover:underline cursor-pointer lowercase"
                        >
                          Stop Sound
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: "rain" as const, label: "Rain", icon: "🌧️" },
                        { id: "forest" as const, label: "Forest", icon: "🌲" },
                        { id: "waves" as const, label: "Waves", icon: "🌊" },
                        { id: "whitenoise" as const, label: "White", icon: "📻" },
                      ].map((amb) => (
                        <button
                          key={amb.id}
                          type="button"
                          onClick={() => {
                            if (systemSounds) soundFx.playClick();
                            if (activeAmbient === amb.id) stopAmbient();
                            else playAmbient(amb.id);
                          }}
                          className={`p-1.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            activeAmbient === amb.id
                              ? "bg-accent/20 border-accent text-accent shadow-xs"
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                          }`}
                        >
                          <span className="text-sm">{amb.icon}</span>
                          <span className="text-[10px] font-medium">{amb.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 5: VITALS, SHORTCUTS & QUICK MEMO ================= */}
              {activeTab === "hub" && (
                <div className="space-y-3">
                  {/* System Vitals Bar */}
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-white/50">
                      <span>System Vitals</span>
                      <span className="font-mono text-emerald-400">100% Operational</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-1.5 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-[10px] text-white/40">CPU Load</div>
                        <div className="text-xs font-mono font-bold text-accent">14%</div>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-[10px] text-white/40">Memory</div>
                        <div className="text-xs font-mono font-bold text-emerald-300">4.1 / 8GB</div>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-[10px] text-white/40">Ping</div>
                        <div className="text-xs font-mono font-bold text-sky-300">24ms</div>
                      </div>
                    </div>
                  </div>

                  {/* System Controls Bar */}
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
                      <span className="text-[10px] text-white/80 font-medium capitalize truncate">
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

                  {/* Quick Scratchpad Note */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-white/40 px-0.5">
                      <span>Quick Scratchpad</span>
                      <span className="text-[9px] text-white/30 lowercase">auto-saved</span>
                    </div>
                    <textarea
                      value={quickMemo}
                      onChange={(e) => {
                        setQuickMemo(e.target.value);
                        try {
                          localStorage.setItem("os_quick_memo", e.target.value);
                        } catch {}
                      }}
                      placeholder="Type a quick note, phone number or thought..."
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 focus:border-accent rounded-xl p-2 text-xs text-white placeholder:text-white/30 resize-none outline-none leading-relaxed"
                    />
                  </div>

                  {/* Quick App Launchers Grid */}
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1 px-0.5">
                      Launch Applications
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: "terminal", label: "Terminal", icon: GIconTerminal, color: "text-green-400 bg-green-500/10 border-green-500/20" },
                        { id: "notes", label: "Notes", icon: GIconNotes, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                        { id: "calculator", label: "Calculator", icon: GIconCalculator, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
                        { id: "games", label: "Games", icon: GIconGames, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
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
