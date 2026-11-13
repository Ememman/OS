import { useState, useEffect } from "react";
import { GIconPower, GIconSliders } from "./icons/GravityIcons";
import { useOS } from "../store/useOS";

export default function PowerOffScreen() {
  const { powerOn, reopenPicker, osMode } = useOS();
  const [booting, setBooting] = useState(false);

  useEffect(() => {
    try {
      window.open("", "_self");
      window.close();
    } catch {}
    const timer = setTimeout(() => {
      try {
        window.close();
      } catch {}
      try {
        window.location.replace("about:blank");
      } catch {}
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const handlePowerOn = () => {
    setBooting(true);
    setTimeout(() => {
      powerOn();
    }, 450);
  };

  const handleSwitchOs = () => {
    setBooting(true);
    setTimeout(() => {
      reopenPicker();
    }, 350);
  };

  const handleExit = () => {
    try {
      window.open("", "_self");
      window.close();
    } catch {}
    try {
      window.location.replace("about:blank");
    } catch {}
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-[#030508] flex flex-col items-center justify-center p-6 text-white select-none transition-opacity duration-500 ${
        booting ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm text-center space-y-6">
        {/* Glowing Power Button */}
        <button
          onClick={handlePowerOn}
          title="Turn On Portfolio OS"
          className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/10 hover:border-accent hover:bg-accent/15 active:scale-95 transition-all duration-300 shadow-2xl cursor-pointer"
        >
          <div className="absolute inset-0 rounded-full bg-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <GIconPower
            size={36}
            className="text-white/60 group-hover:text-accent group-hover:scale-110 transition-all duration-300"
          />
        </button>

        <div className="space-y-1.5">
          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white/90">
            Portfolio OS is Powered Down
          </h2>
          <p className="text-xs text-white/40 leading-relaxed max-w-xs">
            System processes and windows have safely halted. Press the power button to boot up again.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-2">
          <button
            onClick={handlePowerOn}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-accent hover:brightness-110 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-accent/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <GIconPower size={14} />
            <span>Turn On ({osMode === "win" ? "Windows" : "macOS"})</span>
          </button>

          <button
            onClick={handleSwitchOs}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-white/80 hover:text-white border border-white/10 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <GIconSliders size={13} />
            <span>Switch OS Style</span>
          </button>
        </div>

        <button
          onClick={handleExit}
          className="text-[11px] text-white/50 hover:text-rose-400 transition-colors underline underline-offset-4 cursor-pointer pt-1"
        >
          Close tab / Exit system
        </button>
      </div>
    </div>
  );
}

