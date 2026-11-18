import { useState, useMemo, useEffect, useRef } from "react";
import {
  GIconDownload,
  GIconPrinter,
  GIconFileText,
  GIconShield,
  GIconCopy,
  GIconCheck,
} from "../icons/GravityIcons";
import {
  RESUME_META,
  RESUME_EXPERIENCES,
  RESUME_SKILLS,
  RESUME_ACHIEVEMENTS,
  RESUME_EDUCATION,
  createResumePdfBlob,
  downloadResumePdf,
} from "../../lib/resumePdf";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";

export default function PdfViewer() {
  const { systemSounds, notify } = useOS();
  const [zoom, setZoom] = useState<number>(100);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"document" | "native">("document");
  const [nativeBlobUrl, setNativeBlobUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Generate native vector PDF blob URL for iframe mode
  useEffect(() => {
    let url: string | null = null;
    try {
      const blob = createResumePdfBlob();
      url = URL.createObjectURL(blob);
      setNativeBlobUrl(url);
    } catch (e) {
      console.error("Failed to generate PDF blob URL:", e);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  const handleZoomIn = () => {
    if (systemSounds) soundFx.playClick();
    setZoom((prev) => Math.min(200, prev + 15));
  };

  const handleZoomOut = () => {
    if (systemSounds) soundFx.playClick();
    setZoom((prev) => Math.max(50, prev - 15));
  };

  const handleResetZoom = () => {
    if (systemSounds) soundFx.playClick();
    setZoom(100);
  };

  const handleFitWidth = () => {
    if (systemSounds) soundFx.playClick();
    if (containerRef.current) {
      const availableW = containerRef.current.clientWidth - 48;
      const computedZoom = Math.min(180, Math.max(60, Math.round((availableW / 680) * 100)));
      setZoom(computedZoom);
    }
  };

  const handleDownload = () => {
    if (systemSounds) soundFx.playPop();
    downloadResumePdf("MendozaJamesEmmanuelCV.pdf");
    notify("PDF Downloaded", "MendozaJamesEmmanuelCV.pdf downloaded successfully.", "success", 3000);
  };

  const handlePrint = () => {
    if (systemSounds) soundFx.playClick();
    window.print();
  };

  const handleCopyText = () => {
    const fullText = [
      RESUME_META.fullName,
      `${RESUME_META.location} | ${RESUME_META.phone} | ${RESUME_META.email}`,
      `${RESUME_META.linkedinDisplay} | ${RESUME_META.githubDisplay}`,
      "\nProfessional Experience\n" + "=".repeat(40),
      ...RESUME_EXPERIENCES.map(
        (e) => `${e.company} | ${e.role} (${e.period})\n` + e.bullets.map((b) => `• ${b}`).join("\n")
      ),
      "\nTechnical and Professional Skills\n" + "=".repeat(40),
      ...RESUME_SKILLS.map((s) => `• ${s}`),
      "\nAchievements and Certifications\n" + "=".repeat(40),
      ...RESUME_ACHIEVEMENTS.map((a) => `${a.title} — ${a.date}`),
      "\nEducational Attainment\n" + "=".repeat(40),
      `${RESUME_EDUCATION.degree} | ${RESUME_EDUCATION.school} (${RESUME_EDUCATION.years}) – ${RESUME_EDUCATION.honor}`,
    ].join("\n");

    navigator.clipboard?.writeText(fullText);
    setCopied(true);
    if (systemSounds) soundFx.playPop();
    notify("Copied", "Full CV text copied to clipboard.", "info", 2000);
    setTimeout(() => setCopied(false), 2000);
  };

  const scaleFactor = useMemo(() => zoom / 100, [zoom]);

  return (
    <div className="flex flex-col h-full bg-[#131720] text-white select-none overflow-hidden">
      {/* PDF Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-[#0f131c]/95 backdrop-blur-md shrink-0 gap-2 flex-wrap sm:flex-nowrap">
        {/* Left: Document Info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
            <GIconFileText size={15} />
            <span className="absolute -bottom-1 -right-1 px-0.8 py-0.2 rounded bg-rose-600 text-white font-bold text-[6px] leading-tight uppercase">
              PDF
            </span>
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-semibold text-white truncate" title="MendozaJamesEmmanuelCV.pdf">
              MendozaJamesEmmanuelCV.pdf
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300 shrink-0 font-medium">
              <GIconShield size={9} />
              <span>Read-Only</span>
            </span>
          </div>
        </div>

        {/* Center: Zoom & View Controls */}
        <div className="flex items-center gap-1 shrink-0 mx-auto sm:mx-0">
          <div className="inline-flex items-center h-7.5 bg-white/5 border border-white/10 rounded-xl p-0.5 gap-0.5 shrink-0">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="w-6.5 h-6.5 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer text-xs font-bold"
              title="Zoom Out"
            >
              −
            </button>
            <span
              onClick={handleResetZoom}
              className="px-2 text-[11px] font-mono font-medium text-white/80 hover:text-white cursor-pointer select-none"
              title="Reset Zoom to 100%"
            >
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="w-6.5 h-6.5 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer text-xs font-bold"
              title="Zoom In"
            >
              +
            </button>
          </div>

          <button
            onClick={handleFitWidth}
            className="hidden sm:inline-flex items-center justify-center h-7.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[11px] font-medium transition cursor-pointer"
            title="Fit to Width"
          >
            Fit Width
          </button>

          {/* Engine Mode Switcher */}
          {nativeBlobUrl && (
            <div className="hidden lg:inline-flex items-center h-7.5 bg-white/5 border border-white/10 rounded-xl p-0.5 gap-0.5 shrink-0">
              <button
                onClick={() => setViewMode("document")}
                className={`px-2 h-6.5 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                  viewMode === "document"
                    ? "bg-white/20 text-white shadow-xs"
                    : "text-white/45 hover:text-white hover:bg-white/5"
                }`}
              >
                Document
              </button>
              <button
                onClick={() => setViewMode("native")}
                className={`px-2 h-6.5 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                  viewMode === "native"
                    ? "bg-white/20 text-white shadow-xs"
                    : "text-white/45 hover:text-white hover:bg-white/5"
                }`}
              >
                Native PDF
              </button>
            </div>
          )}
        </div>

        {/* Right: Actions (Copy, Print, Download) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1 h-7.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs transition cursor-pointer"
            title="Copy all text from CV"
          >
            {copied ? <GIconCheck size={12} className="text-emerald-400" /> : <GIconCopy size={12} />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1 h-7.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs transition cursor-pointer"
            title="Print Document"
          >
            <GIconPrinter size={12} />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 h-7.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/25 transition active:scale-95 cursor-pointer"
            title="Download PDF to computer"
          >
            <GIconDownload size={13} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Main PDF Viewport Canvas */}
      <div
        ref={containerRef}
        className="flex-1 bg-[#181b24] p-3 sm:p-6 overflow-auto thin-scroll flex items-start justify-center"
      >
        {viewMode === "native" && nativeBlobUrl ? (
          <iframe
            src={nativeBlobUrl}
            title="MendozaJamesEmmanuelCV.pdf"
            className="w-full h-full rounded-xl border border-white/10 bg-white"
          />
        ) : (
          /* HIGH-FIDELITY VECTOR LETTER PAGE MATCHING EXACT CV SCREENSHOT */
          <div
            style={{
              transform: `scale(${scaleFactor})`,
              transformOrigin: "top center",
              transition: "transform 120ms ease-out",
            }}
            className="w-[660px] min-h-[854px] bg-white text-[#111] p-10 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.65)] ring-1 ring-black/15 my-2 font-serif select-text cursor-auto leading-relaxed print:m-0 print:p-0 print:shadow-none print:w-full print:ring-0"
          >
            {/* Header: Centered Serif */}
            <div className="text-center pb-2">
              <h1 className="text-[20px] font-bold tracking-wide uppercase text-black font-serif">
                {RESUME_META.fullName}
              </h1>
              <div className="text-[11px] text-[#222] mt-1 font-serif tracking-tight">
                <span>{RESUME_META.location}</span>
                <span className="mx-1.5 font-sans text-[#777]">|</span>
                <span>{RESUME_META.phone}</span>
                <span className="mx-1.5 font-sans text-[#777]">|</span>
                <a
                  href={`mailto:${RESUME_META.email}`}
                  className="text-black hover:underline underline-offset-2"
                >
                  {RESUME_META.email}
                </a>
              </div>
              <div className="text-[10px] text-[#333] mt-0.5 font-serif">
                <a
                  href={RESUME_META.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1a3a60] hover:underline"
                >
                  {RESUME_META.linkedinDisplay}
                </a>
                <span className="mx-2 font-sans text-[#777]">|</span>
                <a
                  href={RESUME_META.github}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1a3a60] hover:underline"
                >
                  {RESUME_META.githubDisplay}
                </a>
              </div>
            </div>

            {/* Section 1: Professional Experience */}
            <div className="mt-3">
              <h2 className="text-[12.5px] font-bold text-black font-serif uppercase tracking-tight">
                Professional Experience
              </h2>
              <div className="w-full border-b-[0.75px] border-black my-1" />

              <div className="space-y-3.5 mt-1.5">
                {RESUME_EXPERIENCES.map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex items-baseline justify-between text-[11px] font-serif font-bold text-black">
                      <span>
                        {exp.company} <span className="font-normal font-sans text-[#555]">|</span> {exp.role}
                      </span>
                      <span className="text-[10.5px] font-bold">{exp.period}</span>
                    </div>
                    <ul className="mt-1 space-y-1 text-[10.5px] text-[#111] leading-[1.4] list-disc pl-4 font-serif">
                      {exp.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="pl-0.5">
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Technical and Professional Skills */}
            <div className="mt-4">
              <h2 className="text-[12.5px] font-bold text-black font-serif uppercase tracking-tight">
                Technical and Professional Skills
              </h2>
              <div className="w-full border-b-[0.75px] border-black my-1" />

              <ul className="mt-1.5 space-y-1 text-[10.5px] text-[#111] leading-[1.4] list-disc pl-4 font-serif">
                {RESUME_SKILLS.map((skill, sIdx) => (
                  <li key={sIdx} className="pl-0.5">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 3: Achievements and Certifications */}
            <div className="mt-4">
              <h2 className="text-[12.5px] font-bold text-black font-serif uppercase tracking-tight">
                Achievements and Certifications
              </h2>
              <div className="w-full border-b-[0.75px] border-black my-1" />

              <div className="mt-1.5 space-y-1 text-[10.5px] font-serif">
                {RESUME_ACHIEVEMENTS.map((ach, aIdx) => (
                  <div key={aIdx} className="flex items-center justify-between">
                    <span className="text-black">{ach.title}</span>
                    <span className="text-[#222]">{ach.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Educational Attainment */}
            <div className="mt-4 pb-2">
              <h2 className="text-[12.5px] font-bold text-black font-serif uppercase tracking-tight">
                Educational Attainment
              </h2>
              <div className="w-full border-b-[0.75px] border-black my-1" />

              <div className="mt-1.5 text-[10.5px] font-serif text-black leading-tight">
                <span className="font-bold">{RESUME_EDUCATION.degree}</span>
                <span className="mx-1.5 font-sans text-[#555]">|</span>
                <span>
                  {RESUME_EDUCATION.school} ({RESUME_EDUCATION.years}) –{" "}
                  <span className="font-bold">{RESUME_EDUCATION.honor}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/5 bg-black/40 text-[10.5px] text-white/50 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span>Page 1 of 1</span>
          <span>•</span>
          <span className="hidden xs:inline">Letter (8.5 × 11 in)</span>
          <span>•</span>
          <span>Vector PDF 1.4</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{zoom}%</span>
          <span>•</span>
          <span className="text-amber-400/80 font-mono">Protected File</span>
        </div>
      </div>
    </div>
  );
}
