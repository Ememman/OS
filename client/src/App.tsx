import { useEffect, useState, lazy, Suspense } from "react";
import { useOS } from "./store/useOS";
import { applyHarmonizedPaletteToDoc } from "./lib/colorHarmonizer";
import { useIsMobile, useIsTablet } from "./lib/useMediaQuery";
import Wallpaper from "./components/Wallpaper";
import MenuBar from "./components/MenuBar";
import Dock from "./components/Dock";
import WinTaskbar from "./components/win/WinTaskbar";
import DesktopIcon from "./components/DesktopIcon";
import Window from "./components/Window";
import GlobalAudioPlayer from "./components/GlobalAudioPlayer";
import MiniPlayer from "./components/MiniPlayer";
import BootScreen from "./components/BootScreen";
import OsPicker from "./components/OsPicker";
import PowerOffScreen from "./components/PowerOffScreen";
import SleepScreen from "./components/SleepScreen";
import PowerDialog from "./components/PowerDialog";
import SpotlightSearch from "./components/SpotlightSearch";
import ControlCenter from "./components/ControlCenter";
import NotificationToast from "./components/NotificationToast";
import DesktopContextMenu from "./components/DesktopContextMenu";
import { touchChatActivity } from "./lib/chatSession";
import PhotoWidget from "./components/widgets/PhotoWidget";
import WeatherWidget from "./components/widgets/WeatherWidget";
import ClockWidget from "./components/widgets/ClockWidget";
import AgendaWidget from "./components/widgets/AgendaWidget";
import NoteWidget from "./components/widgets/NoteWidget";
import ShortcutTiles from "./components/widgets/ShortcutTiles";

// Lazy-loaded application components for high-speed mobile booting & low memory footprint
const Library = lazy(() => import("./components/apps/Library"));
const Music = lazy(() => import("./components/apps/Music"));
const Updates = lazy(() => import("./components/apps/Updates"));
const Chats = lazy(() => import("./components/apps/Chats"));
const Gallery = lazy(() => import("./components/apps/Gallery"));
const Games = lazy(() => import("./components/apps/Games"));
const Files = lazy(() => import("./components/apps/Files"));
const Settings = lazy(() => import("./components/apps/Settings"));
const Resume = lazy(() => import("./components/apps/Resume"));
const Terminal = lazy(() => import("./components/apps/Terminal"));
const Calculator = lazy(() => import("./components/apps/Calculator"));
const Notes = lazy(() => import("./components/apps/Notes"));
const ActivityMonitor = lazy(() => import("./components/apps/ActivityMonitor"));
const Guestbook = lazy(() => import("./components/apps/Guestbook"));
const CodePlay = lazy(() => import("./components/apps/CodePlay"));
import MissionControl from "./components/MissionControl";

import {
  GIconResume,
  GIconGames,
  GIconTerminal,
  GIconCalculator,
  GIconNotes,
  GIconActivity,
  GIconBookOpen,
  GIconCode,
} from "./components/icons/GravityIcons";

const APP_COMPONENTS: Record<string, any> = {
  library: Library,
  music: Music,
  updates: Updates,
  chats: Chats,
  gallery: Gallery,
  games: Games,
  files: Files,
  settings: Settings,
  resume: Resume,
  terminal: Terminal,
  calculator: Calculator,
  notes: Notes,
  activity: ActivityMonitor,
  guestbook: Guestbook,
  codeplay: CodePlay,
};

