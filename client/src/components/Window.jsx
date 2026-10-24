import { useRef, useCallback, useState, useEffect } from "react";
import { GIconMinus, GIconSquare, GIconClose } from "./icons/GravityIcons";
import { useOS } from "../store/useOS";
import { useIsMobile } from "../lib/useMediaQuery";

export default function Window({ win, children }) {
  const { closeWindow, minimizeWindow, toggleMaximize, moveWindow, resizeWindow, focusWindow, osMode, windows, dockPosition } = useOS();
  const isWin = osMode === "win";
  const isMobile = useIsMobile();
  const isFocused = win.z === Math.max(...windows.map((w) => w.z));
  const dragRef = useRef(null);
  const resizeStart = useRef(null);

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
    (e) => {
      if (win.maximized || isMobile) return;
      focusWindow(win.id);
      const startX = e.clientX;
      const startY = e.clientY;
      const originX = win.x;
      const originY = win.y;
      dragRef.current = { startX, startY, originX, originY };

      const onMove = (ev) => {
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        moveWindow(win.id, Math.max(0, dragRef.current.originX + dx), Math.max(28, dragRef.current.originY + dy));
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [win, moveWindow, focusWindow, isMobile]
  );

  const onResizeStart = useCallback(
    (e) => {
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      resizeStart.current = { startX, startY, w: win.w, h: win.h };
      const onMove = (ev) => {
        const dx = ev.clientX - resizeStart.current.startX;
        const dy = ev.clientY - resizeStart.current.startY;
        resizeWindow(win.id, Math.max(320, resizeStart.current.w + dx), Math.max(260, resizeStart.current.h + dy));
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [win, resizeWindow]
  );

  if (win.minimized) return null;

  const forceFull = win.maximized || isMobile;
  // A left/right-docked Dock (macOS only) eats into the maximize bounds on that side.
  const dockClearance = !isWin && !isMobile && dockPosition !== "bottom" ? 96 : 8;
  const macLeft = !isWin && dockPosition === "left" && !isMobile ? dockClearance : 8;
  const macRight = !isWin && dockPosition === "right" && !isMobile ? dockClearance : 8;
  const baseStyle = forceFull
    ? isMobile
      ? { top: isWin ? 4 : 32, left: 4, right: 4, bottom: isWin ? 60 : 4, width: "auto", height: "auto", zIndex: win.z }
      : isWin
        ? { top: 8, left: 8, right: 8, bottom: 64, width: "auto", height: "auto", zIndex: win.z }
        : { top: 30, left: macLeft, right: macRight, bottom: 8, width: "auto", height: "auto", zIndex: win.z }
    : { top: win.y, left: win.x, width: win.w, height: win.h, zIndex: win.z };

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

  const style = { ...baseStyle, transform, opacity, transition: "transform 220ms cubic-bezier(.4,0,.2,1), opacity 200ms ease, box-shadow 180ms ease" };

  return (
    <div
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
        style={{ touchAction: "none" }}
      >
        {isWin ? (
          <>
            <div className="flex-1 text-xs text-white/70 font-medium select-none">{win.title}</div>
            <button onClick={requestMinimize} className="w-11 h-9 flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition-colors" aria-label="Minimize window">
              <GIconMinus size={13} />
            </button>
            {!isMobile && (
              <button onClick={() => toggleMaximize(win.id)} className="w-11 h-9 flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition-colors" aria-label="Maximize window">
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
                <button onClick={() => toggleMaximize(win.id)} className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-90 flex items-center justify-center text-black/70 opacity-90 transition-all" aria-label="Maximize window">
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
      <div className="flex-1 min-h-0 thin-scroll overflow-auto allow-select">{children}</div>
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
