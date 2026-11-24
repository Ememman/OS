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
  senderId?: string;
  text: string;
  ts: number;
  removed?: boolean;
  reactions?: Record<string, number>;
}

const KEY_TO_UNICODE: Record<string, string> = {
  heart: "❤️",
  thumbsup: "👍",
  smile: "😂",
  flame: "🔥",
  rocket: "🚀",
  zap: "🎉",
};

const UNICODE_TO_KEY: Record<string, string> = {
  "❤️": "heart",
  "👍": "thumbsup",
  "😂": "smile",
  "😆": "smile",
  "🔥": "flame",
  "🚀": "rocket",
  "🎉": "zap",
  "⚡": "zap",
  heart: "heart",
  thumbsup: "thumbsup",
  smile: "smile",
  flame: "flame",
  rocket: "rocket",
  zap: "zap",
};

function normalizeReactions(raw: Record<string, number> | undefined): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const normalized: Record<string, number> = {};
  for (const [k, count] of Object.entries(raw)) {
    const key = UNICODE_TO_KEY[k] || k;
    const num = Number(count || 0);
    if (num > 0) {
      normalized[key] = (normalized[key] || 0) + num;
    }
  }
  return normalized;
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
    setDynamicIslandExpanded,
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
  const chatPopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // User's own active reactions (msgId -> reaction canonical key)
  const [userReactions, setUserReactions] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("os_chat_user_reactions") || "{}");
    } catch {
      return {};
    }
  });

  // Sync userReactions with storage events across tabs/windows
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "os_chat_user_reactions" && e.newValue) {
        try {
          setUserReactions(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Queue peek in Media Tab
  const showQueuePeekState = useState(false);
  const [showQueuePeek, setShowQueuePeek] = showQueuePeekState;

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

  // Socket listener for real-time chat messages, reactions, removal & presence in the Dynamic Island
  useEffect(() => {
    let socket: any = null;
    try {
      socket = getSocket();
    } catch {
      return;
    }

    const syncHistory = (history: any[], online?: number) => {
      if (typeof online === "number") setOnlineCount(Math.max(1, online));
      if (!Array.isArray(history) || history.length === 0) return;

      const curSession = getChatSession();

      // Sync userReactions from history
      setUserReactions((prev) => {
        const merged = { ...prev };
        for (const h of history) {
          if (h.userReactions && h.userReactions[curSession.clientId]) {
            merged[h.id] = h.userReactions[curSession.clientId];
          }
        }
        try {
          localStorage.setItem("os_chat_user_reactions", JSON.stringify(merged));
        } catch {}
        return merged;
      });

      const formatted: ChatSnippet[] = history.slice(-8).map((h: any) => {
        const isFromMe = Boolean(
          (h?.senderId && h.senderId === curSession.clientId) ||
          (curSession.name && h?.name && h.name.toLowerCase() === curSession.name.toLowerCase())
        );
        const isRemoved = Boolean(
          h.removed ||
          h.text === "You unsent a message" ||
          h.text === "Message removed" ||
          (h.text && h.text.includes("removed a message"))
        );
        return {
          id: h.id || String(h.ts || Math.random()),
          name: isFromMe ? (curSession.name || "You") : (h.name || "Guest"),
          senderId: h.senderId,
          text: isRemoved
            ? (isFromMe ? "You removed a message" : `${h.name || "A user"} removed a message`)
            : (h.text || ""),
          removed: isRemoved,
          ts: h.ts || Date.now(),
          reactions: normalizeReactions(h.reactions),
        };
      });
      setChatMessages(formatted);
    };

    // If cache already has data, load it immediately
    const cached = getCachedChatInit();
    if (cached) {
      syncHistory(cached.history, cached.online);
    }

    const onInit = (data: any) => {
      if (data) {
        syncHistory(data.history, data.online);
      }
    };

    const onMessage = (msg: any) => {
      const curSession = getChatSession();
      const isFromMe = Boolean(
        (msg?.senderId && msg.senderId === curSession.clientId) ||
        (curSession.name && msg?.name && msg.name.toLowerCase() === curSession.name.toLowerCase())
      );
      const isRemoved = Boolean(
        msg.removed ||
        msg.text === "You unsent a message" ||
        msg.text === "Message removed" ||
        (msg.text && msg.text.includes("removed a message"))
      );

      const snippet: ChatSnippet = {
        id: msg.id || String(Date.now()),
        name: isFromMe ? (curSession.name || "You") : (msg.name || "Guest"),
        senderId: msg.senderId,
        text: isRemoved
          ? (isFromMe ? "You removed a message" : `${msg.name || "A user"} removed a message`)
          : (msg.text || ""),
        removed: isRemoved,
        ts: msg.ts || Date.now(),
        reactions: normalizeReactions(msg.reactions),
      };

      setChatMessages((prev) => {
        // If an optimistic temp message exists, replace it
        const tempIdx = prev.findIndex(
          (m) =>
            (msg.tempId && m.id === msg.tempId) ||
            (isFromMe && m.text === snippet.text && Math.abs(m.ts - snippet.ts) < 10000)
        );
        if (tempIdx !== -1) {
          const copy = [...prev];
          copy[tempIdx] = snippet;
          return copy;
        }

        // If message already exists by id, replace it
        const existingIdx = prev.findIndex((m) => m.id === snippet.id);
        if (existingIdx !== -1) {
          const copy = [...prev];
          copy[existingIdx] = snippet;
          return copy;
        }

        // Otherwise append and keep latest 8
        return [...prev.slice(-7), snippet];
      });

      // Pop the Island with the incoming message if not from current user and not removed
      if (!isFromMe && !isRemoved) {
        setRecentChatMessage({ sender: snippet.name, text: snippet.text });
        if (chatPopTimerRef.current) clearTimeout(chatPopTimerRef.current);
        chatPopTimerRef.current = setTimeout(() => {
          setRecentChatMessage(null);
        }, 4500);
      }
    };

    const onReacted = ({ id, emoji, reactions, senderId, removed }: any) => {
      const canonicalKey = UNICODE_TO_KEY[emoji] || emoji || "heart";
      const curSession = getChatSession();
      const isFromMe = Boolean(senderId && senderId === curSession.clientId);

      if (isFromMe) {
        setUserReactions((prev) => {
          const next = { ...prev };
          if (removed) {
            delete next[id];
          } else {
            next[id] = canonicalKey;
          }
          try {
            localStorage.setItem("os_chat_user_reactions", JSON.stringify(next));
          } catch {}
          return next;
        });
      }

      setChatMessages((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          let nextReactions: Record<string, number>;
          if (reactions) {
            nextReactions = normalizeReactions(reactions);
          } else {
            nextReactions = normalizeReactions(m.reactions);
            if (removed) {
              if (nextReactions[canonicalKey]) {
                nextReactions[canonicalKey] = Math.max(0, nextReactions[canonicalKey] - 1);
                if (nextReactions[canonicalKey] === 0) delete nextReactions[canonicalKey];
              }
            } else {
              nextReactions[canonicalKey] = (nextReactions[canonicalKey] || 0) + 1;
            }
          }
          return { ...m, reactions: nextReactions };
        })
      );
    };

    const onMessageRemoved = ({ id, name, senderId }: { id: string; name?: string; senderId?: string }) => {
      const curSession = getChatSession();
      const isFromMe = Boolean(
        (senderId && senderId === curSession.clientId) ||
        (curSession.name && name && name.toLowerCase() === curSession.name.toLowerCase())
      );
      setChatMessages((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          return {
            ...m,
            removed: true,
            text: isFromMe ? "You removed a message" : `${name || m.name || "A user"} removed a message`,
          };
        })
      );
    };

    const onPresence = (data: any) => {
      if (typeof data?.online === "number") {
        setOnlineCount(Math.max(1, data.online));
      }
    };

    socket.on("chat:init", onInit);
    socket.on("chat:message", onMessage);
    socket.on("chat:reacted", onReacted);
    socket.on("chat:message_removed", onMessageRemoved);
    socket.on("chat:presence", onPresence);

    return () => {
      socket.off("chat:init", onInit);
      socket.off("chat:message", onMessage);
      socket.off("chat:reacted", onReacted);
      socket.off("chat:message_removed", onMessageRemoved);
      socket.off("chat:presence", onPresence);
      if (chatPopTimerRef.current) clearTimeout(chatPopTimerRef.current);
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

  useEffect(() => {
    setDynamicIslandExpanded(isExpanded);
  }, [isExpanded, setDynamicIslandExpanded]);

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
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const payload = {
        text: quickChatInput.trim(),
        name: curSession.name || "Guest",
        senderId: curSession.clientId,
        tempId,
      };

      setChatMessages((prev) => [
        ...prev.slice(-7),
        {
          id: tempId,
          name: curSession.name || "You",
          senderId: curSession.clientId,
          text: quickChatInput.trim(),
          ts: Date.now(),
          reactions: {},
        },
      ]);
      setQuickChatInput("");
      soundFx.playPop();

      socket.emit("chat:message", payload, (res: any) => {
        if (res?.ok && res.message) {
          setChatMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? {
                    id: res.message.id,
                    name: curSession.name || "You",
                    senderId: curSession.clientId,
                    text: res.message.text,
                    ts: res.message.ts,
                    reactions: normalizeReactions(res.message.reactions),
                  }
                : m
            )
          );
        }
      });
    } catch {
      notify("Chat Offline", "Could not broadcast message.", "error", 2200);
    }
  };

  // Quick emoji react to chat message
  const handleQuickReact = (msgId: string, rawKey: string) => {
    if (systemSounds) soundFx.playPop();
    const canonicalKey = UNICODE_TO_KEY[rawKey] || rawKey;
    const currentReaction = userReactions[msgId];
    const unicodeEmoji = KEY_TO_UNICODE[canonicalKey] || rawKey;
    const curSession = getChatSession();

    if (currentReaction) {
      if (currentReaction === canonicalKey) {
        // Toggle off existing reaction
        setUserReactions((prev) => {
          const next = { ...prev };
          delete next[msgId];
          try {
            localStorage.setItem("os_chat_user_reactions", JSON.stringify(next));
          } catch {}
          return next;
        });

        try {
          getSocket().emit("chat:react", {
            id: msgId,
            emoji: unicodeEmoji,
            key: canonicalKey,
            senderId: curSession.clientId,
            action: "remove",
          });
        } catch {}

        setChatMessages((prev) =>
          prev.map((m) => {
            if (m.id !== msgId) return m;
            const norm = normalizeReactions(m.reactions);
            if (norm[canonicalKey]) {
              norm[canonicalKey] = Math.max(0, norm[canonicalKey] - 1);
              if (norm[canonicalKey] === 0) delete norm[canonicalKey];
            }
            return { ...m, reactions: norm };
          })
        );
        return;
      } else {
        // Switching reaction: remove old, then add new
        const oldKey = currentReaction;
        const oldUnicode = KEY_TO_UNICODE[oldKey] || oldKey;
        try {
          const s = getSocket();
          s.emit("chat:react", {
            id: msgId,
            emoji: oldUnicode,
            key: oldKey,
            senderId: curSession.clientId,
            action: "remove",
          });
          s.emit("chat:react", {
            id: msgId,
            emoji: unicodeEmoji,
            key: canonicalKey,
            senderId: curSession.clientId,
            action: "add",
          });
        } catch {}

        setUserReactions((prev) => {
          const next = { ...prev, [msgId]: canonicalKey };
          try {
            localStorage.setItem("os_chat_user_reactions", JSON.stringify(next));
          } catch {}
          return next;
        });

        setChatMessages((prev) =>
          prev.map((m) => {
            if (m.id !== msgId) return m;
            const norm = normalizeReactions(m.reactions);
            if (norm[oldKey]) {
              norm[oldKey] = Math.max(0, norm[oldKey] - 1);
              if (norm[oldKey] === 0) delete norm[oldKey];
            }
            norm[canonicalKey] = (norm[canonicalKey] || 0) + 1;
            return { ...m, reactions: norm };
          })
        );
        return;
      }
    }

    // New reaction
    setUserReactions((prev) => {
      const next = { ...prev, [msgId]: canonicalKey };
      try {
        localStorage.setItem("os_chat_user_reactions", JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      getSocket().emit("chat:react", {
        id: msgId,
        emoji: unicodeEmoji,
        key: canonicalKey,
        senderId: curSession.clientId,
        action: "add",
      });
    } catch {}

    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const norm = normalizeReactions(m.reactions);
        norm[canonicalKey] = (norm[canonicalKey] || 0) + 1;
        return { ...m, reactions: norm };
      })
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
  const hasActiveWindow = windows.some((w) => !w.minimized);

  // Responsive positioning:
  // - macOS & Mobile: centered seamlessly inside the top MenuBar / status cutout at top-0.5 sm:top-1
  // - Windows: floating at top-2 sm:top-2.5
  const topPosition = isMac ? "top-0.5 sm:top-1" : "top-2 sm:top-2.5";

  // Optical centering:
  // - When expanded or on desktop or when an active window covers MenuBar: center horizontally (left-1/2)
  // - On mobile desktop view with MenuBar visible: shift slightly left into the empty gap between the
  //   left </> logo and the right button cluster (left-[calc(50%-64px)]) so it never covers right buttons.
  const horizontalPosition = isExpanded
    ? "left-1/2 -translate-x-1/2"
    : isMobile && !hasActiveWindow && isMac
      ? "left-[calc(50%-64px)] sm:left-1/2 -translate-x-1/2"
      : "left-1/2 -translate-x-1/2";

  if (!dynamicIslandEnabled) return null;

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed ${topPosition} ${horizontalPosition} z-[1001] select-none flex flex-col items-center pointer-events-auto transition-[top,left] duration-200`}
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
            : "rounded-full px-2 sm:px-4 md:px-5 h-7 sm:h-8 flex items-center justify-center gap-1.5 sm:gap-2.5 min-w-[96px] sm:min-w-[180px] md:min-w-[220px] hover:border-white/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
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
                  <div className="space-y-2 max-h-[200px] overflow-y-auto thin-scroll pr-1">
                    {chatMessages.length > 0 ? (
                      chatMessages.map((msg) => {
                        const curSession = getChatSession();
                        const isFromMe = Boolean(
                          (msg.senderId && msg.senderId === curSession.clientId) ||
                          (curSession.name && msg.name.toLowerCase() === curSession.name.toLowerCase()) ||
                          msg.name === "You"
                        );
                        const activeReaction = userReactions[msg.id];
                        const normReactions = normalizeReactions(msg.reactions);
                        const reactionEntries = Object.entries(normReactions).filter(([, count]) => count > 0);

                        return (
                          <div
                            key={msg.id}
                            className={`p-2.5 rounded-2xl border transition flex items-start gap-2.5 text-xs group ${
                              isFromMe
                                ? "bg-accent/[0.08] border-accent/25 hover:border-accent/40"
                                : "bg-white/5 border-white/10 hover:border-white/20"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-xl font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs ${
                                isFromMe
                                  ? "bg-accent text-accent-contrast"
                                  : "bg-gradient-to-tr from-white/20 to-white/5 text-white/90 border border-white/10"
                              }`}
                            >
                              {msg.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`font-semibold text-[11px] truncate ${isFromMe ? "text-accent" : "text-white/90"}`}>
                                  {isFromMe ? (curSession.name || "You") : msg.name}
                                </span>
                                <span className="text-[9px] text-white/35 font-mono shrink-0">
                                  {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <p className={`text-[11px] leading-relaxed break-words mt-0.5 ${
                                msg.removed ? "italic text-white/40 select-none" : "text-white/85"
                              }`}>
                                {msg.text}
                              </p>

                              {/* Live Reactions Summary Badges */}
                              {reactionEntries.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                  {reactionEntries.map(([key, count]) => {
                                    const emo = KEY_TO_UNICODE[key] || key;
                                    const isMine = activeReaction === key;
                                    return (
                                      <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleQuickReact(msg.id, key)}
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition cursor-pointer border ${
                                          isMine
                                            ? "bg-accent/25 border-accent text-white font-bold shadow-xs scale-105 ring-1 ring-accent/30"
                                            : "bg-white/10 border-white/15 text-white/80 hover:bg-white/20"
                                        }`}
                                        title={isMine ? "Remove your reaction" : `React with ${emo}`}
                                      >
                                        <span>{emo}</span>
                                        <span className="font-mono text-[9px]">{count}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Quick Emoji Reaction Action Bar */}
                              {!msg.removed && (
                                <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-white/5 opacity-60 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[9px] text-white/35 font-medium mr-0.5">React:</span>
                                  {[
                                    { key: "heart", emo: "❤️" },
                                    { key: "flame", emo: "🔥" },
                                    { key: "rocket", emo: "🚀" },
                                    { key: "thumbsup", emo: "👍" },
                                    { key: "smile", emo: "😂" },
                                  ].map(({ key, emo }) => {
                                    const isSelected = activeReaction === key;
                                    return (
                                      <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleQuickReact(msg.id, key)}
                                        className={`text-[11px] hover:scale-130 active:scale-95 transition-all p-0.5 rounded cursor-pointer ${
                                          isSelected
                                            ? "scale-115 bg-white/20 ring-1 ring-accent"
                                            : "hover:bg-white/10"
                                        }`}
                                        title={isSelected ? `Remove ${emo}` : `React with ${emo}`}
                                      >
                                        {emo}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
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
                        setThemeMode(themeMode === "night" ? "dark" : themeMode === "dark" ? "light" : "night");
                      }}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer flex flex-col items-center justify-center gap-1"
                    >
                      <GIconMoon size={14} className="text-indigo-400" />
                      <span className="text-[10px] text-white/80 font-medium capitalize truncate">
                        {themeMode === "night" ? "OLED" : themeMode}
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
