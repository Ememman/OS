import { useState, useEffect, useRef, useCallback } from "react";
import { GIconMoon, GIconPower } from "./icons/GravityIcons";
import { DARK_NATURE_SCENES } from "../data/darkNatureScenes";
import { useOS } from "../store/useOS";

interface LiveShowWallpaperProps {
  isMini?: boolean;
  isDesktopWallpaper?: boolean;
  onClose?: () => void;
}

export default function LiveShowWallpaper({
  isMini = false,
  isDesktopWallpaper = false,
  onClose,
}: LiveShowWallpaperProps) {
  const storeSceneIndex = useOS((s) => s.liveWallpaperSceneIndex);
  const autoCycle = useOS((s) => s.liveWallpaperAutoCycle);
  const setStoreSceneIndex = useOS((s) => s.setLiveWallpaperSceneIndex);

  const [sceneIndex, setSceneIndex] = useState(isDesktopWallpaper ? storeSceneIndex : 0);
  const [nextSceneIndex, setNextSceneIndex] = useState((sceneIndex + 1) % DARK_NATURE_SCENES.length);
  const [isCrossFading, setIsCrossFading] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync external store scene index changes when used as desktop wallpaper
  useEffect(() => {
    if (isDesktopWallpaper && storeSceneIndex !== sceneIndex) {
      setNextSceneIndex(storeSceneIndex);
      setIsCrossFading(true);
      const timeout = setTimeout(() => {
        setSceneIndex(storeSceneIndex);
        setIsCrossFading(false);
      }, 1400);
      return () => clearTimeout(timeout);
    }
  }, [isDesktopWallpaper, storeSceneIndex, sceneIndex]);

  // Live Clock Update (only needed for mini or fullscreen screensaver mode)
  useEffect(() => {
    if (isDesktopWallpaper) return;
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      setDate(now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [isDesktopWallpaper]);

  // Manual Scene Change Handler
  const changeScene = useCallback((targetIndex: number) => {
    const next = ((targetIndex % DARK_NATURE_SCENES.length) + DARK_NATURE_SCENES.length) % DARK_NATURE_SCENES.length;
    if (next === sceneIndex) return;
    setNextSceneIndex(next);
    setIsCrossFading(true);
    setTimeout(() => {
      setSceneIndex(next);
      setIsCrossFading(false);
      if (isDesktopWallpaper) {
        setStoreSceneIndex(next);
      }
    }, 1400);
  }, [sceneIndex, isDesktopWallpaper, setStoreSceneIndex]);

  // Automatic Scene Transition
  useEffect(() => {
    if (isDesktopWallpaper && !autoCycle) return;

    const intervalMs = isDesktopWallpaper ? 16000 : 12000;
    const interval = setInterval(() => {
      const next = (sceneIndex + 1) % DARK_NATURE_SCENES.length;
      setNextSceneIndex(next);
      setIsCrossFading(true);

      const timeout = setTimeout(() => {
        setSceneIndex(next);
        setIsCrossFading(false);
        if (isDesktopWallpaper) {
          setStoreSceneIndex(next);
        }
      }, 1400);

      return () => clearTimeout(timeout);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [sceneIndex, isDesktopWallpaper, autoCycle, setStoreSceneIndex]);

  // Fullscreen Screensaver Wake Listener (with keyboard arrow scene switching)
  useEffect(() => {
    if (isMini || isDesktopWallpaper || !onClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        changeScene(sceneIndex - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        changeScene(sceneIndex + 1);
      } else {
        onClose();
      }
    };

    const handlePointerWake = (e: PointerEvent) => {
      // Don't close if clicking specifically on scene navigation buttons
      if ((e.target as HTMLElement).closest("button")) return;
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerWake);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerWake);
    };
  }, [isMini, isDesktopWallpaper, onClose, sceneIndex, changeScene]);

  // Animated Bioluminescent Fireflies / Forest Spores Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    // Generate Firefly particles
    const particleCount = isMini ? 16 : isDesktopWallpaper ? 28 : 42;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * (isMini ? 1.8 : 2.6) + 1,
      speedY: -(Math.random() * 0.45 + 0.15),
      swaySpeed: Math.random() * 0.02 + 0.01,
      swayOffset: Math.random() * Math.PI * 2,
      baseAlpha: Math.random() * 0.6 + 0.35,
      pulseSpeed: Math.random() * 0.03 + 0.015,
      hue: Math.random() > 0.4 ? 155 : 45, // Emerald green or warm amber firefly glow
    }));

    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += Math.sin(frame * p.swaySpeed + p.swayOffset) * 0.6;

        if (p.y < -20) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        const alpha = p.baseAlpha + Math.sin(frame * p.pulseSpeed) * 0.25;
        const radius = p.r * (1 + Math.sin(frame * p.pulseSpeed) * 0.2);

        // Soft radial glow around firefly
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 3.5);
        if (p.hue === 155) {
          glow.addColorStop(0, `rgba(52, 211, 153, ${Math.min(1, alpha * 0.9)})`);
          glow.addColorStop(0.5, `rgba(16, 185, 129, ${alpha * 0.4})`);
          glow.addColorStop(1, "rgba(5, 150, 105, 0)");
        } else {
          glow.addColorStop(0, `rgba(250, 204, 21, ${Math.min(1, alpha * 0.9)})`);
          glow.addColorStop(0.5, `rgba(245, 158, 11, ${alpha * 0.4})`);
          glow.addColorStop(1, "rgba(217, 119, 6, 0)");
        }

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Core bright center
        ctx.fillStyle = p.hue === 155 ? `rgba(209, 250, 229, ${alpha})` : `rgba(254, 240, 138, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMini, isDesktopWallpaper]);

  const currentScene = DARK_NATURE_SCENES[sceneIndex];
  const nextScene = DARK_NATURE_SCENES[nextSceneIndex];

  // 1. Desktop Wallpaper Background Mode (runs seamlessly underneath desktop icons, widgets, and windows)
  if (isDesktopWallpaper) {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none">
        {/* Current Scene Layer */}
        <div
          className="absolute inset-0 w-full h-full overflow-hidden select-none transition-transform duration-[16000ms] ease-out scale-105"
          style={{ background: currentScene.fallbackGradient }}
        >
          <img
            src={currentScene.url}
            alt=""
            onLoad={() => setImagesLoaded((prev) => ({ ...prev, [sceneIndex]: true }))}
            className={`w-full h-full object-cover object-center filter brightness-[0.48] contrast-[1.12] transition-opacity duration-1000 pointer-events-none ${
              imagesLoaded[sceneIndex] ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* Crossfading Next Scene Layer */}
        <div
          className={`absolute inset-0 w-full h-full overflow-hidden select-none transition-opacity duration-[1400ms] ease-in-out ${
            isCrossFading ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{ background: nextScene.fallbackGradient }}
        >
          <img
            src={nextScene.url}
            alt=""
            onLoad={() => setImagesLoaded((prev) => ({ ...prev, [nextSceneIndex]: true }))}
            className={`w-full h-full object-cover object-center filter brightness-[0.48] contrast-[1.12] pointer-events-none ${
              imagesLoaded[nextSceneIndex] ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* Layered Organic Nature Dark Vignette & Mist */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#010402]/92 via-transparent to-[#020804]/70 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_25%,_rgba(2,8,4,0.72)_100%)] pointer-events-none" />

        {/* Animated Bioluminescent Fireflies Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
      </div>
    );
  }

  // 2. Mini Preview Mode (for Settings) or Fullscreen Screensaver Mode
  return (
    <div
      onClick={isMini ? undefined : onClose}
      className={`${
        isMini
          ? "relative w-full h-full overflow-hidden select-none"
          : "fixed inset-0 z-[99990] bg-[#020503] flex flex-col items-center justify-between p-6 sm:p-12 text-white select-none cursor-pointer overflow-hidden transition-opacity duration-1000"
      }`}
    >
      {/* Current Scene Layer */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden select-none transition-transform duration-[12000ms] ease-out scale-105"
        style={{ background: currentScene.fallbackGradient }}
      >
        <img
          src={currentScene.url}
          alt={currentScene.title}
          onLoad={() => setImagesLoaded((prev) => ({ ...prev, [sceneIndex]: true }))}
          className={`w-full h-full object-cover object-center filter brightness-[0.48] contrast-[1.12] transition-opacity duration-1000 pointer-events-none ${
            imagesLoaded[sceneIndex] ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* Crossfading Next Scene Layer */}
      <div
        className={`absolute inset-0 w-full h-full overflow-hidden select-none transition-opacity duration-[1400ms] ease-in-out ${
          isCrossFading ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: nextScene.fallbackGradient }}
      >
        <img
          src={nextScene.url}
          alt={nextScene.title}
          onLoad={() => setImagesLoaded((prev) => ({ ...prev, [nextSceneIndex]: true }))}
          className={`w-full h-full object-cover object-center filter brightness-[0.48] contrast-[1.12] pointer-events-none ${
            imagesLoaded[nextSceneIndex] ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* Layered Organic Nature Dark Vignette & Mist */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#010402]/95 via-transparent to-[#020804]/75 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_25%,_rgba(2,8,4,0.75)_100%)] pointer-events-none" />

      {/* Animated Bioluminescent Fireflies Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

      {/* Mini Mode Display */}
      {isMini ? (
        <div className="relative z-20 w-full h-full flex flex-col justify-between p-3.5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-emerald-300 font-semibold uppercase tracking-wider bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-500/30">
              {currentScene.title}
            </span>
            <span className="text-[10px] font-mono text-white/50">{time}</span>
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-white drop-shadow-md truncate">{currentScene.subtitle}</p>
            <p className="text-[9px] text-emerald-300/80 font-mono tracking-wide">
              Cycling dark nature aesthetic scenes & forest fireflies
            </p>
          </div>
        </div>
      ) : (
        /* Fullscreen Screensaver Mode Overlay */
        <>
          {/* Top Status Header */}
          <div className="relative z-20 mt-3 sm:mt-6 w-full flex items-center justify-center">
            <div className="inline-flex items-center justify-center gap-2 text-white/80 text-xs tracking-wider uppercase font-medium bg-black/50 backdrop-blur-xl px-4 py-2 rounded-full border border-emerald-500/25 shadow-2xl">
              <GIconMoon size={13} className="text-emerald-400 shrink-0" />
              <span className="leading-none text-center">Dark Nature · Live Show</span>
            </div>
          </div>

          {/* Center Digital Clock */}
          <div className="relative z-20 text-center space-y-3 my-auto flex flex-col items-center justify-center">
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-extralight tracking-tight text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.85)]">
              {time}
            </h1>
            <p className="text-base sm:text-xl text-white/85 font-light drop-shadow-md tracking-wide">
              {date}
            </p>
          </div>

          {/* Footer Interactive Wake Tip */}
          <div className="relative z-20 pb-4 text-center space-y-2">
            <div className="w-9 h-9 rounded-full bg-emerald-500/15 backdrop-blur-md border border-emerald-500/30 flex items-center justify-center mx-auto mb-1.5 text-emerald-300 animate-pulse shadow-lg">
              <GIconPower size={17} />
            </div>
            <p className="text-xs text-white/70 tracking-wider font-medium drop-shadow-sm">
              Use arrow keys to change scene · Move mouse or press any key to wake
            </p>
          </div>
        </>
      )}
    </div>
  );
}
