import { useState, useMemo, useEffect } from "react";
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
  GIconPlus,
  GIconSearch,
  GIconTrash,
  GIconClose,
} from "../icons/GravityIcons";
import { fileTree, type FolderNode, type FileItem } from "../../data/files";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";

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

function resolvePath(path: string[], customFiles: FileItem[]): FolderNode {
  let node = fileTree;
  for (const seg of path) {
    const child = node.children.find((c) => c.name === seg);
    if (!child || child.type !== "folder") return fileTree;
    node = child;
  }
  if (path.length === 0) {
    return {
      ...node,
      children: [...node.children, ...customFiles]
    };
  }
  return node;
}

function Icon({ item }: { item: any }) {
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
  return <GIconFileText size={item._size || 30} className={item.isCustom ? "text-accent" : "text-white/70"} />;
}

export default function Files() {
  const { openApp, systemSounds, notify } = useOS();
  const [path, setPath] = useState<string[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [openText, setOpenText] = useState<FileItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [creatingFile, setCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileContent, setNewFileContent] = useState("");

  const [customFiles, setCustomFiles] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("os_custom_files");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("os_custom_files", JSON.stringify(customFiles));
  }, [customFiles]);

  const node = useMemo(() => resolvePath(path, customFiles), [path, customFiles]);
  const allItems = node.children || [];

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const q = searchQuery.toLowerCase();
    return allItems.filter((i) => i.name.toLowerCase().includes(q));
  }, [allItems, searchQuery]);

  const openItem = (item: any) => {
    if (systemSounds) soundFx.playClick();
    if (item.type === "folder") {
      setPath((p) => [...p, item.name]);
    } else if (item.type === "app-link") {
      openApp(item.app);
    } else if (item.type === "text") {
      setOpenText(item);
    }
  };

  const goFavorite = (fav: any) => {
    if (systemSounds) soundFx.playClick();
    setPath(fav.path);
    if (fav.target) {
      const resolved = resolvePath(fav.path, customFiles);
      const target = resolved.children?.find((c) => c.name === fav.target);
      if (target) setOpenText(target);
    }
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newFileName.trim();
    if (!cleanName) return;

    const formattedName = cleanName.endsWith(".txt") ? cleanName : `${cleanName}.txt`;
    const newFile = {
      name: formattedName,
      type: "text",
      content: newFileContent || "# " + formattedName + "\n\nCreated on " + new Date().toLocaleDateString(),
      isCustom: true,
      size: `${Math.max(1, Math.round((newFileContent.length || 20) / 1024 * 10) / 10)} KB`
    };

    setCustomFiles((prev) => [newFile, ...prev]);
    setCreatingFile(false);
    setNewFileName("");
    setNewFileContent("");
    if (systemSounds) soundFx.playPop();
    notify("File Created", `Created "${formattedName}" successfully.`);
  };

  const handleDeleteCustomFile = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (systemSounds) soundFx.playClose();
    setCustomFiles((prev) => prev.filter((f) => f.name !== name));
    if (openText?.name === name) setOpenText(null);
    notify("File Removed", `Deleted "${name}".`);
  };

  return (
    <div className="flex h-full bg-black/40 text-white select-none">
      {/* Sidebar */}
      <div className="w-24 sm:w-44 border-r border-white/10 p-2 sm:p-3 shrink-0 flex flex-col justify-between bg-white/[0.02]">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-white/40 mb-2 flex items-center gap-1">
            <GIconStar size={11} /> Favorites
          </div>
          <div className="space-y-0.5">
            {FAVORITES.map((f) => (
              <button
                key={f.label}
                onClick={() => goFavorite(f)}
                className="w-full flex items-center gap-2 text-left text-xs px-2 py-1.5 rounded-lg hover:bg-white/8 text-white/75 hover:text-white transition"
              >
                <GIconHardDrive size={13} className="text-white/40 shrink-0" />
                <span className="truncate">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Create new document button */}
        <button
          onClick={() => setCreatingFile(true)}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 text-xs font-medium transition"
        >
          <GIconPlus size={13} />
          <span className="hidden sm:inline">New File</span>
        </button>
      </div>

      {/* Main File Browser Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navigation & Controls Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 shrink-0 gap-2 bg-white/5">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-xs text-white/60 min-w-0 overflow-hidden">
            <button onClick={() => setPath([])} className="hover:text-white shrink-0 font-medium">Root</button>
            {path.map((seg, i) => (
              <span key={i} className="flex items-center gap-1 shrink-0">
                <GIconChevronRight size={11} className="text-white/30" />
                <button onClick={() => setPath(path.slice(0, i + 1))} className="hover:text-white truncate">{seg}</button>
              </span>
            ))}
          </div>

          {/* Search bar & View Toggles */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
              <GIconSearch size={12} className="text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter files..."
                className="bg-transparent text-xs text-white placeholder:text-white/30 outline-none w-20 sm:w-28"
              />
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => setView("grid")}
                title="Grid View"
                className={`p-1.5 rounded-lg ${view === "grid" ? "bg-white/15 text-white" : "hover:bg-white/8 text-white/50"}`}
              >
                <GIconLayoutCells size={13} />
              </button>
              <button
                onClick={() => setView("list")}
                title="List View"
                className={`p-1.5 rounded-lg ${view === "list" ? "bg-white/15 text-white" : "hover:bg-white/8 text-white/50"}`}
              >
                <GIconList size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Files Content */}
        <div className="flex-1 overflow-auto thin-scroll p-4">
          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-white/35">
              <p>No items found in this directory.</p>
            </div>
          )}

          {view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
              {filteredItems.map((item: any) => (
                <div
                  key={item.name}
                  onDoubleClick={() => openItem(item)}
                  onClick={(e) => e.detail === 2 && openItem(item)}
                  className="group relative flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/8 border border-transparent hover:border-white/10 text-center transition cursor-pointer"
                  title="Double-click to open"
                >
                  <Icon item={item} />
                  <span className="text-[11px] text-white/85 leading-tight break-all line-clamp-2">{item.name}</span>
                  {item.isCustom && (
                    <button
                      onClick={(e) => handleDeleteCustomFile(item.name, e)}
                      title="Delete file"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/30 text-rose-300 transition"
                    >
                      <GIconTrash size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredItems.map((item: any) => (
                <div
                  key={item.name}
                  onDoubleClick={() => openItem(item)}
                  onClick={(e) => e.detail === 2 && openItem(item)}
                  className="group w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/8 text-left transition cursor-pointer border border-transparent hover:border-white/5"
                >
                  <Icon item={{ ...item, _size: 18 }} />
                  <span className="text-xs text-white/85 flex-1 truncate font-medium">{item.name}</span>
                  <span className="text-[10px] text-white/35">
                    {item.type === "folder" ? "Folder" : item.type === "app-link" ? "Shortcut" : "Text Doc"}
                  </span>
                  {item.isCustom && (
                    <button
                      onClick={(e) => handleDeleteCustomFile(item.name, e)}
                      title="Delete file"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/30 text-rose-300 transition"
                    >
                      <GIconTrash size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer status bar */}
        <div className="border-t border-white/10 px-3 py-1.5 text-[10px] text-white/40 flex items-center justify-between bg-white/[0.02]">
          <span>{filteredItems.length} items</span>
          <span>Virtual FS · Local Storage Synced</span>
        </div>
      </div>

      {/* New File Creation Modal */}
      {creatingFile && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-sm w-full p-4 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-sm font-semibold text-white">Create New Text File</h4>
              <button onClick={() => setCreatingFile(false)} className="text-white/60 hover:text-white">
                <GIconClose size={14} />
              </button>
            </div>
            <form onSubmit={handleCreateFile} className="space-y-3">
              <input
                type="text"
                required
                autoFocus
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="filename.txt"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-accent"
              />
              <textarea
                rows={4}
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                placeholder="Initial text content or notes..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-accent resize-none thin-scroll"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreatingFile(false)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-accent text-xs text-white font-medium shadow-md shadow-accent/20"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Text Viewer Modal */}
      {openText && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setOpenText(null)}
        >
          <div
            className="glass rounded-2xl max-w-lg w-full p-5 border border-white/10 shadow-2xl flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <GIconFileText size={16} className="text-accent" />
                <span className="text-xs font-semibold text-white">{openText.name}</span>
              </div>
              <button onClick={() => setOpenText(null)} className="text-white/60 hover:text-white">
                <GIconClose size={14} />
              </button>
            </div>
            <pre className="text-xs text-white/80 whitespace-pre-wrap font-mono leading-relaxed overflow-y-auto thin-scroll flex-1 p-2 bg-black/20 rounded-xl">
              {openText.content}
            </pre>
            <div className="mt-3 flex justify-between items-center pt-2">
              <span className="text-[10px] text-white/40">Read-Only Viewer</span>
              <button
                onClick={() => setOpenText(null)}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
