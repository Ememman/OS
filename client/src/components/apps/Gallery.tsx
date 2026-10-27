import { useEffect, useState, useCallback } from "react";
import {
  GIconClose,
  GIconChevronLeft,
  GIconChevronRight,
  GIconPlay,
} from "../icons/GravityIcons";
import { galleryItems } from "../../data/gallery";

export default function Gallery() {
  const [tag, setTag] = useState("All");
  const [openIdx, setOpenIdx] = useState(null);
  const tags = ["All", ...new Set(galleryItems.map((g) => g.tag))];
  const counts = tags.reduce((acc, t) => {
    acc[t] = t === "All" ? galleryItems.length : galleryItems.filter((g) => g.tag === t).length;
    return acc;
  }, {});
  const shown = tag === "All" ? galleryItems : galleryItems.filter((g) => g.tag === tag);

  const go = useCallback((delta) => setOpenIdx((i) => (i + delta + shown.length) % shown.length), [shown.length]);
  const close = useCallback(() => setOpenIdx(null), []);

  useEffect(() => {
    if (openIdx === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIdx, go, close]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold">Gallery</h2>
        <div className="flex gap-1 flex-wrap justify-end">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`text-[11px] px-2 py-1 rounded-full border flex items-center gap-1 ${tag === t ? "bg-accent border-accent" : "border-white/15 text-white/60"}`}
            >
              {t} <span className="opacity-60">{counts[t]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="[column-fill:balance] sm:columns-3 columns-2 gap-2 space-y-2">
        {shown.map((g, i) => (
          <button key={g.id} onClick={() => setOpenIdx(i)} className="relative rounded-lg overflow-hidden group block w-full break-inside-avoid">
            <img
              src={g.type === "video" ? g.poster : g.src}
              alt={g.caption}
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500 block"
            />
            {g.type === "video" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <GIconPlay size={28} className="text-white/90" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to- from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2">
              <span className="text-[10px] text-white">{g.caption}</span>
            </div>
          </button>
        ))}
      </div>

      {openIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 sm:p-8" onClick={close}>
          <button onClick={(e) => { e.stopPropagation(); close(); }} className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 hover:bg-white/10 rounded-full z-10 text-white" aria-label="Close">
            <GIconClose size={18} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-1 sm:left-4 p-1.5 sm:p-2 hover:bg-white/10 rounded-full z-10 text-white" aria-label="Previous">
            <GIconChevronLeft size={22} />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="max-w-2xl w-full">
            {shown[openIdx].type === "video" ? (
              <video
                src={shown[openIdx].src}
                poster={shown[openIdx].poster}
                controls
                autoPlay
                muted
                className="rounded-xl max-h-[70vh] w-full object-contain mx-auto bg-black"
              />
            ) : (
              <img src={shown[openIdx].src} alt="" className="rounded-xl max-h-[70vh] object-contain mx-auto" />
            )}
            <p className="text-center text-sm text-white/70 mt-3">{shown[openIdx].caption} · <span className="accent">{shown[openIdx].tag}</span></p>
            <p className="text-center text-[10px] text-white/30 mt-1">{openIdx + 1} / {shown.length} · ← → to navigate, Esc to close</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-1 sm:right-4 p-1.5 sm:p-2 hover:bg-white/10 rounded-full z-10 text-white" aria-label="Next">
            <GIconChevronRight size={22} />
          </button>
        </div>
      )}
    </div>
  );
}
