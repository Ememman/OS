import { useEffect, useRef } from "react";
import { useOS } from "../store/useOS";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  phase: number;
}

export default function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesEnabled = useOS((s: any) => s.particlesEnabled);
  const reduceMotion = useOS((s: any) => s.reduceMotion);
  const windows = useOS((s: any) => s.windows);

  useEffect(() => {
    if (!particlesEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let isMobile = width < 768;

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      isMobile = width < 768;
    };
    window.addEventListener("resize", onResize, { passive: true });

    // On mobile screens, use 16 gentle stars; on desktop, 65 particles
    const particleCount = isMobile ? 16 : 65;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (reduceMotion || isMobile ? 0.08 : 0.32),
        vy: (Math.random() - 0.5) * (reduceMotion || isMobile ? 0.08 : 0.32),
        size: Math.random() * 1.6 + 0.6,
        baseAlpha: Math.random() * 0.45 + 0.2,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let mouseX = -1000;
    let mouseY = -1000;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    if (!isMobile) {
      window.addEventListener("mousemove", onMouseMove, { passive: true });
    }

    let tick = 0;
    let frameCount = 0;

    const render = () => {
      // Pause drawing on mobile if a fullscreen window is currently covering the screen
      const hasFullscreenWindow = isMobile && windows.some((w: any) => !w.minimized);
      if (hasFullscreenWindow) {
        animId = requestAnimationFrame(render);
        return;
      }

      frameCount++;
      // On mobile, render at 30fps (every 2nd tick) to save GPU fill rate & battery
      if (isMobile && frameCount % 2 !== 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      tick += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Draw constellation connections ONLY on desktop screens (heavy O(N^2) GPU draw on mobile)
      if (!isMobile) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 90) {
              const alpha = (1 - dist / 90) * 0.1;
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!reduceMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }

        // Mouse proximity glow (desktop only)
        let mouseBonus = 0;
        if (!isMobile && mouseX !== -1000) {
          const mdx = mouseX - p.x;
          const mdy = mouseY - p.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 120) mouseBonus = (1 - mdist / 120) * 0.35;
        }

        const pulse = Math.sin(tick + p.phase) * 0.18;
        const currentAlpha = Math.min(1, Math.max(0.1, p.baseAlpha + pulse + mouseBonus));

        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      if (!isMobile) {
        window.removeEventListener("mousemove", onMouseMove);
      }
    };
  }, [particlesEnabled, reduceMotion, windows]);

  if (!particlesEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 opacity-80"
      style={{ touchAction: "none" }}
    />
  );
}
