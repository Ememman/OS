import { useOS } from "./../store/useOS";
import { useIsMobile } from "../lib/useMediaQuery";
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
  GIconTrash,
} from "./icons/GravityIcons";

const DOCK_ITEMS = [
  { app: "terminal", label: "Terminal", icon: GIconTerminal, color: "#22c55e" },
  { app: "notes", label: "Notes", icon: GIconNotes, color: "#f59e0b" },
  { app: "calculator", label: "Calculator", icon: GIconCalculator, color: "#06b6d4" },
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
  bottom: "bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 max-w-[calc(100vw-16px)]",
  left: "left-1 sm:left-2 top-1/2 -translate-y-1/2 max-h-[calc(100vh-56px)]",
  right: "right-1 sm:right-2 top-1/2 -translate-y-1/2 max-h-[calc(100vh-56px)]",
};

export default function Dock() {
  const { openApp, windows, closeWindow, compact, dockPosition } = useOS();
  const isMobile = useIsMobile();
  // Vertical dock placement only makes sense with real screen width to spare — force bottom on phones.
  const position = isMobile ? "bottom" : dockPosition;
  const vertical = position === "left" || position === "right";
  const effectiveCompact = compact || isMobile;
  const openApps = new Set(windows.map((w) => w.app));
  const size = effectiveCompact ? "w-9 h-9 sm:w-10 sm:h-10" : "w-12 h-12";
  const iconSize = effectiveCompact ? 16 : 22;
  const tooltipPos = position === "left"
    ? "left-full ml-2 top-1/2 -translate-y-1/2"
    : position === "right"
      ? "right-full mr-2 top-1/2 -translate-y-1/2"
      : "-top-8 left-1/2 -translate-x-1/2";

  const emptyTrash = () => windows.forEach((w) => closeWindow(w.id));

  return (
    <div className={`absolute z-\[900] reveal-fade ${POSITION_CLASSES[position]}`}>
      <div
        className={`glass rounded-2xl shadow-2xl border border-white/10 ${
          vertical
            ? "flex flex-col items-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 max-w-full overflow-y-auto thin-scroll"
            : "flex items-end gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 max-w-full overflow-x-auto no-scrollbar"
        }`}
      >
        {DOCK_ITEMS.map(({ app, label, icon: Icon, color }) => (
          <button
            key={app}
            onClick={() => openApp(app)}
            title={label}
            className={`group relative flex flex-col items-center justify-center shrink-0 ${size} rounded-2xl transition-all duration-150 hover:scale-110 active:scale-95 ${
              vertical ? "hover:translate-x-1" : "hover:-translate-y-2"
            }`}
            style={{ background: `linear-gradient(160deg, ${color}33, ${color}18)`, border: `1px solid ${color}30` }}
          >
            <Icon size={iconSize} color={color} />
            <span className={`pointer-events-none absolute ${tooltipPos} text-[10px] bg-black/85 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap hidden sm:block`}>
              {label}
            </span>
            {openApps.has(app) && (
              <span
                className={`absolute rounded-full bg-white/80 ${
                  vertical ? "w-1 h-1 left-0.5 top-1/2 -translate-y-1/2" : "w-1 h-1 -bottom-1"
                }`}
              />
            )}
          </button>
        ))}
        <div className={vertical ? "h-px w-8 bg-white/10 my-1 shrink-0" : "w-px h-8 bg-white/10 mx-1 self-center shrink-0"} />
        <button
          onClick={emptyTrash}
          title="Close all windows"
          className={`group relative flex flex-col items-center justify-center shrink-0 ${size} rounded-2xl transition-all duration-150 hover:scale-110 active:scale-95 ${
            vertical ? "hover:translate-x-1" : "hover:-translate-y-2"
          }`}
          style={{ background: "linear-gradient(160deg, #8892a633, #8892a618)", border: "1px solid #8892a630" }}
        >
          <GIconTrash size={effectiveCompact ? 15 : 20} color="#8892A6" />
          <span className={`pointer-events-none absolute ${tooltipPos} text-[10px] bg-black/85 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap hidden sm:block`}>
            Close all
          </span>
        </button>
      </div>
    </div>
  );
}
