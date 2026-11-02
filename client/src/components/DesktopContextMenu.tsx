import { useEffect, useRef } from "react";
import { useOS } from "../store/useOS";
import {
  GIconSearch,
  GIconTerminal,
  GIconNotes,
  GIconSliders,
  GIconSparkles,
  GIconPower,
  GIconClose,
  GIconMinus,
  GIconLayoutCells,
  GIconActivity,
  GIconBookOpen,
  GIconCode,
} from "./icons/GravityIcons";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  widgetsVisible: boolean;
}

export default function DesktopContextMenu({ x, y, onClose, widgetsVisible }: ContextMenuProps) {
  const {
    openApp,
    openSpotlight,
    osMode,
    setOsMode,
    particlesEnabled,
    toggleParticles,
    toggleWidgets,
    closeAllWindows,
    minimizeAllWindows,
    toggleMissionControl,
  } = useOS();

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click or Esc
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Constrain position within window boundaries
  const menuW = 210;
  const menuH = 380;
  const clampedX = Math.max(10, Math.min(x, window.innerWidth - menuW - 10));
  const clampedY = Math.max(10, Math.min(y, window.innerHeight - menuH - 10));

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] w-[210px] max-h-[calc(100vh-20px)] overflow-y-auto thin-scroll rounded-xl bg-[#141417]/95 backdrop-blur-2xl border border-white/15 p-1.5 shadow-2xl text-xs select-none"
      style={{ left: clampedX, top: clampedY }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider text-white/40">
        Portfolio OS
      </div>

      <button
        onClick={() => {
          openSpotlight();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconSearch size={14} className="text-emerald-400" />
        <span className="flex-1 font-medium">Spotlight Search</span>
        <span className="text-[10px] text-white/40 font-mono">⌘K</span>
      </button>

      <button
        onClick={() => {
          openApp("activity");
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconActivity size={14} className="text-emerald-400" />
        <span className="flex-1 font-medium">{osMode === "win" ? "Task Manager" : "Activity Monitor"}</span>
      </button>

      <button
        onClick={() => {
          openApp("guestbook");
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconBookOpen size={14} className="text-violet-400" />
        <span className="flex-1 font-medium">Guestbook</span>
      </button>

      <button
        onClick={() => {
          openApp("terminal");
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconTerminal size={14} className="text-green-400" />
        <span className="flex-1 font-medium">Open Terminal</span>
      </button>
      <button
        onClick={() => {
          openApp("codeplay");
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconCode size={14} className="text-sky-400" />
        <span className="flex-1 font-medium">CodePlay Sandbox</span>
      </button>

      <button
        onClick={() => {
          openApp("notes");
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconNotes size={14} className="text-amber-400" />
        <span className="flex-1 font-medium">New Note</span>
      </button>

      <button
        onClick={() => {
          openApp("settings");
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconSliders size={14} className="text-violet-400" />
        <span className="flex-1 font-medium">Settings</span>
      </button>

      
      <button
        onClick={() => {
          toggleMissionControl();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconLayoutCells size={14} className="text-accent" />
        <span className="flex-1 font-medium">{osMode === "win" ? "Task View (F3)" : "Mission Control (F3)"}</span>
      </button>
<div className="my-1 border-t border-white/10" />

      <button
        onClick={() => {
          toggleWidgets();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconLayoutCells size={14} className="text-sky-400" />
        <span className="flex-1 font-medium">
          {widgetsVisible ? "Hide Desktop Widgets" : "Show Desktop Widgets"}
        </span>
      </button>

      <button
        onClick={() => {
          toggleParticles();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconSparkles size={14} className="text-cyan-400" />
        <span className="flex-1 font-medium">
          {particlesEnabled ? "Hide Starfield" : "Show Starfield"}
        </span>
      </button>

      <button
        onClick={() => {
          const next = osMode === "win" ? "mac" : "win";
          setOsMode(next);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconPower size={14} className="text-pink-400" />
        <span className="flex-1 font-medium">
          Switch to {osMode === "win" ? "macOS" : "Windows 11"}
        </span>
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        onClick={() => {
          minimizeAllWindows();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconMinus size={14} className="text-white/40" />
        <span className="flex-1">Minimize All</span>
      </button>

      <button
        onClick={() => {
          closeAllWindows();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/70 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
      >
        <GIconClose size={14} className="text-rose-400" />
        <span className="flex-1">Close All Windows</span>
      </button>
    </div>
  );
}
