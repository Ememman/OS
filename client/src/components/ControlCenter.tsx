import { useRef, useEffect } from "react";
import { useOS } from "../store/useOS";
import { usePlayer } from "../store/usePlayer";
import { useOutsideClick } from "../lib/useOutsideClick";
import { soundFx } from "../lib/soundFx";
import {
  GIconVolume,
  GIconVolumeMute,
  GIconSignal,
  GIconMoon,
  GIconSun,
  GIconSparkles,
  GIconSliders,
  GIconPower,
  GIconPlay,
  GIconPause,
  GIconLayoutCells,
  GIconCheck,
} from "./icons/GravityIcons";

export default function ControlCenter() {
  const {
    controlCenterOpen,
    closeControlCenter,
    osMode,
    setOsMode,
    accent,
    setAccent,
    accents,
    glassAlpha,
    setGlassAlpha,
    nightShift,
    toggleNightShift,
    particlesEnabled,
    toggleParticles,
    widgetsVisible,
    toggleWidgets,
    reduceMotion,
    toggleMotion,
    systemSounds,
    toggleSystemSounds,
    chatSound,
    toggleChatSound,
  } = useOS();

  const { queue, queueIdx, playing, togglePlay, volume, setVolume } = usePlayer();
  const currentTrack = queue[queueIdx];

  const panelRef = useRef<HTMLDivElement>(null);
  useOutsideClick(panelRef, closeControlCenter);

  const isWin = osMode === "win";

  // Escape key closes control center
  useEffect(() => {
    if (!controlCenterOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeControlCenter();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [controlCenterOpen, closeControlCenter]);

  if (!controlCenterOpen) return null;

  return (
    <div
      ref={panelRef}
      className={`fixed z-[1600] w-[330px] sm:w-[350px] glass rounded-3xl border border-white/20 shadow-2xl p-4 text-white text-xs select-none backdrop-blur-2xl animate-fade-in ${
        isWin
          ? "bottom-14 right-3 sm:right-6 origin-bottom-right"
          : "top-10 right-3 sm:right-6 origin-top-right"
      }`}
      style={{ animation: "menuOpen 160ms cubic-bezier(.16,1,.3,1) both" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <span className="font-display font-semibold text-xs tracking-wide text-white/90 uppercase">
          {isWin ? "Quick Settings" : "Control Center"}
        </span>
        <button
          onClick={() => {
            const next = isWin ? "mac" : "win";
            setOsMode(next);
            if (systemSounds) soundFx.playClick();
          }}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] text-white/80 transition"
        >
          <GIconPower size={11} className="text-accent" />
          <span>Switch to {isWin ? "macOS" : "Windows 11"}</span>
        </button>
      </div>

      <div className="space-y-3">
        {/* Top Grid: Connectivity & Toggles */}
        <div className="grid grid-cols-2 gap-2">
          {/* API & Network Status */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <GIconSignal size={14} />
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="mt-2">
              <div className="font-semibold text-white/90 text-[11px]">API Gateway</div>
              <div className="text-[10px] text-emerald-400/90 font-medium">Connected · Live</div>
            </div>
          </div>

          {/* Night Shift Toggle */}
          <button
            onClick={() => {
              toggleNightShift();
              if (systemSounds) soundFx.playClick();
            }}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              nightShift
                ? "bg-amber-500/20 border-amber-500/50 shadow-md shadow-amber-500/20"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  nightShift ? "bg-amber-500 text-white" : "bg-white/10 text-white/70"
                }`}
              >
                <GIconMoon size={14} />
              </div>
              {nightShift && <span className="text-[10px] text-amber-300 font-bold">ON</span>}
            </div>
            <div className="mt-2">
              <div className="font-semibold text-white/90 text-[11px]">Night Shift</div>
              <div className="text-[10px] text-white/40">Warm amber filter</div>
            </div>
          </button>
        </div>

        {/* Quick System Action Toggles */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              toggleParticles();
              if (systemSounds) soundFx.playClick();
            }}
            className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
              particlesEnabled
                ? "bg-accent/20 border-accent/50 text-white"
                : "bg-white/5 border-white/10 text-white/60 hover:text-white"
            }`}
          >
            <GIconSparkles size={14} />
            <span className="text-[10px] font-medium leading-tight">Starfield</span>
          </button>

          <button
            onClick={() => {
              toggleWidgets();
              if (systemSounds) soundFx.playClick();
            }}
            className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
              widgetsVisible
                ? "bg-accent/20 border-accent/50 text-white"
                : "bg-white/5 border-white/10 text-white/60 hover:text-white"
            }`}
          >
            <GIconLayoutCells size={14} />
            <span className="text-[10px] font-medium leading-tight">Widgets</span>
          </button>

          <button
            onClick={() => {
              toggleMotion();
              if (systemSounds) soundFx.playClick();
            }}
            className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
              reduceMotion
                ? "bg-accent/20 border-accent/50 text-white"
                : "bg-white/5 border-white/10 text-white/60 hover:text-white"
            }`}
          >
            <GIconSliders size={14} />
            <span className="text-[10px] font-medium leading-tight">No Motion</span>
          </button>
        </div>

        {/* Sliders Card: Glass Translucency & Sound Volume */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          {/* Glass Slider */}
          <div>
            <div className="flex justify-between text-[11px] mb-1.5 text-white/70">
              <span className="flex items-center gap-1.5 font-medium">
                <GIconSun size={13} className="text-amber-300" /> Glass Opacity
              </span>
              <span className="font-mono text-white/40">{Math.round(glassAlpha * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="0.85"
              step="0.05"
              value={glassAlpha}
              onChange={(e) => setGlassAlpha(parseFloat(e.target.value))}
              className="w-full accent-accent h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Volume Slider */}
          <div>
            <div className="flex justify-between text-[11px] mb-1.5 text-white/70">
              <span className="flex items-center gap-1.5 font-medium">
                {volume === 0 ? (
                  <GIconVolumeMute size={13} className="text-white/40" />
                ) : (
                  <GIconVolume size={13} className="text-cyan-300" />
                )}
                Sound Volume
              </span>
              <span className="font-mono text-white/40">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-accent h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Now Playing Tile (if active or loaded) */}
        {currentTrack && (
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentTrack.cover}
                alt={currentTrack.title}
                className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-md"
              />
              <div className="min-w-0">
                <div className="font-semibold text-white/90 text-xs truncate leading-tight">
                  {currentTrack.title}
                </div>
                <div className="text-[10px] text-white/45 truncate mt-0.5">
                  {currentTrack.artist}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                togglePlay();
                if (systemSounds) soundFx.playClick();
              }}
              className="w-8 h-8 rounded-full bg-accent hover:bg-accent/80 text-white flex items-center justify-center shrink-0 shadow-lg shadow-accent/20 transition-transform active:scale-95"
            >
              {playing ? <GIconPause size={13} /> : <GIconPlay size={13} className="ml-0.5" />}
            </button>
          </div>
        )}

        {/* Accent Color Palette Quick Switcher */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-[10px] uppercase font-semibold text-white/40 tracking-wider mb-2">
            System Accent
          </div>
          <div className="flex items-center justify-between">
            {accents.map((a) => {
              const isSelected = accent === a.value;
              return (
                <button
                  key={a.value}
                  onClick={() => {
                    setAccent(a.value);
                    if (systemSounds) soundFx.playClick();
                  }}
                  title={a.name}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? "ring-2 ring-white scale-110 shadow-lg" : "hover:scale-105 opacity-80 hover:opacity-100"
                  }`}
                  style={{ background: `rgb(${a.value})` }}
                >
                  {isSelected && <GIconCheck size={11} className="text-white drop-shadow" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

