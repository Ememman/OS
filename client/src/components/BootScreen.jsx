import { useEffect, useState } from "react";
import { useOS } from "../store/useOS";
import { GIconCode } from "./icons/GravityIcons";

const STEPS = [
  "Initializing Gravity UI system icons…",
  "Waking up widgets & audio engine…",
  "Loading projects & live terminal…",
  "Almost ready…",
];

export default function BootScreen() {
  const finishBoot = useOS((s) => s.finishBoot);
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const duration = 1700;
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      setStepIdx(
        Math.min(STEPS.length - 1, Math.floor((pct / 100) * STEPS.length)),
      );
      if (pct >= 100) {
        clearInterval(id);
        setLeaving(true);
        setTimeout(finishBoot, 350);
      }
    }, 40);
    return () => clearInterval(id);
  }, [finishBoot]);

  return (
    <div
      className={`fixed inset-0 z-[2000] flex flex-col items-center justify-center transition-opacity duration-300 p-4 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}>
      {/* Background with dark theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#05070c] via-[#0a0a0f] to-[#05070c]" />

      {/* Subtle glow effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm px-4">
        {/* Icon with gradient border - matching OS Picker theme */}
        <div className="relative">
          {/* Glow effect behind icon */}
          <div className="absolute -inset-4 bg-accent/20 rounded-3xl blur-2xl animate-pulse" />

          {/* Icon container with gradient border */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-0.5 bg-gradient-to-br from-accent/60 via-accent/30 to-transparent shadow-2xl shadow-accent/25">
            <div className="w-full h-full rounded-2xl bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 flex items-center justify-center overflow-hidden">
              <GIconCode size={36} className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
            </div>
          </div>
        </div>

        {/* Title with gradient - matching OS Picker */}
        <div className="mt-6 sm:mt-8 space-y-2 text-center">
          <h1 className="font-display text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
            Portfolio OS
          </h1>
          <div className="w-12 h-0.5 bg-gradient-to-r from-accent/60 to-accent/20 mx-auto rounded-full" />
        </div>

        {/* Progress bar with visible loading effect */}
        <div className="mt-6 sm:mt-8 w-full max-w-xs">
          <div className="relative h-2 rounded-full bg-white/10 overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-accent/60 via-accent to-accent/60 rounded-full transition-all duration-100 relative"
              style={{ width: `${progress}%` }}>
              {/* Shimmer animation on progress bar */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Step text with progress percentage */}
        <div className="mt-4 sm:mt-5 flex flex-col items-center gap-1">
          <p className="text-[10px] sm:text-[11px] text-white/50 font-light tracking-wider">
            {STEPS[stepIdx]}
          </p>
          <p className="text-[9px] sm:text-[10px] text-white/30 font-mono tracking-wider">
            {progress}%
          </p>
        </div>

        {/* Loading dots animation */}
        <div className="mt-4 flex gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              progress > 0 ? "bg-accent/60" : "bg-white/10"
            }`}
          />
          <div
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              progress > 33 ? "bg-accent/60" : "bg-white/10"
            }`}
          />
          <div
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              progress > 66 ? "bg-accent/60" : "bg-white/10"
            }`}
          />
        </div>
      </div>

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
