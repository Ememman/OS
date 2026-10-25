import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { API_URL } from "../../lib/config";
import CalendarWidget from "./CalendarWidget";

const TAG_COLOR = { fix: "#D98A4E", feature: "#5FBF7C", launch: "#8E7BE0" };

export default function AgendaWidget() {
  const [items, setItems] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const today = new Date();

  useEffect(() => {
    fetch(`${API_URL}/api/updates`)
      .then((r) => r.json())
      .then((data) => setItems(data.slice(0, 3)))
      .catch(() => setItems([]));
  }, []);

  return (
    // This wrapper reserves a stable slot in the widget stack that never
    // changes size, whether collapsed or expanded — the calendar popover
    // below is positioned relative to *this*, not to a guessed screen
    // coordinate, so it always opens exactly where the card actually is
    // instead of jumping to some other part of the screen.
    <div className="relative shrink-0 w-full md:w-56">
      <button
        onClick={() => setExpanded((e) => !e)}
        className={`glass rounded-2xl px-4 py-3.5 shadow-xl w-full h-36 text-left flex flex-col hover:border-white/25 transition group ${
          expanded ? "opacity-0 pointer-events-none" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider accent font-semibold">
            {today.toLocaleDateString([], { weekday: "long" })}
          </div>
          <ChevronDown size={13} className="text-white/30 group-hover:text-white/60 transition" />
        </div>
        <div className="text-[28px] font-display font-bold leading-none mt-0.5 mb-2">{today.getDate()}</div>
        <div className="space-y-1.5 min-w-0">
          {items.length === 0 && <div className="text-[11px] text-white/40">No updates yet.</div>}
          {items.map((u) => (
            <div key={u.id} className="flex items-start gap-1.5 text-[11px] text-white/75 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ background: TAG_COLOR[u.tag] || "#8892A6" }} />
              <span className="line-clamp-1">{u.title}</span>
            </div>
          ))}
        </div>
      </button>

      {expanded && (
        <div className="absolute top-0 right-0 z-[850]">
          <CalendarWidget onBack={() => setExpanded(false)} />
        </div>
      )}
    </div>
  );
}
