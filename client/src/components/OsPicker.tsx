import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Wallpaper from "./Wallpaper";
import { useOS } from "../store/useOS";
import { soundFx } from "../lib/soundFx";
import type { OSMode } from "../types/os";
import { GIconCheck, GIconChevronRight } from "./icons/GravityIcons";
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
    name: "Windows 11 Style",
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
      <div className="relative h-24 sm:h-28 w-full rounded-xl overflow-hidden bg-[#0c1220]/90 border border-white/10 flex items-center justify-center p-2.5 group-hover:border-white/20 transition-all">
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
          <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/65 to-black/85 backdrop-blur-md" />
          <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: "2s" }} />
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
        </div>

        {/* Minimalist Glass Card - Ultra Clean & Proportioned */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: entering ? 1.02 : 1, y: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="relative z-10 w-full max-w-[440px] rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090d16]/92 backdrop-blur-2xl p-4 sm:p-5 shadow-[0_20px_70px_rgba(0,0,0,0.65)] text-center"
        >
          {/* Header */}
          <div className="space-y-1 mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-[10px] font-semibold tracking-wider uppercase mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span>Portfolio OS</span>
            </div>
            <h1 className="font-display text-lg sm:text-2xl font-extrabold tracking-tight text-white">
              Choose Your Experience
            </h1>
            <p className="max-w-xs sm:max-w-sm mx-auto text-[11px] sm:text-xs text-white/55 leading-relaxed">
              Pick a desktop interface to explore the portfolio.
            </p>
          </div>

          {/* OS Options Cards Grid: Clean 2-columns */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 max-w-none mx-auto">
            {OPTIONS.map((option) => (
              <OsCard
                key={option.id}
                option={option}
                isSelected={selected === option.id}
                onSelect={() => handleSelect(option.id)}
              />
            ))}
          </div>

          {/* Continue Action Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 450, damping: 24 }}
            onClick={confirm}
            className="group relative mt-4 sm:mt-5 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-accent hover:brightness-110 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 flex items-center justify-center gap-2 mx-auto cursor-pointer overflow-hidden w-full max-w-xs"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            <span className="relative z-10 font-medium tracking-wide">
              Continue with {selected === "mac" ? "macOS Style" : "Windows 11"}
            </span>
            <GIconChevronRight
              size={15}
              className="relative z-10 transition-transform duration-200 group-hover:translate-x-1"
            />
          </motion.button>

          {/* Short, straightforward note */}
          <div className="mt-3 pt-2.5 border-t border-white/10 max-w-xs sm:max-w-sm mx-auto">
            <p className="text-[10px] sm:text-[11px] text-white/45 leading-relaxed">
              Both styles include all apps & features. Switch anytime in{" "}
              <span className="text-white/70 font-medium">Settings</span>.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
