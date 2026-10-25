import { useState } from "react";
import Wallpaper from "./Wallpaper";
import { useOS } from "../store/useOS";
import { GIconCheck, GIconChevronRight, GIconSparkles } from "./icons/GravityIcons";

export default function OsPicker() {
  const { osMode, chooseOs } = useOS();
  const [selected, setSelected] = useState(osMode);
  const [entering, setEntering] = useState(false);

  const confirm = () => {
    setEntering(true);
    setTimeout(() => chooseOs(selected), 260);
  };

  const OPTIONS = [
    {
      id: "mac",
      name: "macOS Style",
      desc: "Top menu bar, dock at the bottom, traffic-light windows.",
      img: "/src/assets/macos.png",
    },
    {
      id: "win",
      name: "Windows 11 Style",
      desc: "Taskbar with search, system tray, and squared window controls.",
      img: "/src/assets/windows.png",
    },
  ];

  return (
    <div
      className={`fixed inset-0 z-[1500] flex items-center justify-center transition-opacity duration-300 p-4 sm:p-6 ${entering ? "opacity-0" : "opacity-100"}`}>
      <div className="absolute inset-0">
        <Wallpaper />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70 backdrop-blur-md" />
      </div>

      <div className="relative z-10 text-center px-3 sm:px-4 max-w-5xl mx-auto w-full">
        <div className="mb-8 sm:mb-10 space-y-2 sm:space-y-3">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
            Choose Your Experience
          </h1>
          <p className="text-xs sm:text-sm text-white/40 font-light tracking-wider">
            Select your preferred interface style • You can change this anytime
            from Settings
          </p>
          <div className="w-12 h-0.5 bg-gradient-to-r from-accent/60 to-accent/20 mx-auto rounded-full" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 md:gap-6 justify-center items-stretch">
          {OPTIONS.map(({ id, name, desc, img }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`group relative w-full sm:w-64 md:w-72 rounded-2xl p-0.5 text-left transition-all duration-300 ${
                selected === id
                  ? "bg-gradient-to-br from-accent/60 via-accent/30 to-transparent shadow-2xl shadow-accent/20"
                  : "bg-gradient-to-br from-white/10 to-transparent hover:from-white/20 hover:to-white/5"
              }`}>
              <div
                className={`relative rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-300 border ${
                  selected === id
                    ? "bg-[#0a0a0f]/95 backdrop-blur-xl border-accent/50 shadow-[inset_0_0_30px_rgba(99,102,241,0.05)]"
                    : "bg-[#0a0a0f]/80 backdrop-blur-lg border-white/10 hover:border-white/20 hover:bg-[#0a0a0f]/90"
                }`}>
                {/* Image Container */}
                <div className="relative overflow-hidden rounded-xl bg-[#12121a] border border-white/5">
                  <img
                    src={img}
                    alt={name}
                    className={`w-full h-auto aspect-video object-cover transition-all duration-500 ${
                      selected === id ? "scale-105" : "group-hover:scale-105"
                    }`}
                  />
                  {/* Overlay gradient for polish */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent transition-opacity duration-300 ${
                      selected === id
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-60"
                    }`}
                  />

                  {/* Glow effect on selection */}
                  {selected === id && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 via-transparent to-transparent" />
                  )}

                  {/* Selection indicator */}
                  {selected === id && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/50 animate-pulse border-2 border-white/20 text-white">
                        <GIconCheck size={14} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3
                      className={`text-sm sm:text-base font-semibold transition-colors duration-300 ${
                        selected === id
                          ? "text-white"
                          : "text-white/70 group-hover:text-white"
                      }`}>
                      {name}
                    </h3>
                    {selected === id && (
                      <span className="text-[9px] sm:text-[10px] font-medium text-accent bg-accent/20 px-2 py-0.5 rounded-full border border-accent/20 whitespace-nowrap">
                        Selected
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[10px] sm:text-[11px] transition-colors duration-300 leading-relaxed ${
                      selected === id
                        ? "text-white/60"
                        : "text-white/30 group-hover:text-white/50"
                    }`}>
                    {desc}
                  </p>
                </div>

                {/* Hover glow effect */}
                <div
                  className={`absolute -inset-0.5 rounded-2xl transition-opacity duration-300 pointer-events-none ${
                    selected === id
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/5 via-transparent to-accent/5 blur-xl" />
                </div>

                {/* Friendly border glow on hover */}
                <div
                  className={`absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none ${
                    selected === id
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}>
                  <div className="absolute inset-0 rounded-2xl border border-white/10" />
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={confirm}
          className="group relative mt-8 sm:mt-10 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl text-white text-xs sm:text-sm font-medium transition-all duration-300 overflow-hidden w-full sm:w-auto">
          {/* Button background with gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent/90 to-accent rounded-xl transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-accent/40 group-hover:scale-105" />

          {/* Button border */}
          <div className="absolute inset-0 rounded-xl border border-white/20" />

          {/* Button shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

          {/* Button border glow */}
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-accent/50 to-accent/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <span className="relative flex items-center justify-center gap-2">
            Continue with {selected === "mac" ? "macOS" : "Windows 11"}
            <GIconChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </button>

        {/* Feature highlight badges */}
        <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/60">
            <GIconSparkles size={12} className="text-amber-400" /> Gravity UI Iconography
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/60">
            ⌘K Spotlight Search
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/60">
            UNIX Terminal Shell
          </span>
        </div>

        {/* Friendly footer text */}
        <p className="mt-4 text-[10px] sm:text-xs text-white/30 font-light tracking-wide">
          Both styles offer the same full feature set — pick what feels right for you
        </p>
      </div>
    </div>
  );
}
