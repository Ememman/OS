import { useEffect, useRef } from "react";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";
import {
  GIconSliders,
  GIconActivity,
  GIconSquare,
  GIconMoon,
  GIconSparkles,
  GIconClose,
} from "../icons/GravityIcons";

export default function WinTaskbarContextMenu() {
  const {
    taskbarContextMenu,
    closeTaskbarContextMenu,
    openApp,
    openTaskbarSettingsModal,
    toggleShowDesktop,
    setOsMode,
    nextLiveWallpaperScene,
    cascadeWindows,
    closeAllWindows,
    notify,
    systemSounds,
  } = useOS();

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!taskbarContextMenu) return;

    const handleDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (menuRef.current && !menuRef.current.contains(target)) {
        closeTaskbarContextMenu();
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTaskbarContextMenu();
    };

    document.addEventListener("mousedown", handleDown);
    document.addEventListener("touchstart", handleDown, { passive: true });
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("touchstart", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [taskbarContextMenu, closeTaskbarContextMenu]);

  if (!taskbarContextMenu) return null;

  const { x, y } = taskbarContextMenu;
  const menuW = 210;
  const menuH = 260;
  const clampedX = Math.max(10, Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 800) - menuW - 10));
  const clampedY = Math.max(10, Math.min(y - menuH, (typeof window !== "undefined" ? window.innerHeight : 600) - menuH - 10));

  return (
    <div
      ref={menuRef}
      onContextMenu={(e) => e.preventDefault()}
      style={{ left: clampedX, top: clampedY }}
      className="fixed z-[9999] w-[210px] rounded-xl bg-[#1c2230]/95 backdrop-blur-2xl border border-white/12 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-xs text-white/90 select-none font-sans"
    >
      <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
        Taskbar Options
      </div>

      <button
        onClick={() => {
          if (systemSounds) soundFx.playClick();
          openTaskbarSettingsModal();
          closeTaskbarContextMenu();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/85 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
      >
        <GIconSliders size={14} className="text-sky-400" />
        <span className="flex-1 font-medium">Taskbar Settings</span>
      </button>

      <button
        onClick={() => {
          if (systemSounds) soundFx.playClick();
          openApp("activity");
          closeTaskbarContextMenu();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/85 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
      >
        <GIconActivity size={14} className="text-emerald-400" />
        <span className="flex-1">Task Manager</span>
        <span className="text-[10px] text-white/40 font-mono">Ctrl+Shift+Esc</span>
      </button>

      <div className="h-px bg-white/10 my-1" />

      <button
        onClick={() => {
          if (systemSounds) soundFx.playClick();
          toggleShowDesktop();
          closeTaskbarContextMenu();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/85 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
      >
        <GIconSquare size={14} className="text-white/60" />
        <span className="flex-1">Show the Desktop</span>
        <span className="text-[10px] text-white/40 font-mono">Win+D</span>
      </button>

      <button
        onClick={() => {
          if (systemSounds) soundFx.playClick();
          cascadeWindows();
          closeTaskbarContextMenu();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/85 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
      >
        <span className="flex-1 pl-6">Cascade Windows</span>
      </button>

      <button
        onClick={() => {
          if (systemSounds) soundFx.playClose();
          closeAllWindows();
          closeTaskbarContextMenu();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 transition-colors text-left cursor-pointer"
      >
        <GIconClose size={13} className="text-rose-400" />
        <span className="flex-1">Close All Windows</span>
      </button>

      <div className="h-px bg-white/10 my-1" />

      <button
        onClick={() => {
          if (systemSounds) soundFx.playPop();
          nextLiveWallpaperScene();
          notify("Wallpaper Changed", "Cycled to next live wallpaper scene.", "info", 1800);
          closeTaskbarContextMenu();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/85 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
      >
        <GIconSparkles size={14} className="text-amber-400" />
        <span className="flex-1">Next Wallpaper</span>
      </button>

      <button
        onClick={() => {
          if (systemSounds) soundFx.playOpen();
          setOsMode("mac");
          notify("Switched Style", "Welcome to macOS mode.", "success", 2000);
          closeTaskbarContextMenu();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/85 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
      >
        <GIconMoon size={14} className="text-indigo-400" />
        <span className="flex-1">Switch to macOS Style</span>
      </button>
    </div>
  );
}
