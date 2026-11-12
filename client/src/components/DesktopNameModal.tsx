import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDesktopStore } from "../store/useDesktopStore";
import { GIconFolder, GIconCheck, GIconClose } from "./icons/GravityIcons";

const SUGGESTIONS = ["Featured", "Productivity", "Games", "Dev Tools", "Utilities", "Favorites"];

export default function DesktopNameModal() {
  const { namingModal, renameFolder, closeNamingModal } = useDesktopStore();
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (namingModal?.isOpen) {
      setName(namingModal.initialName || "Featured");
      // Auto-focus and select all text after open
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [namingModal]);

  if (!namingModal?.isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = name.trim() || "Featured";
    renameFolder(namingModal.folderId, finalName);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1300] bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
        {/* Backdrop click dismisses and saves current name */}
        <div className="absolute inset-0" onClick={handleSubmit} />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
          className="relative w-full max-w-sm rounded-3xl bg-[#0c1220]/95 border border-white/20 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
                <GIconFolder size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Name Component / Folder</h3>
                <p className="text-[10px] text-white/50">Combined desktop application container</p>
              </div>
            </div>
            <button
              onClick={closeNamingModal}
              className="w-7 h-7 rounded-lg hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <GIconClose size={14} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input with Global Active Focus Stroke */}
            <div>
              <label className="block text-[11px] font-medium text-white/70 mb-1.5">
                Component Name
              </label>
              <div className="focus-stroke flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 transition-all focus-within:border-[#0091ff] focus-within:ring-2 focus-within:ring-[#0091ff]/40 focus-within:shadow-[0_0_14px_rgba(0,145,255,0.28)]">
                <GIconFolder size={14} className="text-white/40 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  maxLength={24}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Featured, Work, Games"
                  className="bg-transparent outline-none text-xs text-white placeholder:text-white/35 w-full font-medium"
                />
              </div>
            </div>

            {/* Quick Suggestions */}
            <div>
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-white/40 mb-1.5">
                Quick Suggestions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setName(sug)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer border ${
                      name === sug
                        ? "bg-[#0091ff]/20 border-[#0091ff] text-white font-medium"
                        : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeNamingModal}
                className="px-3 py-1.5 rounded-xl border border-white/10 text-xs text-white/60 hover:text-white transition cursor-pointer"
              >
                Keep Default
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-accent hover:brightness-110 active:scale-95 text-xs text-white font-medium shadow-md shadow-accent/25 transition flex items-center gap-1.5 cursor-pointer"
              >
                <GIconCheck size={13} />
                <span>Save Name</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
