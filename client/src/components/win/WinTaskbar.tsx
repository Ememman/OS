import { useEffect, useRef, useState, type RefObject } from "react";
import { motion } from "framer-motion";
import { useOS } from "../../store/useOS";
import { useIsMobile } from "../../lib/useMediaQuery";
import { soundFx } from "../../lib/soundFx";
import WeatherChip from "./WeatherChip";
import LiveBadge from "../LiveBadge";
import CalendarWidget from "../widgets/CalendarWidget";
import WeatherWidget from "../widgets/WeatherWidget";
import {
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
  GIconSearch,
  GIconSignal,
  GIconVolume,
  GIconChevronUp,
  GIconClose,
  GIconPower,
  GIconMoon,
  GIconSliders,
  GIconNotes,
  GIconCalculator,
  GIconActivity,
  GIconBookOpen,
  GIconCode,
  GIconLayoutCells,
} from "../icons/GravityIcons";

const TASKBAR_ITEMS = [
  { app: "terminal", label: "Terminal", icon: GIconTerminal, color: "#22c55e" },
  { app: "codeplay", label: "CodePlay", icon: GIconCode, color: "#38bdf8" },
  { app: "notes", label: "Notes", icon: GIconNotes, color: "#f59e0b" },
  { app: "calculator", label: "Calculator", icon: GIconCalculator, color: "#06b6d4" },
  { app: "activity", label: "Task Manager", icon: GIconActivity, color: "#10b981" },
  { app: "guestbook", label: "Guestbook", icon: GIconBookOpen, color: "#8b5cf6" },
  { app: "library", label: "Library", icon: GIconLibrary, color: "#5BB8B0" },
  { app: "music", label: "Music", icon: GIconMusic, color: "#D9678C" },
  { app: "updates", label: "Updates", icon: GIconUpdates, color: "#5FBF7C" },
  { app: "chats", label: "Chats", icon: GIconChats, color: "#8E7BE0" },
  { app: "gallery", label: "Gallery", icon: GIconGallery, color: "#B8C25A" },
  { app: "games", label: "Games", icon: GIconGames, color: "#D98A4E" },
  { app: "files", label: "Files", icon: GIconFiles, color: "#E0B84E" },
  { app: "settings", label: "Settings", icon: GIconSettings, color: "#8892A6" },
  { app: "resume", label: "Resume", icon: GIconResume, color: "#4B5A73" },
];

const TASKBAR_ITEMS_MAP = Object.fromEntries(TASKBAR_ITEMS.map((item) => [item.app, item]));

const POP_ANIM = { animation: "menuOpen 150ms cubic-bezier(.16,1,.3,1) both" };

/**
 * Handles outside dismiss while ignoring clicks on the flyout's own trigger button
 * to allow smooth toggling (clicking the taskbar button again closes it cleanly without bouncing back open).
 */
