import { useState, useRef, useEffect, useCallback } from "react";
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
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  isOverWidget: boolean;
  hoverTargetId: string | null;
  isDragging: boolean;
}

/**
 * Checks if a given coordinate bounding box overlaps with the widget columns.
 * Works both when widgets are mounted in the DOM and when they are unmounted/hidden.
 */
function checkWidgetZoneCollision(
  x: number,
  y: number,
  width = 80,
  height = 86,
  macDockLeft = false,
  macDockRight = false,
  isWin = false
): boolean {
  if (isWin || typeof window === "undefined") return false;

  // 1. If DOM widgets are currently mounted, check their live bounding rects:
  const widgetElements = document.querySelectorAll("[data-widget-area='true']");
  if (widgetElements.length > 0) {
    const margin = 12;
    for (const el of Array.from(widgetElements)) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (
        x < rect.right + margin &&
        x + width > rect.left - margin &&
        y < rect.bottom + margin &&
        y + height > rect.top - margin
      ) {
        return true;
      }
    }
    return false;
  }

  // 2. If DOM widgets are unmounted (widgets hidden), calculate the reserved widget column zones:
  // Left widget column (Photo, Shortcuts, Notes)
  const leftX = macDockLeft ? 96 : 24;
  const leftW = 210;
  const leftTop = 135;
  const leftBottom = window.innerHeight - 130;
  if (
    x < leftX + leftW &&
    x + width > leftX &&
    y < leftBottom &&
    y + height > leftTop
  ) {
    return true;
  }

  // Right widget column (Weather, Clock, Agenda)
  const rightW = 240;
  const rightX = window.innerWidth - (macDockRight ? 96 : 24) - rightW;
  const rightTop = 40;
  const rightBottom = window.innerHeight - 70;
  if (
    x < rightX + rightW &&
    x + width > rightX &&
    y < rightBottom &&
    y + height > rightTop
  ) {
    return true;
  }

  return false;
}

/**
 * If dropped over a widget when widgets are active, attempts to locate the closest open desktop position.
 */
function findSafePositionNearby(
  x: number,
  y: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  macDockLeft: boolean,
  macDockRight: boolean,
  isWin: boolean
): { x: number; y: number } | null {
  const steps = [
    { dx: 110, dy: 0 },
    { dx: -110, dy: 0 },
    { dx: 0, dy: 104 },
    { dx: 0, dy: -104 },
    { dx: 160, dy: 0 },
    { dx: 220, dy: 0 },
  ];

  for (const step of steps) {
    const testX = Math.max(minX, Math.min(maxX, x + step.dx));
    const testY = Math.max(minY, Math.min(maxY, y + step.dy));
    if (!checkWidgetZoneCollision(testX, testY, 80, 86, macDockLeft, macDockRight, isWin)) {
      return { x: testX, y: testY };
    }
  }
  return null;
}

