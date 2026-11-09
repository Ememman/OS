import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GIconClose,
  GIconChevronLeft,
  GIconChevronRight,
  GIconPlay,
  GIconDownload,
  GIconCopy,
  GIconCheck,
  GIconSliders,
} from "../icons/GravityIcons";
import { galleryItems } from "../../data/gallery";
import { soundFx } from "../../lib/soundFx";
import { useOS } from "../../store/useOS";

const PHOTO_FILTERS = [
  { id: "normal", label: "Normal", style: "none" },
  { id: "noir", label: "Noir", style: "grayscale(100%) contrast(125%)" },
  { id: "amber", label: "Amber", style: "sepia(50%) saturate(140%) hue-rotate(-15deg)" },
  { id: "cyber", label: "Cyber", style: "hue-rotate(260deg) saturate(170%) contrast(115%)" },
  { id: "vivid", label: "Vivid", style: "saturate(160%) contrast(115%)" },
];

export default function Gallery() {
  const { systemSounds, notify } = useOS();
  const [tag, setTag] = useState("All");
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState("normal");
  const [zoomLevel, setZoomLevel] = useState<1 | 1.5 | 2>(1);
  const [copied, setCopied] = useState(false);

  const tags = ["All", ...new Set(galleryItems.map((g) => g.tag))];
  const counts = tags.reduce((acc: Record<string, number>, t) => {
    acc[t] = t === "All" ? galleryItems.length : galleryItems.filter((g) => g.tag === t).length;
    return acc;
  }, {});
  const shown = tag === "All" ? galleryItems : galleryItems.filter((g) => g.tag === tag);

  const go = useCallback(
    (delta: number) => {
      if (systemSounds) soundFx.playClick();
      setZoomLevel(1);
      setOpenIdx((i) => (i === null ? 0 : (i + delta + shown.length) % shown.length));
    },
    [shown.length, systemSounds]
  );

  const close = useCallback(() => {
    if (systemSounds) soundFx.playClose();
    setOpenIdx(null);
    setZoomLevel(1);
  }, [systemSounds]);

  useEffect(() => {
    if (openIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIdx, go, close]);

  const currentItem = openIdx !== null ? shown[openIdx] : null;

  const handleCopyLink = () => {
    if (!currentItem) return;
    if (systemSounds) soundFx.playPop();
    navigator.clipboard?.writeText(window.location.origin + currentItem.src);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentItem) return;
    if (systemSounds) soundFx.playPop();
    const a = document.createElement("a");
    a.href = currentItem.src;
    a.download = `gallery-${currentItem.id}.jpg`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    notify("Downloading Image", `Saving "${currentItem.caption}" to Downloads.`, "update", 2500);
  };

  const currentFilterStyle = PHOTO_FILTERS.find((f) => f.id === activeFilter)?.style || "none";

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-white select-none">
      {/* Sticky Gallery Header & Filter Pills */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 p-3 sm:p-4 border-b border-white/10 bg-[#0a0a0f]/95 backdrop-blur-md sticky top-0 z-20 shrink-0 shadow-sm">
        <div>
          <h2 className="font-display text-base sm:text-lg font-semibold text-white">Gallery</h2>
          <p className="text-[10px] sm:text-[11px] text-white/50">Curated showcase and media library</p>
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => {
                if (systemSounds) soundFx.playClick();
                setTag(t);
              }}
              className={`text-[11px] px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition shrink-0 cursor-pointer whitespace-nowrap ${
                tag === t
                  ? "bg-accent border-accent text-white shadow-sm shadow-accent/20"
                  : "border-white/15 text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{t}</span>
              <span className="opacity-60 text-[10px]">{counts[t]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Masonry / Grid Container */}
      <div className="flex-1 overflow-y-auto thin-scroll p-3 sm:p-4 [column-fill:balance] sm:columns-3 columns-2 gap-2 space-y-2">
        {shown.map((g, i) => (
          <motion.button
            key={g.id}
            whileHover={{ y: -4, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            onClick={() => {
              if (systemSounds) soundFx.playClick();
              setOpenIdx(i);
            }}
            className="relative rounded-xl overflow-hidden group block w-full break-inside-avoid border border-white/5 hover:border-accent/40 transition-colors cursor-pointer bg-slate-900/80 min-h-[140px]"
          >
            <img
              src={g.type === "video" ? g.poster : g.src}
              alt={g.caption}
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500 block"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            {g.type === "video" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <GIconPlay size={32} className="text-white/90 drop-shadow" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2.5">
              <span className="text-[11px] text-white font-medium line-clamp-1">{g.caption}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Expanded Lightbox Modal */}
      <AnimatePresence>
        {currentItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6"
            onClick={close}
          >
          {/* Top Bar Controls */}
          <div
            className="w-full max-w-4xl flex items-center justify-between z-10 pb-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl backdrop-blur-md overflow-x-auto no-scrollbar">
              <GIconSliders size={13} className="text-accent ml-1.5 mr-0.5 shrink-0" />
              {PHOTO_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    if (systemSounds) soundFx.playClick();
                    setActiveFilter(f.id);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-lg transition ${
                    activeFilter === f.id
                      ? "bg-accent text-white font-semibold"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              {currentItem.type !== "video" && (
                <button
                  onClick={() => setZoomLevel((z) => (z === 1 ? 1.5 : z === 1.5 ? 2 : 1))}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white/80 transition font-mono"
                  title="Toggle Zoom"
                >
                  {zoomLevel}x
                </button>
              )}
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
                title="Copy Image URL"
              >
                {copied ? <GIconCheck size={14} className="text-emerald-400" /> : <GIconCopy size={14} />}
              </button>
              <button
                onClick={handleDownload}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
                title="Download"
              >
                <GIconDownload size={14} />
              </button>
              <button
                onClick={close}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition ml-1"
                aria-label="Close"
              >
                <GIconClose size={16} />
              </button>
            </div>
          </div>

          {/* Center Image/Video with Nav Buttons */}
          <div className="relative w-full max-w-4xl flex-1 flex items-center justify-center my-2 overflow-hidden">
            <button
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              className="absolute left-1 sm:left-3 w-10 h-10 aspect-square shrink-0 flex items-center justify-center hover:bg-white/20 active:scale-90 rounded-full z-10 text-white/85 transition bg-black/40 backdrop-blur-sm"
              aria-label="Previous"
            >
              <GIconChevronLeft size={20} />
            </button>

            <div
              onClick={(e) => e.stopPropagation()}
              className="max-h-[70vh] flex items-center justify-center overflow-auto"
            >
              {currentItem.type === "video" ? (
                <video
                  src={currentItem.src}
                  poster={currentItem.poster}
                  controls
                  autoPlay
                  muted
                  className="rounded-2xl max-h-[68vh] w-full object-contain mx-auto bg-black shadow-2xl"
                  style={{ filter: currentFilterStyle }}
                />
              ) : (
                <img
                  src={currentItem.src}
                  alt={currentItem.caption}
                  style={{
                    filter: currentFilterStyle,
                    transform: `scale(${zoomLevel})`,
                    transition: "transform 250ms ease, filter 250ms ease"
                  }}
                  className="rounded-2xl max-h-[68vh] object-contain mx-auto shadow-2xl cursor-zoom-in"
                  onClick={() => setZoomLevel((z) => (z === 1 ? 1.5 : z === 1.5 ? 2 : 1))}
                />
              )}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); go(1); }}
              className="absolute right-1 sm:right-3 w-10 h-10 aspect-square shrink-0 flex items-center justify-center hover:bg-white/20 active:scale-90 rounded-full z-10 text-white/85 transition bg-black/40 backdrop-blur-sm"
              aria-label="Next"
            >
              <GIconChevronRight size={20} />
            </button>
          </div>

          {/* Bottom Caption & Controls */}
          <div
            className="text-center z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs sm:text-sm text-white/90 font-medium">
              {currentItem.caption} · <span className="text-accent">{currentItem.tag}</span>
            </p>
            <p className="text-[10px] text-white/40 mt-0.5 font-mono">
              {(openIdx ?? 0) + 1} of {shown.length} · Arrow keys to navigate · Esc to close
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
}
