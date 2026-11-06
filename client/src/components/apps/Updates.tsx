import React, { useEffect, useState, useMemo } from "react";
import {
  GIconHeart,
  GIconWrench,
  GIconSparkles,
  GIconRocket,
  GIconSearch,
  GIconPlus,
  GIconTrash,
  GIconPin,
  GIconCopy,
  GIconCheck,
  GIconRotateRight,
  GIconClose,
  GIconSliders,
  GIconCircleInfo,
} from "../icons/GravityIcons";
import { API_URL } from "../../lib/config";
import { getSocket } from "../../lib/socket";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";

export interface UpdateItem {
  id: string;
  date: string;
  tag: "fix" | "feature" | "launch" | "announcement" | "performance";
  title: string;
  body: string;
  pinned?: boolean;
}

export interface DetailedReaction {
  heart: number;
  fire: number;
  rocket: number;
  party: number;
  total: number;
}

const TAG_META: Record<string, { label: string; Icon: any; color: string; bg: string }> = {
  feature: { label: "Feature", Icon: GIconSparkles, color: "#5FBF7C", bg: "rgba(95, 191, 124, 0.15)" },
  fix: { label: "Fix", Icon: GIconWrench, color: "#D98A4E", bg: "rgba(217, 138, 78, 0.15)" },
  launch: { label: "Launch", Icon: GIconRocket, color: "#8E7BE0", bg: "rgba(142, 123, 224, 0.15)" },
  announcement: { label: "Notice", Icon: GIconCircleInfo, color: "#38BDF8", bg: "rgba(56, 189, 248, 0.15)" },
  performance: { label: "Perf", Icon: GIconSliders, color: "#FBBF24", bg: "rgba(251, 191, 36, 0.15)" },
};

const EMOJI_BUTTONS: { type: "heart" | "fire" | "rocket" | "party"; emoji: string; label: string }[] = [
  { type: "heart", emoji: "❤️", label: "Love" },
  { type: "fire", emoji: "🔥", label: "Fire" },
  { type: "rocket", emoji: "🚀", label: "Shipped" },
  { type: "party", emoji: "🎉", label: "Celebrate" },
];

