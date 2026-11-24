import { useState, useRef, useEffect } from "react";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";
import WeatherWidget from "../widgets/WeatherWidget";
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

  // Sticky Note internal state
  const [stickyNote, setStickyNote] = useState(() => {
    if (typeof window === "undefined") return "Ship Portfolio OS v2.5 with native Windows 11 widgets and adaptive taskbar!";
    return localStorage.getItem("portfolio_os_sticky_note") || "Ship Portfolio OS v2.5 with native Windows 11 widgets and adaptive taskbar!";
  });

  const handleStickyChange = (val: string) => {
    setStickyNote(val);
    try {
      localStorage.setItem("portfolio_os_sticky_note", val);
    } catch {}
  };

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
                      <span className="text-emerald-300 font-semibold">18%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full w-[18%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                      <span className="text-white/60">Memory (RAM)</span>
                      <span className="text-sky-300 font-semibold">4.8 GB / 16 GB</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-sky-400 rounded-full w-[30%]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-center font-mono text-[10px]">
                    <div className="p-1 rounded-lg bg-white/5">
                      <div className="text-white/40">Network Ping</div>
                      <div className="text-white/90 font-bold">22 ms</div>
                    </div>
                    <div className="p-1 rounded-lg bg-white/5">
                      <div className="text-white/40">Active Threads</div>
                      <div className="text-white/90 font-bold">142</div>
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
                  <span className="text-[10px] text-white/40 font-mono">November 2026</span>
                </div>

                <div className="space-y-2 my-auto">
                  {[
                    { time: "11:30 AM", title: "React 19 & Next.js Performance Review", tag: "Dev" },
                    { time: "02:00 PM", title: "Docker Microservices & Redis Cache", tag: "Ops" },
                    { time: "04:30 PM", title: "Portfolio OS Native Windows Enhancements", tag: "System" },
                  ].map((evt, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[9.5px] font-mono text-sky-400 shrink-0">{evt.time}</span>
                        <span className="text-[11px] text-white/90 truncate">{evt.title}</span>
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/70 shrink-0">
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
                  placeholder="Type a quick memo or checklist here..."
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
              {[
                {
                  title: "Portfolio OS 2.5: Native Windows 11 Widgets & Taskbar Alignments Released",
                  source: "James Mendoza Dev",
                  time: "10m ago",
                  tag: "Release",
                },
                {
                  title: "React 19 Server Components and Multi-Window Architecture Deep Dive",
                  source: "Engineering Log",
                  time: "1h ago",
                  tag: "Architecture",
                },
                {
                  title: "SandreaLee Salon Booking & Straive IMS Commercial Deployments Live",
                  source: "Enterprise",
                  time: "3h ago",
                  tag: "Commercial",
                },
                {
                  title: "Metro Manila Tech Radar: Next-Gen Full-Stack Ecosystem Innovations",
                  source: "Tech Journal",
                  time: "5h ago",
                  tag: "Insight",
                },
              ].map((news, i) => (
                <div
                  key={i}
                  onClick={() => {
                    if (systemSounds) soundFx.playClick();
                    openApp("updates");
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                      {news.tag}
                    </span>
                    <span className="text-[9px] text-white/40 font-mono">{news.time}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white/90 group-hover:text-white leading-snug line-clamp-2">
                    {news.title}
                  </h4>
                  <div className="mt-2 text-[9px] text-white/50 flex items-center justify-between">
                    <span>{news.source}</span>
                    <GIconArrowUpRight size={10} className="text-white/40 group-hover:text-white" />
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