function useFlyoutDismiss(
  ref: RefObject<HTMLDivElement | null>,
  onClose: () => void,
  triggerSelector?: string
) {
  useEffect(() => {
    const handleDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (ref.current && ref.current.contains(target)) return;
      if (triggerSelector && target.closest(triggerSelector)) return;
      onClose();
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleDown);
    document.addEventListener("touchstart", handleDown, { passive: true });
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("touchstart", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [ref, onClose, triggerSelector]);
}

function StartMenu({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { openApp, openPowerDialog, systemSounds } = useOS();
  const [query, setQuery] = useState("");
  useFlyoutDismiss(ref, onClose, "[data-start-trigger]");

  const results = TASKBAR_ITEMS.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div
      ref={ref}
      className="absolute bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 w-[calc(100vw-16px)] sm:w-[440px] max-w-[460px] max-h-[82vh] flex flex-col bg-[#0c101d]/98 sm:bg-[#0c101d]/95 backdrop-blur-3xl rounded-2xl border border-white/20 shadow-[0_24px_70px_rgba(0,0,0,0.88)] ring-1 ring-white/10 p-3.5 sm:p-5 z-[1200] origin-bottom select-none overflow-hidden"
      style={POP_ANIM}
    >
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
            <span className="bg-sky-400 rounded-[1.5px]" />
            <span className="bg-sky-400 rounded-[1.5px]" />
            <span className="bg-sky-400 rounded-[1.5px]" />
            <span className="bg-sky-400 rounded-[1.5px]" />
          </div>
          <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">Pinned Apps</span>
          <span className="text-[10px] text-white/40 font-mono bg-white/5 px-1.5 py-0.5 rounded-md">
            {TASKBAR_ITEMS.length}
          </span>
        </div>
        <button
          onClick={() => {
            if (systemSounds) soundFx.playClick();
            onClose();
          }}
          className="p-1 hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors text-white/60 hover:text-white cursor-pointer"
          title="Close Start Menu"
        >
          <GIconClose size={13} />
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (results[0]) {
            if (systemSounds) soundFx.playClick();
            openApp(results[0].app);
            onClose();
          }
        }}
        className="mb-3 shrink-0"
      >
        <div className="focus-stroke flex items-center gap-2 bg-black/60 rounded-xl px-3 h-9.5 border border-white/15 transition-all focus-within:border-[#0091ff] focus-within:ring-2 focus-within:ring-[#0091ff]/40 focus-within:shadow-[0_0_14px_rgba(0,145,255,0.28)]">
          <GIconSearch size={14} className="text-white/40 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pinned apps, tools, games..."
            className="bg-transparent outline-none text-xs w-full placeholder:text-white/40 text-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-white/40 hover:text-white text-xs cursor-pointer"
            >
              <GIconClose size={12} />
            </button>
          )}
        </div>
      </form>

      <div className="overflow-y-auto thin-scroll flex-1 -mr-1 pr-1 overscroll-contain">
        {results.length === 0 ? (
          <p className="text-xs text-white/40 text-center py-6">No apps match "{query}"</p>
        ) : (
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-2.5 py-1">
            {results.map(({ app, label, icon: Icon, color }) => (
              <button
                key={app}
                onClick={() => {
                  if (systemSounds) soundFx.playClick();
                  openApp(app);
                  onClose();
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 active:bg-white/15 active:scale-95 transition cursor-pointer group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 group-hover:scale-105 group-hover:border-white/25 transition-transform shadow-sm"
                  style={{ background: `${color}25` }}
                >
                  <Icon size={18} color={color} />
                </div>
                <span className="text-[10px] text-white/80 group-hover:text-white text-center leading-tight truncate max-w-full">
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}

        {!query && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2 px-1">
              Quick Shortcuts
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { app: "terminal", label: "Terminal", desc: "Command Line", color: "#22c55e" },
                { app: "activity", label: "Task Manager", desc: "System Status", color: "#10b981" },
                { app: "codeplay", label: "CodePlay", desc: "JS / Web Sandbox", color: "#38bdf8" },
                { app: "settings", label: "Settings", desc: "Theme & Display", color: "#8892A6" },
              ].map((s) => (
                <button
                  key={s.app}
                  onClick={() => {
                    if (systemSounds) soundFx.playClick();
                    openApp(s.app);
                    onClose();
                  }}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 active:bg-white/15 text-left transition cursor-pointer"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-white/90 truncate">{s.label}</div>
                    <div className="text-[9px] text-white/40 truncate">{s.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 mt-3 pt-3 flex items-center justify-between shrink-0 bg-black/25 -mx-3.5 -mb-3.5 px-3.5 py-3 sm:-mx-5 sm:-mb-5 sm:px-5 sm:py-3.5 rounded-b-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 aspect-square shrink-0 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            J
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-white/90 leading-tight">James Mendoza</span>
            <span className="text-[9px] text-white/40 leading-tight">Administrator</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (systemSounds) soundFx.playClick();
              useOS.getState().openApp("settings");
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            title="Settings"
          >
            <GIconSliders size={14} />
          </button>
          <button
            onClick={() => {
              if (systemSounds) soundFx.playClick();
              onClose();
              openPowerDialog();
            }}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-white/70 hover:text-rose-400 transition cursor-pointer"
            title="Power: Shut Down, Restart, or Switch OS Style"
          >
            <GIconPower size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TrayFlyout({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { openApp, reopenPicker, toggleControlCenter, restart, openPowerDialog, setSleeping, systemSounds } = useOS();
  useFlyoutDismiss(ref, onClose, "[data-tray-trigger]");
  return (
    <div
      ref={ref}
      className="absolute bottom-14 sm:bottom-16 right-2 sm:right-3 w-60 max-w-[calc(100vw-20px)] bg-[#0c101d]/96 sm:bg-[#0c101d]/94 backdrop-blur-3xl rounded-2xl border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 p-3 z-[1200] origin-bottom-right"
      style={POP_ANIM}
    >
      <div className="text-[10px] uppercase font-semibold text-white/40 tracking-wider px-1 pb-1">Quick Actions</div>
      <button
        onClick={() => {
          if (systemSounds) soundFx.playClick();
          toggleControlCenter();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 text-left text-white/85 cursor-pointer"
      >
        <GIconSliders size={14} className="text-sky-400" /> Quick Settings & Display
      </button>
      <button
        onClick={() => {
          if (systemSounds) soundFx.playClick();
          openApp("activity");
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 text-left text-white/85 cursor-pointer"
      >
        <GIconActivity size={14} className="text-emerald-400" /> Task Manager
      </button>
      <button
        onClick={() => {
          if (systemSounds) soundFx.playClick();
          openApp("guestbook");
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 text-left text-white/85 cursor-pointer"
      >
        <GIconBookOpen size={14} className="text-violet-400" /> Guestbook & Ledger
      </button>
      <button
        onClick={() => {
          if (systemSounds) soundFx.playClick();
          openApp("settings");
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 text-left text-white/85 cursor-pointer"
      >
        <GIconSliders size={14} className="text-amber-400" /> System Settings
      </button>

      <div className="h-px bg-white/10 my-1.5" />
      <div className="text-[10px] uppercase font-semibold text-white/40 tracking-wider px-1 pb-1">Power & Session</div>

      <button
        onClick={() => {
          if (systemSounds) soundFx.playClick();
          reopenPicker();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 text-left text-white/85 cursor-pointer"
      >
        <GIconMoon size={14} className="text-sky-400" /> Switch OS Style
      </button>
      <button
        onClick={() => {
          if (systemSounds) soundFx.playClick();
          setSleeping(true);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 text-left text-white/85 cursor-pointer"
      >
        <GIconMoon size={14} className="text-indigo-400" /> Sleep / Lock Screen
      </button>
      <button
        onClick={() => {
          if (systemSounds) soundFx.playClick();
          restart();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 text-left text-white/85 cursor-pointer"
      >
        <GIconSliders size={14} className="text-amber-400" /> Restart System
      </button>
      <button
        onClick={() => {
          if (systemSounds) soundFx.playClick();
          onClose();
          openPowerDialog();
        }}
        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs hover:bg-rose-500/20 text-left text-rose-300 cursor-pointer"
      >
        <GIconPower size={14} className="text-rose-400" /> Shut Down…
      </button>

      <div className="h-px bg-white/10 my-1" />
      <div className="px-2 py-1 flex items-center justify-between text-[10px] text-white/40">
        <span>Portfolio OS</span>
        <span className="font-mono">v2.4</span>
      </div>
    </div>
  );
}

function WeatherFlyout({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFlyoutDismiss(ref, onClose, "[data-weather-trigger]");
  return (
    <div
      ref={ref}
      className="absolute bottom-14 sm:bottom-16 left-2 sm:left-3 w-72 max-w-[calc(100vw-20px)] bg-[#0c101d]/96 sm:bg-[#0c101d]/94 backdrop-blur-3xl rounded-2xl border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 p-2.5 z-[1200] origin-bottom-left"
      style={POP_ANIM}
    >
      <WeatherWidget />
    </div>
  );
}

function DateFlyout({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFlyoutDismiss(ref, onClose, "[data-date-trigger]");
  return (
    <div
      ref={ref}
      className="absolute bottom-14 sm:bottom-16 right-2 sm:right-3 w-72 max-w-[calc(100vw-20px)] bg-[#0c101d]/96 sm:bg-[#0c101d]/94 backdrop-blur-3xl rounded-2xl border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 p-2.5 z-[1200] origin-bottom-right"
      style={POP_ANIM}
    >
      <CalendarWidget />
    </div>
  );
}

export default function WinTaskbar() {
  const {
    openApp,
    toggleApp,
    windows,
    toggleShowDesktop,
    toggleSpotlight,
    toggleControlCenter,
    controlCenterOpen,
    toggleMissionControl,
    missionControlOpen,
    unreadChatCount,
    systemSounds,
    dockApps,
    reorderDockApps,
  } = useOS();
  const [panel, setPanel] = useState<"start" | "tray" | "weather" | "date" | null>(null);
  const isMobile = useIsMobile();
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [draggedApp, setDraggedApp] = useState<string | null>(null);
  const [dropTargetApp, setDropTargetApp] = useState<string | null>(null);
  const touchDragRef = useRef<{ app: string; timeout: any; isDragging: boolean } | null>(null);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      setDate(d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggle = (which: "start" | "tray" | "weather" | "date") => {
    if (systemSounds) soundFx.playClick();
    setPanel((p) => (p === which ? null : which));
  };

  const handleDragStart = (e: React.DragEvent, app: string) => {
    e.dataTransfer.setData("text/plain", app);
    e.dataTransfer.effectAllowed = "move";
    setDraggedApp(app);
  };

  const handleDragOver = (e: React.DragEvent, app: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropTargetApp !== app) {
      setDropTargetApp(app);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, app: string) => {
    if (dropTargetApp === app) {
      setDropTargetApp(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetApp: string) => {
    e.preventDefault();
    const sourceApp = e.dataTransfer.getData("text/plain") || draggedApp;
    if (sourceApp && sourceApp !== targetApp) {
      reorderDockApps(sourceApp, targetApp);
      if (systemSounds) soundFx.playPop();
    }
    setDraggedApp(null);
    setDropTargetApp(null);
  };

  const handleDragEnd = () => {
    setDraggedApp(null);
    setDropTargetApp(null);
  };

  const handleTouchStart = (app: string) => {
    touchDragRef.current = {
      app,
      isDragging: false,
      timeout: setTimeout(() => {
        if (touchDragRef.current) {
          touchDragRef.current.isDragging = true;
          setDraggedApp(app);
          if (systemSounds) soundFx.playPop();
        }
      }, 250),
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragRef.current?.isDragging) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const target = el?.closest("[data-dock-app]");
    if (target) {
      const targetApp = target.getAttribute("data-dock-app");
      if (targetApp && targetApp !== dropTargetApp) {
        setDropTargetApp(targetApp);
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchDragRef.current) {
      clearTimeout(touchDragRef.current.timeout);
      if (touchDragRef.current.isDragging && dropTargetApp && touchDragRef.current.app !== dropTargetApp) {
        reorderDockApps(touchDragRef.current.app, dropTargetApp);
        if (systemSounds) soundFx.playPop();
      }
    }
    touchDragRef.current = null;
    setDraggedApp(null);
    setDropTargetApp(null);
  };

  const openAppIds = new Set(windows.map((w) => w.app));
  const unminimized = windows.filter((w) => !w.minimized);
  const maxZ = unminimized.length > 0 ? Math.max(...unminimized.map((w) => w.z)) : 0;

  const orderedItems = (dockApps || [])
    .map((id) => TASKBAR_ITEMS_MAP[id])
    .filter(Boolean);

  // On mobile screens, prioritize active running windows first so the user can easily switch apps
  const taskbarApps = isMobile
    ? [
        ...orderedItems.filter((i) => openAppIds.has(i.app)),
        ...orderedItems.filter((i) => !openAppIds.has(i.app)),
      ]
    : orderedItems;

  const btnSize = isMobile ? "w-9 h-9" : "w-10 h-10";
  const iconSize = isMobile ? 18 : 19;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-[#0a0f1d]/94 backdrop-blur-3xl border-t border-white/12 flex items-center justify-between px-1 sm:px-2 z-[900] select-none shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
      {/* 1. Left Section: Weather chip on desktop */}
      <div className="hidden md:flex items-center flex-1 min-w-0 basis-0">
        <button
          data-weather-trigger="true"
          onClick={() => toggle("weather")}
          className="hover:bg-white/10 active:bg-white/15 px-2.5 py-1 rounded-xl transition-colors shrink-0 cursor-pointer"
        >
          <WeatherChip />
        </button>
      </div>

      {/* 2. Center/Navigation Section: Start + Search + TaskView + App Icons */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-1 md:flex-initial min-w-0 md:max-w-[calc(100vw-360px)] justify-center">
        {/* Core Windows navigation controls */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            data-start-trigger="true"
            onClick={() => toggle("start")}
            title="Start"
            className={`${btnSize} rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              panel === "start" ? "bg-white/20 scale-95 shadow-sm" : "hover:bg-white/10 active:scale-95"
            }`}
          >
            <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4">
              <span className="bg-sky-400 rounded-[1.5px]" />
              <span className="bg-sky-400 rounded-[1.5px]" />
              <span className="bg-sky-400 rounded-[1.5px]" />
              <span className="bg-sky-400 rounded-[1.5px]" />
            </div>
          </button>

          <button
            onClick={() => {
              if (systemSounds) soundFx.playClick();
              toggleSpotlight();
            }}
            title="Search (Ctrl+K)"
            className={`${btnSize} rounded-xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-white/70 hover:text-white cursor-pointer`}
          >
            <GIconSearch size={iconSize} />
          </button>

          <button
            onClick={() => {
              if (systemSounds) soundFx.playClick();
              toggleMissionControl();
            }}
            title="Task View (F3 / Alt+Tab)"
            className={`${btnSize} rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              missionControlOpen ? "bg-white/20 text-accent shadow-sm" : "hover:bg-white/10 text-white/70 hover:text-white active:scale-95"
            }`}
          >
            <GIconLayoutCells size={iconSize} />
          </button>
        </div>

        {/* Separator between system navigation and app icons */}
        <div className="w-px h-5 bg-white/15 shrink-0 mx-0.5 sm:mx-1" />

        {/* Scrollable app icons track - strictly bounded by flex-1 min-w-0 */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar touch-pan-x flex-1 min-w-0 py-0.5 px-0.5">
          {taskbarApps.map(({ app, label, icon: Icon, color }) => {
            const existing = windows.find((w) => w.app === app);
            const isOpen = !!existing;
            const isMinimized = existing?.minimized ?? false;
            const isActive = isOpen && !isMinimized && existing.z >= maxZ;
            const isBeingDragged = draggedApp === app;
            const isDropTarget = dropTargetApp === app && draggedApp !== app;

            return (
              <motion.div
                key={app}
                layout
                transition={{ type: "spring", stiffness: 450, damping: 28 }}
                className={`relative transition-all duration-150 rounded-xl ${
                  isBeingDragged ? "opacity-35 scale-90" : ""
                } ${
                  isDropTarget ? "ring-2 ring-sky-400 bg-sky-500/25 scale-105 shadow-md shadow-sky-500/30" : ""
                }`}
                onDragOver={(e) => handleDragOver(e, app)}
                onDragLeave={(e) => handleDragLeave(e, app)}
                onDrop={(e) => handleDrop(e, app)}
              >
                <button
                  data-dock-app={app}
                  draggable
                  onDragStart={(e) => handleDragStart(e, app)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={() => handleTouchStart(app)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => {
                    if (!draggedApp) toggleApp(app);
                  }}
                  title={`${label}${isActive ? " · Active" : isMinimized ? " · Minimized" : isOpen ? " · Running" : ""} (Drag to rearrange)`}
                  className={`relative ${btnSize} rounded-xl flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer select-none ${
                    isActive
                      ? "bg-white/16 border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                      : isMinimized
                        ? "bg-white/5 hover:bg-white/10"
                        : isOpen
                          ? "bg-white/10 hover:bg-white/15"
                          : "hover:bg-white/10"
                  }`}
                >
                  <Icon size={iconSize} color={color} />
                  {isOpen && (
                    <span
                      className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full transition-all duration-200 ${
                        isActive
                          ? "w-4 h-0.75 bg-accent shadow-[0_0_8px_var(--color-accent,#38bdf8)]"
                          : isMinimized
                            ? "w-1.5 h-0.75 bg-white/40"
                            : "w-3 h-0.75 bg-white/70"
                      }`}
                    />
                  )}
                  {app === "chats" && unreadChatCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-md shadow-rose-500/60 border border-white/20 z-20 pointer-events-none select-none">
                      {unreadChatCount > 99 ? "99+" : unreadChatCount}
                    </span>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 3. Right Section: System Tray & Clock & Show Desktop */}
      <div className="flex items-center justify-end shrink-0 gap-1 sm:gap-1.5 pl-1.5 sm:pl-2 ml-1 border-l border-white/15 md:flex-1 md:basis-0 relative">
        <div className="hidden sm:block">
          <button
            onClick={() => {
              if (systemSounds) soundFx.playClick();
              openApp("chats");
            }}
            title="Live Visitors — Open Chats"
            className="cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          >
            <LiveBadge compact />
          </button>
        </div>

        <button
          data-tray-trigger="true"
          onClick={() => toggle("tray")}
          title="Quick Actions & Power"
          className="p-1.5 rounded-lg hover:bg-white/10 active:bg-white/15 transition-colors shrink-0 text-white/70 hover:text-white cursor-pointer"
        >
          <GIconChevronUp size={13} className={`transition-transform duration-200 ${panel === "tray" ? "rotate-180" : ""}`} />
        </button>

        <button
          onClick={toggleControlCenter}
          data-control-center-trigger="true"
          title="Quick Settings (Volume, Wi-Fi, Display)"
          className={`hidden xs:flex items-center gap-1.5 px-2 h-7.5 rounded-lg transition-all shrink-0 cursor-pointer ${
            controlCenterOpen
              ? "bg-white/20 text-accent shadow-sm"
              : "hover:bg-white/10 text-white/70 hover:text-white active:scale-95"
          }`}
        >
          <GIconSignal size={13} />
          <GIconVolume size={13} />
        </button>

        <button
          data-date-trigger="true"
          onClick={() => toggle("date")}
          title="Calendar & Date"
          className="h-8 px-1.5 sm:px-2 rounded-lg hover:bg-white/10 active:bg-white/15 transition-colors shrink-0 flex flex-col justify-center text-right font-mono cursor-pointer"
        >
          <div className="text-[11px] sm:text-xs font-semibold text-white/90 leading-none">{time}</div>
          <div className="text-[9px] text-white/45 leading-none mt-0.5 hidden sm:block">{date}</div>
        </button>

        {/* 4. Far Right: Show Desktop Peek Bar */}
        <button
          onClick={() => {
            if (systemSounds) soundFx.playClick();
            toggleShowDesktop();
          }}
          title="Show Desktop (Minimize/Restore all)"
          className="w-1.5 sm:w-2 h-7 sm:h-8 hover:bg-white/20 active:bg-white/30 rounded-[2px] transition-colors shrink-0 ml-0.5 sm:ml-1 border-l border-white/20 cursor-pointer"
          aria-label="Show Desktop"
        />

        {panel === "tray" && <TrayFlyout onClose={() => setPanel(null)} />}
        {panel === "date" && <DateFlyout onClose={() => setPanel(null)} />}
      </div>

      {/* Desktop Backdrop Blur Overlay — active whenever any taskbar flyout is open */}
      {panel && (
        <div
          className="fixed inset-0 bottom-12 z-[950] bg-black/50 backdrop-blur-md transition-opacity duration-200 cursor-pointer"
          onClick={() => {
            if (systemSounds) soundFx.playClick();
            setPanel(null);
          }}
        />
      )}

      {panel === "weather" && <WeatherFlyout onClose={() => setPanel(null)} />}
      {panel === "start" && <StartMenu onClose={() => setPanel(null)} />}
    </div>
  );
}
