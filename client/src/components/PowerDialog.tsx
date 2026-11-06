import { useRef } from "react";
import { GIconPower, GIconRotateRight, GIconSliders, GIconMoon, GIconClose } from "./icons/GravityIcons";
import { useOS } from "../store/useOS";
import { useOutsideClick } from "../lib/useOutsideClick";

interface PowerDialogProps {
  onClose: () => void;
}

export default function PowerDialog({ onClose }: PowerDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { powerOff, restart, reopenPicker, setSleeping, osMode } = useOS();
  useOutsideClick(ref, onClose);

  const handleAction = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <div className="fixed inset-0 z-[2500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        ref={ref}
        className="glass rounded-2xl max-w-sm w-full p-5 border border-white/15 shadow-2xl text-white space-y-4 animate-scaleIn select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
              <GIconPower size={16} />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-white">Power & Session</h3>
              <p className="text-[11px] text-white/50">Manage system power state</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <GIconClose size={14} />
          </button>
        </div>

        {/* Options Grid */}
        <div className="space-y-2">
          {/* Switch OS Style */}
          <button
            onClick={() => handleAction(reopenPicker)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <GIconSliders size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">
                Switch OS Style
              </div>
              <div className="text-[10px] text-white/45 truncate">
                Return to the desktop style selection screen
              </div>
            </div>
          </button>

          {/* Restart */}
          <button
            onClick={() => handleAction(restart)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <GIconRotateRight size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                Restart System
              </div>
              <div className="text-[10px] text-white/45 truncate">
                Reboot Portfolio OS and initialize clean session
              </div>
            </div>
          </button>

          {/* Sleep / Lock */}
          <button
            onClick={() => handleAction(() => setSleeping(true))}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <GIconMoon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                Sleep / Lock Screen
              </div>
              <div className="text-[10px] text-white/45 truncate">
                Dim screen until next click or keypress
              </div>
            </div>
          </button>

          {/* Shut Down */}
          <button
            onClick={() => handleAction(powerOff)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 transition text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <GIconPower size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-rose-300 group-hover:text-rose-200 transition-colors">
                Shut Down
              </div>
              <div className="text-[10px] text-rose-300/60 truncate">
                Halt system processes and turn off display
              </div>
            </div>
          </button>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs font-medium transition cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

