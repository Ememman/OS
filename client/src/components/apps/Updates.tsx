import React, { useEffect, useState, useMemo } from "react";
import {
  GIconWrench,
  GIconUpdates,
  GIconTrophy,
  GIconRocket,
  GIconSearch,
  GIconPin,
  GIconCopy,
  GIconCheck,
  GIconRotateRight,
  GIconClose,
  GIconHeart,
  GIconFlame,
  GIconBug,
  GIconExternalLink,
  GIconPlus,
  GIconGithub,
} from "../icons/GravityIcons";
import { API_URL } from "../../lib/config";
import { getSocket } from "../../lib/socket";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";
import CustomDropdown from "../ui/CustomDropdown";

export type UpdateCategory = "feature" | "fix" | "bug";
export type UpdatePriority = "critical" | "high" | "medium" | "low";
export type UpdateStatus = "merged" | "open" | "closed";

export interface UpdateItem {
  id: string;
  prNumber: number;
  title: string;
  body: string;
  date: string;
  category: UpdateCategory;
  priority: UpdatePriority;
  status: UpdateStatus;
  author: string;
  authorAvatar?: string;
  branch?: string;
  url: string;
  pinned?: boolean;
}

export interface DetailedReaction {
  heart: number;
  fire: number;
  rocket: number;
  party: number;
  total: number;
}

const CATEGORY_META: Record<
  UpdateCategory,
  { label: string; Icon: React.ComponentType<any>; color: string; bg: string; border: string }
> = {
  feature: {
    label: "Feature",
    Icon: GIconPlus,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
  },
  fix: {
    label: "Fix",
    Icon: GIconWrench,
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
  },
  bug: {
    label: "Bug",
    Icon: GIconBug,
    color: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
  },
};

const PRIORITY_META: Record<
  UpdatePriority,
  { label: string; badgeClass: string; dotClass?: string }
> = {
  critical: {
    label: "Critical",
    badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20",
    dotClass: "bg-rose-400 animate-pulse",
  },
  high: {
    label: "High",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    dotClass: "bg-amber-400",
  },
  medium: {
    label: "Medium",
    badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    dotClass: "bg-sky-400",
  },
  low: {
    label: "Low",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dotClass: "bg-emerald-400",
  },
};

const STATUS_META: Record<UpdateStatus, { label: string; badgeClass: string }> = {
  merged: {
    label: "Merged",
    badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  },
  open: {
    label: "Open",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  },
  closed: {
    label: "Closed",
    badgeClass: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
  },
};

const REACTION_BUTTONS = [
  { type: "heart" as const, Icon: GIconHeart, label: "Love", color: "text-rose-400" },
  { type: "fire" as const, Icon: GIconFlame, label: "Fire", color: "text-amber-400" },
  { type: "rocket" as const, Icon: GIconRocket, label: "Shipped", color: "text-purple-400" },
  { type: "party" as const, Icon: GIconTrophy, label: "Celebrate", color: "text-emerald-400" },
];

