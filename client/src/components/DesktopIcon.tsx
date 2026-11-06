import { useRef, useState, type ComponentType, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "../lib/useMediaQuery";

interface DesktopIconProps {
  icon: ComponentType<{ size?: number; className?: string; color?: string }>;
  label: string;
  onOpen: () => void;
  style?: CSSProperties;
  color?: string;
}

export default function DesktopIcon({ icon: Icon, label, onOpen, style, color }: DesktopIconProps) {
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

  return (
    <motion.button
      onClick={handleClick}
      onDoubleClick={onOpen}
      onBlur={() => setSelected(false)}
      style={style}
      whileHover={{ scale: 1.07, y: -2 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 450, damping: 22 }}
      className={`group flex flex-col items-center gap-1 sm:gap-1.5 w-16 sm:w-20 py-1.5 sm:py-2 rounded-xl outline-none cursor-pointer select-none ${
        selected ? "bg-white/10 ring-1 ring-white/20" : "hover:bg-white/5"
      }`}
    >
      <div
        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 border ${
          selected
            ? "bg-white/25 border-accent shadow-lg shadow-accent/25"
            : "bg-[#0c1220]/75 backdrop-blur-md border-white/15 group-hover:border-white/30 group-hover:bg-[#0c1220]/90 shadow-lg shadow-black/40"
        }`}
        style={color ? { boxShadow: selected ? `0 0 16px ${color}55` : undefined } : undefined}
      >
        <Icon size={22} className="text-white/90 group-hover:text-white transition-colors sm:scale-105" color={color} />
      </div>
      <span
        className={`text-[10px] sm:text-[11px] font-semibold text-white text-center leading-tight px-1.5 py-0.5 rounded-md truncate max-w-full tracking-wide transition-colors ${
          selected ? "bg-accent text-white shadow-md shadow-accent/30" : "group-hover:text-white text-white/95"
        }`}
        style={{
          textShadow: "0 1px 3px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.85)",
        }}
      >
        {label}
      </span>
    </motion.button>
  );
}