export default function App() {
  const {
    windows,
    openApp,
    harmonizedPalette,
    reduceMotion,
    booted,
    osChosen,
    osMode,
    dockPosition,
    glassAlpha,
    widgetsVisible,
    toggleSpotlight,
    toggleMissionControl,
    isPoweredOff,
    isSleeping,
    powerDialogOpen,
    closePowerDialog,
  } = useOS();

  const isWin = osMode === "win";
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const macDockLeft = !isWin && !isMobile && dockPosition === "left";
  const macDockRight = !isWin && !isMobile && dockPosition === "right";
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleDesktopContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".glass, input, textarea, button, a")) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    applyHarmonizedPaletteToDoc(harmonizedPalette, true);
  }, [harmonizedPalette]);

  useEffect(() => {
    document.documentElement.style.setProperty("--glass-alpha", String(glassAlpha));
  }, [glassAlpha]);

  // Keep chat session active while user is interacting with the OS (1hr inactivity timeout)
  useEffect(() => {
    let lastTouched = 0;
    const onUserInteraction = () => {
      const now = Date.now();
      if (now - lastTouched > 30000) {
        lastTouched = now;
        touchChatActivity();
      }
    };
    onUserInteraction();
    window.addEventListener("pointerdown", onUserInteraction, { passive: true });
    window.addEventListener("keydown", onUserInteraction, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onUserInteraction);
      window.removeEventListener("keydown", onUserInteraction);
    };
  }, []);

  // Global Spotlight Keyboard Shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleSpotlight();
      } else if (e.key === "F3" || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "m")) {
        e.preventDefault();
        toggleMissionControl();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSpotlight, toggleMissionControl]);

  if (isPoweredOff) return <PowerOffScreen />;
  if (!booted) return <BootScreen />;
  if (!osChosen) return <OsPicker />;

  return (
    <div
      onContextMenu={handleDesktopContextMenu}
      className={`relative w-screen h-screen overflow-hidden ${reduceMotion ? "reduced-motion" : ""}`}
    >
      <Wallpaper />
      <GlobalAudioPlayer />
      {!isWin && <MenuBar />}

      {/* Desktop icons - fully responsive flex layout with safe mobile wrapping */}
      <div
        className={`absolute ${isWin ? "top-3" : "top-10 sm:top-12"} ${
          macDockLeft ? "left-20 sm:left-24" : "left-3 sm:left-6"
        } flex flex-wrap items-center gap-2 sm:gap-3 max-w-[calc(100vw-24px)] z-10 pointer-events-auto reveal`}
        style={{ animationDelay: "50ms" }}
      >
        <DesktopIcon icon={GIconResume} label="Resume" color="#4B5A73" onOpen={() => openApp("resume")} />
        <DesktopIcon icon={GIconGames} label="Games" color="#D98A4E" onOpen={() => openApp("games")} />
        <DesktopIcon icon={GIconCode} label="CodePlay" color="#38bdf8" onOpen={() => openApp("codeplay")} />
        <DesktopIcon icon={GIconTerminal} label="Terminal" color="#22c55e" onOpen={() => openApp("terminal")} />
        <DesktopIcon icon={GIconNotes} label="Notes" color="#f59e0b" onOpen={() => openApp("notes")} />
        <DesktopIcon icon={GIconCalculator} label="Calculator" color="#06b6d4" onOpen={() => openApp("calculator")} />
        <DesktopIcon icon={GIconActivity} label={isWin ? "Task Manager" : "Activity"} color="#10b981" onOpen={() => openApp("activity")} />
        <DesktopIcon icon={GIconBookOpen} label="Guestbook" color="#8b5cf6" onOpen={() => openApp("guestbook")} />
      </div>

      {/* Widget stack — macOS style only */}
      {!isWin && widgetsVisible && (
        isTablet ? (
          <div className={`absolute ${isMobile ? "top-60 min-[456px]:top-36" : "top-36"} left-0 right-0 bottom-24 flex flex-col items-center gap-4 overflow-y-auto thin-scroll px-4 pb-8`}>
            <div className="reveal w-full flex justify-center" style={{ animationDelay: "120ms" }}><PhotoWidget /></div>
            <div className="reveal w-full flex justify-center" style={{ animationDelay: "150ms" }}><WeatherWidget /></div>
            <div className="reveal w-full flex justify-center" style={{ animationDelay: "180ms" }}><ClockWidget /></div>
            <div className="reveal w-full flex justify-center" style={{ animationDelay: "210ms" }}><AgendaWidget /></div>
            <div className="reveal w-full flex justify-center" style={{ animationDelay: "240ms" }}><NoteWidget /></div>
            <div className="reveal w-full flex justify-center" style={{ animationDelay: "270ms" }}><ShortcutTiles /></div>
          </div>
        ) : (
          <>
            {/* Left column: photo, shortcuts below it, then note */}
            <div className={`absolute top-36 ${macDockLeft ? "left-24" : "left-6"} flex flex-col gap-4`}>
              <div className="reveal" style={{ animationDelay: "140ms" }}><PhotoWidget /></div>
              <div className="reveal" style={{ animationDelay: "190ms" }}><ShortcutTiles /></div>
              <div className="reveal" style={{ animationDelay: "240ms" }}><NoteWidget /></div>
            </div>

            {/* Right column: weather, clock, calendar */}
            <div className={`absolute top-12 ${macDockRight ? "right-24" : "right-6"} flex flex-col gap-4 items-end`}>
              <div className="reveal" style={{ animationDelay: "170ms" }}><WeatherWidget /></div>
              <div className="reveal" style={{ animationDelay: "220ms" }}><ClockWidget /></div>
              <div className="reveal" style={{ animationDelay: "270ms" }}><AgendaWidget /></div>
            </div>
          </>
        )
      )}

      {/* Windows */}
      {windows.map((win) => {
        const Comp = APP_COMPONENTS[win.app];
        if (!Comp) return null;
        return (
          <Window key={win.id} win={win}>
            <Suspense
              fallback={
                <div className="flex-1 flex flex-col items-center justify-center p-8 gap-2.5 text-white/50 select-none">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
                  <span className="text-[11px] font-mono">Loading {win.title}...</span>
                </div>
              }
            >
              <Comp />
            </Suspense>
          </Window>
        );
      })}

      {isWin ? <WinTaskbar /> : <Dock />}
      <MiniPlayer />
      <SpotlightSearch />
      <MissionControl />
      <ControlCenter />
      <NotificationToast />
      {contextMenu && (
        <DesktopContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          widgetsVisible={widgetsVisible}
        />
      )}
      {powerDialogOpen && <PowerDialog onClose={closePowerDialog} />}
      {isSleeping && <SleepScreen />}
    </div>
  );
}