// Fallback PR list representing real repository pull requests
const FALLBACK_UPDATES: UpdateItem[] = [
  {
    id: "pr-151",
    prNumber: 151,
    title: "Change the preview image for the project in Library",
    body: "Enhanced the Engineering Library with custom screenshot previews for Portfolio OS, Flash-Cards, and Quiz-App, alongside polished 'Currently in Development' frosted glassmorphism placeholders for upcoming works.",
    date: "2026-11-12",
    category: "feature",
    priority: "medium",
    status: "open",
    author: "Ememman",
    branch: "feat/library-preview-image",
    url: "https://github.com/Ememman/OS/pull/151",
    pinned: true,
  },
  {
    id: "pr-150",
    prNumber: 150,
    title: "Refactor code structure for improved readability and maintainability",
    body: "Comprehensive Activity Monitor overhaul: responsive mobile touch cards, dismissible compositor banner, 24-package client/server ecosystem registry, and interactive 43-endpoint API testing with latency tracking.",
    date: "2026-11-12",
    category: "fix",
    priority: "high",
    status: "open",
    author: "Ememman",
    branch: "fix/activity-monitor-enhancement",
    url: "https://github.com/Ememman/OS/pull/150",
    pinned: true,
  },
  {
    id: "pr-149",
    prNumber: 149,
    title: "Updated Main │ Remove the Dev in the Deployment for the Github Pages",
    body: "Merged production deployment isolation into main branch, eliminating non-production deployment triggers.",
    date: "2026-11-12",
    category: "fix",
    priority: "critical",
    status: "merged",
    author: "Ememman",
    branch: "dev",
    url: "https://github.com/Ememman/OS/pull/149",
  },
  {
    id: "pr-148",
    prNumber: 148,
    title: "Remove the Dev in the Deployment for the Github Pages",
    body: "Updated GitHub Actions deploy.yml workflow to restrict continuous deployment execution solely to the main branch.",
    date: "2026-11-12",
    category: "fix",
    priority: "critical",
    status: "merged",
    author: "Ememman",
    branch: "fix/remove-dev-in-the-deployment",
    url: "https://github.com/Ememman/OS/pull/148",
  },
  {
    id: "pr-147",
    prNumber: 147,
    title: "Fix the Layouts and Organize the templates in the Notes",
    body: "Resolved template dropdown z-index clipping bug, added clean responsive split-view editor, and improved typography.",
    date: "2026-11-12",
    category: "fix",
    priority: "high",
    status: "merged",
    author: "Ememman",
    branch: "fix/notes-layouts-templates",
    url: "https://github.com/Ememman/OS/pull/147",
  },
  {
    id: "pr-146",
    prNumber: 146,
    title: "Updated Main │ Organize the Terminal's layout in the mobile-view or it's reponsiveness",
    body: "Merged mobile terminal responsive layout improvements into the primary production branch.",
    date: "2026-11-12",
    category: "feature",
    priority: "medium",
    status: "merged",
    author: "Ememman",
    branch: "dev",
    url: "https://github.com/Ememman/OS/pull/146",
  },
  {
    id: "pr-145",
    prNumber: 145,
    title: "Organize the Terminal's layout in the mobile-view or it's reponsiveness",
    body: "Enhanced terminal shell responsiveness: horizontal touch quick-action pills, full viewport wrapping, and enhanced command execution.",
    date: "2026-11-12",
    category: "fix",
    priority: "high",
    status: "merged",
    author: "Ememman",
    branch: "fix/terminal-reponsiveness",
    url: "https://github.com/Ememman/OS/pull/145",
  },
  {
    id: "pr-144",
    prNumber: 144,
    title: "Updated Main │ Preview overlapping issue in the responsiveness",
    body: "Merged sandbox layout fixes preventing live preview container from breaking viewport boundaries.",
    date: "2026-11-12",
    category: "bug",
    priority: "high",
    status: "merged",
    author: "Ememman",
    branch: "dev",
    url: "https://github.com/Ememman/OS/pull/144",
  },
  {
    id: "pr-143",
    prNumber: 143,
    title: "Preview overlapping issue in the responsiveness",
    body: "Fixed CodePlay Sandbox preview iframe overflowing horizontal boundaries on mobile viewport and added word wrap to code editor.",
    date: "2026-11-12",
    category: "bug",
    priority: "high",
    status: "merged",
    author: "Ememman",
    branch: "fix/codeplay-preview-issue",
    url: "https://github.com/Ememman/OS/pull/143",
  },
  {
    id: "pr-142",
    prNumber: 142,
    title: "Updated Main │ Fix the overlapping issue in the mobile-responsiveness in CodePlay",
    body: "Resolved mobile view slider bugs in CodePlay by enforcing CSS touch constraints and eye preview icon.",
    date: "2026-11-12",
    category: "bug",
    priority: "high",
    status: "merged",
    author: "Ememman",
    branch: "dev",
    url: "https://github.com/Ememman/OS/pull/142",
  },
];

