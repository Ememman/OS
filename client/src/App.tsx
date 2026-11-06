import { useEffect, useRef, useState } from "react";
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
import PhotoWidget from "./components/widgets/PhotoWidget";
import WeatherWidget from "./components/widgets/WeatherWidget";
import ClockWidget from "./components/widgets/ClockWidget";
import AgendaWidget from "./components/widgets/AgendaWidget";
import NoteWidget from "./components/widgets/NoteWidget";
import ShortcutTiles from "./components/widgets/ShortcutTiles";

import Library from "./components/apps/Library";
import Music from "./components/apps/Music";
import Updates from "./components/apps/Updates";
import Chats from "./components/apps/Chats";
import Gallery from "./components/apps/Gallery";
import Games from "./components/apps/Games";
import Files from "./components/apps/Files";
import Settings from "./components/apps/Settings";
import Resume from "./components/apps/Resume";
import Terminal from "./components/apps/Terminal";
import Calculator from "./components/apps/Calculator";
import Notes from "./components/apps/Notes";
import ActivityMonitor from "./components/apps/ActivityMonitor";
import Guestbook from "./components/apps/Guestbook";
import CodePlay from "./components/apps/CodePlay";
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
    themeMode,
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
    nightShift,
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
    applyHarmonizedPaletteToDoc(harmonizedPalette, themeMode === "night");
  }, [harmonizedPalette, themeMode]);

  useEffect(() => {
    document.documentElement.style.setProperty("--glass-alpha", String(glassAlpha));
  }, [glassAlpha]);

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
      {/* Night Shift warm overlay */}
      {nightShift && (
        <div className="pointer-events-none fixed inset-0 z-[99999] bg-amber-500/10 mix-blend-multiply transition-opacity duration-500" />
      )}

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
            <Comp />
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
