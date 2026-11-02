import { useState } from "react";
import { useOS } from "../../store/useOS";
import type { DockPosition, OSMode } from "../../types/os";
import Wallpaper from "../Wallpaper";
import {
  GIconCheck,
  GIconSparkles,
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
  GIconSun,
} from "../icons/GravityIcons";
import { soundFx } from "../../lib/soundFx";

// Preview images for the wallpaper selector — served from /public/wallpapers
const PREVIEW_IMAGES = {
  bg1: "/wallpapers/BG_1.jpg",
  bg2: "/wallpapers/BG_2.png",
  bg3: "/wallpapers/BG_3.jpg",
};

// Fallback gradients if images don't load
const PREVIEW_FALLBACK = {
  bg1: "linear-gradient(135deg, #1a1a2e, #16213e)",
  bg2: "linear-gradient(135deg, #0f0c29, #302b63)",
  bg3: "linear-gradient(135deg, #1a1a2e, #2d2b4a)",
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

function GroupHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 pt-1 pb-0.5">
      <Icon size={13} className="accent" />
      <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em] text-white/50">{label}</h2>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

function ToggleRow({ label, checked, onToggle }) {
  return (
    <label className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-all cursor-pointer">
      <span className="text-xs sm:text-sm text-white/80">{label}</span>
      <button
        onClick={onToggle}
        className={`w-10 sm:w-11 h-6 rounded-full relative transition-all duration-300 shrink-0 ${checked ? "bg-accent" : "bg-white/20"}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-md ${
            checked ? "left-\[18px] sm:left-5.5" : "left-0.5"
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
    accent,
    setAccent,
    accents,
    themeMode,
    setThemeMode,
    harmonizedPalette,
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
    resetDefaults,
    openApp,
    openSpotlight,
    notify,
  } = useOS();

  const [cityDraft, setCityDraft] = useState(weatherLoc.name);
  const [geoStatus, setGeoStatus] = useState("");
  const [imageErrors, setImageErrors] = useState({});

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

  const getWallpaperInfo = (id) => {
    const info = {
      bg1: { name: "Balloon Sunset", desc: "Hot air balloons at dusk" },
      bg2: { name: "Cyborg Dark", desc: "Dark cyborg portrait" },
      bg3: { name: "Balloon Night", desc: "Balloon over moonlit water" },
      ocean: { name: "Ocean Night", desc: "Calm ocean under stars" },
      galaxy: { name: "Galaxy", desc: "Deep space nebula" },
      aurora: { name: "Aurora", desc: "Northern lights display" },
    };
    return info[id] || { name: id, desc: "" };
  };

  const handleImageError = (id) => setImageErrors((prev) => ({ ...prev, [id]: true }));

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 bg-[#0a0a0f] min-h-screen">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-display text-lg sm:text-xl font-semibold text-white">Settings</h1>
        <p className="text-xs sm:text-sm text-white/50">Make this desktop yours.</p>
      </div>

      {/* ============ APPEARANCE ============ */}
      <GroupHeader icon={GIconSliders} label="Appearance" />

      <section className="space-y-2">
        <h3 className="text-[10px] sm:text-xs uppercase tracking-wide text-white/40 font-medium">Desktop style</h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {OS_MODE_OPTIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => {
              setOsMode(o.id);
              notify("Desktop Style", `Switched to ${o.label} mode.`, "update", 3000);
            }}
              className={`flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm transition-all duration-200 ${
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

      {/* Color Theme (Dark Mode / Light Mode) */}
      <section className="space-y-2">
        <h3 className="text-[10px] sm:text-xs uppercase tracking-wide text-white/40 font-medium">Color theme</h3>
        <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
          Switch between dark glassmorphism and light frosted aesthetics. Accent colors automatically blend and calibrate for maximum readability.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            onClick={() => {
              setThemeMode("dark");
              notify("Dark Mode", "Applied dark theme and calibrated accent.", "update", 3000);
            }}
            className={`flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm transition-all duration-200 ${
              themeMode === "dark"
                ? "border-accent bg-accent/15 text-white shadow-lg shadow-accent/10"
                : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-white/20 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <GIconMoon size={14} className={themeMode === "dark" ? "text-accent" : "text-white/60"} />
              <span className="font-medium">Dark Mode</span>
            </div>
            {themeMode === "dark" && <GIconCheck size={14} className="text-accent shrink-0" />}
          </button>
          <button
            onClick={() => {
              setThemeMode("light");
              notify("Light Mode", "Applied light theme and calibrated accent.", "update", 3000);
            }}
            className={`flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm transition-all duration-200 ${
              themeMode === "light"
                ? "border-accent bg-accent/15 text-white shadow-lg shadow-accent/10"
                : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-white/20 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <GIconSun size={14} className={themeMode === "light" ? "text-accent" : "text-white/60"} />
              <span className="font-medium">Light Mode</span>
            </div>
            {themeMode === "light" && <GIconCheck size={14} className="text-accent shrink-0" />}
          </button>
        </div>
      </section>

      {osMode === "mac" && (
        <section className="space-y-2">
          <h3 className="text-[10px] sm:text-xs uppercase tracking-wide text-white/40 font-medium">Dock position</h3>
          <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
            Move the Dock to the bottom, left, or right of the screen. Always sits at the bottom on phones, where there's less room to spare.
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {DOCK_POSITION_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setDockPosition(o.id);
                  notify("Dock Position", `Moved dock to ${o.label.toLowerCase()}.`, "update", 2500);
                }}
                className={`flex flex-col items-center gap-1.5 px-2 py-2.5 sm:py-3 rounded-xl border text-xs transition-all duration-200 ${
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

      <section>
        <h3 className="text-[10px] sm:text-xs uppercase tracking-wide text-white/40 font-medium mb-2">Wallpaper</h3>
        <p className="text-[10px] sm:text-[11px] text-white/30 mb-2.5">Choose a background for your desktop</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {wallpapers.map((w) => {
            const info = getWallpaperInfo(w.id);
            const isSelected = wallpaper === w.id;
            const imageUrl = PREVIEW_IMAGES[w.id];
            const hasError = imageErrors[w.id];
            return (
              <button key={w.id} onClick={() => {
                setWallpaper(w.id);
                notify("Wallpaper Changed", `Applied "${info.name}" background.`, "update", 3000);
              }} className="group text-left">
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
                    className={`absolute inset-0 bg-gradient-to- from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
                      isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                    }`}
                  />
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 bg-accent rounded-full p-1 shadow-lg shadow-accent/40">
                      <GIconCheck size={10} className="text-white" />
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
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[10px] sm:text-xs uppercase tracking-wide text-white/40 font-medium">Accent color</h3>
            <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
              Used for focus rings, hover states, active indicators, and highlights across the desktop.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
            {harmonizedPalette?.hex || "#e8543f"}
          </span>
        </div>

        {/* Swatches & Custom Picker */}
        <div className="flex gap-2 sm:gap-3 items-center flex-wrap">
          {accents.map((a) => {
            const isSelected = accent === a.value;
            return (
              <button
                key={a.value}
                onClick={() => {
                  setAccent(a.value);
                  notify("Accent Updated", `Applied "${a.name}" accent.`, "update", 3000);
                }}
                title={a.name}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200 hover:scale-110 ${
                  isSelected ? "border-white scale-110 shadow-lg shadow-white/20" : "border-transparent hover:border-white/30"
                }`}
                style={{ background: `rgb(${a.value})` }}
              >
                {isSelected && <GIconCheck size={14} className="text-white drop-shadow-sm" />}
              </button>
            );
          })}

          {/* Custom Color Native Picker (+) */}
          <label
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 border-dashed border-white/30 cursor-pointer hover:border-white/60 hover:scale-110 transition relative overflow-hidden"
            title="Pick any custom color"
          >
            <input
              type="color"
              value={harmonizedPalette?.hex || "#e8543f"}
              onChange={(e) => {
                const hex = e.target.value;
                setAccent(hex);
                notify("Custom Accent", `Harmonized custom color ${hex}.`, "update", 3000);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <span className="text-white/60 text-xs font-bold select-none">+</span>
          </label>
        </div>

        {/* Adaptive Color Harmonization Card */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                style={{ background: `rgb(${harmonizedPalette?.rgb || accent})` }}
              />
              <span className="text-xs font-semibold text-white">
                {accents.find((a) => a.value === accent)?.name || "Custom Palette"}
              </span>
              <span className="text-[10px] font-mono text-white/50">
                rgb({harmonizedPalette?.rgb || accent})
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <GIconCheck size={11} />
              <span>Balanced for {themeMode === "dark" ? "Dark Mode" : "Light Mode"}</span>
            </div>
          </div>

          {/* Live Component Blending Previews */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {/* Primary Action Button */}
            <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 flex flex-col items-center justify-center gap-1.5">
              <span className="text-[9px] uppercase font-mono text-white/40">Primary Button</span>
              <button
                type="button"
                className="w-full py-1.5 px-3 rounded-lg bg-accent text-xs font-semibold transition active:scale-95 shadow-md flex items-center justify-center gap-1"
                style={{ color: harmonizedPalette?.contrastText || "#ffffff" }}
              >
                <GIconSparkles size={11} />
                <span>Action Button</span>
              </button>
            </div>

            {/* Translucent Surface Badge */}
            <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 flex flex-col items-center justify-center gap-1.5">
              <span className="text-[9px] uppercase font-mono text-white/40">Glass Badge</span>
              <div
                className="w-full py-1.5 px-2 rounded-lg text-center text-xs font-medium border"
                style={{
                  backgroundColor: harmonizedPalette?.subtle || "rgba(var(--accent), 0.14)",
                  borderColor: harmonizedPalette?.border || "rgba(var(--accent), 0.32)",
                  color: "rgb(var(--accent))",
                }}
              >
                Selected Item
              </div>
            </div>

            {/* Focus Ring / Selection */}
            <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 flex flex-col items-center justify-center gap-1.5">
              <span className="text-[9px] uppercase font-mono text-white/40">Focus Ring</span>
              <div
                className="w-full py-1.5 px-2 rounded-lg bg-white/5 text-center text-xs text-white/80 ring-2"
                style={{
                  boxShadow: harmonizedPalette?.glow || "0 0 16px rgba(var(--accent), 0.35)",
                  outline: `2px solid rgb(var(--accent))`,
                  outlineOffset: "1px",
                }}
              >
                Focused Element
              </div>
            </div>
          </div>

          <p className="text-[10px] text-white/45 leading-relaxed pt-0.5">
            ✨ <strong>Smart Blending Function:</strong> Any color you set is mathematically calibrated for comfortable saturation (no harsh neon glare) and relative luminance (WCAG compliant contrast ratio: <strong>{harmonizedPalette?.wcagContrast || "4.5:1"}</strong>). When you toggle between Dark and Light mode, the color automatically adjusts its tone to blend with the interface.
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-[10px] sm:text-xs uppercase tracking-wide text-white/40 font-medium">Glass intensity</h3>
        <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
          How solid windows, widgets, and menus look. Lower it to see more of the wallpaper through the panels.
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

      {/* ============ NEXT-GEN SYSTEM & GRAVITY UI ============ */}
      <GroupHeader icon={GIconSparkles} label="Next-Gen Features & Gravity UI" />
      <section className="space-y-3">
        <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <GIconTerminal size={16} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Interactive Terminal Shell</h4>
                <p className="text-[10px] text-white/45">Full CLI with neofetch, matrix rain, and app launcher</p>
              </div>
            </div>
            <button
              onClick={() => openApp("terminal")}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-emerald-500 hover:text-black font-medium transition-colors text-white"
            >
              Launch
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
                <GIconSearch size={16} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">System Spotlight Search</h4>
                <p className="text-[10px] text-white/45">Instant search across apps, files & actions (⌘K / Ctrl+K)</p>
              </div>
            </div>
            <button
              onClick={openSpotlight}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-accent text-white font-medium transition-colors"
            >
              Open
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <GIconNotes size={16} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Notes & Scratchpad</h4>
                <p className="text-[10px] text-white/45">Markdown editor with auto-save & word counts</p>
              </div>
            </div>
            <button
              onClick={() => openApp("notes")}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-amber-500 hover:text-black font-medium transition-colors text-white"
            >
              Open
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <GIconCalculator size={16} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Interactive Calculator</h4>
                <p className="text-[10px] text-white/45">Standard & formula history with keyboard typing</p>
              </div>
            </div>
            <button
              onClick={() => openApp("calculator")}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-cyan-500 hover:text-black font-medium transition-colors text-white"
            >
              Open
            </button>
          </div>
        </div>
      </section>

      {/* ============ WIDGETS ============ */}
      <GroupHeader icon={GIconSparkles} label="Widgets" />

      <section className="space-y-2">
        <h3 className="text-[10px] sm:text-xs uppercase tracking-wide text-white/40 font-medium">Photo</h3>
        <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">Paste an image URL to replace the placeholder photo widget on the desktop.</p>
        <input
          defaultValue={useOS.getState().photoUrl}
          onBlur={(e) => useOS.getState().setPhotoUrl(e.target.value.trim())}
          placeholder="https://example.com/image.jpg"
          className="w-full bg-white/5 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white outline-none border border-white/10 focus:border-accent transition-colors placeholder:text-white/20"
        />
      </section>

      <section className="space-y-2">
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
            className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none border border-white/10 focus:border-accent transition-colors placeholder:text-white/20"
          />
          <button onClick={lookupCity} className="text-xs px-3 py-2 rounded-lg bg-accent shrink-0 hover:brightness-110 active:scale-95 transition">Set</button>
        </div>
        <button onClick={useMyLocation} className="text-[11px] text-white/50 hover:text-white mt-1.5 underline">Use my current location</button>
        {geoStatus && <p className="text-[10px] text-white/40 mt-1">{geoStatus}</p>}
      </section>

      {/* ============ SOUND & MOTION ============ */}
      <GroupHeader icon={GIconVolume} label="Sound & Motion" />

      <section className="space-y-2">
        <ToggleRow label="Desktop starfield & constellation particles" checked={particlesEnabled} onToggle={toggleParticles} />
      </section>
      <section className="space-y-2">
        <ToggleRow label="System sound effects (window chimes, pops & clicks)" checked={systemSounds} onToggle={toggleSystemSounds} />
      </section>
      <section className="space-y-2">
        <ToggleRow label="Reduce motion (pause ambient animations)" checked={reduceMotion} onToggle={toggleMotion} />
      </section>
      <section className="space-y-2">
        <ToggleRow label="Play a sound for new chat messages" checked={chatSound} onToggle={toggleChatSound} />
      </section>
      <section className="space-y-2">
        <ToggleRow label="Compact dock / taskbar icons" checked={compact} onToggle={toggleCompact} />
      </section>

      {/* Sound FX Lab */}
      <section className="space-y-2">
        <h3 className="text-[10px] sm:text-xs uppercase tracking-wide text-white/40 font-medium">Sound Effects Lab</h3>
        <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
          Procedural Web Audio synthesis for responsive desktop feedback.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => soundFx.playClick()}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-white/80 transition border border-white/10"
          >
            Click FX
          </button>
          <button
            onClick={() => soundFx.playPop()}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-white/80 transition border border-white/10"
          >
            Pop FX
          </button>
          <button
            onClick={() => soundFx.playClose()}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-white/80 transition border border-white/10"
          >
            Close FX
          </button>
          <button
            onClick={() => soundFx.playNotification()}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-white/80 transition border border-white/10"
          >
            Chime FX
          </button>
        </div>
      </section>

      {/* ============ BACKUP & STORAGE ============ */}
      <GroupHeader icon={GIconHardDrive} label="Storage & Backup" />
      <section className="space-y-2">
        <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
          Export your notes, custom files, and appearance configurations to a JSON file.
        </p>
        <button
          onClick={() => {
            const backup = {
              notes: localStorage.getItem("os_notes_data"),
              customFiles: localStorage.getItem("os_custom_files"),
              calcHistory: localStorage.getItem("os_calc_history"),
              accent: localStorage.getItem("os_accent"),
              wallpaper: localStorage.getItem("os_wallpaper"),
              osMode: localStorage.getItem("os_mode"),
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
            notify("Backup Exported", "System settings saved to JSON file.", "update", 3000);
          }}
          className="flex items-center justify-center gap-2 w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 text-white/85 transition-all"
        >
          <GIconDownload size={14} className="text-accent" />
          <span>Export System Backup (JSON)</span>
        </button>
      </section>

      {/* ============ DANGER ZONE ============ */}
      <GroupHeader icon={GIconTrash} label="Danger zone" />
      <section className="space-y-2">
        <button
          onClick={() => {
            if (confirm("Reset all desktop settings to defaults? This clears saved wallpaper, accent, photo, weather location, and tasks.")) {
              resetDefaults();
              notify("Settings Reset", "Restored desktop settings to defaults.", "delete", 4000);
            }
          }}
          className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-all"
        >
          Reset to defaults
        </button>
      </section>

      {/* Preview */}
      <section className="space-y-2">
        <h3 className="text-[10px] sm:text-xs uppercase tracking-wide text-white/40 font-medium">Preview</h3>
        <div className="relative h-24 sm:h-28 md:h-32 rounded-xl overflow-hidden border border-white/10">
          <Wallpaper />
        </div>
        <p className="text-[9px] sm:text-[10px] text-white/20 text-center">Current wallpaper preview</p>
      </section>
    </div>
  );
}
