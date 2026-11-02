import { useState, useRef, useEffect, useMemo } from "react";
import { useOS } from "../store/useOS";
import { fallbackProjects } from "../data/projects";
import { fileTree } from "../data/files";
import {
  GIconSearch,
  GIconTerminal,
  GIconLibrary,
  GIconMusic,
  GIconUpdates,
  GIconChats,
  GIconGallery,
  GIconGames,
  GIconFiles,
  GIconSettings,
  GIconResume,
  GIconNotes,
  GIconCalculator,
  GIconActivity,
  GIconBookOpen,
  GIconCode,
  GIconLayoutCells,
  GIconSparkles,
  GIconSliders,
  GIconTrash,
  GIconClose,
  GIconChevronUp,
  GIconChevronDown,
} from "./icons/GravityIcons";

const APP_META = [
  { id: "terminal", title: "Terminal", desc: "Interactive command-line shell & system tools", icon: GIconTerminal, color: "#22c55e", category: "Applications" },
  { id: "notes", title: "Notes", desc: "Markdown scratchpad & document editor", icon: GIconNotes, color: "#f59e0b", category: "Applications" },
  { id: "calculator", title: "Calculator", desc: "Standard & arithmetic math calculator", icon: GIconCalculator, color: "#06b6d4", category: "Applications" },
  { id: "activity", title: "Activity Monitor", desc: "Real-time CPU/RAM metrics, process manager & ping test", icon: GIconActivity, color: "#10b981", category: "Applications" },
  { id: "guestbook", title: "Guestbook", desc: "Real-time social visitor ledger & greetings", icon: GIconBookOpen, color: "#8b5cf6", category: "Applications" },
  { id: "codeplay", title: "CodePlay Sandbox", desc: "Interactive developer code runner & algorithm testbench", icon: GIconCode, color: "#38bdf8", category: "Applications" },
  { id: "library", title: "Library", desc: "Case studies & portfolio projects", icon: GIconLibrary, color: "#5BB8B0", category: "Applications" },
  { id: "music", title: "Music", desc: "Lo-Fi, ambient beats & song search", icon: GIconMusic, color: "#D9678C", category: "Applications" },
  { id: "chats", title: "Chats", desc: "Comic-book styled live guest room", icon: GIconChats, color: "#8E7BE0", category: "Applications" },
  { id: "updates", title: "Updates", desc: "Live activity feed & announcements", icon: GIconUpdates, color: "#5FBF7C", category: "Applications" },
  { id: "games", title: "Games", desc: "Blast It! & 2048 puzzle games", icon: GIconGames, color: "#D98A4E", category: "Applications" },
  { id: "files", title: "Files", desc: "Virtual filesystem explorer & documents", icon: GIconFiles, color: "#E0B84E", category: "Applications" },
  { id: "gallery", title: "Gallery", desc: "Curated photography & work showcase", icon: GIconGallery, color: "#B8C25A", category: "Applications" },
  { id: "settings", title: "Settings", desc: "Theme, dock, wallpapers & preferences", icon: GIconSettings, color: "#8892A6", category: "Applications" },
  { id: "resume", title: "Resume", desc: "Full work experience & PDF download", icon: GIconResume, color: "#4B5A73", category: "Applications" },
];

