import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useDesktopStore } from "../store/useDesktopStore";
import { useOS } from "../store/useOS";
import { APP_REGISTRY, type DesktopItem } from "../types/desktop";
import DesktopFolderIcon from "./DesktopFolderIcon";
import { soundFx } from "../lib/soundFx";

interface DesktopAppsGridProps {
  isMobile?: boolean;
}

interface DragState {
  item: DesktopItem;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
}

export default function DesktopAppsGrid({ isMobile }: DesktopAppsGridProps) {
  const { items, combineItems, openFolder } = useDesktopStore();
  const { openApp, isWin } = useOS();

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startCoordsRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const didDragRef = useRef(false);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent, item: DesktopItem) => {
    // Only handle primary button
    if (e.button !== 0) return;

    startCoordsRef.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;

    // Delay before entering drag state (long-press hold on touch, slight delay on mouse)
    const holdDelay = isMobile ? 220 : 160;

    holdTimerRef.current = setTimeout(() => {
      didDragRef.current = true;
      soundFx.playClick();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(25);
      }

      setDragState({
        item,
        startX: startCoordsRef.current.x,
        startY: startCoordsRef.current.y,
        currentX: startCoordsRef.current.x,
        currentY: startCoordsRef.current.y,
        isDragging: true,
      });
    }, holdDelay);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // If not dragging yet, check if moved past scroll tolerance threshold
    if (!didDragRef.current) {
      const dist = Math.hypot(
        e.clientX - startCoordsRef.current.x,
        e.clientY - startCoordsRef.current.y
      );
      // On mobile, moving too fast before hold time cancels drag to allow scrolling
      if (dist > 12) {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
      }
      return;
    }

    // We are actively dragging
    if (dragState?.isDragging) {
      setDragState((prev) => (prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null));

      // Hit-test element under pointer
      const targetEl = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-desktop-item-id]");
      const targetId = targetEl?.getAttribute("data-desktop-item-id");

      if (targetId && targetId !== dragState.item.id) {
        if (hoverTargetId !== targetId) {
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(15);
          }
        }
        setHoverTargetId(targetId);
      } else {
        setHoverTargetId(null);
      }
    }
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (dragState?.isDragging) {
      if (hoverTargetId && hoverTargetId !== dragState.item.id) {
        combineItems(dragState.item.id, hoverTargetId);
      }
      setDragState(null);
      setHoverTargetId(null);
      // Brief block so click event doesn't fire immediately
      setTimeout(() => {
        didDragRef.current = false;
      }, 50);
      return;
    }

    didDragRef.current = false;
  };

  const handleItemClick = (item: DesktopItem) => {
    if (didDragRef.current) return;
    if (item.type === "app") {
      openApp(item.app);
    } else {
      openFolder(item.id);
    }
  };

  return (
    <>
      {/* Grid container */}
      <div
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={
          isMobile
            ? "grid grid-cols-4 min-[390px]:grid-cols-5 sm:flex sm:flex-wrap items-center justify-items-center gap-2 sm:gap-3 w-full max-w-sm sm:max-w-none select-none"
            : "flex flex-wrap items-center gap-2 sm:gap-3 max-w-[calc(100vw-360px)] select-none"
        }
      >
        {items.map((item) => {
          const isBeingDragged = dragState?.isDragging && dragState.item.id === item.id;
          const isTarget = hoverTargetId === item.id;

          if (item.type === "folder") {
            return (
              <div
                key={item.id}
                data-desktop-item-id={item.id}
                onPointerDown={(e) => handlePointerDown(e, item)}
                onClick={() => handleItemClick(item)}
                className={`relative transition-all duration-200 ${
                  isBeingDragged ? "opacity-30 scale-95" : ""
                }`}
              >
                <DesktopFolderIcon
                  folder={item}
                  onOpen={() => handleItemClick(item)}
                  isCombineTarget={isTarget}
                />
                {isTarget && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#0091ff] text-white text-[9px] font-bold shadow-lg shadow-[#0091ff]/50 animate-bounce pointer-events-none whitespace-nowrap z-20">
                    + Add to Folder
                  </div>
                )}
              </div>
            );
          }

          // Individual App Icon
          const reg = APP_REGISTRY[item.app];
          const Icon = reg?.icon;
          const label = item.app === "activity" && isWin ? "Task Manager" : item.label || reg?.label || item.app;
          const color = item.color || reg?.color || "#38bdf8";

          return (
            <div
              key={item.id}
              data-desktop-item-id={item.id}
              onPointerDown={(e) => handlePointerDown(e, item)}
              onClick={() => handleItemClick(item)}
              className={`relative transition-all duration-200 ${
                isBeingDragged ? "opacity-30 scale-95" : ""
              }`}
            >
              <motion.button
                whileHover={isMobile ? undefined : { scale: 1.07, y: -2 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 450, damping: 22 }}
                className="group flex flex-col items-center gap-1 sm:gap-1.5 w-full max-w-[84px] sm:w-20 py-1.5 sm:py-2 rounded-xl outline-none cursor-pointer select-none touch-pan-y hover:bg-white/5"
              >
                <div
                  className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 border ${
                    isTarget
                      ? "ring-2 ring-[#0091ff] border-[#0091ff] shadow-[0_0_22px_rgba(0,145,255,0.7)] scale-110 bg-[#0091ff]/20"
                      : "bg-[#0c1220]/90 sm:bg-[#0c1220]/75 sm:backdrop-blur-md border-white/15 group-hover:border-white/30 group-hover:bg-[#0c1220]/90 shadow-lg shadow-black/40"
                  }`}
                  style={color ? { boxShadow: `0 0 16px ${color}33` } : undefined}
                >
                  {Icon && (
                    <Icon
                      size={22}
                      className="text-white/90 group-hover:text-white transition-colors sm:scale-105"
                      color={color}
                    />
                  )}
                </div>
                <span
                  className="text-[10px] sm:text-[11px] font-semibold text-white/95 group-hover:text-white text-center leading-tight px-1.5 py-0.5 rounded-md truncate max-w-full tracking-wide transition-colors"
                  style={{
                    textShadow: "0 1px 3px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.85)",
                  }}
                >
                  {label}
                </span>
              </motion.button>

              {/* Target Combine Indicator */}
              {isTarget && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#0091ff] text-white text-[9px] font-bold shadow-lg shadow-[#0091ff]/50 animate-bounce pointer-events-none whitespace-nowrap z-20">
                  + Combine into Folder
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Drag Clone Portal: Follows Cursor / Touch Stroke Smoothly */}
      {dragState?.isDragging &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: `${dragState.currentX - 36}px`,
              top: `${dragState.currentY - 36}px`,
              pointerEvents: "none",
              zIndex: 99999,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1.15, opacity: 0.95, rotate: 3 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="flex flex-col items-center gap-1 bg-[#0c1220]/90 border border-[#0091ff] rounded-2xl p-2 shadow-2xl shadow-black/90 ring-2 ring-[#0091ff]/60"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                {dragState.item.type === "app" ? (
                  (() => {
                    const reg = APP_REGISTRY[dragState.item.app];
                    const Icon = reg?.icon;
                    return Icon ? (
                      <Icon size={24} color={dragState.item.color || reg?.color} />
                    ) : null;
                  })()
                ) : (
                  <span className="text-xs font-bold text-white">Folder</span>
                )}
              </div>
              <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded bg-black/60 shadow-xs">
                {dragState.item.type === "app" ? dragState.item.label : dragState.item.name}
              </span>
              <span className="text-[8px] font-semibold text-[#38bdf8] uppercase tracking-wider">
                Release to Combine
              </span>
            </motion.div>
          </div>,
          document.body
        )}
    </>
  );
}
