import { useEffect, useState, lazy, Suspense } from "react";
import { WindowAppSkeleton } from "./components/common/Skeletons";
import { useOS } from "./store/useOS";
import { applyHarmonizedPaletteToDoc } from "./lib/colorHarmonizer";
import { useIsMobile, useIsTablet } from "./lib/useMediaQuery";
import Wallpaper from "./components/Wallpaper";
import MenuBar from "./components/MenuBar";
import Dock from "./components/Dock";
import WinTaskbar from "./components/win/WinTaskbar";
import DesktopAppsGrid from "./components/DesktopAppsGrid";
import DesktopFolderModal from "./components/DesktopFolderModal";
import DesktopNameModal from "./components/DesktopNameModal";
import Window from "./components/Window";
import ErrorBoundary from "./components/ui/ErrorBoundary";
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
import AppContextMenu from "./components/AppContextMenu";
import AppPropertiesModal from "./components/AppPropertiesModal";
import WinTaskbarContextMenu from "./components/win/WinTaskbarContextMenu";
import WinTaskbarSettingsModal from "./components/win/WinTaskbarSettingsModal";
import LiveShowWallpaper from "./components/LiveShowWallpaper";
import DynamicIsland from "./components/DynamicIsland";
import { touchChatActivity } from "./lib/chatSession";
import { API_URL } from "./lib/config";
import { getSocket } from "./lib/socket";
import PhotoWidget from "./components/widgets/PhotoWidget";
import WeatherWidget from "./components/widgets/WeatherWidget";
import ClockWidget from "./components/widgets/ClockWidget";
import AgendaWidget from "./components/widgets/AgendaWidget";
import NoteWidget from "./components/widgets/NoteWidget";
import ShortcutTiles from "./components/widgets/ShortcutTiles";
import { useDesktopStore } from "./store/useDesktopStore";
import { APP_REGISTRY } from "./types/desktop";

