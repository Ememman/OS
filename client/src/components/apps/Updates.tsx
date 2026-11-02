import { useEffect, useState, useMemo } from "react";
import {
  GIconHeart,
  GIconWrench,
  GIconSparkles,
  GIconRocket,
  GIconActivity,
  GIconUpdates,
  GIconPlus,
  GIconClose,
  GIconSearch,
  GIconPaperPlane,
  GIconLoader,
  GIconClock,
  GIconTrash,
} from "../icons/GravityIcons";
import { API_URL } from "../../lib/config";
import { getSocket } from "../../lib/socket";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";

export interface UpdateItem {
  id: string;
  date: string;
  tag: string;
  title: string;
  body: string;
  author?: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  text: string;
  ts: number;
}

const TAG_META: Record<string, { label: string; Icon: any; color: string; bg: string }> = {
  feature: { label: "Feature", Icon: GIconSparkles, color: "#5FBF7C", bg: "#5FBF7C18" },
  fix: { label: "Fix", Icon: GIconWrench, color: "#D98A4E", bg: "#D98A4E18" },
  launch: { label: "Launch", Icon: GIconRocket, color: "#8E7BE0", bg: "#8E7BE018" },
  perf: { label: "Performance", Icon: GIconActivity, color: "#38bdf8", bg: "#38bdf818" },
  announcement: { label: "Announcement", Icon: GIconUpdates, color: "#f43f5e", bg: "#f43f5e18" },
};

const AVAILABLE_EMOJIS = ["❤️", "🚀", "🔥", "👍"];

