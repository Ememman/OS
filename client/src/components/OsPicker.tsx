import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Wallpaper from "./Wallpaper";
import { useOS } from "../store/useOS";
import { soundFx } from "../lib/soundFx";
import type { OSMode } from "../types/os";
import { GIconCheck, GIconChevronRight, GIconSparkles } from "./icons/GravityIcons";
import macPreview from "../assets/macos.png";
import windowsPreview from "../assets/windows.png";

interface OsOption {
  id: OSMode;
  name: string;
  tagline: string;
  img: string;
  color: string;
}

const OPTIONS: OsOption[] = [
  {
    id: "mac",
    name: "macOS Style",
    tagline: "Top menu bar & floating dock",
    img: macPreview,
    color: "#38bdf8",
  },
  {
    id: "win",
    name: "Windows 11",
    tagline: "Centered taskbar & start menu",
    img: windowsPreview,
    color: "#0284c7",
  },
];

interface OsCardProps {
  option: OsOption;
  isSelected: boolean;
  onSelect: () => void;
}

function OsCard({ option, isSelected, onSelect }: OsCardProps) {
  const { name, tagline, img, color } = option;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      aria-pressed={isSelected}
      className={`group relative text-left rounded-2xl p-2.5 sm:p-3 transition-all duration-200 cursor-pointer flex flex-col justify-between border outline-none ${
        isSelected
          ? "bg-accent/15 border-accent ring-1 ring-accent/60 shadow-lg shadow-accent/20"
          : "bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.07]"
      }`}
    >
      {/* Visual Image Preview Frame */}
      <div className="relative h-22 sm:h-26 w-full rounded-xl overflow-hidden bg-[#0c1220]/90 border border-white/10 flex items-center justify-center p-2.5 group-hover:border-white/20 transition-all">
        {/* Soft Ambient Radial Colored Glow */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
            isSelected ? "opacity-35" : "opacity-15 group-hover:opacity-25"
          }`}
          style={{ background: `radial-gradient(circle at center, ${color}, transparent 70%)` }}
        />

        {/* The OS Preview Image - Proportioned and Crisp */}
        <img
          src={img}
          alt={name}
          className={`relative z-10 h-12 sm:h-14 w-auto object-contain transition-transform duration-300 ${
            isSelected
              ? "scale-105 drop-shadow-[0_4px_16px_rgba(59,130,246,0.5)]"
              : "group-hover:scale-105 drop-shadow-md opacity-85 group-hover:opacity-100"
          }`}
        />

        {/* Radio Selection Indicator in Top Right */}
        <div className="absolute top-2 right-2 z-20">
          <div
            className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
              isSelected
                ? "bg-accent text-white ring-2 ring-accent/30 shadow-sm"
                : "border border-white/30 bg-black/40 group-hover:border-white/50"
            }`}
          >
            {isSelected && <GIconCheck size={10} className="stroke-[3]" />}
          </div>
        </div>
      </div>

      {/* Clean, Simple Info (No wall of text) */}
      <div className="mt-2.5 space-y-0.5">
        <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight">
          {name}
        </h3>
        <p className="text-[10px] sm:text-[11px] text-white/50 leading-snug">
          {tagline}
        </p>
      </div>
    </motion.button>
  );
}

export default function OsPicker() {
  const { osMode, chooseOs, systemSounds } = useOS();
  const [selected, setSelected] = useState(osMode);
  const [entering, setEntering] = useState(false);

  const handleSelect = (id: OSMode) => {
    setSelected(id);
    if (systemSounds) soundFx.playClick();
  };

  const confirm = () => {
    if (systemSounds) soundFx.playOpen();
    setEntering(true);
    setTimeout(() => chooseOs(selected), 260);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: entering ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-1500 flex items-center justify-center p-3 sm:p-5 select-none"
      >
        {/* Subtle Dark Wallpaper Dim */}
        <div className="absolute inset-0">
          <Wallpaper />
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
        </div>

        {/* Minimalist Glass Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: entering ? 1.02 : 1, y: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="relative z-10 w-full max-w-[440px] rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090d16]/92 backdrop-blur-2xl p-4 sm:p-5 shadow-[0_20px_70px_rgba(0,0,0,0.65)] text-center"
        >
          {/* Header */}
          <div className="space-y-1 mb-4">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-accent text-[9.5px] font-semibold tracking-wider uppercase mb-0.5">
              <GIconSparkles size={10} className="text-accent" />
              <span>Portfolio OS</span>
            </div>
            <h1 className="font-display text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Choose Your Desktop
            </h1>
            <p className="text-[11px] sm:text-xs text-white/50 max-w-xs mx-auto leading-relaxed">
              Pick an interface style to get started.
            </p>
          </div>

          {/* Cards Grid: Clean Side-by-Side on All Screens */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4">
            {OPTIONS.map((option) => (
              <OsCard
                key={option.id}
                option={option}
                isSelected={selected === option.id}
                onSelect={() => handleSelect(option.id)}
              />
            ))}
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.015, y: -1 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            onClick={confirm}
            className="w-full py-2.5 rounded-xl bg-accent hover:brightness-110 active:brightness-95 text-white text-xs sm:text-sm font-semibold shadow-md shadow-accent/25 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <span>Continue with {selected === "mac" ? "macOS" : "Windows 11"}</span>
            <GIconChevronRight size={14} />
          </motion.button>

          {/* Footer note */}
          <p className="text-[10px] text-white/40 mt-3 leading-snug">
            Switch anytime in <span className="text-white/60">Settings</span> or the Control Center.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
