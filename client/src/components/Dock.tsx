import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOS } from "./../store/useOS";
import { useIsMobile } from "../lib/useMediaQuery";
import { soundFx } from "../lib/soundFx";
import {
  GIconLibrary,
  GIconMusic,
  GIconTerminal,
  GIconNotes,
  GIconCalculator,
  GIconUpdates,
  GIconChats,
  GIconGallery,
  GIconGames,
  GIconFiles,
  GIconSettings,
  GIconResume,
  GIconActivity,
  GIconBookOpen,
  GIconTrash,
  GIconCode,
  GIconLayoutCells,
} from "./icons/GravityIcons";

const DOCK_ITEMS = [
  { app: "terminal", label: "Terminal", icon: GIconTerminal, color: "#22c55e" },
  { app: "codeplay", label: "CodePlay", icon: GIconCode, color: "#38bdf8" },
  { app: "notes", label: "Notes", icon: GIconNotes, color: "#f59e0b" },
  { app: "calculator", label: "Calculator", icon: GIconCalculator, color: "#06b6d4" },
  { app: "activity", label: "Activity Monitor", icon: GIconActivity, color: "#10b981" },
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

const POSITION_CLASSES = {
  bottom: "bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 max-w-[calc(100vw-12px)] sm:max-w-[calc(100vw-16px)]",
  left: "left-1 sm:left-2 top-1/2 -translate-y-1/2 max-h-[calc(100vh-56px)]",
  right: "right-1 sm:right-2 top-1/2 -translate-y-1/2 max-h-[calc(100vh-56px)]",
};

export default function Dock() {
  const { toggleApp, windows, closeWindow, compact, dockPosition, toggleMissionControl, missionControlOpen, systemSounds, unreadChatCount } = useOS();
  const isMobile = useIsMobile();
  const position = isMobile ? "bottom" : dockPosition;
  const vertical = position === "left" || position === "right";
  const effectiveCompact = compact && !isMobile;
  const openApps = new Set(windows.map((w) => w.app));
  const unminimized = windows.filter((w) => !w.minimized);
  const maxZ = unminimized.length > 0 ? Math.max(...unminimized.map((w) => w.z)) : 0;
  const size = isMobile ? "w-11 h-11" : effectiveCompact ? "w-10 h-10" : "w-12 h-12";
  const iconSize = isMobile ? 22 : effectiveCompact ? 16 : 22;
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

  const tooltipPos = position === "left"
    ? "left-full ml-2.5 top-1/2 -translate-y-1/2"
    : position === "right"
      ? "right-full mr-2.5 top-1/2 -translate-y-1/2"
      : "-top-8 left-1/2 -translate-x-1/2";

  const emptyTrash = () => {
    if (systemSounds) soundFx.playClose();
    windows.forEach((w) => closeWindow(w.id));
  };

  const handleLaunch = (app: string) => {
    toggleApp(app);
  };

  const hoverMotion = isMobile ? undefined : {
    scale: 1.22,
    y: vertical ? 0 : -8,
    x: vertical ? (position === "left" ? 6 : -6) : 0,
    transition: { type: "spring" as const, stiffness: 450, damping: 20 },
  };

  return (
    <div className={`fixed z-[900] ${POSITION_CLASSES[position]}`}>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 350, damping: 26 }}
        className={`glass rounded-2xl shadow-2xl border border-white/10 ${
          vertical
            ? "flex flex-col items-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 max-w-full overflow-y-auto thin-scroll touch-pan-y"
            : "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-2.5 py-1.5 sm:py-2 max-w-full overflow-x-auto no-scrollbar touch-pan-x"
        }`}
      >
        {/* Mission Control button */}
        <div className="relative">
          <motion.button
            onClick={toggleMissionControl}
            onMouseEnter={() => setHoveredApp("mission-control")}
            onMouseLeave={() => setHoveredApp(null)}
            whileHover={hoverMotion}
            whileTap={{ scale: 0.92 }}
            title="Mission Control (F3)"
            className={`relative flex flex-col items-center justify-center shrink-0 ${size} rounded-2xl transition-colors cursor-pointer ${
              missionControlOpen ? "bg-accent/40 border border-accent shadow-lg shadow-accent/20" : "hover:bg-white/10"
            }`}
            style={{ background: "linear-gradient(160deg, #38bdf833, #38bdf818)", border: "1px solid #38bdf830" }}
          >
            <GIconLayoutCells size={iconSize} color="#38bdf8" />
          </motion.button>
          <AnimatePresence>
            {hoveredApp === "mission-control" && !isMobile && (
              <motion.span
                initial={{ opacity: 0, scale: 0.85, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 4 }}
                transition={{ duration: 0.15 }}
                className={`pointer-events-none absolute ${tooltipPos} text-[10px] font-medium bg-black/85 backdrop-blur-md text-white px-2.5 py-1 rounded-lg border border-white/15 shadow-xl whitespace-nowrap z-50`}
              >
                Mission Control (F3)
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className={vertical ? "h-px w-8 bg-white/10 my-1 shrink-0" : "w-px h-8 bg-white/10 mx-1 self-center shrink-0"} />

        {/* Dock Items */}
        {DOCK_ITEMS.map(({ app, label, icon: Icon, color }) => {
          const appWin = windows.find((w) => w.app === app);
          const isAppActive = appWin && !appWin.minimized && appWin.z >= maxZ;
          const isAppMinimized = appWin?.minimized ?? false;
          return (
          <div key={app} className="relative">
            <motion.button
              onClick={() => handleLaunch(app)}
              onMouseEnter={() => setHoveredApp(app)}
              onMouseLeave={() => setHoveredApp(null)}
              whileHover={hoverMotion}
              whileTap={{ scale: 0.92 }}
              title={label}
              className={`relative flex flex-col items-center justify-center shrink-0 ${size} rounded-2xl transition-colors cursor-pointer`}
              style={{ background: `linear-gradient(160deg, ${color}33, ${color}18)`, border: `1px solid ${color}30` }}
            >
              <Icon size={iconSize} color={color} />
              {openApps.has(app) && (
                <motion.span
                  layoutId={`active-dot-${app}`}
                  className={`absolute rounded-full aspect-square shrink-0 ${
                    isAppActive
                      ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)]"
                      : isAppMinimized
                        ? "bg-white/45 shadow-none"
                        : "bg-white/80 shadow-[0_0_4px_rgba(255,255,255,0.5)]"
                  } ${
                    vertical ? "w-1 h-1 left-0.5 top-1/2 -translate-y-1/2" : isMobile ? "w-1.5 h-1.5 -bottom-0.5" : "w-1 h-1 -bottom-1"
                  }`}
                />
              )}
              {app === "chats" && unreadChatCount > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-rose-500/60 border border-white/30 z-20 pointer-events-none select-none"
                >
                  {unreadChatCount > 99 ? "99+" : unreadChatCount}
                </motion.span>
              )}
            </motion.button>

            <AnimatePresence>
              {hoveredApp === app && !isMobile && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.85, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className={`pointer-events-none absolute ${tooltipPos} text-[10px] font-medium bg-black/85 backdrop-blur-md text-white px-2.5 py-1 rounded-lg border border-white/15 shadow-xl whitespace-nowrap z-50`}
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        );
      })}

        <div className={vertical ? "h-px w-8 bg-white/10 my-1 shrink-0" : "w-px h-8 bg-white/10 mx-1 self-center shrink-0"} />

        {/* Empty Trash Button */}
        <div className="relative">
          <motion.button
            onClick={emptyTrash}
            onMouseEnter={() => setHoveredApp("trash")}
            onMouseLeave={() => setHoveredApp(null)}
            whileHover={hoverMotion}
            whileTap={{ scale: 0.92 }}
            title="Empty Trash (Close all windows)"
            className={`relative flex flex-col items-center justify-center shrink-0 ${size} rounded-2xl transition-colors cursor-pointer`}
            style={{ background: "linear-gradient(160deg, #8892a633, #8892a618)", border: "1px solid #8892a630" }}
          >
            <GIconTrash size={isMobile ? 20 : effectiveCompact ? 15 : 20} color="#8892A6" />
          </motion.button>
          <AnimatePresence>
            {hoveredApp === "trash" && !isMobile && (
              <motion.span
                initial={{ opacity: 0, scale: 0.85, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 4 }}
                transition={{ duration: 0.15 }}
                className={`pointer-events-none absolute ${tooltipPos} text-[10px] font-medium bg-black/85 backdrop-blur-md text-white px-2.5 py-1 rounded-lg border border-white/15 shadow-xl whitespace-nowrap z-50`}
              >
                Empty Trash (Close all)
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
