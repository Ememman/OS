import { useEffect, useState, useMemo } from "react";
import { useOS } from "../store/useOS";
import { GIconPower, GIconMoon } from "./icons/GravityIcons";

const DARK_AESTHETIC_NATURE_WALLPAPERS = [
  {
    title: "Misty Alpine Forest",
    url: "https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=1920&auto=format&fit=crop",
  },
  {
    title: "Midnight Mountain Lake",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop",
  },
  {
    title: "Moody Foggy Woods",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1920&auto=format&fit=crop",
  },
  {
    title: "Mystic Wilderness Lake",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1920&auto=format&fit=crop",
  },
  {
    title: "Dark Ocean Cliff at Dusk",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop",
  },
  {
    title: "Deep Redwood Evergreen Mist",
    url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=1920&auto=format&fit=crop",
  },
  {
    title: "Canyon Cascade Waterfall",
    url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=1920&auto=format&fit=crop",
  },
  {
    title: "Dark Alpine Pine Ridge",
    url: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=1920&auto=format&fit=crop",
  },
];

export default function SleepScreen() {
  const { setSleeping } = useOS();
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);

  // Pick a random dark aesthetic nature wallpaper each time lock/sleep screen opens
  const activeWallpaper = useMemo(() => {
    const idx = Math.floor(Math.random() * DARK_AESTHETIC_NATURE_WALLPAPERS.length);
    return DARK_AESTHETIC_NATURE_WALLPAPERS[idx];
  }, []);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      setDate(d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleWake = () => setSleeping(false);
    window.addEventListener("keydown", handleWake);
    return () => window.removeEventListener("keydown", handleWake);
  }, [setSleeping]);

  return (
    <div
      onClick={() => setSleeping(false)}
      className="fixed inset-0 z-[99998] bg-[#05070c] flex flex-col items-center justify-between p-6 sm:p-12 text-white select-none transition-all duration-500 cursor-pointer overflow-hidden"
    >
      {/* Background Dark Aesthetic Nature Wallpaper */}
      <img
        src={activeWallpaper.url}
        alt={activeWallpaper.title}
        onLoad={() => setImageLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.45] contrast-[1.12] transition-opacity duration-700 pointer-events-none scale-105 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Atmospheric dark aesthetic vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/70 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_20%,_rgba(0,0,0,0.7)_100%)] pointer-events-none" />

      {/* Top Header & Lock Status */}
      <div className="relative z-10 pt-4 sm:pt-8 flex items-center gap-2 text-white/50 text-xs tracking-wider uppercase font-medium bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
        <GIconMoon size={13} className="text-amber-300" />
        <span>Sleep Mode · Locked</span>
      </div>

      {/* Center Clock & Date */}
      <div className="relative z-10 text-center space-y-2.5 my-auto">
        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-extralight tracking-tight text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
          {time}
        </h1>
        <p className="text-base sm:text-xl text-white/80 font-light drop-shadow-md tracking-wide">
          {date}
        </p>
        <p className="text-[11px] font-mono text-white/40 tracking-widest uppercase pt-1">
          {activeWallpaper.title}
        </p>
      </div>

      {/* Footer Wake Tip */}
      <div className="relative z-10 pb-6 text-center space-y-2">
        <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center mx-auto mb-1.5 text-white/70 animate-pulse shadow-lg">
          <GIconPower size={18} />
        </div>
        <p className="text-xs text-white/60 tracking-wider font-medium drop-shadow-sm">
          Click anywhere or press any key to wake
        </p>
      </div>
    </div>
  );
}