function parseGithubPR(pr: any): UpdateItem {
  const prNumber = pr.number;
  const id = `pr-${prNumber}`;
  const title = pr.title || `Pull Request #${prNumber}`;
  const author = pr.user?.login || "Ememman";
  const authorAvatar = pr.user?.avatar_url;
  const branch = pr.head?.ref || "main";
  const status: UpdateStatus = pr.merged_at ? "merged" : pr.state === "closed" ? "closed" : "open";
  const date = pr.created_at ? pr.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const url = pr.html_url || `https://github.com/Ememman/OS/pull/${prNumber}`;
  const rawBody = (pr.body || "").trim();
  const body = rawBody || `Pull Request #${prNumber} on Ememman/OS: ${title}. Branch: ${branch}`;

  const labelNames: string[] = Array.isArray(pr.labels)
    ? pr.labels.map((l: any) => (l.name || "").toLowerCase())
    : [];
  const textCorpus = `${title} ${rawBody} ${branch} ${labelNames.join(" ")}`.toLowerCase();

  let category: UpdateCategory = "feature";
  if (
    labelNames.some((l) => l.includes("bug")) ||
    /\b(bug|overlap|issue|broken|crash|error|leak|fail)\b/i.test(textCorpus)
  ) {
    category = "bug";
  } else if (
    labelNames.some((l) => l.includes("fix") || l.includes("patch")) ||
    /\b(fix|resolve|patch|repair|clean|correct|remove|refactor)\b/i.test(textCorpus)
  ) {
    category = "fix";
  } else {
    category = "feature";
  }

  let priority: UpdatePriority = "medium";
  if (
    labelNames.some((l) => l.includes("critical") || l.includes("p0") || l.includes("urgent")) ||
    /\b(critical|emergency|hotfix|security|fatal|deployment)\b/i.test(textCorpus)
  ) {
    priority = "critical";
  } else if (
    labelNames.some((l) => l.includes("high") || l.includes("p1")) ||
    category === "bug" ||
    /\b(high|urgent|alert|breaking|fail)\b/i.test(textCorpus)
  ) {
    priority = "high";
  } else if (
    labelNames.some((l) => l.includes("low") || l.includes("p3") || l.includes("minor")) ||
    /\b(low|minor|docs|chore|tweak|style|readme)\b/i.test(textCorpus)
  ) {
    priority = "low";
  } else {
    priority = "medium";
  }

  return {
    id,
    prNumber,
    title,
    body,
    date,
    category,
    priority,
    status,
    author,
    authorAvatar,
    branch,
    url,
    pinned: false,
  };
}

