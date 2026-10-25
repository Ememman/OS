import { useOS } from "../../store/useOS";
import { GIconExternalLink } from "../icons/GravityIcons";

export default function NoteWidget() {
  const openApp = useOS((s) => s.openApp);

  return (
    <button
      onClick={() => openApp("notes")}
      title="Open Notes"
      className="rounded-2xl px-4 py-3.5 shadow-xl w-full md:w-56 h-36 flex flex-col shrink-0 text-left hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer group"
      style={{ background: "linear-gradient(160deg,#ecc563,#d9a233)" }}
    >
      <div className="flex items-center justify-between w-full mb-1.5">
        <span className="text-[10px] uppercase tracking-wider text-black/55 font-semibold">Note</span>
        <span className="text-[10px] text-black/50 font-medium group-hover:text-black/80 transition-colors flex items-center gap-0.5">
          Expand <GIconExternalLink size={10} />
        </span>
      </div>
      <p className="text-[12px] text-black/85 leading-relaxed">
        Open to freelance and full-time work — mobile, web, or backend. Ping me through Chats or the resume link.
      </p>
    </button>
  );
}
