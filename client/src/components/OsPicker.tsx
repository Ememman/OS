import { useState } from "react";
import { LogoApple, LogoWindows } from "@gravity-ui/icons";
import Wallpaper from "./Wallpaper";
import { useOS } from "../store/useOS";
import type { OSMode } from "../types/os";
import { GIconCheck, GIconChevronRight } from "./icons/GravityIcons";
import macPreview from "../assets/macos.png";
import windowsPreview from "../assets/windows.png";

export default function OsPicker() {
  const { osMode, chooseOs } = useOS();
  const [selected, setSelected] = useState(osMode);
  const [entering, setEntering] = useState(false);

  const confirm = () => {
    setEntering(true);
    setTimeout(() => chooseOs(selected), 260);
  };

  const OPTIONS: {
    id: OSMode;
    name: string;
    desc: string;
    img: string;
    Icon: typeof LogoApple;
  }[] = [
    {
      id: "mac",
      name: "macOS Style",
      desc: "Top menu bar, dock at the bottom, traffic-light windows.",
      img: macPreview,
      Icon: LogoApple,
    },
    {
      id: "win",
      name: "Windows 11 Style",
      desc: "Taskbar with search, system tray, and squared window controls.",
      img: windowsPreview,
      Icon: LogoWindows,
    },
  ];

  return (
    <div
      className={`fixed inset-0 z-1500 flex items-center justify-center transition-opacity duration-300 p-3 sm:p-6 ${entering ? "opacity-0" : "opacity-100"}`}>
      <div className="absolute inset-0">
        <Wallpaper />
        <div className="absolute inset-0 bg-linear-to-br from-black/70 via-black/50 to-black/70 backdrop-blur-md" />
      </div>

      <div className="relative z-10 text-center px-4 py-5 sm:px-7 sm:py-7 max-w-2xl max-h-[calc(100vh-24px)] mx-auto w-full overflow-y-auto thin-scroll rounded-2xl sm:rounded-3xl border border-white/10 bg-[#080d19]/85 sm:bg-[#080d19]/65 backdrop-blur-2xl shadow-[0_32px_100px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="mb-5 sm:mb-6 space-y-1.5">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-semibold text-accent">
            Portfolio OS
          </p>
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
            Choose Your Experience
          </h1>
          <p className="max-w-md mx-auto text-xs sm:text-sm text-white/55 leading-relaxed">
            Pick a desktop interface to explore Bron's portfolio.
          </p>
        </div>

        {/* OS Options Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto">
          {OPTIONS.map(({ id, name, desc, img, Icon }) => {
            const isSelected = selected === id;
            return (
              <button
                key={id}
                onClick={() => setSelected(id)}
                aria-pressed={isSelected}
                className={`group relative rounded-2xl p-px text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-linear-to-b from-accent/80 via-accent/40 to-white/15 ring-2 ring-accent/50 shadow-xl shadow-accent/15 scale-[1.01]"
                    : "bg-linear-to-b from-white/12 to-white/5 hover:from-white/20 hover:to-white/10"
                }`}
              >
                <div
                  className={`relative h-full rounded-[15px] p-3 sm:p-3.5 transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#0b101c]/95 backdrop-blur-xl"
                      : "bg-[#0a0e19]/85 backdrop-blur-md hover:bg-[#0c1220]/90"
                  }`}
                >
                  {/* Preview Image with Checkmark */}
                  <div className="relative overflow-hidden rounded-xl bg-[#121a2a] border border-white/10">
                    <img
                      src={img}
                      alt={name}
                      className={`w-full aspect-[16/10] object-cover transition-transform duration-300 ${
                        isSelected ? "scale-[1.02]" : "group-hover:scale-[1.02]"
                      }`}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/50 border border-white/30 text-white">
                          <GIconCheck size={13} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Title, Icon & Description */}
                  <div className="mt-3 flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected
                          ? "bg-accent/20 text-white border-accent/40"
                          : "bg-white/5 text-white/70 border-white/10 group-hover:text-white"
                      }`}
                    >
                      <Icon width={15} height={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <h3 className="text-xs sm:text-sm font-semibold text-white truncate">
                          {name}
                        </h3>
                        {isSelected && (
                          <span className="text-[9px] font-semibold text-accent bg-accent/15 px-2 py-0.5 rounded-full border border-accent/25 shrink-0">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-white/50 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={confirm}
          className="group relative mt-5 sm:mt-6 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-accent hover:brightness-110 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-lg shadow-accent/25 transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
        >
          <span>Continue with {selected === "mac" ? "macOS" : "Windows 11"}</span>
          <GIconChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* Short, straightforward description */}
        <div className="mt-4 pt-3.5 border-t border-white/10 max-w-md mx-auto">
          <p className="text-[11px] sm:text-xs text-white/50 leading-relaxed">
            Both styles include all apps and features. You can switch interfaces anytime in <span className="text-white/80 font-medium">Settings</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
