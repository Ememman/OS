import { useRef, useCallback, useState, useEffect } from "react";
import {
  GIconMinus,
  GIconSquare,
  GIconClose,
  GIconLayoutColumns,
  GIconLayoutHeader,
  GIconLayoutCells,
} from "./icons/GravityIcons";
import { useOS } from "../store/useOS";
import { useIsMobile } from "../lib/useMediaQuery";

export default function Window({ win, children }) {
  const {
    closeWindow,
    minimizeWindow,
    toggleMaximize,
    snapWindow,
    moveWindow,
    resizeWindow,
    focusWindow,
    osMode,
    windows,
    dockPosition,
  } = useOS();
  const isWin = osMode === "win";
  const isMobile = useIsMobile();
  const isFocused = win.z === Math.max(...windows.map((w) => w.z));
  const windowRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const resizeStart = useRef<{ startX: number; startY: number; w: number; h: number } | null>(null);
  const rafId = useRef<number | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, []);

  // Snap layout menu state
  const [showSnapMenu, setShowSnapMenu] = useState(false);
  const snapTimeout = useRef<any>(null);

  const handleSnapEnter = () => {
    if (isMobile) return;
    snapTimeout.current = setTimeout(() => setShowSnapMenu(true), 260);
  };

  const handleSnapLeave = () => {
    if (snapTimeout.current) clearTimeout(snapTimeout.current);
    snapTimeout.current = setTimeout(() => setShowSnapMenu(false), 240);
  };

  const applySnap = (layout: "left" | "right" | "top" | "center" | "fullscreen") => {
    snapWindow(win.id, layout);
    setShowSnapMenu(false);
  };

  // entrance/exit animation phases: "entering" -> "open" -> "closing" | "minimizing"
  const [phase, setPhase] = useState("entering");
  const wasMinimized = useRef(win.minimized);

  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase("open"));
    return () => cancelAnimationFrame(id);
  }, []);

  // When a window is restored from the dock/taskbar (minimized -> false),
  // it stays mounted the whole time — so we must reset the animation phase
  // back to "open" ourselves, otherwise it stays stuck invisible/shrunk
  // from whatever the minimize animation left it at.
  useEffect(() => {
    if (wasMinimized.current && !win.minimized) {
      setPhase("entering");
      const id = requestAnimationFrame(() => setPhase("open"));
      return () => cancelAnimationFrame(id);
    }
    wasMinimized.current = win.minimized;
  }, [win.minimized]);

  const dockTarget = () => {
    // Windows taskbar is always at the bottom. macOS Dock can be bottom,
    // left, or right (Settings → Dock position) — and always collapses
    // back to bottom on phones, where there's no room for a vertical dock.
    const macDockPos = isMobile ? "bottom" : dockPosition;

    if (isWin) return { x: window.innerWidth / 2, y: window.innerHeight - 28 };
    if (macDockPos === "left") return { x: 48, y: window.innerHeight / 2 };
    if (macDockPos === "right") return { x: window.innerWidth - 48, y: window.innerHeight / 2 };
    return { x: window.innerWidth / 2, y: window.innerHeight - 24 };
  };

  const runExit = useCallback(
    (kind, after) => {
      setPhase(kind); // "closing" or "minimizing"
      setTimeout(after, 220);
    },
    []
  );

  const requestClose = () => runExit("closing", () => closeWindow(win.id));
  const requestMinimize = () => runExit("minimizing", () => minimizeWindow(win.id));

    const onDragStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) return;
      if (win.maximized || isMobile) return;
      focusWindow(win.id);

      const el = windowRef.current;
      if (!el) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const originX = win.x;
      const originY = win.y;
      dragRef.current = { startX, startY, originX, originY };

      let latestX = originX;
      let latestY = originY;

      el.style.transition = "none";
      el.style.willChange = "left, top";
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
      setIsInteracting(true);

      const onMove = (ev: PointerEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        latestX = Math.max(0, Math.min(window.innerWidth - 80, dragRef.current.originX + dx));
        latestY = Math.max(28, Math.min(window.innerHeight - 60, dragRef.current.originY + dy));

        if (!rafId.current) {
          rafId.current = requestAnimationFrame(() => {
            if (windowRef.current) {
              windowRef.current.style.left = `${latestX}px`;
              windowRef.current.style.top = `${latestY}px`;
            }
            rafId.current = null;
          });
        }
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);

        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }

        if (windowRef.current) {
          windowRef.current.style.transition = "";
          windowRef.current.style.willChange = "auto";
        }
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        setIsInteracting(false);
        dragRef.current = null;

        moveWindow(win.id, latestX, latestY);
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [win.id, win.x, win.y, win.maximized, isMobile, focusWindow, moveWindow]
  );

  const onResizeStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (win.maximized || isMobile) return;
      focusWindow(win.id);

      const el = windowRef.current;
      if (!el) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = win.w;
      const startH = win.h;
      resizeStart.current = { startX, startY, w: startW, h: startH };

      let latestW = startW;
      let latestH = startH;

      el.style.transition = "none";
      el.style.willChange = "width, height";
      document.body.style.userSelect = "none";
      document.body.style.cursor = "se-resize";
      setIsInteracting(true);

      const onMove = (ev: PointerEvent) => {
        if (!resizeStart.current) return;
        const dx = ev.clientX - resizeStart.current.startX;
        const dy = ev.clientY - resizeStart.current.startY;
        latestW = Math.max(320, Math.min(window.innerWidth - 20, resizeStart.current.w + dx));
        latestH = Math.max(260, Math.min(window.innerHeight - 60, resizeStart.current.h + dy));

        if (!rafId.current) {
          rafId.current = requestAnimationFrame(() => {
            if (windowRef.current) {
              windowRef.current.style.width = `${latestW}px`;
              windowRef.current.style.height = `${latestH}px`;
            }
            rafId.current = null;
          });
        }
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);

        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }

        if (windowRef.current) {
          windowRef.current.style.transition = "";
          windowRef.current.style.willChange = "auto";
        }
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        setIsInteracting(false);
        resizeStart.current = null;

        resizeWindow(win.id, latestW, latestH);
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [win.id, win.w, win.h, win.maximized, isMobile, focusWindow, resizeWindow]
  );

  if (win.minimized) return null;

  const forceFull = win.maximized || isMobile;
  // A left/right-docked Dock (macOS only) eats into the maximize bounds on that side.
  const dockClearance = !isWin && !isMobile && dockPosition !== "bottom" ? 96 : 8;
  const macLeft = !isWin && dockPosition === "left" && !isMobile ? dockClearance : 8;
  const macRight = !isWin && dockPosition === "right" && !isMobile ? dockClearance : 8;
  const baseStyle = forceFull
    ? isMobile
      ? { top: isWin ? 6 : 34, left: 6, right: 6, bottom: isWin ? 56 : 72, width: "auto", height: "auto", zIndex: win.z }
      : isWin
        ? { top: 8, left: 8, right: 8, bottom: 64, width: "auto", height: "auto", zIndex: win.z }
        : { top: 30, left: macLeft, right: macRight, bottom: 8, width: "auto", height: "auto", zIndex: win.z }
    : {
        top: Math.min(win.y, window.innerHeight - 120),
        left: Math.min(win.x, window.innerWidth - 120),
        width: Math.min(win.w, window.innerWidth - 20),
        height: Math.min(win.h, window.innerHeight - (isWin ? 68 : 84)),
        maxWidth: "calc(100vw - 16px)",
        maxHeight: "calc(100vh - 64px)",
        zIndex: win.z,
      };

  // compute transform/opacity for each phase
  let transform = "scale(1) translate(0,0)";
  let opacity = 1;
  const cx = win.x + win.w / 2;
  const cy = win.y + win.h / 2;

  if (phase === "entering") {
    transform = "scale(0.92) translateY(10px)";
    opacity = 0;
  } else if (phase === "closing") {
    transform = "scale(0.92)";
    opacity = 0;
  } else if (phase === "minimizing") {
    const target = dockTarget();
    const dx = target.x - cx;
    const dy = target.y - cy;
    transform = `translate(${dx}px, ${dy}px) scale(0.08)`;
    opacity = 0;
  }

  const style = {
    ...baseStyle,
    transform,
    opacity,
    transition: isInteracting
      ? "none"
      : "left 240ms cubic-bezier(.16, 1, 0.3, 1), top 240ms cubic-bezier(.16, 1, 0.3, 1), width 240ms cubic-bezier(.16, 1, 0.3, 1), height 240ms cubic-bezier(.16, 1, 0.3, 1), transform 220ms cubic-bezier(.4,0,.2,1), opacity 200ms ease, box-shadow 180ms ease",
  };

  const renderSnapFlyout = () => {
    if (!showSnapMenu || isMobile) return null;
    return (
      <div
        onMouseEnter={() => {
          if (snapTimeout.current) clearTimeout(snapTimeout.current);
        }}
        onMouseLeave={handleSnapLeave}
        className={`absolute z-50 p-2.5 rounded-xl bg-[#141416]/95 backdrop-blur-xl border border-white/20 shadow-2xl transition-all ${
          isWin ? "top-10 right-8" : "top-8 left-16"
        }`}
        style={{ width: "220px" }}
      >
        <div className="text-[10px] uppercase font-mono tracking-wider text-white/50 mb-2 px-0.5">
          Snap Layouts
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* Left / Right Split */}
          <div className="flex flex-col gap-1">
            <div className="h-14 rounded-md border border-white/10 p-1 flex gap-1 bg-white/5">
              <button
                type="button"
                onClick={() => applySnap("left")}
                className="flex-1 rounded bg-white/10 hover:bg-emerald-500/30 hover:border hover:border-emerald-400/50 transition-all flex items-center justify-center group"
                title="Snap Left (50%)"
              >
                <GIconLayoutColumns size={16} className="text-white/60 group-hover:text-emerald-300 transition-colors" />
              </button>
              <button
                type="button"
                onClick={() => applySnap("right")}
                className="flex-1 rounded bg-white/10 hover:bg-emerald-500/30 hover:border hover:border-emerald-400/50 transition-all flex items-center justify-center group"
                title="Snap Right (50%)"
              >
                <GIconLayoutColumns size={16} className="text-white/60 group-hover:text-emerald-300 transition-colors rotate-180" />
              </button>
            </div>
            <span className="text-[9px] text-center text-white/50 font-mono">50 / 50 Split</span>
          </div>

          {/* Top / Center presets */}
          <div className="flex flex-col gap-1">
            <div className="h-14 rounded-md border border-white/10 p-1 flex flex-col gap-1 bg-white/5">
              <button
                type="button"
                onClick={() => applySnap("top")}
                className="flex-1 rounded bg-white/10 hover:bg-sky-500/30 hover:border hover:border-sky-400/50 transition-all flex items-center justify-center group"
                title="Snap Top Half"
              >
                <GIconLayoutHeader size={15} className="text-white/60 group-hover:text-sky-300 transition-colors" />
              </button>
              <button
                type="button"
                onClick={() => applySnap("center")}
                className="flex-1 rounded bg-white/10 hover:bg-amber-500/30 hover:border hover:border-amber-400/50 transition-all flex items-center justify-center group"
                title="Center Stage"
              >
                <GIconLayoutCells size={15} className="text-white/60 group-hover:text-amber-300 transition-colors" />
              </button>
            </div>
            <span className="text-[9px] text-center text-white/50 font-mono">Focus / Top</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => applySnap("fullscreen")}
          className="mt-2 w-full py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white text-[11px] font-mono flex items-center justify-center gap-1.5 transition-all"
        >
          <GIconSquare size={10} /> Fullscreen
        </button>
      </div>
    );
  };

  return (
    <div
      ref={windowRef}
      className={`absolute glass shadow-2xl flex flex-col overflow-hidden transition-shadow ${isWin ? "rounded-lg" : "rounded-2xl"} ${
        isFocused ? "ring-1 ring-white/15" : "brightness-[0.82] saturate-[0.85]"
      }`}
      style={style}
      onPointerDown={() => focusWindow(win.id)}
    >
      <div
        className={`flex items-center h-9 shrink-0 border-b border-white/8 cursor-default ${isWin ? "pl-3" : "gap-2 px-3"} ${
          isFocused ? "" : "opacity-80"
        }`}
        onPointerDown={onDragStart}
        onDoubleClick={() => !isMobile && toggleMaximize(win.id)}
        style={{ touchAction: "none" }}
      >
        {isWin ? (
          <>
            <div className="flex-1 text-xs text-white/70 font-medium select-none">{win.title}</div>
            <button onClick={requestMinimize} className="w-11 h-9 flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition-colors" aria-label="Minimize window">
              <GIconMinus size={13} />
            </button>
            {!isMobile && (
              <button
                onClick={() => toggleMaximize(win.id)}
                onMouseEnter={handleSnapEnter}
                onMouseLeave={handleSnapLeave}
                className="w-11 h-9 flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition-colors relative"
                aria-label="Maximize window or hover for snap layouts"
              >
                <GIconSquare size={11} />
              </button>
            )}
            <button onClick={requestClose} className="w-11 h-9 flex items-center justify-center hover:bg-[#e81123] text-white/70 hover:text-white transition-colors" aria-label="Close window">
              <GIconClose size={13} />
            </button>
          </>
        ) : (
          <>
            <div className="group/controls flex items-center gap-2">
              <button onClick={requestClose} className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-90 flex items-center justify-center text-black/70 opacity-90 transition-all" aria-label="Close window">
                <span className="opacity-0 group-hover/controls:opacity-100 transition-opacity">
                  <GIconClose size={8} />
                </span>
              </button>
              <button onClick={requestMinimize} className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-90 flex items-center justify-center text-black/70 opacity-90 transition-all" aria-label="Minimize window">
                <span className="opacity-0 group-hover/controls:opacity-100 transition-opacity">
                  <GIconMinus size={8} />
                </span>
              </button>
              {!isMobile && (
                <button
                  onClick={() => toggleMaximize(win.id)}
                  onMouseEnter={handleSnapEnter}
                  onMouseLeave={handleSnapLeave}
                  className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-90 flex items-center justify-center text-black/70 opacity-90 transition-all"
                  aria-label="Maximize window or hover for snap layouts"
                >
                  <span className="opacity-0 group-hover/controls:opacity-100 transition-opacity">
                    <GIconSquare size={7} />
                  </span>
                </button>
              )}
            </div>
            <div className="flex-1 text-center text-xs text-white/60 font-medium select-none pr-10">{win.title}</div>
          </>
        )}
      </div>
      {renderSnapFlyout()}
      <div className={`flex-1 min-h-0 thin-scroll overflow-auto allow-select ${isInteracting ? "pointer-events-none select-none" : ""}`}>{children}</div>
      {!win.maximized && !isMobile && (
        <div
          onPointerDown={onResizeStart}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          style={{ touchAction: "none" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" className="opacity-40">
            <path d="M12 2 L2 12 M12 7 L7 12 M12 12 L12 12" stroke="white" strokeWidth="1.2" />
          </svg>
        </div>
      )}
    </div>
  );
}
