import { useEffect, useRef, useState } from "react";
import {
  GIconPaperPlane,
  GIconPersons,
  GIconPencil,
  GIconCheck,
  GIconRotateRight,
  GIconSliders,
  GIconVolume,
  GIconVolumeMute,
} from "../icons/GravityIcons";
import { getSocket } from "../../lib/socket";
import { useOS } from "../../store/useOS";
import { useOutsideClick } from "../../lib/useOutsideClick";

const BG_OPTIONS = [
  { id: "halftone", label: "Soft paper", swatch: "#f7f4ee" },
  { id: "notebook", label: "Notebook", swatch: "#f5f7fa" },
  { id: "ink", label: "Midnight", swatch: "#18212b" },
  { id: "plain", label: "Warm neutral", swatch: "#f2eee7" },
  { id: "action", label: "Evening", swatch: "#272331" }
];

const ACK_TIMEOUT_MS = 6000;

function playPing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
function nameColor(name) {
  const palette = ["#7F1D1D", "#14532D", "#1E3A8A", "#6B21A8", "#9A3412", "#0F766E"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % palette.length;
  return palette[Math.abs(hash) % palette.length];
}

function BgPicker({ current, onPick, onClose }) {
  const ref = useRef(null);
  useOutsideClick(ref, onClose);
  return (
    <div ref={ref} role="group" aria-label="Chat color theme" className="absolute top-full right-3 mt-1.5 z-[1200] chat-theme-picker rounded-xl p-2 shadow-2xl" style={{ animation: "menuOpen 140ms cubic-bezier(.16,1,.3,1) both" }}>
      <div className="text-xs font-semibold px-1 pb-1.5">Chat theme</div>
      <div className="grid grid-cols-3 gap-1.5">
        {BG_OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => { onPick(o.id); onClose(); }}
            aria-pressed={current === o.id}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition ${current === o.id ? "ring-2 ring-accent" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
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
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [messages, setMessages] = useState([]);
  const [online, setOnline] = useState(0);
  const [text, setText] = useState("");
  const [typingName, setTypingName] = useState(null);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const themeButtonRef = useRef(null);
  const [textScale, setTextScale] = useState(() => {
    const saved = Number(localStorage.getItem("os_chat_text_scale"));
    return Number.isFinite(saved) ? Math.min(1.3, Math.max(1, saved)) : 1;
  });
  const listRef = useRef(null);
  const typingTimeout = useRef(null);
  const nameRef = useRef(name);
  nameRef.current = name;

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => { setConnected(true); setConnecting(false); };
    const onDisconnect = () => setConnected(false);
    const onConnecting = () => setConnecting(true);
    const onInit = ({ name, history }) => { setName(name); setMessages(history); };
    const onMessage = (msg) => {
      // Dedupe: if this message already exists locally (it was our own optimistic
      // send, already confirmed via the ack callback), don't add it twice.
      setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
      if (chatSound && msg.name !== nameRef.current) playPing();
    };
    const onPresence = ({ online }) => setOnline(online);
    const onTyping = ({ name }) => {
      setTypingName(name);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingName(null), 1500);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("reconnect_attempt", onConnecting);
    socket.on("chat:init", onInit);
    socket.on("chat:message", onMessage);
    socket.on("chat:presence", onPresence);
    socket.on("chat:typing", onTyping);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("reconnect_attempt", onConnecting);
      socket.off("chat:init", onInit);
      socket.off("chat:message", onMessage);
      socket.off("chat:presence", onPresence);
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
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setBgPickerOpen(false);
      themeButtonRef.current?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [bgPickerOpen]);

  // Sends a message with an optimistic local echo, so you always see it
  // appear immediately — then confirms (or flags as failed) via a server
  // acknowledgement instead of silently hoping the round-trip arrives.
  // When offline, seamlessly falls back to interactive Portfolio Bot!
  const sendText = (t) => {
    if (!t) return;
    const tempId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    if (!connected) {
      const userMsg = { id: tempId, name: name || "You", text: t, ts: Date.now() };
      setMessages((m) => [...m, userMsg]);
      setTypingName("Portfolio Bot");
      setTimeout(() => {
        setTypingName(null);
        const lower = t.toLowerCase();
        let reply = "Thanks for visiting Portfolio OS! Feel free to explore the Music player, Terminal CLI, Library projects, and Games!";
        if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey")) {
          reply = "Hello there! Welcome to Portfolio OS. You can test out all apps in the dock, play music, or open Terminal.";
        } else if (lower.includes("who") || lower.includes("about") || lower.includes("bron")) {
          reply = "Bron Mendoza is a Full-Stack Developer specializing in MERN stack, React Native / Expo, and modern web architectures!";
        } else if (lower.includes("skill") || lower.includes("stack") || lower.includes("tech")) {
          reply = "Core skills include React, Next.js, TypeScript, Node.js, Express, NestJS, MongoDB, MySQL, and Tailwind CSS.";
        } else if (lower.includes("project") || lower.includes("work")) {
          reply = "Check out the Library app to view all featured projects, or open Resume to see work experience!";
        } else if (lower.includes("music") || lower.includes("song")) {
          reply = "Open the Music app from the dock to stream Lo-fi beats, synthwave, or search Apple Music tracks live!";
        } else if (lower.includes("game") || lower.includes("blast")) {
          reply = "You can play the Block Blast puzzle game right now by launching the Games app from the dock!";
        }

        const botMsg = {
          id: `bot-${Date.now()}`,
          name: "Portfolio Bot",
          text: reply,
          ts: Date.now(),
        };
        setMessages((m) => [...m, botMsg]);
        if (chatSound) playPing();
      }, 600);
      return;
    }

    const optimistic = { id: tempId, name: name || "you", text: t, ts: Date.now(), pending: true };
    setMessages((m) => [...m, optimistic]);

    const socket = getSocket();
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, pending: false, failed: true } : x)));
    }, ACK_TIMEOUT_MS);

    socket.emit("chat:message", t, (res) => {
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

  const retryMessage = (msg) => {
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

  const retryConnection = () => {
    setConnecting(true);
    getSocket().connect();
  };

  const isDark = chatBg === "ink" || chatBg === "action";
  const changeTextScale = (amount) => {
    const next = Math.min(1.3, Math.max(1, Math.round((textScale + amount) * 10) / 10));
    localStorage.setItem("os_chat_text_scale", String(next));
    setTextScale(next);
  };

  return (
    <div className={`chat-surface chat-theme--${chatBg} flex flex-col h-full`} data-theme={isDark ? "dark" : "light"}>
      <div className="chat-header flex items-center justify-between gap-2 px-4 py-3 border-b">
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-tight">Community chat</h2>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs">
            <span role="status" className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-600" : connecting ? "bg-amber-500" : "bg-sky-600"}`} />
              {connected ? "Live chat" : connecting ? "Connecting…" : "Offline · Portfolio Bot is here"}
            </span>
            {!connected && !connecting && (
              <button onClick={retryConnection} className="chat-link inline-flex items-center gap-1 rounded px-1 py-0.5">
                <GIconRotateRight size={12} /> Try live chat
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs chat-count" aria-label={`${online} ${online === 1 ? "person" : "people"} online`}>
            <GIconPersons size={14} aria-hidden="true" /> {online}
          </span>
          <button
            type="button"
            onClick={toggleChatSound}
            aria-label={chatSound ? "Mute chat sounds" : "Enable chat sounds"}
            aria-pressed={chatSound}
            className="chat-icon-button"
          >
            {chatSound ? <GIconVolume size={16} aria-hidden="true" /> : <GIconVolumeMute size={16} aria-hidden="true" />}
          </button>
          <div className="relative">
            <button
              type="button"
              ref={themeButtonRef}
              onClick={() => setBgPickerOpen((o) => !o)}
              aria-label="Choose chat theme"
              aria-expanded={bgPickerOpen}
              className="chat-icon-button"
            >
              <GIconSliders size={16} aria-hidden="true" />
            </button>
            {bgPickerOpen && <BgPicker current={chatBg} onPick={setChatBg} onClose={() => setBgPickerOpen(false)} />}
          </div>
        </div>
      </div>

      <div ref={listRef} role="log" aria-label="Chat messages" aria-live="polite" aria-relevant="additions text" aria-atomic="false" className="chat-thread flex-1 overflow-auto thin-scroll p-4 space-y-4">
        {!connected && !connecting && messages.length === 0 && (
          <div className="chat-empty-state max-w-sm mx-auto mt-8 p-5 rounded-2xl text-center">
            <p className="font-semibold mb-1">Welcome! You can start chatting right away.</p>
            <p className="text-sm">
              Live chat is unavailable right now, but <strong>Portfolio Bot</strong> is here to help you explore.
            </p>
          </div>
        )}
        {messages.length === 0 && connecting && (
          <p role="status" className="chat-muted text-sm text-center mt-8">Connecting to live chat…</p>
        )}
        {messages.length === 0 && connected && (
          <p className="chat-muted text-sm text-center mt-8">
            No messages yet. Say hi — no account needed, you're chatting as{" "}
            <span className="font-semibold">{name || "a guest"}</span>.
          </p>
        )}

        {messages.map((m) => {
          const isSelf = m.name === name;
          const color = nameColor(m.name);
          return (
            <div key={m.id} className={`flex items-end gap-2 max-w-[92%] sm:max-w-[86%] chat-message-in ${isSelf ? "ml-auto flex-row-reverse" : ""}`}>
              <div
                aria-hidden="true"
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: color }}
              >
                {m.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className={`min-w-0 ${isSelf ? "text-right" : ""}`}>
                <div className="chat-meta text-xs font-medium mb-1">
                  {m.name} <time className="font-normal" dateTime={new Date(m.ts).toISOString()}>· {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                </div>
                <div
                  className={`chat-bubble ${isSelf ? "chat-bubble-self" : ""} ${m.pending ? "chat-bubble-pending" : ""} ${m.failed ? "chat-bubble-failed" : ""} px-3.5 py-2.5 leading-relaxed`}
                  style={{ fontSize: `${15 * textScale}px` }}
                >
                  {m.text}
                </div>
                {m.pending && <div role="status" className="chat-muted text-xs mt-1">Sending…</div>}
                {m.failed && (
                  <button onClick={() => retryMessage(m)} className="chat-error-link inline-flex items-center gap-1 text-xs font-semibold mt-1 rounded px-1 py-0.5">
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

      <div className="chat-identity flex items-center justify-between gap-2 px-4 py-2 border-t">
        {editingName ? (
          <form onSubmit={(e) => { e.preventDefault(); saveName(); }} className="flex items-center gap-2">
            <label htmlFor="chat-display-name" className="text-sm font-medium">Your display name</label>
            <input
              id="chat-display-name"
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={20}
              className="chat-input min-w-0 w-32 rounded-lg px-2.5 py-1.5 text-sm"
              placeholder="Your guest name"
            />
            <button type="submit" aria-label="Save display name" className="chat-icon-button"><GIconCheck size={16} /></button>
          </form>
        ) : (
          <button onClick={() => { setDraftName(name); setEditingName(true); }} className="chat-link inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-sm">
            <GIconPencil size={14} /> Chatting as <span className="font-semibold">{name || "guest"}</span>
          </button>
        )}
        <div role="group" className="flex items-center gap-1" aria-label="Message text size">
          <span className="chat-muted text-xs mr-1">Text</span>
          <button type="button" onClick={() => changeTextScale(-0.1)} disabled={textScale <= 1} aria-label="Decrease message text size" className="chat-text-size-button">A−</button>
          <button type="button" onClick={() => changeTextScale(0.1)} disabled={textScale >= 1.3} aria-label="Increase message text size" className="chat-text-size-button">A+</button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="chat-composer flex items-end gap-2 p-3 border-t">
        <label htmlFor="chat-message" className="sr-only">Write a message</label>
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
