import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOS } from "../store/useOS";
import { APP_REGISTRY } from "../types/desktop";
import { soundFx } from "../lib/soundFx";
import {
  GIconClose,
  GIconChrome,
  GIconSafari,
  GIconSquare,
  GIconFolder,
  GIconShield,
  GIconTrash,
  GIconCircleInfo,
} from "./icons/GravityIcons";

export default function AppPropertiesModal() {
  const { appPropertiesModal, closeAppProperties, openApp, osMode, notify, systemSounds } = useOS();
  const [activeTab, setActiveTab] = useState<"general" | "shortcut" | "details" | "storage">("general");
  const [readOnly, setReadOnly] = useState(false);
  const [hiddenAttr, setHiddenAttr] = useState(false);

  if (!appPropertiesModal) return null;

  const { app, label: propLabel, isFolder } = appPropertiesModal;
  const isWin = osMode === "win";

  const reg = APP_REGISTRY[app];
  const AppIcon = isFolder
    ? GIconFolder
    : app === "browser"
      ? isWin
        ? GIconChrome
        : GIconSafari
      : reg?.icon || GIconSquare;

  const appLabel =
    propLabel ||
    (isFolder
      ? "Folder"
      : app === "activity" && isWin
        ? "Task Manager"
        : app === "browser" && isWin
          ? "Google Chrome"
          : reg?.label || app);

  const appColor = app === "browser" && isWin ? "#4285F4" : reg?.color || "#38bdf8";

  const handleClearCache = () => {
    if (systemSounds) soundFx.playPop();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.toLowerCase().includes(app.toLowerCase())) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      notify("Cache Cleared", `Application cache and storage for ${appLabel} reset.`, "success", 2500);
    } catch {
      notify("Clear Cache", `Cache cleared successfully.`, "info", 2000);
    }
  };

  const handleLaunch = () => {
    if (systemSounds) soundFx.playClick();
    openApp(app);
    closeAppProperties();
  };

  const handleApply = () => {
    if (systemSounds) soundFx.playPop();
    notify("Properties Applied", `Updated attributes for ${appLabel}.`, "success", 2000);
  };

  const handleOk = () => {
    if (systemSounds) soundFx.playClick();
    closeAppProperties();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1400] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 select-none">
        <div className="absolute inset-0" onClick={closeAppProperties} />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
          className={`relative w-full max-w-md max-h-[88vh] flex flex-col shadow-2xl z-10 overflow-hidden ${
            isWin
              ? "rounded-2xl bg-[#1b2230]/98 border border-white/15 text-white/90 shadow-[0_24px_70px_rgba(0,0,0,0.85)] font-sans"
              : "rounded-3xl bg-[#1e2029]/95 border border-white/20 text-white/95 shadow-[0_28px_80px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
          }`}
        >
          {/* Header Titlebar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0 bg-white/5">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-5 h-5 rounded flex items-center justify-center shrink-0 border border-white/15"
                style={{ backgroundColor: `${appColor}22` }}
              >
                <AppIcon size={12} color={appColor} />
              </div>
              <span className="text-xs font-semibold text-white truncate">
                {appLabel} {isWin ? "Properties" : "Info"}
              </span>
            </div>
            <button
              onClick={closeAppProperties}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <GIconClose size={13} />
            </button>
          </div>

          {/* Windows / macOS Tab Headers */}
          <div className="flex items-center gap-1 px-4 pt-2 border-b border-white/10 bg-black/20 shrink-0 overflow-x-auto no-scrollbar">
            {[
              { id: "general", label: "General" },
              { id: "shortcut", label: isWin ? "Shortcut" : "Details" },
              { id: "details", label: isWin ? "Compatibility" : "Security" },
              { id: "storage", label: "App Data & Reset" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors cursor-pointer border-b-2 ${
                  activeTab === t.id
                    ? "border-accent text-white bg-white/10"
                    : "border-transparent text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Modal Tab Body */}
          <div className="p-4 sm:p-5 overflow-y-auto thin-scroll flex-1 space-y-4 text-xs">
            {activeTab === "general" && (
              <>
                <div className="flex items-center gap-4 pb-3 border-b border-white/10">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-md"
                    style={{ backgroundColor: `${appColor}28` }}
                  >
                    <AppIcon size={30} color={appColor} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-white truncate">{appLabel}</div>
                    <div className="text-[11px] text-white/50">
                      {isFolder ? "File Folder" : isWin ? "Application (.exe)" : "macOS Application Bundle (.app)"}
                    </div>
                    <div className="text-[10px] text-white/40 mt-0.5 truncate">{reg?.desc || "Portfolio OS Application"}</div>
                  </div>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/50">Type of file:</span>
                    <span className="text-white/90 font-mono">
                      {isFolder ? "Folder" : isWin ? "Executable Application (.exe)" : "Application (.app)"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/50">Description:</span>
                    <span className="text-white/90 truncate max-w-[240px]">{reg?.desc || "System Utility"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/50">Location:</span>
                    <span className="text-white/90 font-mono text-[10px] truncate max-w-[240px]">
                      {isWin ? `C:\\PortfolioOS\\System32\\apps\\${app}.exe` : `/Applications/${app}.app`}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/50">Size on disk:</span>
                    <span className="text-white/90 font-mono">48.2 KB (49,356 bytes)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/50">Build Date:</span>
                    <span className="text-white/90 font-mono">Nov 24, 2026, 9:28 AM</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/50">Publisher:</span>
                    <span className="text-white/90 font-semibold">James Mendoza (EmanExe)</span>
                  </div>
                </div>

                {/* Attributes Checkboxes */}
                <div className="pt-2">
                  <div className="text-[10px] uppercase font-semibold text-white/40 tracking-wider mb-2">Attributes</div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-white/80 hover:text-white">
                      <input
                        type="checkbox"
                        checked={readOnly}
                        onChange={(e) => setReadOnly(e.target.checked)}
                        className="rounded border-white/20 accent-accent cursor-pointer"
                      />
                      <span>Read-only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-white/80 hover:text-white">
                      <input
                        type="checkbox"
                        checked={hiddenAttr}
                        onChange={(e) => setHiddenAttr(e.target.checked)}
                        className="rounded border-white/20 accent-accent cursor-pointer"
                      />
                      <span>Hidden</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {activeTab === "shortcut" && (
              <div className="space-y-2.5 text-[11px]">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Target type:</span>
                  <span className="text-white/90">Application</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Target location:</span>
                  <span className="text-white/90 font-mono text-[10px]">System32\apps</span>
                </div>
                <div className="space-y-1">
                  <span className="text-white/50 block">Target path:</span>
                  <input
                    readOnly
                    value={isWin ? `"C:\\PortfolioOS\\apps\\${app}.exe"` : `"/Applications/${app}.app"`}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] font-mono text-white/90 outline-none"
                  />
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Run window:</span>
                  <span className="text-white/90">Normal window</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Shortcut key:</span>
                  <span className="text-white/90 font-mono">None</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Comment:</span>
                  <span className="text-white/90">Verified built-in Portfolio OS application</span>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      openApp("files");
                      closeAppProperties();
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-white text-xs text-center cursor-pointer"
                  >
                    Open File Location
                  </button>
                </div>
              </div>
            )}

            {activeTab === "details" && (
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 mb-2">
                  <GIconShield size={16} className="shrink-0" />
                  <span>Microsoft Defender / Gatekeeper: Verified Authentic and Safe</span>
                </div>

                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">File version:</span>
                  <span className="text-white/90 font-mono">2.4.0.104</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Product name:</span>
                  <span className="text-white/90">Portfolio OS Desktop Environment</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Product version:</span>
                  <span className="text-white/90 font-mono">2.4.0</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Copyright:</span>
                  <span className="text-white/90">© 2026 James Mendoza. All rights reserved.</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Architecture:</span>
                  <span className="text-white/90 font-mono">x64 / ARM64 Universal WebAssembly</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Language:</span>
                  <span className="text-white/90">English (United States)</span>
                </div>
              </div>
            )}

            {activeTab === "storage" && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <GIconCircleInfo size={14} className="text-accent" />
                    <span>Application Cache & Storage</span>
                  </div>
                  <p className="text-white/60 text-[11px] leading-relaxed">
                    Clear local storage buffers, session history, and cached preferences for this application without
                    affecting your global desktop settings.
                  </p>
                  <button
                    onClick={handleClearCache}
                    className="w-full mt-2 py-2 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold"
                  >
                    <GIconTrash size={13} />
                    <span>Clear App Cache & Data</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Direct Launch</div>
                    <div className="text-[10px] text-white/50">Start application now</div>
                  </div>
                  <button
                    onClick={handleLaunch}
                    className="py-1.5 px-3.5 rounded-lg bg-accent text-accent-contrast font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-sm shadow-accent/25"
                  >
                    Launch App
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10 bg-black/25 shrink-0">
            <button
              onClick={handleOk}
              className="px-4 py-1.5 rounded-lg bg-accent text-accent-contrast text-xs font-semibold hover:opacity-90 transition cursor-pointer shadow-sm shadow-accent/20"
            >
              OK
            </button>
            <button
              onClick={closeAppProperties}
              className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs border border-white/10 transition cursor-pointer"
            >
              Apply
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