export default function Updates() {
  const { systemSounds, notify } = useOS();
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [reactions, setReactions] = useState<Record<string, DetailedReaction>>({});
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "oldest">("newest");
  const [justReacted, setJustReacted] = useState<{ id: string; type: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New update modal / drawer state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTag, setNewTag] = useState<UpdateItem["tag"]>("feature");
  const [newBody, setNewBody] = useState("");
  const [newPinned, setNewPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch initial updates and reactions
  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([
        fetch(`${API_URL}/api/updates`),
        fetch(`${API_URL}/api/updates/reactions`).catch(() => null)
      ]);
      if (uRes.ok) {
        const uData = await uRes.json();
        setUpdates(uData);
      }
      if (rRes && rRes.ok) {
        const rData = await rRes.json();
        if (rData.detailed) {
          setReactions(rData.detailed);
        } else if (rData.counts) {
          // Normalise flat counts to detailed
          const norm: Record<string, DetailedReaction> = {};
          for (const [k, v] of Object.entries(rData.counts)) {
            norm[k] = { heart: Number(v), fire: 0, rocket: 0, party: 0, total: Number(v) };
          }
          setReactions(norm);
        }
      }
    } catch {
      // offline fallback handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  // Real-time Socket.IO synchronization
  useEffect(() => {
    const socket = getSocket();

    const onNewUpdate = (newEntry: UpdateItem) => {
      setUpdates((prev) => {
        if (prev.some((u) => u.id === newEntry.id)) return prev;
        return [newEntry, ...prev];
      });
      if (systemSounds) soundFx.playNotification();
      notify("New Update Published", newEntry.title, "info");
    };

    const onReacted = ({ id, type, count, reactions: detailed }: any) => {
      setReactions((prev) => ({
        ...prev,
        [id]: detailed || {
          ...(prev[id] || { heart: 0, fire: 0, rocket: 0, party: 0, total: 0 }),
          [type]: ((prev[id]?.[type as keyof DetailedReaction] as number) || 0) + 1,
          total: count || ((prev[id]?.total || 0) + 1)
        }
      }));
    };

    const onDeleted = ({ id }: { id: string }) => {
      setUpdates((prev) => prev.filter((u) => u.id !== id));
      notify("Update Removed", "An update entry was deleted.", "delete");
    };

    const onPinned = ({ id, pinned }: { id: string; pinned: boolean }) => {
      setUpdates((prev) =>
        prev.map((u) => (u.id === id ? { ...u, pinned } : u))
      );
    };

    socket.on("update:new", onNewUpdate);
    socket.on("update:reacted", onReacted);
    socket.on("update:deleted", onDeleted);
    socket.on("update:pinned", onPinned);

    return () => {
      socket.off("update:new", onNewUpdate);
      socket.off("update:reacted", onReacted);
      socket.off("update:deleted", onDeleted);
      socket.off("update:pinned", onPinned);
    };
  }, [systemSounds, notify]);

  // Send a multi-emoji reaction
  const react = async (id: string, type: "heart" | "fire" | "rocket" | "party") => {
    if (systemSounds) soundFx.playClick();
    setJustReacted({ id, type });
    setTimeout(() => setJustReacted(null), 500);

    // Optimistic UI update
    setReactions((prev) => {
      const cur = prev[id] || { heart: 0, fire: 0, rocket: 0, party: 0, total: 0 };
      return {
        ...prev,
        [id]: {
          ...cur,
          [type]: cur[type] + 1,
          total: cur.total + 1
        }
      };
    });

    try {
      await fetch(`${API_URL}/api/updates/${id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
    } catch {
      // rollback or ignore
    }
  };

  // Toggle pinned update
  const togglePin = async (id: string) => {
    if (systemSounds) soundFx.playClick();
    try {
      const res = await fetch(`${API_URL}/api/updates/${id}/pin`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setUpdates((prev) => prev.map((u) => (u.id === id ? { ...u, pinned: data.pinned } : u)));
        notify("Update Pinned", data.pinned ? "Pinned to top" : "Unpinned", "update");
      }
    } catch {}
  };

  // Delete update entry
  const deleteUpdate = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this update entry?")) return;
    if (systemSounds) soundFx.playTrash();
    try {
      const res = await fetch(`${API_URL}/api/updates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUpdates((prev) => prev.filter((u) => u.id !== id));
        notify("Update Removed", "Update entry deleted.", "delete");
      }
    } catch {}
  };

  // Copy update text to clipboard
  const copyUpdate = (item: UpdateItem) => {
    if (systemSounds) soundFx.playClick();
    const text = `[Portfolio OS Update - ${item.title}]\n${item.date} (${item.tag.toUpperCase()})\n\n${item.body}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    notify("Copied to Clipboard", "Update changelog copied to clipboard.", "success");
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Publish new update
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) {
      notify("Missing Fields", "Please provide a title and changelog description.", "warning");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          tag: newTag,
          body: newBody.trim(),
          pinned: newPinned
        })
      });

      if (res.ok) {
        const created = await res.json();
        setUpdates((prev) => [created, ...prev]);
        setNewTitle("");
        setNewBody("");
        setNewPinned(false);
        setIsComposerOpen(false);
        if (systemSounds) soundFx.playSuccess();
        notify("Update Published", `"${created.title}" is now live!`, "success");
      } else {
        notify("Publication Failed", "Could not publish update to server.", "warning");
      }
    } catch (err) {
      notify("Network Error", "Unable to reach server to publish update.", "warning");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tag filter counts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = { all: updates.length };
    updates.forEach((u) => {
      counts[u.tag] = (counts[u.tag] || 0) + 1;
    });
    return counts;
  }, [updates]);

  // Filtered and sorted updates
  const filteredUpdates = useMemo(() => {
    let result = [...updates];

    if (activeTag !== "all") {
      result = result.filter((u) => u.tag === activeTag);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) => u.title.toLowerCase().includes(q) || u.body.toLowerCase().includes(q)
      );
    }

    if (sortBy === "popular") {
      result.sort((a, b) => (reactions[b.id]?.total || 0) - (reactions[a.id]?.total || 0));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      // Default newest first, keeping pinned at very top
      result.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    }

    return result;
  }, [updates, activeTag, searchQuery, sortBy, reactions]);

  return (
    <div className="flex flex-col h-full bg-slate-950/40 text-white select-text">
      {/* Top Header Bar */}
      <div className="shrink-0 p-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <GIconSparkles size={16} />
              </span>
              <h2 className="font-display text-lg font-bold tracking-tight text-white">Changelog & System Updates</h2>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Live updates stream on Portfolio OS kernel improvements, featured apps & release notes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (systemSounds) soundFx.playClick();
                fetchUpdates();
              }}
              title="Refresh updates"
              className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition"
            >
              <GIconRotateRight size={14} className={loading ? "animate-spin" : ""} />
            </button>

            <button
              onClick={() => {
                if (systemSounds) soundFx.playClick();
                setIsComposerOpen(!isComposerOpen);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-white hover:opacity-90 transition shadow-lg shadow-accent/20"
            >
              <GIconPlus size={14} />
              <span>{isComposerOpen ? "Close Composer" : "Publish Update"}</span>
            </button>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="relative flex-1 min-w-[180px]">
            <GIconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search updates or keywords..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <GIconClose size={12} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-black/30 border border-white/10 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => {
                if (systemSounds) soundFx.playClick();
                setSortBy("newest");
              }}
              className={`px-2.5 py-1 rounded-md transition ${sortBy === "newest" ? "bg-white/15 text-white font-medium" : "text-white/60 hover:text-white"}`}
            >
              Newest
            </button>
            <button
              onClick={() => {
                if (systemSounds) soundFx.playClick();
                setSortBy("popular");
              }}
              className={`px-2.5 py-1 rounded-md transition ${sortBy === "popular" ? "bg-white/15 text-white font-medium" : "text-white/60 hover:text-white"}`}
            >
              Most Reacted
            </button>
            <button
              onClick={() => {
                if (systemSounds) soundFx.playClick();
                setSortBy("oldest");
              }}
              className={`px-2.5 py-1 rounded-md transition ${sortBy === "oldest" ? "bg-white/15 text-white font-medium" : "text-white/60 hover:text-white"}`}
            >
              Oldest
            </button>
          </div>
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto thin-scroll pb-1">
          <button
            onClick={() => {
              if (systemSounds) soundFx.playClick();
              setActiveTag("all");
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition shrink-0 ${
              activeTag === "all"
                ? "bg-white text-slate-900"
                : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            All <span className="opacity-70 ml-1">({tagCounts.all || 0})</span>
          </button>

          {Object.entries(TAG_META).map(([tagKey, meta]) => {
            const count = tagCounts[tagKey] || 0;
            const Icon = meta.Icon;
            const active = activeTag === tagKey;
            return (
              <button
                key={tagKey}
                onClick={() => {
                  if (systemSounds) soundFx.playClick();
                  setActiveTag(tagKey);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition shrink-0 ${
                  active
                    ? "ring-1 text-white shadow-sm"
                    : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
                style={{
                  background: active ? meta.bg : undefined,
                  borderColor: active ? meta.color : undefined,
                  color: active ? meta.color : undefined,
                }}
              >
                <Icon size={12} />
                <span>{meta.label}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto thin-scroll p-4 space-y-3">
        {/* Publish Update Composer Modal / Box */}
        {isComposerOpen && (
          <form
            onSubmit={handlePublish}
            className="rounded-2xl border border-accent/40 bg-accent/5 p-4 mb-4 backdrop-blur-md shadow-xl animate-scaleIn"
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                <GIconPlus size={14} /> Compose New Changelog Update
              </span>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="text-white/40 hover:text-white p-1"
              >
                <GIconClose size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-white/70 mb-1">Update Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Added Real-Time Notes Cloud Sync & Unit Converter"
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-black/40 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-white/70 mb-1">Category Tag</label>
                  <select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-black/40 border border-white/15 text-white focus:outline-none focus:border-accent"
                  >
                    <option value="feature">✨ Feature</option>
                    <option value="fix">🔧 Bug Fix</option>
                    <option value="launch">🚀 Release / Launch</option>
                    <option value="announcement">📢 Announcement</option>
                    <option value="performance">⚡ Performance</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPinned}
                      onChange={(e) => setNewPinned(e.target.checked)}
                      className="rounded bg-black/40 border-white/20 text-accent focus:ring-accent"
                    />
                    <span>Pin this update to top</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70 mb-1">Changelog Description</label>
                <textarea
                  required
                  rows={3}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Explain what was shipped, technical details, fixes or architectural improvements..."
                  className="w-full px-3 py-2 rounded-lg text-xs bg-black/40 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:border-accent leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-accent text-white hover:opacity-90 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Broadcasting..." : "Publish & Sync Live"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 w-20 bg-white/10 rounded-full" />
                  <div className="h-3 w-16 bg-white/10 rounded" />
                </div>
                <div className="h-4 w-3/4 bg-white/10 rounded mb-2.5" />
                <div className="h-3 w-full bg-white/5 rounded mb-1.5" />
                <div className="h-3 w-2/3 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredUpdates.length === 0 && (
          <div className="text-center py-12 px-4 rounded-xl border border-white/5 bg-white/[0.02]">
            <GIconSparkles size={28} className="mx-auto text-white/30 mb-2" />
            <div className="text-sm font-medium text-white/70">No updates matching your search</div>
            <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
              Try clearing filters or search keywords, or compose a new update to broadcast to all visitors.
            </p>
            {activeTag !== "all" || searchQuery ? (
              <button
                onClick={() => {
                  setActiveTag("all");
                  setSearchQuery("");
                }}
                className="mt-3 px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/15 rounded-lg transition"
              >
                Reset Filters
              </button>
            ) : null}
          </div>
        )}

        {/* Update Cards */}
        <div className="space-y-3">
          {filteredUpdates.map((u) => {
            const meta = TAG_META[u.tag] || TAG_META.feature;
            const Icon = meta.Icon;
            const itemReactions = reactions[u.id] || { heart: 0, fire: 0, rocket: 0, party: 0, total: 0 };
            const isJustReacted = justReacted?.id === u.id;

            return (
              <div
                key={u.id}
                className={`group relative rounded-xl border p-4 transition duration-200 ${
                  u.pinned
                    ? "border-amber-500/40 bg-gradient-to-br from-amber-500/[0.08] to-white/[0.02] shadow-lg shadow-amber-500/5"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}33` }}
                    >
                      <Icon size={11} /> {meta.label}
                    </span>

                    {u.pinned && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                        <GIconPin size={10} /> Pinned
                      </span>
                    )}

                    <span className="text-[11px] text-white/40">
                      {new Date(u.date).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </div>

                  {/* Actions: Pin, Copy, Delete */}
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                    <button
                      onClick={() => togglePin(u.id)}
                      title={u.pinned ? "Unpin update" : "Pin to top"}
                      className={`p-1.5 rounded-md hover:bg-white/10 transition ${u.pinned ? "text-amber-400" : "text-white/40 hover:text-white"}`}
                    >
                      <GIconPin size={12} />
                    </button>

                    <button
                      onClick={() => copyUpdate(u)}
                      title="Copy update changelog"
                      className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition"
                    >
                      {copiedId === u.id ? <GIconCheck size={12} className="text-emerald-400" /> : <GIconCopy size={12} />}
                    </button>

                    <button
                      onClick={() => deleteUpdate(u.id)}
                      title="Delete update"
                      className="p-1.5 rounded-md text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <GIconTrash size={12} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-white/95 mb-1.5 leading-snug tracking-tight">
                  {u.title}
                </h3>

                {/* Body Content */}
                <p className="text-xs text-white/70 leading-relaxed font-normal whitespace-pre-line mb-3">
                  {u.body}
                </p>

                {/* Multi-Reaction Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    {EMOJI_BUTTONS.map((btn) => {
                      const count = (itemReactions as any)[btn.type] || 0;
                      const isTarget = isJustReacted && justReacted?.type === btn.type;
                      return (
                        <button
                          key={btn.type}
                          onClick={() => react(u.id, btn.type)}
                          title={`React with ${btn.label}`}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition border ${
                            count > 0
                              ? "bg-white/10 border-white/20 text-white hover:bg-white/15"
                              : "bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
                          } ${isTarget ? "scale-125 bg-accent/30 border-accent" : ""}`}
                        >
                          <span className={`transition-transform ${isTarget ? "scale-125" : ""}`}>
                            {btn.emoji}
                          </span>
                          <span className="text-[11px] font-medium">{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-[10px] text-white/40">
                    {itemReactions.total || 0} reaction{itemReactions.total === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
