import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GIconPaperPlane,
  GIconPersons,
  GIconPencil,
  GIconCheck,
  GIconRotateRight,
  GIconSliders,
  GIconVolume,
  GIconVolumeMute,
  GIconSearch,
  GIconPin,
  GIconDownload,
  GIconClose,
  GIconHeart,
  GIconFlame,
  GIconThumbsUp,
  GIconRocket,
  GIconSmile,
  GIconThunderbolt,
  GIconRotateLeft,
} from "../icons/GravityIcons";
import { getSocket, getCachedChatInit } from "../../lib/socket";
import { getChatSession, touchChatActivity, saveChatName, getLastReadChatTs, setLastReadChatTs } from "../../lib/chatSession";
import { useOS } from "../../store/useOS";
import { useOutsideClick } from "../../lib/useOutsideClick";
import { useIsMobile } from "../../lib/useMediaQuery";
import { soundFx } from "../../lib/soundFx";
import { API_URL } from "../../lib/config";

const BG_OPTIONS = [
  {
    id: "ink",
    label: "Midnight Dark",
    desc: "Deep OLED night mode",
    swatch: "#0d1117",
    border: "border-slate-700",
  },
  {
    id: "action",
    label: "Evening Slate",
    desc: "Manga ink & dark graphite tone",
    swatch: "#151d28",
    border: "border-slate-600",
  },
  {
    id: "halftone",
    label: "Soft Paper",
    desc: "Vintage newsprint halftone texture",
    swatch: "#f4f1ea",
    border: "border-stone-400/50",
  },
  {
    id: "notebook",
    label: "Notebook",
    desc: "Lined legal blue rules",
    swatch: "#f4f8fc",
    border: "border-sky-300/60",
  },
  {
    id: "plain",
    label: "Warm Neutral",
    desc: "Creamy editorial paper tone",
    swatch: "#f5f0e6",
    border: "border-stone-300/60",
  },
];

const CHAT_REACTIONS = [
  { id: "heart", label: "Love", Icon: GIconHeart, color: "text-rose-500", glow: "shadow-rose-500/50" },
  { id: "thumbsup", label: "Like", Icon: GIconThumbsUp, color: "text-sky-400", glow: "shadow-sky-400/50" },
  { id: "smile", label: "Haha", Icon: GIconSmile, color: "text-amber-400", glow: "shadow-amber-400/50" },
  { id: "flame", label: "Fire", Icon: GIconFlame, color: "text-orange-500", glow: "shadow-orange-500/50" },
  { id: "rocket", label: "Rocket", Icon: GIconRocket, color: "text-purple-400", glow: "shadow-purple-400/50" },
  { id: "zap", label: "Zap", Icon: GIconThunderbolt, color: "text-yellow-400", glow: "shadow-yellow-400/50" },
];

const QUICK_RESPONSES = [
  "Hello!",
  "Great work!",
  "Looking good!",
  "Let's connect",
  "Awesome",
  "Nice project!",
];

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

function ReactionIcon({ emo, size = 12 }: { emo: string; size?: number }) {
  if (emo === "❤️" || emo === "heart") return <GIconHeart size={size} className="text-rose-500" />;
  if (emo === "👍" || emo === "thumbsup") return <GIconThumbsUp size={size} className="text-sky-400" />;
  if (emo === "🔥" || emo === "flame") return <GIconFlame size={size} className="text-orange-500" />;
  if (emo === "🚀" || emo === "rocket") return <GIconRocket size={size} className="text-purple-400" />;
  if (emo === "⚡" || emo === "zap") return <GIconThunderbolt size={size} className="text-yellow-400" />;
  if (emo === "smile" || emo === "😂") return <GIconSmile size={size} className="text-amber-400" />;
  return <GIconSmile size={size} className="text-amber-400" />;
}

const ACK_TIMEOUT_MS = 6000;

function playPing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    /* audio not available — ignore */
  }
}

// A short, stable-per-name hash so each guest gets a consistent "character" color.
function nameColor(name: string) {
  const palette = ["#7F1D1D", "#14532D", "#1E3A8A", "#6B21A8", "#9A3412", "#0F766E"];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = (hash * 31 + name.charCodeAt(i)) % palette.length;
  return palette[Math.abs(hash) % palette.length];
}

