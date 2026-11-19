import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GIconSafari,
  GIconChrome,
  GIconGlobe,
  GIconSearch,
  GIconLock,
  GIconClose,
  GIconPlus,
  GIconRotateRight,
  GIconChevronLeft,
  GIconChevronRight,
  GIconCopy,
  GIconCheck,
  GIconExternalLink,
  GIconShield,
  GIconFileText,
  GIconCode,
  GIconBriefcase,
  GIconGraduationCap,
  GIconTerminal,
  GIconClock,
  GIconCompass,
  GIconPin,
  GIconVolume,
  GIconVolumeMute,
  GIconLayoutColumns,
  GIconPalette,
  GIconPencil,
  GIconSliders,
  GIconMail,
  GIconPhone,
  GIconActivity,
  GIconStar,
  GIconDownload,
  GIconHistory,
  GIconTrash,
  GIconChevronUp,
  GIconChevronDown,
  GIconPrinter,
  GIconUpload,
} from "../icons/GravityIcons";
import {
  SEARCH_INDEX,
  DEVELOPER_KNOWLEDGE_PANEL,
  SYSTEM_KNOWLEDGE_PANEL,
  BROWSER_FAVORITES,
  DEFAULT_EXPLORE_TOPICS,
  AUTOCOMPLETE_KEYWORDS,
} from "../../data/browserKnowledge";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";
import { API_URL } from "../../lib/config";

interface Tab {
  id: string;
  title: string;
  url: string;
  history: string[];
  historyIndex: number;
  isPinned?: boolean;
  isMuted?: boolean;
}

interface BrowserBookmark {
  id: string;
  title: string;
  url: string;
  color?: string;
  category?: string;
  createdAt: number;
}

const DEFAULT_BOOKMARKS: BrowserBookmark[] = [
  { id: "bm-about", title: "About Me", url: "https://mendoza.dev/about", color: "#38bdf8", category: "profile", createdAt: 1 },
  { id: "bm-experience", title: "Experience", url: "https://mendoza.dev/experience", color: "#10b981", category: "experience", createdAt: 2 },
  { id: "bm-skills", title: "Skills", url: "https://mendoza.dev/skills", color: "#8b5cf6", category: "skills", createdAt: 3 },
  { id: "bm-projects", title: "Projects", url: "https://mendoza.dev/projects", color: "#f59e0b", category: "projects", createdAt: 4 },
  { id: "bm-system", title: "System Info", url: "os://system-info", color: "#06b6d4", category: "system", createdAt: 5 },
  { id: "bm-shortcuts", title: "Shortcuts", url: "os://shortcuts", color: "#ec4899", category: "system", createdAt: 6 },
  { id: "bm-github", title: "GitHub (@Ememman)", url: "https://github.com/Ememman", color: "#64748b", category: "external", createdAt: 7 },
  { id: "bm-cv", title: "Curriculum Vitae", url: "mendoza.dev/cv.pdf", color: "#f43f5e", category: "profile", createdAt: 8 },
];

interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  visitedAt: number;
}

interface DownloadItem {
  id: string;
  filename: string;
  size: string;
  timestamp: string;
  status: "completed" | "downloading";
  url: string;
  category: "pdf" | "json" | "code" | "doc";
}

const ZOOM_LEVELS = [75, 90, 100, 110, 125, 150];

const UNRELATED_SEARCH_REGEX =
  /\b(nba|meme|billiard|billiards|gsw|warriors?|pelicans?|paul george|tachiyomi|lorem ipsum)\b/i;

function sanitizeRecentSearches(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && !UNRELATED_SEARCH_REGEX.test(item))
    .slice(0, 10);
}

type BrowserThemeId =
  | "default"
  | "cosmos"
  | "aurora"
  | "cyberpunk"
  | "amber"
  | "glass"
  | "minimal"
  | "tokyo"
  | "sonoma"
  | "bloom"
  | "chrome_prism"
  | "safari_nebula"
  | "apple_space"
  | "custom";

interface BrowserTheme {
  id: BrowserThemeId;
  name: string;
  preview: string;
  bgClass: string;
  accentColor: string;
  canvasOverlay?: string;
  badge?: string;
}

const BROWSER_THEMES: BrowserTheme[] = [
  {
    id: "default",
    name: "Modern Studio",
    preview: "linear-gradient(135deg, #0d121c, #141c2b, #1c273c)",
    bgClass: "bg-gradient-to-br from-[#0b1018] via-[#121926] to-[#1a2336]",
    accentColor: "#38bdf8",
    canvasOverlay: "radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.12), transparent 70%)",
    badge: "Gradient",
  },
  {
    id: "chrome_prism",
    name: "Chrome Prism",
    preview: "linear-gradient(135deg, #0b1329, #151838, #13274f)",
    bgClass: "bg-gradient-to-br from-[#0a1024] via-[#131733] to-[#122347]",
    accentColor: "#4285F4",
    canvasOverlay: "radial-gradient(ellipse at 80% 20%, rgba(66, 133, 244, 0.18), transparent 65%)",
    badge: "Chrome",
  },
  {
    id: "safari_nebula",
    name: "Safari Ventura",
    preview: "linear-gradient(135deg, #0b1526, #16243b, #253958)",
    bgClass: "bg-gradient-to-br from-[#091222] via-[#132035] to-[#20324e]",
    accentColor: "#60a5fa",
    canvasOverlay: "radial-gradient(circle at 30% 70%, rgba(96, 165, 250, 0.16), transparent 60%)",
    badge: "Safari",
  },
  {
    id: "apple_space",
    name: "Midnight Space",
    preview: "linear-gradient(135deg, #0d0f17, #181926, #261f38)",
    bgClass: "bg-gradient-to-br from-[#0a0c13] via-[#141520] to-[#201930]",
    accentColor: "#c084fc",
    canvasOverlay: "radial-gradient(ellipse at 70% 30%, rgba(192, 132, 252, 0.18), transparent 65%)",
    badge: "Universal",
  },
  {
    id: "cosmos",
    name: "Deep Cosmos",
    preview: "linear-gradient(135deg, #090b14, #151126, #25133d)",
    bgClass: "bg-gradient-to-br from-[#090b14] via-[#151126] to-[#25133d]",
    accentColor: "#c084fc",
    canvasOverlay: "radial-gradient(ellipse at 80% 20%, rgba(192, 132, 252, 0.15), transparent 60%)",
  },
  {
    id: "aurora",
    name: "Sunset Aurora",
    preview: "linear-gradient(135deg, #0c0d18, #22122b, #381226)",
    bgClass: "bg-gradient-to-br from-[#0c0d18] via-[#22122b] to-[#381226]",
    accentColor: "#f43f5e",
    canvasOverlay: "radial-gradient(ellipse at 20% 80%, rgba(244, 63, 94, 0.15), transparent 60%)",
  },
  {
    id: "cyberpunk",
    name: "Emerald Matrix",
    preview: "linear-gradient(135deg, #060d14, #081a18, #05261d)",
    bgClass: "bg-gradient-to-br from-[#060d14] via-[#081a18] to-[#05261d]",
    accentColor: "#10b981",
    canvasOverlay: "radial-gradient(ellipse at 50% 10%, rgba(16, 185, 129, 0.15), transparent 60%)",
  },
  {
    id: "amber",
    name: "Warm Twilight",
    preview: "linear-gradient(135deg, #140f0c, #24160e, #361c10)",
    bgClass: "bg-gradient-to-br from-[#140f0c] via-[#24160e] to-[#361c10]",
    accentColor: "#f59e0b",
    canvasOverlay: "radial-gradient(ellipse at 70% 70%, rgba(245, 158, 11, 0.15), transparent 60%)",
  },
  {
    id: "glass",
    name: "Frosted Glass",
    preview: "linear-gradient(135deg, #131722, #1a2030, #252e45)",
    bgClass: "bg-gradient-to-tr from-[#131722] via-[#1a2030] to-[#252e45]",
    accentColor: "#38bdf8",
    canvasOverlay: "radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.1), transparent 70%)",
  },
  {
    id: "tokyo",
    name: "Tokyo Twilight",
    preview: "linear-gradient(135deg, #180d28, #2e1045, #4a154b)",
    bgClass: "bg-gradient-to-br from-[#180d28] via-[#2e1045] to-[#4a154b]",
    accentColor: "#f472b6",
    canvasOverlay: "radial-gradient(ellipse at 80% 30%, rgba(244, 114, 182, 0.2), transparent 70%)",
    badge: "Vibrant",
  },
  {
    id: "sonoma",
    name: "macOS Sonoma",
    preview: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
    bgClass: "bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]",
    accentColor: "#38bdf8",
    canvasOverlay: "radial-gradient(circle at 30% 70%, rgba(56, 189, 248, 0.15), transparent 60%)",
    badge: "macOS",
  },
  {
    id: "bloom",
    name: "Windows Bloom",
    preview: "linear-gradient(135deg, #0d1b2a, #1b263b, #415a77)",
    bgClass: "bg-gradient-to-br from-[#0d1b2a] via-[#1b263b] to-[#415a77]",
    accentColor: "#60a5fa",
    canvasOverlay: "radial-gradient(circle at 70% 30%, rgba(96, 165, 250, 0.18), transparent 65%)",
    badge: "Win11",
  },
  {
    id: "minimal",
    name: "Pitch Black",
    preview: "#050608",
    bgClass: "bg-[#050608]",
    accentColor: "#e2e8f0",
  },
];

interface SuggestionEntry {
  type: "search" | "recent" | "keyword" | "site" | "explore";
  title: string;
  query: string;
  url?: string;
  subtitle?: string;
}

function HighlightedSuggestion({ text, query }: { text: string; query: string }) {
  const q = (query || "").toLowerCase().trim();
  if (!q) {
    return <span>{text}</span>;
  }
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);

  if (idx === -1) {
    return <span className="font-semibold text-white">{text}</span>;
  }

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);

  return (
    <span className="truncate">
      {before && <span className="font-bold text-white">{before}</span>}
      <span className="font-normal text-white/70">{match}</span>
      {after && <span className="font-bold text-white">{after}</span>}
    </span>
  );
}

interface SuggestionsDropdownProps {
  entries: SuggestionEntry[];
  currentQuery: string;
  isWin: boolean;
  selectedIndex: number;
  onSelect: (entry: SuggestionEntry) => void;
  onRemoveRecent: (query: string, e: React.MouseEvent) => void;
  onClearAllRecents: (e: React.MouseEvent) => void;
  embedded?: boolean;
}

