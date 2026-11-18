import { useState, useMemo, useEffect, useRef } from "react";
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
} from "../icons/GravityIcons";
import {
  SEARCH_INDEX,
  DEVELOPER_KNOWLEDGE_PANEL,
  SYSTEM_KNOWLEDGE_PANEL,
  BROWSER_FAVORITES,
  DEFAULT_RECENT_SEARCHES,
  AUTOCOMPLETE_KEYWORDS,
} from "../../data/browserKnowledge";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";

interface Tab {
  id: string;
  title: string;
  url: string;
  history: string[];
  historyIndex: number;
}

interface SuggestionEntry {
  type: "search" | "recent" | "keyword" | "site";
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
}

function SuggestionsDropdown({
  entries,
  currentQuery,
  isWin,
  selectedIndex,
  onSelect,
  onRemoveRecent,
  onClearAllRecents,
}: SuggestionsDropdownProps) {
  const isRecentMode = !currentQuery.trim() || entries.every((e) => e.type === "recent");

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#1c2230]/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-1.5 space-y-0.5 text-left select-none">
      {isRecentMode && (
        <div className="flex items-center justify-between px-3 py-1.5 text-[10px] uppercase font-semibold text-white/40 tracking-wider border-b border-white/5 mb-1">
          <div className="flex items-center gap-1.5">
            <GIconClock size={11} className="text-white/40" />
            <span>Recent Searches</span>
          </div>
          <button
            type="button"
            onMouseDown={onClearAllRecents}
            className="hover:text-white transition cursor-pointer normal-case text-[11px] font-normal"
          >
            Clear all
          </button>
        </div>
      )}

      {entries.map((entry, idx) => {
        const isSelected = selectedIndex === idx;

        return (
          <div
            key={`${entry.type}-${entry.query}-${idx}`}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(entry);
            }}
            className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-[13px] transition-all cursor-pointer ${
              isSelected
                ? "bg-white/15 text-white font-medium"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
              {/* Left icon per type */}
              <div className="w-5 flex items-center justify-center shrink-0">
                {entry.type === "recent" ? (
                  <GIconClock size={13} className="text-white/40 group-hover:text-white/70" />
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
                <div className="flex items-center gap-1 truncate font-medium text-white">
                  <span>{entry.query}</span>
                  <span className="text-white/40 text-[11px] font-normal">
                    — {isWin ? "Google Search" : "Safari Search"}
                  </span>
                </div>
              ) : entry.type === "keyword" || entry.type === "recent" ? (
                <div className="truncate">
                  <HighlightedSuggestion text={entry.title} query={currentQuery} />
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
                onMouseDown={(e) => onRemoveRecent(entry.query, e)}
                title="Remove from recent searches"
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/15 rounded-md text-white/40 hover:text-white transition shrink-0 ml-2"
              >
                <GIconClose size={11} />
              </button>
            )}
          </div>
        );
      })}

      {/* Footer helper */}
      <div className="flex items-center justify-between px-3 py-1 text-[10px] text-white/30 border-t border-white/5 pt-1.5 mt-1">
        <span>
          Press <kbd className="font-mono text-white/50">↑</kbd> <kbd className="font-mono text-white/50">↓</kbd> to navigate
        </span>
        <span>
          <kbd className="font-mono text-white/50">↵</kbd> to select
        </span>
      </div>
    </div>
  );
}

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
  const [inputUrl, setInputUrl] = useState<string>(activeTab.url);
  const [isOmniboxFocused, setIsOmniboxFocused] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Home search bar state
  const [homeSearchQuery, setHomeSearchQuery] = useState<string>("");
  const [isHomeSearchFocused, setIsHomeSearchFocused] = useState<boolean>(false);

  // Keyboard navigation for suggestions
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState<number>(-1);

  // Recent searches with localStorage persistence
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("browser_recent_searches");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_RECENT_SEARCHES;
  });

  useEffect(() => {
    try {
      localStorage.setItem("browser_recent_searches", JSON.stringify(recentSearches));
    } catch {}
  }, [recentSearches]);

  // Search Results Page category filter
  const [searchCategory, setSearchCategory] = useState<string>("all");

  const omniboxRef = useRef<HTMLInputElement>(null);

  // Synchronize address input with active tab URL
  useEffect(() => {
    setInputUrl(activeTab.url);
  }, [activeTab.url]);

  // Navigate current tab to a URL
  const navigateTo = (newUrl: string, title?: string) => {
    if (systemSounds) soundFx.playClick();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 220);

    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== activeTabId) return tab;
        const newHistory = [...tab.history.slice(0, tab.historyIndex + 1), newUrl];
        return {
          ...tab,
          url: newUrl,
          title: title || formatTabTitle(newUrl),
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      })
    );
  };

  const formatTabTitle = (url: string): string => {
    if (url === "safari://start" || url === "google://home") {
      return isWin ? "Google" : "Start Page";
    }
    if (url.startsWith("search://") || url.startsWith("google://search?q=")) {
      const q = decodeURIComponent(url.split("q=")[1] || "");
      return `${q} - ${isWin ? "Google Search" : "Safari Search"}`;
    }
    if (url.includes("mendoza.dev/experience")) return "Experience — James Mendoza";
    if (url.includes("mendoza.dev/skills")) return "Technical Skills — James Mendoza";
    if (url.includes("mendoza.dev/projects")) return "Projects — James Mendoza";
    if (url.includes("mendoza.dev/about")) return "About Me — James Mendoza";
    if (url.includes("mendoza.dev")) return "James Mendoza — Portfolio";
    if (url === "os://system-info") return "Portfolio OS Architecture";
    if (url === "os://shortcuts") return "Keyboard Shortcuts Directory";
    return url.replace(/^https?:\/\//, "");
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

  // Address submission / Search
  const handleSubmitUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inputUrl.trim();
    if (!raw) return;

    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("os://")) {
      navigateTo(raw);
    } else if (raw.includes(".") && !raw.includes(" ")) {
      navigateTo(`https://${raw}`);
    } else {
      // Perform Search
      const searchUrl = isWin ? `google://search?q=${encodeURIComponent(raw)}` : `safari://search?q=${encodeURIComponent(raw)}`;
      navigateTo(searchUrl, `${raw} - Search`);
    }
    omniboxRef.current?.blur();
    setIsOmniboxFocused(false);
  };

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText(activeTab.url);
    setCopiedUrl(true);
    if (systemSounds) soundFx.playPop();
    notify("URL Copied", "Page URL copied to clipboard.", "info", 1800);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Search Engine query parser
  const currentQuery = useMemo(() => {
    if (activeTab.url.startsWith("google://search?q=") || activeTab.url.startsWith("safari://search?q=")) {
      return decodeURIComponent(activeTab.url.split("q=")[1] || "");
    }
    return "";
  }, [activeTab.url]);

  // Live autocomplete suggestions when typing in omnibox
  const predictiveSuggestions = useMemo(() => {
    const q = inputUrl.toLowerCase().trim();
    if (!q || q.startsWith("safari://") || q.startsWith("google://")) return [];
    return SEARCH_INDEX.filter((item) =>
      item.keywords.some((kw) => kw.includes(q)) ||
      item.title.toLowerCase().includes(q) ||
      item.snippet.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [inputUrl]);

  // Filtered search results
  const searchResults = useMemo(() => {
    if (!currentQuery) return [];
    const qTokens = currentQuery.toLowerCase().split(/\s+/).filter(Boolean);

    let list = SEARCH_INDEX.filter((item) => {
      return qTokens.some(
        (token) =>
          item.keywords.some((kw) => kw.includes(token)) ||
          item.title.toLowerCase().includes(token) ||
          item.snippet.toLowerCase().includes(token)
      );
    });

    if (searchCategory !== "all") {
      list = list.filter((item) => item.category === searchCategory);
    }

    return list;
  }, [currentQuery, searchCategory]);

  // Determine Knowledge Panel to show for search
  const activeKnowledgePanel = useMemo(() => {
    if (!currentQuery) return null;
    const q = currentQuery.toLowerCase();
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
  }, [currentQuery]);

  return (
    <div className="flex flex-col h-full bg-[#10131c] text-white select-none overflow-hidden font-sans">
      {/* ------------------------------------------------------------- */}
      {/* CHROME TABS STRIP (WINDOWS MODE) */}
      {/* ------------------------------------------------------------- */}
      {isWin && (
        <div className="flex items-center px-2 pt-1.5 bg-[#1b1f2b] border-b border-black/40 gap-1 overflow-x-auto thin-scroll shrink-0">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => {
                    if (systemSounds) soundFx.playClick();
                    setActiveTabId(tab.id);
                  }}
                  className={`group relative flex items-center gap-2 h-8 px-3 rounded-t-xl text-xs transition cursor-pointer max-w-[200px] min-w-[110px] select-none ${
                    isActive
                      ? "bg-[#282d3c] text-white font-medium shadow-md border-t border-x border-white/10"
                      : "bg-transparent text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <GIconChrome size={13} className="shrink-0" />
                  <span className="truncate flex-1 text-[11px]">{tab.title}</span>
                  <button
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-white/20 text-white/50 hover:text-white transition cursor-pointer"
                    title="Close tab"
                  >
                    <GIconClose size={10} />
                  </button>
                </div>
              );
            })}

            <button
              onClick={handleNewTab}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
              title="New Tab"
            >
              <GIconPlus size={13} />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-white/40 text-[11px] px-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white/70">Google Chrome</span>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TOP NAVIGATION & OMNIBOX ROW (CHROME / SAFARI) */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`flex items-center px-2.5 sm:px-3 py-1.5 border-b border-white/10 shrink-0 gap-1.5 sm:gap-2 ${
          isWin ? "bg-[#282d3c]" : "bg-[#181d28]/95 backdrop-blur-md"
        }`}
      >
        {/* Navigation Arrows */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={handleBack}
            disabled={!canGoBack}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
            title="Back"
          >
            <GIconChevronLeft size={14} />
          </button>
          <button
            onClick={handleForward}
            disabled={!canGoForward}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
            title="Forward"
          >
            <GIconChevronRight size={14} />
          </button>
          <button
            onClick={handleReload}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Reload this page"
          >
            <GIconRotateRight size={13} className={isLoading ? "animate-spin text-sky-400" : ""} />
          </button>
          <button
            onClick={handleHome}
            className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Start Page"
          >
            <GIconGlobe size={13} />
          </button>
        </div>

        {/* Omnibox / Unified Address Bar */}
        <div className="relative flex-1 min-w-0">
          <form
            onSubmit={handleSubmitUrl}
            className={`flex items-center h-8 px-2.5 rounded-xl border transition-all ${
              isOmniboxFocused
                ? "bg-black/60 border-accent ring-1 ring-accent"
                : "bg-black/35 hover:bg-black/45 border-white/10"
            }`}
          >
            <div className="flex items-center gap-1.5 text-white/40 mr-1 shrink-0">
              {inputUrl.startsWith("https://") ? (
                <GIconLock size={11} className="text-emerald-400" title="Secure Connection" />
              ) : isWin ? (
                <GIconChrome size={12} />
              ) : (
                <GIconSafari size={12} />
              )}
            </div>

            <input
              ref={omniboxRef}
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onFocus={() => setIsOmniboxFocused(true)}
              onBlur={() => setTimeout(() => setIsOmniboxFocused(false), 200)}
              placeholder={isWin ? "Search Google or type a URL..." : "Search or enter website name..."}
              className="w-full bg-transparent text-xs text-white placeholder:text-white/35 outline-none font-mono selection:bg-accent/40"
            />

            {inputUrl && (
              <button
                type="button"
                onClick={() => setInputUrl("")}
                className="text-white/40 hover:text-white p-0.5 shrink-0"
              >
                <GIconClose size={10} />
              </button>
            )}
          </form>

          {/* Predictive Search Suggestions Dropdown */}
          {isOmniboxFocused && predictiveSuggestions.length > 0 && (
            <div className="absolute top-9 left-0 right-0 z-50 bg-[#171b26] border border-white/15 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl space-y-0.5">
              <div className="text-[10px] uppercase font-semibold text-white/40 px-2 py-1 tracking-wider">
                Instant System & Profile Results
              </div>
              {predictiveSuggestions.map((item) => (
                <div
                  key={item.id}
                  onMouseDown={() => {
                    navigateTo(item.url, item.title);
                    setIsOmniboxFocused(false);
                  }}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white/10 transition cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GIconSearch size={12} className="text-accent shrink-0" />
                    <span className="font-medium text-white truncate">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono shrink-0 ml-2">
                    {item.displayUrl}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action icons right */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopyUrl}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Copy Page URL"
          >
            {copiedUrl ? <GIconCheck size={12} className="text-emerald-400" /> : <GIconCopy size={12} />}
          </button>

          {!isWin && (
            /* Safari New Tab & App Indicator */
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleNewTab}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="New Tab"
              >
                <GIconPlus size={13} />
              </button>
              <div className="hidden md:flex items-center gap-1 text-[11px] text-white/40 px-1 font-semibold">
                <GIconSafari size={14} />
                <span>Safari</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SAFARI TABS BAR (MACOS MODE ONLY) */}
      {/* ------------------------------------------------------------- */}
      {!isWin && tabs.length > 1 && (
        <div className="flex items-center px-2 py-1 bg-[#141822] border-b border-white/5 gap-1 overflow-x-auto thin-scroll shrink-0">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => {
                  if (systemSounds) soundFx.playClick();
                  setActiveTabId(tab.id);
                }}
                className={`group flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition cursor-pointer max-w-[180px] min-w-[90px] select-none ${
                  isActive
                    ? "bg-white/15 text-white font-medium shadow-xs"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <GIconGlobe size={11} className="text-white/40 shrink-0" />
                <span className="truncate flex-1 text-[11px]">{tab.title}</span>
                <button
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 rounded text-white/50 hover:text-white"
                >
                  <GIconClose size={9} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN VIEWPORT / RENDERING CANVAS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 bg-[#0e111a] overflow-y-auto thin-scroll flex flex-col">
        {/* VIEW 1: START / NEW TAB PAGE (SAFARI OR CHROME HOMEPAGE) */}
        {(activeTab.url === "safari://start" || activeTab.url === "google://home") && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full my-auto">
            {/* Header Brand */}
            {isWin ? (
              /* Google Chrome Home Branding */
              <div className="flex flex-col items-center mb-6 space-y-2">
                <div className="text-4xl sm:text-5xl font-bold tracking-tight font-sans flex items-center select-none">
                  <span className="text-[#4285F4]">G</span>
                  <span className="text-[#EA4335]">o</span>
                  <span className="text-[#FBBC05]">o</span>
                  <span className="text-[#4285F4]">g</span>
                  <span className="text-[#34A853]">l</span>
                  <span className="text-[#EA4335]">e</span>
                </div>
                <p className="text-xs text-white/50">Search everything about James Mendoza & Portfolio OS</p>
              </div>
            ) : (
              /* Safari Start Page Branding */
              <div className="flex flex-col items-center mb-6 space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0288d1] to-[#29b6f6] flex items-center justify-center shadow-lg shadow-sky-500/30 p-2">
                  <GIconSafari size={42} />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Safari Start Page</h1>
                <p className="text-xs text-white/50">Explore developer biography, tech stack, and OS kernel specs</p>
              </div>
            )}

            {/* Central Search Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = inputUrl.trim();
                if (q) {
                  navigateTo(isWin ? `google://search?q=${encodeURIComponent(q)}` : `safari://search?q=${encodeURIComponent(q)}`);
                }
              }}
              className="w-full max-w-2xl bg-white/[0.06] hover:bg-white/[0.09] focus-within:bg-[#1a1f2c] border border-white/15 focus-within:border-accent rounded-full px-4 py-2.5 sm:py-3 shadow-xl backdrop-blur-md flex items-center gap-3 transition-all mb-6"
            >
              <GIconSearch size={16} className="text-white/40 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search James Mendoza, experiences, skills, projects, or system architecture..."
                className="w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none font-sans"
                onChange={(e) => setInputUrl(e.target.value)}
              />
              <button
                type="submit"
                className="px-3 py-1 rounded-full bg-accent text-accent-contrast text-xs font-semibold hover:brightness-110 cursor-pointer transition shrink-0"
              >
                Search
              </button>
            </form>

            {/* Quick Favorites Tiles Grid */}
            <div className="w-full max-w-2xl space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-white/40 uppercase tracking-wider px-1">
                <span>Favorites & Quick Access</span>
                <span>{BROWSER_FAVORITES.length} portals</span>
              </div>

              <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {BROWSER_FAVORITES.map((fav, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (fav.url === "mendoza.dev/cv.pdf") {
                        openApp("pdf-viewer");
                      } else if (fav.url.startsWith("https://github") || fav.url.startsWith("https://linkedin")) {
                        window.open(fav.url, "_blank");
                      } else {
                        navigateTo(fav.url, fav.title);
                      }
                    }}
                    className="group flex flex-col items-center p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all duration-150 cursor-pointer text-center select-none shadow-xs"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-md transform group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: `${fav.color}22`, border: `1px solid ${fav.color}44` }}
                    >
                      {fav.category === "profile" ? (
                        <GIconFileText size={18} style={{ color: fav.color }} />
                      ) : fav.category === "experience" ? (
                        <GIconBriefcase size={18} style={{ color: fav.color }} />
                      ) : fav.category === "skills" ? (
                        <GIconCode size={18} style={{ color: fav.color }} />
                      ) : fav.category === "system" ? (
                        <GIconTerminal size={18} style={{ color: fav.color }} />
                      ) : (
                        <GIconExternalLink size={18} style={{ color: fav.color }} />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-white/90 group-hover:text-white truncate w-full">
                      {fav.title}
                    </span>
                    <span className="text-[10px] text-white/40 truncate w-full mt-0.5">
                      {fav.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Report Box (Safari style) */}
            {!isWin && (
              <div className="mt-6 w-full max-w-2xl p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-white/60">
                <div className="flex items-center gap-2.5">
                  <GIconShield size={16} className="text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-white">Privacy Report</span>
                    <p className="text-[11px] text-white/45">Safari has blocked tracking attempts on your session.</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-medium">
                  Protected
                </span>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: SEARCH ENGINE RESULTS PAGE */}
        {(activeTab.url.startsWith("google://search") || activeTab.url.startsWith("safari://search")) && (
          <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-5xl mx-auto w-full">
            {/* Search Top Filter Tabs */}
            <div className="flex items-center gap-1.5 pb-3 border-b border-white/10 text-xs overflow-x-auto thin-scroll shrink-0">
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
                  className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
                    searchCategory === cat.id
                      ? "bg-accent text-accent-contrast shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Results Header Stats */}
            <div className="py-2.5 text-[11px] text-white/40">
              About {searchResults.length} verified results for{" "}
              <span className="font-bold text-white/80">"{currentQuery}"</span>
            </div>

            {/* Results Body: 2 Columns (Organic Results + Knowledge Graph Panel) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-1">
              {/* Left Column: Organic Search Results */}
              <div className="lg:col-span-7 space-y-5">
                {searchResults.length === 0 ? (
                  <div className="p-8 text-center space-y-2 border border-white/10 rounded-2xl bg-white/[0.02]">
                    <GIconSearch size={32} className="mx-auto text-white/30" />
                    <p className="text-sm font-semibold text-white">No exact match found for "{currentQuery}"</p>
                    <p className="text-xs text-white/50">
                      Try searching for "James", "Dowinn", "Straive", "skills", "React", "PostgreSQL", or "shortcuts".
                    </p>
                  </div>
                ) : (
                  searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="group flex flex-col space-y-1 p-3.5 rounded-xl hover:bg-white/[0.03] transition border border-transparent hover:border-white/5"
                    >
                      {/* Breadcrumb URL */}
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 font-mono">
                        <GIconGlobe size={11} className="text-white/40" />
                        <span>{item.displayUrl}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-accent/20 text-accent font-sans font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Clickable Title */}
                      <h3
                        onClick={() => {
                          if (item.url === "mendoza.dev/cv.pdf") openApp("pdf-viewer");
                          else navigateTo(item.url, item.title);
                        }}
                        className="text-sm sm:text-base font-semibold text-sky-400 group-hover:text-sky-300 group-hover:underline cursor-pointer leading-snug"
                      >
                        {item.title}
                      </h3>

                      {/* Description Snippet */}
                      <p className="text-xs text-white/70 leading-relaxed font-sans">
                        {item.snippet}
                      </p>

                      {/* Sitelinks (if available) */}
                      {item.sitelinks && item.sitelinks.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 pt-2 mt-1 border-t border-white/5">
                          {item.sitelinks.map((sl, slIdx) => (
                            <div
                              key={slIdx}
                              onClick={() => navigateTo(sl.url, sl.title)}
                              className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer text-xs transition"
                            >
                              <span className="font-semibold text-sky-400 hover:underline block text-[11px]">
                                {sl.title}
                              </span>
                              {sl.snippet && (
                                <span className="text-[10px] text-white/45 truncate block">
                                  {sl.snippet}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Right Column: Google / Safari Knowledge Graph Panel */}
              {activeKnowledgePanel && (
                <div className="lg:col-span-5 self-start">
                  <div className="bg-[#151926] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 sticky top-4">
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-accent tracking-wider">
                          Knowledge Panel
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 font-semibold">
                          <GIconCheck size={10} /> Verified
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                        {activeKnowledgePanel.title}
                      </h2>
                      <p className="text-xs text-white/50">{activeKnowledgePanel.subtitle}</p>
                    </div>

                    {/* Bio Description */}
                    <p className="text-xs text-white/75 leading-relaxed border-t border-white/5 pt-3">
                      {activeKnowledgePanel.description}
                    </p>

                    {/* Quick Attributes */}
                    <div className="space-y-1.5 text-xs border-t border-white/5 pt-3">
                      {activeKnowledgePanel.attributes.map((attr, aIdx) => (
                        <div key={aIdx} className="flex justify-between items-start gap-2">
                          <span className="text-white/40 font-medium shrink-0 text-[11px]">{attr.label}:</span>
                          <span className="text-white/85 text-right text-[11px] font-sans font-medium">
                            {attr.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Tag Pills */}
                    <div className="flex flex-wrap gap-1 border-t border-white/5 pt-3">
                      {activeKnowledgePanel.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Action Links */}
                    <div className="flex items-center gap-2 border-t border-white/5 pt-3">
                      {activeKnowledgePanel.links.map((link, lIdx) => (
                        <button
                          key={lIdx}
                          onClick={() => {
                            if (link.url.startsWith("http")) window.open(link.url, "_blank");
                            else if (link.url.includes("pdf")) openApp("pdf-viewer");
                            else navigateTo(link.url, link.label);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-accent text-accent-contrast text-xs font-semibold hover:brightness-110 active:scale-95 transition cursor-pointer"
                        >
                          <span>{link.label}</span>
                          <GIconExternalLink size={10} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: SIMULATED WEBPAGE (mendoza.dev / about / experience / skills / system) */}
        {!activeTab.url.startsWith("safari://") &&
          !activeTab.url.startsWith("google://") && (
            <div className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
              {/* WEBPAGE 3A: ABOUT ME / PROFILE */}
              {(activeTab.url.includes("mendoza.dev/about") || activeTab.url === "https://mendoza.dev") && (
                <div className="space-y-6">
                  {/* Hero Header */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-tr from-white/[0.04] to-accent/10 border border-white/10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs font-semibold">
                      <GIconGraduationCap size={14} />
                      <span>Magna Cum Laude · BSIT Graduate</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                      James Emmanuel E. Mendoza
                    </h1>
                    <p className="text-sm sm:text-base text-white/80 leading-relaxed font-sans max-w-2xl">
                      Full-stack software developer based in Tondo, Manila. Crafting resilient enterprise front-end web apps with React 19, Next.js, and TypeScript, backed by robust PHP (Laravel, CodeIgniter, MVC) and real-time Socket.IO architectures.
                    </p>

                    <div className="flex items-center gap-3 pt-2 flex-wrap">
                      <button
                        onClick={() => openApp("pdf-viewer")}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-contrast text-xs font-semibold hover:brightness-110 transition cursor-pointer shadow-md shadow-accent/20"
                      >
                        <GIconFileText size={14} />
                        <span>View Curriculum Vitae (PDF)</span>
                      </button>
                      <button
                        onClick={() => navigateTo("https://mendoza.dev/experience", "Experience")}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition cursor-pointer"
                      >
                        <GIconBriefcase size={14} />
                        <span>Work Experience</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Bio Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Current Role</span>
                      <div className="text-sm font-semibold text-white">Front-End Developer</div>
                      <div className="text-xs text-white/60">Dowinn Group (Enterprise)</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Education</span>
                      <div className="text-sm font-semibold text-white">BS in Information Technology</div>
                      <div className="text-xs text-white/60">National Teachers College (2022–2026)</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Contact</span>
                      <div className="text-sm font-semibold text-white">Tondo, Manila, PH</div>
                      <div className="text-xs text-white/60">0992 543 3570</div>
                    </div>
                  </div>
                </div>
              )}

              {/* WEBPAGE 3B: WORK EXPERIENCE */}
              {activeTab.url.includes("mendoza.dev/experience") && (
                <div className="space-y-5">
                  <div>
                    <h1 className="text-2xl font-bold text-white">Professional Experience</h1>
                    <p className="text-xs text-white/50">Commercial software engineering and enterprise IT support milestones</p>
                  </div>

                  {/* Dowinn Group */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h2 className="text-base font-bold text-white">Dowinn Group</h2>
                        <span className="text-xs text-accent font-semibold">Front-End Developer · Enterprise Portals</span>
                      </div>
                      <span className="text-xs text-white/40 font-mono">Sept 28, 2026 – Present</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-white/75 list-disc pl-4 leading-relaxed">
                      <li>Engineered enterprise operational portals with Next.js, React, and TypeScript.</li>
                      <li>Implemented TanStack Query for advanced server-state caching, optimistic updates, and reduced roundtrips.</li>
                      <li>Automated mobile & web test pipelines with Playwright, Appium, and Selenium.</li>
                      <li>Standardized WCAG accessibility with Tailwind CSS and shadcn/ui design tokens.</li>
                    </ul>
                  </div>

                  {/* Straive */}
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
              {activeTab.url.includes("mendoza.dev/skills") && (
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

              {/* WEBPAGE 3D: PORTFOLIO OS ARCHITECTURE */}
              {activeTab.url === "os://system-info" && (
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
              {activeTab.url === "os://shortcuts" && (
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
            </div>
          )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM STATUS BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-white/5 bg-black/40 text-[10.5px] text-white/40 shrink-0">
        <div className="flex items-center gap-2">
          <span>{isWin ? "Google Chrome" : "Safari"} 128.0</span>
          <span>•</span>
          <span className="text-emerald-400">Online & Secure</span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span>{tabs.length} tabs open</span>
          <span>•</span>
          <span>WebKit/Blink Engine</span>
        </div>
      </div>
    </div>
  );
}
