import { useEffect, useState } from "react";
import { API_URL } from "../../lib/config";
import { getSocket } from "../../lib/socket";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";
import {
  GIconPaperPlane,
  GIconHeart,
  GIconSearch,
  GIconRotateRight,
  GIconSparkles,
} from "../icons/GravityIcons";

interface GuestbookEntry {
  id: string;
  name: string;
  role: string;
  avatar: string;
  message: string;
  ts: number;
  reactions: number;
}

const EMOJI_AVATARS = ["👋", "🚀", "💻", "🎨", "🔥", "⚡", "🌟", "☕", "🦄", "💡", "🧠", "✨"];
const PRESET_ROLES = ["Developer", "Recruiter", "Designer", "Tech Lead", "Friend", "Visitor"];

export default function Guestbook() {
  const { systemSounds, notify } = useOS();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState(localStorage.getItem("os_guestbook_name") || "");
  const [role, setRole] = useState("Developer");
  const [avatar, setAvatar] = useState("🚀");
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/guestbook`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch {
      // Fallback local entries if API not reachable
      setEntries([
        {
          id: "gb-fallback-1",
          name: "Alex River",
          role: "Full-Stack Dev",
          avatar: "🚀",
          message: "The macOS & Windows OS toggles with custom wallpapers are incredible! Super responsive design.",
          ts: Date.now() - 3600000 * 24 * 2,
          reactions: 12
        },
        {
          id: "gb-fallback-2",
          name: "Sarah Lin",
          role: "Product Designer",
          avatar: "🎨",
          message: "Loving the glassmorphism slider and sound effects. Portfolio feels alive and playful!",
          ts: Date.now() - 3600000 * 18,
          reactions: 8
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();

    const socket = getSocket();
    const onNewEntry = (entry: GuestbookEntry) => {
      setEntries((prev) => {
        if (prev.some((e) => e.id === entry.id)) return prev;
        return [entry, ...prev];
      });
      if (systemSounds) soundFx.playNotification();
      notify("New Guestbook Signature", `${entry.name} signed the guestbook.`, "info", 3500);
    };

    const onReacted = ({ id, reactions }: { id: string; reactions: number }) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, reactions } : e))
      );
    };

    socket.on("guestbook:entry", onNewEntry);
    socket.on("guestbook:reacted", onReacted);

    return () => {
      socket.off("guestbook:entry", onNewEntry);
      socket.off("guestbook:reacted", onReacted);
    };
  }, [systemSounds, notify]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanMsg = message.trim();
    if (!cleanName || !cleanMsg) return;

    setSubmitting(true);
    localStorage.setItem("os_guestbook_name", cleanName);

    try {
      const res = await fetch(`${API_URL}/api/guestbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          role,
          avatar,
          message: cleanMsg,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setEntries((prev) => [created, ...prev.filter((e) => e.id !== created.id)]);
        setMessage("");
        if (systemSounds) soundFx.playPop();
        notify("Guestbook Signed!", "Your message has been posted to the live guestbook.", "add");
      }
    } catch {
      // Local optimistic fallback
      const localEntry: GuestbookEntry = {
        id: `local-${Date.now()}`,
        name: cleanName,
        role,
        avatar,
        message: cleanMsg,
        ts: Date.now(),
        reactions: 1
      };
      setEntries((prev) => [localEntry, ...prev]);
      setMessage("");
      notify("Note Posted Locally", "Your message is saved for this session.", "add");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReact = async (id: string) => {
    if (systemSounds) soundFx.playClick();
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, reactions: e.reactions + 1 } : e))
    );
    notify("Reaction Sent", "Sent a reaction to the guestbook entry.", "update", 2200);

    try {
      await fetch(`${API_URL}/api/guestbook/${id}/react`, { method: "POST" });
    } catch {}
  };

  const filtered = entries.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q) ||
      e.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full bg-black/40 text-white text-xs select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/5">
        <div>
          <h3 className="font-display text-sm font-semibold flex items-center gap-2">
            <span className="text-accent">✦</span> Portfolio Guestbook & Ledger
          </h3>
          <p className="text-[11px] text-white/50">
            Leave a message, say hi, or share feedback in real time.
          </p>
        </div>
        <button
          onClick={fetchEntries}
          title="Refresh entries"
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition"
        >
          <GIconRotateRight size={14} className={loading ? "animate-spin text-accent" : ""} />
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left column: Sign Guestbook Form */}
        <div className="md:col-span-5 p-4 border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto thin-scroll space-y-3 bg-white/[0.02]">
          <div className="font-semibold text-white/90 flex items-center gap-1.5 text-xs">
            <GIconSparkles size={14} className="text-accent" />
            Sign the Guestbook
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] text-white/50 uppercase tracking-wide block mb-1">
                Choose Avatar
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white/5 border border-white/10">
                {EMOJI_AVATARS.map((emo) => (
                  <button
                    type="button"
                    key={emo}
                    onClick={() => setAvatar(emo)}
                    className={`w-7 h-7 rounded-lg text-base flex items-center justify-center transition-all ${
                      avatar === emo
                        ? "bg-accent/30 border border-accent scale-110 shadow-sm shadow-accent/40"
                        : "hover:bg-white/10 opacity-75 hover:opacity-100"
                    }`}
                  >
                    {emo}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-white/50 uppercase tracking-wide block">
                Your Name
              </label>
              <input
                type="text"
                required
                maxLength={30}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex River"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-white/50 uppercase tracking-wide block">
                Role / Title
              </label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {PRESET_ROLES.map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                      role === r
                        ? "bg-accent/20 border-accent text-white"
                        : "border-white/10 text-white/50 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <input
                type="text"
                maxLength={30}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Custom role"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-white/50 uppercase tracking-wide block">
                Message
              </label>
              <textarea
                required
                rows={3}
                maxLength={400}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Leave a friendly message, inquiry, or review..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-accent resize-none thin-scroll"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !name.trim() || !message.trim()}
              className="w-full py-2 rounded-xl bg-accent hover:bg-accent/80 disabled:opacity-40 text-white font-medium transition shadow-lg shadow-accent/20 flex items-center justify-center gap-1.5 text-xs"
            >
              <GIconPaperPlane size={13} />
              {submitting ? "Signing..." : "Post to Guestbook"}
            </button>
          </form>
        </div>

        {/* Right column: Entries Feed */}
        <div className="md:col-span-7 flex flex-col h-full overflow-hidden bg-white/[0.01]">
          {/* Search bar */}
          <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <GIconSearch size={12} className="text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visitor messages..."
                className="bg-transparent outline-none text-xs text-white placeholder:text-white/35 w-full"
              />
            </div>
            <span className="text-[11px] text-white/40 shrink-0">
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto thin-scroll p-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <p>No guestbook entries found.</p>
                <p className="text-[10px] text-white/30 mt-1">Be the first to sign!</p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        {item.avatar}
                      </span>
                      <div>
                        <div className="font-semibold text-white/95 text-xs">{item.name}</div>
                        <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-accent/15 text-accent border border-accent/20">
                          {item.role}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-white/35 font-mono">
                      {new Date(item.ts).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <p className="text-white/80 text-[11px] leading-relaxed pl-9 mb-2 whitespace-pre-wrap">
                    {item.message}
                  </p>

                  <div className="flex justify-end pl-9">
                    <button
                      onClick={() => handleReact(item.id)}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/10 hover:border-accent/40 bg-white/5 hover:bg-accent/10 transition text-[10px] text-white/60 hover:text-white"
                    >
                      <GIconHeart size={11} className="text-rose-400 group-hover:scale-110 transition-transform" />
                      <span>{item.reactions}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

