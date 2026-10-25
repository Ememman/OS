import { useEffect, useRef, useState } from "react";
import {
  GIconPaperPlane,
  GIconPersons,
  GIconPencil,
  GIconCheck,
  GIconRotateRight,
  GIconSliders,
} from "../icons/GravityIcons";
import { getSocket } from "../../lib/socket";
import { useOS } from "../../store/useOS";
import { useOutsideClick } from "../../lib/useOutsideClick";

const BG_OPTIONS = [
  { id: "halftone", label: "Halftone", swatch: "#f4f1ea" },
  { id: "notebook", label: "Notebook", swatch: "#f7f4ec" },
  { id: "ink", label: "Ink Night", swatch: "#0d0d10" },
  { id: "plain", label: "Plain", swatch: "#efece3" },
  { id: "action", label: "Action", swatch: "#17161c" }
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
  const palette = ["#E8543F", "#57D9C7", "#9478FF", "#F5A642", "#EC6096", "#5FBF7C"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % palette.length;
  return palette[Math.abs(hash) % palette.length];
}

function BgPicker({ current, onPick, onClose }) {
  const ref = useRef(null);
  useOutsideClick(ref, onClose);
  return (
    <div ref={ref} className="absolute top-full right-3 mt-1.5 z-[1200] bg-black border-2 border-white rounded-xl p-2 shadow-2xl" style={{ animation: "menuOpen 140ms cubic-bezier(.16,1,.3,1) both" }}>
      <div className="text-[10px] text-white/60 font-bold uppercase tracking-wide px-1 pb-1.5">Panel style</div>
      <div className="grid grid-cols-3 gap-1.5">
        {BG_OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => { onPick(o.id); onClose(); }}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition ${current === o.id ? "ring-2 ring-accent" : "hover:bg-white/10"}`}
          >
            <span className="w-8 h-8 rounded-md border-2 border-white/70" style={{ background: o.swatch }} />
            <span className="text-[9px] text-white/70">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Chats() {
  const chatSound = useOS((s) => s.chatSound);
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
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typingName]);

  // Sends a message with an optimistic local echo, so you always see it
  // appear immediately — then confirms (or flags as failed) via a server
  // acknowledgement instead of silently hoping the round-trip arrives.
  const sendText = (t) => {
    if (!t || !connected) return;
    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
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

  return (
    <div className={`flex flex-col h-full manga-panel--${chatBg} font-comic`}>
      {/* Comic masthead */}
      <div className={`px-3 py-2 border-b-[3px] flex items-center justify-between ${isDark ? "border-white/80 bg-black/40" : "border-black bg-[#f4f1ea]/90"}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`font-shout text-xl leading-none shrink-0 ${isDark ? "text-white" : "text-black"}`}
            style={{ WebkitTextStroke: isDark ? "1px white" : "1px black" }}
          >
            LIVE CHAT!
          </span>
          <span
            className={`hidden xs:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border-2 shrink-0 ${isDark ? "border-white/80" : "border-black"} ${
              connected ? "bg-emerald-300" : connecting ? "bg-amber-300" : "bg-red-300"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full bg-black ${connecting ? "animate-pulse" : ""}`} />
            {connected ? "ON AIR" : connecting ? "TUNING IN…" : "OFFLINE"}
          </span>
          {!connected && !connecting && (
            <button onClick={retryConnection} className={`flex items-center gap-0.5 text-[10px] font-bold underline shrink-0 ${isDark ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"}`}>
              <GIconRotateRight size={11} /> Retry
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className={`flex items-center gap-1 text-[11px] font-bold rounded-full px-2 py-0.5 border-2 ${isDark ? "border-white/80 bg-black text-white/80" : "border-black bg-white text-black/70"}`}>
            <GIconPersons size={12} /> {online}
          </div>
          <div className="relative">
            <button
              onClick={() => setBgPickerOpen((o) => !o)}
              title="Change chat background"
              className={`p-1.5 rounded-full border-2 transition-colors ${isDark ? "border-white/80 hover:bg-white/10 text-white" : "border-black hover:bg-black/10 text-black"}`}
            >
              <GIconSliders size={13} />
            </button>
            {bgPickerOpen && <BgPicker current={chatBg} onPick={setChatBg} onClose={() => setBgPickerOpen(false)} />}
          </div>
        </div>
      </div>

      {/* Panel body */}
      <div ref={listRef} className="flex-1 overflow-auto thin-scroll p-3 space-y-3">
        {!connected && !connecting && messages.length === 0 && (
          <p className={`text-xs text-center mt-8 font-comic ${isDark ? "text-white/60" : "text-black/60"}`}>
            Couldn't reach the chat server. Make sure the backend (<code className="font-mono">server/</code>) is running, then hit Retry.
          </p>
        )}
        {messages.length === 0 && connecting && (
          <p className={`text-xs text-center mt-8 ${isDark ? "text-white/60" : "text-black/60"}`}>Connecting to live chat…</p>
        )}
        {messages.length === 0 && connected && (
          <p className={`text-xs text-center mt-8 ${isDark ? "text-white/60" : "text-black/60"}`}>
            No messages yet. Say hi — no account needed, you're chatting as{" "}
            <span className="font-bold" style={{ color: nameColor(name || "guest") }}>{name || "a guest"}</span>.
          </p>
        )}

        {messages.map((m) => {
          const isSelf = m.name === name;
          const color = nameColor(m.name);
          return (
            <div key={m.id} className={`flex items-end gap-2 max-w-[88%] manga-bubble-in ${isSelf ? "ml-auto flex-row-reverse" : ""}`}>
              <div
                className="w-7 h-7 rounded-full border-2 border-black flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-[2px_2px_0_rgba(0,0,0,0.9)]"
                style={{ background: color }}
                title={m.name}
              >
                {m.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <div className={`text-[10px] font-bold mb-0.5 ${isSelf ? "text-right" : ""} ${isDark ? "text-white/70" : "text-black/60"}`}>
                  {m.name} <span className={`font-normal ${isDark ? "text-white/35" : "text-black/35"}`}>· {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div
                  className={`manga-bubble ${isSelf ? "manga-bubble-self" : ""} ${m.pending ? "manga-bubble-pending" : ""} ${m.failed ? "manga-bubble-failed" : ""} px-3 py-2 text-[13px] leading-snug`}
                >
                  {m.text}
                </div>
                {m.pending && <div className="text-[9px] text-black/40 mt-0.5">Sending…</div>}
                {m.failed && (
                  <button onClick={() => retryMessage(m)} className="flex items-center gap-1 text-[9px] text-red-500 font-bold mt-0.5 hover:underline">
                    <GIconRotateRight size={10} /> Failed to send — tap to retry
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {typingName && typingName !== name && (
          <div className={`flex items-center gap-1.5 text-[11px] italic pl-9 ${isDark ? "text-white/50" : "text-black/50"}`}>
            <span className="font-bold not-italic" style={{ color: nameColor(typingName) }}>{typingName}</span>
            is typing
            <span className="inline-flex gap-0.5">
              <span className={`w-1 h-1 rounded-full animate-bounce ${isDark ? "bg-white/40" : "bg-black/40"}`} style={{ animationDelay: "0ms" }} />
              <span className={`w-1 h-1 rounded-full animate-bounce ${isDark ? "bg-white/40" : "bg-black/40"}`} style={{ animationDelay: "120ms" }} />
              <span className={`w-1 h-1 rounded-full animate-bounce ${isDark ? "bg-white/40" : "bg-black/40"}`} style={{ animationDelay: "240ms" }} />
            </span>
          </div>
        )}
      </div>

      {/* Caption-box name editor */}
      <div className={`px-3 py-1.5 border-t-2 flex items-center gap-2 text-[11px] ${isDark ? "border-white/40 bg-black/40" : "border-black/70 bg-[#f4f1ea]"}`}>
        {editingName ? (
          <>
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="bg-white border-2 border-black rounded px-2 py-0.5 text-black outline-none w-32 font-comic font-bold"
              placeholder="Your guest name"
            />
            <button onClick={saveName} className="p-1 hover:bg-black/10 rounded border-2 border-black bg-white"><GIconCheck size={12} /></button>
          </>
        ) : (
          <button onClick={() => { setDraftName(name); setEditingName(true); }} className={`flex items-center gap-1 font-bold ${isDark ? "text-white/70 hover:text-white" : "text-black/60 hover:text-black"}`}>
            <GIconPencil size={11} /> {name || "guest"}
          </button>
        )}
      </div>

      {/* Bold comic composer bar */}
      <div className="p-2.5 bg-black flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); getSocket().emit("chat:typing"); }}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={connected ? "Say something…" : "Waiting for connection…"}
          disabled={!connected}
          className="flex-1 bg-white text-black placeholder:text-black/40 rounded-full px-3.5 py-2 text-sm outline-none font-comic font-bold border-2 border-white focus:ring-2 ring-accent disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={!connected}
          className="flex items-center gap-1 px-3 py-2 bg-accent text-white rounded-full font-shout text-sm border-2 border-white disabled:opacity-40 active:scale-95 transition"
        >
          <GIconPaperPlane size={14} />
        </button>
      </div>
    </div>
  );
}