export default function SpotlightSearch() {
  const {
    spotlightOpen,
    closeSpotlight,
    openApp,
    setOsMode,
    toggleMotion,
    toggleChatSound,
    toggleMissionControl,
    windows,
    closeWindow,
  } = useOS();

  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (spotlightOpen) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [spotlightOpen]);

  // System actions available in spotlight
  const ACTIONS = useMemo(
    () => [
      {
        id: "act-switch-win",
        title: "Switch to Windows 11 Fluent",
        desc: "Change desktop interface to Windows taskbar and start menu",
        icon: GIconSliders,
        color: "#0284c7",
        category: "Preferences",
        action: () => setOsMode("win"),
      },
      {
        id: "act-switch-mac",
        title: "Switch to macOS Sonoma Glass",
        desc: "Change desktop interface to top menu bar and floating dock",
        icon: GIconSliders,
        color: "#f43f5e",
        category: "Preferences",
        action: () => setOsMode("mac"),
      },
      {
        id: "act-toggle-motion",
        title: "Toggle Reduced Motion",
        desc: "Enable or disable smooth window animations & spring physics",
        icon: GIconSparkles,
        color: "#a855f7",
        category: "System",
        action: toggleMotion,
      },
      {
        id: "act-toggle-sound",
        title: "Toggle System & Chat Sounds",
        desc: "Mute or unmute procedural Web Audio sound effects",
        icon: GIconSparkles,
        color: "#eab308",
        category: "System",
        action: toggleChatSound,
      },      {
        id: "act-mission-control",
        title: "Mission Control / Task View",
        desc: "Show visual overview grid of all active windows (F3)",
        icon: GIconLayoutCells,
        color: "#38bdf8",
        category: "Window Management",
        action: toggleMissionControl,
      },

      {
        id: "act-close-all",
        title: "Close All Windows",
        desc: `Dismiss all ${windows.length} currently open application windows`,
        icon: GIconTrash,
        color: "#ef4444",
        category: "Window Management",
        action: () => windows.forEach((w) => closeWindow(w.id)),
      },
    ],
    [setOsMode, toggleMotion, toggleChatSound, windows, closeWindow]
  );

  // Filter items
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [...APP_META, ...ACTIONS];
    }

    const apps = APP_META.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.desc.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
    );

    const actions = ACTIONS.filter(
      (a) =>
        a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)
    );

    const projects = fallbackProjects
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .map((p) => ({
        id: `proj-${p.id}`,
        title: p.title,
        desc: `${p.category} (${p.year}) - ${p.summary}`,
        icon: GIconLibrary,
        color: "#5BB8B0",
        category: "Projects",
        action: () => openApp("library"),
      }));

    const files = fileTree.children
      .filter((f) => f.name.toLowerCase().includes(q))
      .map((f) => ({
        id: `file-${f.name}`,
        title: f.name,
        desc: f.type === "folder" ? "Directory folder" : "Text document / script",
        icon: GIconFiles,
        color: "#E0B84E",
        category: "Files",
        action: () => openApp("files"),
      }));

    return [...apps, ...actions, ...projects, ...files];
  }, [query, ACTIONS, openApp]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIdx((prev) => Math.min(prev, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIdx] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  const executeItem = (item: any) => {
    closeSpotlight();
    if (item.action) {
      item.action();
    } else if (item.id) {
      openApp(item.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIdx]) {
        executeItem(filtered[selectedIdx]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeSpotlight();
    }
  };

  if (!spotlightOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1500] bg-black/60 backdrop-blur-md flex items-start justify-center pt-[14vh] sm:pt-[18vh] px-4 animate-fade-in"
      onClick={closeSpotlight}
    >
      <div
        className="w-full max-w-xl glass rounded-2xl border border-white/15 shadow-2xl overflow-hidden flex flex-col origin-top"
        style={{ animation: "menuOpen 160ms cubic-bezier(.16,1,.3,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
          <GIconSearch size={18} className="text-white/40 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search applications, files, projects, settings (⌘K)..."
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder:text-white/40 outline-none font-sans"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline text-[10px] text-white/35 font-mono px-1.5 py-0.5 rounded border border-white/10">
              ESC
            </span>
            <button
              onClick={closeSpotlight}
              className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition"
            >
              <GIconClose size={14} />
            </button>
          </div>
        </div>

        {/* Search Results List */}
        <div ref={listRef} className="max-h-90 overflow-y-auto thin-scroll p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-xs">
              No results found for "{query}"
            </div>
          ) : (
            filtered.map((item: any, idx) => {
              const isSelected = idx === selectedIdx;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-accent text-white shadow-lg shadow-accent/20"
                      : "hover:bg-white/8 text-white/80"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
                      style={{
                        background: isSelected ? "rgba(255,255,255,0.2)" : `${item.color}25`,
                      }}
                    >
                      <Icon size={16} color={isSelected ? "#ffffff" : item.color} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold truncate leading-tight">
                        {item.title}
                      </div>
                      <div
                        className={`text-[11px] truncate leading-tight mt-0.5 ${
                          isSelected ? "text-white/80" : "text-white/45"
                        }`}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-white/40 border border-white/5"
                    }`}
                  >
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="px-4 py-2 border-t border-white/8 bg-black/20 flex items-center justify-between text-[11px] text-white/35">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-0.5">
              <GIconChevronUp size={11} />
              <GIconChevronDown size={11} />
              <span className="ml-0.5">Navigate</span>
            </span>
            <span>Enter to open</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Spotlight & Gravity UI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
