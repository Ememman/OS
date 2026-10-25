import { useOS } from "../../store/useOS";
import {
  GIconLibrary,
  GIconMusic,
  GIconTerminal,
  GIconChats,
} from "../icons/GravityIcons";

const TILES = [
  { app: "terminal", label: "Open Terminal", icon: GIconTerminal, from: "#16a34a", to: "#15803d" },
  { app: "library", label: "Browse Projects", icon: GIconLibrary, from: "#f5a642", to: "#d9822c" },
  { app: "music", label: "Play Music", icon: GIconMusic, from: "#d9678c", to: "#b8496b" },
  { app: "chats", label: "Say Hi", icon: GIconChats, from: "#8e7be0", to: "#6a58c2" }
];

export default function ShortcutTiles() {
  const openApp = useOS((s) => s.openApp);

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full md:w-56 h-36 shrink-0">
      {TILES.map((t) => (
        <button
          key={t.app}
          onClick={() => openApp(t.app)}
          className="rounded-xl px-3 py-2.5 flex flex-col justify-between shadow-lg text-left hover:brightness-110 active:scale-95 transition-all group"
          style={{ background: `linear-gradient(160deg, ${t.from}, ${t.to})` }}
        >
          <t.icon size={18} className="text-white/90 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] text-white font-medium leading-tight">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
