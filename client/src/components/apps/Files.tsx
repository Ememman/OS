import { useState, useMemo, useEffect, useCallback } from "react";
import {
  GIconFolder,
  GIconFileText,
  GIconExternalLink,
  GIconLayoutCells,
  GIconList,
  GIconHardDrive,
  GIconPin,
  GIconChevronRight,
  GIconTerminal,
  GIconCode,
  GIconNotes,
  GIconCalculator,
  GIconPlus,
  GIconSearch,
  GIconTrash,
  GIconClose,
  GIconDownload,
  GIconRotateRight,
} from "../icons/GravityIcons";
import { fileTree, type FolderNode, type FileItem } from "../../data/files";
import { useOS } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";
import { API_URL } from "../../lib/config";
import { socket } from "../../lib/socket";

interface CloudFile {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  mimeType?: string;
  content: string;
  updatedAt: number;
  readOnly?: boolean;
}

const FAVORITES = [
  { label: "All Files", path: [] },
  { label: "About", path: [], target: "About_Bron.txt" },
  { label: "Skills", path: [], target: "Skills.txt" },
  { label: "Terminal", path: [], target: "Terminal.sh" },
  { label: "Notes", path: [], target: "Notes.app" },
  { label: "CodePlay", path: [], target: "CodePlay.app" },
  { label: "Calculator", path: [], target: "Calculator.app" },
  { label: "Projects", path: ["Projects"] },
  { label: "Games", path: ["Games"] },
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
  if (item.name?.toLowerCase().includes("codeplay") || item.app === "codeplay") {
    return <GIconCode size={item._size || 32} className="text-sky-400" />;
  }
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
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const { openApp, systemSounds, notify } = useOS();
  const [path, setPath] = useState<string[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");

  // Active text preview & editor
  const [openText, setOpenText] = useState<{ id?: string; name: string; content: string; readOnly?: boolean } | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editBuffer, setEditBuffer] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [creatingFile, setCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileContent, setNewFileContent] = useState("");
  const [newFileType, setNewFileType] = useState("text");

  // Cloud & local files state
  const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([]);
  const [storageStats, setStorageStats] = useState<{ totalKb: number; allocatedDriveMb: number; totalFiles: number } | null>(null);
  const [syncingCloud, setSyncingCloud] = useState(false);

  // Fallback local storage for offline state
  const [localCustomFiles, setLocalCustomFiles] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("os_custom_files");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch cloud files from server
  const fetchCloudFiles = useCallback(async () => {
    setSyncingCloud(true);
    try {
      const [filesRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/files`),
        fetch(`${API_URL}/api/files/stats`).catch(() => null)
      ]);
      if (filesRes.ok) {
        const data = await filesRes.json();
        if (data.files && Array.isArray(data.files)) {
          setCloudFiles(data.files);
        }
      }
      if (statsRes && statsRes.ok) {
        const sData = await statsRes.json();
        setStorageStats({
          totalKb: sData.totalKb || 0,
          allocatedDriveMb: sData.allocatedDriveMb || 50,
          totalFiles: sData.totalFiles || 0
        });
      }
    } catch {
      // Offline fallback
    } finally {
      setSyncingCloud(false);
    }
  }, []);

  useEffect(() => {
    fetchCloudFiles();
  }, [fetchCloudFiles]);

  // Real-time socket sync for files
  useEffect(() => {
    const handleFileUpdated = (updated: CloudFile) => {
      setCloudFiles((prev) => {
        const idx = prev.findIndex((f) => f.id === updated.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    };

    const handleFileDeleted = ({ id }: { id: string }) => {
      setCloudFiles((prev) => prev.filter((f) => f.id !== id));
      if (openText?.id === id) {
        setOpenText(null);
      }
    };

    socket.on("files:updated", handleFileUpdated);
    socket.on("files:deleted", handleFileDeleted);

    return () => {
      socket.off("files:updated", handleFileUpdated);
      socket.off("files:deleted", handleFileDeleted);
    };
  }, [openText]);

  // Combine local custom files with server cloud files (prevent duplicate names)
  const combinedCustomFiles = useMemo(() => {
    const map = new Map<string, any>();
    localCustomFiles.forEach((f) => map.set(f.name, f));
    cloudFiles.forEach((cf) => {
      map.set(cf.name, {
        id: cf.id,
        name: cf.name,
        type: "text",
        content: cf.content,
        isCustom: true,
        readOnly: cf.readOnly,
        size: `${Math.max(1, Math.round((cf.size || cf.content?.length || 20) / 1024 * 10) / 10)} KB`
      });
    });
    return Array.from(map.values());
  }, [localCustomFiles, cloudFiles]);

  const node = useMemo(() => resolvePath(path, combinedCustomFiles), [path, combinedCustomFiles]);
  const allItems = useMemo(() => node.children || [], [node]);

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
      setOpenText({
        id: item.id,
        name: item.name,
        content: item.content,
        readOnly: item.readOnly
      });
      setEditBuffer(item.content || "");
      setIsEditingText(false);
    }
  };

  const goFavorite = (fav: any) => {
    if (systemSounds) soundFx.playClick();
    setPath(fav.path);
    setMobileSidebar(false);
    if (fav.target) {
      const resolved = resolvePath(fav.path, combinedCustomFiles);
      const target = resolved.children?.find((c) => c.name === fav.target);
      if (target && target.type === "text") {
        setOpenText({
          id: (target as any).id,
          name: target.name,
          content: target.content,
          readOnly: (target as any).readOnly
        });
        setEditBuffer(target.content || "");
        setIsEditingText(false);
      }
    }
  };

  // Create new file (posts to server and updates local state)
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newFileName.trim();
    if (!cleanName) return;

    let extension = ".txt";
    if (newFileType === "markdown") extension = ".md";
    else if (newFileType === "json") extension = ".json";
    else if (newFileType === "javascript") extension = ".js";

    const formattedName = cleanName.includes(".") ? cleanName : `${cleanName}${extension}`;
    const initialContent = newFileContent || `# ${formattedName}\n\nCreated in Portfolio OS Cloud on ${new Date().toLocaleDateString()}`;

    // Post to server API
    try {
      const res = await fetch(`${API_URL}/api/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formattedName,
          content: initialContent,
          type: newFileType,
          path: "/" + path.join("/")
        })
      });

      if (res.ok) {
        const saved = await res.json();
        if (saved.file) {
          setCloudFiles((prev) => [saved.file, ...prev]);
        }
      }
    } catch {
      // Local fallback
      const localFile = {
        name: formattedName,
        type: "text",
        content: initialContent,
        isCustom: true,
        size: `${Math.max(1, Math.round(initialContent.length / 1024 * 10) / 10)} KB`
      };
      setLocalCustomFiles((prev) => [localFile, ...prev]);
    }

    setCreatingFile(false);
    setNewFileName("");
    setNewFileContent("");
    if (systemSounds) soundFx.playPop();
    notify("File Saved", `"${formattedName}" created and synced to cloud drive.`, "add");
  };

  // Save changes to an existing file
  const handleSaveFileEdit = async () => {
    if (!openText) return;

    if (systemSounds) soundFx.playPop();
    try {
      await fetch(`${API_URL}/api/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: openText.id,
          name: openText.name,
          content: editBuffer,
          type: openText.name.endsWith(".json") ? "json" : openText.name.endsWith(".md") ? "markdown" : "text"
        })
      });
    } catch {
      // Local fallback
    }

    setOpenText({ ...openText, content: editBuffer });
    setIsEditingText(false);
    notify("File Saved", `Changes to "${openText.name}" saved successfully.`, "success");
  };

  // Delete file
  const handleDeleteFile = async (name: string, id?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (systemSounds) soundFx.playClose();

    if (id) {
      try {
        await fetch(`${API_URL}/api/files/${id}`, { method: "DELETE" });
      } catch {
        // fallback
      }
      setCloudFiles((prev) => prev.filter((f) => f.id !== id));
    }

    setLocalCustomFiles((prev) => prev.filter((f) => f.name !== name));
    if (openText?.name === name) setOpenText(null);
    notify("File Removed", `Deleted "${name}" from drive.`, "delete");
  };

  // Download file locally to browser
  const handleDownloadFile = (fileName: string, content: string) => {
    if (systemSounds) soundFx.playClick();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify("Download Started", `Saving "${fileName}" to your local downloads.`, "info");
  };

  return (
    <div className="relative flex h-full bg-black/40 text-white select-none overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebar && (
        <div
          onClick={() => setMobileSidebar(false)}
          className="sm:hidden absolute inset-0 z-20 bg-black/60 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar */}
      <div
        className={`absolute sm:static inset-y-0 left-0 z-30 w-48 sm:w-44 border-r border-white/10 p-2 sm:p-3 shrink-0 flex flex-col justify-between bg-[#0e1017] sm:bg-white/[0.02] transition-transform duration-200 ${
          mobileSidebar ? "translate-x-0 shadow-2xl" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        <div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-white/40 mb-2">
            <span className="flex items-center gap-1 font-semibold">
              <GIconPin size={11} className="text-amber-400" /> Favorites
            </span>
            <button
              onClick={() => setMobileSidebar(false)}
              className="sm:hidden text-white/50 hover:text-white p-0.5"
            >
              <GIconClose size={12} />
            </button>
          </div>
          <div className="space-y-0.5">
            {FAVORITES.map((f) => (
              <button
                key={f.label}
                onClick={() => goFavorite(f)}
                className="w-full flex items-center gap-2 text-left text-xs px-2 py-1.5 rounded-lg hover:bg-white/8 text-white/75 hover:text-white transition cursor-pointer"
              >
                <GIconHardDrive size={13} className="text-white/40 shrink-0" />
                <span className="truncate">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <button
            onClick={() => {
              setCreatingFile(true);
              setMobileSidebar(false);
            }}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 text-xs font-medium transition cursor-pointer"
          >
            <GIconPlus size={13} />
            <span>New File</span>
          </button>
          <button
            onClick={fetchCloudFiles}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[11px] transition cursor-pointer"
            title="Refresh cloud drive files from server"
          >
            <GIconRotateRight size={11} className={syncingCloud ? "animate-spin text-accent" : ""} />
            <span>Sync Cloud</span>
          </button>
        </div>
      </div>

      {/* Main File Browser Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navigation & Controls Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 border-b border-white/10 shrink-0 gap-2 bg-[#0c0d14]/95 backdrop-blur-md">
          {/* Breadcrumbs & Mobile Menu Toggle */}
          <div className="flex items-center gap-1.5 text-xs text-white/60 min-w-0 overflow-hidden">
            <button
              onClick={() => setMobileSidebar(true)}
              className="sm:hidden p-1 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 shrink-0 cursor-pointer"
              title="Toggle Favorites"
            >
              <GIconPin size={12} />
            </button>
            <button onClick={() => setPath([])} className="hover:text-white shrink-0 font-medium cursor-pointer">
              Root
            </button>
            {path.map((seg, i) => (
              <span key={i} className="flex items-center gap-1 shrink-0">
                <GIconChevronRight size={11} className="text-white/30" />
                <button
                  onClick={() => setPath(path.slice(0, i + 1))}
                  className="hover:text-white truncate cursor-pointer"
                >
                  {seg}
                </button>
              </span>
            ))}
          </div>

          {/* Search bar & View Toggles */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="focus-stroke flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1 transition-all focus-within:border-[#0091ff] focus-within:ring-2 focus-within:ring-[#0091ff]/40 focus-within:shadow-[0_0_14px_rgba(0,145,255,0.28)]">
              <GIconSearch size={12} className="text-white/40 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter files..."
                className="bg-transparent text-xs text-white placeholder:text-white/30 outline-none w-16 sm:w-28"
              />
            </div>

            <div className="flex gap-0.5">
              <button
                onClick={() => setView("grid")}
                title="Grid View"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  view === "grid" ? "bg-white/15 text-white" : "hover:bg-white/8 text-white/50"
                }`}
              >
                <GIconLayoutCells size={13} />
              </button>
              <button
                onClick={() => setView("list")}
                title="List View"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  view === "list" ? "bg-white/15 text-white" : "hover:bg-white/8 text-white/50"
                }`}
              >
                <GIconList size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* File Container Area */}
        <div className="flex-1 p-3 overflow-y-auto thin-scroll">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/40 text-xs">
              <p>No matching files or folders</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
              {filteredItems.map((item: any, i) => (
                <div
                  key={i}
                  onClick={() => openItem(item)}
                  className="group relative flex flex-col items-center p-2.5 rounded-xl hover:bg-white/8 border border-transparent hover:border-white/10 transition cursor-pointer text-center"
                >
                  {item.isCustom && !item.readOnly && (
                    <button
                      onClick={(e) => handleDeleteFile(item.name, item.id, e)}
                      title="Delete file"
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition"
                    >
                      <GIconTrash size={11} />
                    </button>
                  )}
                  <div className="mb-1.5 p-1 flex items-center justify-center">
                    <Icon item={item} />
                  </div>
                  <span className="text-xs text-white/90 truncate max-w-full font-medium">{item.name}</span>
                  <span className="text-[10px] text-white/40 mt-0.5">
                    {item.type === "folder" ? "Folder" : item.size || "App"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item: any, i) => (
                <div
                  key={i}
                  onClick={() => openItem(item)}
                  className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/8 border border-transparent hover:border-white/10 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon item={{ ...item, _size: 16 }} />
                    <span className="text-xs text-white/90 truncate font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-white/40">
                      {item.type === "folder" ? "Folder" : item.size || "Application"}
                    </span>
                    {item.isCustom && !item.readOnly && (
                      <button
                        onClick={(e) => handleDeleteFile(item.name, item.id, e)}
                        title="Delete file"
                        className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-rose-400 transition"
                      >
                        <GIconTrash size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Storage Utilization Bar */}
        <div className="px-3 py-1.5 border-t border-white/5 bg-black/20 flex items-center justify-between text-[11px] text-white/40 shrink-0">
          <div className="flex items-center gap-1.5">
            <span>
              Cloud Drive: {storageStats ? `${storageStats.totalKb} KB / ${storageStats.allocatedDriveMb} MB allocated` : "Online & Synced"}
            </span>
          </div>
          <span>{filteredItems.length} items</span>
        </div>
      </div>

      {/* New File Creation Modal */}
      {creatingFile && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setCreatingFile(false)}
        >
          <div
            className="bg-[#181c28] rounded-2xl max-w-sm w-full p-5 border border-white/15 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <GIconPlus size={15} className="text-accent" />
                <span>Create Cloud Document</span>
              </h3>
              <button onClick={() => setCreatingFile(false)} className="text-white/40 hover:text-white">
                <GIconClose size={13} />
              </button>
            </div>

            <form onSubmit={handleCreateFile} className="space-y-3">
              <div>
                <label className="text-[11px] text-white/60 block mb-1">Document Format:</label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: "text", label: "Text (.txt)" },
                    { id: "markdown", label: "Markdown (.md)" },
                    { id: "json", label: "JSON (.json)" },
                    { id: "javascript", label: "JS (.js)" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setNewFileType(f.id)}
                      className={`py-1 rounded-lg text-[10px] font-medium transition ${
                        newFileType === f.id
                          ? "bg-accent text-white"
                          : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      {f.label.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-white/60 block mb-1">Filename:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. project-roadmap"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/40 focus:shadow-[0_0_14px_rgba(0,145,255,0.28)] transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] text-white/60 block mb-1">Initial Content:</label>
                <textarea
                  rows={4}
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="Enter initial document text..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/40 focus:shadow-[0_0_14px_rgba(0,145,255,0.28)] resize-none thin-scroll transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCreatingFile(false)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-accent text-xs text-white font-medium shadow-md shadow-accent/20 hover:bg-accent/80 transition"
                >
                  Save to Cloud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Viewer / Editor Modal */}
      {openText && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 sm:p-8 backdrop-blur-xs"
          onClick={() => setOpenText(null)}
        >
          <div
            className="bg-[#181c28] rounded-2xl max-w-xl w-full p-5 border border-white/15 shadow-2xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <GIconFileText size={16} className="text-accent" />
                <span className="text-xs font-semibold text-white">{openText.name}</span>
                {openText.readOnly && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">Read-Only</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!openText.readOnly && (
                  <button
                    onClick={() => {
                      if (isEditingText) handleSaveFileEdit();
                      else setIsEditingText(true);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                      isEditingText
                        ? "bg-accent text-white shadow-md shadow-accent/20"
                        : "bg-white/10 hover:bg-white/15 text-white/80"
                    }`}
                  >
                    {isEditingText ? "Save Changes" : "Edit"}
                  </button>
                )}
                <button
                  onClick={() => handleDownloadFile(openText.name, isEditingText ? editBuffer : openText.content)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition"
                  title="Download File to Computer"
                >
                  <GIconDownload size={14} />
                </button>
                <button
                  onClick={() => setOpenText(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"
                >
                  <GIconClose size={14} />
                </button>
              </div>
            </div>

            {/* Content / Editor */}
            {isEditingText ? (
              <textarea
                value={editBuffer}
                onChange={(e) => setEditBuffer(e.target.value)}
                className="w-full flex-1 p-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono leading-relaxed outline-none focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/40 focus:shadow-[0_0_14px_rgba(0,145,255,0.28)] resize-none thin-scroll min-h-[260px] transition-all"
              />
            ) : (
              <pre className="text-xs text-white/85 whitespace-pre-wrap font-mono leading-relaxed overflow-y-auto thin-scroll flex-1 p-3 bg-black/30 rounded-xl border border-white/5 min-h-[260px]">
                {openText.content}
              </pre>
            )}

            {/* Footer */}
            <div className="mt-3 flex justify-between items-center pt-2 border-t border-white/5 text-[11px] text-white/40">
              <span>{openText.content.length} characters</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadFile(openText.name, openText.content)}
                  className="hover:text-white transition cursor-pointer"
                >
                  Export File
                </button>
                <span>•</span>
                <button onClick={() => setOpenText(null)} className="hover:text-white transition cursor-pointer">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
