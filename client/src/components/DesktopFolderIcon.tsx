import { type CSSProperties } from "react";
import { motion } from "framer-motion";
import type { DesktopFolderItem } from "../types/desktop";
import { APP_REGISTRY } from "../types/desktop";

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
  // Mini-grid displays up to 9 apps (3x3)
  const displayApps = folder.apps.slice(0, 9);
  // Subtle placeholders for remaining slots up to 9 to preserve neat 3x3 grid symmetry
  const emptySlots = Math.max(0, 9 - displayApps.length);

  return (
    <div
      onClick={onOpen}
      onDoubleClick={onOpen}
      style={{ touchAction: "none", ...style }}
      className="group relative flex flex-col items-center gap-1 sm:gap-1.5 w-full max-w-[84px] sm:w-20 py-1.5 sm:py-2 rounded-xl outline-none select-none cursor-pointer"
    >
      {/* Folder Container: Frosted Glass Squircle with floating notification badge */}
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0">
        {/* Inner Glass Squircle with strict overflow-hidden so children NEVER overlap or stick out */}
        <motion.div
          whileHover={{ scale: 1.06, y: -1 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 450, damping: 22 }}
          className={`w-full h-full rounded-2xl sm:rounded-[20px] overflow-hidden flex items-center justify-center p-2 sm:p-2.5 transition-all duration-200 border ${
            isCombineTarget
              ? "ring-2 ring-[#0091ff] border-[#0091ff] shadow-[0_0_22px_rgba(0,145,255,0.7)] scale-110 bg-[#0091ff]/20"
              : "bg-[#0b101c]/90 sm:bg-[#0b101c]/80 backdrop-blur-xl border-white/20 group-hover:border-white/40 group-hover:bg-[#0b101c]/95 shadow-xl shadow-black/60"
          }`}
        >
          {/* 3x3 Mini App Grid cleanly scaled to fit 100% inside container boundaries */}
          <div className="grid grid-cols-3 gap-1 sm:gap-1.5 w-full h-full max-w-[34px] max-h-[34px] sm:max-w-[38px] sm:max-h-[38px] items-center justify-items-center">
            {displayApps.map((a) => {
              const reg = APP_REGISTRY[a.app];
              const Icon = reg?.icon;
              const tileBg = a.color || reg?.color || "#38bdf8";

              return (
                <div
                  key={a.id || a.app}
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-[2px] sm:rounded-[2.5px] flex items-center justify-center shadow-xs overflow-hidden shrink-0"
                  style={{ backgroundColor: tileBg }}
                  title={a.label}
                >
                  {Icon && (
                    <Icon
                      size={6}
                      className="text-white scale-75 sm:scale-85"
                      color="#ffffff"
                    />
                  )}
                </div>
              );
            })}

            {/* Faint subtle placeholder dots for empty slots - perfectly sized to never overflow */}
            {emptySlots > 0 &&
              Array.from({ length: emptySlots }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-[2px] bg-white/10 shrink-0"
                />
              ))}
          </div>
        </motion.div>

        {/* Vibrant Red Notification Badge: positioned on outer wrapper so it's never clipped */}
        <div className="absolute -top-1.5 -right-1.5 z-10 bg-rose-500 text-white font-bold text-[9px] sm:text-[10px] min-w-[18px] h-[18px] sm:min-w-5 sm:h-5 rounded-full flex items-center justify-center px-1 border-2 border-[#070a12] shadow-md shadow-rose-500/40 select-none pointer-events-none">
          {folder.badge ?? folder.apps.length}
        </div>
      </div>

      {/* Folder Name Label */}
      <span
        className="text-[10px] sm:text-[11px] font-semibold text-white text-center leading-tight px-1.5 py-0.5 rounded-md truncate max-w-full tracking-wide transition-colors group-hover:text-white text-white/95"
        style={{
          textShadow: "0 1px 3px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.85)",
        }}
        title={folder.name}
      >
        {folder.name}
      </span>
    </div>
  );
}
