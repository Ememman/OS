import { useEffect, useRef } from "react";
import { useOS } from "./store/useOS";
import { useIsMobile } from "./lib/useMediaQuery";
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
import SpotlightSearch from "./components/SpotlightSearch";
import NotificationToast from "./components/NotificationToast";
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

import {
  GIconResume,
  GIconGames,
  GIconTerminal,
  GIconCalculator,
  GIconNotes,
} from "./components/icons/GravityIcons";

const APP_COMPONENTS = {
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
};

export default function App() {
  const {
    windows,
    openApp,
    accent,
    reduceMotion,
    booted,
    osChosen,
    osMode,
    dockPosition,
    glassAlpha,
    toggleSpotlight,
    notify,
  } = useOS();

  const isWin = osMode === "win";
  const isMobile = useIsMobile();
  const macDockLeft = !isWin && !isMobile && dockPosition === "left";
  const macDockRight = !isWin && !isMobile && dockPosition === "right";
  const welcomed = useRef(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.style.setProperty("--glass-alpha", String(glassAlpha));
  }, [glassAlpha]);

  // Global Spotlight Keyboard Shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleSpotlight();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSpotlight]);

  // Welcome toast notification on start
  useEffect(() => {
    if (booted && osChosen && !welcomed.current) {
      welcomed.current = true;
      setTimeout(() => {
        notify(
          "Welcome to Portfolio OS",
          "Enhanced with Gravity UI, Terminal CLI, & Spotlight (⌘K)."
        );
      }, 600);
    }
  }, [booted, osChosen, notify]);

  if (!booted) return <BootScreen />;
  if (!osChosen) return <OsPicker />;

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${reduceMotion ? "reduced-motion" : ""}`}>
      <Wallpaper />
      <GlobalAudioPlayer />
      {!isWin && <MenuBar />}

      {/* Desktop icons */}
      <div
        className={`absolute ${isWin ? "top-4" : "top-11"} ${macDockLeft ? "left-24" : "left-4 sm:left-6"} reveal`}
        style={{ animationDelay: "40ms" }}
      >
        <DesktopIcon icon={GIconResume} label="Resume" color="#4B5A73" onOpen={() => openApp("resume")} />
      </div>
      <div
        className={`absolute ${isWin ? "top-4" : "top-11"} ${macDockLeft ? "left-44 sm:left-48" : "left-24 sm:left-28"} reveal`}
        style={{ animationDelay: "90ms" }}
      >
        <DesktopIcon icon={GIconGames} label="Blast It!" color="#D98A4E" onOpen={() => openApp("games")} />
      </div>
      <div
        className={`absolute ${isWin ? "top-4" : "top-11"} ${macDockLeft ? "left-64 sm:left-72" : "left-44 sm:left-50"} reveal`}
        style={{ animationDelay: "130ms" }}
      >
        <DesktopIcon icon={GIconTerminal} label="Terminal" color="#22c55e" onOpen={() => openApp("terminal")} />
      </div>
      <div
        className={`absolute ${isWin ? "top-4" : "top-11"} ${macDockLeft ? "left-[340px]" : "left-64 sm:left-72"} reveal`}
        style={{ animationDelay: "170ms" }}
      >
        <DesktopIcon icon={GIconNotes} label="Notes" color="#f59e0b" onOpen={() => openApp("notes")} />
      </div>
      <div
        className={`absolute ${isWin ? "top-4" : "top-11"} ${macDockLeft ? "left-[420px]" : "left-[330px] sm:left-[364px]"} reveal`}
        style={{ animationDelay: "210ms" }}
      >
        <DesktopIcon icon={GIconCalculator} label="Calculator" color="#06b6d4" onOpen={() => openApp("calculator")} />
      </div>

      {/* Widget stack — macOS style only */}
      {!isWin && (
        isMobile ? (
          <div className="absolute top-28 left-0 right-0 bottom-32 flex flex-col items-center gap-4 overflow-y-auto thin-scroll px-4 pb-4">
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
            <div className={`absolute top-32 ${macDockLeft ? "left-24" : "left-6"} flex flex-col gap-5`}>
              <div className="reveal" style={{ animationDelay: "140ms" }}><PhotoWidget /></div>
              <div className="reveal" style={{ animationDelay: "190ms" }}><ShortcutTiles /></div>
              <div className="reveal" style={{ animationDelay: "240ms" }}><NoteWidget /></div>
            </div>

            {/* Right column: weather, clock, calendar */}
            <div className={`absolute top-11 ${macDockRight ? "right-24" : "right-6"} flex flex-col gap-5 items-end`}>
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
        return (
          <Window key={win.id} win={win}>
            <Comp />
          </Window>
        );
      })}

      {isWin ? <WinTaskbar /> : <Dock />}
      <MiniPlayer />
      <SpotlightSearch />
      <NotificationToast />
    </div>
  );
}
