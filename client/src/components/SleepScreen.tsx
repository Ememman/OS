import { useEffect, useState, useCallback } from "react";
import { useOS } from "../store/useOS";
import { GIconPower, GIconMoon } from "./icons/GravityIcons";
import { soundFx } from "../lib/soundFx";
import LiveShowWallpaper from "./LiveShowWallpaper";
import { DARK_NATURE_SCENES } from "../data/darkNatureScenes";

export default function SleepScreen() {
  const {
    setSleeping,
    lockScreenLiveShow,
    liveWallpaperSceneIndex,
    nextLiveWallpaperScene,
    prevLiveWallpaperScene,
    systemSounds,
  } = useOS();

  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  const currentScene = DARK_NATURE_SCENES[liveWallpaperSceneIndex] || DARK_NATURE_SCENES[0];

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      setDate(d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUnlock = useCallback(() => {
    if (systemSounds) soundFx.playOpen();
    setSleeping(false);
  }, [setSleeping, systemSounds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevLiveWallpaperScene();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextLiveWallpaperScene();
      } else {
        handleUnlock();
      }
    };

    const handlePointerWake = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      handleUnlock();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerWake);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerWake);
    };
  }, [handleUnlock, prevLiveWallpaperScene, nextLiveWallpaperScene]);

  return (
    <div
      onClick={handleUnlock}
      className="fixed inset-0 z-[99998] bg-[#020503] flex flex-col items-center justify-between p-6 sm:p-12 text-white select-none transition-all duration-700 cursor-pointer overflow-hidden animate-fade-in"
    >
      {/* Background Live Show Wallpaper with animated dark nature scenes & fireflies */}
      {lockScreenLiveShow ? (
        <div className="absolute inset-0 pointer-events-none">
          <LiveShowWallpaper isDesktopWallpaper={true} />
        </div>
      ) : (
        <div
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.45] contrast-[1.12]"
          style={{ background: currentScene.fallbackGradient }}
        >
          <img src={currentScene.url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Atmospheric dark aesthetic vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/70 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_20%,_rgba(0,0,0,0.65)_100%)] pointer-events-none" />

      {/* Top Header & Lock Status Pill */}
      <div className="relative z-10 mt-3 sm:mt-6 w-full flex items-center justify-center">
        <div className="inline-flex items-center justify-center gap-2 text-white/90 text-xs tracking-wider uppercase font-medium bg-black/50 backdrop-blur-xl px-4 py-2 rounded-full border border-emerald-500/25 shadow-2xl">
          <GIconMoon size={14} className="text-emerald-400 shrink-0" />
          <span className="leading-none text-center">Lock Screen · Protected</span>
        </div>
      </div>

      {/* Center Clock */}
      <div className="relative z-10 text-center space-y-2.5 my-auto flex flex-col items-center justify-center">
        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-extralight tracking-tight text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.85)]">
          {time}
        </h1>
        <p className="text-base sm:text-xl text-white/85 font-light drop-shadow-md tracking-wide">
          {date}
        </p>
      </div>

      {/* Footer Power Icon */}
      <div className="relative z-10 pb-6 text-center">
        <div className="w-9 h-9 rounded-full bg-emerald-500/15 backdrop-blur-md border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-300 animate-pulse shadow-lg">
          <GIconPower size={18} />
        </div>
      </div>
    </div>
  );
}
