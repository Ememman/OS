import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GIconClose,
  GIconChevronLeft,
  GIconChevronRight,
  GIconDownload,
  GIconCopy,
  GIconCheck,
  GIconSliders,
  GIconGallery,
} from "../icons/GravityIcons";
import { galleryItems, type GalleryItem } from "../../data/gallery";
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

  const tags = useMemo(() => ["All", ...new Set(galleryItems.map((g) => g.tag))], []);
  const counts = useMemo(() => {
    return tags.reduce((acc: Record<string, number>, t) => {
      acc[t] = t === "All" ? galleryItems.length : galleryItems.filter((g) => g.tag === t).length;
      return acc;
    }, {});
  }, [tags]);

  const shown = useMemo(() => {
    return tag === "All" ? galleryItems : galleryItems.filter((g) => g.tag === tag);
  }, [tag]);

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

  const currentItem: GalleryItem | null = openIdx !== null ? shown[openIdx] : null;

  const handleCopyLink = () => {
    if (!currentItem) return;
    if (systemSounds) soundFx.playPop();
    if (currentItem.src) {
      navigator.clipboard?.writeText(window.location.origin + currentItem.src);
      notify("Copied to Clipboard", "Image link copied to clipboard.", "success");
    } else {
      navigator.clipboard?.writeText(
        `${currentItem.caption} — ${currentItem.status || "Currently on Development"}`
      );
      notify("Copied to Clipboard", "Project status summary copied to clipboard.", "success");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentItem || !currentItem.src) return;
    if (systemSounds) soundFx.playPop();
    const a = document.createElement("a");
    a.href = currentItem.src;
    a.download = `gallery-${currentItem.id}.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    notify("Downloading Image", `Saving "${currentItem.caption}" to Downloads.`, "update", 2500);
  };

  const currentFilterStyle = PHOTO_FILTERS.find((f) => f.id === activeFilter)?.style || "none";

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-white select-none overflow-hidden">
      {/* Sticky Gallery Header & Filter Pills */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 p-3 sm:p-4 border-b border-white/10 bg-[#0c0d14]/95 backdrop-blur-md sticky top-0 z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <GIconGallery size={16} />
          </div>
          <div>
            <h2 className="font-display text-sm sm:text-base font-semibold text-white">Media Gallery</h2>
            <p className="text-[10px] sm:text-[11px] text-white/50">Verified system screenshots & architecture media</p>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => {
                if (systemSounds) soundFx.playClick();
                setTag(t);
              }}
              className={`text-[11px] px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition shrink-0 cursor-pointer whitespace-nowrap ${
                tag === t
                  ? "bg-accent border-accent text-white font-semibold shadow-sm shadow-accent/20"
                  : "border-white/15 text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{t}</span>
              <span className="opacity-60 text-[10px]">{counts[t]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-y-auto thin-scroll p-3.5 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {shown.map((g, i) => {
            const isPlaceholder = g.type === "placeholder" || !g.src;
            const isEnhancement = g.status?.toLowerCase().includes("enhancement");

            if (isPlaceholder) {
              return (
                <motion.button
                  key={g.id}
                  whileHover={{ y: -4, scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  onClick={() => {
                    if (systemSounds) soundFx.playClick();
                    setOpenIdx(i);
                  }}
                  className={`relative rounded-2xl overflow-hidden group block w-full border transition-all cursor-pointer text-left shadow-lg ${
                    isEnhancement
                      ? "border-amber-500/30 bg-gradient-to-br from-[#1c130b] via-[#120d08] to-[#18110b] hover:border-amber-500/50 hover:shadow-amber-500/10"
                      : "border-white/10 bg-gradient-to-br from-[#0c101c] via-[#090c15] to-[#101424] hover:border-accent/40 hover:shadow-accent/10"
                  }`}
                >
                  <div className="relative aspect-[16/10] p-4 flex flex-col justify-between overflow-hidden">
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:14px_14px]" />

                    {/* Top Header: Tag on Left, Status Pill on Right */}
                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-black/60 backdrop-blur-md border border-white/15 text-white/90 shrink-0">
                        {g.tag}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border inline-flex items-center gap-1 shrink-0 whitespace-nowrap ${
                          isEnhancement
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/35"
                            : "bg-sky-500/20 text-sky-300 border-sky-500/35"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isEnhancement ? "bg-amber-400" : "bg-sky-400"
                          } animate-pulse`}
                        />
                        {g.status || "Currently on Development"}
                      </span>
                    </div>

                    {/* Center Content: Status Badge + Title + Description */}
                    <div className="relative z-10 my-auto py-1.5">
                      {g.statusBadge && (
                        <div className="mb-1">
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[9px] font-mono font-medium inline-block">
                            {g.statusBadge}
                          </span>
                        </div>
                      )}
                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-accent transition-colors line-clamp-1 mb-1">
                        {g.caption}
                      </h3>
                      <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                        {g.description}
                      </p>
                    </div>

                    {/* Bottom Notice */}
                    <div className="relative z-10 flex items-center justify-between text-[10px] text-white/40 pt-1.5 border-t border-white/5">
                      <span>{isEnhancement ? "Enhancement cycle active" : "Asset preparation underway"}</span>
                      <span className="text-accent group-hover:underline">Inspect →</span>
                    </div>
                  </div>
                </motion.button>
              );
            }

            return (
              <motion.button
                key={g.id}
                whileHover={{ y: -4, scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                onClick={() => {
                  if (systemSounds) soundFx.playClick();
                  setOpenIdx(i);
                }}
                className="relative rounded-2xl overflow-hidden group block w-full border border-white/10 hover:border-accent/50 transition-all cursor-pointer bg-slate-900/90 shadow-lg text-left"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                  <img
                    src={g.src}
                    alt={g.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 block"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-black/60 backdrop-blur-md border border-white/15 text-white">
                    {g.tag}
                  </span>

                  <div className="absolute bottom-2.5 left-3 right-3 pointer-events-none">
                    <span className="text-xs font-bold text-white group-hover:text-accent transition-colors line-clamp-1">
                      {g.caption}
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
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
              {/* Photo Filter Pills (Only visible when image exists) */}
              {currentItem.src ? (
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
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-white/50 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span>Project Status Inspector</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                {currentItem.src && (
                  <button
                    onClick={() => setZoomLevel((z) => (z === 1 ? 1.5 : z === 1.5 ? 2 : 1))}
                    className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white/80 transition font-mono cursor-pointer"
                    title="Toggle Zoom"
                  >
                    {zoomLevel}x
                  </button>
                )}
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
                  title="Copy Details"
                >
                  {copied ? <GIconCheck size={14} className="text-emerald-400" /> : <GIconCopy size={14} />}
                </button>
                {currentItem.src && (
                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
                    title="Download"
                  >
                    <GIconDownload size={14} />
                  </button>
                )}
                <button
                  onClick={close}
                  className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition ml-1 cursor-pointer"
                  aria-label="Close"
                >
                  <GIconClose size={16} />
                </button>
              </div>
            </div>

            {/* Center Image or Status Inspector with Nav Buttons */}
            <div className="relative w-full max-w-4xl flex-1 flex items-center justify-center my-2 overflow-hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-1 sm:left-3 w-10 h-10 aspect-square shrink-0 flex items-center justify-center hover:bg-white/20 active:scale-90 rounded-full z-10 text-white/85 transition bg-black/40 backdrop-blur-sm cursor-pointer"
                aria-label="Previous"
              >
                <GIconChevronLeft size={20} />
              </button>

              <div
                onClick={(e) => e.stopPropagation()}
                className="max-h-[70vh] w-full flex items-center justify-center overflow-auto px-4"
              >
                {currentItem.src ? (
                  <img
                    src={currentItem.src}
                    alt={currentItem.caption}
                    style={{
                      filter: currentFilterStyle,
                      transform: `scale(${zoomLevel})`,
                      transition: "transform 250ms ease, filter 250ms ease",
                    }}
                    className="rounded-2xl max-h-[68vh] object-contain mx-auto shadow-2xl cursor-zoom-in"
                    onClick={() => setZoomLevel((z) => (z === 1 ? 1.5 : z === 1.5 ? 2 : 1))}
                  />
                ) : (
                  <div className="rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-white/15 bg-gradient-to-br from-[#0c0f18] via-[#090c14] to-[#121624] shadow-2xl text-center space-y-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-2 ${
                          currentItem.status?.toLowerCase().includes("enhancement")
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-sky-500/20 text-sky-300 border-sky-500/40"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            currentItem.status?.toLowerCase().includes("enhancement")
                              ? "bg-amber-400"
                              : "bg-sky-400"
                          } animate-pulse`}
                        />
                        {currentItem.status || "Currently on Development"}
                      </span>
                      {currentItem.statusBadge && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/35 text-xs font-mono font-medium">
                          {currentItem.statusBadge}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-display text-base sm:text-lg font-bold text-white">
                        {currentItem.caption}
                      </h3>
                      <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
                        {currentItem.description}
                      </p>
                    </div>

                    <div className="pt-2">
                      <span className="text-[11px] px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-white/50 font-mono">
                        Category: {currentItem.tag}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-1 sm:right-3 w-10 h-10 aspect-square shrink-0 flex items-center justify-center hover:bg-white/20 active:scale-90 rounded-full z-10 text-white/85 transition bg-black/40 backdrop-blur-sm cursor-pointer"
                aria-label="Next"
              >
                <GIconChevronRight size={20} />
              </button>
            </div>

            {/* Bottom Caption & Controls */}
            <div className="text-center z-10" onClick={(e) => e.stopPropagation()}>
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
