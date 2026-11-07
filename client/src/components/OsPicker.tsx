import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoApple, LogoWindows } from "@gravity-ui/icons";
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
  Icon: typeof LogoApple;
  color: string;
  features: string[];
}

const OPTIONS: OsOption[] = [
  {
    id: "mac",
    name: "macOS Style",
    tagline: "Apple Sequoia Desktop",
    desc: "Top menu bar, dock at the bottom, and traffic-light windows.",
    img: macPreview,
    Icon: LogoApple,
    color: "#38bdf8",
    features: ["Top Menu Bar", "Floating Dock", "Traffic Lights"],
  },
  {
    id: "win",
    name: "Windows 11 Style",
    tagline: "Fluent Touch & Desktop",
    desc: "Taskbar with search, system tray, and squared window controls.",
    img: windowsPreview,
    Icon: LogoWindows,
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
  const { name, tagline, desc, img, Icon, color, features } = option;
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => setMousePos(null);

  return (
    <motion.button
      onClick={onSelect}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.015, y: -4 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      aria-pressed={isSelected}
      className={`group relative rounded-2xl p-px text-left cursor-pointer transform ${
        isSelected
          ? "bg-gradient-to-b from-accent/90 via-accent/40 to-white/20 ring-2 ring-accent/60 shadow-2xl shadow-accent/20"
          : "bg-gradient-to-b from-white/15 to-white/5 hover:from-white/30 hover:to-white/10 hover:shadow-2xl hover:shadow-black/60"
      }`}
    >
      {/* Outer interactive mouse spotlight highlight */}
      {mousePos && (
        <div
          className="absolute inset-0 rounded-2xl opacity-100 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(320px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.14), transparent 75%)`,
          }}
        />
      )}

      {/* Card Body */}
      <div
        className={`relative h-full rounded-[15px] p-3 sm:p-4 transition-colors duration-300 flex flex-col justify-between overflow-hidden ${
          isSelected
            ? "bg-[#0b101c]/95 backdrop-blur-xl"
            : "bg-[#090d18]/85 backdrop-blur-md group-hover:bg-[#0c1220]/95"
        }`}
      >
        {/* Inner ambient glow on selection */}
        {isSelected && (
          <div
            className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-25"
            style={{ backgroundColor: color }}
          />
        )}

        {/* Preview Image with Glass Sheen Effect */}
        <div className="relative overflow-hidden rounded-xl bg-[#121a2a] border border-white/10 shadow-inner">
          <img
            src={img}
            alt={name}
            className={`w-full aspect-[16/10] object-cover transition-transform duration-500 ease-out ${
              isSelected ? "scale-[1.03]" : "group-hover:scale-[1.05]"
            }`}
          />
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />

          {/* Diagonal Glass Sheen animation on hover */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Badge: Selected Pill or Hover Prompt */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <AnimatePresence mode="wait">
              {isSelected ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent text-white text-[10px] font-semibold shadow-lg shadow-accent/50 border border-white/30"
                >
                  <GIconCheck size={12} />
                  <span>Selected</span>
                </motion.div>
              ) : (
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white/90 text-[10px] font-medium border border-white/20 shadow-md">
                  <span>Click to Select</span>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Title, Icon & Description */}
        <div className="mt-3.5 flex items-start gap-3">
          <div
            className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 ${
              isSelected
                ? "bg-accent text-white border-accent shadow-lg shadow-accent/30 scale-105"
                : "bg-white/5 text-white/70 border-white/10 group-hover:text-white group-hover:bg-white/10 group-hover:border-white/25 group-hover:scale-105"
            }`}
          >
            <Icon width={17} height={17} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight group-hover:text-white transition-colors">
                {name}
              </h3>
              <span className="text-[10px] text-white/40 font-mono hidden xs:inline">
                {tagline}
              </span>
            </div>

            <p className="mt-1 text-[11px] text-white/55 leading-relaxed group-hover:text-white/70 transition-colors">
              {desc}
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {features.map((feat) => (
                <span
                  key={feat}
                  className={`text-[9px] font-medium px-2 py-0.5 rounded-md border transition-colors duration-200 ${
                    isSelected
                      ? "bg-accent/15 border-accent/30 text-white/90"
                      : "bg-white/5 border-white/10 text-white/55 group-hover:text-white/85 group-hover:border-white/20"
                  }`}
                >
                  {feat}
                </span>
              ))}
            </div>
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
        className="fixed inset-0 z-1500 flex items-center justify-center p-3 sm:p-6"
      >
        {/* Background wallpaper with dark atmospheric gradient */}
        <div className="absolute inset-0">
          <Wallpaper />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/55 to-black/80 backdrop-blur-md" />
          {/* Soft background aurora lights */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: "2s" }} />
        </div>

        {/* Main Glass Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: entering ? 1.02 : 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="relative z-10 text-center px-4 py-6 sm:px-8 sm:py-8 max-w-2xl max-h-[calc(100vh-24px)] mx-auto w-full overflow-y-auto thin-scroll rounded-2xl sm:rounded-3xl border border-white/15 bg-[#080d19]/88 sm:bg-[#080d19]/75 backdrop-blur-2xl shadow-[0_32px_120px_rgba(0,0,0,0.7)]"
        >
          {/* Header */}
          <div className="mb-5 sm:mb-6 space-y-1.5">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-accent text-[10px] sm:text-xs font-semibold tracking-wider uppercase mb-1"
            >
              <GIconSparkles size={11} className="animate-pulse" />
              <span>Portfolio OS</span>
            </motion.div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Choose Your Experience
            </h1>
            <p className="max-w-md mx-auto text-xs sm:text-sm text-white/60 leading-relaxed">
              Pick a desktop interface to explore Bron's portfolio.
            </p>
          </div>

          {/* OS Options Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 max-w-xl mx-auto">
            {OPTIONS.map((option) => (
              <OsCard
                key={option.id}
                option={option}
                isSelected={selected === option.id}
                onSelect={() => handleSelect(option.id)}
              />
            ))}
          </div>

          {/* Continue Action Button with Shimmer and Arrow animation */}
          <motion.button
            whileHover={{ scale: 1.025, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 450, damping: 24 }}
            onClick={confirm}
            className="group relative mt-6 sm:mt-7 px-8 sm:px-10 py-3 sm:py-3.5 rounded-xl bg-accent hover:brightness-110 text-white text-xs sm:text-sm font-semibold shadow-[0_0_28px_rgba(var(--accent),0.35)] hover:shadow-[0_0_40px_rgba(var(--accent),0.6)] flex items-center justify-center gap-2.5 mx-auto cursor-pointer overflow-hidden"
          >
            {/* Shimmer sweep effect on button hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <span className="relative z-10 font-medium tracking-wide">
              Continue with {selected === "mac" ? "macOS Sequoia" : "Windows 11"}
            </span>
            <GIconChevronRight
              size={16}
              className="relative z-10 transition-transform duration-200 group-hover:translate-x-1"
            />
          </motion.button>

          {/* Short, straightforward note */}
          <div className="mt-4 pt-3.5 border-t border-white/10 max-w-md mx-auto">
            <p className="text-[11px] sm:text-xs text-white/50 leading-relaxed">
              Both styles include all apps and features. You can switch interfaces anytime in{" "}
              <span className="text-white/80 font-medium">Settings</span> or the Power menu.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
