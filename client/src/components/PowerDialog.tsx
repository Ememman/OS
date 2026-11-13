import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GIconPower, GIconRotateRight, GIconSliders, GIconMoon, GIconClose } from "./icons/GravityIcons";
import { useOS } from "../store/useOS";
import { useOutsideClick } from "../lib/useOutsideClick";

interface PowerDialogProps {
  onClose: () => void;
}

export default function PowerDialog({ onClose }: PowerDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { powerOff, restart, reopenPicker, setSleeping } = useOS();
  useOutsideClick(ref, onClose);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleAction = (action: () => void) => {
    onClose();
    action();
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto select-none"
        onClick={onClose}
      >
        <motion.div
          ref={ref}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.93, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 12 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="relative bg-[#0d111d] sm:bg-[#0d111d]/98 backdrop-blur-2xl rounded-2xl max-w-sm w-full p-4 sm:p-5 border border-white/20 shadow-[0_24px_80px_rgba(0,0,0,0.85)] text-white space-y-3.5 my-auto origin-center"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <GIconPower size={16} />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-white">Power & Session</h3>
                <p className="text-[11px] text-white/50">Manage system power and desktop style</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <GIconClose size={14} />
            </motion.button>
          </div>

          {/* Options List */}
          <div className="space-y-2">
            {/* Switch OS Style */}
            <motion.button
              whileHover={{ scale: 1.015, x: 2 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 450, damping: 24 }}
              onClick={() => handleAction(reopenPicker)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 hover:border-white/20 transition-colors text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <GIconSliders size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">
                  Switch OS Style
                </div>
                <div className="text-[10px] text-white/50 truncate">
                  Return to macOS / Windows style picker
                </div>
              </div>
            </motion.button>

            {/* Restart System */}
            <motion.button
              whileHover={{ scale: 1.015, x: 2 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 450, damping: 24 }}
              onClick={() => handleAction(restart)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 hover:border-white/20 transition-colors text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <GIconRotateRight size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                  Restart System
                </div>
                <div className="text-[10px] text-white/50 truncate">
                  Reboot and reinitialize clean session
                </div>
              </div>
            </motion.button>

            {/* Sleep / Lock Screen */}
            <motion.button
              whileHover={{ scale: 1.015, x: 2 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 450, damping: 24 }}
              onClick={() => handleAction(() => setSleeping(true))}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 hover:border-white/20 transition-colors text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <GIconMoon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                  Sleep / Lock Screen
                </div>
                <div className="text-[10px] text-white/50 truncate">
                  Dim screen until next click or keypress
                </div>
              </div>
            </motion.button>

            {/* Shut Down */}
            <motion.button
              whileHover={{ scale: 1.015, x: 2 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 450, damping: 24 }}
              onClick={() =>
                handleAction(() => {
                  powerOff();
                  try {
                    window.close();
                  } catch {}
                })
              }
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 hover:border-rose-500/50 transition-colors text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <GIconPower size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-rose-300 group-hover:text-rose-200 transition-colors">
                  Shut Down
                </div>
                <div className="text-[10px] text-rose-300/70 truncate">
                  Halt system processes and turn off display
                </div>
              </div>
            </motion.button>
          </div>

          {/* Cancel Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