export default function Updates() {
  const { systemSounds, notify } = useOS();
  const [updates, setUpdates] = useState<UpdateItem[]>(FALLBACK_UPDATES);
  const [reactions, setReactions] = useState<Record<string, DetailedReaction>>({});
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activePriority, setActivePriority] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "oldest">("newest");

  // Local user reacted states (real-time toggle feedback)
  const [userReactions, setUserReactions] = useState<Record<string, Record<string, boolean>>>(() => {
    try {
      return JSON.parse(localStorage.getItem("os_updates_user_reactions") || "{}");
    } catch {
      return {};
    }
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch real-time updates directly from GitHub PR API and backend
  const fetchUpdates = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    else setLoading(true);

    try {
      // Fetch backend updates & reactions and live GitHub Pull Requests simultaneously
      const [uRes, rRes, ghRes] = await Promise.all([
        fetch(`${API_URL}/api/updates`).catch(() => null),
        fetch(`${API_URL}/api/updates/reactions`).catch(() => null),
        fetch("https://api.github.com/repos/Ememman/OS/pulls?state=all&per_page=30", {
          headers: { Accept: "application/vnd.github.v3+json" },
        }).catch(() => null),
      ]);

      const mergedMap = new Map<string, UpdateItem>();

      // Seed with fallback updates first
      FALLBACK_UPDATES.forEach((u) => mergedMap.set(u.id, u));

      // Merge backend updates if available
      if (uRes && uRes.ok) {
        const serverList = await uRes.json();
        if (Array.isArray(serverList)) {
          serverList.forEach((u: any) => {
            const formatted = u.prNumber ? u : parseGithubPR(u);
            mergedMap.set(formatted.id, formatted);
          });
        }
      }

      // Merge live GitHub PRs
      if (ghRes && ghRes.ok) {
        const ghPulls = await ghRes.json();
        if (Array.isArray(ghPulls)) {
          ghPulls.forEach((pr: any) => {
            const parsed = parseGithubPR(pr);
            mergedMap.set(parsed.id, parsed);
          });
        }
      }

      const list = Array.from(mergedMap.values());
      setUpdates(list);

      // Handle real-time reactions payload (starts clean, zero hardcoding)
      if (rRes && rRes.ok) {
        const rData = await rRes.json();
        if (rData.detailed) {
          setReactions(rData.detailed);
        } else if (rData.counts) {
          const norm: Record<string, DetailedReaction> = {};
          for (const [k, v] of Object.entries(rData.counts)) {
            norm[k] = { heart: Number(v), fire: 0, rocket: 0, party: 0, total: Number(v) };
          }
          setReactions(norm);
        }
      }
    } catch {
      // Graceful offline fallback
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  // Real-time WebSocket synchronization for reactions, pins, and updates
  useEffect(() => {
    const socket = getSocket();

    const onReacted = ({ id, type, count, reactions: detailed }: any) => {
      setReactions((prev) => ({
        ...prev,
        [id]: detailed || {
          ...(prev[id] || { heart: 0, fire: 0, rocket: 0, party: 0, total: 0 }),
          [type]: ((prev[id]?.[type as keyof DetailedReaction] as number) || 0) + 1,
          total: count || ((prev[id]?.total || 0) + 1),
        },
      }));
    };

    const onPinned = ({ id, pinned }: { id: string; pinned: boolean }) => {
      setUpdates((prev) => prev.map((u) => (u.id === id ? { ...u, pinned } : u)));
    };

    socket.on("update:reacted", onReacted);
    socket.on("update:pinned", onPinned);

    return () => {
      socket.off("update:reacted", onReacted);
      socket.off("update:pinned", onPinned);
    };
  }, []);

  // Multi-emoji reaction handler (100% real-time, zero hardcoding)
  const react = async (id: string, type: "heart" | "fire" | "rocket" | "party") => {
    if (systemSounds) soundFx.playClick();

    // Toggle user reaction state locally
    const alreadyReacted = Boolean(userReactions[id]?.[type]);
    const updatedUserReacts = {
      ...userReactions,
      [id]: {
        ...(userReactions[id] || {}),
        [type]: !alreadyReacted,
      },
    };
    setUserReactions(updatedUserReacts);
    try {
      localStorage.setItem("os_updates_user_reactions", JSON.stringify(updatedUserReacts));
    } catch {}

    // Optimistic UI update
    const delta = alreadyReacted ? -1 : 1;
    setReactions((prev) => {
      const cur = prev[id] || { heart: 0, fire: 0, rocket: 0, party: 0, total: 0 };
      const nextTypeVal = Math.max(0, cur[type] + delta);
      const nextTotal = Math.max(0, cur.total + delta);
      return {
        ...prev,
        [id]: {
          ...cur,
          [type]: nextTypeVal,
          total: nextTotal,
        },
      };
    });

    try {
      await fetch(`${API_URL}/api/updates/${id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, action: alreadyReacted ? "remove" : "add" }),
      });
    } catch {
      // Fail gracefully
    }
  };

  // Toggle pinned update
  const togglePin = async (id: string) => {
    if (systemSounds) soundFx.playClick();
    setUpdates((prev) =>
      prev.map((u) => (u.id === id ? { ...u, pinned: !u.pinned } : u))
    );
    try {
      await fetch(`${API_URL}/api/updates/${id}/pin`, { method: "POST" });
    } catch {}
  };

  // Copy PR changelog text to clipboard
  const copyUpdate = (item: UpdateItem) => {
    if (systemSounds) soundFx.playClick();
    const text = `[Portfolio OS PR #${item.prNumber} - ${item.title}]\nCategory: ${item.category.toUpperCase()} | Priority: ${item.priority.toUpperCase()} | Status: ${item.status.toUpperCase()}\n${item.date} by @${item.author}\n\n${item.body}\n\nLink: ${item.url}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    notify("Copied to Clipboard", `PR #${item.prNumber} copied to clipboard.`, "success");
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filter and sort updates
  const filteredUpdates = useMemo(() => {
    let result = [...updates];

    // Category Filter
    if (activeCategory !== "all") {
      result = result.filter((u) => u.category === activeCategory);
    }

    // Priority Filter
    if (activePriority !== "all") {
      result = result.filter((u) => u.priority === activePriority);
    }

    // Status Filter
    if (activeStatus !== "all") {
      result = result.filter((u) => u.status === activeStatus);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.title.toLowerCase().includes(q) ||
          u.body.toLowerCase().includes(q) ||
          String(u.prNumber).includes(q) ||
          u.author.toLowerCase().includes(q) ||
          (u.branch && u.branch.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === "popular") {
      result.sort((a, b) => (reactions[b.id]?.total || 0) - (reactions[a.id]?.total || 0));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => (a.prNumber || 0) - (b.prNumber || 0));
    } else {
      // Default: pinned float to top, then newest PR # first
      result.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.prNumber || 0) - (a.prNumber || 0);
      });
    }

    return result;
  }, [updates, activeCategory, activePriority, activeStatus, searchQuery, sortBy, reactions]);

  // Summary Metrics
  const totalPRs = updates.length;
  const mergedPRs = updates.filter((u) => u.status === "merged").length;
  const openPRs = updates.filter((u) => u.status === "open").length;
  const totalReactionsCount = Object.values(reactions).reduce(
    (acc, curr) => acc + (curr?.total || 0),
    0
  );

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-white select-none overflow-hidden">
      {/* Top Header & Metrics Banner */}
      <div className="p-3.5 sm:p-5 border-b border-white/10 bg-[#0c0d14]/95 backdrop-blur-md space-y-3 shrink-0 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0">
              <GIconUpdates size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-base sm:text-lg font-bold tracking-tight">
                  System Updates & Pull Requests
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30 whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  Live PRs
                </span>
              </div>
              <p className="text-xs text-white/50">
                Direct changelog from GitHub pull requests on <code className="text-accent/80">Ememman/OS</code>.
              </p>
            </div>
          </div>

          {/* Metrics & Refresh */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/70">
              <span className="font-semibold text-white">{totalPRs}</span>
              <span className="text-white/40">Total</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-[11px] text-purple-300">
              <span className="font-semibold">{mergedPRs}</span>
              <span className="text-purple-300/70">Merged</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-300">
              <span className="font-semibold">{openPRs}</span>
              <span className="text-emerald-300/70">Open</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-[11px] text-rose-300">
              <GIconHeart size={11} className="text-rose-400 fill-rose-400" />
              <span className="font-semibold">{totalReactionsCount}</span>
            </div>

            <button
              onClick={() => fetchUpdates(true)}
              disabled={isRefreshing}
              title="Sync latest GitHub Pull Requests"
              className="p-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer disabled:opacity-50"
            >
              <GIconRotateRight size={14} className={isRefreshing ? "animate-spin text-accent" : ""} />
            </button>
          </div>
        </div>

        {/* Search & Multi-Filter Control Bar */}
        <div className="flex flex-col gap-2.5 pt-1">
          {/* Row 1: Search + Quick Category Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="focus-stroke flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 w-full sm:w-72 transition-all focus-within:border-[#0091ff] focus-within:ring-2 focus-within:ring-[#0091ff]/40 focus-within:shadow-[0_0_14px_rgba(0,145,255,0.28)]">
              <GIconSearch size={14} className="text-white/40 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PR title, #number, author, branch..."
                className="bg-transparent outline-none text-xs text-white placeholder:text-white/35 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-white/40 hover:text-white text-xs"
                >
                  <GIconClose size={12} />
                </button>
              )}
            </div>

            {/* Category Pills (Feature, Fix, Bug) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => {
                  setActiveCategory("all");
                  if (systemSounds) soundFx.playClick();
                }}
                className={`text-xs px-3 py-1 rounded-xl border transition cursor-pointer whitespace-nowrap ${
                  activeCategory === "all"
                    ? "bg-accent text-white border-accent shadow-sm shadow-accent/20 font-semibold"
                    : "border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                All Categories
              </button>
              {(["feature", "fix", "bug"] as UpdateCategory[]).map((cat) => {
                const meta = CATEGORY_META[cat];
                const isSelected = activeCategory === cat;
                const Icon = meta.Icon;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      if (systemSounds) soundFx.playClick();
                    }}
                    className={`text-xs px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? `${meta.bg} ${meta.color} ${meta.border} font-semibold shadow-sm`
                        : "border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon size={12} className={meta.color} />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Secondary Filters (Priority, Status, Sort) */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-0.5 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Priority Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-white/40">Priority:</span>
                <CustomDropdown
                  value={activePriority}
                  onChange={(val) => setActivePriority(val)}
                  options={[
                    { value: "all", label: "All Priorities" },
                    { value: "critical", label: "Critical", badge: "Critical", badgeColor: "bg-red-500/20 text-red-300 border-red-500/30" },
                    { value: "high", label: "High", badge: "High", badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
                    { value: "medium", label: "Medium", badge: "Medium", badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
                    { value: "low", label: "Low", badge: "Low", badgeColor: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
                  ]}
                  size="xs"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-white/40">Status:</span>
                <CustomDropdown
                  value={activeStatus}
                  onChange={(val) => setActiveStatus(val)}
                  options={[
                    { value: "all", label: "All Statuses" },
                    { value: "merged", label: "Merged", badge: "Merged", badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
                    { value: "open", label: "Open", badge: "Open", badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
                    { value: "closed", label: "Closed", badge: "Closed", badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
                  ]}
                  size="xs"
                />
              </div>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] text-white/40">Sort:</span>
              <CustomDropdown
                value={sortBy}
                onChange={(val) => setSortBy(val as any)}
                options={[
                  { value: "newest", label: "Newest PR First" },
                  { value: "popular", label: "Most Reacted" },
                  { value: "oldest", label: "Oldest PR First" },
                ]}
                align="right"
                size="xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PR Updates Feed List */}
      <div className="flex-1 overflow-y-auto thin-scroll p-3.5 sm:p-5 space-y-3.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40 space-y-2">
            <GIconRotateRight size={24} className="animate-spin text-accent" />
            <span className="text-xs">Fetching real-time Pull Requests from GitHub...</span>
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40 text-center space-y-2">
            <GIconSearch size={24} className="opacity-40" />
            <p className="text-sm font-medium">No pull requests match your active filters</p>
            <p className="text-xs text-white/30">
              Try resetting the category, priority, or search parameters.
            </p>
          </div>
        ) : (
          filteredUpdates.map((item) => {
            const catMeta = CATEGORY_META[item.category] || CATEGORY_META.feature;
            const priorityMeta = PRIORITY_META[item.priority] || PRIORITY_META.medium;
            const statusMeta = STATUS_META[item.status] || STATUS_META.merged;
            const CatIcon = catMeta.Icon;
            const prReactions = reactions[item.id] || { heart: 0, fire: 0, rocket: 0, party: 0, total: 0 };
            const userItemReacts = userReactions[item.id] || {};

            return (
              <div
                key={item.id}
                className={`rounded-2xl border bg-white/[0.03] backdrop-blur-sm p-4 sm:p-5 transition hover:border-white/20 flex flex-col justify-between space-y-3 relative group ${
                  item.pinned ? "border-accent/40 bg-accent/[0.03] shadow-md shadow-accent/5" : "border-white/10"
                }`}
              >
                {/* Top Badge Strip: PR Number, Status, Category, Priority, Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* PR Number Tag */}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-white/10 text-white hover:bg-accent/30 hover:text-white border border-white/15 transition flex items-center gap-1"
                      title="Open PR on GitHub"
                    >
                      <GIconGithub size={11} />
                      <span>#{item.prNumber}</span>
                    </a>

                    {/* PR Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>

                    {/* Category Badge (Feature, Fix, Bug) */}
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border flex items-center gap-1 ${catMeta.bg} ${catMeta.color} ${catMeta.border}`}
                    >
                      <CatIcon size={11} className={catMeta.color} />
                      <span>{catMeta.label}</span>
                    </span>

                    {/* Priority Badge (Critical, High, Medium, Low) */}
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border flex items-center gap-1.5 ${priorityMeta.badgeClass}`}
                    >
                      {priorityMeta.dotClass && (
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dotClass}`} />
                      )}
                      <span>{priorityMeta.label} Priority</span>
                    </span>
                  </div>

                  {/* Header Actions: Pin & External PR Link */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={() => togglePin(item.id)}
                      title={item.pinned ? "Unpin update" : "Pin update to top"}
                      className={`p-1.5 rounded-lg border transition cursor-pointer text-xs ${
                        item.pinned
                          ? "bg-accent/25 border-accent/40 text-accent"
                          : "border-white/10 text-white/40 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <GIconPin size={12} className={item.pinned ? "fill-accent" : ""} />
                    </button>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      title="View Pull Request on GitHub"
                      className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition text-xs"
                    >
                      <GIconExternalLink size={12} />
                    </a>
                  </div>
                </div>

                {/* PR Title & Changelog Description */}
                <div className="space-y-1.5">
                  <h3 className="font-display text-sm sm:text-base font-bold text-white group-hover:text-accent transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed font-sans">
                    {item.body}
                  </p>
                </div>

                {/* Author & Branch Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/50 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full overflow-hidden bg-white/10 shrink-0">
                      {item.authorAvatar ? (
                        <img src={item.authorAvatar} alt={item.author} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-accent/30 flex items-center justify-center text-[9px] text-accent">
                          {item.author.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-white/70">@{item.author}</span>
                    {item.branch && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-white/60">
                        {item.branch}
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-[10px] text-white/40">
                    {item.date}
                  </span>
                </div>

                {/* Real-time Reaction Bar & Copy Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {REACTION_BUTTONS.map(({ type, Icon, label, color }) => {
                      const count = prReactions[type] || 0;
                      const hasUserReacted = Boolean(userItemReacts[type]);

                      return (
                        <button
                          key={type}
                          onClick={() => react(item.id, type)}
                          title={`React with ${label}`}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs transition cursor-pointer ${
                            hasUserReacted
                              ? "bg-accent/25 border-accent/50 text-white font-semibold shadow-sm"
                              : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20"
                          }`}
                        >
                          <Icon size={12} className={hasUserReacted ? color : "text-white/50"} />
                          <span className="text-[11px]">{count > 0 ? count : ""}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={() => copyUpdate(item)}
                      title="Copy update changelog"
                      className="px-2.5 py-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === item.id ? (
                        <>
                          <GIconCheck size={12} className="text-emerald-400" />
                          <span className="text-emerald-300 text-[11px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <GIconCopy size={12} />
                          <span className="text-[11px]">Copy</span>
                        </>
                      )}
                    </button>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-xl bg-accent text-white font-medium hover:brightness-110 shadow-sm shadow-accent/20 transition text-xs flex items-center gap-1"
                    >
                      <span className="text-[11px]">View PR</span>
                      <GIconExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
