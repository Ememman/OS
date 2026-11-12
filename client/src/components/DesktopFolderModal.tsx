import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDesktopStore } from "../store/useDesktopStore";
import { useOS } from "../store/useOS";
import { APP_REGISTRY, type DesktopFolderItem } from "../types/desktop";
import {
  GIconClose,
  GIconPencil,
  GIconPlus,
  GIconTrash,
  GIconFolder,
} from "./icons/GravityIcons";

export default function DesktopFolderModal() {
  const {
    items,
    activeFolderId,
    closeFolder,
    renameFolder,
    removeAppFromFolder,
    ungroupFolder,
    addAppToFolder,
  } = useDesktopStore();
  const { openApp } = useOS();

  const folder = items.find(
    (it) => it.id === activeFolderId && it.type === "folder"
  ) as DesktopFolderItem | undefined;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [folderTitle, setFolderTitle] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

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
        {/* Backdrop closes folder */}
        <div className="absolute inset-0" onClick={closeFolder} />

        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 12 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="relative w-full max-w-sm sm:max-w-md bg-[#0a0f1d]/95 border border-white/20 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-2xl z-10 flex flex-col"
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

          {/* Grid of Apps in Folder */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 py-3 max-h-[50vh] overflow-y-auto thin-scroll justify-items-center">
            {folder.apps.map((a) => {
              const reg = APP_REGISTRY[a.app];
              const Icon = reg?.icon;
              const appColor = a.color || reg?.color || "#38bdf8";

              return (
                <div key={a.id || a.app} className="relative group/app flex flex-col items-center gap-1.5 w-18 sm:w-20">
                  <motion.button
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      openApp(a.app);
                      closeFolder();
                    }}
                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border border-white/20 hover:border-white/40 bg-black/40 hover:bg-black/60 shadow-lg shadow-black/40 transition-all cursor-pointer relative"
                    style={{
                      boxShadow: `0 4px 16px ${appColor}33`,
                    }}
                    title={`Open ${a.label}`}
                  >
                    {Icon && <Icon size={26} color={appColor} />}
                  </motion.button>

                  {/* Extract / Move out button */}
                  <button
                    onClick={() => removeAppFromFolder(folder.id, a.id)}
                    className="opacity-0 group-hover/app:opacity-100 absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500/90 text-white text-[10px] flex items-center justify-center shadow-md hover:bg-rose-600 transition cursor-pointer"
                    title="Move back to desktop"
                  >
                    ✕
                  </button>

                  <span className="text-[11px] font-medium text-white/90 text-center leading-tight truncate w-full">
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
                className="px-4 py-1.5 rounded-xl bg-accent hover:brightness-110 active:scale-95 text-white font-medium shadow-md shadow-accent/25 transition cursor-pointer text-[11px]"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
