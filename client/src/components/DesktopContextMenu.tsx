import { useState, useEffect, useRef } from "react";
import { useOS } from "../store/useOS";
import { useDesktopStore } from "../store/useDesktopStore";
import {
  GIconSearch,
  GIconTerminal,
  GIconNotes,
  GIconSliders,
  GIconDisplayPulse,
  GIconPower,
  GIconClose,
  GIconMinus,
  GIconLayoutCells,
  GIconActivity,
  GIconBookOpen,
  GIconCode,
  GIconFolder,
  GIconSparkles,
  GIconMoon,
  GIconEye,
  GIconChevronRight,
  GIconCheck,
  GIconLayoutHeader,
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
    showDesktopApps,
    toggleShowDesktopApps,
    showHeaderButtons,
    toggleShowHeaderButtons,
    showDock,
    toggleShowDock,
    desktopIconSize,
    setDesktopIconSize,
    autoArrangeIcons,
    toggleAutoArrangeIcons,
    closeAllWindows,
    minimizeAllWindows,
    toggleMissionControl,
    wallpaper,
    setWallpaper,
    nextLiveWallpaperScene,
  } = useOS();

  const [showViewSubmenu, setShowViewSubmenu] = useState(false);
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
  const menuW = 220;
  const menuH = 430;
  const clampedX = Math.max(10, Math.min(x, window.innerWidth - menuW - 10));
  const clampedY = Math.max(10, Math.min(y, window.innerHeight - menuH - 10));
  const submenuFlyLeft = clampedX + menuW + 215 > window.innerWidth;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] w-[220px] max-h-[calc(100vh-20px)] overflow-y-auto thin-scroll rounded-xl bg-[#141417]/95 backdrop-blur-2xl border border-white/15 p-1.5 shadow-2xl text-xs select-none"
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

      {/* Windows/macOS-style View > Submenu Flyout */}
      <div
        className="relative"
        onMouseEnter={() => setShowViewSubmenu(true)}
        onMouseLeave={(e) => {
          const to = e.relatedTarget as HTMLElement | null;
          if (!to || !to.closest("[data-submenu='view']")) {
            setShowViewSubmenu(false);
          }
        }}
      >
        <button
          type="button"
          onClick={() => setShowViewSubmenu((v) => !v)}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left group"
        >
          <GIconEye size={14} className="text-sky-400" />
          <span className="flex-1 font-medium">View</span>
          <GIconChevronRight size={12} className="text-white/40 group-hover:text-white/80 transition-transform" />
        </button>

        {showViewSubmenu && (
          <div
            data-submenu="view"
            onMouseEnter={() => setShowViewSubmenu(true)}
            onMouseLeave={() => setShowViewSubmenu(false)}
            style={{
              top: -4,
              [submenuFlyLeft ? "right" : "left"]: "calc(100% + 4px)",
            }}
            className="absolute z-[10000] w-[215px] rounded-xl bg-[#141417]/98 backdrop-blur-2xl border border-white/15 p-1.5 shadow-2xl text-xs select-none"
          >
            <div className="px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider text-white/40">
              Desktop Icons
            </div>
            <button
              onClick={() => {
                setDesktopIconSize("large");
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <span className="w-3 text-center text-sky-400 font-bold">{desktopIconSize === "large" ? "•" : ""}</span>
              <span className="flex-1 font-medium">Large icons</span>
            </button>
            <button
              onClick={() => {
                setDesktopIconSize("medium");
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <span className="w-3 text-center text-sky-400 font-bold">{desktopIconSize === "medium" ? "•" : ""}</span>
              <span className="flex-1 font-medium">Medium icons</span>
            </button>
            <button
              onClick={() => {
                setDesktopIconSize("small");
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <span className="w-3 text-center text-sky-400 font-bold">{desktopIconSize === "small" ? "•" : ""}</span>
              <span className="flex-1 font-medium">Small icons</span>
            </button>

            <div className="my-1 border-t border-white/10" />
            <div className="px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider text-white/40">
              Arrangement
            </div>
            <button
              onClick={() => {
                toggleAutoArrangeIcons();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <span className="w-3 flex items-center justify-center text-sky-400">{autoArrangeIcons ? <GIconCheck size={12} /> : ""}</span>
              <span className="flex-1 font-medium">Auto arrange icons</span>
            </button>
            <button
              onClick={() => {
                useDesktopStore.getState().cleanUpDesktop();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <span className="w-3" />
              <span className="flex-1 font-medium">Align icons to grid</span>
            </button>

            <div className="my-1 border-t border-white/10" />
            <div className="px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider text-white/40">
              Visibility Toggles
            </div>
            <button
              onClick={() => {
                toggleShowDesktopApps();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <span className="w-3 flex items-center justify-center text-sky-400">{showDesktopApps ? <GIconCheck size={12} /> : ""}</span>
              <span className="flex-1 font-medium">Show desktop applications</span>
            </button>
            <button
              onClick={() => {
                toggleShowHeaderButtons();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <span className="w-3 flex items-center justify-center text-sky-400">{showHeaderButtons ? <GIconCheck size={12} /> : ""}</span>
              <span className="flex-1 font-medium">Show header buttons</span>
            </button>
            <button
              onClick={() => {
                toggleShowDock();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <span className="w-3 flex items-center justify-center text-sky-400">{showDock ? <GIconCheck size={12} /> : ""}</span>
              <span className="flex-1 font-medium">Show dock applications</span>
            </button>
            <button
              onClick={() => {
                toggleWidgets();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <span className="w-3 flex items-center justify-center text-sky-400">{widgetsVisible ? <GIconCheck size={12} /> : ""}</span>
              <span className="flex-1 font-medium">Show desktop widgets</span>
            </button>
          </div>
        )}
      </div>

      {/* Direct 1-Click Visibility Controls */}
      <button
        onClick={() => {
          toggleShowDesktopApps();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconFolder size={14} className="text-amber-400" />
        <span className="flex-1 font-medium">
          {showDesktopApps ? "Hide Desktop Applications" : "Show Desktop Applications"}
        </span>
        <span className="text-[10px] text-white/40">{showDesktopApps ? "On" : "Off"}</span>
      </button>

      <button
        onClick={() => {
          toggleShowHeaderButtons();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconLayoutHeader size={14} className="text-sky-400" />
        <span className="flex-1 font-medium">
          {showHeaderButtons ? "Hide Header Buttons" : "Show Header Buttons"}
        </span>
        <span className="text-[10px] text-white/40">{showHeaderButtons ? "On" : "Off"}</span>
      </button>

      <button
        onClick={() => {
          toggleShowDock();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconMinus size={14} className="text-purple-400" />
        <span className="flex-1 font-medium">
          {showDock
            ? osMode === "win" ? "Hide Taskbar Applications" : "Hide Dock Applications"
            : osMode === "win" ? "Show Taskbar Applications" : "Show Dock Applications"}
        </span>
        <span className="text-[10px] text-white/40">{showDock ? "On" : "Off"}</span>
      </button>

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
          useDesktopStore.getState().cleanUpDesktop();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconLayoutCells size={14} className="text-sky-400" />
        <span className="flex-1 font-medium">Clean Up Icons</span>
      </button>

      <button
        onClick={() => {
          useDesktopStore.getState().resetDesktop();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconFolder size={14} className="text-amber-400" />
        <span className="flex-1 font-medium">Reset Desktop Apps</span>
      </button>

      <button
        onClick={() => {
          toggleParticles();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconDisplayPulse size={14} className="text-cyan-400" />
        <span className="flex-1 font-medium">
          {particlesEnabled ? "Hide Starfield" : "Show Starfield"}
        </span>
      </button>

      {wallpaper === "liveshow" ? (
        <button
          onClick={() => {
            nextLiveWallpaperScene();
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/15 transition-colors text-left"
        >
          <GIconSparkles size={14} className="text-emerald-400" />
          <span className="flex-1 font-medium">Change Live Wallpaper</span>
          <span className="text-[10px] text-emerald-400/70 font-mono">Next</span>
        </button>
      ) : (
        <button
          onClick={() => {
            setWallpaper("liveshow");
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
        >
          <GIconSparkles size={14} className="text-emerald-400" />
          <span className="flex-1 font-medium">Dark Nature Live Show</span>
        </button>
      )}

      <button
        onClick={() => {
          useOS.getState().setSleeping(true);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
      >
        <GIconMoon size={14} className="text-amber-300" />
        <span className="flex-1 font-medium">Lock Screen</span>
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