export default function DesktopAppsGrid({ isMobile }: DesktopAppsGridProps) {
  const { items, combineItems, openFolder, moveItem } = useDesktopStore();
  const { openApp, isWin, dockPosition, widgetsVisible, notify } = useOS();

  const macDockLeft = !isWin && !isMobile && dockPosition === "left";
  const macDockRight = !isWin && !isMobile && dockPosition === "right";

  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  dragStateRef.current = dragState;

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startItemPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const didDragRef = useRef(false);
  const activeItemRef = useRef<DesktopItem | null>(null);
  const rafId = useRef<number | null>(null);
  const cloneRef = useRef<HTMLDivElement | null>(null);

  // Compute default grid slots when an item has no custom coordinates saved
  const getDefaultPosition = useCallback(
    (index: number) => {
      if (typeof window === "undefined") return { x: 28, y: 54 };
      const startX = macDockLeft ? 104 : 28;
      const startY = isWin ? 20 : 54;
      const slotW = 92;
      const slotH = 96;

      // Available horizontal span (avoid right widgets if active)
      const reservedRight = widgetsVisible && !isWin ? 280 : 40;
      const availableWidth = Math.max(slotW * 3, window.innerWidth - startX - reservedRight);
      const maxCols = Math.max(3, Math.floor(availableWidth / slotW));

      const col = index % maxCols;
      const row = Math.floor(index / maxCols);
      return {
        x: startX + col * slotW,
        y: startY + row * slotH,
      };
    },
    [isWin, macDockLeft, widgetsVisible]
  );

  // --------------------------------------------------------------------------------------------------
  // WIDGET TOGGLE REACTIVITY:
  // When widgets are turned ON: Any item occupying the widget zone retreats back to its last position.
  // When widgets are turned OFF: Any item that was in the widget zone returns to take that place.
  // --------------------------------------------------------------------------------------------------
  const prevWidgetsVisibleRef = useRef(widgetsVisible);

  useEffect(() => {
    if (isMobile) return;

    const wasVisible = prevWidgetsVisibleRef.current;
    prevWidgetsVisibleRef.current = widgetsVisible;

    // Transition: OFF -> ON (User clicks to turn widgets ON)
    if (!wasVisible && widgetsVisible) {
      let movedCount = 0;
      const updated = items.map((item, index) => {
        const def = getDefaultPosition(index);
        const curX = typeof item.x === "number" ? item.x : def.x;
        const curY = typeof item.y === "number" ? item.y : def.y;

        const isOver = checkWidgetZoneCollision(curX, curY, 80, 86, macDockLeft, macDockRight, isWin);
        if (isOver) {
          movedCount++;
          // Retreat back to last safe position outside widget space (or default slot)
          const targetX = typeof item.lastSafeX === "number" ? item.lastSafeX : def.x;
          const targetY = typeof item.lastSafeY === "number" ? item.lastSafeY : def.y;
          return {
            ...item,
            x: targetX,
            y: targetY,
            // Preserve the widget space coordinates so it can return when widgets are turned off!
            widgetZoneX: curX,
            widgetZoneY: curY,
          };
        }
        return item;
      });

      if (movedCount > 0) {
        useDesktopStore.setState({ items: updated });
        try {
          localStorage.setItem("portfolio_os_desktop_items_v2", JSON.stringify(updated));
        } catch {}
        soundFx.playPop();
        notify(
          "Widgets Enabled",
          `${movedCount} application${movedCount > 1 ? "s" : ""} moved back to their last position.`,
          "info"
        );
      }
    }

    // Transition: ON -> OFF (User clicks to turn widgets OFF)
    if (wasVisible && !widgetsVisible) {
      let restoredCount = 0;
      const updated = items.map((item) => {
        if (typeof item.widgetZoneX === "number" && typeof item.widgetZoneY === "number") {
          restoredCount++;
          return {
            ...item,
            x: item.widgetZoneX,
            y: item.widgetZoneY,
          };
        }
        return item;
      });

      if (restoredCount > 0) {
        useDesktopStore.setState({ items: updated });
        try {
          localStorage.setItem("portfolio_os_desktop_items_v2", JSON.stringify(updated));
        } catch {}
        soundFx.playClick();
      }
    }
  }, [widgetsVisible, isMobile, items, getDefaultPosition, macDockLeft, macDockRight, isWin, notify]);

  // Clean up timer and animations on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Window bounds calculation
  const getBounds = useCallback(() => {
    if (typeof window === "undefined") {
      return { minX: 16, maxX: 1200, minY: 40, maxY: 800 };
    }
    const minX = macDockLeft ? 96 : 16;
    const maxX = Math.max(minX + 80, window.innerWidth - (macDockRight ? 96 : 24) - 84);
    const minY = isWin ? 16 : 42;
    const maxY = Math.max(minY + 90, window.innerHeight - 88 - 90);
    return { minX, maxX, minY, maxY };
  }, [isWin, macDockLeft, macDockRight]);

  const handlePointerDown = (e: React.PointerEvent, item: DesktopItem, currentPos: { x: number; y: number }) => {
    if (e.button !== 0) return; // Left click / primary touch only

    startPointerRef.current = { x: e.clientX, y: e.clientY };
    startItemPosRef.current = { x: currentPos.x, y: currentPos.y };
    activeItemRef.current = item;
    didDragRef.current = false;

    const isTouch = e.pointerType === "touch";

    // For touch: subtle 190ms hold to preserve smooth page scrolling on mobile
    // For mouse: 0ms delay! Drag starts as soon as mouse moves past threshold!
    if (isTouch) {
      holdTimerRef.current = setTimeout(() => {
        startDragging(e.clientX, e.clientY);
      }, 190);
    }

    // Attach global listeners for continuous, buttery tracking
    window.addEventListener("pointermove", handleGlobalPointerMove, { passive: true });
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerUp);
  };

  const startDragging = (clientX: number, clientY: number) => {
    if (!activeItemRef.current) return;
    didDragRef.current = true;
    soundFx.playClick();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }

    const { minX, maxX, minY, maxY } = getBounds();
    const targetX = Math.max(minX, Math.min(maxX, startItemPosRef.current.x));
    const targetY = Math.max(minY, Math.min(maxY, startItemPosRef.current.y));

    // Only flag over widget if widgets are actively visible
    const isOver = widgetsVisible && !isMobile && checkWidgetZoneCollision(targetX, targetY, 80, 86, macDockLeft, macDockRight, isWin);

    setDragState({
      item: activeItemRef.current,
      originX: startItemPosRef.current.x,
      originY: startItemPosRef.current.y,
      currentX: clientX,
      currentY: clientY,
      targetX,
      targetY,
      isOverWidget: isOver,
      hoverTargetId: null,
      isDragging: true,
    });
  };

  const handleGlobalPointerMove = (e: PointerEvent) => {
    // Check initial movement threshold if dragging hasn't entered active state yet
    if (!didDragRef.current) {
      const dist = Math.hypot(
        e.clientX - startPointerRef.current.x,
        e.clientY - startPointerRef.current.y
      );

      // On desktop mouse: instantly start drag as soon as moved 4px!
      if (dist > 4) {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        startDragging(e.clientX, e.clientY);
      }
      return;
    }

    // Actively dragging: update position smoothly via requestAnimationFrame
    const item = activeItemRef.current;
    if (!item) return;

    const dx = e.clientX - startPointerRef.current.x;
    const dy = e.clientY - startPointerRef.current.y;
    const { minX, maxX, minY, maxY } = getBounds();

    const rawTargetX = startItemPosRef.current.x + dx;
    const rawTargetY = startItemPosRef.current.y + dy;
    const clampedTargetX = Math.max(minX, Math.min(maxX, rawTargetX));
    const clampedTargetY = Math.max(minY, Math.min(maxY, rawTargetY));

    // Hit-test element under cursor (for folder combine)
    const targetEl = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-desktop-item-id]");
    const targetId = targetEl?.getAttribute("data-desktop-item-id") || null;
    const isTargetItem = targetId !== null && targetId !== item.id;

    // Check collision with widget area ONLY if widgets are currently visible!
    const overWidget = widgetsVisible && !isTargetItem && !isMobile && checkWidgetZoneCollision(clampedTargetX, clampedTargetY, 80, 86, macDockLeft, macDockRight, isWin);

    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        setDragState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            currentX: e.clientX,
            currentY: e.clientY,
            targetX: clampedTargetX,
            targetY: clampedTargetY,
            isOverWidget: overWidget,
            hoverTargetId: isTargetItem ? targetId : null,
          };
        });
        rafId.current = null;
      });
    }
  };

  const handleGlobalPointerUp = () => {
    window.removeEventListener("pointermove", handleGlobalPointerMove);
    window.removeEventListener("pointerup", handleGlobalPointerUp);
    window.removeEventListener("pointercancel", handleGlobalPointerUp);

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    const currentDrag = dragStateRef.current;
    const item = activeItemRef.current;

    if (currentDrag?.isDragging && item) {
      // 1. Case: Dropped onto another app/folder -> Combine into Folder
      if (currentDrag.hoverTargetId && currentDrag.hoverTargetId !== item.id) {
        combineItems(item.id, currentDrag.hoverTargetId);
      }
      // 2. Case: Dropped on Desktop (Desktop Mode)
      else if (!isMobile) {
        const { minX, maxX, minY, maxY } = getBounds();
        let finalX = Math.round(currentDrag.targetX / 12) * 12;
        let finalY = Math.round(currentDrag.targetY / 12) * 12;

        if (widgetsVisible) {
          // Widgets ARE visible: cannot place over active widgets
          if (currentDrag.isOverWidget) {
            const safe = findSafePositionNearby(finalX, finalY, minX, maxX, minY, maxY, macDockLeft, macDockRight, isWin);
            if (safe) {
              moveItem(item.id, safe.x, safe.y, {
                lastSafeX: safe.x,
                lastSafeY: safe.y,
                widgetZoneX: null,
                widgetZoneY: null,
              });
              soundFx.playClick();
              notify("Repositioned Safely", "Application positioned alongside the widget area.", "info");
            } else {
              // Revert to origin position
              soundFx.playClose();
              notify("Widget Space Reserved", "Desktop applications cannot be placed over widgets.", "warning");
            }
          } else {
            // Valid placement outside widgets
            moveItem(item.id, finalX, finalY, {
              lastSafeX: finalX,
              lastSafeY: finalY,
              widgetZoneX: null,
              widgetZoneY: null,
            });
            soundFx.playClick();
          }
        } else {
          // Widgets are NOT visible:
          // The application CAN take their place/position!
          const itemIdx = items.findIndex((it) => it.id === item.id);
          const defPos = getDefaultPosition(itemIdx);

          const isInsideWidgetSpace = checkWidgetZoneCollision(finalX, finalY, 80, 86, macDockLeft, macDockRight, isWin);

          // Track last known safe position outside the widget area
          const prevSafeX =
            typeof item.lastSafeX === "number"
              ? item.lastSafeX
              : typeof item.x === "number" && !checkWidgetZoneCollision(item.x, item.y, 80, 86, macDockLeft, macDockRight, isWin)
              ? item.x
              : defPos.x;

          const prevSafeY =
            typeof item.lastSafeY === "number"
              ? item.lastSafeY
              : typeof item.y === "number" && !checkWidgetZoneCollision(item.x, item.y, 80, 86, macDockLeft, macDockRight, isWin)
              ? item.y
              : defPos.y;

          if (isInsideWidgetSpace) {
            // Taking the place/position of the widgets!
            moveItem(item.id, finalX, finalY, {
              widgetZoneX: finalX,
              widgetZoneY: finalY,
              lastSafeX: prevSafeX,
              lastSafeY: prevSafeY,
            });
          } else {
            // Placed outside widget space
            moveItem(item.id, finalX, finalY, {
              lastSafeX: finalX,
              lastSafeY: finalY,
              widgetZoneX: null,
              widgetZoneY: null,
            });
          }
          soundFx.playClick();
        }
      }

      setDragState(null);
      activeItemRef.current = null;

      // Small delay to prevent accidental click handler trigger on drop
      setTimeout(() => {
        didDragRef.current = false;
      }, 60);
      return;
    }

    // Regular click without dragging
    activeItemRef.current = null;
    setDragState(null);
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

  // -------------------------------------------------------------
  // MOBILE / TABLET LAYOUT: Natural Flow / Scrollable Grid View
  // -------------------------------------------------------------
  if (isMobile) {
    return (
      <>
        <div className="grid grid-cols-4 min-[390px]:grid-cols-5 sm:flex sm:flex-wrap items-center justify-items-center gap-2 sm:gap-3 w-full max-w-sm sm:max-w-none select-none pointer-events-auto">
          {items.map((item) => {
            const isBeingDragged = dragState?.isDragging && dragState.item.id === item.id;
            const isTarget = dragState?.hoverTargetId === item.id;

            if (item.type === "folder") {
              return (
                <div
                  key={item.id}
                  data-desktop-item-id={item.id}
                  onPointerDown={(e) => handlePointerDown(e, item, { x: 0, y: 0 })}
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

            const reg = APP_REGISTRY[item.app];
            const Icon = reg?.icon;
            const label = item.app === "activity" && isWin ? "Task Manager" : item.label || reg?.label || item.app;
            const color = item.color || reg?.color || "#38bdf8";

            return (
              <div
                key={item.id}
                data-desktop-item-id={item.id}
                onPointerDown={(e) => handlePointerDown(e, item, { x: 0, y: 0 })}
                onClick={() => handleItemClick(item)}
                className={`relative transition-all duration-200 ${
                  isBeingDragged ? "opacity-30 scale-95" : ""
                }`}
              >
                <button
                  type="button"
                  className="group flex flex-col items-center gap-1 w-full max-w-[84px] py-1.5 rounded-xl outline-none cursor-pointer select-none active:scale-95 transition-transform"
                >
                  <div
                    className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border ${
                      isTarget
                        ? "ring-2 ring-[#0091ff] border-[#0091ff] shadow-[0_0_22px_rgba(0,145,255,0.7)] scale-110 bg-[#0091ff]/20"
                        : "bg-[#0c1220]/90 border-white/15 shadow-lg shadow-black/40"
                    }`}
                    style={color ? { boxShadow: `0 0 16px ${color}33` } : undefined}
                  >
                    {Icon && <Icon size={22} className="text-white/90" color={color} />}
                  </div>
                  <span
                    className="text-[10px] font-semibold text-white/95 text-center leading-tight px-1 truncate max-w-full"
                    style={{ textShadow: "0 1px 3px rgba(0,0,0,0.95)" }}
                  >
                    {label}
                  </span>
                </button>
                {isTarget && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#0091ff] text-white text-[9px] font-bold shadow-lg shadow-[#0091ff]/50 animate-bounce pointer-events-none whitespace-nowrap z-20">
                    + Combine into Folder
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating clone portal on mobile */}
        {renderFloatingClone(dragState, cloneRef)}
      </>
    );
  }

  // -------------------------------------------------------------
  // DESKTOP CANVAS LAYOUT: Full Screen Freeform Positioning!
  // -------------------------------------------------------------
  return (
    <>
      <div className="relative w-full h-full pointer-events-none select-none overflow-hidden">
        {items.map((item, index) => {
          const isBeingDragged = dragState?.isDragging && dragState.item.id === item.id;
          const isTarget = dragState?.hoverTargetId === item.id;

          // Resolve stored coordinates or default layout
          const def = getDefaultPosition(index);
          const currentPos = {
            x: typeof item.x === "number" ? item.x : def.x,
            y: typeof item.y === "number" ? item.y : def.y,
          };

          if (item.type === "folder") {
            return (
              <motion.div
                key={item.id}
                data-desktop-item-id={item.id}
                onPointerDown={(e) => handlePointerDown(e, item, currentPos)}
                onClick={() => handleItemClick(item)}
                initial={false}
                animate={{ x: currentPos.x, y: currentPos.y }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  pointerEvents: "auto",
                }}
                className={`transition-opacity duration-150 cursor-grab active:cursor-grabbing ${
                  isBeingDragged ? "opacity-20 scale-95" : "opacity-100"
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
              </motion.div>
            );
          }

          // Desktop App Item
          const reg = APP_REGISTRY[item.app];
          const Icon = reg?.icon;
          const label = item.app === "activity" && isWin ? "Task Manager" : item.label || reg?.label || item.app;
          const color = item.color || reg?.color || "#38bdf8";

          return (
            <motion.div
              key={item.id}
              data-desktop-item-id={item.id}
              onPointerDown={(e) => handlePointerDown(e, item, currentPos)}
              onClick={() => handleItemClick(item)}
              initial={false}
              animate={{ x: currentPos.x, y: currentPos.y }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                pointerEvents: "auto",
              }}
              className={`transition-opacity duration-150 cursor-grab active:cursor-grabbing ${
                isBeingDragged ? "opacity-20 scale-95" : "opacity-100"
              }`}
            >
              <motion.button
                whileHover={{ scale: 1.07, y: -2 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 450, damping: 22 }}
                className="group flex flex-col items-center gap-1.5 w-20 py-2 rounded-xl outline-none cursor-grab active:cursor-grabbing select-none hover:bg-white/5"
              >
                <div
                  className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 border ${
                    isTarget
                      ? "ring-2 ring-[#0091ff] border-[#0091ff] shadow-[0_0_22px_rgba(0,145,255,0.7)] scale-110 bg-[#0091ff]/20"
                      : "bg-[#0c1220]/75 backdrop-blur-md border-white/15 group-hover:border-white/30 group-hover:bg-[#0c1220]/90 shadow-lg shadow-black/40"
                  }`}
                  style={color ? { boxShadow: `0 0 16px ${color}33` } : undefined}
                >
                  {Icon && (
                    <Icon
                      size={22}
                      className="text-white/90 group-hover:text-white transition-colors scale-105"
                      color={color}
                    />
                  )}
                </div>
                <span
                  className="text-[11px] font-semibold text-white/95 group-hover:text-white text-center leading-tight px-1.5 py-0.5 rounded-md truncate max-w-full tracking-wide transition-colors"
                  style={{
                    textShadow: "0 1px 3px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.85)",
                  }}
                >
                  {label}
                </span>
              </motion.button>

              {isTarget && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#0091ff] text-white text-[9px] font-bold shadow-lg shadow-[#0091ff]/50 animate-bounce pointer-events-none whitespace-nowrap z-20">
                  + Combine into Folder
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Floating Drag Clone: Follows cursor at 60/120fps with target indicators */}
      {renderFloatingClone(dragState, cloneRef)}
    </>
  );
}

/**
 * High-performance hardware-accelerated floating drag clone.
 */
function renderFloatingClone(dragState: DragState | null, ref?: React.RefObject<HTMLDivElement | null>) {
  if (!dragState?.isDragging || typeof document === "undefined") return null;

  const isCombine = Boolean(dragState.hoverTargetId);
  const isBlocked = dragState.isOverWidget;

  let borderColor = "border-[#38bdf8]/60 ring-2 ring-[#38bdf8]/40";
  let statusBadge = (
    <span className="text-[8px] font-semibold text-[#38bdf8] uppercase tracking-wider">
      📍 Place on Desktop
    </span>
  );

  if (isCombine) {
    borderColor = "border-[#0091ff] ring-2 ring-[#0091ff]/70 shadow-[0_0_24px_rgba(0,145,255,0.7)]";
    statusBadge = (
      <span className="text-[8px] font-semibold text-[#60a5fa] uppercase tracking-wider animate-pulse">
        + Release to Combine
      </span>
    );
  } else if (isBlocked) {
    borderColor = "border-rose-500 ring-2 ring-rose-500/60 shadow-[0_0_24px_rgba(244,63,94,0.5)]";
    statusBadge = (
      <span className="text-[8px] font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1">
        ⚠️ Widget Area (Reserved)
      </span>
    );
  }

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: `${dragState.currentX - 38}px`,
        top: `${dragState.currentY - 38}px`,
        pointerEvents: "none",
        zIndex: 99999,
        willChange: "transform",
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1.12, opacity: 0.96 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className={`flex flex-col items-center gap-1 bg-[#0c1220]/95 border rounded-2xl p-2 shadow-2xl shadow-black/90 backdrop-blur-xl ${borderColor}`}
      >
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
          {dragState.item.type === "app" ? (
            (() => {
              const reg = APP_REGISTRY[dragState.item.app];
              const Icon = reg?.icon;
              return Icon ? <Icon size={24} color={dragState.item.color || reg?.color} /> : null;
            })()
          ) : (
            <span className="text-xs font-bold text-white">Folder</span>
          )}
        </div>
        <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded bg-black/60 shadow-xs">
          {dragState.item.type === "app" ? dragState.item.label : dragState.item.name}
        </span>
        {statusBadge}
      </motion.div>
    </div>,
    document.body
  );
}