export default function Updates() {
  const { systemSounds, notify } = useOS();
  const [activeTab, setActiveTab] = useState<"updates" | "stream">("updates");
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // New update form fields
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newTag, setNewTag] = useState("feature");
  const [newAuthor, setNewAuthor] = useState("Bron Mendoza");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch initial updates, reactions, and live activity feed
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/updates`).then((r) => r.json()).catch(() => []),
      fetch(`${API_URL}/api/updates/reactions`).then((r) => r.json()).catch(() => ({})),
      fetch(`${API_URL}/api/activity/feed`).then((r) => r.json()).catch(() => [])
    ])
      .then(([u, r, a]) => {
        if (Array.isArray(u)) setUpdates(u);
        if (r && typeof r === "object") setReactions(r);
        if (Array.isArray(a)) setActivityFeed(a);
      })
      .finally(() => setLoading(false));
  }, []);

  // Real-time WebSocket synchronization
  useEffect(() => {
    const socket = getSocket();

    // 1. Live new update broadcast
    const onNewUpdate = (newEntry: UpdateItem) => {
      setUpdates((prev) => {
        if (prev.some((u) => u.id === newEntry.id)) return prev;
        return [newEntry, ...prev];
      });
      setHighlightId(newEntry.id);
      setTimeout(() => setHighlightId(null), 3000);
      if (systemSounds) soundFx.playNotification();
      notify("New Update Published", newEntry.title);
    };

    // 2. Live reactions sync
    const onUpdateReacted = ({ id, counts }: { id: string; counts: Record<string, number> }) => {
      setReactions((prev) => ({
        ...prev,
        [id]: counts
      }));
    };

    // 3. Live system activity stream
    const onActivityEntry = (entry: ActivityItem) => {
      setActivityFeed((prev) => [entry, ...prev].slice(0, 60));
    };

    const onUpdateDeleted = ({ id }: { id: string }) => {
      setUpdates((prev) => prev.filter((u) => u.id !== id));
      if (systemSounds) soundFx.playClose();
      notify("Update Removed", "A system update was deleted.", "delete");
    };

    socket.on("update:new", onNewUpdate);
    socket.on("update:reacted", onUpdateReacted);
    socket.on("update:deleted", onUpdateDeleted);
    socket.on("activity:entry", onActivityEntry);

    return () => {
      socket.off("update:new", onNewUpdate);
      socket.off("update:reacted", onUpdateReacted);
      socket.off("update:deleted", onUpdateDeleted);
      socket.off("activity:entry", onActivityEntry);
    };
  }, [systemSounds, notify]);

  // Handle emoji reaction
  const handleReact = async (id: string, emoji: string) => {
    if (systemSounds) soundFx.playPop();

    // Optimistic UI update
    setReactions((prev) => {
      const current = prev[id] || { "❤️": 0, "🚀": 0, "🔥": 0, "👍": 0 };
      return {
        ...prev,
        [id]: {
          ...current,
          [emoji]: (current[emoji] || 0) + 1
        }
      };
    });

    notify("Reaction Added", `Reacted with ${emoji}`, "update", 2200);
    try {
      await fetch(`${API_URL}/api/updates/${id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji })
      });
    } catch {}
  };

  // Delete update handler
  const handleDeleteUpdate = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (systemSounds) soundFx.playClose();
    setUpdates((prev) => prev.filter((u) => u.id !== id));
    notify("Update Deleted", `"${title}" was removed.`, "delete");

    try {
      await fetch(`${API_URL}/api/updates/${id}`, {
        method: "DELETE"
      });
    } catch {
      notify("Delete Failed", "Could not remove update from server.", "warning");
    }
  };

  // Publish new real-time update
  const handlePublishUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    setIsSubmitting(true);
    if (systemSounds) soundFx.playClick();

    try {
      const res = await fetch(`${API_URL}/api/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          body: newBody.trim(),
          tag: newTag,
          author: newAuthor.trim() || "Bron Mendoza"
        })
      });

      if (res.ok) {
        const created: UpdateItem = await res.json();
        setUpdates((prev) => (prev.some((u) => u.id === created.id) ? prev : [created, ...prev]));
        setNewTitle("");
        setNewBody("");
        setComposerOpen(false);
        if (systemSounds) soundFx.playNotification();
        notify("Update Published!", "Your release note was broadcast to all connected users.", "add");
      }
    } catch {
      notify("Publishing Failed", "Could not connect to API server.", "warning");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered updates list
  const filteredUpdates = useMemo(() => {
    return updates.filter((u) => {
      const matchesTag = filterTag === "all" || u.tag === filterTag;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.title.toLowerCase().includes(q) ||
        u.body.toLowerCase().includes(q) ||
        (u.author && u.author.toLowerCase().includes(q));
      return matchesTag && matchesSearch;
    });
  }, [updates, filterTag, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-[#0c0e14]/90 text-white select-none overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-white/10 bg-white/[0.02] space-y-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
              <GIconUpdates size={18} className="text-emerald-400" />
              <span>Changelog & System Updates</span>
            </h2>
            <p className="text-xs text-white/50">Live real-time feed of software releases, improvements, and system events.</p>
          </div>

          <button
            onClick={() => setComposerOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:brightness-110 text-white text-xs font-semibold shadow-md shadow-accent/20 transition shrink-0 cursor-pointer"
          >
            {composerOpen ? <GIconClose size={13} /> : <GIconPlus size={13} />}
            <span>{composerOpen ? "Cancel" : "Post Live Update"}</span>
          </button>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/5 border border-white/10 shrink-0 text-xs">
            <button
              onClick={() => setActiveTab("updates")}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                activeTab === "updates"
                  ? "bg-accent text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Updates Feed ({updates.length})
            </button>
            <button
              onClick={() => setActiveTab("stream")}
              className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === "stream"
                  ? "bg-accent text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Activity Stream</span>
            </button>
          </div>

          {activeTab === "updates" && (
            <div className="relative flex-1 sm:max-w-xs">
              <GIconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search releases & notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs focus:outline-none focus:border-accent text-white placeholder:text-white/30"
              />
            </div>
          )}
        </div>

        {/* Tag Filters (Only in Updates tab) */}
        {activeTab === "updates" && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs pt-0.5">
            {[
              { id: "all", label: "All Updates" },
              { id: "launch", label: "Launch" },
              { id: "feature", label: "Features" },
              { id: "fix", label: "Bug Fixes" },
              { id: "perf", label: "Performance" },
              { id: "announcement", label: "Announcements" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterTag(t.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition shrink-0 ${
                  filterTag === t.id
                    ? "bg-white/20 text-white font-semibold"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto thin-scroll p-4 space-y-3">
        {/* Real-time Composer Form */}
        {composerOpen && (
          <form
            onSubmit={handlePublishUpdate}
            className="p-4 rounded-2xl bg-white/[0.04] border border-accent/40 shadow-xl space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <GIconSparkles size={13} className="text-accent" />
                <span>Publish Real-time Update (Broadcasts to all clients)</span>
              </span>
              <span className="text-[10px] text-white/40 font-mono">Live WebSocket Push</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-white/40 mb-1 block">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Real-time updates & activity stream integrated"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 focus:outline-none focus:border-accent text-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 mb-1 block">Category</label>
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 focus:outline-none focus:border-accent text-white"
                >
                  <option value="feature">Feature</option>
                  <option value="launch">Launch</option>
                  <option value="fix">Bug Fix</option>
                  <option value="perf">Performance</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>
            </div>

            <div className="text-xs">
              <label className="text-[10px] uppercase font-bold text-white/40 mb-1 block">Details & Release Notes</label>
              <textarea
                required
                rows={3}
                placeholder="Describe what was updated, engineered, or deployed in this release..."
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 focus:outline-none focus:border-accent text-white resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <input
                type="text"
                placeholder="Author Handle"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-black/30 border border-white/10 text-xs text-white/70 focus:outline-none focus:border-accent max-w-[140px]"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim() || !newBody.trim()}
                  className="px-4 py-1.5 rounded-xl bg-accent hover:brightness-110 disabled:opacity-50 text-xs font-semibold text-white shadow-md shadow-accent/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <GIconLoader size={12} /> : <GIconPaperPlane size={12} />}
                  <span>{isSubmitting ? "Broadcasting..." : "Broadcast Update"}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 1: Updates Changelog Feed */}
        {activeTab === "updates" && (
          <>
            {loading && (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse space-y-2">
                    <div className="h-4 w-20 bg-white/10 rounded-full" />
                    <div className="h-4 w-2/3 bg-white/10 rounded" />
                    <div className="h-3 w-full bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredUpdates.length === 0 && (
              <div className="text-center py-12 text-white/40 space-y-2">
                <p className="text-sm">No updates match your current filter.</p>
                <button
                  onClick={() => { setFilterTag("all"); setSearchQuery(""); }}
                  className="text-xs text-accent underline"
                >
                  Reset filters
                </button>
              </div>
            )}

            <div className="space-y-3">
              {filteredUpdates.map((u) => {
                const meta = TAG_META[u.tag] || TAG_META.feature;
                const Icon = meta.Icon;
                const isHighlighted = highlightId === u.id;
                const updateReactions = reactions[u.id] || {};

                return (
                  <div
                    key={u.id}
                    className={`rounded-2xl border bg-white/[0.03] p-4 transition-all duration-300 ${
                      isHighlighted
                        ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          <Icon size={12} /> {meta.label}
                        </span>
                        {u.author && (
                          <span className="text-[10px] text-white/50 font-medium">by {u.author}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                          <GIconClock size={11} />
                          {new Date(u.date).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                        <button
                          onClick={(e) => handleDeleteUpdate(u.id, u.title, e)}
                          title="Delete update"
                          className="p-1 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        >
                          <GIconTrash size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Title & Body */}
                    <h3 className="text-sm sm:text-base font-semibold text-white mb-1.5 leading-snug">{u.title}</h3>
                    <p className="text-xs text-white/70 leading-relaxed whitespace-pre-line">{u.body}</p>

                    {/* Real-time Emoji Reactions Bar */}
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-white/40 uppercase tracking-wide mr-1 font-mono">React:</span>
                      {AVAILABLE_EMOJIS.map((emoji) => {
                        const count = updateReactions[emoji] || 0;
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReact(u.id, emoji)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs transition border cursor-pointer ${
                              count > 0
                                ? "bg-white/10 border-white/20 text-white font-medium hover:scale-105"
                                : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span className="font-mono text-[10px] text-white/90">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Tab 2: Live Activity Stream */}
        {activeTab === "stream" && (
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
              <span className="text-white/60">Real-time socket event stream across Portfolio OS</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live WebSocket
              </span>
            </div>

            {activityFeed.length === 0 ? (
              <p className="text-center py-8 text-xs text-white/40">Waiting for live server events...</p>
            ) : (
              activityFeed.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 flex items-start gap-3 transition"
                >
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    {act.type === "chat" && <span className="text-xs">💬</span>}
                    {act.type === "project" && <span className="text-xs">⭐</span>}
                    {act.type === "update" && <span className="text-xs">🚀</span>}
                    {act.type === "guestbook" && <span className="text-xs">✍️</span>}
                    {act.type === "visitor" && <span className="text-xs">👋</span>}
                    {!["chat", "project", "update", "guestbook", "visitor"].includes(act.type) && (
                      <GIconActivity size={12} className="text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/90 leading-tight">{act.text}</p>
                    <span className="text-[10px] text-white/40 font-mono mt-0.5 block">
                      {new Date(act.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
