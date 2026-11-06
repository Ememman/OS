import { useEffect, useRef, useState, useMemo } from "react";
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
} from "../icons/GravityIcons";
import { getSocket } from "../../lib/socket";
import { useOS } from "../../store/useOS";
import { useOutsideClick } from "../../lib/useOutsideClick";
import { soundFx } from "../../lib/soundFx";
import { API_URL } from "../../lib/config";

const BG_OPTIONS = [
  { id: "halftone", label: "Soft paper", swatch: "#f7f4ee" },
  { id: "notebook", label: "Notebook", swatch: "#f5f7fa" },
  { id: "ink", label: "Midnight", swatch: "#18212b" },
  { id: "plain", label: "Warm neutral", swatch: "#f2eee7" },
  { id: "action", label: "Evening", swatch: "#272331" },
];

const EMOJI_REACTIONS = ["❤️", "👍", "🔥", "🚀", "😂", "🎉"];
const QUICK_EMOJIS = ["👍", "❤️", "🔥", "🚀", "😂", "🎉", "✨", "💻", "👋"];

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
  useOutsideClick(ref, onClose);
  return (
    <div
      ref={ref}
      role="group"
      aria-label="Chat color theme"
      className="absolute top-full right-3 mt-1.5 z-[1200] chat-theme-picker rounded-xl p-2 shadow-2xl"
      style={{ animation: "menuOpen 140ms cubic-bezier(.16,1,.3,1) both" }}
    >
      <div className="text-xs font-semibold px-1 pb-1.5">Chat theme</div>
      <div className="grid grid-cols-3 gap-1.5">
        {BG_OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => {
              onPick(o.id);
              onClose();
            }}
            aria-pressed={current === o.id}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition ${
              current === o.id ? "ring-2 ring-accent" : "hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            <span aria-hidden="true" className="w-8 h-8 rounded-md border border-black/15" style={{ background: o.swatch }} />
            <span className="text-xs">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Chats() {
  const chatSound = useOS((s) => s.chatSound);
  const toggleChatSound = useOS((s) => s.toggleChatSound);
  const reduceMotion = useOS((s) => s.reduceMotion);
  const chatBg = useOS((s) => s.chatBg);
  const setChatBg = useOS((s) => s.setChatBg);
  const notify = useOS((s) => s.notify);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [pinnedList, setPinnedList] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [online, setOnline] = useState(0);
  const [text, setText] = useState("");
  const [typingName, setTypingName] = useState<string | null>(null);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const [textScale, setTextScale] = useState(() => Number(localStorage.getItem("os_chat_text_scale") || 1));

  // Search & Reply States
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string; text: string } | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<any>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const usersModalRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef(name);
  nameRef.current = name;

  useOutsideClick(usersModalRef, () => setShowUsersModal(false));

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
      setConnecting(false);
    };
    const onDisconnect = () => setConnected(false);
    const onConnecting = () => setConnecting(true);
    const onInit = ({ name, history, pinned, users }: any) => {
      setName(name);
      setMessages(history || []);
      if (pinned) setPinnedList(pinned);
      if (users) setActiveUsers(users);
    };
    const onMessage = (msg: any) => {
      setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
      if (chatSound && msg.name !== nameRef.current) playPing();
    };
    const onReacted = ({ id, reactions }: any) => {
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, reactions } : x)));
    };
    const onPresence = ({ online }: any) => setOnline(online);
    const onUsersUpdated = (userList: any[]) => setActiveUsers(userList || []);
    const onPinned = ({ isPinned, pinnedList: updatedList }: any) => {
      if (updatedList) setPinnedList(updatedList);
    };

    const onTyping = ({ name }: any) => {
      setTypingName(name);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingName(null), 1500);
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

    if (socket.connected) onConnect();

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
    };
  }, [chatSound]);

  useEffect(() => {
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

  const reactToMessage = (id: string, emoji: string) => {
    getSocket().emit("chat:react", { id, emoji });
    // Optimistic local update
    setMessages((m) =>
      m.map((x) => {
        if (x.id === id) {
          const reactions = { ...(x.reactions || {}) };
          reactions[emoji] = (reactions[emoji] || 0) + 1;
          return { ...x, reactions };
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
    const tempId = `temp-${Date.now()}`;

    // Local fallback bot when offline
    if (!connected) {
      const localMsg = {
        id: tempId,
        name: name || "you",
        text: t,
        ts: Date.now(),
        reactions: {},
        replyTo: replyTarget || undefined
      };
      setMessages((m) => [...m, localMsg]);
      setReplyTarget(null);

      setTimeout(() => {
        const lower = t.toLowerCase();
        let reply = "Hello! I am Portfolio Bot. The live Socket.IO chat server is currently unreachable, but feel free to explore the desktop apps!";
        if (lower.includes("project") || lower.includes("work")) {
          reply = "Check out the Library app to view all featured projects, or open Resume to see work experience!";
        } else if (lower.includes("music") || lower.includes("song")) {
          reply = "Open the Music app from the dock to stream Lo-fi beats, synthwave, or search Apple Music tracks live!";
        } else if (lower.includes("game") || lower.includes("blast") || lower.includes("2048")) {
          reply = "You can play Block Blast and 2048 right now by launching the Games app from the dock!";
        }

        const botMsg = {
          id: `bot-${Date.now()}`,
          name: "Portfolio Bot",
          text: reply,
          ts: Date.now(),
          reactions: { "❤️": 1 }
        };
        setMessages((m) => [...m, botMsg]);
        if (chatSound) playPing();
      }, 600);
      return;
    }

    const optimistic = {
      id: tempId,
      name: name || "you",
      text: t,
      ts: Date.now(),
      pending: true,
      reactions: {},
      replyTo: replyTarget || undefined
    };
    setMessages((m) => [...m, optimistic]);

    const payload = replyTarget ? { text: t, replyTo: replyTarget } : t;
    setReplyTarget(null);

    const socket = getSocket();
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
        setMessages((m) => m.map((x) => (x.id === tempId ? res.message : x)));
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
    }
    setEditingName(false);
  };

  const changeTextScale = (delta: number) => {
    setTextScale((prev) => {
      const next = Math.max(1, Math.min(1.3, Math.round((prev + delta) * 10) / 10));
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

  // Filter messages based on search query
  const displayedMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) => (m.text && m.text.toLowerCase().includes(q)) || (m.name && m.name.toLowerCase().includes(q))
    );
  }, [messages, searchQuery]);

  return (
    <div data-chat-bg={chatBg} className="flex flex-col h-full chat-shell text-foreground relative">
      {/* Chat Topbar */}
      <div className="chat-topbar flex items-center justify-between px-3.5 py-2.5 border-b gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span
              role="status"
              aria-label={connected ? "Connected" : connecting ? "Connecting" : "Offline"}
              className={`block w-2.5 h-2.5 rounded-full ${
                connected
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                  : connecting
                  ? "bg-amber-400 animate-pulse"
                  : "bg-zinc-400"
              }`}
            />
          </div>
          <div>
            <div className="font-semibold text-xs leading-none">Chats</div>
            <div className="text-[10px] chat-muted mt-0.5">
              {connected ? "Live & connected" : connecting ? "Reconnecting…" : "Offline mode · Bot active"}
            </div>
          </div>
        </div>

        {/* Right Tools Group */}
        <div className="flex items-center gap-1">
          {/* Active Participants Button */}
          <div className="relative">
            <button
              onClick={() => setShowUsersModal(!showUsersModal)}
              className="chat-badge flex items-center gap-1 text-xs px-2 py-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition"
              title="View online guests"
            >
              <GIconPersons size={12} aria-hidden="true" />
              <span>{connected ? online : 1}</span>
            </button>

            {/* Active Users Dropdown */}
            {showUsersModal && (
              <div
                ref={usersModalRef}
                className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-slate-900 border border-white/15 p-2 shadow-2xl z-50 text-xs text-white"
              >
                <div className="font-semibold text-[11px] text-white/50 px-1 pb-1 border-b border-white/10 mb-1">
                  Online Visitors ({activeUsers.length || 1})
                </div>
                <div className="max-h-36 overflow-y-auto thin-scroll space-y-1">
                  {activeUsers.length > 0 ? (
                    activeUsers.map((u, i) => (
                      <div key={i} className="flex items-center gap-2 px-1.5 py-1 rounded bg-white/5">
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          style={{ background: nameColor(u.name) }}
                        >
                          {u.name?.[0]?.toUpperCase()}
                        </span>
                        <span className="truncate text-white/80">{u.name}</span>
                        {u.name === name && <span className="text-[9px] text-accent ml-auto">(you)</span>}
                      </div>
                    ))
                  ) : (
                    <div className="text-white/40 text-[10px] p-1">1 active session</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`chat-icon-button ${searchOpen ? "text-accent" : ""}`}
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
              className="chat-icon-button"
            >
              <GIconSliders size={14} />
            </button>
            {bgPickerOpen && (
              <BgPicker current={chatBg} onPick={setChatBg} onClose={() => setBgPickerOpen(false)} />
            )}
          </div>
        </div>
      </div>

      {/* Pinned Messages Banner */}
      {pinnedList.length > 0 && (
        <div className="px-3.5 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2 text-xs text-amber-200">
          <div className="flex items-center gap-1.5 truncate">
            <GIconPin size={12} className="text-amber-400 shrink-0" />
            <span className="font-semibold text-[11px] shrink-0">Pinned:</span>
            <span className="truncate text-white/80 text-[11px]">{pinnedList[0].text}</span>
          </div>
          <button
            onClick={() => togglePinMessage(pinnedList[0].id)}
            className="text-[10px] text-amber-300 hover:text-white shrink-0 underline"
          >
            Unpin
          </button>
        </div>
      )}

      {/* Search Input Bar */}
      {searchOpen && (
        <div className="p-2 border-b border-white/10 bg-black/20 flex items-center gap-2">
          <GIconSearch size={12} className="text-white/40 ml-1" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversation..."
            className="flex-1 bg-transparent text-xs text-white placeholder-white/40 outline-none"
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-white/40 hover:text-white">
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

        {displayedMessages.map((m) => {
          const isSelf = m.name === name;
          const color = nameColor(m.name);
          const isPinned = pinnedList.some((p) => p.id === m.id);

          return (
            <div
              key={m.id}
              className={`group flex items-end gap-2 max-w-[92%] sm:max-w-[86%] chat-message-in ${
                isSelf ? "ml-auto flex-row-reverse" : ""
              }`}
            >
              <div
                aria-hidden="true"
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: color }}
              >
                {m.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className={`min-w-0 ${isSelf ? "text-right" : ""}`}>
                <div className="chat-meta text-xs font-medium mb-1 flex items-center gap-1.5">
                  <span>{m.name}</span>
                  <time className="font-normal opacity-60" dateTime={new Date(m.ts).toISOString()}>
                    · {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </time>
                  {isPinned && <GIconPin size={10} className="text-amber-400" />}
                </div>

                {/* Quoted Message in Reply */}
                {m.replyTo && (
                  <div
                    className={`text-[11px] p-1.5 mb-1 rounded-lg border border-white/10 bg-black/15 text-white/60 truncate flex items-center gap-1 ${
                      isSelf ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span className="font-semibold text-accent">@{m.replyTo.name}:</span>
                    <span className="truncate">{m.replyTo.text}</span>
                  </div>
                )}

                <div
                  className={`chat-bubble ${isSelf ? "chat-bubble-self" : ""} ${
                    m.pending ? "chat-bubble-pending" : ""
                  } ${m.failed ? "chat-bubble-failed" : ""} px-3.5 py-2.5 leading-relaxed relative`}
                  style={{ fontSize: `${15 * textScale}px` }}
                >
                  {m.text}
                </div>

                {/* Reaction Badges */}
                {m.reactions && Object.keys(m.reactions).length > 0 && (
                  <div className={`flex flex-wrap gap-1 mt-1 ${isSelf ? "justify-end" : "justify-start"}`}>
                    {Object.entries(m.reactions).map(([emo, count]: any) =>
                      count > 0 ? (
                        <button
                          key={emo}
                          onClick={() => reactToMessage(m.id, emo)}
                          className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 hover:scale-105 transition"
                        >
                          <span>{emo}</span>
                          <span className="font-semibold text-[10px]">{count}</span>
                        </button>
                      ) : null
                    )}
                  </div>
                )}

                {/* Hover Quick Bar: Reply, Pin, Reactions */}
                <div
                  className={`opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity ${
                    isSelf ? "justify-end" : "justify-start"
                  } mt-0.5 px-1`}
                >
                  <button
                    onClick={() => setReplyTarget({ id: m.id, name: m.name, text: m.text })}
                    className="text-[10px] hover:text-accent transition text-white/60 mr-1"
                    title="Reply to message"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => togglePinMessage(m.id)}
                    className="text-[10px] hover:text-amber-400 transition text-white/60 mr-1"
                    title={isPinned ? "Unpin message" : "Pin message"}
                  >
                    <GIconPin size={10} className={isPinned ? "text-amber-400" : ""} />
                  </button>
                  {EMOJI_REACTIONS.map((emo) => (
                    <button
                      key={emo}
                      onClick={() => reactToMessage(m.id, emo)}
                      className="hover:scale-125 transition-transform text-xs"
                      title={`React with ${emo}`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>

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
          );
        })}

        {typingName && typingName !== name && (
          <div role="status" className="chat-muted flex items-center gap-1.5 text-sm pl-10">
            <span className="font-semibold">{typingName}</span>
            is typing
            <span aria-hidden="true" className="chat-typing-dots inline-flex gap-0.5">
              <span className="w-1 h-1 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full animate-bounce" style={{ animationDelay: "120ms" }} />
              <span className="w-1 h-1 rounded-full animate-bounce" style={{ animationDelay: "240ms" }} />
            </span>
          </div>
        )}
      </div>

      {/* Quoted Reply Banner */}
      {replyTarget && (
        <div className="px-3.5 py-1.5 bg-accent/15 border-t border-accent/30 flex items-center justify-between text-xs text-white">
          <div className="truncate mr-2">
            <span className="font-semibold text-accent">Replying to @{replyTarget.name}: </span>
            <span className="opacity-80 truncate">{replyTarget.text}</span>
          </div>
          <button
            onClick={() => setReplyTarget(null)}
            className="p-1 hover:text-white text-white/50"
            title="Cancel reply"
          >
            <GIconClose size={12} />
          </button>
        </div>
      )}

      {/* Quick Emojis Bar */}
      <div className="px-3 py-1 bg-black/10 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto thin-scroll">
        <span className="text-[10px] text-white/40 uppercase font-mono mr-1">Quick:</span>
        {QUICK_EMOJIS.map((em) => (
          <button
            key={em}
            type="button"
            onClick={() => setText((prev) => prev + em)}
            className="text-xs hover:scale-125 transition-transform px-1 py-0.5 rounded hover:bg-white/10"
          >
            {em}
          </button>
        ))}
      </div>

      {/* Identity bar */}
      <div className="chat-identity flex items-center justify-between gap-2 px-4 py-2 border-t">
        {editingName ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveName();
            }}
            className="flex items-center gap-2"
          >
            <label htmlFor="chat-display-name" className="text-sm font-medium">
              Display name
            </label>
            <input
              id="chat-display-name"
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={20}
              className="chat-input min-w-0 w-32 rounded-lg px-2.5 py-1.5 text-sm"
              placeholder="Your guest name"
            />
            <button type="submit" aria-label="Save display name" className="chat-icon-button">
              <GIconCheck size={16} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => {
              setDraftName(name);
              setEditingName(true);
            }}
            className="chat-link inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-sm"
          >
            <GIconPencil size={14} /> Chatting as <span className="font-semibold">{name || "guest"}</span>
          </button>
        )}
        <div role="group" className="flex items-center gap-1" aria-label="Message text size">
          <span className="chat-muted text-xs mr-1">Text</span>
          <button
            type="button"
            onClick={() => changeTextScale(-0.1)}
            disabled={textScale <= 1}
            aria-label="Decrease message text size"
            className="chat-text-size-button"
          >
            A−
          </button>
          <button
            type="button"
            onClick={() => changeTextScale(0.1)}
            disabled={textScale >= 1.3}
            aria-label="Increase message text size"
            className="chat-text-size-button"
          >
            A+
          </button>
        </div>
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="chat-composer flex items-end gap-2 p-3 border-t"
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
        <button
          type="submit"
          disabled={!text.trim()}
          className="chat-send-button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <GIconPaperPlane size={16} aria-hidden="true" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
