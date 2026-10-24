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
  GIconSparkles,
  GIconSliders,
  GIconTrash,
  GIconClose,
} from "./icons/GravityIcons";

const APP_META = [
  { id: "terminal", title: "Terminal", desc: "Interactive command-line shell & system tools", icon: GIconTerminal, color: "#22c55e", category: "Applications" },
  { id: "library", title: "Library", desc: "Case studies & portfolio projects", icon: GIconLibrary, color: "#5BB8B0", category: "Applications" },
  { id: "music", title: "Music", desc: "Lo-Fi, ambient beats & song search", icon: GIconMusic, color: "#D9678C", category: "Applications" },
  { id: "chats", title: "Chats", desc: "Comic-book styled live guest room", icon: GIconChats, color: "#8E7BE0", category: "Applications" },
  { id: "updates", title: "Updates", desc: "Live activity feed & announcements", icon: GIconUpdates, color: "#5FBF7C", category: "Applications" },
  { id: "games", title: "Games", desc: "Blast It! 8x8 block puzzle game", icon: GIconGames, color: "#D98A4E", category: "Applications" },
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
    windows,
    closeWindow,
  } = useOS();

  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (spotlightOpen) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [spotlightOpen]);

  // Build searchable items index
  const searchItems = useMemo(() => {
    const items = [];

    // 1. Apps
    APP_META.forEach((app) => {
      items.push({
        id: `app-${app.id}`,
        title: app.title,
        desc: app.desc,
        category: "Applications",
        icon: app.icon,
        color: app.color,
        action: () => openApp(app.id),
      });
    });

    // 2. Projects
    fallbackProjects.forEach((proj) => {
      items.push({
        id: `proj-${proj.id}`,
        title: proj.title,
        desc: `${proj.category} • ${proj.stack.join(", ")}`,
        category: "Projects",
        icon: GIconLibrary,
        color: "#5BB8B0",
        action: () => openApp("library"),
      });
    });

    // 3. Files
    fileTree.children.forEach((file) => {
      items.push({
        id: `file-${file.name}`,
        title: file.name,
        desc: file.type === "folder" ? "Virtual Folder" : file.type === "app-link" ? "App Shortcut" : "Document",
        category: "Files",
        icon: GIconFiles,
        color: "#E0B84E",
        action: () => {
          if (file.type === "app-link") {
            openApp(file.app);
          } else {
            openApp("files");
          }
        },
      });
    });

    // 4. Quick Actions
    items.push(
      {
        id: "act-win",
        title: "Switch to Windows 11 style",
        desc: "Taskbar with centered start menu & squared controls",
        category: "Actions",
        icon: GIconSliders,
        color: "#38bdf8",
        action: () => setOsMode("win"),
      },
      {
        id: "act-mac",
        title: "Switch to macOS style",
        desc: "Top menu bar, dock & traffic-light window controls",
        category: "Actions",
        icon: GIconSliders,
        color: "#a855f7",
        action: () => setOsMode("mac"),
      },
      {
        id: "act-term",
        title: "Launch Terminal Shell",
        desc: "Open CLI shell to inspect developer profile & stats",
        category: "Actions",
        icon: GIconTerminal,
        color: "#22c55e",
        action: () => openApp("terminal"),
      },
      {
        id: "act-motion",
        title: "Toggle Reduce Motion",
        desc: "Enable/disable UI animations for comfort",
        category: "Actions",
        icon: GIconSparkles,
        color: "#f59e0b",
        action: toggleMotion,
      },
      {
        id: "act-sound",
        title: "Toggle Chat Sound",
        desc: "Enable/disable real-time chat audio chirps",
        category: "Actions",
        icon: GIconSettings,
        color: "#ec4899",
        action: toggleChatSound,
      },
      {
        id: "act-closeall",
        title: "Close all open windows",
        desc: `Clear desktop (${windows.length} windows open)`,
        category: "Actions",
        icon: GIconTrash,
        color: "#ef4444",
        action: () => windows.forEach((w) => closeWindow(w.id)),
      }
    );

    return items;
  }, [openApp, setOsMode, toggleMotion, toggleChatSound, windows, closeWindow]);

  // Filter items
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default suggested list
      return searchItems.filter((i) => i.category === "Applications" || i.id === "act-term");
    }
    return searchItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [query, searchItems]);

  const executeItem = (item) => {
    closeSpotlight();
    item.action();
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => (prev > 0 ? prev - 1 : Math.max(0, filtered.length - 1)));
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
      onClick={closeSpotlight}
      className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-md flex items-start justify-center pt-[12vh] sm:pt-[15vh] px-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl glass rounded-2xl border border-white/15 shadow-2xl overflow-hidden flex flex-col origin-top"
        style={{ animation: "menuOpen 160ms cubic-bezier(.16,1,.3,1) both" }}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-white/5">
          <GIconSearch size={18} className="text-white/60 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search apps, projects, files, actions..."
            className="flex-1 bg-transparent text-sm sm:text-base text-white outline-none placeholder:text-white/35 font-light"
          />
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[10px] text-white/40 border border-white/15 rounded px-1.5 py-0.5">
              ESC
            </span>
            <button
              onClick={closeSpotlight}
              className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <GIconClose size={14} />
            </button>
          </div>
        </div>

        {/* Search Results List */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto thin-scroll p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-xs">
              No results found for "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
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
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
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