const Library = lazy(() => import("./components/apps/Library"));
const Music = lazy(() => import("./components/apps/Music"));
const Updates = lazy(() => import("./components/apps/Updates"));
const Chats = lazy(() => import("./components/apps/Chats"));
const Gallery = lazy(() => import("./components/apps/Gallery"));
const Games = lazy(() => import("./components/apps/Games"));
const Files = lazy(() => import("./components/apps/Files"));
const Settings = lazy(() => import("./components/apps/Settings"));
const Resume = lazy(() => import("./components/apps/Resume"));
const PdfViewer = lazy(() => import("./components/apps/PdfViewer"));
const Browser = lazy(() => import("./components/apps/Browser"));
const Terminal = lazy(() => import("./components/apps/Terminal"));
const Calculator = lazy(() => import("./components/apps/Calculator"));
const Notes = lazy(() => import("./components/apps/Notes"));
const ActivityMonitor = lazy(() => import("./components/apps/ActivityMonitor"));
const Guestbook = lazy(() => import("./components/apps/Guestbook"));
const CodePlay = lazy(() => import("./components/apps/CodePlay"));
import MissionControl from "./components/MissionControl";

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
  "pdf-viewer": PdfViewer,
  browser: Browser,
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
    closeWindow,
    harmonizedPalette,
    reduceMotion,
    booted,
    osChosen,
    osMode,
    themeMode,
    dockPosition,
    glassAlpha,
    widgetsVisible,
    toggleSpotlight,
    toggleMissionControl,
    isPoweredOff,
    isSleeping,
    powerDialogOpen,
    closePowerDialog,
    liveShowEnabled,
    liveShowTimeout,
    isLiveShowActive,
    startLiveShow,
    stopLiveShow,
    showDesktopApps,
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
    applyHarmonizedPaletteToDoc(harmonizedPalette, themeMode);
  }, [harmonizedPalette, themeMode]);

  useEffect(() => {
    document.documentElement.style.setProperty("--glass-alpha", String(glassAlpha));
  }, [glassAlpha]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleSpotlight();
        return;
      }
      if (e.key === "F3" || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "m")) {
        e.preventDefault();
        toggleMissionControl();
        return;
      }

      if (isInput) return;

      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && e.key.toLowerCase() === "d" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        useOS.getState().toggleShowDesktop();
      } else if (cmd && e.key.toLowerCase() === "m" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        const activeWins = useOS.getState().windows.filter((w) => !w.minimized);
        if (activeWins.length > 0) {
          const focused = activeWins.reduce((a, b) => (a.z > b.z ? a : b));
          useOS.getState().minimizeWindow(focused.id);
        }
      } else if (cmd && e.key.toLowerCase() === "w" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        const activeWins = useOS.getState().windows.filter((w) => !w.minimized);
        if (activeWins.length > 0) {
          const focused = activeWins.reduce((a, b) => (a.z > b.z ? a : b));
          useOS.getState().closeWindow(focused.id);
        }
      } else if (cmd && e.shiftKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        useOS.getState().closeAllWindows();
      } else if (cmd && e.key === ",") {
        e.preventDefault();
        useOS.getState().openApp("settings");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSpotlight, toggleMissionControl]);

  useEffect(() => {
    getSocket();

    const checkRealUpdates = async () => {
      try {
        const res = await fetch(`${API_URL}/api/updates`);
        if (!res.ok) return;
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const lastViewed = localStorage.getItem("os_last_viewed_update_id");
          if (!lastViewed) {
            localStorage.setItem("os_last_viewed_update_id", list[0].id);
          } else {
            const idx = list.findIndex((u: any) => u.id === lastViewed);
            const unread = idx === -1 ? 0 : idx;
            if (unread > 0) {
              useOS.getState().setAppBadge("updates", unread);
            }
          }
        }
      } catch {}
    };
    checkRealUpdates();
  }, []);

  useEffect(() => {
    if (!booted || !osChosen || isPoweredOff || isSleeping || !liveShowEnabled || liveShowTimeout <= 0) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    const timeoutMs = Math.max(0.5, liveShowTimeout) * 60 * 1000;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        startLiveShow();
      }, timeoutMs);
    };

    let lastInteraction = Date.now();
    const handleUserActivity = () => {
      if (useOS.getState().isLiveShowActive) {
        useOS.getState().stopLiveShow();
      }
      const now = Date.now();
      if (now - lastInteraction > 500) {
        lastInteraction = now;
        resetTimer();
      }
    };

    resetTimer();

    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
    };
  }, [
    booted,
    osChosen,
    isPoweredOff,
    isSleeping,
    liveShowEnabled,
    liveShowTimeout,
    startLiveShow,
    stopLiveShow,
  ]);

  if (isPoweredOff) return <PowerOffScreen />;
  if (!booted) return <BootScreen />;
  if (!osChosen) return <OsPicker />;

  const hasActiveWindow = windows.some((w) => !w.minimized);

  const isNearDockOrBar = (clientX: number, clientY: number) => {
    if (typeof window === "undefined") return false;
    const isBottomDock = isWin || isMobile || dockPosition === "bottom";
    if (isBottomDock && clientY > window.innerHeight - 95) return true;
    if (!isMobile && dockPosition === "left" && clientX < 95) return true;
    if (!isMobile && dockPosition === "right" && clientX > window.innerWidth - 95) return true;
    if (!isWin && clientY < 36) return true;
    return false;
  };

  return (
    <div
      onContextMenu={handleDesktopContextMenu}
      onDragOver={(e) => {
        if (isNearDockOrBar(e.clientX, e.clientY)) return;
        if (
          e.dataTransfer.types.includes("application/x-dock-app") ||
          e.dataTransfer.types.includes("text/plain")
        ) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={(e) => {
        if (isNearDockOrBar(e.clientX, e.clientY)) return;
        const app =
          e.dataTransfer.getData("application/x-dock-app") ||
          e.dataTransfer.getData("text/plain");
        if (app && APP_REGISTRY[app]) {
          e.preventDefault();
          useDesktopStore.getState().addOrPositionApp(app, e.clientX, e.clientY);
        }
      }}
      className={`relative w-screen h-screen overflow-hidden ${reduceMotion ? "reduced-motion" : ""}`}
    >
      <Wallpaper />
      <GlobalAudioPlayer />

      {isLiveShowActive && <LiveShowWallpaper onClose={stopLiveShow} />}

      <div
        className={`transition-opacity duration-700 ease-in-out ${
          isLiveShowActive ? "opacity-0 pointer-events-none invisible" : "opacity-100"
        }`}
      >
        {!isWin && (!isMobile || !hasActiveWindow) && (
          <MenuBar />
        )}

        <DynamicIsland />

        {isTablet ? (
          <>
            {showDesktopApps && (
              <div
                className="absolute inset-0 z-10 pointer-events-none reveal overflow-hidden"
                style={{ animationDelay: "50ms" }}
              >
                <DesktopAppsGrid isMobile={true} />
              </div>
            )}

            {!isWin && widgetsVisible && (
              <div
                data-widget-area="true"
                className={`absolute ${
                  !isWin ? "top-60 sm:top-68" : "top-56"
                } left-0 right-0 bottom-0 overflow-y-auto overscroll-contain thin-scroll px-3 pt-2 pb-28 flex flex-col items-center gap-4 z-[15] pointer-events-auto`}
                style={{ touchAction: "pan-y" }}
              >
                <div className="reveal w-full flex justify-center" style={{ animationDelay: "120ms" }}><PhotoWidget /></div>
                <div className="reveal w-full flex justify-center" style={{ animationDelay: "150ms" }}><WeatherWidget /></div>
                <div className="reveal w-full flex justify-center" style={{ animationDelay: "180ms" }}><ClockWidget /></div>
                <div className="reveal w-full flex justify-center" style={{ animationDelay: "210ms" }}><AgendaWidget /></div>
                <div className="reveal w-full flex justify-center" style={{ animationDelay: "240ms" }}><NoteWidget /></div>
                <div className="reveal w-full flex justify-center" style={{ animationDelay: "270ms" }}><ShortcutTiles /></div>
                <div className="h-20 shrink-0 w-full" aria-hidden="true" />
              </div>
            )}
          </>
        ) : (
          <>
            
            {showDesktopApps && (
              <div
                className="absolute inset-0 z-10 pointer-events-none reveal overflow-hidden"
                style={{ animationDelay: "50ms" }}
              >
                <DesktopAppsGrid isMobile={false} />
              </div>
            )}

            {!isWin && widgetsVisible && (
              <>
                <div
                  data-widget-area="true"
                  data-widget-column="left"
                  className={`absolute top-36 ${macDockLeft ? "left-24" : "left-6"} flex flex-col gap-4 max-h-[calc(100vh-160px)] overflow-y-auto overscroll-contain thin-scroll pr-1 pb-20 pointer-events-auto z-[15]`}
                >
                  <div className="reveal" style={{ animationDelay: "140ms" }}><PhotoWidget /></div>
                  <div className="reveal" style={{ animationDelay: "190ms" }}><ShortcutTiles /></div>
                  <div className="reveal" style={{ animationDelay: "240ms" }}><NoteWidget /></div>
                </div>

                <div
                  data-widget-area="true"
                  data-widget-column="right"
                  className={`absolute top-12 ${macDockRight ? "right-24" : "right-6"} flex flex-col gap-4 items-end max-h-[calc(100vh-100px)] overflow-y-auto overscroll-contain thin-scroll pl-1 pb-20 pointer-events-auto z-[15]`}
                >
                  <div className="reveal" style={{ animationDelay: "170ms" }}><WeatherWidget /></div>
                  <div className="reveal" style={{ animationDelay: "220ms" }}><ClockWidget /></div>
                  <div className="reveal" style={{ animationDelay: "270ms" }}><AgendaWidget /></div>
                </div>
              </>
            )}
          </>
        )}

        {windows.map((win) => {
          const Comp = APP_COMPONENTS[win.app];
          if (!Comp) return null;
          return (
            <Window key={win.id} win={win}>
              <ErrorBoundary fallbackTitle={win.title} onClose={() => closeWindow(win.id)}>
                <Suspense fallback={<WindowAppSkeleton title={win.title} />}>
                  <Comp />
                </Suspense>
              </ErrorBoundary>
            </Window>
          );
        })}

        {(!isMobile || !hasActiveWindow) && (
          isWin ? <WinTaskbar /> : <Dock />
        )}
        <MiniPlayer />
      </div>
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
      <AppContextMenu />
      <AppPropertiesModal />
      <WinTaskbarContextMenu />
      <WinTaskbarSettingsModal />
      {powerDialogOpen && <PowerDialog onClose={closePowerDialog} />}
      {isSleeping && <SleepScreen />}
      <DesktopFolderModal />
      <DesktopNameModal />
    </div>
  );
}
