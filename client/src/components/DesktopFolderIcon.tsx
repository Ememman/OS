import { useRef, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import type { DesktopFolderItem } from "../types/desktop";
import { APP_REGISTRY } from "../types/desktop";
import { useIsMobile } from "../lib/useMediaQuery";

interface DesktopFolderIconProps {
  folder: DesktopFolderItem;
  onOpen: () => void;
  style?: CSSProperties;
  isCombineTarget?: boolean;
}

export default function DesktopFolderIcon({
  folder,
  onOpen,
  style,
  isCombineTarget,
}: DesktopFolderIconProps) {
  const [selected, setSelected] = useState(false);
  const isMobile = useIsMobile();
  const lastTap = useRef(0);

  const handleClick = () => {
    if (isMobile) {
      onOpen();
      return;
    }
    setSelected(true);
    const now = Date.now();
    if (now - lastTap.current < 350) {
      onOpen();
    }
    lastTap.current = now;
  };

  // Mini-grid displays up to 9 apps (3x3), matching the user screenshot!
  const displayApps = folder.apps.slice(0, 9);
  // Fill remaining slots up to 9 if desired, or keep neat
  const emptySlots = Math.max(0, 9 - displayApps.length);

  return (
    <motion.div
      data-desktop-item-id={folder.id}
      onClick={handleClick}
      onDoubleClick={onOpen}
      onBlur={() => setSelected(false)}
      tabIndex={0}
      style={{ touchAction: "pan-y", ...style }}
      whileHover={isMobile ? undefined : { scale: 1.07, y: -2 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 450, damping: 22 }}
      className={`group relative flex flex-col items-center gap-1 sm:gap-1.5 w-full max-w-[84px] sm:w-20 py-1.5 sm:py-2 rounded-xl outline-none cursor-pointer select-none touch-pan-y ${
        selected ? "bg-white/10 ring-1 ring-white/20" : "hover:bg-white/5"
      }`}
    >
      {/* Folder Container: Frosted Glass Squircle matching user screenshot */}
      <div
        className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-[20px] flex items-center justify-center p-1.5 sm:p-2 transition-all duration-200 border ${
          isCombineTarget
            ? "ring-2 ring-[#0091ff] border-[#0091ff] shadow-[0_0_22px_rgba(0,145,255,0.7)] scale-110 bg-[#0091ff]/20"
            : selected
            ? "bg-white/20 border-accent shadow-lg shadow-accent/25"
            : "bg-[#0b101c]/85 sm:bg-[#0b101c]/70 backdrop-blur-xl border-white/20 group-hover:border-white/35 group-hover:bg-[#0b101c]/90 shadow-xl shadow-black/50"
        }`}
      >
        {/* 3x3 Mini App Grid */}
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5 w-full h-full items-center justify-items-center">
          {displayApps.map((a) => {
            const reg = APP_REGISTRY[a.app];
            const Icon = reg?.icon;
            const tileBg = a.color || reg?.color || "#38bdf8";

            return (
              <div
                key={a.id || a.app}
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] sm:rounded-[4px] flex items-center justify-center shadow-xs overflow-hidden shrink-0"
                style={{ backgroundColor: tileBg }}
                title={a.label}
              >
                {Icon && (
                  <Icon
                    size={8}
                    className="text-white scale-75 sm:scale-90"
                    color="#ffffff"
                  />
                )}
              </div>
            );
          })}

          {/* Faint subtle placeholder dots for empty slots in 3x3 grid */}
          {emptySlots > 0 &&
            Array.from({ length: emptySlots }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] sm:rounded-[4px] bg-white/5 border border-white/5 shrink-0"
              />
            ))}
        </div>

        {/* Vibrant Red Notification Badge matching the reference screenshot! */}
        <div className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-bold text-[9px] sm:text-[10px] min-w-[18px] h-[18px] sm:min-w-5 sm:h-5 rounded-full flex items-center justify-center px-1 border-2 border-[#070a12] shadow-md shadow-rose-500/40 select-none">
          {folder.badge ?? folder.apps.length}
        </div>
      </div>

      {/* Folder Name Label */}
      <span
        className={`text-[10px] sm:text-[11px] font-semibold text-white text-center leading-tight px-1.5 py-0.5 rounded-md truncate max-w-full tracking-wide transition-colors ${
          selected ? "bg-accent text-white shadow-md shadow-accent/30" : "group-hover:text-white text-white/95"
        }`}
        style={{
          textShadow: "0 1px 3px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.85)",
        }}
        title={folder.name}
      >
        {folder.name}
      </span>
    </motion.div>
  );
}
