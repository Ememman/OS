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
  desc: string;
  img: string;
  color: string;
  features: string[];
}

const OPTIONS: OsOption[] = [
  {
    id: "mac",
    name: "macOS Style",
    tagline: "Apple Sequoia",
    desc: "Top menu bar, floating magnification dock, and traffic-light windows.",
    img: macPreview,
    color: "#38bdf8",
    features: ["Top Menu Bar", "Floating Dock", "Traffic Lights"],
  },
  {
    id: "win",
    name: "Windows 11 Style",
    tagline: "Fluent Touch",
    desc: "Centered taskbar with search, start menu, and squared window controls.",
    img: windowsPreview,
    color: "#0284c7",
    features: ["Centered Taskbar", "Start Menu", "System Tray"],
  },
];

interface OsCardProps {
  option: OsOption;
  isSelected: boolean;
  onSelect: () => void;
}

function OsCard({ option, isSelected, onSelect }: OsCardProps) {
  const { id, name, tagline, desc, img, color, features } = option;
  const isMac = id === "mac";

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      aria-pressed={isSelected}
      className={`group relative w-full text-left rounded-2xl p-px cursor-pointer transition-all duration-200 outline-none ${
        isSelected
          ? "bg-gradient-to-b from-accent via-accent/40 to-white/10 ring-2 ring-accent shadow-xl shadow-accent/20"
          : "bg-gradient-to-b from-white/15 to-white/5 hover:from-white/25 hover:to-white/10 hover:shadow-lg hover:shadow-black/50"
      }`}
    >
      {/* Radio Check Indicator in Card Corner */}
      <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
        {isSelected ? (
          <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center shadow-md shadow-accent/60 ring-2 ring-white/40">
            <GIconCheck size={11} className="stroke-[3]" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border border-white/20 bg-white/5 group-hover:border-white/40 transition-colors" />
        )}
      </div>

      {/* Card Inner Body: Responsive flex-row on mobile, flex-col on tablet/desktop */}
      <div
        className={`relative h-full rounded-[15px] p-2.5 sm:p-3.5 transition-colors duration-200 flex flex-row sm:flex-col items-center sm:items-stretch gap-3 sm:gap-2.5 overflow-hidden ${
          isSelected
            ? "bg-[#0b101c]/95 backdrop-blur-xl"
            : "bg-[#090d18]/85 backdrop-blur-md group-hover:bg-[#0c1220]/95"
        }`}
      >
        {/* Compact OS Desktop Mockup Banner */}
        <div className="relative w-24 h-20 sm:w-full sm:h-24 rounded-xl overflow-hidden bg-gradient-to-b from-[#141d30]/90 to-[#0b101c]/95 border border-white/10 flex flex-col justify-between p-2 select-none shrink-0 shadow-inner">
          {/* Top Simulated System Bar */}
          <div className="flex items-center justify-between z-10 w-full">
            {isMac ? (
              /* macOS Traffic lights */
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f56]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#27c93f]" />
              </div>
            ) : (
              /* Windows system badge */
              <span className="text-[8px] font-mono tracking-widest text-white/40 uppercase">Fluent 11</span>
            )}
            <div className="w-4" /> {/* Spacer */}
          </div>

          {/* Centered Ambient Logo & Glow */}
          <div className="relative flex items-center justify-center -my-0.5">
            <div
              className={`absolute w-12 h-12 rounded-full blur-lg pointer-events-none transition-opacity duration-300 ${
                isSelected ? "opacity-50" : "opacity-15 group-hover:opacity-30"
              }`}
              style={{ backgroundColor: color }}
            />
            <img
              src={img}
              alt={name}
              className={`relative z-10 h-8 sm:h-9 w-auto object-contain transition-transform duration-300 ${
                isSelected
                  ? "scale-105 drop-shadow-[0_2px_10px_rgba(59,130,246,0.6)]"
                  : "group-hover:scale-105 drop-shadow-md opacity-80 group-hover:opacity-100"
              }`}
            />
          </div>

          {/* Bottom Simulated Dock or Taskbar */}
          <div className="flex items-center justify-center z-10 w-full">
            {isMac ? (
              /* Mini Floating Dock */
              <div className="h-1 w-14 rounded-full bg-white/30 backdrop-blur-sm" />
            ) : (
              /* Mini Centered Windows Taskbar */
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm">
                <span className="w-1 h-1 rounded-sm bg-sky-400" />
                <span className="w-1 h-1 rounded-sm bg-white/40" />
                <span className="w-1 h-1 rounded-sm bg-white/40" />
              </div>
            )}
          </div>
        </div>

        {/* Info & Content */}
        <div className="min-w-0 flex-1 text-left space-y-1">
          <div className="flex items-baseline justify-between gap-1 pr-6 sm:pr-0">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight">
              {name}
            </h3>
            <span className="text-[9px] text-white/40 font-mono hidden md:inline">
              {tagline}
            </span>
          </div>

          <p className="text-[10px] sm:text-[11px] text-white/60 leading-snug line-clamp-2">
            {desc}
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {features.map((feat) => (
              <span
                key={feat}
                className={`text-[8.5px] sm:text-[9px] font-medium px-1.5 sm:px-2 py-0.5 rounded-md border transition-colors ${
                  isSelected
                    ? "bg-accent/20 border-accent/40 text-white font-semibold"
                    : "bg-white/5 border-white/10 text-white/50 group-hover:text-white/70"
                }`}
              >
                {feat}
              </span>
            ))}
          </div>
        </div>
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
    setTimeout(() => chooseOs(selected), 280);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: entering ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
        className="fixed inset-0 z-1500 flex items-center justify-center p-3 sm:p-5"
      >
        {/* Background wallpaper with dark atmospheric gradient */}
        <div className="absolute inset-0">
          <Wallpaper />
          <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/65 to-black/85 backdrop-blur-md" />
          <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: "2s" }} />
        </div>

        {/* Main Glass Dialog Card - Ultra Clean & Proportioned */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: entering ? 1.02 : 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="relative z-10 text-center px-4 py-4 sm:px-6 sm:py-5 max-w-lg max-h-[calc(100vh-24px)] mx-auto w-full overflow-y-auto thin-scroll rounded-2xl sm:rounded-3xl border border-white/15 bg-[#080d19]/90 sm:bg-[#080d19]/80 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
        >
          {/* Header */}
          <div className="mb-3.5 sm:mb-4 space-y-1">
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-accent text-[10px] font-semibold tracking-wider uppercase mb-0.5"
            >
              <GIconSparkles size={11} className="animate-pulse" />
              <span>Portfolio OS</span>
            </motion.div>
            <h1 className="font-display text-lg sm:text-2xl font-extrabold tracking-tight text-white">
              Choose Your Experience
            </h1>
            <p className="max-w-xs sm:max-w-sm mx-auto text-[11px] sm:text-xs text-white/55 leading-relaxed">
              Pick a desktop interface to explore the portfolio.
            </p>
          </div>

          {/* OS Options Cards Grid: Stacked compact on mobile, side-by-side on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 max-w-md sm:max-w-none mx-auto">
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
            className="group relative mt-4 sm:mt-5 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-accent hover:brightness-110 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 flex items-center justify-center gap-2 mx-auto cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            <span className="relative z-10 font-medium tracking-wide">
              Continue with {selected === "mac" ? "macOS Sequoia" : "Windows 11"}
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
