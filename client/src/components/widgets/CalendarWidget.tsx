import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, ArrowLeft } from "lucide-react";
import { API_URL } from "../../lib/config";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function buildMonth(year, month) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = startDay - 1; i >= 0; i--) cells.push({ d: daysInPrev - i, muted: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, muted: false });
  while (cells.length % 7 !== 0) cells.push({ d: cells.length - (startDay + daysInMonth) + 1, muted: true });
  return cells;
}

export default function CalendarWidget({ onBack }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [eventDays, setEventDays] = useState(new Set());

  useEffect(() => {
    fetch(`${API_URL}/api/updates`)
      .then((r) => r.json())
      .then((data) => {
        const days = new Set(data.map((u) => new Date(u.date).toDateString()));
        setEventDays(days);
      })
      .catch(() => {});
  }, []);

  const cells = buildMonth(cursor.getFullYear(), cursor.getMonth());
  const monthLabel = cursor.toLocaleDateString([], { month: "long", year: "numeric" });

  const shift = (n) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));
  const goToday = () => setCursor(new Date(today.getFullYear(), today.getMonth(), 1));

  const isToday = (d, muted) =>
    !muted && d === today.getDate() && cursor.getMonth() === today.getMonth() && cursor.getFullYear() === today.getFullYear();

  const hasEvent = (d, muted) => {
    if (muted) return false;
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), d);
    return eventDays.has(date.toDateString());
  };

  return (
    <div className="glass rounded-2xl px-4 py-3.5 w-full md:w-56 shadow-xl shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          {onBack && (
            <button onClick={onBack} className="p-1 -ml-1 rounded hover:bg-white/10 transition-colors shrink-0" title="Back">
              <ArrowLeft size={14} className="text-white/60" />
            </button>
          )}
          <CalendarDays size={14} className="accent shrink-0" />
          <span className="text-sm font-medium truncate">{monthLabel}</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => shift(-1)} className="p-1 rounded hover:bg-white/10 transition-colors"><ChevronLeft size={14} /></button>
          <button onClick={goToday} className="text-[10px] px-1.5 py-0.5 rounded hover:bg-white/10 text-white/60 transition-colors whitespace-nowrap">Today</button>
          <button onClick={() => shift(1)} className="p-1 rounded hover:bg-white/10 transition-colors"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-[11px] text-white/50 mb-1.5">
        {DAYS.map((d) => (
          <div key={d} className="text-center py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-2 text-[12px]">
        {cells.map((c, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`w-6 h-6 flex items-center justify-center rounded-full ${
                isToday(c.d, c.muted) ? "bg-accent text-white font-semibold" : c.muted ? "text-white/25" : "text-white/85"
              }`}
            >
              {c.d}
            </div>
            <span className={`w-1 h-1 rounded-full ${hasEvent(c.d, c.muted) ? "bg-accent" : "bg-transparent"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
