import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDesktopStore } from "../store/useDesktopStore";
import { useOS } from "../store/useOS";
import { APP_REGISTRY, type DesktopAppItem, type DesktopFolderItem } from "../types/desktop";
import { soundFx } from "../lib/soundFx";
import {
  GIconClose,
  GIconPencil,
  GIconPlus,
  GIconTrash,
  GIconFolder,
} from "./icons/GravityIcons";

interface ModalDragState {
  app: DesktopAppItem;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isOutsideModal: boolean;
  isDragging: boolean;
}

export default function DesktopFolderModal() {
  const {
    items,
    activeFolderId,
    closeFolder,
    renameFolder,
    removeAppFromFolder,
    extractAppFromFolder,
    ungroupFolder,
    addAppToFolder,
  } = useDesktopStore();
  const { openApp, notify, getAppBadge, openAppContextMenu } = useOS();

  const folder = items.find(
    (it) => it.id === activeFolderId && it.type === "folder"
  ) as DesktopFolderItem | undefined;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [folderTitle, setFolderTitle] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalCardRef = useRef<HTMLDivElement>(null);

  // Drag-out state
  const [dragState, setDragState] = useState<ModalDragState | null>(null);
  const dragStateRef = useRef<ModalDragState | null>(null);
  const activeAppRef = useRef<DesktopAppItem | null>(null);
  const startPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const didDragRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    if (folder) {
      setFolderTitle(folder.name);
    }
  }, [folder]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
    if (!activeAppRef.current) return;

    const dist = Math.hypot(
      e.clientX - startPointerRef.current.x,
      e.clientY - startPointerRef.current.y
    );

    if (!didDragRef.current) {
      if (dist > 6) {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        didDragRef.current = true;
        soundFx.playClick();
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(20);
        }
      } else {
        return;
      }
    }

    if (e.cancelable) {
      e.preventDefault();
    }

    // Determine whether cursor is outside the modal boundary
    let isOutside = true;
    if (modalCardRef.current) {
      const rect = modalCardRef.current.getBoundingClientRect();
      const margin = 12;
      isOutside =
        e.clientX < rect.left - margin ||
        e.clientX > rect.right + margin ||
        e.clientY < rect.top - margin ||
        e.clientY > rect.bottom + margin;
    }

    setDragState({
      app: activeAppRef.current,
      startX: startPointerRef.current.x,
      startY: startPointerRef.current.y,
      currentX: e.clientX,
      currentY: e.clientY,
      isOutsideModal: isOutside,
      isDragging: true,
    });
  }, []);

  const handleGlobalPointerUp = useCallback(
    (e: PointerEvent) => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerUp);

      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }

      const draggedApp = activeAppRef.current;
      const wasDragging = didDragRef.current;
      const curDrag = dragStateRef.current;

      setDragState(null);
      activeAppRef.current = null;

      setTimeout(() => {
        didDragRef.current = false;
      }, 80);

      // Successfully dragged OUT of the folder modal onto the desktop!
      if (wasDragging && draggedApp && curDrag?.isOutsideModal && folder) {
        const dropX = Math.max(16, Math.min(window.innerWidth - 88, e.clientX - 36));
        const dropY = Math.max(44, Math.min(window.innerHeight - 88, e.clientY - 36));

        extractAppFromFolder(folder.id, draggedApp.id, { x: dropX, y: dropY });
        closeFolder();
        soundFx.playPop();
        notify(
          "Extracted to Desktop",
          `${draggedApp.label} was moved out of ${folder.name} onto the Desktop.`,
          "success"
        );
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(30);
        }
      }
    },
    [folder, extractAppFromFolder, closeFolder, notify, handleGlobalPointerMove]
  );

  const handleAppPointerDown = (e: React.PointerEvent, app: DesktopAppItem) => {
    if (e.button !== 0) return;
    activeAppRef.current = app;
    startPointerRef.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;

    if (e.pointerType === "touch") {
      holdTimerRef.current = setTimeout(() => {
        didDragRef.current = true;
        soundFx.playClick();
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(20);
        }
      }, 140);
    }

    window.addEventListener("pointermove", handleGlobalPointerMove, { passive: false });
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerUp);
  };

  if (!folder) return null;

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    renameFolder(folder.id, folderTitle.trim() || "Featured");
  };

  const availableAppsToAdd = Object.keys(APP_REGISTRY).filter(
    (key) => !folder.apps.some((a) => a.app === key)
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
        {/* Backdrop closes folder when clicked */}
        <div
          className={`absolute inset-0 transition-colors ${
            dragState?.isDragging && dragState.isOutsideModal
              ? "bg-[#0091ff]/15 ring-4 ring-inset ring-[#0091ff]/50"
              : ""
          }`}
          onClick={() => {
            if (!didDragRef.current) closeFolder();
          }}
        />

        {/* Drag-out hint overlay banner */}
        {dragState?.isDragging && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[#0b101c]/90 border border-white/20 text-white font-semibold text-xs shadow-2xl backdrop-blur-2xl z-[1250] pointer-events-none flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                dragState.isOutsideModal
                  ? "bg-emerald-400 animate-ping"
                  : "bg-amber-400 animate-pulse"
              }`}
            />
            <span>
              {dragState.isOutsideModal
                ? `Release to place ${dragState.app.label} on Desktop`
                : "Drag outside folder boundary to extract"}
            </span>
          </div>
        )}

        <motion.div
          ref={modalCardRef}
          initial={{ opacity: 0, scale: 0.88, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 12 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="relative w-full max-w-sm sm:max-w-md bg-[#0a0f1d]/95 border border-white/20 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-2xl z-10 flex flex-col select-none"
        >
          {/* Header with Editable Folder Name */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/80 shrink-0">
                <GIconFolder size={16} />
              </div>

              {isEditingTitle ? (
                <div className="focus-stroke flex-1 flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 focus-within:border-[#0091ff] focus-within:ring-2 focus-within:ring-[#0091ff]/40 focus-within:shadow-[0_0_14px_rgba(0,145,255,0.28)] transition-all">
                  <input
                    ref={titleInputRef}
                    type="text"
                    maxLength={24}
                    value={folderTitle}
                    onChange={(e) => setFolderTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                    className="bg-transparent text-sm sm:text-base font-bold text-white outline-none w-full"
                  />
                  <button
                    type="button"
                    onClick={handleSaveTitle}
                    className="text-xs text-[#0091ff] font-semibold hover:underline"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className="group/title flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded-xl transition cursor-pointer text-left truncate"
                  title="Click to rename folder"
                >
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">
                    {folder.name}
                  </h2>
                  <GIconPencil
                    size={12}
                    className="text-white/40 group-hover/title:text-white transition-colors shrink-0"
                  />
                </button>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={closeFolder}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/70 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
              title="Close folder"
            >
              <GIconClose size={14} />
            </button>
          </div>

          {/* Grid of Apps in Folder with Drag-out capability */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 py-3 max-h-[50vh] overflow-y-auto thin-scroll justify-items-center">
            {folder.apps.map((a) => {
              const reg = APP_REGISTRY[a.app];
              const Icon = reg?.icon;
              const appColor = a.color || reg?.color || "#38bdf8";
              const isBeingDragged =
                dragState?.isDragging && dragState.app.id === a.id;

              return (
                <div
                  key={a.id || a.app}
                  onPointerDown={(e) => handleAppPointerDown(e, a)}
                  className={`relative group/app flex flex-col items-center gap-1.5 w-18 sm:w-20 select-none touch-none cursor-grab active:cursor-grabbing transition-opacity duration-150 ${
                    isBeingDragged ? "opacity-25 scale-90" : "opacity-100"
                  }`}
                >
                  <motion.button
                    whileHover={isBeingDragged ? undefined : { scale: 1.08, y: -2 }}
                    whileTap={isBeingDragged ? undefined : { scale: 0.94 }}
                    onClick={() => {
                      if (!didDragRef.current) {
                        openApp(a.app);
                        closeFolder();
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openAppContextMenu({
                        app: a.app,
                        x: e.clientX,
                        y: e.clientY,
                        source: "folder",
                        folderId: folder.id,
                        customLabel: a.label,
                        customColor: a.color,
                      });
                    }}
                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border border-white/20 hover:border-white/40 bg-black/40 hover:bg-black/60 shadow-lg shadow-black/40 transition-all cursor-grab active:cursor-grabbing relative"
                    style={{
                      boxShadow: `0 4px 16px ${appColor}33`,
                    }}
                    title={`Drag out to desktop or click to open ${a.label}`}
                  >
                    {Icon && <Icon size={26} color={appColor} />}

                    {(() => {
                      const badge = getAppBadge(a.app);
                      if (!badge || badge.count <= 0) return null;
                      return (
                        <motion.span
                          animate={{ y: [0, -3, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          className={`absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center border-2 border-[#070a12] z-20 pointer-events-none select-none ${
                            badge.type === "chat"
                              ? "bg-rose-500 shadow-md shadow-rose-500/50"
                              : "bg-[#0091ff] shadow-md shadow-[#0091ff]/50"
                          }`}
                        >
                          {badge.count > 99 ? "99+" : badge.count}
                        </motion.span>
                      );
                    })()}
                  </motion.button>

                  {/* Extract / Move out button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAppFromFolder(folder.id, a.id);
                    }}
                    className="opacity-0 group-hover/app:opacity-100 absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500/90 text-white text-[10px] flex items-center justify-center shadow-md hover:bg-rose-600 transition cursor-pointer"
                    title="Extract back to desktop"
                  >
                    ✕
                  </button>

                  <span className="text-[11px] font-medium text-white/90 text-center leading-tight truncate w-full pointer-events-none">
                    {a.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom Actions Bar */}
          <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
            <button
              onClick={() => ungroupFolder(folder.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-white/60 hover:text-rose-400 hover:border-rose-400/40 hover:bg-rose-500/10 transition cursor-pointer text-[11px]"
              title="Ungroup all apps back to desktop"
            >
              <GIconTrash size={12} />
              <span>Ungroup</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Add App Menu */}
              {availableAppsToAdd.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer text-[11px]"
                  >
                    <GIconPlus size={12} />
                    <span>Add App</span>
                  </button>

                  {showAddMenu && (
                    <div className="absolute right-0 bottom-full mb-2 w-48 max-h-52 overflow-y-auto thin-scroll bg-[#0c1220] border border-white/20 rounded-2xl p-1.5 shadow-2xl z-20">
                      <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-white/40">
                        Available Apps
                      </div>
                      {availableAppsToAdd.map((appKey) => {
                        const reg = APP_REGISTRY[appKey];
                        const Icon = reg?.icon;
                        return (
                          <button
                            key={appKey}
                            onClick={() => {
                              addAppToFolder(folder.id, appKey);
                              setShowAddMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 text-white text-xs text-left transition cursor-pointer"
                          >
                            {Icon && <Icon size={14} color={reg?.color} />}
                            <span className="truncate">{reg?.label || appKey}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={closeFolder}
                className="px-4 py-1.5 rounded-xl bg-accent hover:brightness-110 active:scale-95 text-accent-contrast font-medium shadow-md shadow-accent/25 transition cursor-pointer text-[11px]"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Drag Clone: Follows cursor when user drags an app out of the group */}
      {dragState?.isDragging &&
        typeof document !== "undefined" &&
        createPortal(
          <div
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 0.98 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className={`flex flex-col items-center gap-1.5 bg-[#0a0f1d]/95 border rounded-2xl p-2.5 shadow-2xl shadow-black/95 backdrop-blur-2xl transition-all duration-150 ${
                dragState.isOutsideModal
                  ? "border-[#0091ff] ring-2 ring-[#0091ff]/70 shadow-[0_0_24px_rgba(0,145,255,0.7)]"
                  : "border-white/30"
              }`}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/20 shadow-md"
                style={{
                  backgroundColor: dragState.app.color
                    ? `${dragState.app.color}25`
                    : "rgba(255,255,255,0.1)",
                }}
              >
                {(() => {
                  const reg = APP_REGISTRY[dragState.app.app];
                  const Icon = reg?.icon;
                  return Icon ? (
                    <Icon size={24} color={dragState.app.color || reg?.color} />
                  ) : null;
                })()}
              </div>
              <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded bg-black/60 shadow-xs">
                {dragState.app.label}
              </span>
              <span
                className={`text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  dragState.isOutsideModal
                    ? "text-[#60a5fa] bg-[#0091ff]/20 animate-pulse"
                    : "text-white/60 bg-white/10"
                }`}
              >
                {dragState.isOutsideModal
                  ? "📍 Drop to place on Desktop"
                  : "Drag outside folder"}
              </span>
            </motion.div>
          </div>,
          document.body
        )}
    </AnimatePresence>
  );
}
