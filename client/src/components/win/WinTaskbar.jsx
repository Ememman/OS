import { useEffect, useRef, useState } from "react";
import {
  Search, Wifi, Volume2, ChevronUp, Code2, Library, Music2, Bell, MessageCircle,
  Images, Gamepad2, Settings as SettingsIcon, FileUser, Grip, FolderOpen,
  Bluetooth, BatteryFull, Moon, X
} from "lucide-react";
import { useOS } from "../../store/useOS";
import { useIsMobile } from "../../lib/useMediaQuery";
import { useOutsideClick } from "../../lib/useOutsideClick";
import WeatherChip from "./WeatherChip";
import LiveBadge from "../LiveBadge";
import CalendarWidget from "../widgets/CalendarWidget";
import WeatherWidget from "../widgets/WeatherWidget";

const TASKBAR_ITEMS = [
  { app: "library", label: "Library", icon: Library, color: "#5BB8B0" },
  { app: "music", label: "Music", icon: Music2, color: "#D9678C" },
  { app: "updates", label: "Updates", icon: Bell, color: "#5FBF7C" },
  { app: "chats", label: "Chats", icon: MessageCircle, color: "#8E7BE0" },
  { app: "gallery", label: "Gallery", icon: Images, color: "#B8C25A" },
  { app: "games", label: "Games", icon: Gamepad2, color: "#D98A4E" },
  { app: "files", label: "Files", icon: FolderOpen, color: "#E0B84E" },
  { app: "settings", label: "Settings", icon: SettingsIcon, color: "#8892A6" },
  { app: "resume", label: "Resume", icon: FileUser, color: "#4B5A73" }
];

const POP_ANIM = { animation: "menuOpen 150ms cubic-bezier(.16,1,.3,1) both" };

