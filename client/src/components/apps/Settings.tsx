import { useState, useRef, useEffect } from "react";
import { useOS, type LiveShowParticleMode } from "../../store/useOS";
import type { DockPosition, OSMode } from "../../types/os";
import {
  GIconCheck,
  GIconCpu,
  GIconLayoutHeader,
  GIconSliders,
  GIconVolume,
  GIconTrash,
  GIconTerminal,
  GIconSearch,
  GIconNotes,
  GIconCalculator,
  GIconDownload,
  GIconHardDrive,
  GIconMoon,
  GIconSparkles,
  GIconRotateRight,
  GIconPalette,
  GIconUpload,
  GIconPin,
  GIconClose,
  GIconLayoutCells,
  GIconChevronLeft,
  GIconChevronRight,
} from "../icons/GravityIcons";
import { soundFx } from "../../lib/soundFx";
import { getAssetUrl } from "../../lib/assets";
import { useIsMobile } from "../../lib/useMediaQuery";
import { useDesktopStore } from "../../store/useDesktopStore";
import LiveShowWallpaper from "../LiveShowWallpaper";
import { DARK_NATURE_SCENES } from "../../data/darkNatureScenes";

// Preview images for the wallpaper selector — resolved with getAssetUrl for subpath compatibility
const PREVIEW_IMAGES: Record<string, string> = {
  liveshow: DARK_NATURE_SCENES[0].url,
  bg1: getAssetUrl("wallpapers/BG_1.jpg"),
  bg2: getAssetUrl("wallpapers/BG_2.png"),
  bg3: getAssetUrl("wallpapers/BG_3.jpg"),
};

// Fallback gradients if images don't load
const PREVIEW_FALLBACK: Record<string, string> = {
  liveshow: "radial-gradient(ellipse at 50% 90%, #0d2818 0%, #071a10 40%, #030d07 70%, #010402 100%)",
  bg1: "linear-gradient(135deg, #1a1a2e, #16213e)",
  bg2: "linear-gradient(135deg, #0f0c29, #302b63)",
  bg3: "linear-gradient(135deg, #1a1a2e, #2d2b4a)",
  nature: "radial-gradient(ellipse at 50% 90%, #0d2818 0%, #071a10 40%, #030d07 70%, #010402 100%)",
  ocean: "linear-gradient(180deg,#0A1220,#1b2740)",
  galaxy: "radial-gradient(ellipse at 30% 20%,#3a2a70,#0a0818)",
  aurora: "linear-gradient(120deg,#0a1a1f,#123027,#0a1a1f)",
};

const OS_MODE_OPTIONS: { id: OSMode; label: string }[] = [
  { id: "mac", label: "macOS" },
  { id: "win", label: "Windows 11" },
];

const DOCK_POSITION_OPTIONS: { id: DockPosition; label: string }[] = [
  { id: "bottom", label: "Bottom" },
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
];

const SETTINGS_CATEGORIES = [
  { id: "all", label: "All Settings", icon: GIconSliders },
  { id: "appearance", label: "Appearance", icon: GIconPalette },
  { id: "wallpaper", label: "Wallpaper & Glass", icon: GIconSparkles },
  { id: "features", label: "Gravity UI", icon: GIconCpu },
  { id: "widgets", label: "Widgets", icon: GIconLayoutHeader },
  { id: "sound", label: "Sound & Motion", icon: GIconVolume },
  { id: "backup", label: "Storage & Backup", icon: GIconHardDrive },
];

function GroupHeader({
  icon: Icon,
  label,
  rightElement,
}: {
  icon: any;
  label: string;
  rightElement?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 pt-1 pb-0.5 w-full">
      <Icon size={14} className="accent shrink-0" />
      <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em] text-white/50 shrink-0">
        {label}
      </h2>
      <div className="flex-1 h-px bg-white/10" />
      {rightElement && <div className="shrink-0 flex items-center gap-1.5">{rightElement}</div>}
    </div>
  );
}

function ToggleRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <label
      onClick={() => soundFx.playClick()}
      className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-all cursor-pointer select-none"
    >
      <span className="text-xs sm:text-sm text-white/80">{label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          soundFx.playClick();
          onToggle();
        }}
        className={`w-10 sm:w-11 h-6 rounded-full relative transition-all duration-300 shrink-0 cursor-pointer ${checked ? "bg-accent" : "bg-white/20"}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 aspect-square shrink-0 rounded-full bg-white transition-all duration-300 shadow-md ${
            checked ? "left-[18px] sm:left-5.5" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

export default function Settings() {
  const {
    wallpaper,
    setWallpaper,
    wallpapers,
    reduceMotion,
    toggleMotion,
    particlesEnabled,
    toggleParticles,
    osMode,
    setOsMode,
    dockPosition,
    setDockPosition,
    weatherLoc,
    setWeatherLoc,
    chatSound,
    toggleChatSound,
    systemSounds,
    toggleSystemSounds,
    compact,
    toggleCompact,
    glassAlpha,
    setGlassAlpha,
    windowIndicators,
    toggleWindowIndicators,
    resetDefaults,
    openApp,
    openSpotlight,
    notify,
    themeMode,
    setThemeMode,
    accent,
    setAccent,
    accents,
    harmonizedPalette,
    resetDockApps,
    persistDockOrder,
    setPersistDockOrder,
    liveShowEnabled,
    setLiveShowEnabled,
    liveShowTimeout,
    setLiveShowTimeout,
    startLiveShow,
    liveWallpaperSceneIndex,
    setLiveWallpaperSceneIndex,
    nextLiveWallpaperScene,
    prevLiveWallpaperScene,
    liveWallpaperAutoCycle,
    setLiveWallpaperAutoCycle,
    lockScreenLiveShow,
    setLockScreenLiveShow,
    liveShowParticleMode,
    setLiveShowParticleMode,
    setSleeping,
  } = useOS();

  const isMobile = useIsMobile();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const [cityDraft, setCityDraft] = useState(weatherLoc.name);
  const [geoStatus, setGeoStatus] = useState("");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [customHex, setCustomHex] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customWallUrl, setCustomWallUrl] = useState("");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      if (el.clientWidth > 0) setContainerWidth(el.clientWidth);
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isNarrow = containerWidth < 540;

  const matchesFilter = (category: string | string[], keywords: string[] = []) => {
    const cats = Array.isArray(category) ? category : [category];
    if (activeCategory !== "all" && !cats.includes(activeCategory)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return keywords.some((k) => k.toLowerCase().includes(q)) || cats.some((c) => c.toLowerCase().includes(q));
  };

  const lookupCity = async () => {
    const q = cityDraft.trim();
    if (!q) return;
    setGeoStatus("Searching…");
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`);
      const data = await res.json();
      const hit = data.results?.[0];
      if (hit) {
        setWeatherLoc({ name: hit.name, lat: hit.latitude, lon: hit.longitude });
        setGeoStatus(`Set to ${hit.name}${hit.country ? ", " + hit.country : ""}`);
        notify("Location Updated", `Weather set to ${hit.name}.`, "update", 3000);
      } else {
        setGeoStatus("City not found");
      }
    } catch {
      setGeoStatus("Lookup failed");
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("Geolocation not supported");
      return;
    }
    setGeoStatus("Locating…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { name: "My location", lat: pos.coords.latitude, lon: pos.coords.longitude };
        setWeatherLoc(loc);
        setCityDraft(loc.name);
        setGeoStatus("Using your current location");
      },
      () => setGeoStatus("Permission denied"),
      { timeout: 8000 }
    );
  };

  const getWallpaperInfo = (id: string) => {
    const info: Record<string, { name: string; desc: string }> = {
      liveshow: { name: "Dark Nature Live Show", desc: "Dynamic rotating scenes with animated forest fireflies" },
      bg1: { name: "Balloon Sunset", desc: "Hot air balloons at dusk" },
      bg2: { name: "Cyborg Dark", desc: "Dark cyborg portrait" },
      bg3: { name: "Balloon Night", desc: "Balloon over moonlit water" },
      nature: { name: "Dark Nature Aesthetic", desc: "Deep emerald forest mist & botanical canopy gradient" },
      ocean: { name: "Ocean Night", desc: "Calm ocean under stars" },
      galaxy: { name: "Galaxy", desc: "Deep space nebula" },
      aurora: { name: "Aurora Coast", desc: "Northern lights display" },
    };
    if (info[id]) return info[id];
    if (id?.startsWith("data:") || id?.startsWith("http") || id?.startsWith("blob:")) {
      return { name: "Custom Wallpaper", desc: "Custom uploaded background image" };
    }
    return { name: id, desc: "" };
  };

  const handleImageError = (id: string) => setImageErrors((prev) => ({ ...prev, [id]: true }));

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full bg-[#0a0a0f] text-white select-none overflow-hidden"
    >
      {/* Mobile / Narrow Sidebar Overlay Backdrop */}
      {isNarrow && mobileSidebar && (
        <div
          onClick={() => setMobileSidebar(false)}
          className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* Left Sidebar (Files-style category sidebar) */}
      <div
        className={`${
          isNarrow
            ? `absolute inset-y-0 left-0 z-40 w-56 bg-[#0c101c] shadow-2xl transition-transform duration-200 ${
                mobileSidebar ? "translate-x-0" : "-translate-x-full pointer-events-none"
              }`
            : "relative inset-y-0 w-48 sm:w-56 bg-white/[0.02]"
        } border-r border-white/10 p-3 shrink-0 flex flex-col justify-between overflow-y-auto no-scrollbar`}
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-white/40 mb-2 px-1">
              <span className="flex items-center gap-1.5 font-semibold">
                <GIconPin size={11} className="text-amber-400" /> Preferences
              </span>
              {isNarrow && (
                <button
                  onClick={() => setMobileSidebar(false)}
                  className="text-white/50 hover:text-white p-1 rounded-md hover:bg-white/10 cursor-pointer"
                  title="Close Sidebar"
                >
                  <GIconClose size={12} />
                </button>
              )}
            </div>

            <div className="space-y-0.5">
              {SETTINGS_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      soundFx.playClick();
                      setActiveCategory(cat.id);
                      if (isNarrow) setMobileSidebar(false);
                    }}
                    className={`w-full flex items-center gap-2 text-left text-xs px-2.5 py-2 rounded-xl transition cursor-pointer ${
                      isSelected
                        ? "bg-accent/20 text-accent font-semibold border border-accent/30 shadow-xs"
                        : "hover:bg-white/8 text-white/70 hover:text-white"
                    }`}
                  >
                    <Icon size={14} className={isSelected ? "text-accent" : "text-white/40 shrink-0"} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Controls Section in Sidebar */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2 px-1 font-semibold">
              Quick Modes
            </div>
            <div className="space-y-1">
              {/* Theme Quick Switcher */}
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  const next = themeMode === "night" ? "dark" : "night";
                  setThemeMode(next);
                  notify(
                    next === "night" ? "Night Mode Activated" : "Dark Mode Activated",
                    next === "night" ? "Pitch black OLED enabled." : "Luminous slate glass enabled.",
                    "success",
                    2200
                  );
                }}
                className="w-full flex items-center justify-between text-left text-xs px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <GIconMoon size={12} className="text-accent shrink-0" />
                  <span className="text-white/80 truncate text-[11px]">Theme</span>
                </div>
                <span className="text-[10px] font-mono text-accent font-semibold">
                  {themeMode === "night" ? "OLED" : "Slate"}
                </span>
              </button>

              {/* OS Style Quick Switcher */}
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  const next = osMode === "mac" ? "win" : "mac";
                  setOsMode(next);
                }}
                className="w-full flex items-center justify-between text-left text-xs px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <GIconSliders size={12} className="text-accent shrink-0" />
                  <span className="text-white/80 truncate text-[11px]">Desktop</span>
                </div>
                <span className="text-[10px] font-mono text-white/60 font-semibold">
                  {osMode === "mac" ? "macOS" : "Win 11"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer Info */}
        <div className="pt-2 border-t border-white/5 space-y-1">
          <div className="flex items-center justify-between px-1 text-[10px] text-white/40 font-mono">
            <span>Portfolio OS</span>
            <span>v2.0</span>
          </div>
          <div className="flex items-center gap-1.5 px-1 text-[10px] text-white/30 truncate">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: `rgb(${accent})` }}
            />
            <span className="truncate">{harmonizedPalette?.hex || "#3b82f6"}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#0a0a0f]">
        {/* Top Header Bar */}
        <div className="p-2.5 sm:p-4 border-b border-white/10 bg-[#0a0a0f]/95 backdrop-blur-md shrink-0 flex items-center justify-between gap-2 z-10 shadow-sm">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isNarrow && (
              <button
                type="button"
                onClick={() => setMobileSidebar((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs cursor-pointer shrink-0 transition"
                title="Toggle Categories Sidebar"
              >
                <GIconLayoutCells size={13} className="text-accent" />
                <span className="text-[11px] font-medium hidden xs:inline">Sidebar</span>
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xs sm:text-base font-semibold text-white truncate flex items-center gap-1 sm:gap-1.5">
                <span className="text-white/40 font-normal hidden sm:inline">Settings</span>
                <span className="text-white/30 hidden sm:inline">/</span>
                <span className="text-white truncate">
                  {SETTINGS_CATEGORIES.find((c) => c.id === activeCategory)?.label || "All Settings"}
                </span>
              </h1>
              <p className="text-[10px] text-white/45 hidden md:block truncate">
                Personalize wallpaper, accents, and system preferences.
              </p>
            </div>
          </div>

          {/* Search Filter */}
          <div className="relative shrink-0 max-w-[140px] xs:max-w-[180px] sm:max-w-xs">
            <GIconSearch size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-24 xs:w-36 sm:w-48 pl-7 pr-6 py-1 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-accent focus:bg-white/10 outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                title="Clear filter"
              >
                <GIconClose size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Category Quick-Chips for Mobile & Narrow Containers */}
        {isNarrow && (
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10 bg-[#0c101c]/90 overflow-x-auto no-scrollbar shrink-0 shadow-inner">
            {SETTINGS_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setActiveCategory(cat.id);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs shrink-0 transition cursor-pointer ${
                    isSelected
                      ? "bg-accent text-accent-contrast font-semibold shadow-xs"
                      : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10"
                  }`}
                >
                  <Icon size={12} className={isSelected ? "text-accent-contrast" : "text-white/50"} />
                  <span className="text-[11px] whitespace-nowrap">{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Scrollable Content Pane */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-5">

      {/* ============ APPEARANCE ============ */}
      {matchesFilter("appearance", ["appearance", "desktop style", "macos", "windows"]) && (
        <section className="space-y-2">
          <GroupHeader
            icon={GIconSliders}
            label="Appearance & Desktop Style"
            rightElement={
              <span className="text-[10px] font-mono text-accent font-semibold bg-accent/15 px-2 py-0.5 rounded-full border border-accent/25">
                {osMode === "mac" ? "macOS Sonoma" : "Windows 11"}
              </span>
            }
          />
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {OS_MODE_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  soundFx.playClick();
                  setOsMode(o.id);
                }}
                className={`flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                  osMode === o.id
                    ? "border-accent bg-accent/15 text-white shadow-lg shadow-accent/10"
                    : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-white/20 hover:bg-white/10"
                }`}>
                <span className="font-medium">{o.label}</span>
                {osMode === o.id && <GIconCheck size={14} className="text-accent shrink-0" />}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ============ THEME MODE: DARK & NIGHT ============ */}
      {matchesFilter("appearance", ["theme mode", "dark", "night", "oled", "slate"]) && (
        <section className="space-y-2">
          <GroupHeader
            icon={GIconMoon}
            label="Theme Mode"
            rightElement={
              <span className="text-[10px] font-mono text-accent font-semibold capitalize bg-accent/15 px-2 py-0.5 rounded-full border border-accent/25">
                {themeMode === "night" ? "Night Mode · OLED" : "Dark Mode · Slate"}
              </span>
            }
          />
          <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
            Switch between balanced Slate dark mode for ambient daylight and Obsidian night mode for low-light eye comfort.
          </p>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setThemeMode("dark");
                notify("Dark Mode Activated", "Deep charcoal and luminous slate glass enabled.", "success", 2600);
              }}
              className={`group text-left p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                themeMode === "dark"
                  ? "border-accent bg-accent/15 ring-2 ring-accent/30 shadow-lg shadow-accent/10"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
              }`}
            >
              {/* Visual Mini-Preview */}
              <div className="h-14 sm:h-16 rounded-xl bg-[#0f172a] border border-white/15 p-2 mb-2.5 flex flex-col justify-between shadow-inner relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400/80" />
                    <div className="w-2 h-2 rounded-full bg-amber-400/80" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
                  </div>
                  <div className="w-8 h-1.5 rounded-full bg-white/20" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-accent" />
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 w-3/4 rounded bg-white/30" />
                    <div className="h-1 w-1/2 rounded bg-white/15" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <GIconMoon size={14} className={themeMode === "dark" ? "text-accent" : "text-white/60"} />
                  <span className="text-xs sm:text-sm font-semibold text-white truncate">Dark Mode</span>
                </div>
                {themeMode === "dark" && (
                  <span className="w-4 h-4 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <GIconCheck size={10} className="text-accent-contrast" />
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/45 mt-0.5 line-clamp-1">Deep Slate Glass · Day & Night</p>
            </button>

            {/* Night Mode Card */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setThemeMode("night");
                notify("Night Mode Activated", "Midnight OLED pitch black glass with zero glare.", "success", 2600);
              }}
              className={`group text-left p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                themeMode === "night"
                  ? "border-accent bg-accent/15 ring-2 ring-accent/30 shadow-lg shadow-accent/10"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
              }`}
            >
              {/* Visual Mini-Preview */}
              <div className="h-14 sm:h-16 rounded-xl bg-[#020408] border border-white/10 p-2 mb-2.5 flex flex-col justify-between shadow-inner relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/60" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/60" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
                  </div>
                  <div className="w-8 h-1.5 rounded-full bg-white/10" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-accent shadow-[0_0_8px_rgba(var(--accent),0.5)]" />
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 w-3/4 rounded bg-white/20" />
                    <div className="h-1 w-1/2 rounded bg-white/10" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <GIconSparkles size={14} className={themeMode === "night" ? "text-accent" : "text-white/60"} />
                  <span className="text-xs sm:text-sm font-semibold text-white truncate">Night Mode</span>
                </div>
                {themeMode === "night" && (
                  <span className="w-4 h-4 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <GIconCheck size={10} className="text-accent-contrast" />
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/45 mt-0.5 line-clamp-1">Pitch Black OLED · Zero Glare</p>
            </button>
          </div>
        </section>
      )}

      {/* ============ SYSTEM ACCENT PALETTE ============ */}
      {matchesFilter("appearance", ["system accent palette", "accent", "color", "palette", "hex", "wcag"]) && (
        <section className="space-y-3">
          <GroupHeader
            icon={GIconPalette}
            label="System Accent Palette"
            rightElement={
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0"
                  style={{ backgroundColor: `rgb(${accent})` }}
                />
                <span className="text-[10px] font-mono text-white/40">
                  {harmonizedPalette?.hex || "#3b82f6"}
                </span>
              </div>
            }
          />
          <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
            Set your system accent color. Adaptive UI harmonizes any hue for WCAG readability across all apps.
          </p>

        {/* Preset Swatches Grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(58px,1fr))] sm:grid-cols-9 gap-2">
          {accents.map((a) => {
            const isSelected = accent === a.value;
            return (
              <button
                key={a.value}
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setAccent(a.value);
                  setCustomHex("");
                }}
                className={`group relative flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-accent bg-accent/20 ring-2 ring-accent/50 scale-105 shadow-md shadow-accent/25"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:scale-105"
                }`}
                title={a.name}
              >
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-md flex items-center justify-center relative transition-transform"
                  style={{
                    backgroundColor: `rgb(${a.value})`,
                    boxShadow: isSelected ? `0 0 12px rgba(${a.value.split(" ").join(", ")}, 0.6)` : undefined,
                  }}
                >
                  {isSelected && (
                    <GIconCheck
                      size={14}
                      style={{ color: harmonizedPalette?.contrastText || "#ffffff" }}
                    />
                  )}
                </div>
                <span className="text-[9px] text-white/70 truncate w-full text-center leading-tight">
                  {a.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Hex / Color Picker & Live Adaptive Readability Preview */}
        <div className="p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-white/90">Custom Accent & Live Readability Preview</span>
              <p className="text-[10px] text-white/45">Pick any shade — text contrast & UI borders adapt automatically</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Native Color Dropper Button */}
              <label
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 cursor-pointer text-xs transition active:scale-95 shrink-0 overflow-hidden"
                title="Open system color picker"
              >
                <input
                  type="color"
                  value={harmonizedPalette?.hex || "#3b82f6"}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    setAccent(e.target.value);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto"
                />
                <span
                  className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0 pointer-events-none"
                  style={{ backgroundColor: `rgb(${accent})` }}
                />
                <span className="text-[11px] font-medium text-white/80 pointer-events-none">Picker</span>
              </label>

              {/* Hex Input */}
              <div className="relative">
                <input
                  type="text"
                  maxLength={7}
                  placeholder="#3B82F6"
                  value={customHex || harmonizedPalette?.hex || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomHex(val);
                    if (/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)) {
                      setAccent(val);
                    }
                  }}
                  className="w-24 px-2 py-1.5 bg-black/40 border border-white/15 rounded-xl text-white text-xs font-mono outline-none focus:border-accent focus:ring-1 focus:ring-accent transition text-center uppercase"
                />
              </div>
            </div>
          </div>

          {/* Interactive Live Component Proof: Shows how buttons and badges adapt */}
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Live Primary Button Preview */}
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-xl bg-accent text-xs font-bold shadow-md shadow-accent/25 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <GIconCheck size={12} />
                <span>Primary Action</span>
              </button>

              {/* Live Subtle Badge Preview */}
              <span className="px-2.5 py-1 rounded-xl bg-accent-subtle border border-accent-subtle text-accent text-xs font-semibold">
                Badge Tag
              </span>
            </div>

            {/* WCAG Accessibility Metrics */}
            <div className="flex items-center gap-2 text-[10px] text-white/50 font-mono">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 font-semibold">
                WCAG {harmonizedPalette?.wcagContrast || "7.2:1"}
              </span>
              <span className="text-white/40">
                Text: <span className="font-semibold text-white/80">{harmonizedPalette?.contrastText === "#0b0f19" ? "Dark (#0b0f19)" : "Light (#ffffff)"}</span>
              </span>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Dock position - only applicable and visible on desktop/tablet views */}
      {!isMobile && osMode === "mac" && matchesFilter("appearance", ["dock position", "dock", "bottom", "left", "right"]) && (
        <section className="hidden sm:block space-y-2">
          <GroupHeader
            icon={GIconSliders}
            label="Dock Position"
            rightElement={
              <span className="text-[10px] font-mono text-white/40 capitalize">{dockPosition}</span>
            }
          />
          <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
            Move the Dock to the bottom, left, or right of the screen.
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {DOCK_POSITION_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  soundFx.playClick();
                  setDockPosition(o.id);
                }}
                className={`flex flex-col items-center gap-1.5 px-2 py-2.5 sm:py-3 rounded-xl border text-xs transition-all duration-200 cursor-pointer ${
                  dockPosition === o.id
                    ? "border-accent bg-accent/15 text-white shadow-lg shadow-accent/10"
                    : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-white/20 hover:bg-white/10"
                }`}>
                <div className="w-10 h-7 rounded-md border border-white/20 relative bg-black/20">
                  <div
                    className={`absolute bg-accent/80 rounded-sm ${
                      o.id === "bottom" ? "left-1 right-1 bottom-0.5 h-1.5" : o.id === "left" ? "left-0.5 top-1 bottom-1 w-1.5" : "right-0.5 top-1 bottom-1 w-1.5"
                    }`}
                  />
                </div>
                <span className="font-medium">{o.label}</span>
                {dockPosition === o.id && <GIconCheck size={11} className="text-accent" />}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Dock & Desktop Applications Dragging & Positions */}
      {matchesFilter("appearance", ["dock", "desktop", "positions", "dragging", "reset dock"]) && (
        <section className="space-y-3">
          <GroupHeader icon={GIconLayoutHeader} label="Dock & Desktop App Positions" />
          <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
            Drag apps on the Dock to customize their sequence. Reset dragging positions back to original portfolio defaults anytime.
          </p>

          <div className="p-3 sm:p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3.5">
            {/* Reset Dock Apps Order Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white">Redo Dragging Positions (Dock)</div>
                <div className="text-[11px] text-white/50">
                  Restore all Dock applications back to their default portfolio sequence
                </div>
              </div>
              <button
                onClick={() => {
                  soundFx.playPop();
                  resetDockApps();
                  notify("Dock Positions Reset", "Restored applications to their original positions.", "update");
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-accent-contrast text-xs font-semibold shadow-sm hover:brightness-110 active:scale-95 transition cursor-pointer shrink-0"
              >
                <GIconRotateRight size={13} />
                <span>Reset Dock Positions</span>
              </button>
            </div>

            {/* Reset Desktop Icons Layout */}
            <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="text-xs font-medium text-white/90">Reset Desktop Icons Layout</div>
                <div className="text-[11px] text-white/40">
                  Redo all dragged desktop icons, folders, and widgets back to default coordinates
                </div>
              </div>
              <button
                onClick={() => {
                  soundFx.playPop();
                  useDesktopStore.getState().resetDesktop();
                  notify("Desktop Reset", "Restored desktop icons back to default positions.", "update");
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-xs text-white/80 hover:text-white transition cursor-pointer shrink-0"
              >
                <GIconRotateRight size={12} />
                <span>Reset Desktop</span>
              </button>
            </div>

            {/* Toggle: Persist custom dock order across sessions */}
            <div className="pt-3 border-t border-white/5">
              <ToggleRow
                label="Remember custom dock order across browser sessions"
                checked={persistDockOrder}
                onToggle={() => setPersistDockOrder(!persistDockOrder)}
              />
              <p className="text-[10px] text-white/35 mt-1 ml-1">
                When turned off, opening the OS in a new session will always restore original default positions.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Window Controls Indicators (macOS Only — hidden in Windows Settings) */}
      {osMode === "mac" && matchesFilter("appearance", ["window", "indicators", "traffic lights", "buttons", "glyphs"]) && (
        <section className="space-y-2">
          <GroupHeader
            icon={GIconSliders}
            label="Window Button Indicators"
            rightElement={
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors ${
                  windowIndicators
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-white/5 text-white/50 border-white/10"
                }`}
              >
                {windowIndicators ? "Glyphs Visible" : "Minimal Dots"}
              </span>
            }
          />
          <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
            Show permanent action glyphs (×, −, +) inside window traffic lights for faster targeting.
          </p>

          <div
            onClick={() => {
              soundFx.playClick();
              toggleWindowIndicators();
            }}
            className="group relative rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/[0.07] p-3.5 sm:p-4.5 transition-all cursor-pointer focus-stroke select-none overflow-hidden"
          >
            {/* Subtle gradient glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Live Interactive Window Bar Preview */}
            <div className="relative mb-3.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3 shadow-inner">
              {/* macOS Traffic Lights Live Preview */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Close Red */}
                <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] border border-[#e0443e]/80 flex items-center justify-center shadow-xs">
                  <svg
                    width="7"
                    height="7"
                    viewBox="0 0 10 10"
                    fill="none"
                    stroke="#4a0002"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    className={`transition-opacity duration-200 ${windowIndicators ? "opacity-90" : "opacity-0 group-hover:opacity-60"}`}
                  >
                    <line x1="2" y1="2" x2="8" y2="8" />
                    <line x1="8" y1="2" x2="2" y2="8" />
                  </svg>
                </div>
                {/* Minimize Yellow */}
                <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] border border-[#dea123]/80 flex items-center justify-center shadow-xs">
                  <svg
                    width="7"
                    height="7"
                    viewBox="0 0 10 10"
                    fill="none"
                    stroke="#613600"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className={`transition-opacity duration-200 ${windowIndicators ? "opacity-90" : "opacity-0 group-hover:opacity-60"}`}
                  >
                    <line x1="1.5" y1="5" x2="8.5" y2="5" />
                  </svg>
                </div>
                {/* Maximize Green */}
                <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f] border border-[#1aab29]/80 flex items-center justify-center shadow-xs">
                  <svg
                    width="7"
                    height="7"
                    viewBox="0 0 10 10"
                    fill="#004800"
                    className={`transition-opacity duration-200 ${windowIndicators ? "opacity-90" : "opacity-0 group-hover:opacity-60"}`}
                  >
                    <path d="M 2 3.8 L 2 8 L 6.2 8 Z M 3.8 2 L 8 2 L 8 6.2 Z" />
                  </svg>
                </div>
              </div>

              {/* Window Header Title */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/60 truncate">
                <span className="truncate">Window Header — Live Preview</span>
              </div>

              {/* Badge */}
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors shrink-0 ${
                  windowIndicators
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-white/5 text-white/50 border-white/10"
                }`}
              >
                {windowIndicators ? "Glyphs Visible" : "Minimal Dots"}
              </span>
            </div>

            {/* Information and Toggle Button */}
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-white/95">
                    Show Window Action Glyphs
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent/20 text-accent font-medium border border-accent/30">
                    Traffic Lights
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-white/45 leading-relaxed">
                  Display close (×), minimize (−), and expand (+) symbols permanently inside window control dots.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundFx.playClick();
                  toggleWindowIndicators();
                }}
                className={`w-11 sm:w-12 h-6.5 rounded-full relative transition-all duration-300 shrink-0 cursor-pointer ${
                  windowIndicators
                    ? "bg-[#0091ff] shadow-[0_0_12px_rgba(0,145,255,0.4)]"
                    : "bg-white/20 hover:bg-white/25"
                }`}
                aria-label="Toggle window button indicators"
              >
                <span
                  className={`absolute top-0.75 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                    windowIndicators ? "left-[22px] sm:left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============ WALLPAPER ============ */}
      {matchesFilter("wallpaper", ["wallpaper", "background", "desktop background", "image", "upload"]) && (
        <section className="space-y-3">
          <GroupHeader
            icon={GIconSparkles}
            label="Desktop Wallpaper"
            rightElement={
              <span className="text-[10px] font-mono text-white/40 capitalize">
                {getWallpaperInfo(wallpaper).name}
              </span>
            }
          />
          <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
            Choose a preset background or upload your own custom wallpaper for your desktop.
          </p>

          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
            {wallpapers.map((w) => {
              const info = getWallpaperInfo(w.id);
              const isSelected = wallpaper === w.id;
              const imageUrl = PREVIEW_IMAGES[w.id];
              const hasError = imageErrors[w.id];
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    soundFx.playClick();
                    setWallpaper(w.id);
                  }}
                  className="group text-left cursor-pointer"
                >
                  <div
                    className={`relative aspect-video rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                      isSelected ? "border-accent shadow-lg shadow-accent/20 scale-[1.02]" : "border-white/10 group-hover:border-white/30 group-hover:scale-[1.02]"
                    }`}>
                    {imageUrl && !hasError ? (
                      <img src={imageUrl} alt={info.name} className="w-full h-full object-cover" loading="lazy" onError={() => handleImageError(w.id)} />
                    ) : (
                      <div className="w-full h-full" style={{ background: PREVIEW_FALLBACK[w.id] || "#0a0a0f" }} />
                    )}
                    <div
                      className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                      }`}
                    />
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 aspect-square shrink-0 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/40 z-10">
                        <GIconCheck size={11} className="text-accent-contrast" />
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 space-y-0.5">
                    <div className="text-[10px] sm:text-[11px] font-medium text-white/80 group-hover:text-white transition-colors">{info.name}</div>
                    <div className="text-[8px] sm:text-[9px] text-white/30 group-hover:text-white/40 transition-colors truncate">{info.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dedicated Live Wallpaper Scene Switcher & Auto-Cycle Controls (when Live Show is chosen) */}
          {wallpaper === "liveshow" && (
            <div className="p-3.5 sm:p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-md space-y-3 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-semibold text-emerald-300">
                      Active Scene: {DARK_NATURE_SCENES[liveWallpaperSceneIndex]?.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      {liveWallpaperSceneIndex + 1} of {DARK_NATURE_SCENES.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 truncate">
                    {DARK_NATURE_SCENES[liveWallpaperSceneIndex]?.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      prevLiveWallpaperScene();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-white/90 font-medium transition active:scale-95 cursor-pointer"
                    title="Previous Scene"
                  >
                    <GIconChevronLeft size={13} />
                    <span>Prev</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      nextLiveWallpaperScene();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent text-accent-contrast text-xs font-semibold shadow-md shadow-accent/25 hover:brightness-110 transition active:scale-95 cursor-pointer"
                    title="Next Scene"
                  >
                    <span>Next Wallpaper</span>
                    <GIconChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* Scene Selector Grid: click any scene to immediately change the wallpaper */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-white/40">
                  Switch Wallpaper Scene
                </span>
                <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 gap-2">
                  {DARK_NATURE_SCENES.map((scene, idx) => (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setLiveWallpaperSceneIndex(idx);
                        notify("Live Wallpaper Changed", scene.title, "update", 2200);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        liveWallpaperSceneIndex === idx
                          ? "border-emerald-400 bg-emerald-500/20 shadow-md ring-1 ring-emerald-400/40 text-white"
                          : "border-white/10 bg-black/40 hover:border-white/20 hover:bg-white/5 text-white/70 hover:text-white"
                      }`}
                    >
                      <div className="text-[11px] font-semibold truncate">
                        {scene.title}
                      </div>
                      <div className="text-[9px] text-white/40 truncate">
                        {scene.subtitle}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-cycle toggle */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-white/90 font-medium">Automatic Scene Rotation</span>
                  <p className="text-[10px] text-white/40">Automatically transitions to the next wallpaper scene every 16 seconds</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setLiveWallpaperAutoCycle(!liveWallpaperAutoCycle);
                  }}
                  className={`w-10 sm:w-11 h-6 rounded-full relative transition-all duration-300 shrink-0 cursor-pointer ${
                    liveWallpaperAutoCycle ? "bg-accent" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                      liveWallpaperAutoCycle ? "left-[18px] sm:left-5.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Custom Wallpaper Upload & URL Input */}
          <div className="p-3 sm:p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-white/90">Custom Desktop Wallpaper</span>
                <p className="text-[10px] text-white/45">Upload a local image or paste a web wallpaper URL</p>
              </div>
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 cursor-pointer text-xs transition active:scale-95 shrink-0 text-white font-medium">
                <GIconUpload size={13} className="text-accent" />
                <span>Upload Wallpaper</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 12 * 1024 * 1024) {
                      notify("File Too Large", "Please select an image smaller than 12MB.", "delete");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const result = event.target?.result as string;
                      if (result) {
                        soundFx.playClick();
                        setWallpaper(result);
                        notify("Custom Wallpaper Applied", "Your wallpaper has been updated.", "update");
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
              <input
                type="text"
                placeholder="Or paste wallpaper image URL (https://…)"
                value={customWallUrl}
                onChange={(e) => setCustomWallUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customWallUrl.trim()) {
                    soundFx.playClick();
                    setWallpaper(customWallUrl.trim());
                    notify("Custom Wallpaper Applied", "Applied wallpaper from URL.", "update");
                    setCustomWallUrl("");
                  }
                }}
                className="flex-1 min-w-0 px-3 py-1.5 bg-black/40 border border-white/15 rounded-xl text-white text-xs outline-none focus:border-accent transition placeholder:text-white/25"
              />
              <button
                type="button"
                onClick={() => {
                  if (customWallUrl.trim()) {
                    soundFx.playClick();
                    setWallpaper(customWallUrl.trim());
                    notify("Custom Wallpaper Applied", "Applied wallpaper from URL.", "update");
                    setCustomWallUrl("");
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-accent text-accent-contrast text-xs font-semibold hover:brightness-110 active:scale-95 transition cursor-pointer shrink-0"
              >
                Apply
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============ LIVE SHOW WALLPAPER (DARK NATURE) ============ */}
      {matchesFilter("wallpaper", ["liveshow", "live show", "screensaver", "dark nature", "inactivity"]) && (
        <section className="space-y-3">
          <GroupHeader
            icon={GIconSparkles}
            label="Live Show Wallpaper (Dark Nature)"
            rightElement={
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors ${
                  liveShowEnabled
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-white/5 text-white/40 border-white/10"
                }`}
              >
                {liveShowEnabled ? `Active after ${liveShowTimeout}m` : "Disabled"}
              </span>
            }
          />
          <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
            When inactive for {liveShowTimeout} minutes, plays a cinematic dark nature aesthetic live show with {liveShowParticleMode === "stars" ? "twinkling celestial stars" : liveShowParticleMode === "embers" ? "warm glowing embers" : liveShowParticleMode === "off" ? "clean scenic views" : "floating forest fireflies"}, hiding all widgets and applications.
          </p>

          <div className="p-3.5 sm:p-4.5 rounded-2xl border border-white/10 bg-white/5 space-y-3.5">
            {/* Live Interactive Mini-Preview inside Settings */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/15 shadow-inner">
              <LiveShowWallpaper isMini={true} />
            </div>

            {/* Inactivity Live Show Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5 min-w-0 pr-3">
                <span className="text-xs sm:text-sm font-semibold text-white/95">
                  Inactivity Live Show
                </span>
                <p className="text-[10px] sm:text-[11px] text-white/45">
                  Auto-fade into dark nature aesthetic after period of inactivity
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setLiveShowEnabled(!liveShowEnabled);
                }}
                className={`w-11 sm:w-12 h-6.5 rounded-full relative transition-all duration-300 shrink-0 cursor-pointer ${
                  liveShowEnabled
                    ? "bg-accent shadow-[0_0_12px_rgba(var(--accent),0.4)]"
                    : "bg-white/20 hover:bg-white/25"
                }`}
              >
                <span
                  className={`absolute top-0.75 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                    liveShowEnabled ? "left-[22px] sm:left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Inactivity Duration Selector */}
            <div className="pt-2.5 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/80">
                <span className="text-[11px] font-medium text-white/70">Inactivity Timeout:</span>
                <span className="text-[11px] font-mono text-accent font-semibold">
                  {liveShowTimeout === 0 ? "Never" : `${liveShowTimeout} Minutes`}
                </span>
              </div>
              <div className="grid grid-cols-3 min-[500px]:grid-cols-6 gap-1.5">
                {[
                  { value: 1, label: "1 min", tag: "Test" },
                  { value: 2, label: "2 mins" },
                  { value: 5, label: "5 mins", tag: "Default" },
                  { value: 10, label: "10 mins" },
                  { value: 15, label: "15 mins" },
                  { value: 0, label: "Never" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setLiveShowTimeout(opt.value);
                      if (opt.value === 0) setLiveShowEnabled(false);
                      else setLiveShowEnabled(true);
                    }}
                    className={`px-1.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer text-center flex flex-col items-center justify-center leading-tight min-w-0 ${
                      liveShowTimeout === opt.value
                        ? "border-accent bg-accent/20 text-white shadow-sm"
                        : "border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="truncate w-full">{opt.label}</span>
                    {opt.tag && (
                      <span className="text-[9px] opacity-70 font-normal tracking-wide">
                        ({opt.tag})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Lock Screen Live Show Toggle */}
            <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
              <div className="space-y-0.5 min-w-0 pr-3">
                <span className="text-xs sm:text-sm font-semibold text-white/95">
                  Lock Screen Live Show
                </span>
                <p className="text-[10px] sm:text-[11px] text-white/45">
                  Play dynamic dark nature aesthetic scenes and floating atmospheric particles on the lock screen
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setLockScreenLiveShow(!lockScreenLiveShow);
                }}
                className={`w-11 sm:w-12 h-6.5 rounded-full relative transition-all duration-300 shrink-0 cursor-pointer ${
                  lockScreenLiveShow
                    ? "bg-accent shadow-[0_0_12px_rgba(var(--accent),0.4)]"
                    : "bg-white/20 hover:bg-white/25"
                }`}
              >
                <span
                  className={`absolute top-0.75 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                    lockScreenLiveShow ? "left-[22px] sm:left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Live Show Atmospheric Particle Style & Toggle */}
            <div className="pt-2.5 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/80">
                <div className="flex items-center gap-1.5">
                  <GIconSparkles size={12} className="text-emerald-400" />
                  <span className="text-[11px] font-medium text-white/70">Atmospheric Particles:</span>
                </div>
                <span className="text-[11px] font-mono text-accent font-semibold capitalize">
                  {liveShowParticleMode === "off" ? "Disabled (Clean)" : liveShowParticleMode}
                </span>
              </div>
              <div className="grid grid-cols-2 min-[460px]:grid-cols-4 gap-1.5">
                {[
                  { id: "fireflies", label: "Fireflies", desc: "Emerald forest glow", icon: "🌿" },
                  { id: "stars", label: "Stars", desc: "Twinkling night stars", icon: "✨" },
                  { id: "embers", label: "Embers", desc: "Warm golden motes", icon: "🔥" },
                  { id: "off", label: "Off", desc: "Clean nature scenery", icon: "🚫" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setLiveShowParticleMode(opt.id as LiveShowParticleMode);
                    }}
                    className={`px-2 py-2 rounded-xl text-xs font-medium border transition cursor-pointer text-left flex flex-col gap-0.5 min-w-0 ${
                      liveShowParticleMode === opt.id
                        ? "border-emerald-500/50 bg-emerald-500/20 text-white shadow-sm ring-1 ring-emerald-500/30"
                        : "border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span className="text-sm leading-none">{opt.icon}</span>
                      <span className="truncate">{opt.label}</span>
                    </div>
                    <span className="text-[9px] text-white/40 truncate leading-tight">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions: Lock Screen, Set as Desktop, Play Fullscreen */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setSleeping(true);
                  }}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:text-white hover:bg-white/10 text-xs font-semibold active:scale-95 transition cursor-pointer min-w-0"
                  title="Test Lock Screen"
                >
                  <GIconMoon size={13} className="text-emerald-400 shrink-0" />
                  <span className="truncate">Lock Screen</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setWallpaper("liveshow");
                    notify("Live Wallpaper Set", "Dark Nature Live Show is now your desktop wallpaper.", "success", 2600);
                  }}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-95 min-w-0 ${
                    wallpaper === "liveshow"
                      ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                      : "border-white/15 bg-white/5 text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                  title={wallpaper === "liveshow" ? "Currently active desktop wallpaper" : "Set as active desktop wallpaper"}
                >
                  <GIconCheck size={13} className={`shrink-0 ${wallpaper === "liveshow" ? "text-emerald-400" : "text-white/40"}`} />
                  <span className="truncate">{wallpaper === "liveshow" ? "Active Desktop" : "Set as Desktop"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    startLiveShow();
                  }}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-accent text-accent-contrast text-xs font-semibold shadow-md shadow-accent/20 hover:brightness-110 active:scale-95 transition cursor-pointer min-w-0"
                  title="Play screensaver in fullscreen"
                >
                  <GIconSparkles size={13} className="shrink-0" />
                  <span className="truncate">Play Fullscreen</span>
                </button>
              </div>

              <p className="text-[10px] text-white/40 text-center leading-normal">
                Move mouse or press any key anytime to wake back to your desktop.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ============ GLASS INTENSITY ============ */}
      {matchesFilter("wallpaper", ["glass", "intensity", "transparency", "alpha", "blur"]) && (
        <section className="space-y-2">
          <GroupHeader
            icon={GIconSliders}
            label="Glass & Transparency"
            rightElement={
              <span className="text-[10px] font-mono text-accent font-semibold">
                {Math.round(((glassAlpha - 0.3) / (0.95 - 0.3)) * 100)}%
              </span>
            }
          />
          <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
            How solid windows, widgets, and menus look. Lower it to see more of the wallpaper through panels.
          </p>
          <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-white/10 bg-white/5">
            <GIconSliders size={14} className="text-white/40 shrink-0" />
            <input
              type="range"
              min={0.3}
              max={0.95}
              step={0.01}
              value={glassAlpha}
              onChange={(e) => setGlassAlpha(Number(e.target.value))}
              className="flex-1 accent-[rgb(var(--accent))]"
            />
            <span className="text-[10px] font-mono text-white/50 w-9 text-right">{Math.round(((glassAlpha - 0.3) / (0.95 - 0.3)) * 100)}%</span>
          </div>
        </section>
      )}

      {/* ============ NEXT-GEN SYSTEM & GRAVITY UI ============ */}
      {matchesFilter("features", ["terminal", "spotlight", "notes", "calculator", "shell", "gravity ui", "features"]) && (
        <section className="space-y-3">
          <GroupHeader icon={GIconCpu} label="Next-Gen Features & Gravity UI" />
          <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <GIconTerminal size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">Interactive Terminal Shell</h4>
                  <p className="text-[10px] text-white/45 truncate">Full CLI with neofetch, matrix rain, and app launcher</p>
                </div>
              </div>
              <button
                onClick={() => openApp("terminal")}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-emerald-500 hover:text-black font-medium transition-colors text-white cursor-pointer shrink-0"
              >
                Launch
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                  <GIconSearch size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">System Spotlight Search</h4>
                  <p className="text-[10px] text-white/45 truncate">Instant search across apps, files & actions (⌘K / Ctrl+K)</p>
                </div>
              </div>
              <button
                onClick={openSpotlight}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer shrink-0"
              >
                Open
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <GIconNotes size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">Notes & Scratchpad</h4>
                  <p className="text-[10px] text-white/45 truncate">Markdown editor with auto-save & word counts</p>
                </div>
              </div>
              <button
                onClick={() => openApp("notes")}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-amber-500 hover:text-black font-medium transition-colors text-white cursor-pointer shrink-0"
              >
                Open
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <GIconCalculator size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">Interactive Calculator</h4>
                  <p className="text-[10px] text-white/45 truncate">Standard & formula history with keyboard typing</p>
                </div>
              </div>
              <button
                onClick={() => openApp("calculator")}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-cyan-500 hover:text-black font-medium transition-colors text-white cursor-pointer shrink-0"
              >
                Open
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============ WIDGETS ============ */}
      {matchesFilter("widgets", ["widgets", "weather", "photo", "location", "city"]) && (
        <section className="space-y-3">
          <GroupHeader icon={GIconLayoutHeader} label="Widgets" />

          <div className="space-y-2">
            <h3 className="text-[10px] sm:text-xs uppercase tracking-wide text-white/40 font-medium">Photo</h3>
            <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">Paste an image URL to replace the placeholder photo widget on the desktop.</p>
            <input
              defaultValue={useOS.getState().photoUrl}
              onBlur={(e) => useOS.getState().setPhotoUrl(e.target.value.trim())}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-white/5 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white outline-none border border-white/10 focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/40 focus:shadow-[0_0_14px_rgba(0,145,255,0.28)] transition-all placeholder:text-white/20"
            />
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="text-[10px] sm:text-xs uppercase tracking-wide text-white/40 font-medium">Weather location</h3>
            <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
              Currently set to <span className="text-white/70">{weatherLoc.name}</span>. Drives the Weather widget and taskbar chip.
            </p>
            <div className="flex gap-1.5">
              <input
                value={cityDraft}
                onChange={(e) => setCityDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && lookupCity()}
                placeholder="City name…"
                className="flex-1 min-w-0 bg-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none border border-white/10 focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/40 focus:shadow-[0_0_14px_rgba(0,145,255,0.28)] transition-all placeholder:text-white/20"
              />
              <button onClick={lookupCity} className="text-xs px-3 py-2 rounded-lg bg-accent shrink-0 hover:brightness-110 active:scale-95 transition cursor-pointer">Set</button>
            </div>
            <button onClick={useMyLocation} className="text-[11px] text-white/50 hover:text-white mt-1.5 underline cursor-pointer">Use my current location</button>
            {geoStatus && <p className="text-[10px] text-white/40 mt-1">{geoStatus}</p>}
          </div>
        </section>
      )}

      {/* ============ SOUND & MOTION ============ */}
      {matchesFilter("sound", ["sound", "motion", "particles", "reduce motion", "chimes", "fx", "audio"]) && (
        <section className="space-y-3">
          <GroupHeader icon={GIconVolume} label="Sound & Motion" />

          <div className="space-y-2">
            <ToggleRow label="Desktop starfield & constellation particles" checked={particlesEnabled} onToggle={toggleParticles} />
          </div>
          <div className="space-y-2">
            <ToggleRow label="System sound effects (window chimes, pops & clicks)" checked={systemSounds} onToggle={toggleSystemSounds} />
          </div>
          <div className="space-y-2">
            <ToggleRow label="Reduce motion (pause ambient animations)" checked={reduceMotion} onToggle={toggleMotion} />
          </div>
          <div className="space-y-2">
            <ToggleRow label="Play a sound for new chat messages" checked={chatSound} onToggle={toggleChatSound} />
          </div>
          <div className="space-y-2">
            <ToggleRow label="Compact dock / taskbar icons" checked={compact} onToggle={toggleCompact} />
          </div>

          {/* Sound FX Lab */}
          <div className="space-y-2 pt-1">
            <h3 className="text-[10px] sm:text-xs uppercase tracking-wide text-white/40 font-medium">Sound Effects Lab</h3>
            <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
              Procedural Web Audio synthesis for responsive desktop feedback.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => soundFx.playClick()}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-white/80 transition border border-white/10 cursor-pointer"
              >
                Click FX
              </button>
              <button
                onClick={() => soundFx.playPop()}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-white/80 transition border border-white/10 cursor-pointer"
              >
                Pop FX
              </button>
              <button
                onClick={() => soundFx.playClose()}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-white/80 transition border border-white/10 cursor-pointer"
              >
                Close FX
              </button>
              <button
                onClick={() => soundFx.playNotification()}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-white/80 transition border border-white/10 cursor-pointer"
              >
                Chime FX
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============ BACKUP & STORAGE ============ */}
      {matchesFilter("backup", ["storage", "backup", "export", "restore", "json", "import"]) && (
        <section className="space-y-3">
          <GroupHeader icon={GIconHardDrive} label="Storage & Backup" />
          <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
            Export or restore your notes, custom files, and appearance configurations to a JSON file.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                const backup = {
                  notes: localStorage.getItem("os_notes_data"),
                  customFiles: localStorage.getItem("os_custom_files"),
                  calcHistory: localStorage.getItem("os_calc_history"),
                  accent: localStorage.getItem("os_accent"),
                  themeMode: localStorage.getItem("os_theme_mode"),
                  wallpaper: localStorage.getItem("os_wallpaper"),
                  osMode: localStorage.getItem("os_mode"),
                  dockPosition: localStorage.getItem("os_dock_position"),
                  particles: localStorage.getItem("os_particles"),
                  exportedAt: new Date().toISOString()
                };
                const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `portfolio-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                soundFx.playNotification();
                notify("Backup Exported", "System settings saved to JSON file.", "update", 3000);
              }}
              className="flex items-center justify-center gap-2 w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 text-white/85 transition-all cursor-pointer"
            >
              <GIconDownload size={14} className="text-accent" />
              <span>Export System Backup (JSON)</span>
            </button>

            <label className="flex items-center justify-center gap-2 w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 text-white/85 transition-all cursor-pointer">
              <GIconUpload size={14} className="text-accent" />
              <span>Restore Backup (JSON)</span>
              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const data = JSON.parse(event.target?.result as string);
                      if (data.notes) localStorage.setItem("os_notes_data", data.notes);
                      if (data.customFiles) localStorage.setItem("os_custom_files", data.customFiles);
                      if (data.calcHistory) localStorage.setItem("os_calc_history", data.calcHistory);
                      if (data.accent) setAccent(data.accent);
                      if (data.themeMode) setThemeMode(data.themeMode);
                      if (data.wallpaper) setWallpaper(data.wallpaper);
                      if (data.osMode) setOsMode(data.osMode);
                      if (data.dockPosition) setDockPosition(data.dockPosition);
                      soundFx.playNotification();
                      notify("Backup Restored", "Configuration successfully imported.", "success", 3500);
                    } catch {
                      notify("Restore Failed", "Invalid backup JSON file.", "delete", 3500);
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>
        </section>
      )}

      {/* ============ DANGER ZONE ============ */}
      {matchesFilter("backup", ["danger", "reset", "defaults", "clear"]) && (
        <section className="space-y-2">
          <GroupHeader icon={GIconTrash} label="Danger zone" />
          <button
            onClick={() => {
              if (confirm("Reset all desktop settings to defaults? This clears saved wallpaper, accent, photo, weather location, and tasks.")) {
                resetDefaults();
                notify("Settings Reset", "Restored desktop settings to defaults.", "delete", 4000);
              }
            }}
            className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 active:scale-98 transition-all cursor-pointer font-medium"
          >
            Reset to defaults
          </button>
        </section>
      )}

      {/* Preview */}
      {matchesFilter("wallpaper", ["preview", "wallpaper", "desktop"]) && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] sm:text-xs uppercase tracking-wide text-white/40 font-medium">Desktop Live Preview</h3>
            <span className="text-[10px] font-mono text-white/40">{getWallpaperInfo(wallpaper).name}</span>
          </div>
          <div className="relative h-24 sm:h-28 md:h-32 rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-inner">
            {wallpaper.startsWith("data:") || wallpaper.startsWith("http") || wallpaper.startsWith("blob:") ? (
              <img
                src={wallpaper}
                alt="Custom Wallpaper"
                className="w-full h-full object-cover"
              />
            ) : PREVIEW_IMAGES[wallpaper] && !imageErrors[wallpaper] ? (
              <img
                src={PREVIEW_IMAGES[wallpaper]}
                alt={getWallpaperInfo(wallpaper).name}
                className="w-full h-full object-cover"
                onError={() => handleImageError(wallpaper)}
              />
            ) : (
              <div
                className="w-full h-full"
                style={{ background: PREVIEW_FALLBACK[wallpaper] || "#0a0a0f" }}
              />
            )}
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          </div>
          <p className="text-[9px] sm:text-[10px] text-white/30 text-center">
            Current desktop: <span className="text-white/70 font-medium">{getWallpaperInfo(wallpaper).name}</span> · Theme: <span className="text-accent font-medium capitalize">{themeMode}</span>
          </p>
        </section>
      )}
        </div>

        {/* Bottom Status Footer (matching Files app status bar) */}
        <div className="px-3.5 py-1.5 border-t border-white/5 bg-black/30 text-[10px] text-white/40 flex items-center justify-between shrink-0 font-mono overflow-hidden">
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span className="truncate">Adaptive Contrast: <span className="text-emerald-400">WCAG {harmonizedPalette?.wcagContrast || "7.2:1"}</span></span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="hidden sm:inline text-white/35 truncate">Mode: {themeMode === "night" ? "OLED Pitch Black" : "Balanced Slate"}</span>
          </div>
          <span className="text-white/30 shrink-0 ml-2">Settings v2.0</span>
        </div>
      </div>
    </div>
  );
}
