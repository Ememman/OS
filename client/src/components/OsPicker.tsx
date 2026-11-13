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
  badge: string;
  tagline: string;
  features: string[];
  img: string;
  color: string;
}

const OPTIONS: OsOption[] = [
  {
    id: "mac",
    name: "macOS Style",
    badge: "Apple Glass UI",
    tagline: "Top menu bar, floating dock & mission control",
    features: [
      "Top menu bar with system status & clock",
      "Floating dock with active dot indicators",
      "Traffic light window controls (Red / Yellow / Green)",
      "Spotlight Search (⌘K) & Mission Control",
    ],
    img: macPreview,
    color: "#38bdf8",
  },
  {
    id: "win",
    name: "Windows 11 Style",
    badge: "Microsoft Fluent UI",
    tagline: "Centered taskbar, start menu & snap layouts",
    features: [
      "Centered taskbar with Start Menu launcher",
      "Quick Settings action center & system tray",
      "Snap Layouts hover multi-window tiling",
      "Native minimize, maximize & close window controls",
    ],
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
  const { name, badge, tagline, features, img, color } = option;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      aria-pressed={isSelected}
      className={`group relative text-left rounded-2xl sm:rounded-3xl p-3 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between border outline-none ${
        isSelected
          ? "bg-accent/15 border-accent ring-2 ring-accent/60 shadow-xl shadow-accent/25"
          : "bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.07]"
      }`}
    >
      {/* Visual Image Preview Frame */}
      <div className="relative h-32 sm:h-44 md:h-52 w-full rounded-xl sm:rounded-2xl overflow-hidden bg-[#0c1220]/90 border border-white/10 flex items-center justify-center p-3 sm:p-4 group-hover:border-white/20 transition-all">
        {/* Soft Ambient Radial Colored Glow */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
            isSelected ? "opacity-40" : "opacity-15 group-hover:opacity-25"
          }`}
          style={{ background: `radial-gradient(circle at center, ${color}, transparent 70%)` }}
        />

        {/* The OS Preview Image */}
        <img
          src={img}
          alt={name}
          className={`relative z-10 h-16 sm:h-24 md:h-28 w-auto object-contain transition-transform duration-300 ${
            isSelected
              ? "scale-105 drop-shadow-[0_6px_20px_rgba(59,130,246,0.55)]"
              : "group-hover:scale-105 drop-shadow-md opacity-85 group-hover:opacity-100"
          }`}
        />

        {/* Radio Selection Indicator in Top Right */}
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
          {isSelected && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-accent bg-accent/20 border border-accent/40 px-2 py-0.5 rounded-full hidden xs:inline">
              Selected
            </span>
          )}
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
              isSelected
                ? "bg-accent text-white ring-2 ring-accent/30 shadow-sm"
                : "border border-white/30 bg-black/40 group-hover:border-white/50"
            }`}
          >
            {isSelected && <GIconCheck size={12} className="stroke-[3]" />}
          </div>
        </div>

        {/* Top-left Badge */}
        <div className="absolute top-2.5 left-2.5 z-20">
          <span className="text-[10px] font-mono font-medium text-white/70 bg-black/50 border border-white/15 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        </div>
      </div>

      {/* Info & Features */}
      <div className="mt-3 sm:mt-4 space-y-2">
        <div>
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight leading-tight">
            {name}
          </h3>
          <p className="text-[11px] sm:text-xs text-white/60 leading-snug mt-0.5">
            {tagline}
          </p>
        </div>

        {/* Feature bullets (visible on tablet/desktop) */}
        <ul className="space-y-1 pt-1.5 border-t border-white/10 hidden sm:block">
          {features.map((f, i) => (
            <li key={i} className="text-[11px] text-white/50 flex items-center gap-1.5">
              <span>{f}</span>
            </li>
          ))}
        </ul>
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

        {/* Spacious, Organized Glass Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: entering ? 1.02 : 1, y: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="relative z-10 w-full max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92dvh] overflow-y-auto thin-scroll rounded-3xl border border-white/15 bg-[#090d16]/95 backdrop-blur-2xl p-4 sm:p-7 md:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.75)] text-center flex flex-col justify-between"
        >
          {/* Header */}
          <div className="space-y-1.5 mb-4 sm:mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-[11px] font-semibold tracking-wider uppercase mb-1">
              <span>Portfolio OS Experience</span>
            </div>
            <h1 className="font-display text-xl sm:text-3xl font-extrabold tracking-tight text-white">
              Choose Your Desktop Style
            </h1>
            <p className="max-w-md sm:max-w-xl mx-auto text-xs sm:text-sm text-white/60 leading-relaxed">
              Select your preferred operating system interface. You can switch between macOS and Windows 11 anytime.
            </p>
          </div>

          {/* OS Options Cards Grid: 1-col on small mobile, 2-cols on tablet/desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 max-w-none mx-auto w-full">
            {OPTIONS.map((option) => (
              <OsCard
                key={option.id}
                option={option}
                isSelected={selected === option.id}
                onSelect={() => handleSelect(option.id)}
              />
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="mt-5 sm:mt-7 space-y-3">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 450, damping: 24 }}
              onClick={confirm}
              className="group relative px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-accent hover:brightness-110 text-white text-sm sm:text-base font-semibold shadow-xl shadow-accent/25 hover:shadow-accent/40 flex items-center justify-center gap-2 mx-auto cursor-pointer overflow-hidden w-full sm:w-auto min-w-[280px]"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <span className="relative z-10 font-semibold tracking-wide">
                Launch with {selected === "mac" ? "macOS Style" : "Windows 11"}
              </span>
              <GIconChevronRight
                size={16}
                className="relative z-10 transition-transform duration-200 group-hover:translate-x-1"
              />
            </motion.button>

            <p className="text-[11px] sm:text-xs text-white/45 leading-relaxed">
              Both styles include all apps, tools, and realtime features. Switch anytime in{" "}
              <span className="text-white/70 font-medium">Settings</span> or the{" "}
              <span className="text-white/70 font-medium">Control Center</span>.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
