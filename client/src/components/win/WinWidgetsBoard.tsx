import { useState, useRef, useEffect, useMemo } from "react";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";
import { API_URL } from "../../lib/config";
import WeatherWidget from "../widgets/WeatherWidget";
import { fallbackProjects } from "../../data/projects";
import { FALLBACK_UPDATES, type UpdateItem } from "../../data/updates";
import {
  GIconClose,
  GIconSearch,
  GIconSliders,
  GIconActivity,
  GIconBookOpen,
  GIconNotes,
  GIconPlus,
  GIconCheck,
  GIconArrowUpRight,
  GIconSparkles,
} from "../icons/GravityIcons";

const POP_ANIM = { animation: "menuOpen 160ms cubic-bezier(.16,1,.3,1) both" };

interface WinWidgetsBoardProps {
  onClose: () => void;
}

function formatRelativeOrDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return d.toLocaleDateString([], { month: "short", day: "numeric" });
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return `${Math.max(1, Math.floor(diffMs / 60000))}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function WinWidgetsBoard({ onClose }: WinWidgetsBoardProps) {
  const { openApp, systemSounds, openTaskbarSettingsModal } = useOS();
  const ref = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pinned" | "feed">("all");
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Widget visibility toggles with persistent localStorage
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return { weather: true, performance: true, calendar: true, note: true, news: true };
    try {
      const saved = localStorage.getItem("win_widgets_visibility");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { weather: true, performance: true, calendar: true, note: true, news: true };
  });

  const toggleWidget = (id: string) => {
    if (systemSounds) soundFx.playClick();
    const updated = { ...visibleWidgets, [id]: !visibleWidgets[id] };
    setVisibleWidgets(updated);
    try {
      localStorage.setItem("win_widgets_visibility", JSON.stringify(updated));
    } catch {}
  };

  // Sticky Note state with real local persistence and two-way sync with user notes
  const [stickyNote, setStickyNote] = useState(() => {
    if (typeof window === "undefined") return "";
    const saved = localStorage.getItem("portfolio_os_sticky_note");
    if (saved !== null) return saved;
    try {
      const notesData = localStorage.getItem("os_notes_data");
      if (notesData) {
        const parsed = JSON.parse(notesData);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.content) {
          return parsed[0].content.slice(0, 300);
        }
      }
    } catch {}
    return "";
  });

  const handleStickyChange = (val: string) => {
    setStickyNote(val);
    try {
      localStorage.setItem("portfolio_os_sticky_note", val);
    } catch {}
  };

  // 1. Real System Performance Telemetry
  const [perfData, setPerfData] = useState({
    cpuPercent: 12,
    usedRamGb: 4.2,
    totalRamGb: 16.0,
    ramPercent: 26,
    pingMs: 18,
    threads: 16,
  });

  useEffect(() => {
    let active = true;

    const sampleTelemetry = async () => {
      let ping = 18;
      try {
        const t0 = performance.now();
        const pingRes = await fetch(`${API_URL}/api/system/ping`, { cache: "no-store" });
        if (pingRes.ok) {
          ping = Math.max(1, Math.round(performance.now() - t0));
        }
      } catch {
        try {
          const t0 = performance.now();
          await fetch(window.location.origin, { method: "HEAD", cache: "no-store" });
          ping = Math.max(1, Math.round(performance.now() - t0));
        } catch {
          ping = 22;
        }
      }

      let cpu = 14;
      let usedRam = 4.5;
      let totalRam = 16.0;
      let ramUsagePct = 28;
      let threads = (navigator.hardwareConcurrency || 8) * 2;

      try {
        const [metricsRes, infoRes] = await Promise.all([
          fetch(`${API_URL}/api/system/metrics`).then((r) => (r.ok ? r.json() : null)),
          fetch(`${API_URL}/api/system/info`).then((r) => (r.ok ? r.json() : null)),
        ]);

        if (metricsRes?.current) {
          cpu = Math.round(metricsRes.current.cpuPercent || 14);
        }
        if (infoRes?.memory) {
          const usedMb = infoRes.memory.systemUsedMb || (infoRes.memory.systemTotalMb - infoRes.memory.systemFreeMb);
          const totalMb = infoRes.memory.systemTotalMb || 16384;
          usedRam = Math.round((usedMb / 1024) * 10) / 10;
          totalRam = Math.round((totalMb / 1024) * 10) / 10;
          ramUsagePct = Math.round(infoRes.memory.usagePercent || (usedMb / totalMb) * 100);
        }
        if (infoRes?.cpu?.cores) {
          threads = infoRes.cpu.cores * 2;
        }
      } catch {
        // Fallback to real browser performance API
        if (typeof window !== "undefined") {
          const mem = (performance as any).memory;
          const devMem = (navigator as any).deviceMemory || 16;
          totalRam = devMem;
          if (mem) {
            usedRam = Math.round((mem.usedJSHeapSize / 1024 / 1024 / 1024) * 10) / 10;
            ramUsagePct = Math.min(95, Math.max(5, Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100)));
          } else {
            usedRam = Math.round(devMem * 0.3 * 10) / 10;
            ramUsagePct = 30;
          }
        }
      }

      if (active) {
        setPerfData({
          cpuPercent: cpu,
          usedRamGb: usedRam,
          totalRamGb: totalRam,
          ramPercent: ramUsagePct,
          pingMs: ping,
          threads,
        });
      }
    };

    sampleTelemetry();
    const interval = setInterval(sampleTelemetry, 3500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Real Updates & Project Records
  const [liveUpdatesList, setLiveUpdatesList] = useState<UpdateItem[]>(FALLBACK_UPDATES);
  const [liveProjectsList, setLiveProjectsList] = useState(fallbackProjects);

  useEffect(() => {
    let active = true;

    // Fetch real updates
    fetch(`${API_URL}/api/updates`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setLiveUpdatesList(data);
        }
      })
      .catch(() => {});

    // Fetch real projects
    fetch(`${API_URL}/api/projects`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setLiveProjectsList(data);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // Upcoming Agenda derived from user notes (#todo or #work) + real repo milestones from /api/updates
  const agendaItems = useMemo(() => {
    const items: Array<{
      id: string;
      time: string;
      title: string;
      tag: string;
      type: "note" | "update";
      action: () => void;
    }> = [];

    // Check user notes first
    try {
      const notesData = localStorage.getItem("os_notes_data");
      if (notesData) {
        const parsed = JSON.parse(notesData);
        if (Array.isArray(parsed)) {
          const todoNotes = parsed.filter((n) => n?.tag === "todo" || n?.tag === "work");
          for (const n of todoNotes.slice(0, 2)) {
            items.push({
              id: `note-${n.id}`,
              time: "Task",
              title: n.title || n.content?.split("\n")[0] || "Untitled Note",
              tag: (n.tag || "Note").toUpperCase(),
              type: "note",
              action: () => {
                if (systemSounds) soundFx.playClick();
                openApp("notes");
                onClose();
              },
            });
          }
        }
      }
    } catch {}

    // Fill remaining slots with real updates / merged PR milestones
    const needed = 3 - items.length;
    if (needed > 0) {
      const updates = liveUpdatesList.slice(0, needed);
      for (const u of updates) {
        items.push({
          id: `update-${u.id}`,
          time: u.date ? formatRelativeOrDate(u.date) : `PR #${u.prNumber}`,
          title: u.title,
          tag: (u.category || "PR").toUpperCase(),
          type: "update",
          action: () => {
            if (systemSounds) soundFx.playClick();
            openApp("updates");
            onClose();
          },
        });
      }
    }

    return items;
  }, [liveUpdatesList, onClose, openApp, systemSounds]);

  // Real Top Stories & Releases derived from actual updates & real projects
  const feedStories = useMemo(() => {
    const stories: Array<{
      id: string;
      title: string;
      source: string;
      time: string;
      tag: string;
      action: () => void;
    }> = [];

    // Take top 2 real updates
    const updates = liveUpdatesList.slice(0, 2);
    for (const u of updates) {
      stories.push({
        id: `story-up-${u.id}`,
        title: u.title,
        source: `${u.author || "Ememman"} / OS`,
        time: u.date ? formatRelativeOrDate(u.date) : "Recent",
        tag: (u.category || "Release").toUpperCase(),
        action: () => {
          if (systemSounds) soundFx.playClick();
          openApp("updates");
          onClose();
        },
      });
    }

    // Take top 2 real projects
    const projects = liveProjectsList.slice(0, 2);
    for (const p of projects) {
      stories.push({
        id: `story-proj-${p.id}`,
        title: `${p.title} — ${p.summary || ""}`.trim(),
        source: "Engineering Library",
        time: p.year || "2026",
        tag: (p.categories?.[0] || p.category || "Project").toUpperCase(),
        action: () => {
          if (systemSounds) soundFx.playClick();
          openApp("library");
          onClose();
        },
      });
    }

    return stories;
  }, [liveUpdatesList, liveProjectsList, onClose, openApp, systemSounds]);

  // Dismiss on outside click or Escape
  useEffect(() => {
    const handleDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (ref.current && ref.current.contains(target)) return;
      if (target.closest("[data-weather-trigger]")) return;
      onClose();
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleDown);
    document.addEventListener("touchstart", handleDown, { passive: true });
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("touchstart", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Current live formatted date
  const now = new Date();
  const dateStr = now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (systemSounds) soundFx.playClick();
    try {
      localStorage.setItem("browser_initial_search", searchQuery.trim());
    } catch {}
    openApp("browser");
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-14 sm:bottom-16 left-2 sm:left-4 w-[calc(100vw-16px)] sm:w-[560px] md:w-[680px] max-h-[82vh] bg-[#0c101d]/98 sm:bg-[#0c101d]/95 backdrop-blur-3xl rounded-2xl border border-white/20 shadow-[0_24px_70px_rgba(0,0,0,0.88)] ring-1 ring-white/10 p-3.5 sm:p-5 z-[1200] flex flex-col select-none overflow-hidden origin-bottom-left"
      style={POP_ANIM}
    >
      {/* 1. Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-xs">
            J
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold text-white leading-tight">Widgets</span>
            <span className="text-[10px] text-white/50 leading-tight">{dateStr}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowAddMenu((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-medium transition cursor-pointer"
            title="Add or remove widgets"
          >
            <GIconPlus size={13} className="text-sky-400" />
            <span className="hidden xs:inline text-[11px]">Add widgets</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (systemSounds) soundFx.playClick();
              onClose();
              openTaskbarSettingsModal();
            }}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
            title="Taskbar & Widgets Settings"
          >
            <GIconSliders size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (systemSounds) soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
            title="Close widgets board"
          >
            <GIconClose size={13} />
          </button>
        </div>
      </div>

      {/* Add Widgets Popover Menu */}
      {showAddMenu && (
        <div className="mt-2.5 p-3 rounded-xl bg-black/70 border border-white/15 shadow-xl shrink-0 animate-fade-in">
          <div className="text-[11px] font-semibold text-white/80 uppercase tracking-wider mb-2">
            Customize Pinned Widgets
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: "weather", label: "Weather", desc: "Manila conditions" },
              { id: "performance", label: "Performance", desc: "Live CPU & RAM" },
              { id: "calendar", label: "Calendar", desc: "Today's agenda" },
              { id: "note", label: "Sticky Note", desc: "Scratchpad memo" },
              { id: "news", label: "News Feed", desc: "Project releases" },
            ].map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => toggleWidget(w.id)}
                className={`flex items-center justify-between p-2 rounded-lg border text-left transition cursor-pointer ${
                  visibleWidgets[w.id]
                    ? "bg-sky-500/20 border-sky-400/40 text-white"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                }`}
              >
                <div>
                  <div className="text-xs font-semibold leading-tight">{w.label}</div>
                  <div className="text-[9px] text-white/40">{w.desc}</div>
                </div>
                {visibleWidgets[w.id] && <GIconCheck size={14} className="text-sky-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Web Search Bar */}
      <form onSubmit={handleSearchSubmit} className="my-3 shrink-0">
        <div className="flex items-center gap-2.5 bg-black/60 rounded-xl px-3.5 h-10 border border-white/15 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/30 transition-all shadow-inner">
          <GIconSearch size={15} className="text-white/40 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the web with Bing or enter URL..."
            className="bg-transparent outline-none text-xs w-full text-white placeholder:text-white/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-white/40 hover:text-white text-xs cursor-pointer"
            >
              <GIconClose size={12} />
            </button>
          )}
        </div>
      </form>

      {/* 3. Category Filter Tabs */}
      <div className="flex items-center gap-1 mb-3 shrink-0">
        {[
          { id: "all", label: "All Widgets" },
          { id: "pinned", label: "My Pinned" },
          { id: "feed", label: "News Feed" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === t.id
                ? "bg-white/20 text-white shadow-sm"
                : "text-white/50 hover:text-white/90 hover:bg-white/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 4. Scrollable Widgets Grid */}
      <div className="overflow-y-auto thin-scroll flex-1 pr-1 overscroll-contain space-y-3.5">
        {(activeTab === "all" || activeTab === "pinned") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
            {/* Weather Widget Card */}
            {visibleWidgets.weather && (
              <div className="rounded-2xl overflow-hidden border border-white/15 shadow-md">
                <WeatherWidget />
              </div>
            )}

            {/* Performance / Task Manager Mini Widget */}
            {visibleWidgets.performance && (
              <div className="p-3.5 rounded-2xl bg-[#141b2d]/80 border border-white/15 shadow-md flex flex-col justify-between h-48">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <GIconActivity size={14} />
                    </div>
                    <span className="text-xs font-bold text-white">System Performance</span>
                  </div>
                  <button
                    onClick={() => {
                      if (systemSounds) soundFx.playClick();
                      openApp("activity");
                      onClose();
                    }}
                    className="text-[10px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Task Manager</span>
                    <GIconArrowUpRight size={10} />
                  </button>
                </div>

                <div className="space-y-2.5 my-1">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                      <span className="text-white/60">CPU Usage</span>
                      <span className="text-emerald-300 font-semibold">{perfData.cpuPercent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(3, perfData.cpuPercent))}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                      <span className="text-white/60">Memory (RAM)</span>
                      <span className="text-sky-300 font-semibold">
                        {perfData.usedRamGb} GB / {perfData.totalRamGb} GB
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-sky-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(3, perfData.ramPercent))}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-center font-mono text-[10px]">
                    <div className="p-1 rounded-lg bg-white/5">
                      <div className="text-white/40">Network Ping</div>
                      <div className="text-white/90 font-bold">{perfData.pingMs} ms</div>
                    </div>
                    <div className="p-1 rounded-lg bg-white/5">
                      <div className="text-white/40">Active Threads</div>
                      <div className="text-white/90 font-bold">{perfData.threads}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar & Agenda Widget */}
            {visibleWidgets.calendar && (
              <div className="p-3.5 rounded-2xl bg-[#141b2d]/80 border border-white/15 shadow-md flex flex-col justify-between h-48">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <GIconBookOpen size={14} />
                    </div>
                    <span className="text-xs font-bold text-white">Upcoming Agenda</span>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">
                    {now.toLocaleDateString([], { month: "short", year: "numeric" })}
                  </span>
                </div>

                <div className="space-y-2 my-auto">
                  {agendaItems.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={evt.action}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer group"
                      title="Click to inspect in system"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[9.5px] font-mono text-sky-400 shrink-0">{evt.time}</span>
                        <span className="text-[11px] text-white/90 truncate group-hover:text-white">{evt.title}</span>
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/70 group-hover:text-white shrink-0 ml-1.5">
                        {evt.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sticky Scratchpad Note Widget */}
            {visibleWidgets.note && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 shadow-md flex flex-col justify-between h-48">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center">
                      <GIconNotes size={14} />
                    </div>
                    <span className="text-xs font-bold text-amber-200">Quick Sticky Note</span>
                  </div>
                  <button
                    onClick={() => {
                      if (systemSounds) soundFx.playClick();
                      openApp("notes");
                      onClose();
                    }}
                    className="text-[10px] text-amber-300 hover:text-amber-200 font-medium flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Open Notes</span>
                    <GIconArrowUpRight size={10} />
                  </button>
                </div>

                <textarea
                  value={stickyNote}
                  onChange={(e) => handleStickyChange(e.target.value)}
                  placeholder="Type a quick note, checklist, or reminder here..."
                  className="w-full flex-1 my-2 bg-transparent resize-none outline-none text-xs text-amber-100 placeholder:text-amber-200/40 leading-relaxed thin-scroll font-sans"
                />

                <div className="flex items-center justify-between text-[9px] text-amber-300/60 font-mono pt-1 border-t border-amber-500/20">
                  <span>Auto-saved locally</span>
                  <span>{stickyNote.length} characters</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top News & Project Updates Feed */}
        {(activeTab === "all" || activeTab === "feed") && visibleWidgets.news && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <GIconSparkles size={14} className="text-sky-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Top Stories & Releases</span>
              </div>
              <button
                onClick={() => {
                  if (systemSounds) soundFx.playClick();
                  openApp("updates");
                  onClose();
                }}
                className="text-[10px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All Updates</span>
                <GIconArrowUpRight size={10} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {feedStories.map((story) => (
                <div
                  key={story.id}
                  onClick={story.action}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                      {story.tag}
                    </span>
                    <span className="text-[9px] text-white/40 font-mono">{story.time}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white/90 group-hover:text-white leading-snug line-clamp-2">
                    {story.title}
                  </h4>
                  <div className="mt-2 text-[9px] text-white/50 flex items-center justify-between">
                    <span className="truncate max-w-[180px]">{story.source}</span>
                    <GIconArrowUpRight size={10} className="text-white/40 group-hover:text-white shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
