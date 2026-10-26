import { useState } from "react";
import { LogoApple, LogoWindows } from "@gravity-ui/icons";
import Wallpaper from "./Wallpaper";
import { useOS } from "../store/useOS";
import { GIconCheck, GIconChevronRight, GIconSparkles } from "./icons/GravityIcons";
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

  const OPTIONS = [
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
      className={`fixed inset-0 z-[1500] flex items-center justify-center transition-opacity duration-300 p-4 sm:p-6 ${entering ? "opacity-0" : "opacity-100"}`}>
      <div className="absolute inset-0">
        <Wallpaper />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70 backdrop-blur-md" />
      </div>

      <div className="relative z-10 text-center px-5 py-6 sm:px-8 sm:py-8 max-w-4xl max-h-full mx-auto w-full overflow-y-auto thin-scroll rounded-[28px] border border-white/10 bg-[#080d19]/45 backdrop-blur-xl shadow-[0_32px_100px_rgba(0,0,0,0.42)]">
        <div className="mb-6 sm:mb-8 space-y-2">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.24em] font-semibold text-accent/90">
            Portfolio OS
          </p>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
            Choose Your Experience
          </h1>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-white/55 leading-relaxed">
            Pick a desktop style to explore. You can switch interfaces any time in Settings.
          </p>
          <div className="w-12 h-0.5 bg-gradient-to-r from-accent/60 to-accent/20 mx-auto rounded-full" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-stretch">
          {OPTIONS.map(({ id, name, desc, img, Icon }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              aria-pressed={selected === id}
              className={`group relative w-full sm:flex-1 sm:max-w-[350px] rounded-2xl p-px text-left transition-all duration-300 ${
                selected === id
                  ? "bg-gradient-to-br from-accent/80 via-accent/30 to-white/10 shadow-xl shadow-accent/15"
                  : "bg-gradient-to-br from-white/15 to-white/5 hover:from-white/25 hover:to-white/10"
              }`}>
              <div
                className={`relative h-full rounded-[15px] p-3.5 sm:p-4 transition-all duration-300 border ${
                  selected === id
                    ? "bg-[#0a0f1b]/95 backdrop-blur-xl border-white/15"
                    : "bg-[#0a0f1b]/80 backdrop-blur-lg border-white/10 hover:border-white/20 hover:bg-[#0a0f1b]/90"
                }`}>
                <div className="relative overflow-hidden rounded-xl bg-[#121a2a] border border-white/10">
                  <img
                    src={img}
                    alt={name}
                    className={`w-full aspect-video object-cover transition-all duration-500 ${
                      selected === id ? "scale-[1.025]" : "group-hover:scale-[1.025]"
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080d19]/40 via-transparent to-transparent" />
                  {selected === id && (
                    <div className="absolute top-2.5 right-2.5">
                      <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/40 border border-white/25 text-white">
                        <GIconCheck size={14} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                    selected === id ? "bg-accent/15 text-white border-accent/25" : "bg-white/5 text-white/70 border-white/10"
                  }`}>
                    <Icon width={17} height={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm sm:text-base font-semibold transition-colors duration-300 ${
                        selected === id ? "text-white" : "text-white/75 group-hover:text-white"
                      }`}>
                        {name}
                      </h3>
                    {selected === id && (
                      <span className="text-[9px] sm:text-[10px] font-semibold text-accent bg-accent/15 px-2 py-0.5 rounded-full border border-accent/20 whitespace-nowrap">
                        Selected
                      </span>
                    )}
                    </div>
                    <p className="mt-1 text-[11px] sm:text-xs text-white/50 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={confirm}
          className="group relative mt-6 sm:mt-7 px-6 py-3 rounded-xl text-white text-xs sm:text-sm font-semibold transition-all duration-300 overflow-hidden w-full sm:w-auto bg-gradient-to-r from-accent to-[rgb(var(--accent)/0.78)] border border-white/20 shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 active:translate-y-0">
          <span className="flex items-center justify-center gap-2">
            Continue with {selected === "mac" ? "macOS" : "Windows 11"}
            <GIconChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </button>

        <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.045] border border-white/10 text-[10px] sm:text-[11px] text-white/55">
            <GIconSparkles size={12} className="text-amber-300" /> Gravity UI iconography
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.045] border border-white/10 text-[10px] sm:text-[11px] text-white/55">
            ⌘K Spotlight Search
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.045] border border-white/10 text-[10px] sm:text-[11px] text-white/55">
            UNIX Terminal Shell
          </span>
        </div>

        <p className="mt-4 text-[10px] sm:text-xs text-white/35 font-light">
          Both styles offer the same full feature set — pick what feels right for you
        </p>
      </div>
    </div>
  );
}
