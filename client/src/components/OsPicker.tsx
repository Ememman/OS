import { useState } from "react";
import { LogoApple, LogoWindows } from "@gravity-ui/icons";
import Wallpaper from "./Wallpaper";
import { useOS } from "../store/useOS";
import type { OSMode } from "../types/os";
import { GIconCheck, GIconChevronRight } from "./icons/GravityIcons";
import macPreview from "../assets/macos.png";
import windowsPreview from "../assets/windows.png";

interface TechItem {
  name: string;
  category: string;
  glowClass: string;
  icon: React.ReactNode;
}

const TECH_STACK: TechItem[] = [
  {
    name: "React 19",
    category: "Frontend UI",
    glowClass: "hover:border-[#61DAFB]/40 hover:shadow-[0_0_16px_rgba(97,218,251,0.18)] hover:bg-[#61DAFB]/5",
    icon: (
      <svg viewBox="-11.5 -10.23174 23 20.46348" className="w-4 h-4 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
        <g stroke="#61DAFB" strokeWidth="1" fill="none">
          <ellipse rx="11" ry="4.2" />
          <ellipse rx="11" ry="4.2" transform="rotate(60)" />
          <ellipse rx="11" ry="4.2" transform="rotate(120)" />
        </g>
      </svg>
    ),
  },
  {
    name: "TypeScript",
    category: "Typed Language",
    glowClass: "hover:border-[#3178C6]/40 hover:shadow-[0_0_16px_rgba(49,120,198,0.18)] hover:bg-[#3178C6]/5",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 rounded-[3px] transition-transform group-hover/tech:scale-110 duration-200">
        <rect width="24" height="24" rx="4" fill="#3178C6" />
        <path fill="#ffffff" d="M11 7.5H5.5V9.5H7.3V17H9.2V9.5H11V7.5ZM16.8 12.2C16.2 11.9 15.6 11.7 15 11.5C14.5 11.3 14.2 11.1 14 10.9C13.8 10.7 13.7 10.5 13.7 10.2C13.7 9.9 13.8 9.6 14.1 9.4C14.4 9.2 14.8 9.1 15.3 9.1C15.8 9.1 16.3 9.2 16.7 9.4C17.1 9.6 17.4 9.9 17.6 10.2L19 8.8C18.5 8.2 17.9 7.8 17.2 7.5C16.5 7.2 15.8 7.1 14.9 7.1C13.9 7.1 13.1 7.3 12.4 7.7C11.7 8.1 11.2 8.6 10.8 9.3C10.5 10 10.3 10.7 10.3 11.5C10.3 12.3 10.5 13 10.9 13.6C11.3 14.2 11.9 14.7 12.6 15C13.2 15.3 14 15.6 14.7 15.9C15.4 16.2 15.9 16.4 16.2 16.7C16.5 17 16.6 17.3 16.6 17.7C16.6 18.2 16.4 18.6 16.1 18.9C15.7 19.2 15.2 19.3 14.5 19.3C13.9 19.3 13.3 19.1 12.7 18.8C12.1 18.5 11.6 18 11.2 17.4L9.7 19C10.3 19.8 11 20.4 11.9 20.8C12.8 21.2 13.8 21.4 14.8 21.4C15.9 21.4 16.8 21.2 17.6 20.8C18.4 20.4 19 19.8 19.4 19.1C19.8 18.4 20 17.6 20 16.7C20 15.7 19.7 14.9 19.1 14.2C18.5 13.5 17.7 12.9 16.8 12.2Z" />
      </svg>
    ),
  },
  {
    name: "Tailwind CSS",
    category: "Styling",
    glowClass: "hover:border-[#38BDF8]/40 hover:shadow-[0_0_16px_rgba(56,189,248,0.18)] hover:bg-[#38BDF8]/5",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <path fill="#38BDF8" d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z" />
      </svg>
    ),
  },
  {
    name: "Vite",
    category: "Bundler",
    glowClass: "hover:border-[#BD34FE]/40 hover:shadow-[0_0_16px_rgba(189,52,254,0.18)] hover:bg-[#BD34FE]/5",
    icon: (
      <svg viewBox="0 0 32 32" className="w-4 h-4 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <defs>
          <linearGradient id="vite-os-a" x1="-12.35%" y1="18.9%" x2="77.9%" y2="87.9%">
            <stop offset="0%" stopColor="#41D1FF" />
            <stop offset="100%" stopColor="#BD34FE" />
          </linearGradient>
          <linearGradient id="vite-os-b" x1="16.9%" y1="-12.9%" x2="84.9%" y2="67.3%">
            <stop offset="0%" stopColor="#FFEA83" />
            <stop offset="8.3%" stopColor="#FFDD35" />
            <stop offset="100%" stopColor="#FFA800" />
          </linearGradient>
        </defs>
        <path fill="url(#vite-os-a)" d="M29.5 5.5 16.8 28.2a1 1 0 0 1-1.7 0L2.5 5.5a1 1 0 0 1 .9-1.5h7.2a1 1 0 0 1 .9.6L16 14.2l4.5-9.6a1 1 0 0 1 .9-.6h7.2a1 1 0 0 1 .9 1.5z" />
        <path fill="url(#vite-os-b)" d="M19.8 2.3 11 15h4.6l-2.4 8.7 9.8-12.7h-4.7l1.5-8.7z" />
      </svg>
    ),
  },
  {
    name: "Node.js",
    category: "Runtime",
    glowClass: "hover:border-[#539E43]/40 hover:shadow-[0_0_16px_rgba(83,158,67,0.18)] hover:bg-[#539E43]/5",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <path fill="#539E43" d="M12 1.5 21.5 7v10L12 22.5 2.5 17V7L12 1.5z" />
        <path fill="#FFFFFF" d="M12 6.2c-3.1 0-4.6 1.6-4.6 3.1 0 2.4 2.8 2.7 3.8 3 1.4.4 1.9.7 1.9 1.4 0 .9-.9 1.2-1.7 1.2-1.6 0-2.2-.6-2.5-1.3L7 14.6c.6 1.4 2 2.1 4.5 2.1 3 0 4.4-1.6 4.4-3.3 0-2.5-2.8-2.9-3.8-3.1-1.2-.3-1.9-.6-1.9-1.3 0-.7.7-1.1 1.6-1.1 1.2 0 1.9.5 2.2 1.1l1.9-1c-.5-1.1-1.7-1.8-3.9-1.8z" />
      </svg>
    ),
  },
  {
    name: "Express.js",
    category: "API Server",
    glowClass: "hover:border-white/40 hover:shadow-[0_0_16px_rgba(255,255,255,0.12)] hover:bg-white/5",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <rect width="24" height="24" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
        <text x="12" y="16.5" fill="#f4f4f5" fontFamily="system-ui, sans-serif" fontSize="11" fontWeight="800" textAnchor="middle" letterSpacing="-0.5">ex</text>
      </svg>
    ),
  },
  {
    name: "Socket.IO",
    category: "WebSockets",
    glowClass: "hover:border-[#00D8FF]/40 hover:shadow-[0_0_16px_rgba(0,216,255,0.18)] hover:bg-[#00D8FF]/5",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <circle cx="12" cy="12" r="10.5" fill="#09090b" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.7" />
        <path fill="#ffffff" d="M12 4.5A7.5 7.5 0 0 0 4.5 12h1.8A5.7 5.7 0 0 1 12 6.3V4.5zm0 15A7.5 7.5 0 0 0 19.5 12h-1.8A5.7 5.7 0 0 1 12 17.7v1.8z" />
        <path fill="#00D8FF" d="M12.5 7.5 9 12.5h3.2L10.8 17l4.7-6h-3.2l1.2-3.5z" />
      </svg>
    ),
  },
  {
    name: "Zustand",
    category: "State Management",
    glowClass: "hover:border-[#F4A460]/40 hover:shadow-[0_0_16px_rgba(244,164,96,0.18)] hover:bg-[#F4A460]/5",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 transition-transform group-hover/tech:scale-110 duration-200">
        <rect width="24" height="24" rx="4" fill="#2c221e" stroke="#5c4738" strokeWidth="1" />
        <circle cx="8" cy="8.5" r="2.8" fill="#a06332" />
        <circle cx="16" cy="8.5" r="2.8" fill="#a06332" />
        <circle cx="8" cy="8.5" r="1.5" fill="#f6ba82" />
        <circle cx="16" cy="8.5" r="1.5" fill="#f6ba82" />
        <ellipse cx="12" cy="14" rx="6" ry="5" fill="#a06332" />
        <ellipse cx="12" cy="15" rx="3.2" ry="2.4" fill="#f6ba82" />
        <circle cx="12" cy="14" r="1" fill="#1f1610" />
        <circle cx="10" cy="12.6" r="0.8" fill="#1f1610" />
        <circle cx="14" cy="12.6" r="0.8" fill="#1f1610" />
      </svg>
    ),
  },
];

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
      className={`fixed inset-0 z-1500 flex items-center justify-center transition-opacity duration-300 p-4 sm:p-6 ${entering ? "opacity-0" : "opacity-100"}`}>
      <div className="absolute inset-0">
        <Wallpaper />
        <div className="absolute inset-0 bg-linear-to-br from-black/70 via-black/50 to-black/70 backdrop-blur-md" />
      </div>

      <div className="relative z-10 text-center px-5 py-6 sm:px-8 sm:py-8 max-w-4xl max-h-full mx-auto w-full overflow-y-auto thin-scroll rounded-[28px] border border-white/10 bg-[#080d19]/45 backdrop-blur-xl shadow-[0_32px_100px_rgba(0,0,0,0.42)]">
        <div className="mb-6 sm:mb-8 space-y-2">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.24em] font-semibold text-accent/90">
            Portfolio OS
          </p>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-linear-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
            Choose Your Experience
          </h1>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-white/55 leading-relaxed">
            Pick a desktop style to explore. You can switch interfaces any time in Settings.
          </p>
          <div className="w-12 h-0.5 bg-linear-to-r from-accent/60 to-accent/20 mx-auto rounded-full" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-stretch">
          {OPTIONS.map(({ id, name, desc, img, Icon }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              aria-pressed={selected === id}
              className={`group relative w-full sm:flex-1 sm:max-w-87.5 rounded-2xl p-px text-left transition-all duration-300 ${
                selected === id
                  ? "bg-linear-to-br from-accent/80 via-accent/30 to-white/10 shadow-xl shadow-accent/15"
                  : "bg-linear-to-br from-white/15 to-white/5 hover:from-white/25 hover:to-white/10"
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
                  <div className="absolute inset-0 bg-linear-to-t from-[#080d19]/40 via-transparent to-transparent" />
                  {selected === id && (
                    <div className="absolute top-2.5 right-2.5">
                      <div className="w-7 h-7 aspect-square shrink-0 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/40 border border-white/25 text-white">
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
          className="group relative mt-6 sm:mt-7 px-6 py-3 rounded-xl text-white text-xs sm:text-sm font-semibold transition-all duration-300 overflow-hidden w-full sm:w-auto bg-linear-to-r from-white/15 via-white/10 to-white/5 backdrop-blur-xl border border-white/25 shadow-lg shadow-black/25 hover:from-white/20 hover:via-white/15 hover:to-white/10 hover:border-white/35 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d19]">
          <span className="flex items-center justify-center gap-2">
            Continue with {selected === "mac" ? "macOS" : "Windows 11"}
            <GIconChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </button>

        <div className="mt-7 pt-5 border-t border-white/10 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-px bg-linear-to-r from-transparent to-white/20" />
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
              Built With Modern Stack
            </span>
            <span className="w-8 h-px bg-linear-to-l from-transparent to-white/20" />
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap max-w-2xl">
            {TECH_STACK.map((tech) => (
              <div
                key={tech.name}
                className={`group/tech inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md transition-all duration-300 cursor-default select-none ${tech.glowClass}`}
                title={`${tech.name} — ${tech.category}`}
              >
                {tech.icon}
                <span className="text-[11px] sm:text-xs font-medium text-white/75 group-hover/tech:text-white transition-colors">
                  {tech.name}
                </span>
                <span className="text-[9px] font-medium text-white/35 hidden md:inline-block border-l border-white/10 pl-2">
                  {tech.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
