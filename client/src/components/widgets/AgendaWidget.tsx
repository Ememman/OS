import { useEffect, useState } from "react";
import { GIconChevronDown } from "../icons/GravityIcons";
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
    <div className="relative shrink-0 w-full max-w-[280px] sm:max-w-none md:w-56 mx-auto transition-all">
      {expanded ? (
        <div className="w-full">
          <CalendarWidget onBack={() => setExpanded(false)} />
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="glass rounded-2xl px-4 py-3.5 shadow-xl w-full h-36 text-left flex flex-col hover:border-white/25 transition group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider accent font-semibold">
              {today.toLocaleDateString([], { weekday: "long" })}
            </div>
            <GIconChevronDown size={13} className="text-white/30 group-hover:text-white/60 transition" />
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
      )}
    </div>
  );
}