function BgPicker({ current, onPick, onClose }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const { systemSounds } = useOS();
  useOutsideClick(ref, onClose);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.94, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -6 }}
      transition={{ type: "spring", stiffness: 450, damping: 28 }}
      role="group"
      aria-label="Chat color theme"
      className="absolute top-full right-0 mt-2 w-64 sm:w-72 z-[1300] bg-[#101524]/95 backdrop-blur-2xl rounded-2xl p-3 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-white select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <GIconSliders size={13} className="text-accent" />
          <span className="text-xs font-semibold text-white/90">Chat Theme</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
          title="Close"
        >
          <GIconClose size={12} />
        </button>
      </div>

      {/* Theme List */}
      <div className="space-y-1">
        {BG_OPTIONS.map((o) => {
          const isSelected = current === o.id;
          return (
            <motion.button
              key={o.id}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (systemSounds) soundFx.playClick();
                onPick(o.id);
                onClose();
              }}
              aria-pressed={isSelected}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer text-left ${
                isSelected
                  ? "bg-white/12 border border-white/20 shadow-sm"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              {/* Swatch Preview Pill */}
              <div
                className={`w-7 h-7 rounded-lg border ${o.border} shadow-sm shrink-0 flex items-center justify-center`}
                style={{ background: o.swatch }}
              >
                {isSelected && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      o.id === "ink" || o.id === "action" ? "bg-white" : "bg-black"
                    }`}
                  />
                )}
              </div>

              {/* Label & Description */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white/95 flex items-center justify-between">
                  <span>{o.label}</span>
                  {isSelected && <GIconCheck size={12} className="text-accent shrink-0 ml-1" />}
                </div>
                <div className="text-[10px] text-white/50 truncate leading-tight mt-0.5">
                  {o.desc}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function Chats() {
  const isMobile = useIsMobile();
  const chatSound = useOS((s) => s.chatSound);
  const toggleChatSound = useOS((s) => s.toggleChatSound);
  const reduceMotion = useOS((s) => s.reduceMotion);
  const chatBg = useOS((s) => s.chatBg);
  const setChatBg = useOS((s) => s.setChatBg);
  const notify = useOS((s) => s.notify);
  const clearUnreadChat = useOS((s) => s.clearUnreadChat);

  useEffect(() => {
    clearUnreadChat();
  }, [clearUnreadChat]);

  // Word/name truncation: on mobile view truncates if > 10 chars (e.g. "BrightCommet..."),
  // on desktop view shows full name unless it exceeds 20 or more characters
  const formatUsername = (rawName?: string) => {
    if (!rawName) return "Guest";
    const clean = rawName.trim();
    const max = isMobile ? 10 : 20;
    if (clean.length > max) {
      return `${clean.slice(0, max)}...`;
    }
    return clean;
  };

  const session = useMemo(() => getChatSession(), []);
  const clientId = session.clientId;

  const cached = getCachedChatInit();
  const [connected, setConnected] = useState(() => getSocket().connected);
  const [connecting, setConnecting] = useState(() => !getSocket().connected);
  const [name, setName] = useState(() => session.name || cached?.name || "");
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [messages, setMessages] = useState<any[]>(() => cached?.history || []);
  const [pinnedList, setPinnedList] = useState<any[]>(() => cached?.pinned || []);
  const [activeUsers, setActiveUsers] = useState<any[]>(() => cached?.users || []);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [online, setOnline] = useState<number>(() =>
    typeof cached?.online === "number" ? Math.max(1, cached.online) : 1
  );
  const [text, setText] = useState("");
  const [typingName, setTypingName] = useState<string | null>(null);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const [textScale, setTextScale] = useState(() => Number(localStorage.getItem("os_chat_text_scale") || 1));

  // Search & Reply States
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string; text: string } | null>(null);

  // Messenger Reaction States
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
  const [reactionPlacement, setReactionPlacement] = useState<Record<string, "top" | "bottom">>({});
  const [bursts, setBursts] = useState<Array<{ id: string; messageId: string; emoji: string; xOffset: number }>>([]);
  const [userReactions, setUserReactions] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("os_chat_user_reactions") || "{}");
    } catch {
      return {};
    }
  });

  const listRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<any>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const usersModalRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef(name);
  nameRef.current = name;
  const clientIdRef = useRef(clientId);
  clientIdRef.current = clientId;
  const mySentIds = useRef<Set<string>>(new Set());
  const pendingTexts = useRef<Array<{ tempId: string; text: string; ts: number }>>([]);
  const longPressTimer = useRef<any>(null);
  const touchStartCoords = useRef<{ x: number; y: number } | null>(null);

  // Filter messages based on search query with ID deduplication
  const displayedMessages = useMemo(() => {
    const seen = new Set<string>();
    const unique = messages.filter((m) => {
      const key = m.id || m.tempId;
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!searchQuery.trim()) return unique;
    const q = searchQuery.toLowerCase();
    return unique.filter(
      (m) => (m.text && m.text.toLowerCase().includes(q)) || (m.name && m.name.toLowerCase().includes(q))
    );
  }, [messages, searchQuery]);

  // Track initial last read timestamp when opening chat
  const initialLastReadTsRef = useRef<number>(getLastReadChatTs());
  const [showNewDivider, setShowNewDivider] = useState(true);

  // Identify index of the first unread message from other users
  const firstUnreadIndex = useMemo(() => {
    const lastRead = initialLastReadTsRef.current;
    if (!lastRead || !showNewDivider) return -1;
    return displayedMessages.findIndex((m) => {
      const isSelf = Boolean(
        (m.senderId && m.senderId === clientId) ||
        mySentIds.current.has(m.id) ||
        (m.tempId && mySentIds.current.has(m.tempId)) ||
        (!m.senderId && name && name.toLowerCase() !== "guest" && m.name === name)
      );
      return !isSelf && m.ts > lastRead;
    });
  }, [displayedMessages, showNewDivider, clientId, name]);

  const markAsRead = useCallback(() => {
    setShowNewDivider(false);
    const latestTs = displayedMessages.length > 0 ? displayedMessages[displayedMessages.length - 1].ts : Date.now();
    setLastReadChatTs(latestTs);
    clearUnreadChat();
  }, [displayedMessages, clearUnreadChat]);

  // Keep divider visible for 4s so user can notice where new messages start, then fade out
  useEffect(() => {
    if (firstUnreadIndex === -1) {
      if (displayedMessages.length > 0) {
        setLastReadChatTs(displayedMessages[displayedMessages.length - 1].ts);
      }
      return;
    }

    const timer = setTimeout(() => {
      markAsRead();
    }, 4000);

    return () => clearTimeout(timer);
  }, [firstUnreadIndex, markAsRead, displayedMessages]);

  // When unmounting or closing the chat window, mark current messages as read
  useEffect(() => {
    return () => {
      if (displayedMessages.length > 0) {
        setLastReadChatTs(displayedMessages[displayedMessages.length - 1].ts);
      }
      clearUnreadChat();
    };
  }, [displayedMessages, clearUnreadChat]);

  // Toggle reaction tray with smart vertical placement (avoids overlapping sticky topbar on mobile/desktop)
  const toggleReactionMenu = (id: string) => {
    setActiveReactionMenu((curr) => {
      if (curr === id) return null;
      const el = document.getElementById(`msg-${id}`);
      const container = listRef.current;
      if (el && container) {
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        // If message bubble is within 90px of container top or near top of window, render below bubble
        const isNearTop = (elRect.top - containerRect.top) < 90 || elRect.top < 115;
        setReactionPlacement((prev) => ({ ...prev, [id]: isNearTop ? "bottom" : "top" }));
      }
      return id;
    });
  };

  const startLongPress = (id: string, e: React.TouchEvent | React.PointerEvent) => {
    if ("button" in e && (e as React.PointerEvent).button !== 0) return;
    const clientX = "touches" in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.PointerEvent).clientX;
    const clientY = "touches" in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.PointerEvent).clientY;
    touchStartCoords.current = { x: clientX, y: clientY };

    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      if (typeof window !== "undefined") {
        try {
          window.getSelection()?.removeAllRanges();
        } catch {}
      }
      toggleReactionMenu(id);
      if (chatSound) soundFx.playPop();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch {}
      }
    }, 340);
  };

  const cancelLongPressIfMoved = (e: React.TouchEvent | React.PointerEvent) => {
    if (!touchStartCoords.current) return;
    const clientX = "touches" in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.PointerEvent).clientX;
    const clientY = "touches" in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.PointerEvent).clientY;
    const dist = Math.hypot(clientX - touchStartCoords.current.x, clientY - touchStartCoords.current.y);
    if (dist > 8) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      touchStartCoords.current = null;
    }
  };

  const endLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    touchStartCoords.current = null;
  };

  useOutsideClick(usersModalRef, () => setShowUsersModal(false));

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      touchChatActivity();
      setConnected(true);
      setConnecting(false);
      const cur = getChatSession();
      socket.emit("chat:join", { clientId: cur.clientId, name: cur.name });
      if (cur.name) socket.emit("chat:rename", cur.name);
    };
    const onDisconnect = () => {
      setConnected(false);
      setConnecting(false);
    };
    const onConnecting = () => setConnecting(true);
    const onInit = ({ name: serverName, history, pinned, users, online: onlineCount }: any) => {
      touchChatActivity();
      setConnected(true);
      setConnecting(false);
      const cur = getChatSession();
      const chosenName = cur.name || serverName || "Guest";
      setName(chosenName);
      saveChatName(chosenName);

      if (history) {
        setUserReactions((prev) => {
          const merged = { ...prev };
          for (const h of history) {
            if (h.userReactions && h.userReactions[cur.clientId]) {
              merged[h.id] = h.userReactions[cur.clientId];
            }
          }
          try {
            localStorage.setItem("os_chat_user_reactions", JSON.stringify(merged));
          } catch {}
          return merged;
        });

        setMessages(
          history.map((h: any) => ({
            ...h,
            reactions: normalizeReactions(h.reactions),
          }))
        );
      }
      if (pinned) setPinnedList(pinned);
      if (users && Array.isArray(users)) setActiveUsers(users);

      const realOnline =
        typeof onlineCount === "number"
          ? Math.max(1, onlineCount)
          : Array.isArray(users) && users.length > 0
          ? Math.max(1, users.length)
          : 1;
      setOnline(realOnline);
    };
    const onMessage = (msg: any) => {
      touchChatActivity();
      setMessages((m) => {
        // If we already have this exact server message id, don't duplicate
        if (m.some((x) => x.id === msg.id)) return m;

        // Check if this incoming message corresponds to one sent by this client
        const isFromThisClient = Boolean(
          (msg.tempId && mySentIds.current.has(msg.tempId)) ||
          (msg.senderId && msg.senderId === clientIdRef.current) ||
          pendingTexts.current.some(
            (p) => p.text === msg.text && Math.abs(msg.ts - p.ts) < 30000
          )
        );

        if (isFromThisClient) {
          mySentIds.current.add(msg.id);
          pendingTexts.current = pendingTexts.current.filter(
            (p) => !(p.text === msg.text && Math.abs(msg.ts - p.ts) < 30000)
          );
        }

        const normalizedMsg = {
          ...msg,
          senderId: msg.senderId || (isFromThisClient ? clientIdRef.current : undefined),
          reactions: normalizeReactions(msg.reactions),
        };

        // Find pending optimistic message placeholder to replace
        const pendingIdx = m.findIndex(
          (x) =>
            x.pending &&
            ((msg.tempId && (x.id === msg.tempId || x.tempId === msg.tempId)) ||
              (isFromThisClient && x.text === msg.text))
        );

        if (pendingIdx !== -1) {
          const copy = [...m];
          copy[pendingIdx] = normalizedMsg;
          return copy;
        }

        return [...m, normalizedMsg];
      });

      if (chatSound && msg.senderId !== clientIdRef.current && !mySentIds.current.has(msg.id)) {
        playPing();
      }
    };
    const onReacted = ({ id, emoji, reactions, senderId, userReactions: srvUserReactions, removed }: any) => {
      touchChatActivity();
      const canonicalKey = UNICODE_TO_KEY[emoji] || emoji || "heart";

      const isFromMe = Boolean(senderId && senderId === clientIdRef.current);
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
      } else if (!removed) {
        const burstId = `burst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setBursts((prev) => [
          ...prev,
          { id: burstId, messageId: id, emoji: canonicalKey, xOffset: (Math.random() - 0.5) * 24 },
        ]);
        setTimeout(() => {
          setBursts((prev) => prev.filter((b) => b.id !== burstId));
        }, 900);

        if (chatSound) soundFx.playPop();
      }

      setMessages((m) =>
        m.map((x) => {
          if (x.id !== id) return x;
          let nextReactions: Record<string, number>;
          if (reactions) {
            nextReactions = normalizeReactions(reactions);
          } else {
            nextReactions = normalizeReactions(x.reactions);
            if (removed) {
              if (nextReactions[canonicalKey]) {
                nextReactions[canonicalKey] = Math.max(0, nextReactions[canonicalKey] - 1);
                if (nextReactions[canonicalKey] === 0) delete nextReactions[canonicalKey];
              }
            } else {
              nextReactions[canonicalKey] = (nextReactions[canonicalKey] || 0) + 1;
            }
          }
          const nextUserReactions = { ...(srvUserReactions || x.userReactions || {}) };
          if (senderId) {
            if (removed) {
              delete nextUserReactions[senderId];
            } else {
              nextUserReactions[senderId] = canonicalKey;
            }
          }
          return { ...x, reactions: nextReactions, userReactions: nextUserReactions };
        })
      );
    };
    const onPresence = ({ online: count, users }: any) => {
      const realOnline =
        typeof count === "number"
          ? Math.max(1, count)
          : Array.isArray(users) && users.length > 0
          ? Math.max(1, users.length)
          : 1;
      setOnline(realOnline);
      if (users && Array.isArray(users)) setActiveUsers(users);
    };
    const onUsersUpdated = (userList: any[]) => setActiveUsers(userList || []);
    const onPinned = ({ pinnedList: updatedList }: any) => {
      if (updatedList) setPinnedList(updatedList);
    };

    const onTyping = ({ name }: any) => {
      setTypingName(name);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingName(null), 1500);
    };

    const onRateLimited = ({ message: rateMsg }: any) => {
      notify("Anti-Flood Notice", rateMsg || "Please wait a moment before sending more messages.", "warning", 3500);
    };

    const onMessageDeleted = ({ id }: { id: string }) => {
      setMessages((m) => m.filter((x) => x.id !== id));
      setPinnedList((p) => p.filter((x) => x.id !== id));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("reconnect_attempt", onConnecting);
    socket.on("chat:init", onInit);
    socket.on("chat:message", onMessage);
    socket.on("chat:reacted", onReacted);
    socket.on("chat:presence", onPresence);
    socket.on("chat:users_updated", onUsersUpdated);
    socket.on("chat:pinned", onPinned);
    socket.on("chat:typing", onTyping);
    socket.on("chat:rate_limited", onRateLimited);
    socket.on("chat:message_deleted", onMessageDeleted);

    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("reconnect_attempt", onConnecting);
      socket.off("chat:init", onInit);
      socket.off("chat:message", onMessage);
      socket.off("chat:reacted", onReacted);
      socket.off("chat:presence", onPresence);
      socket.off("chat:users_updated", onUsersUpdated);
      socket.off("chat:pinned", onPinned);
      socket.off("chat:typing", onTyping);
      socket.off("chat:rate_limited", onRateLimited);
      socket.off("chat:message_deleted", onMessageDeleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSound]);

  useEffect(() => {
    // If an unread divider exists on load, scroll so the divider is visible
    const dividerEl = document.getElementById("chat-unread-divider");
    if (dividerEl) {
      dividerEl.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      return;
    }

    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [messages, typingName, reduceMotion]);

  useEffect(() => {
    if (!bgPickerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setBgPickerOpen(false);
      themeButtonRef.current?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [bgPickerOpen]);

  useEffect(() => {
    if (!activeReactionMenu) return;
    const handleClose = () => setActiveReactionMenu(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [activeReactionMenu]);

  const scrollToMessage = (targetId: string) => {
    const el = document.getElementById(`msg-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-accent", "ring-offset-2", "ring-offset-black");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-accent", "ring-offset-2", "ring-offset-black");
      }, 1600);
    }
  };

  const reactToMessage = (id: string, rawKey: string) => {
    touchChatActivity();
    const canonicalKey = UNICODE_TO_KEY[rawKey] || rawKey;
    const currentReaction = userReactions[id];
    const unicodeEmoji = KEY_TO_UNICODE[canonicalKey] || canonicalKey;

    // If the user already reacted on this message:
    if (currentReaction) {
      if (currentReaction === canonicalKey) {
        // Remove reaction: user clicked their existing reaction to un-react
        setUserReactions((prev) => {
          const next = { ...prev };
          delete next[id];
          try {
            localStorage.setItem("os_chat_user_reactions", JSON.stringify(next));
          } catch {}
          return next;
        });

        getSocket().emit("chat:react", {
          id,
          emoji: unicodeEmoji,
          key: canonicalKey,
          senderId: clientIdRef.current,
          action: "remove",
        });

        // Optimistic local decrement
        setMessages((m) =>
          m.map((x) => {
            if (x.id === id) {
              const current = normalizeReactions(x.reactions);
              if (current[canonicalKey]) {
                current[canonicalKey] = Math.max(0, current[canonicalKey] - 1);
                if (current[canonicalKey] === 0) delete current[canonicalKey];
              }
              const userRx = { ...(x.userReactions || {}) };
              delete userRx[clientIdRef.current];
              return { ...x, reactions: current, userReactions: userRx };
            }
            return x;
          })
        );

        notify("Reaction Removed", "Removed your reaction.", "info", 1800);
        return;
      } else {
        // User cannot react with a second different emoji
        notify("Already Reacted", "You have already reacted to this message. Tap your current reaction to remove it.", "info", 2500);
        return;
      }
    }

    // Persist this user's reaction locally
    setUserReactions((prev) => {
      const next = { ...prev, [id]: canonicalKey };
      try {
        localStorage.setItem("os_chat_user_reactions", JSON.stringify(next));
      } catch {}
      return next;
    });

    // Send both unicode and key so BOTH old Render server (expects ❤️) and new server accept it!
    getSocket().emit("chat:react", {
      id,
      emoji: unicodeEmoji,
      key: canonicalKey,
      senderId: clientIdRef.current,
      action: "add",
    });

    // Messenger burst animation on the message
    const burstId = `burst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setBursts((prev) => [
      ...prev,
      { id: burstId, messageId: id, emoji: canonicalKey, xOffset: (Math.random() - 0.5) * 24 },
    ]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== burstId));
    }, 900);

    soundFx.playPop();

    // Optimistic local update with normalized key
    setMessages((m) =>
      m.map((x) => {
        if (x.id === id) {
          const current = normalizeReactions(x.reactions);
          current[canonicalKey] = (current[canonicalKey] || 0) + 1;
          const userRx = { ...(x.userReactions || {}), [clientIdRef.current]: canonicalKey };
          return { ...x, reactions: current, userReactions: userRx };
        }
        return x;
      })
    );
  };

  const togglePinMessage = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/${id}/pin`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPinnedList(data.pinned || []);
        notify("Chat Pin", data.isPinned ? "Message pinned to top" : "Message unpinned", "info");
      }
    } catch {}
  };

  const sendText = (t: string) => {
    touchChatActivity();
    markAsRead();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const currentName = name || getChatSession().name || "Guest";

    mySentIds.current.add(tempId);
    pendingTexts.current.push({ tempId, text: t, ts: Date.now() });

    // Local fallback bot ONLY when completely offline and not connecting
    if (!connected && !connecting) {
      const localMsg = {
        id: tempId,
        senderId: clientId,
        name: currentName,
        text: t,
        ts: Date.now(),
        reactions: {},
        replyTo: replyTarget || undefined
      };
      setMessages((m) => [...m, localMsg]);
      setReplyTarget(null);

      setTimeout(() => {
        const lower = t.toLowerCase();
        let reply = "Hello! I am Portfolio Bot. The live Socket.IO chat server is currently reconnecting, but feel free to explore the desktop apps!";
        if (lower.includes("project") || lower.includes("work")) {
          reply = "Check out the Library app to view all featured projects, or open Resume to see work experience!";
        } else if (lower.includes("music") || lower.includes("song")) {
          reply = "Open the Music app from the dock to stream Lo-fi beats, synthwave, or search Apple Music tracks live!";
        } else if (lower.includes("game") || lower.includes("blast") || lower.includes("2048")) {
          reply = "You can play Block Blast and 2048 right now by launching the Games app from the dock!";
        }

        const botMsg = {
          id: `bot-${Date.now()}`,
          senderId: "bot",
          name: "Portfolio Bot",
          text: reply,
          ts: Date.now(),
          reactions: { heart: 1 }
        };
        setMessages((m) => [...m, botMsg]);
        if (chatSound) playPing();
      }, 600);
      return;
    }

    const optimistic = {
      id: tempId,
      tempId,
      senderId: clientId,
      name: currentName,
      text: t,
      ts: Date.now(),
      pending: true,
      reactions: {},
      replyTo: replyTarget || undefined
    };
    setMessages((m) => [...m, optimistic]);

    const payload = {
      text: t,
      senderId: clientId,
      senderName: currentName,
      tempId,
      replyTo: replyTarget || undefined
    };
    setReplyTarget(null);

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, pending: false, failed: true } : x)));
    }, ACK_TIMEOUT_MS);

    socket.emit("chat:message", payload, (res: any) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (res?.ok && res.message) {
        mySentIds.current.add(res.message.id);
        const resolved = {
          ...res.message,
          senderId: res.message.senderId || clientIdRef.current,
          reactions: normalizeReactions(res.message.reactions)
        };
        setMessages((m) => {
          const hasRealMsg = m.some((x) => x.id === res.message.id);
          if (hasRealMsg) {
            return m.filter((x) => x.id !== tempId);
          }
          return m.map((x) => (x.id === tempId ? resolved : x));
        });
      } else {
        setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, pending: false, failed: true } : x)));
      }
    });
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;
    sendText(t);
    setText("");
  };

  const retryMessage = (msg: any) => {
    setMessages((m) => m.filter((x) => x.id !== msg.id));
    sendText(msg.text);
  };

  const saveName = () => {
    const clean = draftName.trim().slice(0, 20);
    if (clean) {
      getSocket().emit("chat:rename", clean);
      setName(clean);
      saveChatName(clean);
    }
    setEditingName(false);
  };

  const changeTextScale = (delta: number) => {
    setTextScale((prev) => {
      const next = Math.max(0.7, Math.min(1.3, Math.round((prev + delta) * 10) / 10));
      localStorage.setItem("os_chat_text_scale", String(next));
      return next;
    });
  };

  const exportChat = () => {
    const json = JSON.stringify(messages, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-transcript-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify("Chat Exported", "Downloaded conversation transcript.", "success");
  };

  return (
    <div
      data-chat-bg={chatBg}
      className={`flex flex-col h-full chat-surface chat-theme--${chatBg} relative select-none`}
    >
      {/* Chat Topbar (Sticky Header) */}
      <div className="chat-topbar chat-header flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--chat-border)] bg-[var(--chat-panel)] gap-2 shrink-0 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-xs leading-none text-[var(--chat-text)]">Chats</div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
              connected
                ? "bg-accent/15 text-accent border-accent/30"
                : connecting
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse"
                : "bg-white/10 text-white/50 border-white/15"
            }`}
          >
            {connected ? "Active" : connecting ? "Connecting…" : "Offline"}
          </span>
        </div>

        {/* Right Tools Group */}
        <div className="flex items-center gap-1">
          {/* Active Participants Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUsersModal(!showUsersModal);
                touchChatActivity();
              }}
              className="chat-icon-button !min-h-7 !h-7 !min-w-0 px-2.5 rounded-full text-xs gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 transition"
              title="View active guests"
              aria-label="View active guests"
            >
              <GIconPersons size={13} className={connected ? "text-emerald-400" : "text-amber-400"} aria-hidden="true" />
              <span className="font-semibold">{connected ? Math.max(1, online, activeUsers.length) : 1}</span>
            </button>

            {/* Active Users Dropdown */}
            <AnimatePresence>
              {showUsersModal && (
                <motion.div
                  ref={usersModalRef}
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 w-56 rounded-xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 p-2.5 shadow-2xl z-50 text-xs text-white"
                >
                  <div className="font-semibold text-[11px] text-white/60 px-1 pb-1.5 border-b border-white/10 mb-1.5 flex items-center justify-between">
                    <span>Active People</span>
                    <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 text-[10px] font-medium">
                      {connected ? Math.max(1, online, activeUsers.length) : 1} active
                    </span>
                  </div>
                  <div className="max-h-44 overflow-y-auto thin-scroll space-y-1">
                    {activeUsers && activeUsers.length > 0 ? (
                      activeUsers.map((u, i) => {
                        const isMe = (u.clientId && u.clientId === clientId) || u.name === name;
                        const isIdle = Boolean(u.lastActive && Date.now() - u.lastActive > 120000);
                        return (
                          <div
                            key={u.clientId || i}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border ${
                              isMe ? "bg-accent/15 border-accent/30" : "bg-white/5 border-white/5"
                            }`}
                          >
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm"
                              style={{ background: isMe ? "var(--color-accent, #38bdf8)" : nameColor(u.name) }}
                            >
                              {isMe ? "Y" : (u.name?.[0]?.toUpperCase() || "?")}
                            </span>
                            <span className="truncate text-white/90 font-medium" title={u.name}>
                              {formatUsername(u.name)}
                            </span>
                            {isMe ? (
                              <span className="text-[10px] text-accent font-semibold ml-auto shrink-0 bg-accent/15 border border-accent/25 px-2 py-0.5 rounded-full">
                                Active · you
                              </span>
                            ) : (
                              <span
                                className={`text-[10px] font-medium ml-auto shrink-0 px-2 py-0.5 rounded-full border ${
                                  isIdle
                                    ? "text-amber-300/80 bg-amber-500/10 border-amber-500/20"
                                    : "text-accent bg-accent/10 border-accent/20"
                                }`}
                              >
                                {isIdle ? "Idle" : "Active"}
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-accent/15 border border-accent/30">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm bg-accent"
                        >
                          Y
                        </span>
                        <span className="truncate text-white/90 font-medium" title={name}>{formatUsername(name || "Guest")}</span>
                        <span className="text-[10px] text-accent font-semibold ml-auto shrink-0 bg-accent/15 border border-accent/25 px-2 py-0.5 rounded-full">
                          Active · you
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`chat-icon-button ${searchOpen ? "ring-2 ring-accent" : ""}`}
            title="Search messages"
          >
            <GIconSearch size={14} />
          </button>

          {/* Export Chat */}
          <button onClick={exportChat} className="chat-icon-button" title="Export Chat Transcript">
            <GIconDownload size={14} />
          </button>

          {/* Sound Mute */}
          <button
            onClick={toggleChatSound}
            aria-label={chatSound ? "Mute chat sounds" : "Enable chat sounds"}
            title={chatSound ? "Mute chat sounds" : "Enable chat sounds"}
            className="chat-icon-button"
          >
            {chatSound ? <GIconVolume size={14} /> : <GIconVolumeMute size={14} />}
          </button>

          {/* Theme Picker */}
          <div className="relative">
            <button
              ref={themeButtonRef}
              onClick={() => setBgPickerOpen((o) => !o)}
              aria-label="Choose chat color theme"
              className={`chat-icon-button ${bgPickerOpen ? "ring-2 ring-accent" : ""}`}
              title="Choose chat theme"
            >
              <GIconSliders size={14} />
            </button>
            <AnimatePresence>
              {bgPickerOpen && (
                <BgPicker current={chatBg} onPick={setChatBg} onClose={() => setBgPickerOpen(false)} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Pinned Messages Banner */}
      {pinnedList.length > 0 && (
        <div className="px-3.5 py-1.5 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-700 dark:text-amber-200">
          <div className="flex items-center gap-1.5 truncate">
            <GIconPin size={12} className="text-amber-500 shrink-0" />
            <span className="font-semibold text-[11px] shrink-0">Pinned:</span>
            <span className="truncate opacity-90 text-[11px]">{pinnedList[0].text}</span>
          </div>
          <button
            onClick={() => togglePinMessage(pinnedList[0].id)}
            className="text-[10px] text-amber-600 dark:text-amber-300 hover:underline shrink-0 cursor-pointer"
          >
            Unpin
          </button>
        </div>
      )}

      {/* Search Input Bar */}
      {searchOpen && (
        <div className="chat-search-bar p-2 border-b border-[var(--chat-border)] bg-[var(--chat-panel)] flex items-center gap-2">
          <GIconSearch size={12} className="text-[var(--chat-muted)] ml-1" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversation..."
            className="flex-1 bg-transparent text-xs text-[var(--chat-text)] placeholder-[var(--chat-muted)] outline-none"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-[var(--chat-muted)] hover:text-[var(--chat-text)] cursor-pointer"
            >
              <GIconClose size={12} />
            </button>
          )}
        </div>
      )}

      {/* Messages Thread */}
      <div
        ref={listRef}
        role="log"
        aria-label="Chat messages"
        className="chat-thread flex-1 overflow-auto thin-scroll p-4 space-y-4"
      >
        {!connected && !connecting && messages.length === 0 && (
          <div className="chat-empty-state max-w-sm mx-auto mt-8 p-5 rounded-2xl text-center">
            <p className="font-semibold mb-1">Welcome! You can start chatting right away.</p>
            <p className="text-sm">
              Live chat is offline, but <strong>Portfolio Bot</strong> is ready to guide you.
            </p>
          </div>
        )}

        {messages.length === 0 && connected && (
          <p className="chat-muted text-sm text-center mt-8">
            No messages yet. Say hi — no account needed, you're chatting as{" "}
            <span className="font-semibold">{name || "a guest"}</span>.
          </p>
        )}

        {displayedMessages.map((m, idx) => {
          const isSelf = Boolean(
            (m.senderId && m.senderId === clientId) ||
            mySentIds.current.has(m.id) ||
            (m.tempId && mySentIds.current.has(m.tempId)) ||
            (!m.senderId && name && name.toLowerCase() !== "guest" && m.name === name)
          );
          const color = nameColor(m.name);
          const isPinned = pinnedList.some((p) => p.id === m.id);
          const myReactionOnMsg = userReactions[m.id] || (m.userReactions && m.userReactions[clientId]);
          const hasAlreadyReacted = Boolean(myReactionOnMsg);
          const isFirstUnread = showNewDivider && idx === firstUnreadIndex;

          return (
            <div key={m.id || m.tempId} className="w-full flex flex-col">
              {/* Discord-style NEW unread message divider */}
              {isFirstUnread && (
                <div
                  id="chat-unread-divider"
                  className="w-full my-3 sm:my-4 flex items-center gap-2 select-none pointer-events-none transition-all duration-700 ease-out"
                  role="separator"
                  aria-label="New messages divider"
                >
                  <div className="flex-1 h-[1px] bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.45)]" />
                  <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-md shadow-rose-500/40 border border-rose-400/30 flex items-center">
                    NEW
                  </span>
                </div>
              )}

              <div
                id={`msg-${m.id || m.tempId}`}
                className={`group flex items-end gap-2 max-w-[90%] sm:max-w-[80%] chat-message-in transition-all duration-300 rounded-2xl ${
                  isSelf ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
                }`}
              >
              <div
                aria-hidden="true"
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                style={{ background: isSelf ? "var(--color-accent, #38bdf8)" : color }}
              >
                {isSelf ? "You" : (m.name?.[0]?.toUpperCase() || "?")}
              </div>
              <div className={`min-w-0 flex flex-col ${isSelf ? "items-end text-right" : "items-start text-left"}`}>
                <div className="chat-meta text-xs font-medium mb-1 flex items-center gap-1.5 opacity-80">
                  <span className="font-semibold" title={m.name}>{isSelf ? "You" : formatUsername(m.name)}</span>
                  <time className="font-normal opacity-60 text-[10px]" dateTime={new Date(m.ts).toISOString()}>
                    · {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </time>
                  {isPinned && <GIconPin size={10} className="text-amber-400" />}
                </div>

                {/* Quoted Message in Reply with Click to Jump */}
                {m.replyTo && (
                  <button
                    type="button"
                    onClick={() => scrollToMessage(m.replyTo.id)}
                    className={`text-[11px] p-1.5 mb-1 rounded-xl border border-[var(--chat-border)] bg-[var(--chat-panel)]/80 text-[var(--chat-muted)] hover:border-accent/40 hover:bg-[var(--chat-panel)] transition truncate flex items-center gap-1.5 max-w-full cursor-pointer group/quote ${
                      isSelf ? "justify-end" : "justify-start"
                    }`}
                    title="Jump to quoted message"
                  >
                    <GIconRotateLeft size={11} className="text-accent shrink-0 group-hover/quote:-rotate-45 transition-transform" />
                    <span className="font-semibold text-accent" title={m.replyTo.name}>@{formatUsername(m.replyTo.name)}:</span>
                    <span className="truncate opacity-80">{m.replyTo.text}</span>
                  </button>
                )}

                {/* Bubble Container & Messenger Action Bar */}
                <div className="relative group/bubble flex items-center gap-1">
                  {/* Action Bar for Own Message (left of bubble) */}
                  {isSelf && (
                    <div className="opacity-0 group-hover/bubble:opacity-100 focus-within:opacity-100 flex items-center gap-0.5 transition-opacity duration-150 order-first">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReactionMenu(m.id);
                        }}
                        className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="React"
                        aria-label="React"
                      >
                        <GIconSmile size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyTarget({ id: m.id, name: m.name, text: m.text })}
                        className="p-1 rounded-full text-white/50 hover:text-accent hover:bg-white/10 transition cursor-pointer"
                        title="Reply"
                        aria-label="Reply"
                      >
                        <GIconRotateLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePinMessage(m.id)}
                        className="p-1 rounded-full text-white/50 hover:text-amber-400 hover:bg-white/10 transition cursor-pointer"
                        title={isPinned ? "Unpin message" : "Pin message"}
                        aria-label="Pin"
                      >
                        <GIconPin size={12} className={isPinned ? "text-amber-400" : ""} />
                      </button>
                    </div>
                  )}

                  {/* Floating Messenger Reaction Tray */}
                  <AnimatePresence>
                    {activeReactionMenu === m.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.6, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.6, y: 8 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className={`absolute ${
                          (reactionPlacement[m.id] || "top") === "bottom" ? "top-full mt-2" : "-top-12"
                        } ${
                          isSelf ? "right-0" : "left-0"
                        } z-40 bg-[#121927]/95 backdrop-blur-2xl border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.6)] rounded-full px-2 py-1 flex items-center gap-1 select-none max-w-[calc(100vw-32px)]`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {hasAlreadyReacted && (
                          <span className="text-[10px] text-accent font-semibold px-2 py-0.5 bg-accent/15 border border-accent/25 rounded-full mr-0.5 shrink-0 select-none">
                            Reacted
                          </span>
                        )}
                        {CHAT_REACTIONS.map((r, idx) => {
                          const IconComp = r.Icon;
                          const isMyCurrentReaction = myReactionOnMsg === r.id;
                          const isDisabled = hasAlreadyReacted && !isMyCurrentReaction;

                          return (
                            <motion.button
                              key={r.id}
                              initial={{ scale: 0, y: 4 }}
                              animate={{ scale: 1, y: 0 }}
                              transition={{ delay: idx * 0.03, type: "spring", stiffness: 450, damping: 20 }}
                              whileHover={isDisabled ? undefined : { scale: 1.45, y: -6 }}
                              whileTap={isDisabled ? undefined : { scale: 0.85 }}
                              disabled={isDisabled}
                              onClick={() => {
                                if (isDisabled) return;
                                reactToMessage(m.id, r.id);
                                setActiveReactionMenu(null);
                              }}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all relative group/emo ${
                                isMyCurrentReaction
                                  ? "bg-accent/25 ring-2 ring-accent scale-110 cursor-pointer"
                                  : isDisabled
                                  ? "opacity-30 cursor-not-allowed grayscale-[0.6]"
                                  : "hover:bg-white/15 cursor-pointer"
                              }`}
                              title={
                                isMyCurrentReaction
                                  ? `${r.label} (Tap to remove your reaction)`
                                  : isDisabled
                                  ? "You have already reacted to this message"
                                  : r.label
                              }
                              aria-label={
                                isMyCurrentReaction
                                  ? `Remove ${r.label} reaction`
                                  : isDisabled
                                  ? `Cannot react with ${r.label}`
                                  : `React with ${r.label}`
                              }
                            >
                              <IconComp size={16} className={isMyCurrentReaction ? "text-accent" : r.color} />
                              <span className="absolute -top-7 opacity-0 group-hover/emo:opacity-100 transition-opacity bg-black/90 text-[10px] text-white font-medium px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
                                {isMyCurrentReaction ? `Remove ${r.label}` : isDisabled ? "Already reacted" : r.label}
                              </span>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Floating Burst Particles on Reaction */}
                  <AnimatePresence>
                    {bursts
                      .filter((b) => b.messageId === m.id)
                      .map((b) => {
                        const reactionDef =
                          CHAT_REACTIONS.find((r) => r.id === b.emoji || r.id === UNICODE_TO_KEY[b.emoji]) ||
                          CHAT_REACTIONS[0];
                        const BurstIcon = reactionDef.Icon;

                        return (
                          <motion.div
                            key={b.id}
                            initial={{ opacity: 1, scale: 0.3, y: 0, x: b.xOffset }}
                            animate={{
                              opacity: [1, 1, 0],
                              scale: [0.3, 1.6, 1.2],
                              y: -64,
                              x: b.xOffset + (Math.random() - 0.5) * 12,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute pointer-events-none z-50 flex items-center justify-center -top-2 left-1/2 -translate-x-1/2"
                          >
                            <div className="relative flex items-center justify-center">
                              <div className={`w-11 h-11 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-md shadow-2xl border border-white/25 ${reactionDef.color}`}>
                                <BurstIcon size={24} />
                              </div>
                              <div className="absolute inset-0 rounded-full bg-accent/40 blur-md animate-ping" />
                            </div>
                          </motion.div>
                        );
                      })}
                  </AnimatePresence>

                  {/* The Chat Bubble */}
                  <div
                    onPointerDown={(e) => startLongPress(m.id, e)}
                    onPointerMove={cancelLongPressIfMoved}
                    onPointerUp={endLongPress}
                    onPointerCancel={endLongPress}
                    onTouchStart={(e) => startLongPress(m.id, e)}
                    onTouchMove={cancelLongPressIfMoved}
                    onTouchEnd={endLongPress}
                    onTouchCancel={endLongPress}
                    onContextMenu={(e) => {
                      e.preventDefault();
                    }}
                    onDoubleClick={() => {
                      if (hasAlreadyReacted && myReactionOnMsg !== "heart") {
                        notify("Already Reacted", "You have already reacted to this message and cannot use other emojis.", "info", 2000);
                        return;
                      }
                      reactToMessage(m.id, "heart");
                    }}
                    className={`chat-bubble px-3.5 py-2.5 leading-relaxed relative transition-shadow select-none touch-manipulation [-webkit-touch-callout:none] [-webkit-user-select:none] [user-select:none] ${
                      isSelf ? "chat-bubble-self shadow-md shadow-accent/20" : ""
                    } ${m.pending ? "chat-bubble-pending" : ""} ${m.failed ? "chat-bubble-failed" : ""}`}
                    style={{ fontSize: `${15 * textScale}px`, touchAction: "manipulation" }}
                    title="Hold on mobile or double-click to react"
                  >
                    {m.text}
                  </div>

                  {/* Action Bar for Incoming Message (right of bubble) */}
                  {!isSelf && (
                    <div className="opacity-0 group-hover/bubble:opacity-100 focus-within:opacity-100 flex items-center gap-0.5 transition-opacity duration-150 order-last">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReactionMenu(m.id);
                        }}
                        className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="React"
                        aria-label="React"
                      >
                        <GIconSmile size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyTarget({ id: m.id, name: m.name, text: m.text })}
                        className="p-1 rounded-full text-white/50 hover:text-accent hover:bg-white/10 transition cursor-pointer"
                        title="Reply"
                        aria-label="Reply"
                      >
                        <GIconRotateLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePinMessage(m.id)}
                        className="p-1 rounded-full text-white/50 hover:text-amber-400 hover:bg-white/10 transition cursor-pointer"
                        title={isPinned ? "Unpin message" : "Pin message"}
                        aria-label="Pin"
                      >
                        <GIconPin size={12} className={isPinned ? "text-amber-400" : ""} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Reaction Badges under Bubble */}
                {m.reactions && Object.keys(m.reactions).length > 0 && (
                  <div className={`flex flex-wrap gap-1 mt-1 ${isSelf ? "justify-end" : "justify-start"}`}>
                    {Object.entries(m.reactions).map(([emo, count]: any) => {
                      const isMyBadge = myReactionOnMsg === emo;
                      return count > 0 ? (
                        <motion.button
                          key={emo}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.88 }}
                          transition={{ type: "spring", stiffness: 450, damping: 15 }}
                          onClick={() => {
                            if (hasAlreadyReacted && myReactionOnMsg !== emo) {
                              notify("Already Reacted", "You have already reacted to this message and cannot use other emojis.", "info", 2000);
                              return;
                            }
                            reactToMessage(m.id, emo);
                          }}
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border backdrop-blur-md shadow-sm transition cursor-pointer ${
                            isMyBadge
                              ? "border-accent/80 bg-accent/20 text-accent font-semibold"
                              : "border-white/15 bg-[#1b2438]/90 text-white/90 hover:border-accent/40"
                          }`}
                          title={`Reacted ${count} time(s). ${isMyBadge ? "(Your reaction)" : "Click to react!"}`}
                        >
                          <ReactionIcon emo={emo} size={12} />
                          <span className="font-semibold text-[10px]">{count}</span>
                        </motion.button>
                      ) : null;
                    })}
                  </div>
                )}

                {m.pending && <div role="status" className="chat-muted text-xs mt-1">Sending…</div>}
                {m.failed && (
                  <button
                    onClick={() => retryMessage(m)}
                    className="chat-error-link inline-flex items-center gap-1 text-xs font-semibold mt-1 rounded px-1 py-0.5"
                  >
                    <GIconRotateRight size={12} /> Failed to send. Retry message
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

        {/* Messenger Animated Typing Indicator */}
        {typingName && typingName !== name && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex items-end gap-2 max-w-[80%] mr-auto pl-1"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
              style={{ background: nameColor(typingName) }}
            >
              {typingName?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl rounded-bl-xs px-3.5 py-2.5 flex items-center gap-1.5 border border-white/10 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-[11px] text-white/40 pb-1 italic">{formatUsername(typingName)} is typing…</span>
          </motion.div>
        )}
      </div>

      {/* Quoted Reply Banner */}
      {replyTarget && (
        <div className="px-3.5 py-1.5 bg-accent/15 border-t border-accent/30 flex items-center justify-between text-xs text-[var(--chat-text)]">
          <div className="truncate mr-2">
            <span className="font-semibold text-accent">Replying to @{formatUsername(replyTarget.name)}: </span>
            <span className="opacity-80 truncate">{replyTarget.text}</span>
          </div>
          <button
            onClick={() => setReplyTarget(null)}
            className="p-1 hover:text-[var(--chat-text)] text-[var(--chat-muted)] cursor-pointer"
            title="Cancel reply"
          >
            <GIconClose size={12} />
          </button>
        </div>
      )}

      {/* Quick Responses Bar */}
      <div className="chat-quick-bar px-3 py-1.5 border-t border-[var(--chat-border)] bg-[var(--chat-panel)] flex items-center gap-1.5 overflow-x-auto thin-scroll">
        <span className="text-[10px] text-[var(--chat-muted)] uppercase font-mono mr-1 shrink-0">Quick:</span>
        {QUICK_RESPONSES.map((phrase) => (
          <button
            key={phrase}
            type="button"
            onClick={() => setText((prev) => (prev ? `${prev} ${phrase}` : phrase))}
            className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-[var(--chat-border)] bg-[var(--chat-bg)] hover:border-accent text-[var(--chat-text)] hover:text-accent transition shrink-0 cursor-pointer"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Identity bar */}
      <div className="chat-identity flex items-center justify-between gap-2 px-4 py-2 border-t border-[var(--chat-border)] bg-[var(--chat-panel)]">
        {editingName ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveName();
            }}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <label htmlFor="chat-display-name" className="text-xs sm:text-sm font-medium text-[var(--chat-text)] shrink-0">
              Display name
            </label>
            <input
              id="chat-display-name"
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={20}
              className="chat-input min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm"
              placeholder="Your guest name"
            />
            <button type="submit" aria-label="Save display name" className="chat-icon-button shrink-0" title="Save name">
              <GIconCheck size={16} />
            </button>
            <button
              type="button"
              onClick={() => setEditingName(false)}
              aria-label="Cancel editing"
              className="chat-icon-button shrink-0 text-white/50 hover:text-white"
              title="Cancel"
            >
              <GIconClose size={14} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => {
              setDraftName(name);
              setEditingName(true);
            }}
            className="chat-link inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-xs sm:text-sm cursor-pointer truncate"
            title={`Click to change name (${name})`}
          >
            <GIconPencil size={14} className="shrink-0" />
            <span className="shrink-0">Chatting as</span>
            <span className="font-semibold text-[var(--chat-text)] truncate" title={name}>
              {isMobile && formatUsername(name || "guest").length > 8
                ? `${formatUsername(name || "guest").slice(0, 8)}...`
                : formatUsername(name || "guest")}
            </span>
          </button>
        )}
        {!editingName && (
          <div role="group" className="flex items-center gap-1 select-none shrink-0" aria-label="Message text zoom">
            <span className="chat-muted text-xs mr-0.5">Zoom</span>
            <button
              type="button"
              onClick={() => changeTextScale(-0.1)}
              disabled={textScale <= 0.7}
              aria-label="Zoom out messages"
              className="chat-text-size-button"
              title="Zoom out (−)"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => {
                setTextScale(1);
                localStorage.setItem("os_chat_text_scale", "1");
              }}
              aria-label="Reset zoom"
              className="text-[10px] font-mono text-[var(--chat-muted)] hover:text-[var(--chat-text)] px-1 py-0.5 rounded hover:bg-white/5 transition cursor-pointer"
              title="Click to reset zoom (100%)"
            >
              {Math.round(textScale * 100)}%
            </button>
            <button
              type="button"
              onClick={() => changeTextScale(0.1)}
              disabled={textScale >= 1.3}
              aria-label="Zoom in messages"
              className="chat-text-size-button"
              title="Zoom in (+)"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="chat-composer flex items-end gap-2 p-3 border-t border-[var(--chat-border)] bg-[var(--chat-panel)] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
      >
        <label htmlFor="chat-message" className="sr-only">
          Write a message
        </label>
        <textarea
          id="chat-message"
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            touchChatActivity();
            if (connected) getSocket().emit("chat:typing");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={connected ? "Write a message… (Enter to send)" : "Chat with Portfolio Bot…"}
          className="chat-input min-h-11 max-h-28 flex-1 resize-y rounded-xl px-3 py-2.5 text-sm"
        />
        <AnimatePresence mode="wait">
          {!text.trim() ? (
            <motion.button
              key="quick-like"
              type="button"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              whileHover={{ scale: 1.15, rotate: -8 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              onClick={() => {
                sendText("👍");
                soundFx.playPop();
              }}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-accent/20 hover:bg-accent text-accent hover:text-white transition-all shadow-sm cursor-pointer shrink-0"
              title="Send Quick Like (Messenger style)"
              aria-label="Send Like"
            >
              <GIconThumbsUp size={20} />
            </motion.button>
          ) : (
            <motion.button
              key="send-btn"
              type="submit"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              className="chat-send-button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-semibold shadow-md shadow-accent/20 cursor-pointer shrink-0"
            >
              <GIconPaperPlane size={16} aria-hidden="true" />
              <span>Send</span>
            </motion.button>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
