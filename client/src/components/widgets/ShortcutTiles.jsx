import { Library, Music2, FileUser, MessageCircle } from "lucide-react";
import { useOS } from "../../store/useOS";

const TILES = [
  { app: "library", label: "Browse Projects", icon: Library, from: "#f5a642", to: "#d9822c" },
  { app: "music", label: "Play Music", icon: Music2, from: "#d9678c", to: "#b8496b" },
  { app: "resume", label: "View Resume", icon: FileUser, from: "#57b8d9", to: "#357fa3" },
  { app: "chats", label: "Say Hi", icon: MessageCircle, from: "#8e7be0", to: "#6a58c2" }
];

export default function ShortcutTiles() {
  const openApp = useOS((s) => s.openApp);

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full md:w-56 h-36 shrink-0">
      {TILES.map((t) => (
        <button
          key={t.app}
          onClick={() => openApp(t.app)}
          className="rounded-xl px-3 py-2.5 flex flex-col justify-between shadow-lg text-left hover:brightness-110 transition"
          style={{ background: `linear-gradient(160deg, ${t.from}, ${t.to})` }}
        >
          <t.icon size={16} className="text-white/90" />
          <span className="text-[11px] text-white font-medium leading-tight">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
