import { useState, useMemo } from "react";
import {
  GIconFolder,
  GIconFileText,
  GIconExternalLink,
  GIconLayoutCells,
  GIconList,
  GIconHardDrive,
  GIconStar,
  GIconChevronRight,
  GIconTerminal,
  GIconNotes,
  GIconCalculator,
} from "../icons/GravityIcons";
import { fileTree, type FolderNode } from "../../data/files";
import { useOS } from "../../store/useOS";

const FAVORITES = [
  { label: "All Files", path: [] },
  { label: "About", path: [], target: "About_Bron.txt" },
  { label: "Skills", path: [], target: "Skills.txt" },
  { label: "Terminal", path: [], target: "Terminal.sh" },
  { label: "Notes", path: [], target: "Notes.app" },
  { label: "Calculator", path: [], target: "Calculator.app" },
  { label: "Projects", path: ["Projects"] },
  { label: "Gallery", path: ["Gallery"] }
];

function resolvePath(path: string[]): FolderNode {
  let node = fileTree;
  for (const seg of path) {
    const child = node.children.find((c) => c.name === seg);
    if (!child || child.type !== "folder") return fileTree;
    node = child;
  }
  return node;
}

function Icon({ item }) {
  if (item.name?.toLowerCase().includes("terminal") || item.app === "terminal") {
    return <GIconTerminal size={item._size || 32} className="text-emerald-400" />;
  }
  if (item.name?.toLowerCase().includes("notes") || item.app === "notes") {
    return <GIconNotes size={item._size || 32} className="text-amber-400" />;
  }
  if (item.name?.toLowerCase().includes("calculator") || item.app === "calculator") {
    return <GIconCalculator size={item._size || 32} className="text-cyan-400" />;
  }
  if (item.type === "folder") return <GIconFolder size={item._size || 34} className="text-sky-300" />;
  if (item.type === "app-link") return <GIconExternalLink size={item._size || 28} className="text-amber-300" />;
  return <GIconFileText size={item._size || 30} className="text-white/70" />;
}

export default function Files() {
  const openApp = useOS((s) => s.openApp);
  const [path, setPath] = useState([]);
  const [view, setView] = useState("grid");
  const [openText, setOpenText] = useState(null);

  const node = useMemo(() => resolvePath(path), [path]);
  const items = node.children || [];

  const openItem = (item) => {
    if (item.type === "folder") {
      setPath((p) => [...p, item.name]);
    } else if (item.type === "app-link") {
      openApp(item.app);
    } else if (item.type === "text") {
      setOpenText(item);
    }
  };

  const goFavorite = (fav) => {
    setPath(fav.target ? fav.path : fav.path);
    if (fav.target) {
      const target = resolvePath(fav.path).children?.find((c) => c.name === fav.target);
      if (target) setOpenText(target);
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-24 sm:w-40 border-r border-white/10 p-2 sm:p-3 shrink-0">
        <div className="text-[10px] uppercase tracking-wide text-white/40 mb-2 flex items-center gap-1">
          <GIconStar size={11} /> Favorites
        </div>
        <div className="space-y-0.5">
          {FAVORITES.map((f) => (
            <button
              key={f.label}
              onClick={() => goFavorite(f)}
              className="w-full flex items-center gap-2 text-left text-xs px-2 py-1.5 rounded-lg hover:bg-white/8 text-white/75"
            >
              <GIconHardDrive size={13} className="text-white/40 shrink-0" />
              <span className="truncate">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-1 text-xs text-white/60 min-w-0 overflow-hidden">
            <button onClick={() => setPath([])} className="hover:text-white shrink-0">Root</button>
            {path.map((seg, i) => (
              <span key={i} className="flex items-center gap-1 shrink-0">
                <GIconChevronRight size={11} />
                <button onClick={() => setPath(path.slice(0, i + 1))} className="hover:text-white truncate">{seg}</button>
              </span>
            ))}
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setView("grid")} title="Grid View" className={`p-1.5 rounded ${view === "grid" ? "bg-white/15" : "hover:bg-white/8"}`}>
              <GIconLayoutCells size={13} />
            </button>
            <button onClick={() => setView("list")} title="List View" className={`p-1.5 rounded ${view === "list" ? "bg-white/15" : "hover:bg-white/8"}`}>
              <GIconList size={13} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto thin-scroll p-4">
          {items.length === 0 && <p className="text-xs text-white/35">This folder is empty.</p>}

          {view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
              {items.map((item) => (
                <button
                  key={item.name}
                  onDoubleClick={() => openItem(item)}
                  onClick={(e) => e.detail === 2 && openItem(item)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/8 text-center"
                  title="Double-click to open"
                >
                  <Icon item={item} />
                  <span className="text-[10px] text-white/80 leading-tight wrpa-break-word line-clamp-2">{item.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-0.5">
              {items.map((item) => (
                <button
                  key={item.name}
                  onDoubleClick={() => openItem(item)}
                  onClick={(e) => e.detail === 2 && openItem(item)}
                  className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/8 text-left"
                >
                  <Icon item={{ ...item, _size: 16 }} />
                  <span className="text-xs text-white/80 flex-1 truncate">{item.name}</span>
                  <span className="text-[10px] text-white/35">{item.type === "folder" ? "Folder" : item.type === "app-link" ? "Shortcut" : "Text"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {openText && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 sm:p-8" onClick={() => setOpenText(null)}>
          <div className="glass rounded-2xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <GIconFileText size={14} className="text-white/60" />
              <span className="text-xs font-medium">{openText.name}</span>
            </div>
            <pre className="text-xs text-white/80 whitespace-pre-wrap font-sans leading-relaxed">{openText.content}</pre>
            <button onClick={() => setOpenText(null)} className="mt-4 text-xs px-3 py-1.5 rounded-lg border border-white/15">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