function StartMenu({ onClose }) {
  const ref = useRef(null);
  const { openApp } = useOS();
  const [query, setQuery] = useState("");
  useOutsideClick(ref, onClose);

  const results = TASKBAR_ITEMS.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div
      ref={ref}
      className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[calc(100vw-24px)] max-w-[380px] glass rounded-2xl border border-white/10 shadow-2xl p-4 z-[1200] origin-bottom"
      style={POP_ANIM}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">Pinned</span>
        <button onClick={onClose} className="p-1 hover:bg-white/10 active:bg-white/20 rounded transition-colors"><X size={13} /></button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (results[0]) { openApp(results[0].app); onClose(); } }} className="mb-3">
        <div className="flex items-center gap-2 bg-white/8 rounded-xl px-3 h-9">
          <Search size={13} className="text-white/40 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps"
            className="bg-transparent outline-none text-xs w-full placeholder:text-white/35"
          />
        </div>
      </form>

      {results.length === 0 ? (
        <p className="text-xs text-white/40 text-center py-6">No apps match "{query}"</p>
      ) : (
        <div className="grid grid-cols-3 xs:grid-cols-4 gap-2 sm:gap-3">
          {results.map(({ app, label, icon: Icon, color }) => (
            <button
              key={app}
              onClick={() => { openApp(app); onClose(); }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 active:bg-white/15 active:scale-95 transition"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}25` }}>
                <Icon size={18} color={color} />
              </div>
              <span className="text-[10px] text-white/75 text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center text-[11px] font-semibold">B</div>
        <span className="text-xs text-white/70">Bron Mendoza</span>
      </div>
    </div>
  );
}

function TrayFlyout({ onClose }) {
  const ref = useRef(null);
  useOutsideClick(ref, onClose);
  const items = [
    { label: "Bluetooth", Icon: Bluetooth, sub: "Not connected" },
    { label: "Battery", Icon: BatteryFull, sub: "100%" },
    { label: "Focus", Icon: Moon, sub: "Off" }
  ];
  return (
    <div ref={ref} className="absolute bottom-16 right-2 sm:right-3 w-52 glass rounded-2xl border border-white/10 shadow-2xl p-2 z-[1200] origin-bottom-right" style={POP_ANIM}>
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/10 transition-colors">
          <i.Icon size={15} className="text-white/70" />
          <div className="text-xs">
            <div className="text-white/85">{i.label}</div>
            <div className="text-white/40 text-[10px]">{i.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DateFlyout({ onClose }) {
  const ref = useRef(null);
  useOutsideClick(ref, onClose);
  return (
    <div ref={ref} className="absolute bottom-16 right-2 sm:right-3 z-[1200] origin-bottom-right" style={POP_ANIM}>
      <CalendarWidget />
    </div>
  );
}

function WeatherFlyout({ onClose }) {
  const ref = useRef(null);
  useOutsideClick(ref, onClose);
  return (
    <div ref={ref} className="absolute bottom-16 left-2 sm:left-3 z-[1200] origin-bottom-left" style={POP_ANIM}>
      <WeatherWidget />
    </div>
  );
}

export default function WinTaskbar() {
  const { openApp, windows, compact } = useOS();
  const isMobile = useIsMobile();
  const effectiveCompact = compact || isMobile;
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(new Date());
  const [panel, setPanel] = useState(null); // "start" | "tray" | "date" | "weather" | null
  const openApps = new Set(windows.map((w) => w.app));
  const btnSize = effectiveCompact ? "w-8 h-8" : "w-9 h-9";
  const iconSize = effectiveCompact ? 15 : 18;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const toggle = (name) => setPanel((p) => (p === name ? null : name));

  const runSearch = (e) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    const match = TASKBAR_ITEMS.find((i) => i.label.toLowerCase().includes(q) || i.app.includes(q));
    if (match) openApp(match.app);
    setQuery("");
  };

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { month: "numeric", day: "numeric", year: "numeric" });

  return (
    <div className="absolute bottom-0 left-0 right-0 h-14 z-[900] glass border-t border-white/10 flex items-center justify-between px-1.5 sm:px-3 shadow-[0_-4px_20px_rgba(0,0,0,0.25)] reveal-fade gap-1">
      <div className="flex items-center flex-1 min-w-0 basis-0">
        <button onClick={() => toggle("weather")} className="rounded-xl shrink-0 hover:bg-white/5 active:bg-white/10 transition-colors">
          <WeatherChip compact={isMobile} />
        </button>
      </div>

      <div className="flex items-center gap-1 glass rounded-2xl px-1.5 py-1.5 border border-white/10 shadow-lg relative overflow-x-auto no-scrollbar max-w-[70vw] sm:max-w-none">
        <button
          onClick={() => toggle("start")}
          title="Start"
          className={`flex items-center justify-center ${btnSize} rounded-xl transition-colors active:scale-95 shrink-0 ${panel === "start" ? "bg-white/15" : "hover:bg-white/10"}`}
        >
          <Grip size={iconSize} className="accent" />
        </button>
        <div className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl text-white/60 hover:bg-white/10 transition-colors cursor-default shrink-0" title="View source">
          <Code2 size={16} />
        </div>
        <form onSubmit={runSearch} className="hidden md:flex items-center gap-2 bg-white/8 rounded-xl px-3 h-9 w-32 lg:w-56 mx-0.5 shrink-0">
          <Search size={13} className="text-white/40 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps"
            className="bg-transparent outline-none text-xs w-full placeholder:text-white/35"
          />
        </form>
        <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />
        <div className="flex items-center gap-0.5">
          {TASKBAR_ITEMS.filter((i) => i.app !== "resume").map(({ app, label, icon: Icon, color }) => (
            <button
              key={app}
              onClick={() => openApp(app)}
              title={label}
              className={`relative flex items-center justify-center shrink-0 ${btnSize} rounded-xl hover:bg-white/10 active:bg-white/15 active:scale-95 transition`}
            >
              <Icon size={iconSize} color={color} />
              {openApps.has(app) && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-white/80" />}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />
        <button onClick={() => openApp("resume")} title="Resume" className={`relative flex items-center justify-center shrink-0 ${btnSize} rounded-xl hover:bg-white/10 active:bg-white/15 active:scale-95 transition`}>
          <FileUser size={iconSize} color="#4B5A73" />
          {openApps.has("resume") && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-white/80" />}
        </button>
      </div>

      <div className="flex items-center justify-end flex-1 min-w-0 basis-0 relative gap-1.5">
        <div className="hidden sm:block"><LiveBadge compact /></div>
        <button onClick={() => toggle("tray")} className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors shrink-0">
          <ChevronUp size={14} className={`text-white/50 transition-transform ${panel === "tray" ? "rotate-180" : ""}`} />
        </button>
        <div className="hidden xs:flex items-center gap-2 sm:gap-3 px-2 sm:px-3 h-10 rounded-xl hover:bg-white/10 transition-colors cursor-default shrink-0">
          <Wifi size={15} className="text-white/70" />
          <Volume2 size={15} className="text-white/70" />
        </div>
        <button onClick={() => toggle("date")} className="text-[10px] sm:text-[11px] leading-tight text-right border-l border-white/10 pl-2 sm:pl-3 pr-1 py-1 rounded-lg hover:bg-white/10 active:bg-white/15 transition-colors shrink-0">
          <div className="font-medium font-mono">{time}</div>
          <div className="text-white/50 hidden sm:block">{date}</div>
        </button>

        {panel === "tray" && <TrayFlyout onClose={() => setPanel(null)} />}
        {panel === "date" && <DateFlyout onClose={() => setPanel(null)} />}
      </div>

      {panel === "weather" && <WeatherFlyout onClose={() => setPanel(null)} />}
      {panel === "start" && <StartMenu onClose={() => setPanel(null)} />}
    </div>
  );
}
