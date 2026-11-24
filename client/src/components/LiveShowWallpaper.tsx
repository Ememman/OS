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
  const particleMode = useOS((s) => s.liveShowParticleMode);
  const cycleParticleMode = useOS((s) => s.cycleLiveShowParticleMode);

  const [sceneIndex, setSceneIndex] = useState(isDesktopWallpaper ? storeSceneIndex : 0);
  const [nextSceneIndex, setNextSceneIndex] = useState((sceneIndex + 1) % DARK_NATURE_SCENES.length);
  const [isCrossFading, setIsCrossFading] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [modeNotice, setModeNotice] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Preload all high-res dark aesthetic nature scenes for instantaneous crossfading
  useEffect(() => {
    DARK_NATURE_SCENES.forEach((scene, idx) => {
      const img = new Image();
      img.src = scene.url;
      img.onload = () => setImagesLoaded((prev) => ({ ...prev, [idx]: true }));
    });
  }, []);

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
      } else if (e.key.toLowerCase() === "p" || e.key.toLowerCase() === "s") {
        e.preventDefault();
        cycleParticleMode();
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
  }, [isMini, isDesktopWallpaper, onClose, sceneIndex, changeScene, cycleParticleMode]);

  // Notice toast when particle mode is changed in fullscreen mode
  useEffect(() => {
    if (isMini || isDesktopWallpaper) return;
    const label =
      particleMode === "fireflies"
        ? "Particles: Emerald Fireflies 🌿"
        : particleMode === "stars"
        ? "Particles: Twinkling Stars ✨"
        : particleMode === "embers"
        ? "Particles: Golden Embers 🔥"
        : "Particles: Disabled 🚫";
    setModeNotice(label);
    const timer = setTimeout(() => setModeNotice(null), 1800);
    return () => clearTimeout(timer);
  }, [particleMode, isMini, isDesktopWallpaper]);

  // Touch Swipe Gesture Listener (Swipe Left / Right to switch scenes on mobile & tablets)
  useEffect(() => {
    if (isMini || isDesktopWallpaper) return;
    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) changeScene(sceneIndex - 1);
        else changeScene(sceneIndex + 1);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isMini, isDesktopWallpaper, sceneIndex, changeScene]);

  // Enhanced Atmospheric Particles Simulation (Fireflies, Stars, Embers, or Off)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    if (particleMode === "off") {
      ctx.clearRect(0, 0, width, height);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    let animId: number;
    let particles: Array<{
      x: number;
      y: number;
      r: number;
      speedY: number;
      swaySpeed: number;
      swayOffset: number;
      baseAlpha: number;
      pulseSpeed: number;
      palette: string;
      isSpike?: boolean;
    }> = [];

    if (particleMode === "stars") {
      const starCount = isMini ? 35 : isDesktopWallpaper ? 65 : 95;
      particles = Array.from({ length: starCount }).map((_, i) => {
        const isBright = i % 4 === 0;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: isBright
            ? Math.random() * (isMini ? 1.6 : 2.4) + 1.2
            : Math.random() * 1.2 + 0.5,
          speedY: -(Math.random() * 0.05 + 0.01),
          swaySpeed: Math.random() * 0.008 + 0.003,
          swayOffset: Math.random() * Math.PI * 2,
          baseAlpha: isBright ? Math.random() * 0.45 + 0.55 : Math.random() * 0.35 + 0.25,
          pulseSpeed: Math.random() * 0.045 + 0.02,
          isSpike: isBright,
          palette: i % 3 === 0 ? "white" : i % 3 === 1 ? "gold" : "ice",
        };
      });
    } else if (particleMode === "embers") {
      const emberCount = isMini ? 22 : isDesktopWallpaper ? 40 : 60;
      particles = Array.from({ length: emberCount }).map((_, i) => {
        const isEmber = i % 3 === 0;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: isEmber
            ? Math.random() * (isMini ? 2.2 : 3.2) + 1.2
            : Math.random() * 1.5 + 0.6,
          speedY: -(Math.random() * 0.5 + 0.18),
          swaySpeed: Math.random() * 0.025 + 0.015,
          swayOffset: Math.random() * Math.PI * 2,
          baseAlpha: isEmber ? Math.random() * 0.55 + 0.45 : Math.random() * 0.35 + 0.2,
          pulseSpeed: Math.random() * 0.04 + 0.02,
          palette: i % 3 === 0 ? "amber" : i % 3 === 1 ? "coral" : "gold",
        };
      });
    } else {
      // Default: Bioluminescent Emerald & Forest Fireflies
      const fireflyCount = isMini ? 20 : isDesktopWallpaper ? 36 : 56;
      particles = Array.from({ length: fireflyCount }).map((_, i) => {
        const isFirefly = i % 3 === 0;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: isFirefly
            ? Math.random() * (isMini ? 2.0 : 3.0) + 1.2
            : Math.random() * 1.5 + 0.6,
          speedY: -(Math.random() * 0.4 + 0.12),
          swaySpeed: Math.random() * 0.02 + 0.01,
          swayOffset: Math.random() * Math.PI * 2,
          baseAlpha: isFirefly ? Math.random() * 0.5 + 0.45 : Math.random() * 0.3 + 0.2,
          pulseSpeed: Math.random() * 0.035 + 0.015,
          palette: i % 3 === 0 ? "emerald" : i % 3 === 1 ? "teal" : "amber",
        };
      });
    }

    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += Math.sin(frame * p.swaySpeed + p.swayOffset) * (particleMode === "stars" ? 0.18 : 0.55);

        if (p.y < -20) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        const alpha = Math.max(0.08, Math.min(1, p.baseAlpha + Math.sin(frame * p.pulseSpeed) * 0.28));
        const radius = p.r * (1 + Math.sin(frame * p.pulseSpeed) * 0.2);

        if (particleMode === "stars") {
          // Soft starlight radial halo
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 3.8);
          if (p.palette === "gold") {
            glow.addColorStop(0, `rgba(254, 240, 138, ${Math.min(1, alpha * 0.95)})`);
            glow.addColorStop(0.5, `rgba(250, 204, 21, ${alpha * 0.35})`);
            glow.addColorStop(1, "rgba(234, 179, 8, 0)");
          } else if (p.palette === "ice") {
            glow.addColorStop(0, `rgba(224, 242, 254, ${Math.min(1, alpha * 0.95)})`);
            glow.addColorStop(0.5, `rgba(186, 230, 253, ${alpha * 0.35})`);
            glow.addColorStop(1, "rgba(125, 211, 252, 0)");
          } else {
            glow.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, alpha * 0.95)})`);
            glow.addColorStop(0.5, `rgba(241, 245, 249, ${alpha * 0.35})`);
            glow.addColorStop(1, "rgba(255, 255, 255, 0)");
          }

          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 3.8, 0, Math.PI * 2);
          ctx.fill();

          // Delicate 4-point cross diffraction spikes for bright stars
          if (p.isSpike) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.75})`;
            ctx.lineWidth = 0.75;
            const spikeLen = radius * 4.2;
            ctx.beginPath();
            ctx.moveTo(p.x - spikeLen, p.y);
            ctx.lineTo(p.x + spikeLen, p.y);
            ctx.moveTo(p.x, p.y - spikeLen);
            ctx.lineTo(p.x + spikeLen, p.y);
            ctx.stroke();
          }

          // Diamond star core
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * 1.1)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.6, radius * 0.75), 0, Math.PI * 2);
          ctx.fill();
        } else if (particleMode === "embers") {
          // Warm campfire embers
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 3.8);
          if (p.palette === "amber") {
            glow.addColorStop(0, `rgba(251, 191, 36, ${Math.min(1, alpha * 0.95)})`);
            glow.addColorStop(0.5, `rgba(245, 158, 11, ${alpha * 0.45})`);
            glow.addColorStop(1, "rgba(217, 119, 6, 0)");
          } else if (p.palette === "coral") {
            glow.addColorStop(0, `rgba(251, 146, 60, ${Math.min(1, alpha * 0.95)})`);
            glow.addColorStop(0.5, `rgba(234, 88, 12, ${alpha * 0.45})`);
            glow.addColorStop(1, "rgba(194, 65, 12, 0)");
          } else {
            glow.addColorStop(0, `rgba(254, 215, 170, ${Math.min(1, alpha * 0.95)})`);
            glow.addColorStop(0.5, `rgba(253, 186, 116, ${alpha * 0.45})`);
            glow.addColorStop(1, "rgba(249, 115, 22, 0)");
          }

          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 3.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(255, 247, 237, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 0.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Bioluminescent emerald, teal, and amber fireflies
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 3.8);
          if (p.palette === "emerald") {
            glow.addColorStop(0, `rgba(52, 211, 153, ${Math.min(1, alpha * 0.95)})`);
            glow.addColorStop(0.5, `rgba(16, 185, 129, ${alpha * 0.45})`);
            glow.addColorStop(1, "rgba(5, 150, 105, 0)");
          } else if (p.palette === "teal") {
            glow.addColorStop(0, `rgba(45, 212, 191, ${Math.min(1, alpha * 0.95)})`);
            glow.addColorStop(0.5, `rgba(20, 184, 166, ${alpha * 0.45})`);
            glow.addColorStop(1, "rgba(13, 148, 136, 0)");
          } else {
            glow.addColorStop(0, `rgba(251, 191, 36, ${Math.min(1, alpha * 0.95)})`);
            glow.addColorStop(0.5, `rgba(245, 158, 11, ${alpha * 0.45})`);
            glow.addColorStop(1, "rgba(217, 119, 6, 0)");
          }

          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 3.8, 0, Math.PI * 2);
          ctx.fill();

          if (p.palette === "emerald") {
            ctx.fillStyle = `rgba(209, 250, 229, ${alpha})`;
          } else if (p.palette === "teal") {
            ctx.fillStyle = `rgba(204, 251, 241, ${alpha})`;
          } else {
            ctx.fillStyle = `rgba(254, 243, 199, ${alpha})`;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMini, isDesktopWallpaper, particleMode]);

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
              Cycling dark nature aesthetic scenes & {particleMode === "stars" ? "twinkling stars" : particleMode === "embers" ? "golden embers" : particleMode === "off" ? "clean dark scenery" : "forest fireflies"}
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
              <span className="leading-none text-center">Live Show</span>
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

          {/* Realtime Particle Mode Notice Toast */}
          {modeNotice && (
            <div className="absolute bottom-20 z-30 pointer-events-none animate-fade-in">
              <div className="px-4 py-2 rounded-full bg-black/75 backdrop-blur-xl border border-emerald-500/40 text-emerald-300 text-xs font-mono font-medium shadow-2xl tracking-wide">
                {modeNotice}
              </div>
            </div>
          )}

          {/* Footer Power Icon */}
          <div className="relative z-20 pb-4 text-center">
            <div className="w-9 h-9 rounded-full bg-emerald-500/15 backdrop-blur-md border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-300 animate-pulse shadow-lg">
              <GIconPower size={17} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