function SuggestionsDropdown({
  entries,
  currentQuery,
  isWin,
  selectedIndex,
  onSelect,
  onRemoveRecent,
  onClearAllRecents,
  embedded = false,
}: SuggestionsDropdownProps) {
  if (entries.length === 0) {
    return null;
  }

  const containerClasses = embedded
    ? "p-1.5 sm:p-2 space-y-0.5 text-left select-none max-h-[260px] sm:max-h-[380px] overflow-y-auto thin-scroll"
    : "absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#181d29]/98 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-1.5 sm:p-2 space-y-0.5 text-left select-none max-h-[260px] sm:max-h-[380px] overflow-y-auto thin-scroll";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.99 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      className={containerClasses}
    >
      {entries.map((entry, idx) => {
        const isSelected = selectedIndex === idx;
        const isFirstRecent = entry.type === "recent" && (idx === 0 || entries[idx - 1]?.type !== "recent");
        const isFirstExplore = entry.type === "explore" && (idx === 0 || entries[idx - 1]?.type !== "explore");

        return (
          <div key={`${entry.type}-${entry.query}-${idx}`}>
            {isFirstRecent && (
              <div className="flex items-center justify-between px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] uppercase font-bold text-white/40 tracking-wider">
                <div className="flex items-center gap-1.5">
                  <GIconClock size={11} className="text-white/40" />
                  <span>Recent Searches</span>
                </div>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onClearAllRecents(e);
                  }}
                  className="hover:text-white transition cursor-pointer normal-case text-[10.5px] sm:text-[11px] font-normal text-white/40 hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}

            {isFirstExplore && (
              <div
                className={`flex items-center justify-between px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] uppercase font-bold tracking-wider ${
                  idx > 0 ? "border-t border-white/5 pt-2 mt-1" : ""
                } text-sky-400/80`}
              >
                <div className="flex items-center gap-1.5">
                  <GIconCompass size={12} className="text-sky-400" />
                  <span>Explore Portfolio OS & Developer</span>
                </div>
                <span className="text-[10px] text-white/30 normal-case font-normal">Suggested</span>
              </div>
            )}

            <div
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(entry);
              }}
              className={`group flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] transition-all cursor-pointer ${
                isSelected
                  ? "bg-white/15 text-white font-medium shadow-xs"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
                {/* Left icon per type */}
                <div className="w-5 flex items-center justify-center shrink-0">
                  {entry.type === "recent" ? (
                    <GIconClock size={13} className="text-white/40 group-hover:text-white/70" />
                  ) : entry.type === "explore" ? (
                    entry.subtitle === "system" ? (
                      <GIconTerminal size={13} className="text-emerald-400" />
                    ) : entry.subtitle === "skills" ? (
                      <GIconCode size={13} className="text-purple-400" />
                    ) : entry.subtitle === "experience" ? (
                      <GIconBriefcase size={13} className="text-amber-400" />
                    ) : entry.subtitle === "academics" ? (
                      <GIconGraduationCap size={13} className="text-indigo-400" />
                    ) : (
                      <GIconSearch size={13} className="text-sky-400" />
                    )
                  ) : entry.type === "site" ? (
                    entry.url?.includes("cv") || entry.url?.includes("pdf") ? (
                      <GIconFileText size={13} className="text-rose-400" />
                    ) : entry.url?.includes("os://") ? (
                      <GIconTerminal size={13} className="text-emerald-400" />
                    ) : (
                      <GIconGlobe size={13} className="text-sky-400" />
                    )
                  ) : (
                    <GIconSearch size={13} className="text-white/40 group-hover:text-white/70" />
                  )}
                </div>

                {/* Text content */}
                {entry.type === "search" ? (
                  <div className="flex items-center gap-1.5 truncate font-medium text-white">
                    <span>{entry.query}</span>
                    <span className="text-white/40 text-[11px] font-normal">
                      — {isWin ? "Google Search" : "Safari Search"}
                    </span>
                  </div>
                ) : entry.type === "keyword" || entry.type === "recent" ? (
                  <div className="truncate">
                    <HighlightedSuggestion text={entry.title} query={currentQuery} />
                  </div>
                ) : entry.type === "explore" ? (
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <span className="font-medium text-white truncate">{entry.title}</span>
                    {entry.subtitle && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/50 border border-white/5 capitalize shrink-0">
                        {entry.subtitle}
                      </span>
                    )}
                  </div>
                ) : (
                  /* Site entry */
                  <div className="flex items-center gap-1.5 truncate min-w-0">
                    <span className="font-medium text-white truncate">
                      <HighlightedSuggestion text={entry.title} query={currentQuery} />
                    </span>
                    {entry.subtitle && (
                      <>
                        <span className="text-white/30 shrink-0">—</span>
                        <span className="text-[11px] text-white/45 font-mono truncate shrink-0">
                          {entry.subtitle}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Remove item button for recent searches */}
              {entry.type === "recent" && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemoveRecent(entry.query, e);
                  }}
                  title="Remove from recent searches"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/15 rounded-md text-white/40 hover:text-white transition shrink-0 ml-2"
                >
                  <GIconClose size={11} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Footer helper (hidden on mobile touchscreens) */}
      <div className="hidden sm:flex items-center justify-between px-3 py-1 text-[10px] text-white/30 border-t border-white/5 pt-1.5 mt-1">
        <span>
          Press <kbd className="font-mono text-white/50">↑</kbd> <kbd className="font-mono text-white/50">↓</kbd> to navigate
        </span>
        <span>
          <kbd className="font-mono text-white/50">↵</kbd> to select
        </span>
      </div>
    </motion.div>
  );
}

const GoogleColorIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.31 7.31 24 12 24z"/>
    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.05 0 12c0 1.95.46 3.8 1.27 5.42l4.01-3.15z"/>
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
  </svg>
);

export default function Browser() {
  const { osMode, systemSounds, notify, openApp } = useOS();
  const isWin = osMode === "win";

  // Tab management
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "tab-1",
      title: isWin ? "New Tab" : "Start Page",
      url: isWin ? "google://home" : "safari://start",
      history: [isWin ? "google://home" : "safari://start"],
      historyIndex: 0,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("tab-1");

  // Active tab derived state
  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  );

  // Address bar input state
  const [inputUrl, setInputUrl] = useState<string>("");
  const [isOmniboxFocused, setIsOmniboxFocused] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  // Browser theme & appearance state (persisted across sessions)
  const [browserThemeId, setBrowserThemeId] = useState<BrowserThemeId>(() => {
    try {
      const saved = localStorage.getItem("browser_theme");
      if (saved && (saved === "custom" || BROWSER_THEMES.some((t) => t.id === saved))) {
        return saved as BrowserThemeId;
      }
    } catch {}
    return "default";
  });
  const [showCustomizeModal, setShowCustomizeModal] = useState<boolean>(false);
  const [showFavoritesWidget, setShowFavoritesWidget] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem("browser_show_favs");
      return s !== null ? JSON.parse(s) : true;
    } catch {
      return true;
    }
  });
  const [showPrivacyWidget, setShowPrivacyWidget] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem("browser_show_privacy");
      return s !== null ? JSON.parse(s) : true;
    } catch {
      return true;
    }
  });

  // Custom uploaded wallpaper (Data URL stored in localStorage)
  const [customWallpaper, setCustomWallpaper] = useState<string | null>(() => {
    try {
      return localStorage.getItem("browser_custom_wallpaper") || null;
    } catch {
      return null;
    }
  });

  // Wallpaper dimming overlay percentage (0% to 80%)
  const [wallpaperDim, setWallpaperDim] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("browser_wallpaper_dim");
      return saved !== null ? parseInt(saved, 10) : 30;
    } catch {
      return 30;
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const browserContainerRef = useRef<HTMLDivElement>(null);

  const activeTheme = useMemo(() => {
    if (browserThemeId === "custom" && customWallpaper) {
      return {
        id: "custom" as BrowserThemeId,
        name: "Custom Uploaded Wallpaper",
        preview: customWallpaper,
        bgClass: "bg-cover bg-center bg-no-repeat",
        accentColor: "#38bdf8",
        badge: "Custom",
      };
    }
    return BROWSER_THEMES.find((t) => t.id === browserThemeId) || BROWSER_THEMES[0];
  }, [browserThemeId, customWallpaper]);

  const handleSelectTheme = (themeId: BrowserThemeId) => {
    if (systemSounds) soundFx.playPop();
    setBrowserThemeId(themeId);
    try {
      localStorage.setItem("browser_theme", themeId);
    } catch {}
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("Invalid File", "Please select an image file (PNG, JPG, WEBP, GIF).", "error");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      notify("File Too Large", "Please select an image under 8MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      // Check size: if larger than 1.5MB, resize via canvas to fit neatly in localStorage
      if (result.length > 1.5 * 1024 * 1024) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 1920;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.85);
            setCustomWallpaper(compressed);
            setBrowserThemeId("custom");
            try {
              localStorage.setItem("browser_custom_wallpaper", compressed);
              localStorage.setItem("browser_theme", "custom");
            } catch {}
            if (systemSounds) soundFx.playPop();
            notify("Wallpaper Set", "Custom wallpaper uploaded & applied to browser.", "success");
          }
        };
        img.src = result;
      } else {
        setCustomWallpaper(result);
        setBrowserThemeId("custom");
        try {
          localStorage.setItem("browser_custom_wallpaper", result);
          localStorage.setItem("browser_theme", "custom");
        } catch {}
        if (systemSounds) soundFx.playPop();
        notify("Wallpaper Set", "Custom wallpaper uploaded & applied to browser.", "success");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveCustomWallpaper = () => {
    if (systemSounds) soundFx.playClose();
    setCustomWallpaper(null);
    try {
      localStorage.removeItem("browser_custom_wallpaper");
    } catch {}
    if (browserThemeId === "custom") {
      handleSelectTheme("default");
    }
    notify("Wallpaper Removed", "Reverted to default background theme.", "info");
  };

  const handleUpdateWallpaperDim = (newDim: number) => {
    setWallpaperDim(newDim);
    try {
      localStorage.setItem("browser_wallpaper_dim", newDim.toString());
    } catch {}
  };

  const handleToggleFavoritesWidget = () => {
    if (systemSounds) soundFx.playClick();
    setShowFavoritesWidget((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("browser_show_favs", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleTogglePrivacyWidget = () => {
    if (systemSounds) soundFx.playClick();
    setShowPrivacyWidget((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("browser_show_privacy", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Bookmarks state (with localStorage persistence)
  const [bookmarks, setBookmarks] = useState<BrowserBookmark[]>(() => {
    try {
      const saved = localStorage.getItem("browser_bookmarks_list");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_BOOKMARKS;
  });
  const [showBookmarksBar, setShowBookmarksBar] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("browser_show_bm_bar");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("browser_bookmarks_list", JSON.stringify(bookmarks));
    } catch {}
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem("browser_show_bm_bar", JSON.stringify(showBookmarksBar));
    } catch {}
  }, [showBookmarksBar]);

  // History Log state (with localStorage persistence)
  const [historyLog, setHistoryLog] = useState<HistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem("browser_history_entries");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: "hist-1", url: "https://mendoza.dev/about", title: "About Me — James Mendoza", visitedAt: Date.now() - 1000 * 60 * 15 },
      { id: "hist-2", url: "https://mendoza.dev/experience", title: "Experience — James Mendoza", visitedAt: Date.now() - 1000 * 60 * 60 },
      { id: "hist-3", url: "https://mendoza.dev/skills", title: "Technical Skills — James Mendoza", visitedAt: Date.now() - 1000 * 60 * 120 },
      { id: "hist-4", url: "os://system-info", title: "Portfolio OS Architecture", visitedAt: Date.now() - 1000 * 60 * 180 },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem("browser_history_entries", JSON.stringify(historyLog));
    } catch {}
  }, [historyLog]);

  // Zoom level state
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Find in page state
  const [showFindInPage, setShowFindInPage] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>("");
  const [findMatchIndex, setFindMatchIndex] = useState<number>(0);
  const findInputRef = useRef<HTMLInputElement>(null);

  // Browser Menu & Drawer state
  const [showBrowserMenu, setShowBrowserMenu] = useState<boolean>(false);
  const [activeDrawer, setActiveDrawer] = useState<"none" | "history" | "downloads" | "bookmarks">("none");
  const [historyFilter, setHistoryFilter] = useState<string>("");
  const browserMenuRef = useRef<HTMLDivElement>(null);

  // Downloads state
  const [downloads] = useState<DownloadItem[]>([
    {
      id: "dl-1",
      filename: "James_Emmanuel_Mendoza_CV.pdf",
      size: "184 KB",
      timestamp: "Today at 4:12 PM",
      status: "completed",
      url: "mendoza.dev/cv.pdf",
      category: "pdf",
    },
    {
      id: "dl-2",
      filename: "Portfolio_OS_Kernel_Telemetry.json",
      size: "42 KB",
      timestamp: "Today at 2:45 PM",
      status: "completed",
      url: "os://diagnostics",
      category: "json",
    },
    {
      id: "dl-3",
      filename: "Portfolio_OS_Shortcuts_Guide.txt",
      size: "14 KB",
      timestamp: "Yesterday",
      status: "completed",
      url: "os://shortcuts",
      category: "doc",
    },
  ]);

  // Close browser menu on outside click
  useEffect(() => {
    if (!showBrowserMenu) return;
    const handleDown = (e: MouseEvent) => {
      if (browserMenuRef.current && !browserMenuRef.current.contains(e.target as Node)) {
        setShowBrowserMenu(false);
      }
    };
    window.addEventListener("mousedown", handleDown);
    return () => window.removeEventListener("mousedown", handleDown);
  }, [showBrowserMenu]);

  // Check whether current active tab is bookmarked
  const isCurrentPageBookmarked = useMemo(() => {
    const norm = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const currentNorm = norm(activeTab.url);
    return bookmarks.some((b) => norm(b.url) === currentNorm);
  }, [bookmarks, activeTab.url]);

  const handleToggleBookmarkCurrent = () => {
    const norm = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const currentNorm = norm(activeTab.url);
    const existing = bookmarks.find((b) => norm(b.url) === currentNorm);

    if (existing) {
      if (systemSounds) soundFx.playClose();
      setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
      notify("Bookmark Removed", `Removed "${existing.title}" from bookmarks.`, "info", 1800);
    } else {
      if (systemSounds) soundFx.playPop();
      const newBm: BrowserBookmark = {
        id: `bm-${Date.now()}`,
        title: activeTab.title || formatTabTitle(activeTab.url),
        url: activeTab.url,
        color: activeTheme.accentColor || "#38bdf8",
        category: "custom",
        createdAt: Date.now(),
      };
      setBookmarks((prev) => [newBm, ...prev]);
      notify("Bookmark Added", `Saved "${newBm.title}" to your bookmarks bar.`, "success", 1800);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    if (systemSounds) soundFx.playClick();
    setZoomLevel((prev) => {
      const idx = ZOOM_LEVELS.indexOf(prev);
      if (idx !== -1 && idx < ZOOM_LEVELS.length - 1) return ZOOM_LEVELS[idx + 1];
      if (idx === -1) {
        const next = ZOOM_LEVELS.find((z) => z > prev);
        return next || prev;
      }
      return prev;
    });
  };

  const handleZoomOut = () => {
    if (systemSounds) soundFx.playClick();
    setZoomLevel((prev) => {
      const idx = ZOOM_LEVELS.indexOf(prev);
      if (idx !== -1 && idx > 0) return ZOOM_LEVELS[idx - 1];
      if (idx === -1) {
        const next = [...ZOOM_LEVELS].reverse().find((z) => z < prev);
        return next || prev;
      }
      return prev;
    });
  };

  const handleZoomReset = () => {
    if (systemSounds) soundFx.playClick();
    setZoomLevel(100);
  };

  // Find in page calculation
  const findMatchTotal = useMemo(() => {
    if (!findQuery.trim()) return 0;
    const q = findQuery.toLowerCase().trim();
    let textToSearch = `${activeTab.title} ${activeTab.url} `;
    const pageIndex = SEARCH_INDEX.find((item) => item.url === activeTab.url);
    if (pageIndex) {
      textToSearch += `${pageIndex.snippet} ${pageIndex.keywords.join(" ")} `;
    }
    DEVELOPER_KNOWLEDGE_PANEL.attributes.forEach((attr) => {
      textToSearch += `${attr.label} ${attr.value} `;
    });
    const matches = textToSearch.toLowerCase().split(q).length - 1;
    return Math.max(1, matches);
  }, [findQuery, activeTab.title, activeTab.url]);

  const handleFindNext = () => {
    if (findMatchTotal <= 0) return;
    if (systemSounds) soundFx.playClick();
    setFindMatchIndex((prev) => (prev + 1) % findMatchTotal);
  };

  const handleFindPrev = () => {
    if (findMatchTotal <= 0) return;
    if (systemSounds) soundFx.playClick();
    setFindMatchIndex((prev) => (prev <= 0 ? findMatchTotal - 1 : prev - 1));
  };

  const handlePrintPage = () => {
    if (systemSounds) soundFx.playPop();
    notify("Print Document", `Sent "${activeTab.title}" to print spooler.`, "info", 2000);
    window.print?.();
  };

  const handleDownloadFile = (item: DownloadItem) => {
    if (systemSounds) soundFx.playPop();
    if (item.url === "mendoza.dev/cv.pdf" || item.category === "pdf") {
      openApp("pdf-viewer");
      notify("Opening PDF", "Opening executive CV in PDF Viewer...", "info");
      return;
    }
    if (item.category === "json") {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(SYSTEM_KNOWLEDGE_PANEL, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", item.filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      notify("Downloaded", `Saved ${item.filename} to local storage.`, "success");
      return;
    }
    notify("Download Complete", `${item.filename} saved.`, "success");
  };

  // Interactive contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSent, setContactSent] = useState(false);

  // Live diagnostics benchmark state
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);
  const [benchmarkScore, setBenchmarkScore] = useState<number | null>(null);

  // Home search bar state
  const [homeSearchQuery, setHomeSearchQuery] = useState<string>("");
  const [isHomeSearchFocused, setIsHomeSearchFocused] = useState<boolean>(false);

  // Keyboard navigation for suggestions
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState<number>(-1);

  // Recent searches with localStorage persistence & automatic sanitization of unrelated terms
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("browser_recent_searches");
      if (saved) {
        const parsed = JSON.parse(saved);
        const cleaned = sanitizeRecentSearches(parsed);
        // Overwrite storage immediately with clean list to purge any legacy unrelated queries
        localStorage.setItem("browser_recent_searches", JSON.stringify(cleaned));
        return cleaned;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem("browser_recent_searches", JSON.stringify(recentSearches));
    } catch {}
  }, [recentSearches]);

  // Synchronize tabs and persona when switching between Windows (Google Chrome) and macOS (Safari)
  useEffect(() => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (isWin) {
          if (tab.url === "safari://start") {
            return {
              ...tab,
              url: "google://home",
              title: "New Tab",
              history: tab.history.map((h) => (h === "safari://start" ? "google://home" : h)),
            };
          }
          if (tab.url.startsWith("safari://search?q=")) {
            const newUrl = tab.url.replace("safari://search?q=", "google://search?q=");
            return {
              ...tab,
              url: newUrl,
              title: `${decodeURIComponent(newUrl.split("q=")[1] || "")} - Google Search`,
              history: tab.history.map((h) =>
                h.startsWith("safari://search?q=") ? h.replace("safari://search?q=", "google://search?q=") : h
              ),
            };
          }
        } else {
          if (tab.url === "google://home") {
            return {
              ...tab,
              url: "safari://start",
              title: "Start Page",
              history: tab.history.map((h) => (h === "google://home" ? "safari://start" : h)),
            };
          }
          if (tab.url.startsWith("google://search?q=")) {
            const newUrl = tab.url.replace("google://search?q=", "safari://search?q=");
            return {
              ...tab,
              url: newUrl,
              title: `${decodeURIComponent(newUrl.split("q=")[1] || "")} - Safari Search`,
              history: tab.history.map((h) =>
                h.startsWith("google://search?q=") ? h.replace("google://search?q=", "safari://search?q=") : h
              ),
            };
          }
        }
        return tab;
      })
    );
  }, [isWin]);

  // Search Results Page category filter
  const [searchCategory, setSearchCategory] = useState<string>("all");

  const omniboxRef = useRef<HTMLInputElement>(null);

  // Split View & Tab Context Menu states
  const [splitTabId, setSplitTabId] = useState<string | null>(null);
  const [tabContextMenu, setTabContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    tabId: string;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    tabId: "",
  });
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const openTabContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = browserContainerRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : e.clientX;
    const y = rect ? e.clientY - rect.top : e.clientY;
    setTabContextMenu({
      isOpen: true,
      x,
      y,
      tabId,
    });
  };

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!tabContextMenu.isOpen) return;
    const handleDown = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setTabContextMenu((prev) => ({ ...prev, isOpen: false }));
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTabContextMenu((prev) => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [tabContextMenu.isOpen]);

  const formatAddressDisplay = (url: string): string => {
    if (url === "safari://start" || url === "google://home") return "";
    if (url.startsWith("google://search?q=")) {
      const q = decodeURIComponent(url.split("q=")[1] || "");
      return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    }
    if (url.startsWith("safari://search?q=")) {
      const q = decodeURIComponent(url.split("q=")[1] || "");
      return `https://search.safari.com/?q=${encodeURIComponent(q)}`;
    }
    if (url === "os://system-info") return "portfolio-os://kernel/system-info";
    if (url === "os://shortcuts") return "portfolio-os://system/shortcuts";
    return url;
  };

  // Synchronize address input with active tab URL (clean display without showing raw internal scheme on start pages)
  useEffect(() => {
    if (!isOmniboxFocused) {
      setInputUrl(formatAddressDisplay(activeTab.url));
    }
  }, [activeTab.url, isOmniboxFocused]);

  const formatTabTitle = (url: string): string => {
    if (url === "safari://start") return "Start Page";
    if (url === "google://home") return "New Tab";
    if (url.startsWith("search://") || url.startsWith("google://search?q=") || url.startsWith("safari://search?q=")) {
      const q = decodeURIComponent(url.split("q=")[1] || "");
      return `${q} - ${isWin ? "Google Search" : "Safari Search"}`;
    }
    if (url.includes("mendoza.dev/experience")) return "Experience — James Mendoza";
    if (url.includes("mendoza.dev/skills")) return "Technical Skills — James Mendoza";
    if (url.includes("mendoza.dev/projects")) return "Projects — James Mendoza";
    if (url.includes("mendoza.dev/about")) return "About Me — James Mendoza";
    if (url.includes("mendoza.dev/cv.pdf") || url.includes("cv.pdf")) return "Curriculum Vitae — James Mendoza (PDF)";
    if (url.includes("mendoza.dev")) return "James Mendoza — Portfolio";
    if (url === "os://system-info") return "Portfolio OS Architecture";
    if (url === "os://shortcuts") return "Keyboard Shortcuts Directory";
    return url.replace(/^https?:\/\//, "");
  };

  // Navigate a specific tab to a URL (supports both active tab and split-view tabs)
  const navigateTabTo = (tabId: string, newUrl: string, title?: string) => {
    if (systemSounds) soundFx.playClick();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 220);

    const resolvedTitle = title || formatTabTitle(newUrl);

    // Append to browsing history if not internal start pages
    if (newUrl !== "safari://start" && newUrl !== "google://home") {
      setHistoryLog((prev) => {
        const filtered = prev.filter((h) => h.url !== newUrl);
        return [
          {
            id: `hist-${Date.now()}`,
            url: newUrl,
            title: resolvedTitle,
            visitedAt: Date.now(),
          },
          ...filtered,
        ].slice(0, 50);
      });
    }

    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== tabId) return tab;
        const newHistory = [...tab.history.slice(0, tab.historyIndex + 1), newUrl];
        return {
          ...tab,
          url: newUrl,
          title: resolvedTitle,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      })
    );
  };

  // Navigate active tab to a URL
  const navigateTo = (newUrl: string, title?: string) => {
    navigateTabTo(activeTabId, newUrl, title);
  };

  // History controls
  const canGoBack = activeTab.historyIndex > 0;
  const canGoForward = activeTab.historyIndex < activeTab.history.length - 1;

  const handleBack = () => {
    if (!canGoBack) return;
    if (systemSounds) soundFx.playClick();
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== activeTabId) return tab;
        const newIdx = tab.historyIndex - 1;
        const targetUrl = tab.history[newIdx];
        return {
          ...tab,
          url: targetUrl,
          title: formatTabTitle(targetUrl),
          historyIndex: newIdx,
        };
      })
    );
  };

  const handleForward = () => {
    if (!canGoForward) return;
    if (systemSounds) soundFx.playClick();
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== activeTabId) return tab;
        const newIdx = tab.historyIndex + 1;
        const targetUrl = tab.history[newIdx];
        return {
          ...tab,
          url: targetUrl,
          title: formatTabTitle(targetUrl),
          historyIndex: newIdx,
        };
      })
    );
  };

  const handleReload = () => {
    if (systemSounds) soundFx.playClick();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleHome = () => {
    const homeUrl = isWin ? "google://home" : "safari://start";
    navigateTo(homeUrl, isWin ? "Google" : "Start Page");
  };

  // Tab controls
  const handleNewTab = () => {
    if (systemSounds) soundFx.playClick();
    const newId = `tab-${Date.now()}`;
    const defaultUrl = isWin ? "google://home" : "safari://start";
    const newTab: Tab = {
      id: newId,
      title: isWin ? "New Tab" : "Start Page",
      url: defaultUrl,
      history: [defaultUrl],
      historyIndex: 0,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (idToClose: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (systemSounds) soundFx.playClose();
    if (splitTabId === idToClose) {
      setSplitTabId(null);
    }
    if (tabs.length === 1) {
      // If closing the only tab, reset to start page
      handleHome();
      return;
    }
    const idx = tabs.findIndex((t) => t.id === idToClose);
    const newTabs = tabs.filter((t) => t.id !== idToClose);
    setTabs(newTabs);
    if (activeTabId === idToClose) {
      const nextActive = newTabs[Math.max(0, idx - 1)] || newTabs[0];
      setActiveTabId(nextActive.id);
    }
  };

  // Additional tab actions for Chrome & Safari context menu
  const handleNewTabToRight = (targetTabId: string) => {
    if (systemSounds) soundFx.playClick();
    const idx = tabs.findIndex((t) => t.id === targetTabId);
    const newId = `tab-${Date.now()}`;
    const defaultUrl = isWin ? "google://home" : "safari://start";
    const newTab: Tab = {
      id: newId,
      title: isWin ? "New Tab" : "Start Page",
      url: defaultUrl,
      history: [defaultUrl],
      historyIndex: 0,
    };
    const nextTabs = [...tabs];
    nextTabs.splice(idx === -1 ? nextTabs.length : idx + 1, 0, newTab);
    setTabs(nextTabs);
    setActiveTabId(newId);
  };

  const handleDuplicateTab = (targetTabId: string) => {
    if (systemSounds) soundFx.playClick();
    const target = tabs.find((t) => t.id === targetTabId);
    if (!target) return;
    const idx = tabs.findIndex((t) => t.id === targetTabId);
    const newId = `tab-${Date.now()}`;
    const cloned: Tab = {
      id: newId,
      title: target.title,
      url: target.url,
      history: [...target.history],
      historyIndex: target.historyIndex,
      isPinned: false,
      isMuted: target.isMuted,
    };
    const nextTabs = [...tabs];
    nextTabs.splice(idx + 1, 0, cloned);
    setTabs(nextTabs);
    setActiveTabId(newId);
  };

  const handleTogglePinTab = (targetTabId: string) => {
    if (systemSounds) soundFx.playPop();
    setTabs((prev) =>
      prev.map((t) => (t.id === targetTabId ? { ...t, isPinned: !t.isPinned } : t))
    );
  };

  const handleToggleMuteTab = (targetTabId: string) => {
    if (systemSounds) soundFx.playPop();
    setTabs((prev) =>
      prev.map((t) => (t.id === targetTabId ? { ...t, isMuted: !t.isMuted } : t))
    );
  };

  const handleReloadTab = (targetTabId: string) => {
    if (targetTabId === activeTabId) {
      handleReload();
    } else {
      if (systemSounds) soundFx.playClick();
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 250);
    }
  };

  const handleToggleSplitView = (targetTabId: string) => {
    if (systemSounds) soundFx.playClick();
    if (splitTabId) {
      setSplitTabId(null);
    } else {
      if (tabs.length === 1) {
        // Create a new tab to split with
        const newId = `tab-${Date.now()}`;
        const defaultUrl = isWin ? "google://home" : "safari://start";
        const newTab: Tab = {
          id: newId,
          title: isWin ? "New Tab" : "Start Page",
          url: defaultUrl,
          history: [defaultUrl],
          historyIndex: 0,
        };
        setTabs((prev) => [...prev, newTab]);
        setSplitTabId(newId);
      } else if (targetTabId !== activeTabId) {
        setSplitTabId(targetTabId);
      } else {
        const otherTab = tabs.find((t) => t.id !== targetTabId);
        setSplitTabId(otherTab ? otherTab.id : targetTabId);
      }
    }
  };

  const handleCloseOtherTabs = (targetTabId: string) => {
    if (systemSounds) soundFx.playClose();
    const keep = tabs.filter((t) => t.id === targetTabId || t.isPinned);
    setTabs(keep.length > 0 ? keep : [tabs.find((t) => t.id === targetTabId)!]);
    setActiveTabId(targetTabId);
    if (splitTabId && splitTabId !== targetTabId) {
      setSplitTabId(null);
    }
  };

  const handleCloseTabsToRight = (targetTabId: string) => {
    if (systemSounds) soundFx.playClose();
    const idx = tabs.findIndex((t) => t.id === targetTabId);
    if (idx === -1) return;
    const newTabs = tabs.filter((t, i) => i <= idx || t.isPinned);
    setTabs(newTabs);
    if (!newTabs.some((t) => t.id === activeTabId)) {
      setActiveTabId(targetTabId);
    }
    if (splitTabId && !newTabs.some((t) => t.id === splitTabId)) {
      setSplitTabId(null);
    }
  };

  const handleCloseTabsToLeft = (targetTabId: string) => {
    if (systemSounds) soundFx.playClose();
    const idx = tabs.findIndex((t) => t.id === targetTabId);
    if (idx <= 0) return;
    const newTabs = tabs.filter((t, i) => i >= idx || t.isPinned);
    setTabs(newTabs);
    if (!newTabs.some((t) => t.id === activeTabId)) {
      setActiveTabId(targetTabId);
    }
    if (splitTabId && !newTabs.some((t) => t.id === splitTabId)) {
      setSplitTabId(null);
    }
  };

  const handleBookmarkTab = (targetTabId: string) => {
    const tab = tabs.find((t) => t.id === targetTabId);
    if (!tab) return;
    const already = bookmarks.some((b) => b.url === tab.url);
    if (already) {
      notify("Already Bookmarked", `"${tab.title}" is already in your bookmarks bar.`, "info");
      return;
    }
    const newBm: BrowserBookmark = {
      id: `bm-${Date.now()}`,
      title: tab.title,
      url: tab.url,
      category: "other",
      color: "#38bdf8",
      createdAt: Date.now(),
    };
    setBookmarks((prev) => [...prev, newBm]);
    if (systemSounds) soundFx.playPop();
    notify("Bookmark Saved", `Added "${tab.title}" to bookmarks bar.`, "success");
  };

  const handleCopyTabUrl = (targetTabId: string) => {
    const tab = tabs.find((t) => t.id === targetTabId);
    if (!tab) return;
    try {
      navigator.clipboard.writeText(tab.url);
      if (systemSounds) soundFx.playClick();
      notify("Link Copied", `Copied URL for "${tab.title}".`, "success");
    } catch {}
  };

  const handleMoveTabToNewWindow = (targetTabId: string) => {
    if (systemSounds) soundFx.playClick();
    openApp("browser");
    if (tabs.length > 1) {
      handleCloseTab(targetTabId);
    }
  };

  // Global Browser Keyboard Shortcuts (Ctrl/Cmd+W, Ctrl/Cmd+R, Ctrl/Cmd+T, Ctrl/Cmd+L, Ctrl/Cmd+D, Ctrl/Cmd+F, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowCustomizeModal(false);
        setShowFindInPage(false);
        setShowBrowserMenu(false);
        setActiveDrawer("none");
        setIsOmniboxFocused(false);
        setIsHomeSearchFocused(false);
      }
      const isMod = isWin ? e.ctrlKey : e.metaKey || e.ctrlKey;
      if (isMod && (e.key === "w" || e.key === "W")) {
        e.preventDefault();
        handleCloseTab(activeTabId);
      } else if (isMod && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        handleReload();
      } else if (isMod && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        handleNewTab();
      } else if (isMod && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        omniboxRef.current?.focus();
        omniboxRef.current?.select();
      } else if (isMod && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        handleToggleBookmarkCurrent();
      } else if (isMod && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        setShowFindInPage((prev) => !prev);
        setTimeout(() => findInputRef.current?.focus(), 50);
      } else if (isMod && e.shiftKey && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        setShowBookmarksBar((prev) => !prev);
      } else if (isMod && (e.key === "h" || e.key === "H" || (!isWin && (e.key === "y" || e.key === "Y")))) {
        e.preventDefault();
        setActiveDrawer((prev) => (prev === "history" ? "none" : "history"));
      } else if (isMod && (e.key === "j" || e.key === "J")) {
        e.preventDefault();
        setActiveDrawer((prev) => (prev === "downloads" ? "none" : "downloads"));
      } else if (isMod && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        handleZoomIn();
      } else if (isMod && e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      } else if (isMod && e.key === "0") {
        e.preventDefault();
        handleZoomReset();
      } else if (isMod && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        handlePrintPage();
      } else if (isMod && e.key >= "1" && e.key <= "8") {
        const targetIdx = parseInt(e.key, 10) - 1;
        if (targetIdx < tabs.length) {
          e.preventDefault();
          setActiveTabId(tabs[targetIdx].id);
        }
      } else if (isMod && e.key === "9") {
        if (tabs.length > 0) {
          e.preventDefault();
          setActiveTabId(tabs[tabs.length - 1].id);
        }
      } else if (e.key === "Tab" && isMod) {
        e.preventDefault();
        const currentIdx = tabs.findIndex((t) => t.id === activeTabId);
        if (currentIdx !== -1) {
          const nextIdx = e.shiftKey
            ? (currentIdx - 1 + tabs.length) % tabs.length
            : (currentIdx + 1) % tabs.length;
          setActiveTabId(tabs[nextIdx].id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const addRecentSearch = (query: string) => {
    const q = query.trim();
    if (!q || UNRELATED_SEARCH_REGEX.test(q)) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== q.toLowerCase() && !UNRELATED_SEARCH_REGEX.test(item)
      );
      return [q, ...filtered].slice(0, 10);
    });
  };

  const removeRecentSearch = (queryToRemove: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (systemSounds) soundFx.playClick();
    setRecentSearches((prev) =>
      prev.filter((q) => q.toLowerCase() !== queryToRemove.toLowerCase())
    );
  };

  const clearAllRecentSearches = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (systemSounds) soundFx.playClick();
    setRecentSearches([]);
  };

  const executeSearch = (rawQuery: string) => {
    const q = rawQuery.trim();
    if (!q) return;
    addRecentSearch(q);
    const searchUrl = isWin
      ? `google://search?q=${encodeURIComponent(q)}`
      : `safari://search?q=${encodeURIComponent(q)}`;
    navigateTo(searchUrl, `${q} - ${isWin ? "Google Search" : "Safari Search"}`);
    setIsOmniboxFocused(false);
    setIsHomeSearchFocused(false);
    setSelectedSuggestionIdx(-1);
  };

  // Address submission / Search
  const handleSubmitUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSuggestionIdx >= 0 && selectedSuggestionIdx < omniboxSuggestions.length) {
      handleSelectSuggestion(omniboxSuggestions[selectedSuggestionIdx]);
      return;
    }

    const raw = inputUrl.trim();
    if (!raw) return;

    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("os://")) {
      navigateTo(raw);
    } else if (raw.includes(".") && !raw.includes(" ")) {
      navigateTo(`https://${raw}`);
    } else {
      executeSearch(raw);
    }
    omniboxRef.current?.blur();
    setIsOmniboxFocused(false);
  };

  const handleSelectSuggestion = (entry: SuggestionEntry) => {
    if (entry.type === "site" && entry.url) {
      if (entry.url === "mendoza.dev/cv.pdf") {
        openApp("pdf-viewer");
      } else {
        navigateTo(entry.url, entry.title);
      }
      addRecentSearch(entry.title);
      setIsOmniboxFocused(false);
      setIsHomeSearchFocused(false);
      setSelectedSuggestionIdx(-1);
    } else {
      executeSearch(entry.query);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText(activeTab.url);
    setCopiedUrl(true);
    if (systemSounds) soundFx.playPop();
    notify("URL Copied", "Page URL copied to clipboard.", "info", 1800);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Unified suggestions builder (matches Google & Safari)
  const getSuggestions = useCallback(
    (rawQuery: string): SuggestionEntry[] => {
      const q = (rawQuery || "").trim().toLowerCase();
      const isStartOrEmpty =
        !q ||
        q === "safari://start" ||
        q === "google://home" ||
        q.startsWith("safari://") ||
        q.startsWith("google://");

      const validRecent = recentSearches.filter((r) => !UNRELATED_SEARCH_REGEX.test(r));

      if (isStartOrEmpty) {
        const entries: SuggestionEntry[] = [];

        // 1. If user has actual recent searches, show up to 5
        if (validRecent.length > 0) {
          validRecent.slice(0, 5).forEach((r) => {
            entries.push({
              type: "recent",
              title: r,
              query: r,
            });
          });
        }

        // 2. Default Explore topics featuring the most important info about developer & system
        const exploreCount = validRecent.length > 0 ? 4 : 8;
        DEFAULT_EXPLORE_TOPICS.slice(0, exploreCount).forEach((topic) => {
          entries.push({
            type: "explore",
            title: topic.title,
            query: topic.query,
            subtitle: topic.category,
          });
        });

        return entries;
      }

      const entries: SuggestionEntry[] = [];

      // 1. Direct Search suggestion (matches Google top row)
      entries.push({
        type: "search",
        title: `${rawQuery} - ${isWin ? "Google Search" : "Safari Search"}`,
        query: rawQuery,
      });

      // 2. Matching Recent Searches
      validRecent
        .filter((r) => r.toLowerCase().includes(q) && r.toLowerCase() !== q)
        .slice(0, 3)
        .forEach((r) => {
          entries.push({
            type: "recent",
            title: r,
            query: r,
          });
        });

      // 3. Keyword Completions
      const startsWith = AUTOCOMPLETE_KEYWORDS.filter((kw) =>
        kw.toLowerCase().startsWith(q)
      );
      const contains = AUTOCOMPLETE_KEYWORDS.filter(
        (kw) => !kw.toLowerCase().startsWith(q) && kw.toLowerCase().includes(q)
      );
      const matchedKeywords = [...startsWith, ...contains].filter(
        (kw) =>
          kw.toLowerCase() !== q &&
          !entries.some((e) => e.query.toLowerCase() === kw.toLowerCase())
      );

      matchedKeywords.slice(0, 5).forEach((kw) => {
        entries.push({
          type: "keyword",
          title: kw,
          query: kw,
        });
      });

      // 4. Matching Web Sites & Documentation
      const siteMatches = SEARCH_INDEX.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.url.toLowerCase().includes(q) ||
          item.displayUrl.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.includes(q))
      ).slice(0, 4);

      siteMatches.forEach((item) => {
        entries.push({
          type: "site",
          title: item.title,
          query: item.title,
          url: item.url,
          subtitle: item.displayUrl,
        });
      });

      return entries;
    },
    [recentSearches, isWin]
  );

  // Top omnibox suggestions
  const omniboxSuggestions = useMemo(() => {
    if (!isOmniboxFocused) return [];
    return getSuggestions(inputUrl);
  }, [isOmniboxFocused, inputUrl, getSuggestions]);

  // Home search bar suggestions
  const homeSuggestions = useMemo(() => {
    if (!isHomeSearchFocused) return [];
    return getSuggestions(homeSearchQuery);
  }, [isHomeSearchFocused, homeSearchQuery, getSuggestions]);

  // Filtered and ranked search results with multi-token relevance scoring
  const getScoredResults = useCallback((rawQ: string, category = "all") => {
    if (!rawQ) return [];
    const q = rawQ.toLowerCase().trim();
    const qTokens = q.split(/\s+/).filter(Boolean);

    const scored = SEARCH_INDEX.map((item) => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const snippetLower = item.snippet.toLowerCase();
      const urlLower = item.url.toLowerCase();

      // 1. Exact match bonuses
      if (titleLower === q) score += 200;
      else if (titleLower.includes(q)) score += 100;

      if (item.keywords.some((kw) => kw.toLowerCase() === q)) score += 160;
      else if (item.keywords.some((kw) => kw.toLowerCase().includes(q))) score += 80;

      // 2. Token matches
      let matchedTokensCount = 0;
      for (const token of qTokens) {
        let tokenScore = 0;
        if (titleLower.includes(token)) tokenScore += 40;
        if (item.keywords.some((kw) => kw.includes(token))) tokenScore += 35;
        if (urlLower.includes(token)) tokenScore += 20;
        if (snippetLower.includes(token)) tokenScore += 10;

        if (tokenScore > 0) {
          matchedTokensCount++;
          score += tokenScore;
        }
      }

      // Bonus if all tokens matched
      if (matchedTokensCount === qTokens.length && qTokens.length > 1) {
        score += 80;
      }

      return { item, score };
    });

    let list = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.item);

    if (category !== "all") {
      list = list.filter((item) => item.category === category);
    }

    return list;
  }, []);

  // Determine Knowledge Panel to show for search query
  const getKnowledgePanel = useCallback((rawQ: string) => {
    if (!rawQ) return null;
    const q = rawQ.toLowerCase();
    if (
      q.includes("james") ||
      q.includes("mendoza") ||
      q.includes("emman") ||
      q.includes("who") ||
      q.includes("developer") ||
      q.includes("contact") ||
      q.includes("dowinn") ||
      q.includes("straive") ||
      q.includes("college") ||
      q.includes("experience")
    ) {
      return DEVELOPER_KNOWLEDGE_PANEL;
    }
    if (
      q.includes("os") ||
      q.includes("system") ||
      q.includes("kernel") ||
      q.includes("shortcut") ||
      q.includes("architecture") ||
      q.includes("mac") ||
      q.includes("windows")
    ) {
      return SYSTEM_KNOWLEDGE_PANEL;
    }
    return DEVELOPER_KNOWLEDGE_PANEL;
  }, []);

  const splitTab = useMemo(
    () => (splitTabId ? tabs.find((t) => t.id === splitTabId) || null : null),
    [tabs, splitTabId]
  );

  const renderTabCanvas = (currentTab: Tab, isSplit = false) => {
    const isStartPage = currentTab.url === "safari://start" || currentTab.url === "google://home";
    const isSearchPage =
      currentTab.url.startsWith("google://search") || currentTab.url.startsWith("safari://search");
    const query = isSearchPage ? decodeURIComponent(currentTab.url.split("q=")[1] || "") : "";
    const results = isSearchPage ? getScoredResults(query, searchCategory) : [];
    const panel = isSearchPage ? getKnowledgePanel(query) : null;

    if (isStartPage) {
      return (
        <div
          className={`flex-1 flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full my-auto relative`}
        >
          {/* Ambient Lighting Overlay from Active Theme */}
          {activeTheme.canvasOverlay && (
            <div
              className="absolute inset-0 pointer-events-none rounded-3xl opacity-80"
              style={{ background: activeTheme.canvasOverlay }}
            />
          )}

          {/* Header Brand */}
          {isWin ? (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="flex flex-col items-center mb-4 sm:mb-6 space-y-1 sm:space-y-2"
            >
              <div className="text-3xl sm:text-5xl font-bold tracking-tight font-sans flex items-center select-none">
                <span className="text-[#4285F4]">G</span>
                <span className="text-[#EA4335]">o</span>
                <span className="text-[#FBBC05]">o</span>
                <span className="text-[#4285F4]">g</span>
                <span className="text-[#34A853]">l</span>
                <span className="text-[#EA4335]">e</span>
              </div>
              <p className="text-[11px] sm:text-xs text-white/50 text-center px-2">
                Search everything about James Mendoza & Portfolio OS
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="flex flex-col items-center mb-4 sm:mb-6 space-y-1 sm:space-y-2"
            >
              <motion.div
                whileHover={{ scale: 1.08, rotate: 6 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#0288d1] to-[#29b6f6] flex items-center justify-center shadow-lg shadow-sky-500/30 p-2 cursor-pointer"
              >
                <GIconSafari size={34} />
              </motion.div>
              <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">Safari Start Page</h1>
              <p className="text-[11px] sm:text-xs text-white/50 text-center px-2">
                Explore developer biography, tech stack, and OS kernel specs
              </p>
            </motion.div>
          )}

          {/* Central Search Bar */}
          {!isSplit ? (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.06, type: "spring", stiffness: 450, damping: 30 }}
              className={`relative w-full max-w-2xl mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl transition-[background-color,border-color,box-shadow] duration-150 ${
                isHomeSearchFocused && homeSuggestions.length > 0
                  ? "bg-[#181d29] border border-white/25 shadow-2xl backdrop-blur-xl ring-1 ring-white/10"
                  : "bg-white/[0.06] hover:bg-white/[0.09] border border-white/15 shadow-xl backdrop-blur-md"
              }`}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (selectedSuggestionIdx >= 0 && selectedSuggestionIdx < homeSuggestions.length) {
                    handleSelectSuggestion(homeSuggestions[selectedSuggestionIdx]);
                  } else {
                    executeSearch(homeSearchQuery);
                  }
                }}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3"
              >
                {isWin ? (
                  <span className="font-bold text-xs sm:text-sm text-white/90 select-none px-0.5">G</span>
                ) : (
                  <GIconSafari size={15} className="text-sky-400 shrink-0" />
                )}

                <input
                  type="text"
                  value={homeSearchQuery}
                  placeholder={
                    isWin ? "Search Google or type a URL..." : "Search Safari or enter keywords..."
                  }
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-white/35 outline-none font-sans"
                  onChange={(e) => {
                    setHomeSearchQuery(e.target.value);
                    setSelectedSuggestionIdx(-1);
                  }}
                  onFocus={() => {
                    setIsHomeSearchFocused(true);
                    setSelectedSuggestionIdx(-1);
                  }}
                  onBlur={() => setTimeout(() => setIsHomeSearchFocused(false), 220)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setSelectedSuggestionIdx((prev) =>
                        homeSuggestions.length > 0 ? (prev + 1) % homeSuggestions.length : -1
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setSelectedSuggestionIdx((prev) =>
                        homeSuggestions.length > 0
                          ? prev <= 0
                            ? homeSuggestions.length - 1
                            : prev - 1
                          : -1
                      );
                    } else if (e.key === "Enter") {
                      if (
                        selectedSuggestionIdx >= 0 &&
                        selectedSuggestionIdx < homeSuggestions.length
                      ) {
                        e.preventDefault();
                        handleSelectSuggestion(homeSuggestions[selectedSuggestionIdx]);
                      }
                    } else if (e.key === "Escape") {
                      setIsHomeSearchFocused(false);
                      setSelectedSuggestionIdx(-1);
                    }
                  }}
                />

                {homeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHomeSearchQuery("")}
                    className="text-white/40 hover:text-white p-1 shrink-0 cursor-pointer"
                    title="Clear query"
                  >
                    <GIconClose size={12} />
                  </button>
                )}

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  type="submit"
                  className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-accent text-accent-contrast text-[11px] sm:text-xs font-semibold hover:brightness-110 cursor-pointer transition shrink-0 shadow-sm"
                >
                  Search
                </motion.button>
              </form>

              {/* Suggestions embedded directly inside the same card with a clean divider */}
              <AnimatePresence>
                {isHomeSearchFocused && homeSuggestions.length > 0 && (
                  <div className="border-t border-white/10">
                    <SuggestionsDropdown
                      entries={homeSuggestions}
                      currentQuery={homeSearchQuery}
                      isWin={isWin}
                      selectedIndex={selectedSuggestionIdx}
                      onSelect={handleSelectSuggestion}
                      onRemoveRecent={removeRecentSearch}
                      onClearAllRecents={clearAllRecentSearches}
                      embedded={true}
                    />
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="w-full max-w-xl mb-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const inputEl = e.currentTarget.elements.namedItem("splitQuery") as HTMLInputElement;
                  if (inputEl?.value) {
                    executeSearch(inputEl.value);
                  }
                }}
                className="w-full bg-white/[0.06] hover:bg-white/[0.09] border border-white/15 rounded-2xl px-3 py-2 flex items-center gap-2.5 shadow-md"
              >
                <GIconSearch size={14} className="text-white/40 shrink-0" />
                <input
                  name="splitQuery"
                  type="text"
                  placeholder="Search in split view..."
                  className="w-full bg-transparent text-xs text-white placeholder:text-white/35 outline-none font-sans"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-xl bg-accent text-accent-contrast text-xs font-semibold shrink-0 cursor-pointer"
                >
                  Search
                </button>
              </form>
            </div>
          )}

          {/* Quick Favorites / Shortcuts Tiles Grid */}
          {showFavoritesWidget && (
            <div className="w-full max-w-2xl px-1 sm:px-2 my-2">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2.5 sm:mb-3 px-1">
                <span>{isWin ? "Shortcuts" : "Favorites"}</span>
                <span>{BROWSER_FAVORITES.length} portals</span>
              </div>

              <div
                className={`grid ${
                  isSplit ? "grid-cols-2 xs:grid-cols-4" : "grid-cols-4 sm:grid-cols-4"
                } gap-2 sm:gap-4 justify-items-center`}
              >
                {BROWSER_FAVORITES.map((fav, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.03, type: "spring", stiffness: 450, damping: 28 }}
                    whileHover={{ y: -3, scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onMouseEnter={() => setHoveredLink(fav.url)}
                    onMouseLeave={() => setHoveredLink(null)}
                    onClick={() => {
                      if (fav.url === "mendoza.dev/cv.pdf") {
                        openApp("pdf-viewer");
                      } else if (fav.url.startsWith("https://github") || fav.url.startsWith("https://linkedin")) {
                        window.open(fav.url, "_blank");
                      } else {
                        navigateTabTo(currentTab.id, fav.url, fav.title);
                      }
                    }}
                    className="group flex flex-col items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-2xl hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer text-center select-none w-full max-w-[80px] sm:max-w-[120px]"
                  >
                    <div
                      className={`${
                        isWin
                          ? "w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#242938] border border-white/10"
                          : "w-10 h-10 sm:w-13 sm:h-13 rounded-2xl"
                      } flex items-center justify-center shadow-lg transition-transform duration-150 group-hover:scale-105`}
                      style={
                        isWin
                          ? { borderColor: `${fav.color}40`, boxShadow: `0 4px 12px ${fav.color}15` }
                          : {
                              background: `linear-gradient(135deg, ${fav.color}28, ${fav.color}10)`,
                              border: `1px solid ${fav.color}45`,
                              boxShadow: `0 4px 12px ${fav.color}18`,
                            }
                      }
                    >
                      {fav.category === "profile" ? (
                        <GIconFileText size={17} style={{ color: fav.color }} />
                      ) : fav.category === "experience" ? (
                        <GIconBriefcase size={17} style={{ color: fav.color }} />
                      ) : fav.category === "skills" ? (
                        <GIconCode size={17} style={{ color: fav.color }} />
                      ) : fav.category === "projects" ? (
                        <GIconGlobe size={17} style={{ color: fav.color }} />
                      ) : fav.category === "system" ? (
                        <GIconTerminal size={17} style={{ color: fav.color }} />
                      ) : (
                        <GIconExternalLink size={17} style={{ color: fav.color }} />
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-white/85 group-hover:text-white truncate w-full text-center max-w-[70px] sm:max-w-[110px]">
                      {fav.title}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Report (Safari) / Google Safe Browsing (Chrome) */}
          {showPrivacyWidget && !isSplit && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, type: "spring", stiffness: 400, damping: 30 }}
              whileHover={{ scale: 1.01 }}
              className="mt-4 sm:mt-6 w-full max-w-2xl p-2.5 sm:p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-white/60"
            >
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <GIconShield size={16} className={isWin ? "text-[#34A853] shrink-0" : "text-emerald-400 shrink-0"} />
                <div className="min-w-0">
                  <span className="font-semibold text-white block text-[11px] sm:text-xs">
                    {isWin ? "Google Safe Browsing" : "Privacy Report"}
                  </span>
                  <p className="text-[10px] sm:text-[11px] text-white/45 truncate">
                    {isWin
                      ? "Standard protection is active across all browsing sessions."
                      : "Safari has blocked tracking attempts on your session."}
                  </p>
                </div>
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-medium shrink-0 ml-2">
                {isWin ? "Active & Safe" : "Protected"}
              </span>
            </motion.div>
          )}

          {/* Customize Appearance Button */}
          {!isSplit && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.94 }}
              onClick={(e) => {
                e.stopPropagation();
                if (systemSounds) soundFx.playPop();
                setShowCustomizeModal(true);
              }}
              className="mt-6 sm:mt-8 self-end flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-[11px] sm:text-xs text-white/90 hover:text-white transition shadow-xl cursor-pointer backdrop-blur-md z-20"
              title={isWin ? "Customize Google Chrome Appearance & Wallpaper" : "Customize Safari Start Page & Wallpaper"}
            >
              {isWin ? (
                <GIconPencil size={12} className="text-[#4285F4]" />
              ) : (
                <GIconSliders size={12} className="text-sky-400" />
              )}
              <span>{isWin ? "Customize Chrome" : "Customize Safari"}</span>
            </motion.button>
          )}
        </div>
      );
    }

    if (isSearchPage) {
      return (
        <div className={`flex-1 flex flex-col p-2.5 sm:p-6 max-w-5xl mx-auto w-full`}>
          {/* Top Filter Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 pb-2.5 sm:pb-3 border-b border-white/10 text-xs overflow-x-auto thin-scroll shrink-0">
            {[
              { id: "all", label: "All Results" },
              { id: "profile", label: "James Mendoza" },
              { id: "experience", label: "Experience" },
              { id: "skills", label: "Technical Skills" },
              { id: "projects", label: "Projects" },
              { id: "system", label: "System Architecture" },
              { id: "academics", label: "Academics" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSearchCategory(cat.id)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  searchCategory === cat.id
                    ? "bg-accent text-accent-contrast shadow-sm"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="py-2 text-[10.5px] sm:text-[11px] text-white/40">
            About {results.length} verified results for{" "}
            <span className="font-bold text-white/80">"{query}"</span>
          </div>

          <div className={`flex flex-col ${isSplit ? "gap-4" : "lg:grid lg:grid-cols-12 gap-5 lg:gap-6"} mt-1`}>
            {/* Left Column: Organic Results */}
            <div className={`${isSplit ? "space-y-4" : "lg:col-span-7 space-y-4 sm:space-y-5"}`}>
              {results.length === 0 ? (
                <div className="p-6 sm:p-8 text-center space-y-2 border border-white/10 rounded-2xl bg-white/[0.02]">
                  <GIconSearch size={28} className="mx-auto text-white/30" />
                  <p className="text-sm font-semibold text-white">No exact match found for "{query}"</p>
                  <p className="text-xs text-white/50">
                    Try searching for "James", "Dowinn", "Straive", "skills", "React", "PostgreSQL", or "shortcuts".
                  </p>
                </div>
              ) : (
                results.map((item) => (
                  <div
                    key={item.id}
                    className="group flex flex-col space-y-1 p-3 sm:p-3.5 rounded-xl hover:bg-white/[0.03] transition border border-transparent hover:border-white/5"
                  >
                    <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] text-emerald-400/90 font-mono">
                      <GIconGlobe size={11} className="text-white/40" />
                      <span className="truncate">{item.displayUrl}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-accent/20 text-accent font-sans font-semibold shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => {
                        if (item.url === "mendoza.dev/cv.pdf") openApp("pdf-viewer");
                        else navigateTabTo(currentTab.id, item.url, item.title);
                      }}
                      className="text-sm sm:text-base font-semibold text-sky-400 group-hover:text-sky-300 group-hover:underline cursor-pointer leading-snug"
                    >
                      {item.title}
                    </h3>

                    <p className="text-xs text-white/70 leading-relaxed font-sans">{item.snippet}</p>

                    {item.sitelinks && item.sitelinks.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 mt-1 border-t border-white/5">
                        {item.sitelinks.map((sl, slIdx) => (
                          <div
                            key={slIdx}
                            onClick={() => navigateTabTo(currentTab.id, sl.url, sl.title)}
                            className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer text-xs transition"
                          >
                            <span className="font-semibold text-sky-400 hover:underline block text-[11px]">
                              {sl.title}
                            </span>
                            {sl.snippet && (
                              <span className="text-[10px] text-white/45 truncate block">{sl.snippet}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Right Column: Knowledge Graph Panel (Top on mobile, right column on desktop) */}
            {panel && (
              <div className={`${isSplit ? "w-full" : "lg:col-span-5 order-first lg:order-last"} self-start`}>
                <div className="bg-[#151926] border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3.5 sm:space-y-4">
                  <div className="flex items-start gap-3 sm:gap-3.5">
                    {panel.id === "system" ? (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shrink-0">
                        <GIconTerminal size={20} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg shrink-0">
                        JM
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] uppercase font-bold text-accent tracking-wider">
                          Knowledge Graph
                        </span>
                        <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 font-semibold shrink-0">
                          <GIconCheck size={10} /> Verified
                        </span>
                      </div>
                      <h2 className="text-sm sm:text-lg font-bold text-white mt-0.5 leading-snug">
                        {panel.title}
                      </h2>
                      <p className="text-[11px] sm:text-xs text-white/50 truncate">{panel.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-xs text-white/75 leading-relaxed border-t border-white/5 pt-3">
                    {panel.description}
                  </p>

                  {/* Key Attributes Table */}
                  <div className="rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/10 divide-y divide-white/5 overflow-hidden text-xs">
                    {panel.attributes.map((attr, aIdx) => {
                      const isHonors = attr.label.toLowerCase().includes("honor");
                      const isEmail = attr.label.toLowerCase().includes("email");
                      const isPhone = attr.label.toLowerCase().includes("phone");
                      const isRole = attr.label.toLowerCase().includes("current role");

                      return (
                        <div key={aIdx} className="flex justify-between items-start gap-2.5 sm:gap-3 px-2.5 sm:px-3.5 py-2 sm:py-2.5 hover:bg-white/[0.02] transition-colors">
                          <span className="text-white/45 font-medium shrink-0 text-[10.5px] sm:text-[11px]">{attr.label}</span>
                          <span
                            className={`text-right text-[11px] sm:text-[11.5px] leading-snug break-words ${
                              isHonors
                                ? "text-amber-300 font-semibold"
                                : isRole
                                ? "text-emerald-400 font-semibold"
                                : "text-white/90 font-medium"
                            }`}
                          >
                            {isEmail ? (
                              <a
                                href={`mailto:${attr.value}`}
                                className="text-sky-400 hover:text-sky-300 hover:underline"
                                title="Send email"
                              >
                                {attr.value}
                              </a>
                            ) : isPhone ? (
                              <a
                                href={`tel:${attr.value.replace(/\s+/g, "")}`}
                                className="text-sky-400 hover:text-sky-300 hover:underline font-mono"
                                title="Call phone"
                              >
                                {attr.value}
                              </a>
                            ) : (
                              attr.value
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Core Stack & Expertise Tag Pills */}
                  {panel.tags && panel.tags.length > 0 && (
                    <div className="border-t border-white/10 pt-3 sm:pt-3.5 space-y-2">
                      <div className="flex items-center justify-between text-[10.5px] sm:text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                        <span>Core Tech & Key Expertise</span>
                        <span className="text-[10px] text-white/35 font-mono">{panel.tags.length} proficiencies</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {panel.tags.map((tag, tIdx) => {
                          const isFrontend = /react|next|typescript|full-stack|tanstack/i.test(tag);
                          const isBackend = /php|laravel|codeigniter|sql|postgres|mysql/i.test(tag);
                          const isHighlight = /magna|cum laude|playwright|award|research/i.test(tag);

                          const badgeStyle = isHighlight
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/25 hover:bg-amber-500/20"
                            : isFrontend
                            ? "bg-sky-500/10 text-sky-300 border-sky-500/25 hover:bg-sky-500/20"
                            : isBackend
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20"
                            : "bg-white/[0.04] text-white/75 border-white/10 hover:bg-white/[0.08]";

                          return (
                            <span
                              key={tIdx}
                              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg border text-[10px] sm:text-[10.5px] font-medium transition-all select-none ${badgeStyle}`}
                            >
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Knowledge Graph Verified Action Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 pt-3.5 border-t border-white/10 items-stretch">
                    {panel.links.map((link, lIdx) => {
                      let Icon = GIconExternalLink;
                      let mainLabel = link.label;
                      let subLabel = "";

                      if (link.url.includes("github")) {
                        Icon = GIconCode;
                        mainLabel = "GitHub";
                        subLabel = "@Ememman";
                      } else if (link.url.includes("linkedin")) {
                        Icon = GIconGlobe;
                        mainLabel = "LinkedIn";
                        subLabel = "Connect";
                      } else if (link.url.includes("cv") || link.url.includes("pdf")) {
                        Icon = GIconFileText;
                        mainLabel = "View CV";
                        subLabel = "PDF Resume";
                      } else if (link.url.includes("system-info")) {
                        Icon = GIconTerminal;
                        mainLabel = "Specs";
                        subLabel = "Architecture";
                      } else if (link.url.includes("shortcuts")) {
                        Icon = GIconCode;
                        mainLabel = "Shortcuts";
                        subLabel = "Directory";
                      } else if (link.url.includes("diagnostics")) {
                        Icon = GIconActivity;
                        mainLabel = "Telemetry";
                        subLabel = "Live Stream";
                      }

                      return (
                        <button
                          key={lIdx}
                          type="button"
                          onClick={() => {
                            if (link.url.startsWith("http")) window.open(link.url, "_blank");
                            else if (link.url.includes("pdf")) openApp("pdf-viewer");
                            else navigateTabTo(currentTab.id, link.url, link.label);
                          }}
                          title={`${link.label} (${link.url})`}
                          className="group relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl sm:rounded-2xl border transition-all duration-150 cursor-pointer select-none text-center h-full min-h-[50px] sm:min-h-[54px] bg-accent hover:brightness-110 active:scale-[0.98] text-accent-contrast border-accent/40 shadow-md shadow-accent/20"
                        >
                          <div className="flex items-center justify-center gap-1 font-semibold text-[11px] sm:text-xs leading-none w-full">
                            <Icon size={12} className="text-accent-contrast shrink-0" />
                            <span className="truncate">{mainLabel}</span>
                            <GIconExternalLink
                              size={9}
                              className="shrink-0 opacity-75 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                          {subLabel && (
                            <span className="text-[9.5px] sm:text-[10px] mt-1 font-mono leading-none truncate w-full opacity-85">
                              {subLabel}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // View 3: Virtual Simulated Webpages
    return (
      <div className={`flex-1 p-3 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-4 sm:space-y-6`}>
        {/* WEBPAGE 3A: ABOUT ME / PROFILE */}
        {(currentTab.url.includes("mendoza.dev/about") || currentTab.url === "https://mendoza.dev") && (
          <div className="space-y-4 sm:space-y-6">
            <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-white/[0.04] to-accent/10 border border-white/10 space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-[11px] sm:text-xs font-semibold">
                <GIconGraduationCap size={14} />
                <span>Magna Cum Laude · BSIT Graduate</span>
              </div>

              <h1 className="text-xl sm:text-4xl font-extrabold text-white tracking-tight">
                James Emmanuel E. Mendoza
              </h1>
              <p className="text-xs sm:text-base text-white/80 leading-relaxed font-sans max-w-2xl">
                Full-stack software developer based in Tondo, Manila. Crafting resilient enterprise front-end web apps with React 19, Next.js, and TypeScript, backed by robust PHP (Laravel, CodeIgniter, MVC) and real-time Socket.IO architectures.
              </p>

              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 pt-2">
                <button
                  onClick={() => openApp("pdf-viewer")}
                  className="flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-accent text-accent-contrast text-xs font-semibold hover:brightness-110 transition cursor-pointer shadow-md shadow-accent/20"
                >
                  <GIconFileText size={14} />
                  <span>View Curriculum Vitae (PDF)</span>
                </button>
                <button
                  onClick={() => navigateTabTo(currentTab.id, "https://mendoza.dev/experience", "Experience")}
                  className="flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition cursor-pointer"
                >
                  <GIconBriefcase size={14} />
                  <span>Work Experience</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Current Role</span>
                <div className="text-sm font-semibold text-white">Technical Support Engineer</div>
                <div className="text-xs text-white/60">Dowinn Group (Enterprise)</div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Education</span>
                <div className="text-sm font-semibold text-white">BS in Information Technology</div>
                <div className="text-xs text-white/60">National Teachers College (2022–2026)</div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Contact</span>
                <div className="text-sm font-semibold text-white">Tondo, Manila, PH</div>
                <div className="text-xs text-white/60">0992 543 3570</div>
              </div>
            </div>
          </div>
        )}

        {/* WEBPAGE 3B: WORK EXPERIENCE */}
        {currentTab.url.includes("mendoza.dev/experience") && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-white">Professional Experience</h1>
              <p className="text-xs text-white/50">Commercial software engineering and enterprise IT support milestones</p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h2 className="text-base font-bold text-white">Dowinn Group</h2>
                  <span className="text-xs text-accent font-semibold">Technical Support Engineer · Test Automation &amp; Front-End</span>
                </div>
                <span className="text-xs text-white/40 font-mono">Sept 28, 2026 – Present</span>
              </div>
              <ul className="space-y-1.5 text-xs text-white/75 list-disc pl-4 leading-relaxed">
                <li>Served as Technical Support Engineer, providing system diagnostics, infrastructure troubleshooting, and maintaining operational uptime.</li>
                <li>Automated cross-browser and mobile end-to-end testing pipelines using Playwright, Appium, and Cypress to eliminate regression escapes.</li>
                <li>Transitioned to active front-end engineering by the third week, building and coding operational portals and responsive interfaces with Next.js, React, and TypeScript.</li>
                <li>Implemented TanStack Query for advanced server-state caching, optimistic updates, and reduced network roundtrips.</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h2 className="text-base font-bold text-white">Straive</h2>
                  <span className="text-xs text-amber-400 font-semibold">IT Support Specialist & Web Developer (OJT)</span>
                </div>
                <span className="text-xs text-white/40 font-mono">Feb 02, 2026 – Mar 24, 2026</span>
              </div>
              <ul className="space-y-1.5 text-xs text-white/75 list-disc pl-4 leading-relaxed">
                <li>Resolved enterprise support issues: BIOS configuration, BitLocker recovery, RDP, Active Directory.</li>
                <li>Administered 1Kosmos MFA biometrics, WorkMate, Sentinel, and Netskope security tools.</li>
                <li>Engineered Straive IMS (Inventory Management System) in PHP (MVC) and MySQL with custom REST routing.</li>
              </ul>
            </div>
          </div>
        )}

        {/* WEBPAGE 3C: TECHNICAL SKILLS */}
        {currentTab.url.includes("mendoza.dev/skills") && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-white">Technical Skills & Tech Stack</h1>
              <p className="text-xs text-white/50">Comprehensive overview of development tools, frameworks, and databases</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <h3 className="text-xs font-bold text-accent uppercase tracking-wider">Frontend Frameworks</h3>
                <div className="flex flex-wrap gap-1.5">
                  {["React 19", "Next.js", "TypeScript", "Tailwind CSS v4", "shadcn/ui", "Framer Motion", "TanStack Query", "Zustand"].map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-white/80 font-medium">{s}</span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Backend & Systems</h3>
                <div className="flex flex-wrap gap-1.5">
                  {["PHP (Laravel)", "PHP (CodeIgniter)", "PHP (MVC)", "Node.js", "Express 5", "NestJS 12", "Socket.IO v4", "REST APIs"].map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-white/80 font-medium">{s}</span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Databases & Storage</h3>
                <div className="flex flex-wrap gap-1.5">
                  {["PostgreSQL", "MySQL", "MongoDB", "Prisma ORM", "Drizzle", "Redis", "SQLite"].map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-white/80 font-medium">{s}</span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Testing & Automation</h3>
                <div className="flex flex-wrap gap-1.5">
                  {["Playwright", "Selenium", "Appium", "Vitest", "Jest", "Git / GitHub", "Docker", "Postman"].map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-white/80 font-medium">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WEBPAGE 3C2: PROJECTS */}
        {currentTab.url.includes("mendoza.dev/projects") && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-white">Featured Engineering Projects</h1>
              <p className="text-xs text-white/50">Enterprise platforms, interactive web applications, and developer tools</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Portfolio OS (Current)",
                  desc: "Desktop simulation web operating system featuring window compositor, multi-tab Safari & Chrome, real-time Socket.IO sync, and dual macOS/Windows skins.",
                  tags: ["React 19", "TypeScript", "Tailwind CSS", "Socket.IO"],
                  color: "#38bdf8",
                },
                {
                  title: "Straive IMS (Inventory System)",
                  desc: "Enterprise IT inventory asset tracking portal with role-based access, device deployment auditing, and REST reporting.",
                  tags: ["PHP (MVC)", "MySQL", "REST APIs", "Tailwind CSS"],
                  color: "#10b981",
                },
                {
                  title: "Quiz Application & Timed Challenges",
                  desc: "Timed browser-based challenge platform with instant validation, 60-second countdown timer, live score tracking, and lifetime analytics.",
                  tags: ["React", "TypeScript", "Zustand", "Vite"],
                  color: "#f59e0b",
                },
                {
                  title: "Interactive Study Flashcards",
                  desc: "Adaptive spaced repetition card learning platform with categorical filtering, performance ratings, and progress metrics.",
                  tags: ["Next.js", "TypeScript", "Tailwind CSS"],
                  color: "#8b5cf6",
                },
              ].map((proj, pIdx) => (
                <div key={pIdx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2 hover:border-white/20 transition">
                  <h3 className="text-sm font-bold text-white flex items-center justify-between">
                    <span>{proj.title}</span>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.color }} />
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed">{proj.desc}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/60 font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WEBPAGE 3C3: CURRICULUM VITAE / PDF PREVIEW */}
        {(currentTab.url.includes("cv.pdf") || currentTab.url.includes("mendoza.dev/cv")) && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <GIconFileText size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">MendozaJamesEmmanuelCV.pdf</h2>
                  <p className="text-xs text-white/50">Executive Curriculum Vitae · Verified Developer Document</p>
                </div>
              </div>
              <button
                onClick={() => openApp("pdf-viewer")}
                className="px-3.5 py-1.5 rounded-xl bg-accent text-accent-contrast text-xs font-semibold hover:brightness-110 transition cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
              >
                <GIconExternalLink size={12} />
                <span>Open in PDF Viewer Window</span>
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-[#141824] border border-white/10 space-y-4 text-xs text-white/80 leading-relaxed font-sans max-w-2xl mx-auto shadow-xl">
              <div className="border-b border-white/10 pb-3">
                <h1 className="text-lg font-bold text-white">James Emmanuel E. Mendoza</h1>
                <p className="text-xs text-accent">Technical Support Engineer · Magna Cum Laude BSIT</p>
                <p className="text-[11px] text-white/45">Tondo, Manila · 0992 543 3570 · mendozajamesemmanuel@gmail.com</p>
              </div>

              <div>
                <h3 className="font-bold uppercase text-[10px] tracking-wider text-white/50 mb-1">Professional Experience</h3>
                <p className="font-semibold text-white">Dowinn Group — Technical Support Engineer (2026–Present)</p>
                <p className="text-white/70">Technical support, automated test suites with Playwright, Appium, and Cypress, and front-end development with Next.js, React, and TypeScript.</p>
              </div>

              <div className="border-t border-white/5 pt-3">
                <p className="font-semibold text-white">Straive — IT Support Specialist & Web Developer OJT (2026)</p>
                <p className="text-white/70">Engineered Straive IMS (Inventory Management System) in PHP (MVC) and MySQL. Administered BitLocker, 1Kosmos MFA, and Sentinel.</p>
              </div>
            </div>
          </div>
        )}

        {/* WEBPAGE 3D: PORTFOLIO OS ARCHITECTURE */}
        {currentTab.url === "os://system-info" && (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20">
              <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Kernel 3.2.0-LTS</span>
              <h1 className="text-2xl font-bold text-white mt-1">Portfolio OS Architecture</h1>
              <p className="text-xs text-white/70 mt-1">
                Interactive client-first desktop operating system engineered with React 19, TypeScript, and Socket.IO.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                <h3 className="text-xs font-bold text-white">Window Manager & Snap Assist</h3>
                <p className="text-xs text-white/60">
                  Hardware-accelerated window positioning, smooth spring animations with Framer Motion, snap assist layouts (left, right, fullscreen, split-screen), and minimize/maximize states.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                <h3 className="text-xs font-bold text-white">Dual Persona Desktop Modes</h3>
                <p className="text-xs text-white/60">
                  Supports seamless live switching between macOS mode (frosted glass top menu bar, dock, Mission Control F3) and Windows 11 mode (taskbar, centered Start menu, snap flyouts).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                <h3 className="text-xs font-bold text-white">Real-Time Event Synchronizer</h3>
                <p className="text-xs text-white/60">
                  Bidirectional WebSocket sync powered by Socket.IO v4, managing live chat rooms, guestbook ledger entries, virtual cloud filesystem events, and system telemetry diagnostics.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* WEBPAGE 3E: KEYBOARD SHORTCUTS */}
        {currentTab.url === "os://shortcuts" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-white">Keyboard Shortcuts Directory</h1>
              <p className="text-xs text-white/50">Master operating system navigation with global hotkeys</p>
            </div>

            <div className="divide-y divide-white/10 border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden">
              {[
                { key: "Cmd/Ctrl + K", action: "Spotlight Search", desc: "Open instant search to launch any app or file" },
                { key: "F3", action: "Mission Control", desc: "Exposé overview of all open windows" },
                { key: "Escape", action: "Close Overlays", desc: "Dismiss menus, spotlight, and active flyouts" },
                { key: "Ctrl + `", action: "Terminal Shell", desc: "Quick focus or open the Terminal app" },
                { key: "Drag to Edges", action: "Snap Assist", desc: "Snap window to left/right half or top fullscreen" },
              ].map((sc, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 text-xs">
                  <div>
                    <span className="font-semibold text-white block">{sc.action}</span>
                    <span className="text-[11px] text-white/45">{sc.desc}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 font-mono text-[11px] text-white font-semibold">
                    {sc.key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WEBPAGE 3F: CONTACT JAMES EMMANUEL MENDOZA */}
        {currentTab.url.includes("mendoza.dev/contact") && (
          <div className="space-y-4 sm:space-y-6">
            <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-white/[0.04] to-sky-500/10 border border-white/10 space-y-2.5 sm:space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] sm:text-xs font-semibold">
                <GIconMail size={13} />
                <span>Verified Direct Inquiries · Open for Contracting</span>
              </div>
              <h1 className="text-xl sm:text-4xl font-extrabold text-white tracking-tight">
                Contact James Emmanuel Mendoza
              </h1>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans max-w-2xl">
                Ready to collaborate on modern enterprise front-end engineering, React/Next.js architectures, or full-stack software solutions. Get in touch directly or dispatch a message below.
              </p>
            </div>

            {/* Direct Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-sky-400">
                  <GIconMail size={14} />
                  <span className="font-bold uppercase text-[10px] tracking-wider text-white/50">Email</span>
                </div>
                <div className="font-semibold text-white truncate">mendozajamesemmanuel@gmail.com</div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("mendozajamesemmanuel@gmail.com");
                    if (systemSounds) soundFx.playClick();
                    notify("Copied", "Email copied to clipboard.", "info");
                  }}
                  className="text-[11px] text-accent hover:underline pt-1 block cursor-pointer"
                >
                  Copy Email
                </button>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400">
                  <GIconPhone size={14} />
                  <span className="font-bold uppercase text-[10px] tracking-wider text-white/50">Phone / WhatsApp</span>
                </div>
                <div className="font-semibold text-white">0992 543 3570</div>
                <span className="text-[11px] text-white/40 block pt-1">Direct Mobile (Philippines)</span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-amber-400">
                  <GIconGlobe size={14} />
                  <span className="font-bold uppercase text-[10px] tracking-wider text-white/50">Location</span>
                </div>
                <div className="font-semibold text-white">Tondo, Manila, PH</div>
                <span className="text-[11px] text-white/40 block pt-1">Timezone: GMT+8 (PHT)</span>
              </div>
            </div>

            {/* Interactive Dispatcher Form */}
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-[#131724] border border-white/10 space-y-3.5 sm:space-y-4 shadow-xl">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <GIconMail size={16} className="text-accent" />
                <span>Quick Dispatch / Send Direct Inquiry</span>
              </h2>

              {contactSent ? (
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold block">Inquiry Dispatched Successfully!</span>
                    <span className="text-[11px] opacity-80">James Mendoza will respond to your provided contact information shortly.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setContactSent(false);
                      setContactMessage("");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-semibold cursor-pointer"
                  >
                    Send Another
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!contactName.trim() || !contactMessage.trim()) return;
                    if (systemSounds) soundFx.playPop();
                    setContactSent(true);
                    try {
                      await fetch(`${API_URL}/api/contact`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: contactName.trim(),
                          email: contactEmail.trim() || "visitor@portfolio-os.dev",
                          subject: "Browser Contact Form Inquiry",
                          message: contactMessage.trim(),
                        }),
                      });
                    } catch {}
                    notify("Message Dispatched", `Thanks ${contactName}, your message has been sent to James.`, "success");
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-white/60 block mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/60 block mb-1">Your Email or Handle *</label>
                      <input
                        type="text"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. alex@company.com"
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-white/60 block mb-1">Message / Project Details *</label>
                    <textarea
                      required
                      rows={3}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Describe your project, timeline, tech stack, or inquiry..."
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-accent resize-none font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-accent text-accent-contrast text-xs font-semibold hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md"
                  >
                    Dispatch Inquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* WEBPAGE 3G: ACADEMICS & HONORS */}
        {currentTab.url.includes("mendoza.dev/academics") && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-tr from-white/[0.04] to-accent/10 border border-white/10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs font-semibold">
                <GIconGraduationCap size={14} />
                <span>National Teachers College · Magna Cum Laude Honors</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Academic Background & Distinctions
              </h1>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans max-w-2xl">
                Graduated Magna Cum Laude with a Bachelor of Science in Information Technology (2022–2026). Conferred the prestigious "Best in Research" award for departmental capstone leadership.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <span className="text-[10px] text-accent font-bold uppercase tracking-wider">Academic Degree</span>
                <h3 className="text-base font-bold text-white">BS in Information Technology</h3>
                <p className="text-xs text-white/50">National Teachers College (2022–2026)</p>
                <div className="pt-2 text-xs text-white/75 space-y-1">
                  <div>• <strong>Honors</strong>: Conferred Magna Cum Laude</div>
                  <div>• <strong>Major</strong>: Software Development & Network Systems</div>
                  <div>• <strong>Academic Standing</strong>: Dean's Honor Roll</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Research Excellence</span>
                <h3 className="text-base font-bold text-white">Best in Research (SALON 2026)</h3>
                <p className="text-xs text-white/50">Conferred May 02, 2026</p>
                <p className="text-xs text-white/75 pt-2 leading-relaxed">
                  Recognized for lead full-stack software architecture and empirical evaluation in departmental research symposium.
                </p>
              </div>
            </div>

            {/* Certifications Box */}
            <div className="p-5 rounded-2xl bg-[#141824] border border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white">Verified Certifications</h3>
              <div className="divide-y divide-white/5">
                <div className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white block">SoloLearn Web Development Certification</span>
                    <span className="text-[11px] text-white/40">Credential ID: Issued January 30, 2025</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold text-[10px]">
                    Verified
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white block">SoloLearn HTML5 Specialist</span>
                    <span className="text-[11px] text-white/40">Credential ID: Issued November 01, 2023</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold text-[10px]">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WEBPAGE 3H: SYSTEM DIAGNOSTICS & TELEMETRY */}
        {currentTab.url.includes("os://diagnostics") && (
          <div className="space-y-6">
            <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-tr from-white/[0.04] to-emerald-500/10 border border-white/10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <GIconActivity size={13} />
                <span>Kernel 3.2.0-LTS · Live Diagnostic Stream</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Operating System Telemetry & Performance
              </h1>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans max-w-2xl">
                Real-time performance diagnostics measuring compositor framerates, memory allocation, and WebSocket roundtrip latency.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Roundtrip Ping</span>
                <div className="text-lg font-bold text-emerald-400 font-mono">18 ms</div>
                <span className="text-[10px] text-white/50">WebSocket live sync</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Renderer Engine</span>
                <div className="text-lg font-bold text-sky-400 font-mono">WebKit / Blink</div>
                <span className="text-[10px] text-white/50">Hardware Accelerated</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Compositor FPS</span>
                <div className="text-lg font-bold text-accent font-mono">60 FPS</div>
                <span className="text-[10px] text-white/50">Framer Motion Spring</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Active Tabs</span>
                <div className="text-lg font-bold text-amber-400 font-mono">{tabs.length} tabs</div>
                <span className="text-[10px] text-white/50">Isolated thread states</span>
              </div>
            </div>

            {/* In-Browser Benchmark Card */}
            <div className="p-5 rounded-2xl bg-[#141824] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Browser Core Benchmark</h3>
                  <p className="text-xs text-white/50">Run compute and rendering stress-test</p>
                </div>
                <button
                  type="button"
                  disabled={benchmarkRunning}
                  onClick={() => {
                    setBenchmarkRunning(true);
                    if (systemSounds) soundFx.playPop();
                    setTimeout(() => {
                      const score = Math.floor(9400 + Math.random() * 500);
                      setBenchmarkScore(score);
                      setBenchmarkRunning(false);
                      if (systemSounds) soundFx.playPop();
                      notify("Benchmark Complete", `Browser Core Score: ${score} pts`, "success");
                    }, 1200);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-accent text-accent-contrast text-xs font-semibold hover:brightness-110 disabled:opacity-50 cursor-pointer transition shadow-sm"
                >
                  {benchmarkRunning ? "Running Benchmark..." : "Run Benchmark"}
                </button>
              </div>

              {benchmarkScore && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                  <span className="text-white/80">Benchmark Result Score:</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">{benchmarkScore} Points (Optimal)</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => openApp("activity")}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition cursor-pointer flex items-center justify-center gap-2"
            >
              <GIconActivity size={14} className="text-emerald-400" />
              <span>Launch Full Activity Monitor Application</span>
            </button>
          </div>
        )}

        {/* WEBPAGE 3I: UNIVERSAL SMART ARTICLE / DOCUMENT VIEWER (HANDLES ALL SEARCH DESTINATIONS) */}
        {!currentTab.url.includes("mendoza.dev/about") &&
          currentTab.url !== "https://mendoza.dev" &&
          !currentTab.url.includes("mendoza.dev/experience") &&
          !currentTab.url.includes("mendoza.dev/skills") &&
          !currentTab.url.includes("mendoza.dev/projects") &&
          !currentTab.url.includes("cv.pdf") &&
          !currentTab.url.includes("mendoza.dev/cv") &&
          currentTab.url !== "os://system-info" &&
          currentTab.url !== "os://shortcuts" &&
          !currentTab.url.includes("mendoza.dev/contact") &&
          !currentTab.url.includes("mendoza.dev/academics") &&
          !currentTab.url.includes("os://diagnostics") && (() => {
            const matched = SEARCH_INDEX.find(
              (item) =>
                item.url === currentTab.url ||
                currentTab.url.startsWith(item.url) ||
                item.url.startsWith(currentTab.url) ||
                item.title.toLowerCase() === currentTab.title.toLowerCase()
            );

            const displayTitle = matched?.title || currentTab.title || "Webpage Document";
            const displaySnippet =
              matched?.snippet ||
              "Explore comprehensive developer insights, technical architecture, and system documentations verified across the Portfolio OS.";
            const displayUrl = matched?.displayUrl || currentTab.url;
            const category = matched?.category || "portal";

            return (
              <div className="space-y-6">
                {/* Article Header & Domain Verified Banner */}
                <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-tr from-white/[0.04] to-accent/10 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
                    <GIconGlobe size={13} className="text-white/40" />
                    <span className="truncate">{displayUrl}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-sans font-semibold text-[10px]">
                      Verified Source
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                    {displayTitle}
                  </h1>

                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans max-w-2xl">
                    {displaySnippet}
                  </p>

                  <div className="flex items-center gap-2.5 pt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const searchUrl = isWin ? "google://home" : "safari://start";
                        navigateTo(searchUrl);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <GIconSearch size={12} />
                      <span>Search Other Topics</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl()}
                      className="px-3.5 py-1.5 rounded-xl bg-accent text-accent-contrast text-xs font-semibold hover:brightness-110 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <GIconCopy size={12} />
                      <span>{copiedUrl ? "Link Copied!" : "Share Link"}</span>
                    </button>
                    {(currentTab.url.startsWith("http://") || currentTab.url.startsWith("https://")) && (
                      <button
                        type="button"
                        onClick={() => window.open(currentTab.url, "_blank")}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-sky-500/30"
                      >
                        <GIconExternalLink size={12} />
                        <span>Launch in New Tab</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sitelinks or Related Subsections */}
                {matched?.sitelinks && matched.sitelinks.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider px-1">
                      Explore Subsections & Related Links
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {matched.sitelinks.map((sl, idx) => (
                        <div
                          key={idx}
                          onClick={() => navigateTabTo(currentTab.id, sl.url, sl.title)}
                          className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition cursor-pointer space-y-1"
                        >
                          <span className="text-xs font-semibold text-sky-400 hover:underline block">
                            {sl.title}
                          </span>
                          {sl.snippet && (
                            <p className="text-[11px] text-white/50 leading-relaxed">{sl.snippet}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Attributes / Fact Matrix */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                    Document Metadata
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-white/40 block">Author</span>
                      <span className="font-semibold text-white">James Mendoza</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-white/40 block">Category</span>
                      <span className="font-semibold text-accent capitalize">{category}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-white/40 block">Status</span>
                      <span className="font-semibold text-emerald-400">Live & Indexed</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-white/40 block">Security</span>
                      <span className="font-semibold text-sky-400">TLS 1.3 / Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    );
  };

  return (
    <div ref={browserContainerRef} className="relative flex flex-col h-full bg-[#10131c] text-white select-none overflow-hidden font-sans">
      {/* ------------------------------------------------------------- */}
      {/* CHROME TABS STRIP (WINDOWS MODE) */}
      {/* ------------------------------------------------------------- */}
      {isWin && (
        <div
          onContextMenu={(e) => {
            if (e.target === e.currentTarget) {
              openTabContextMenu(e, activeTabId);
            }
          }}
          className="relative z-30 flex items-center px-1.5 sm:px-2 pt-1 sm:pt-1.5 bg-[#1b1f2b] border-b border-black/40 gap-1 overflow-x-auto thin-scroll shrink-0"
        >
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <AnimatePresence mode="popLayout" initial={false}>
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                const isSplit = tab.id === splitTabId;
                return (
                  <motion.div
                    layout
                    key={tab.id}
                    initial={{ opacity: 0, scale: 0.9, y: 3 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.12 } }}
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    onClick={() => {
                      if (systemSounds) soundFx.playClick();
                      setActiveTabId(tab.id);
                    }}
                    onContextMenu={(e) => openTabContextMenu(e, tab.id)}
                    title={tab.title}
                    className={`group relative flex items-center gap-1.5 sm:gap-2 h-7 sm:h-8 rounded-t-lg sm:rounded-t-xl text-[10.5px] sm:text-xs transition cursor-pointer select-none ${
                      tab.isPinned
                        ? "w-8 sm:w-9 min-w-[32px] sm:min-w-[36px] max-w-[40px] px-1.5 sm:px-2 justify-center"
                        : "px-2 sm:px-3 max-w-[180px] min-w-[70px] sm:min-w-[110px]"
                    } ${
                      isActive
                        ? "bg-[#282d3c] text-white font-medium shadow-md border-t border-x border-white/10"
                        : isSplit
                          ? "bg-[#202533] text-sky-300 border-t border-x border-sky-500/30 font-medium"
                          : "bg-transparent text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab.isPinned ? (
                      <GIconPin size={11} className="text-amber-400 shrink-0" />
                    ) : (
                      <GoogleColorIcon size={12} />
                    )}
                    {!tab.isPinned && (
                      <span className="truncate flex-1 text-[10.5px] sm:text-[11px]">{tab.title}</span>
                    )}
                    {tab.isMuted && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleMuteTab(tab.id);
                        }}
                        className="p-0.5 rounded text-white/40 hover:text-white shrink-0"
                        title="Site is muted (click to unmute)"
                      >
                        <GIconVolumeMute size={11} />
                      </button>
                    )}
                    {!tab.isPinned && (
                      <button
                        onClick={(e) => handleCloseTab(tab.id, e)}
                        className={`p-0.5 rounded-full hover:bg-white/20 text-white/50 hover:text-white transition cursor-pointer shrink-0 ${
                          isActive
                            ? "opacity-100 flex items-center justify-center"
                            : "opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center"
                        }`}
                        title="Close tab (Ctrl+W)"
                      >
                        <GIconClose size={10} />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9, rotate: 90 }}
              onClick={handleNewTab}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer shrink-0"
              title="New Tab"
            >
              <GIconPlus size={12} />
            </motion.button>
          </div>

          <div className="flex items-center gap-1 text-white/50 px-1 sm:px-2 shrink-0">
            <button
              onClick={() => {
                if (splitTabId) {
                  setSplitTabId(null);
                } else if (tabs.length > 1) {
                  const other = tabs.find((t) => t.id !== activeTabId);
                  if (other) setSplitTabId(other.id);
                } else {
                  handleNewTab();
                }
              }}
              className={`hidden sm:flex p-1.5 rounded-md hover:bg-white/10 hover:text-white transition cursor-pointer ${
                splitTabId ? "text-sky-400 bg-sky-500/15" : ""
              }`}
              title={splitTabId ? "Exit Split View" : "Split View"}
            >
              <GIconLayoutColumns size={13} />
            </button>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-sky-600/30 border border-sky-400/40 text-[9px] sm:text-[10px] font-bold text-sky-300 flex items-center justify-center select-none" title="James Mendoza Profile">
              JM
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TOP NAVIGATION & OMNIBOX ROW (CHROME / SAFARI) */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`relative z-40 flex items-center px-1.5 sm:px-3 py-1 sm:py-1.5 border-b border-white/10 shrink-0 gap-1 sm:gap-2 ${
          isWin ? "bg-[#282d3c]" : "bg-[#181d28]/95 backdrop-blur-md"
        }`}
      >
        {/* Navigation Arrows */}
        <div className="flex items-center gap-0.5 shrink-0">
          {!isWin && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveDrawer((prev) => (prev === "bookmarks" ? "none" : "bookmarks"))}
              className={`hidden sm:flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer mr-0.5 ${
                activeDrawer === "bookmarks" ? "text-sky-400 bg-sky-500/15" : ""
              }`}
              title="Toggle Safari Sidebar & Bookmarks"
            >
              <GIconLayoutColumns size={12} />
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleBack}
            disabled={!canGoBack}
            className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
            title="Back"
          >
            <GIconChevronLeft size={13} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleForward}
            disabled={!canGoForward}
            className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
            title="Forward"
          >
            <GIconChevronRight size={13} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9, rotate: 180 }}
            onClick={handleReload}
            className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Reload this page"
          >
            <GIconRotateRight size={12} className={isLoading ? "animate-spin text-sky-400" : ""} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleHome}
            className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Start Page"
          >
            <GIconGlobe size={13} />
          </motion.button>
        </div>

        {/* Omnibox / Unified Address Bar */}
        <div className="relative flex-1 min-w-0">
          <form
            onSubmit={handleSubmitUrl}
            className={`flex items-center h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg sm:rounded-xl border transition-all ${
              isOmniboxFocused
                ? "bg-black/60 border-accent ring-1 ring-accent"
                : "bg-black/35 hover:bg-black/45 border-white/10"
            }`}
          >
            <div className="flex items-center gap-1 text-white/40 mr-1 shrink-0">
              {inputUrl.startsWith("https://") ? (
                <GIconLock size={10} className="text-emerald-400" title="Secure Connection" />
              ) : isWin ? (
                <GIconChrome size={11} />
              ) : (
                <GIconSafari size={11} />
              )}
            </div>

            <input
              ref={omniboxRef}
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setSelectedSuggestionIdx(-1);
              }}
              onFocus={() => {
                setIsOmniboxFocused(true);
                setSelectedSuggestionIdx(-1);
                if (inputUrl === "safari://start" || inputUrl === "google://home") {
                  setInputUrl("");
                }
              }}
              onBlur={() => setTimeout(() => setIsOmniboxFocused(false), 220)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelectedSuggestionIdx((prev) =>
                    omniboxSuggestions.length > 0 ? (prev + 1) % omniboxSuggestions.length : -1
                  );
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedSuggestionIdx((prev) =>
                    omniboxSuggestions.length > 0
                      ? prev <= 0
                        ? omniboxSuggestions.length - 1
                        : prev - 1
                      : -1
                  );
                } else if (e.key === "Enter") {
                  if (
                    selectedSuggestionIdx >= 0 &&
                    selectedSuggestionIdx < omniboxSuggestions.length
                  ) {
                    e.preventDefault();
                    handleSelectSuggestion(omniboxSuggestions[selectedSuggestionIdx]);
                  }
                } else if (e.key === "Escape") {
                  setIsOmniboxFocused(false);
                  setSelectedSuggestionIdx(-1);
                }
              }}
              placeholder={isWin ? "Search Google or type a URL..." : "Search or enter website name..."}
              className="w-full bg-transparent text-[11.5px] sm:text-xs text-white placeholder:text-white/35 outline-none font-mono selection:bg-accent/40"
            />

            {/* Zoom Indicator Pill in Omnibox */}
            {zoomLevel !== 100 && (
              <button
                type="button"
                onClick={handleZoomReset}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/15 text-[10px] text-accent font-mono shrink-0 mr-1 cursor-pointer transition"
                title="Click to reset zoom to 100%"
              >
                <span>{zoomLevel}%</span>
              </button>
            )}

            {/* Bookmark Star Button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={handleToggleBookmarkCurrent}
              className={`p-1 rounded-md transition cursor-pointer shrink-0 mr-1 ${
                isCurrentPageBookmarked
                  ? "text-[#facc15] hover:text-[#fde047]"
                  : "text-white/40 hover:text-white"
              }`}
              title={isCurrentPageBookmarked ? "Edit bookmark for this page" : "Bookmark this tab (Ctrl+D / ⌘D)"}
            >
              <GIconStar size={12} fill={isCurrentPageBookmarked ? "currentColor" : "none"} />
            </motion.button>

            {inputUrl && (
              <button
                type="button"
                onClick={() => setInputUrl("")}
                className="text-white/40 hover:text-white p-0.5 shrink-0 cursor-pointer"
              >
                <GIconClose size={10} />
              </button>
            )}
          </form>

          {/* Predictive Search Suggestions Dropdown */}
          {isOmniboxFocused && omniboxSuggestions.length > 0 && (
            <SuggestionsDropdown
              entries={omniboxSuggestions}
              currentQuery={
                inputUrl.startsWith("safari://") || inputUrl.startsWith("google://")
                  ? ""
                  : inputUrl
              }
              isWin={isWin}
              selectedIndex={selectedSuggestionIdx}
              onSelect={handleSelectSuggestion}
              onRemoveRecent={removeRecentSearch}
              onClearAllRecents={clearAllRecentSearches}
            />
          )}
        </div>

        {/* Action icons right */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShowFindInPage((prev) => !prev);
              if (!showFindInPage) {
                setTimeout(() => findInputRef.current?.focus(), 50);
              }
            }}
            className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer ${
              showFindInPage ? "text-accent bg-white/15 ring-1 ring-white/20" : ""
            }`}
            title="Find in Page (Ctrl+F / ⌘F)"
          >
            <GIconSearch size={12} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCustomizeModal((prev) => !prev)}
            className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer ${
              showCustomizeModal ? "text-accent bg-white/10 ring-1 ring-white/20" : ""
            }`}
            title="Customize Appearance & Background"
          >
            <GIconPalette size={12} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCopyUrl}
            className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Copy Page URL"
          >
            {copiedUrl ? <GIconCheck size={11} className="text-emerald-400" /> : <GIconCopy size={11} />}
          </motion.button>

          {!isWin && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (splitTabId) {
                    setSplitTabId(null);
                  } else if (tabs.length > 1) {
                    const other = tabs.find((t) => t.id !== activeTabId);
                    if (other) setSplitTabId(other.id);
                  } else {
                    handleNewTab();
                  }
                }}
                className={`hidden sm:flex items-center justify-center w-7 h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer ${
                  splitTabId ? "text-sky-400 bg-sky-500/15" : ""
                }`}
                title={splitTabId ? "Exit Split Screen" : "Side-by-side Split View"}
              >
                <GIconLayoutColumns size={13} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9, rotate: 90 }}
                onClick={handleNewTab}
                className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="New Tab"
              >
                <GIconPlus size={12} />
              </motion.button>
            </div>
          )}

          {/* Browser Menu Button (Chrome 3-Dot or Safari Action) */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowBrowserMenu((prev) => !prev)}
              className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer ${
                showBrowserMenu ? "text-accent bg-white/15 ring-1 ring-white/20" : ""
              }`}
              title={isWin ? "Customize and control Google Chrome" : "Safari Actions & Tools"}
            >
              {isWin ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              ) : (
                <GIconSliders size={13} />
              )}
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showBrowserMenu && (
                <motion.div
                  ref={browserMenuRef}
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className={`absolute top-full right-0 mt-1.5 z-50 w-64 max-h-[calc(100vh-140px)] overflow-y-auto thin-scroll py-1.5 select-none ${
                    isWin
                      ? "bg-[#202533]/98 backdrop-blur-2xl border border-white/15 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-xs text-white"
                      : "bg-[#181d28]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-xs text-white"
                  }`}
                >
                  <button
                    onClick={() => {
                      handleNewTab();
                      setShowBrowserMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-white/10 text-left cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <GIconPlus size={13} className="text-white/60" />
                      <span>New Tab</span>
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">{isWin ? "Ctrl+T" : "⌘T"}</span>
                  </button>

                  <button
                    onClick={() => {
                      openApp("browser");
                      setShowBrowserMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-white/10 text-left cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <GIconGlobe size={13} className="text-white/60" />
                      <span>New Window</span>
                    </span>
                  </button>

                  <div className="h-px bg-white/10 my-1 mx-2" />

                  <button
                    onClick={() => {
                      setActiveDrawer("history");
                      setShowBrowserMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-white/10 text-left cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <GIconHistory size={13} className="text-white/60" />
                      <span>History</span>
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">{isWin ? "Ctrl+H" : "⌘Y"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveDrawer("downloads");
                      setShowBrowserMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-white/10 text-left cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <GIconDownload size={13} className="text-white/60" />
                      <span>Downloads</span>
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">{isWin ? "Ctrl+J" : "⌥⌘L"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowBookmarksBar((prev) => !prev);
                      setShowBrowserMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-white/10 text-left cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <GIconStar size={13} className="text-white/60" />
                      <span>{showBookmarksBar ? "Hide Bookmarks Bar" : "Show Bookmarks Bar"}</span>
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">{isWin ? "Ctrl+Shift+B" : "⌘Shift+B"}</span>
                  </button>

                  <div className="h-px bg-white/10 my-1 mx-2" />

                  {/* Zoom controls in menu */}
                  <div className="flex items-center justify-between px-3.5 py-1.5 text-xs">
                    <span className="text-white/70">Zoom</span>
                    <div className="flex items-center gap-1.5 bg-black/40 rounded-lg p-0.5 border border-white/10">
                      <button
                        onClick={handleZoomOut}
                        className="w-5 h-5 flex items-center justify-center hover:bg-white/15 rounded text-white/70 hover:text-white cursor-pointer font-bold"
                        title="Zoom Out (Ctrl -)"
                      >
                        -
                      </button>
                      <button
                        onClick={handleZoomReset}
                        className="px-1.5 text-[10.5px] font-mono text-accent hover:underline cursor-pointer"
                        title="Reset Zoom (Ctrl 0)"
                      >
                        {zoomLevel}%
                      </button>
                      <button
                        onClick={handleZoomIn}
                        className="w-5 h-5 flex items-center justify-center hover:bg-white/15 rounded text-white/70 hover:text-white cursor-pointer font-bold"
                        title="Zoom In (Ctrl +)"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowFindInPage(true);
                      setShowBrowserMenu(false);
                      setTimeout(() => findInputRef.current?.focus(), 50);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-white/10 text-left cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <GIconSearch size={13} className="text-white/60" />
                      <span>Find in page...</span>
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">{isWin ? "Ctrl+F" : "⌘F"}</span>
                  </button>

                  <button
                    onClick={() => {
                      handlePrintPage();
                      setShowBrowserMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-white/10 text-left cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <GIconPrinter size={13} className="text-white/60" />
                      <span>Print / Export...</span>
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">{isWin ? "Ctrl+P" : "⌘P"}</span>
                  </button>

                  <div className="h-px bg-white/10 my-1 mx-2" />

                  <button
                    onClick={() => {
                      setShowCustomizeModal(true);
                      setShowBrowserMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-white/10 text-left cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <GIconPalette size={13} className="text-accent" />
                      <span>{isWin ? "Customize Chrome" : "Customize Safari"}</span>
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      clearAllRecentSearches();
                      setHistoryLog([]);
                      try {
                        localStorage.removeItem("browser_history_entries");
                      } catch {}
                      notify("Data Cleared", "Browsing history and search cache cleared.", "update", 1800);
                      setShowBrowserMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-rose-500/15 text-rose-300 text-left cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <GIconTrash size={13} />
                      <span>Clear Browsing Data</span>
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOOKMARKS BAR (CUSTOMIZABLE, PERSISTENT, ONE-CLICK ACCESS)    */}
      {/* ------------------------------------------------------------- */}
      {showBookmarksBar && (
        <div className="relative z-30 flex items-center px-2 sm:px-3 py-1 bg-[#141824] border-b border-white/5 gap-1.5 overflow-x-auto thin-scroll shrink-0 text-xs text-white/80 select-none">
          {bookmarks.map((bm) => (
            <div
              key={bm.id}
              onClick={() => {
                if (bm.url === "mendoza.dev/cv.pdf") {
                  openApp("pdf-viewer");
                } else if (bm.url.startsWith("https://github") || bm.url.startsWith("https://linkedin")) {
                  window.open(bm.url, "_blank");
                } else {
                  navigateTabTo(activeTabId, bm.url, bm.title);
                }
              }}
              className="group flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-white/10 text-white/75 hover:text-white transition cursor-pointer shrink-0 text-[11px] max-w-[170px]"
              title={`${bm.title} (${bm.url})`}
            >
              <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0" style={{ color: bm.color || "#38bdf8" }}>
                {bm.category === "profile" ? (
                  <GIconFileText size={11} />
                ) : bm.category === "experience" ? (
                  <GIconBriefcase size={11} />
                ) : bm.category === "skills" ? (
                  <GIconCode size={11} />
                ) : bm.category === "system" ? (
                  <GIconTerminal size={11} />
                ) : (
                  <GIconGlobe size={11} />
                )}
              </div>
              <span className="truncate">{bm.title}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (systemSounds) soundFx.playClose();
                  setBookmarks((prev) => prev.filter((b) => b.id !== bm.id));
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 rounded text-white/40 hover:text-white shrink-0 transition"
                title="Delete bookmark"
              >
                <GIconClose size={9} />
              </button>
            </div>
          ))}

          <div className="flex-1" />

          {/* Quick add current tab bookmark & shortcut hint */}
          <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-white/40 font-mono">
            <button
              type="button"
              onClick={handleToggleBookmarkCurrent}
              className="px-1.5 py-0.5 hover:bg-white/10 rounded text-white/60 hover:text-white transition cursor-pointer flex items-center gap-1 text-[10.5px]"
              title="Bookmark current tab"
            >
              <GIconPlus size={10} />
              <span className="hidden sm:inline">Add Bookmark</span>
            </button>
            <span className="hidden md:inline">• {isWin ? "Ctrl+Shift+B" : "⌘Shift+B"}</span>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SAFARI TABS BAR (MACOS MODE ONLY) */}
      {/* ------------------------------------------------------------- */}
      {!isWin && (
        <div
          onContextMenu={(e) => {
            if (e.target === e.currentTarget) {
              openTabContextMenu(e, activeTabId);
            }
          }}
          className="relative z-20 flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#141822] border-b border-white/5 gap-1 overflow-x-auto thin-scroll shrink-0"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const isSplit = tab.id === splitTabId;
              return (
                <motion.div
                  layout
                  key={tab.id}
                  initial={{ opacity: 0, scale: 0.9, y: 2 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.12 } }}
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  onClick={() => {
                    if (systemSounds) soundFx.playClick();
                    setActiveTabId(tab.id);
                  }}
                  onContextMenu={(e) => openTabContextMenu(e, tab.id)}
                  title={tab.title}
                  className={`group flex items-center gap-1.5 rounded-md sm:rounded-lg text-[10.5px] sm:text-xs transition cursor-pointer select-none ${
                    tab.isPinned
                      ? "w-7 sm:w-8 min-w-[28px] sm:min-w-[32px] max-w-[36px] px-1 sm:px-1.5 py-0.5 sm:py-1 justify-center"
                      : "px-2 sm:px-3 py-0.5 sm:py-1 max-w-[170px] min-w-[70px] sm:min-w-[96px]"
                  } ${
                    isActive
                      ? "bg-white/15 text-white font-medium shadow-xs border border-white/15"
                      : isSplit
                        ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.isPinned ? (
                    <GIconPin size={10} className="text-amber-400 shrink-0" />
                  ) : (
                    <GIconCompass size={11} className="text-sky-400 shrink-0" />
                  )}
                  {!tab.isPinned && (
                    <span className="truncate flex-1 text-[10.5px] sm:text-[11px]">{tab.title}</span>
                  )}
                  {tab.isMuted && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMuteTab(tab.id);
                      }}
                      className="p-0.5 rounded text-white/40 hover:text-white shrink-0"
                      title="Site is muted (click to unmute)"
                    >
                      <GIconVolumeMute size={10} />
                    </button>
                  )}
                  {!tab.isPinned && (
                    <button
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      className={`p-0.5 hover:bg-white/20 rounded text-white/50 hover:text-white transition cursor-pointer shrink-0 ${
                        isActive
                          ? "opacity-100 flex items-center justify-center"
                          : "opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center"
                      }`}
                      title="Close tab (⌘W)"
                    >
                      <GIconClose size={9} />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9, rotate: 90 }}
            onClick={handleNewTab}
            className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer shrink-0 ml-0.5"
            title="New Tab (⌘T)"
          >
            <GIconPlus size={11} />
          </motion.button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN VIEWPORT / RENDERING CANVAS (SINGLE OR DUAL SPLIT VIEW) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-0 flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Floating Find in Page Widget */}
        <AnimatePresence>
          {showFindInPage && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.94 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
              className="absolute top-2 right-2 sm:right-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a1f2c]/95 backdrop-blur-xl border border-white/20 shadow-2xl text-xs text-white"
            >
              <GIconSearch size={13} className="text-white/40 shrink-0" />
              <input
                ref={findInputRef}
                type="text"
                value={findQuery}
                onChange={(e) => {
                  setFindQuery(e.target.value);
                  setFindMatchIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (e.shiftKey) handleFindPrev();
                    else handleFindNext();
                  } else if (e.key === "Escape") {
                    setShowFindInPage(false);
                  }
                }}
                placeholder="Find in page..."
                className="w-32 sm:w-44 bg-transparent text-xs text-white placeholder:text-white/30 outline-none font-sans"
              />
              <span className="text-[10.5px] font-mono text-white/50 shrink-0 px-1 border-r border-white/10">
                {findQuery.trim() ? (findMatchTotal > 0 ? `${findMatchIndex + 1}/${findMatchTotal}` : "0/0") : ""}
              </span>
              <button
                type="button"
                onClick={handleFindPrev}
                disabled={findMatchTotal <= 0}
                className="p-1 hover:bg-white/10 rounded disabled:opacity-30 cursor-pointer text-white/70 hover:text-white"
                title="Previous match (Shift+Enter)"
              >
                <GIconChevronUp size={12} />
              </button>
              <button
                type="button"
                onClick={handleFindNext}
                disabled={findMatchTotal <= 0}
                className="p-1 hover:bg-white/10 rounded disabled:opacity-30 cursor-pointer text-white/70 hover:text-white"
                title="Next match (Enter)"
              >
                <GIconChevronDown size={12} />
              </button>
              <button
                type="button"
                onClick={() => setShowFindInPage(false)}
                className="p-1 hover:bg-white/10 rounded cursor-pointer text-white/50 hover:text-white ml-0.5"
                title="Close (Esc)"
              >
                <GIconClose size={11} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Side Drawers (History / Downloads / Bookmarks) */}
        <AnimatePresence>
          {activeDrawer !== "none" && (
            <motion.div
              initial={{ opacity: 0, x: 280 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 280 }}
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
              className="absolute top-0 right-0 bottom-0 z-40 w-72 sm:w-80 bg-[#141824]/98 backdrop-blur-2xl border-l border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col select-none"
            >
              {/* Drawer Header */}
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeDrawer === "history" ? (
                    <GIconHistory size={15} className="text-sky-400" />
                  ) : activeDrawer === "downloads" ? (
                    <GIconDownload size={15} className="text-emerald-400" />
                  ) : (
                    <GIconStar size={15} className="text-amber-400" />
                  )}
                  <span className="text-sm font-bold text-white capitalize">
                    {activeDrawer === "history" ? "Browsing History" : activeDrawer === "downloads" ? "Downloads" : "Bookmarks"}
                  </span>
                </div>
                <button
                  onClick={() => setActiveDrawer("none")}
                  className="p-1 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition cursor-pointer"
                  title="Close drawer (Esc)"
                >
                  <GIconClose size={13} />
                </button>
              </div>

              {/* Drawer Content */}
              {activeDrawer === "history" && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-2.5 border-b border-white/5">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
                      <GIconSearch size={12} className="text-white/40" />
                      <input
                        type="text"
                        value={historyFilter}
                        onChange={(e) => setHistoryFilter(e.target.value)}
                        placeholder="Search history..."
                        className="w-full bg-transparent text-xs text-white placeholder:text-white/30 outline-none"
                      />
                      {historyFilter && (
                        <button onClick={() => setHistoryFilter("")} className="text-white/40 hover:text-white">
                          <GIconClose size={10} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto thin-scroll p-2 space-y-1">
                    {historyLog
                      .filter(
                        (h) =>
                          !historyFilter ||
                          h.title.toLowerCase().includes(historyFilter.toLowerCase()) ||
                          h.url.toLowerCase().includes(historyFilter.toLowerCase())
                      )
                      .map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            navigateTabTo(activeTabId, item.url, item.title);
                            setActiveDrawer("none");
                          }}
                          className="group flex items-start justify-between p-2 rounded-xl hover:bg-white/[0.08] transition cursor-pointer text-xs"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="font-semibold text-white truncate block group-hover:text-accent">
                              {item.title}
                            </span>
                            <span className="text-[10.5px] text-white/40 font-mono truncate block">
                              {item.url}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHistoryLog((prev) => prev.filter((h) => h.id !== item.id));
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded text-white/40 hover:text-white transition shrink-0"
                            title="Remove from history"
                          >
                            <GIconClose size={10} />
                          </button>
                        </div>
                      ))}
                  </div>

                  <div className="p-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-white/40">{historyLog.length} items</span>
                    <button
                      onClick={() => {
                        setHistoryLog([]);
                        try {
                          localStorage.removeItem("browser_history_entries");
                        } catch {}
                        notify("History Cleared", "All browsing history removed.", "info");
                      }}
                      className="text-rose-400 hover:text-rose-300 hover:underline cursor-pointer text-[11px]"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}

              {activeDrawer === "downloads" && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto thin-scroll p-2.5 space-y-2">
                    {downloads.map((dl) => (
                      <div
                        key={dl.id}
                        className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <GIconFileText size={14} className="text-sky-400 shrink-0" />
                            <span className="font-semibold text-white truncate">{dl.filename}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold shrink-0">
                            {dl.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-white/45">
                          <span>{dl.size} • {dl.timestamp}</span>
                          <button
                            onClick={() => handleDownloadFile(dl)}
                            className="text-accent hover:underline font-semibold cursor-pointer"
                          >
                            {dl.category === "pdf" ? "Open PDF" : "Save File"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeDrawer === "bookmarks" && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto thin-scroll p-2 space-y-1">
                    {bookmarks.map((bm) => (
                      <div
                        key={bm.id}
                        onClick={() => {
                          if (bm.url === "mendoza.dev/cv.pdf") {
                            openApp("pdf-viewer");
                          } else if (bm.url.startsWith("https://github") || bm.url.startsWith("https://linkedin")) {
                            window.open(bm.url, "_blank");
                          } else {
                            navigateTabTo(activeTabId, bm.url, bm.title);
                          }
                          setActiveDrawer("none");
                        }}
                        className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.08] transition cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-4 h-4 flex items-center justify-center shrink-0" style={{ color: bm.color || "#38bdf8" }}>
                            <GIconStar size={12} fill="currentColor" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-white truncate block group-hover:text-accent">{bm.title}</span>
                            <span className="text-[10.5px] text-white/40 font-mono truncate block">{bm.url}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookmarks((prev) => prev.filter((b) => b.id !== bm.id));
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded text-white/40 hover:text-white transition shrink-0"
                          title="Remove bookmark"
                        >
                          <GIconClose size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {splitTab ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div
              className={`flex-1 flex flex-col min-w-0 overflow-y-auto thin-scroll relative ${
                browserThemeId === "custom" && customWallpaper ? "bg-cover bg-center bg-no-repeat" : activeTheme.bgClass
              }`}
              style={
                browserThemeId === "custom" && customWallpaper
                  ? { backgroundImage: `url(${customWallpaper})` }
                  : undefined
              }
            >
              {browserThemeId === "custom" && customWallpaper && (
                <div
                  className="absolute inset-0 pointer-events-none transition-colors duration-200 z-0"
                  style={{ backgroundColor: `rgba(0, 0, 0, ${wallpaperDim / 100})` }}
                />
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab.id + "-" + activeTab.url}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="relative z-[1] flex-1 flex flex-col w-full min-h-full transition-[zoom] duration-150 origin-top"
                  style={{ zoom: zoomLevel === 100 ? undefined : `${zoomLevel}%` }}
                >
                  {renderTabCanvas(activeTab, false)}
                </motion.div>
              </AnimatePresence>
            </div>
            <div
              className={`flex-1 flex flex-col min-w-0 overflow-y-auto thin-scroll relative ${
                browserThemeId === "custom" && customWallpaper ? "bg-cover bg-center bg-no-repeat" : activeTheme.bgClass
              }`}
              style={
                browserThemeId === "custom" && customWallpaper
                  ? { backgroundImage: `url(${customWallpaper})` }
                  : undefined
              }
            >
              {browserThemeId === "custom" && customWallpaper && (
                <div
                  className="absolute inset-0 pointer-events-none transition-colors duration-200 z-0"
                  style={{ backgroundColor: `rgba(0, 0, 0, ${wallpaperDim / 100})` }}
                />
              )}
              <div className="relative z-[1] flex items-center justify-between px-3 py-1.5 bg-[#141822]/90 backdrop-blur-md border-b border-white/10 text-xs shrink-0">
                <div className="flex items-center gap-1.5 truncate text-white/80">
                  <GIconLayoutColumns size={13} className="text-sky-400 shrink-0" />
                  <span className="font-semibold truncate">{splitTab.title}</span>
                  <span className="text-[10px] text-white/40 font-mono hidden sm:inline">— Split View</span>
                </div>
                <button
                  onClick={() => setSplitTabId(null)}
                  className="p-1 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition cursor-pointer"
                  title="Exit split view"
                >
                  <GIconClose size={12} />
                </button>
              </div>
              <div
                className="relative z-[1] flex-1 flex flex-col w-full min-h-full transition-[zoom] duration-150 origin-top"
                style={{ zoom: zoomLevel === 100 ? undefined : `${zoomLevel}%` }}
              >
                {renderTabCanvas(splitTab, true)}
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`flex-1 overflow-y-auto thin-scroll flex flex-col relative ${
              browserThemeId === "custom" && customWallpaper ? "bg-cover bg-center bg-no-repeat" : activeTheme.bgClass
            }`}
            style={
              browserThemeId === "custom" && customWallpaper
                ? { backgroundImage: `url(${customWallpaper})` }
                : undefined
            }
          >
            {browserThemeId === "custom" && customWallpaper && (
              <div
                className="absolute inset-0 pointer-events-none transition-colors duration-200 z-0"
                style={{ backgroundColor: `rgba(0, 0, 0, ${wallpaperDim / 100})` }}
              />
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab.id + "-" + activeTab.url}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="relative z-[1] flex-1 flex flex-col w-full min-h-full transition-[zoom] duration-150 origin-top"
                style={{ zoom: zoomLevel === 100 ? undefined : `${zoomLevel}%` }}
              >
                {renderTabCanvas(activeTab, false)}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM STATUS BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-2.5 sm:px-3 py-0.5 sm:py-1 border-t border-white/5 bg-black/40 text-[10px] sm:text-[10.5px] text-white/40 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
          <span className="truncate">{isWin ? "Google Chrome" : "Safari"} 128.0</span>
          <span>•</span>
          <span className="text-emerald-400 shrink-0">Online & Secure</span>
          {zoomLevel !== 100 && (
            <>
              <span>•</span>
              <button onClick={handleZoomReset} className="text-accent hover:underline cursor-pointer">
                Zoom: {zoomLevel}%
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 font-mono shrink-0 ml-2">
          <span>{tabs.length} {tabs.length === 1 ? "tab" : "tabs"} open</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">WebKit/Blink Engine</span>
        </div>
      </div>

      {/* Floating Hover Link URL Preview Pill */}
      {hoveredLink && (
        <div className="absolute bottom-2 left-2 z-40 max-w-sm sm:max-w-md px-2.5 py-0.5 rounded-md bg-[#161a25]/95 backdrop-blur-md border border-white/15 text-[11px] font-mono text-white/85 shadow-lg pointer-events-none truncate animate-in fade-in duration-100">
          {hoveredLink}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB CONTEXT MENU (CHROME / SAFARI RIGHT-CLICK ("SECOND CLICK") */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {tabContextMenu.isOpen && (
          <div
            className="absolute inset-0 z-[70] overflow-hidden"
            onClick={() => setTabContextMenu((p) => ({ ...p, isOpen: false }))}
            onContextMenu={(e) => {
              e.preventDefault();
              setTabContextMenu((p) => ({ ...p, isOpen: false }));
            }}
          >
            <motion.div
              ref={contextMenuRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className={`absolute z-[71] min-w-[220px] max-w-[260px] py-1.5 select-none ${
                isWin
                  ? "bg-[#202533]/98 backdrop-blur-2xl border border-white/15 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-xs text-white font-sans"
                  : "bg-[#181d28]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-xs text-white font-sans"
              }`}
              style={{
                top: Math.max(6, Math.min(tabContextMenu.y, (browserContainerRef.current?.clientHeight || 600) - 390)),
                left: Math.max(6, Math.min(tabContextMenu.x, (browserContainerRef.current?.clientWidth || 800) - 240)),
              }}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
            >
              {(() => {
                const target = tabs.find((t) => t.id === tabContextMenu.tabId);
                const isPinned = target?.isPinned ?? false;
                const isMuted = target?.isMuted ?? false;
                const isTargetSplit = splitTabId === tabContextMenu.tabId;
                const targetIdx = tabs.findIndex((t) => t.id === tabContextMenu.tabId);
                const hasTabsToRight = targetIdx >= 0 && targetIdx < tabs.length - 1;
                const hasTabsToLeft = targetIdx > 0;

                return (
                  <>
                    <button
                      onClick={() => {
                        handleNewTabToRight(tabContextMenu.tabId);
                        setTabContextMenu((p) => ({ ...p, isOpen: false }));
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-sky-500/20 hover:text-sky-300 text-left cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <GIconPlus size={13} className="text-white/60" />
                        <span>New tab to the right</span>
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        handleToggleSplitView(tabContextMenu.tabId);
                        setTabContextMenu((p) => ({ ...p, isOpen: false }));
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-sky-500/20 hover:text-sky-300 text-left cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <GIconLayoutColumns size={13} className="text-white/60" />
                        <span>{isTargetSplit || splitTabId ? "Exit split view" : "New split view with current tab"}</span>
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        handleMoveTabToNewWindow(tabContextMenu.tabId);
                        setTabContextMenu((p) => ({ ...p, isOpen: false }));
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-sky-500/20 hover:text-sky-300 text-left cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <GIconExternalLink size={13} className="text-white/60" />
                        <span>Move tab to another window</span>
                      </span>
                    </button>

                    <div className="h-px bg-white/10 my-1 mx-2" />

                    <button
                      onClick={() => {
                        handleReloadTab(tabContextMenu.tabId);
                        setTabContextMenu((p) => ({ ...p, isOpen: false }));
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-sky-500/20 hover:text-sky-300 text-left cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <GIconRotateRight size={13} className="text-white/60" />
                        <span>Reload</span>
                      </span>
                      <span className="text-[10px] text-white/40 font-mono">{isWin ? "Ctrl+R" : "⌘R"}</span>
                    </button>

                    <button
                      onClick={() => {
                        handleDuplicateTab(tabContextMenu.tabId);
                        setTabContextMenu((p) => ({ ...p, isOpen: false }));
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-sky-500/20 hover:text-sky-300 text-left cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <GIconCopy size={13} className="text-white/60" />
                        <span>Duplicate</span>
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        handleTogglePinTab(tabContextMenu.tabId);
                        setTabContextMenu((p) => ({ ...p, isOpen: false }));
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-sky-500/20 hover:text-sky-300 text-left cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <GIconPin size={13} className="text-white/60" />
                        <span>{isPinned ? "Unpin tab" : "Pin"}</span>
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        handleToggleMuteTab(tabContextMenu.tabId);
                        setTabContextMenu((p) => ({ ...p, isOpen: false }));
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-sky-500/20 hover:text-sky-300 text-left cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        {isMuted ? (
                          <GIconVolume size={13} className="text-white/60" />
                        ) : (
                          <GIconVolumeMute size={13} className="text-white/60" />
                        )}
                        <span>{isMuted ? "Unmute site" : "Mute site"}</span>
                      </span>
                    </button>

                    <div className="h-px bg-white/10 my-1 mx-2" />

                    <button
                      onClick={() => {
                        handleBookmarkTab(tabContextMenu.tabId);
                        setTabContextMenu((p) => ({ ...p, isOpen: false }));
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-sky-500/20 hover:text-sky-300 text-left cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <GIconStar size={13} className="text-amber-400/80" />
                        <span>Add tab to reading list / bookmarks</span>
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        handleCopyTabUrl(tabContextMenu.tabId);
                        setTabContextMenu((p) => ({ ...p, isOpen: false }));
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-sky-500/20 hover:text-sky-300 text-left cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <GIconCopy size={13} className="text-white/60" />
                        <span>Share tab / Copy link</span>
                      </span>
                    </button>

                    <div className="h-px bg-white/10 my-1 mx-2" />

                    <button
                      onClick={() => {
                        handleCloseTab(tabContextMenu.tabId);
                        setTabContextMenu((p) => ({ ...p, isOpen: false }));
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-rose-500/20 hover:text-rose-300 text-left cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <GIconClose size={13} className="text-rose-400/80" />
                        <span>Close</span>
                      </span>
                      <span className="text-[10px] text-white/40 font-mono">{isWin ? "Ctrl+W" : "⌘W"}</span>
                    </button>

                    <button
                      onClick={() => {
                        handleCloseOtherTabs(tabContextMenu.tabId);
                        setTabContextMenu((p) => ({ ...p, isOpen: false }));
                      }}
                      disabled={tabs.length <= 1}
                      className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-white/10 text-left cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>Close other tabs</span>
                    </button>

                    {hasTabsToRight && (
                      <button
                        onClick={() => {
                          handleCloseTabsToRight(tabContextMenu.tabId);
                          setTabContextMenu((p) => ({ ...p, isOpen: false }));
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-white/10 text-left cursor-pointer transition-colors"
                      >
                        <span>Close tabs to the right</span>
                      </button>
                    )}

                    {hasTabsToLeft && (
                      <button
                        onClick={() => {
                          handleCloseTabsToLeft(tabContextMenu.tabId);
                          setTabContextMenu((p) => ({ ...p, isOpen: false }));
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-white/10 text-left cursor-pointer transition-colors"
                      >
                        <span>Close tabs to the left</span>
                      </button>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* CUSTOMIZE APPEARANCE & THEME MODAL (IN-COMPONENT DIALOG)      */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showCustomizeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCustomizeModal(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className="w-full max-w-lg max-h-[92%] overflow-y-auto thin-scroll bg-[#141824] border border-white/20 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-4 sm:p-6 space-y-4 sm:space-y-5 text-white text-left relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Hidden file input for wallpaper upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleWallpaperUpload}
                className="hidden"
              />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 sm:pb-4">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shrink-0">
                    <GIconPalette size={16} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-white leading-tight truncate">
                      {isWin ? "Customize Google Chrome" : "Customize Safari"}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-white/50 truncate">
                      Custom wallpaper, preset themes, and start page widgets
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomizeModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer shrink-0 ml-2"
                  title="Close Customizer"
                >
                  <GIconClose size={14} />
                </button>
              </div>

              {/* SECTION 1: CUSTOM WALLPAPER UPLOAD */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white/70 uppercase tracking-wider text-[10.5px] sm:text-[11px] flex items-center gap-1.5">
                    <GIconUpload size={12} className="text-accent" />
                    Custom Wallpaper
                  </span>
                  {customWallpaper && browserThemeId === "custom" && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] text-emerald-300 font-medium">
                      Active
                    </span>
                  )}
                </div>

                {customWallpaper ? (
                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/15 space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-20 h-14 rounded-xl border border-white/20 bg-cover bg-center shrink-0 shadow-md relative overflow-hidden"
                        style={{ backgroundImage: `url(${customWallpaper})` }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{ backgroundColor: `rgba(0,0,0,${wallpaperDim / 100})` }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-white truncate">Custom Wallpaper Stored</div>
                        <div className="text-[11px] text-white/50">Stored in browser cache</div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setBrowserThemeId("custom");
                              try {
                                localStorage.setItem("browser_theme", "custom");
                              } catch {}
                              if (systemSounds) soundFx.playPop();
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                              browserThemeId === "custom"
                                ? "bg-accent text-accent-contrast shadow-sm"
                                : "bg-white/10 hover:bg-white/15 text-white"
                            }`}
                          >
                            <GIconCheck size={11} />
                            <span>{browserThemeId === "custom" ? "Applied" : "Apply"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                          >
                            <GIconUpload size={11} />
                            <span>Replace</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveCustomWallpaper}
                            className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                          >
                            <GIconTrash size={11} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dimming Slider */}
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-white/70">Background Dimming Overlay</span>
                        <span className="font-mono text-accent font-semibold">{wallpaperDim}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        step="5"
                        value={wallpaperDim}
                        onChange={(e) => handleUpdateWallpaperDim(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-accent"
                      />
                      <div className="flex justify-between text-[9.5px] text-white/40">
                        <span>Bright (0%)</span>
                        <span>Balanced (30-40%)</span>
                        <span>High Contrast (80%)</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-accent/60 bg-white/[0.02] hover:bg-accent/[0.04] transition group cursor-pointer text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/[0.06] group-hover:bg-accent/20 flex items-center justify-center text-white/60 group-hover:text-accent transition-colors mb-2">
                      <GIconUpload size={18} />
                    </div>
                    <span className="text-xs font-semibold text-white/90 group-hover:text-white transition-colors">
                      Upload Custom Wallpaper
                    </span>
                    <span className="text-[10.5px] text-white/45 mt-0.5">
                      Supports JPG, PNG, WEBP (auto-scaled for optimal memory)
                    </span>
                  </button>
                )}
              </div>

              {/* SECTION 2: PRESET THEMES GRID */}
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white/70 uppercase tracking-wider text-[10.5px] sm:text-[11px]">
                    Preset Color Themes ({BROWSER_THEMES.length})
                  </span>
                  <span className="text-[11px] text-accent font-medium truncate max-w-[150px]">
                    {browserThemeId === "custom" ? "Custom Mode" : activeTheme.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 sm:max-h-52 overflow-y-auto thin-scroll p-1">
                  {BROWSER_THEMES.map((theme) => {
                    const isSelected = browserThemeId === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => handleSelectTheme(theme.id)}
                        className={`group relative flex flex-col items-center gap-1.5 p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                          isSelected
                            ? "bg-white/[0.08] border-accent ring-2 ring-accent/30 shadow-lg scale-[1.02]"
                            : "bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-xl shadow-inner border border-white/20 flex items-center justify-center transition-transform group-hover:scale-105"
                          style={{ background: theme.preview }}
                        >
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-accent-contrast shadow-md">
                              <GIconCheck size={12} />
                            </div>
                          )}
                        </div>
                        <div className="text-center w-full min-w-0">
                          <span className="text-[11px] font-semibold text-white block truncate">
                            {theme.name}
                          </span>
                          {theme.badge && (
                            <span className="text-[9.5px] text-white/40 block truncate">
                              {theme.badge}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: WIDGET TOGGLES */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="font-semibold text-white/70 uppercase tracking-wider text-[10.5px] sm:text-[11px] block">
                  Start Page Widgets
                </span>

                <div className="space-y-2">
                  <div
                    onClick={handleToggleFavoritesWidget}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 cursor-pointer transition select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
                        <GIconGlobe size={14} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          {isWin ? "Shortcuts Grid" : "Favorites Grid"}
                        </span>
                        <span className="text-[10.5px] text-white/45 block">
                          Quick links to experience, skills, and projects
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 relative ${
                        showFavoritesWidget ? "bg-accent" : "bg-white/20"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                          showFavoritesWidget ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>

                  <div
                    onClick={handleTogglePrivacyWidget}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 cursor-pointer transition select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                        <GIconShield size={14} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          {isWin ? "Google Safe Browsing Badge" : "Safari Privacy Report"}
                        </span>
                        <span className="text-[10.5px] text-white/45 block">
                          Real-time security shield and tracking status
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 relative ${
                        showPrivacyWidget ? "bg-accent" : "bg-white/20"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                          showPrivacyWidget ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectTheme("default");
                    handleRemoveCustomWallpaper();
                    setShowFavoritesWidget(true);
                    setShowPrivacyWidget(true);
                    try {
                      localStorage.setItem("browser_show_favs", "true");
                      localStorage.setItem("browser_show_privacy", "true");
                    } catch {}
                  }}
                  className="text-xs text-white/50 hover:text-white underline cursor-pointer transition"
                >
                  Reset to Defaults
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomizeModal(false)}
                  className="px-5 py-2 rounded-xl bg-accent text-accent-contrast text-xs font-semibold hover:brightness-110 transition cursor-pointer shadow-md"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
