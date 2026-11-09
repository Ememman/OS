import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoApple, LogoWindows } from "@gravity-ui/icons";
import Wallpaper from "./Wallpaper";
import { useOS } from "../store/useOS";
import { soundFx } from "../lib/soundFx";
import type { OSMode } from "../types/os";
import { GIconCheck, GIconChevronRight, GIconSparkles } from "./icons/GravityIcons";

interface OsOption {
  id: OSMode;
  name: string;
  system: string;
  summary: string;
  icon: typeof LogoApple;
  accentColor: string;
  keyFeatures: string[];
}

const OPTIONS: OsOption[] = [
  {
    id: "mac",
    name: "macOS",
    system: "Sequoia Edition",
    summary: "Top menu bar, floating magnification dock, and traffic-light windows.",
    icon: LogoApple,
    accentColor: "#38bdf8",
    keyFeatures: ["Menu Bar", "Floating Dock"],
  },
  {
    id: "win",
    name: "Windows 11",
    system: "Fluent Edition",
    summary: "Centered taskbar, start menu launcher, system tray, and squared controls.",
    icon: LogoWindows,
    accentColor: "#0284c7",
    keyFeatures: ["Taskbar", "Start Menu"],
  },
];

interface OsCardProps {
  option: OsOption;
  isSelected: boolean;
  onSelect: () => void;
}

function OsCard({ option, isSelected, onSelect }: OsCardProps) {
  const { id, name, system, summary, icon: Icon, keyFeatures } = option;
  const isMac = id === "mac";

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      aria-pressed={isSelected}
      className={`group relative text-left rounded-2xl p-3 sm:p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between border outline-none ${
        isSelected
          ? "bg-gradient-to-b from-white/10 to-white/5 border-accent ring-1 ring-accent/60 shadow-lg shadow-accent/15"
          : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      {/* Top Header Row: Icon + OS Identity + Radio Selector */}
      <div className="flex items-center justify-between w-full mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              isSelected
                ? "bg-accent text-white shadow-md shadow-accent/40"
                : "bg-white/10 text-white/70 group-hover:text-white group-hover:bg-white/15"
            }`}
          >
            <Icon width={16} height={16} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white leading-tight">{name}</div>
            <div className="text-[10px] text-white/40 font-mono leading-tight">{system}</div>
          </div>
        </div>

        {/* Minimal Radio Circle */}
        <div
          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
            isSelected
              ? "bg-accent text-white ring-2 ring-accent/30"
              : "border border-white/25 bg-white/5 group-hover:border-white/40"
          }`}
        >
          {isSelected && <GIconCheck size={10} className="stroke-[3]" />}
        </div>
      </div>

      {/* Mini Mockup Visual Preview Strip */}
      <div className="relative h-12 w-full rounded-lg bg-black/40 border border-white/5 overflow-hidden flex flex-col justify-between p-1.5 mb-2 select-none">
        {/* Top Simulated System Bar */}
        <div className="flex items-center justify-between w-full">
          {isMac ? (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f56]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#27c93f]" />
            </div>
          ) : (
            <span className="text-[7.5px] font-mono text-white/35 uppercase tracking-wider">FLUENT 11</span>
          )}
          <span className="text-[7.5px] text-white/30 font-mono">11:11</span>
        </div>

        {/* Center / Bottom Simulated Dock or Taskbar */}
        <div className="flex items-center justify-center w-full">
          {isMac ? (
            <div className="h-1 w-14 rounded-full bg-white/30 backdrop-blur-sm" />
          ) : (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/10">
              <span className="w-1 h-1 rounded-sm bg-sky-400" />
              <span className="w-1 h-1 rounded-sm bg-white/40" />
              <span className="w-1 h-1 rounded-sm bg-white/40" />
            </div>
          )}
        </div>
      </div>

      {/* Summary Description */}
      <p className="text-[10.5px] text-white/55 leading-snug line-clamp-2 mb-2">
        {summary}
      </p>

      {/* Key Features Tags */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {keyFeatures.map((feat) => (
          <span
            key={feat}
            className={`text-[8.5px] font-medium px-1.5 py-0.5 rounded-md border transition-colors ${
              isSelected
                ? "bg-accent/15 border-accent/30 text-blue-200"
                : "bg-white/5 border-white/10 text-white/40"
            }`}
          >
            {feat}
          </span>
        ))}
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
        {/* Subtle Backdrop Dim */}
        <div className="absolute inset-0">
          <Wallpaper />
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
        </div>

        {/* Minimalist Glass Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: entering ? 1.02 : 1, y: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="relative z-10 w-full max-w-[460px] rounded-2xl sm:rounded-3xl border border-white/10 bg-[#090d16]/92 backdrop-blur-2xl p-4 sm:p-5 shadow-[0_20px_70px_rgba(0,0,0,0.65)] text-center"
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
              Select an interface paradigm to explore the system.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-4">
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
            Switch interfaces anytime from <span className="text-white/60">Settings</span> or the Control Center.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
