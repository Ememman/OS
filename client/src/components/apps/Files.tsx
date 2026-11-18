import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  GIconFolder,
  GIconFileText,
  GIconExternalLink,
  GIconLayoutCells,
  GIconList,
  GIconHardDrive,
  GIconPin,
  GIconChevronRight,
  GIconChevronLeft,
  GIconChevronUp,
  GIconTerminal,
  GIconCode,
  GIconNotes,
  GIconCalculator,
  GIconPlus,
  GIconSearch,
  GIconTrash,
  GIconClose,
  GIconDownload,
  GIconUpload,
  GIconRotateRight,
  GIconPencil,
  GIconCopy,
  GIconCheck,
  GIconShield,
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
  { label: "About Me", path: [], target: "About_Emman.txt" },
  { label: "Technical Skills", path: [], target: "Skills.txt" },
  { label: "System Architecture", path: [], target: "README.md" },
  { label: "Projects", path: ["Projects"] },
  { label: "Gallery", path: ["Gallery"] },
  { label: "Games", path: ["Games"] },
  { label: "Music", path: ["Music"] },
];

/**
 * Checks whether an item is a pre-existing default / system file.
 * Default files cannot be edited, deleted, or renamed.
 */
function isDefaultFile(item: any): boolean {
  if (item.isDefault === true || item.readOnly === true) return true;
  if (!item.isCustom) return true;
  return false;
}

function resolvePath(path: string[], customFiles: FileItem[]): FolderNode {
  let node = fileTree;
  for (const seg of path) {
    const child = node.children.find((c) => c.name === seg);
    if (!child || child.type !== "folder") return fileTree;
    node = child;
  }

  // Filter custom user files that belong to this path
  const currentPathStr = "/" + path.join("/");
  const matchingCustom = customFiles.filter((f) => {
    const fPath = (f as any).path || "/";
    return fPath === currentPathStr || (path.length === 0 && (fPath === "/" || !fPath));
  });

  return {
    ...node,
    children: [
      ...node.children.map((c) => ({ ...c, isDefault: true, readOnly: true })),
      ...matchingCustom,
    ],
  };
}

function FileIcon({ item, size = 32 }: { item: any; size?: number }) {
  const name = item.name?.toLowerCase() || "";
  if (name.includes("codeplay") || item.app === "codeplay") {
    return <GIconCode size={size} className="text-sky-400" />;
  }
  if (name.includes("terminal") || item.app === "terminal") {
    return <GIconTerminal size={size} className="text-emerald-400" />;
  }
  if (name.includes("notes") || item.app === "notes") {
    return <GIconNotes size={size} className="text-amber-400" />;
  }
  if (name.includes("calculator") || item.app === "calculator") {
    return <GIconCalculator size={size} className="text-cyan-400" />;
  }
  if (item.type === "folder") {
    return <GIconFolder size={size} className="text-sky-300" />;
  }
  if (item.type === "app-link") {
    return <GIconExternalLink size={size} className="text-amber-300" />;
  }
  if (name.endsWith(".json")) {
    return <GIconCode size={size} className="text-amber-400" />;
  }
  if (name.endsWith(".md")) {
    return <GIconFileText size={size} className="text-violet-400" />;
  }
  if (name.endsWith(".js") || name.endsWith(".ts")) {
    return <GIconCode size={size} className="text-emerald-400" />;
  }
  return (
    <GIconFileText
      size={size}
      className={isDefaultFile(item) ? "text-white/60" : "text-sky-300"}
    />
  );
}

export default function Files() {
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const { openApp, systemSounds, notify } = useOS();

  // Navigation state with full history stack (back/forward)
  const [path, setPath] = useState<string[]>([]);
  const [history, setHistory] = useState<string[][]>([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<"all" | "system" | "custom" | "docs">("all");
  const [sortBy, setSortBy] = useState<"name" | "type" | "size">("name");

  // Active text preview & editor state
  const [openText, setOpenText] = useState<{
    id?: string;
    name: string;
    content: string;
    isCustom?: boolean;
    readOnly?: boolean;
  } | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editBuffer, setEditBuffer] = useState("");
  const [previewMode, setPreviewMode] = useState<"rendered" | "source">("rendered");

  // Search & New File / Rename state
  const [searchQuery, setSearchQuery] = useState("");
  const [creatingFile, setCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileContent, setNewFileContent] = useState("");
  const [newFileType, setNewFileType] = useState("text");

  const [renamingItem, setRenamingItem] = useState<{ id?: string; oldName: string; name: string } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cloud & local files state
  const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([]);
  const [storageStats, setStorageStats] = useState<{ totalKb: number; allocatedDriveMb: number; totalFiles: number } | null>(null);
  const [syncingCloud, setSyncingCloud] = useState(false);

  // Local storage for user-created offline files
  const [localCustomFiles, setLocalCustomFiles] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("os_custom_files");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync local files to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem("os_custom_files", JSON.stringify(localCustomFiles));
    } catch {}
  }, [localCustomFiles]);

  // Fetch cloud files from server
  const fetchCloudFiles = useCallback(async () => {
    setSyncingCloud(true);
    try {
      const [filesRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/files`).catch(() => null),
        fetch(`${API_URL}/api/files/stats`).catch(() => null),
      ]);
      if (filesRes && filesRes.ok) {
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
          totalFiles: sData.totalFiles || 0,
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

  // Combine local custom files with server cloud files
  const combinedCustomFiles = useMemo(() => {
    const map = new Map<string, any>();
    localCustomFiles.forEach((f) => {
      map.set(f.name, {
        ...f,
        isCustom: true,
        readOnly: false,
      });
    });

    cloudFiles.forEach((cf) => {
      // If cloud file was marked readOnly from server, honor it
      const isCustomFile = !cf.readOnly;
      map.set(cf.name, {
        id: cf.id,
        name: cf.name,
        type: "text",
        content: cf.content,
        isCustom: isCustomFile,
        readOnly: cf.readOnly ?? false,
        size: `${Math.max(1, Math.round(((cf.size || cf.content?.length || 20) / 1024) * 10) / 10)} KB`,
        updatedAt: cf.updatedAt,
      });
    });
    return Array.from(map.values());
  }, [localCustomFiles, cloudFiles]);

  const node = useMemo(() => resolvePath(path, combinedCustomFiles), [path, combinedCustomFiles]);
  const allItems = useMemo(() => node.children || [], [node]);

  // Navigation Helpers (History Back / Forward / Up)
  const navigateTo = (newPath: string[]) => {
    if (systemSounds) soundFx.playClick();
    setPath(newPath);
    setHistory((prev) => [...prev.slice(0, historyIdx + 1), newPath]);
    setHistoryIdx((prev) => prev + 1);
  };

  const goBack = () => {
    if (historyIdx > 0) {
      if (systemSounds) soundFx.playClick();
      setHistoryIdx((prev) => prev - 1);
      setPath(history[historyIdx - 1]);
    }
  };

  const goForward = () => {
    if (historyIdx < history.length - 1) {
      if (systemSounds) soundFx.playClick();
      setHistoryIdx((prev) => prev + 1);
      setPath(history[historyIdx + 1]);
    }
  };

  const goUp = () => {
    if (path.length > 0) {
      navigateTo(path.slice(0, -1));
    }
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let list = [...allItems];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }

    // Category filter
    if (filterType === "system") {
      list = list.filter((i) => isDefaultFile(i));
    } else if (filterType === "custom") {
      list = list.filter((i) => !isDefaultFile(i));
    } else if (filterType === "docs") {
      list = list.filter((i) => i.type === "text" || i.name.endsWith(".txt") || i.name.endsWith(".md"));
    }

    // Sort order
    list.sort((a, b) => {
      // Folders first
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (b.type === "folder" && a.type !== "folder") return 1;

      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "type") {
        return (a.type || "").localeCompare(b.type || "");
      }
      if (sortBy === "size") {
        const sA = parseFloat((a as any).size || "0");
        const sB = parseFloat((b as any).size || "0");
        return sB - sA;
      }
      return 0;
    });

    return list;
  }, [allItems, searchQuery, filterType, sortBy]);

  const openItem = (item: any) => {
    if (systemSounds) soundFx.playClick();
    if (item.type === "folder") {
      navigateTo([...path, item.name]);
    } else if (item.type === "app-link") {
      openApp(item.app);
    } else if (item.type === "text") {
      const isDefault = isDefaultFile(item);
      setOpenText({
        id: item.id,
        name: item.name,
        content: item.content,
        isCustom: !isDefault,
        readOnly: isDefault,
      });
      setEditBuffer(item.content || "");
      setIsEditingText(false);
      setPreviewMode(item.name.endsWith(".md") ? "rendered" : "source");
    }
  };

  const goFavorite = (fav: any) => {
    if (systemSounds) soundFx.playClick();
    navigateTo(fav.path);
    setMobileSidebar(false);
    if (fav.target) {
      const resolved = resolvePath(fav.path, combinedCustomFiles);
      const target = resolved.children?.find((c) => c.name === fav.target);
      if (target && target.type === "text") {
        const isDefault = isDefaultFile(target);
        setOpenText({
          id: (target as any).id,
          name: target.name,
          content: target.content,
          isCustom: !isDefault,
          readOnly: isDefault,
        });
        setEditBuffer(target.content || "");
        setIsEditingText(false);
        setPreviewMode(target.name.endsWith(".md") ? "rendered" : "source");
      }
    }
  };

  // Create new user file (only user-created files are editable)
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newFileName.trim();
    if (!cleanName) return;

    let extension = ".txt";
    if (newFileType === "markdown") extension = ".md";
    else if (newFileType === "json") extension = ".json";
    else if (newFileType === "javascript") extension = ".js";

    const formattedName = cleanName.includes(".") ? cleanName : `${cleanName}${extension}`;
    const initialContent =
      newFileContent ||
      `# ${formattedName}\n\nUser document created in Portfolio OS on ${new Date().toLocaleDateString()}.\n\nThis file is fully editable.`;

    const currentPathStr = "/" + path.join("/");

    // Post to server API
    try {
      const res = await fetch(`${API_URL}/api/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formattedName,
          content: initialContent,
          type: newFileType,
          path: currentPathStr,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        if (saved.file) {
          setCloudFiles((prev) => [saved.file, ...prev]);
        }
      }
    } catch {
      // Local fallback
    }

    const localFile = {
      name: formattedName,
      type: "text",
      content: initialContent,
      isCustom: true,
      readOnly: false,
      path: currentPathStr,
      size: `${Math.max(1, Math.round((initialContent.length / 1024) * 10) / 10)} KB`,
      updatedAt: Date.now(),
    };

    setLocalCustomFiles((prev) => [localFile, ...prev]);
    setCreatingFile(false);
    setNewFileName("");
    setNewFileContent("");
    if (systemSounds) soundFx.playPop();
    notify("File Created", `"${formattedName}" created as an editable document.`, "add");
  };

  // Duplicate file (allows user to make an editable copy of any file, including default files!)
  const handleDuplicateFile = (item: any) => {
    const baseName = item.name.replace(/\.[^/.]+$/, "");
    const ext = item.name.includes(".") ? `.${item.name.split(".").pop()}` : "";
    const copyName = `${baseName} (Copy)${ext}`;
    const content = item.content || `# ${copyName}\n\nDuplicate of ${item.name}`;

    const newCustomFile = {
      name: copyName,
      type: "text",
      content,
      isCustom: true,
      readOnly: false,
      path: "/" + path.join("/"),
      size: `${Math.max(1, Math.round((content.length / 1024) * 10) / 10)} KB`,
      updatedAt: Date.now(),
    };

    setLocalCustomFiles((prev) => [newCustomFile, ...prev]);

    // Also sync to cloud API
    fetch(`${API_URL}/api/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: copyName,
        content,
        type: copyName.endsWith(".json") ? "json" : copyName.endsWith(".md") ? "markdown" : "text",
        path: "/" + path.join("/"),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.file) setCloudFiles((prev) => [data.file, ...prev]);
      })
      .catch(() => {});

    if (systemSounds) soundFx.playPop();
    notify("Editable Copy Created", `Created "${copyName}". You can edit this copy freely.`, "add");

    // Open the new editable copy immediately
    setOpenText({
      name: copyName,
      content,
      isCustom: true,
      readOnly: false,
    });
    setEditBuffer(content);
    setIsEditingText(true);
  };

  // Save changes to an existing user-created file
  const handleSaveFileEdit = async () => {
    if (!openText) return;
    if (openText.readOnly) {
      notify("Protected File", "Default system files cannot be modified.", "warning");
      return;
    }

    if (systemSounds) soundFx.playPop();

    // 1. Update local custom files
    setLocalCustomFiles((prev) =>
      prev.map((f) => (f.name === openText.name ? { ...f, content: editBuffer, updatedAt: Date.now() } : f))
    );

    // 2. Sync to cloud API
    try {
      await fetch(`${API_URL}/api/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: openText.id,
          name: openText.name,
          content: editBuffer,
          type: openText.name.endsWith(".json") ? "json" : openText.name.endsWith(".md") ? "markdown" : "text",
          path: "/" + path.join("/"),
        }),
      });
    } catch {}

    setOpenText({ ...openText, content: editBuffer });
    setIsEditingText(false);
    notify("File Saved", `Changes to "${openText.name}" saved successfully.`, "success");
  };

  // Rename a custom user file
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingItem) return;
    const newName = renamingItem.name.trim();
    if (!newName || newName === renamingItem.oldName) {
      setRenamingItem(null);
      return;
    }

    setLocalCustomFiles((prev) =>
      prev.map((f) => (f.name === renamingItem.oldName ? { ...f, name: newName } : f))
    );

    if (renamingItem.id) {
      try {
        await fetch(`${API_URL}/api/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: renamingItem.id,
            name: newName,
          }),
        });
      } catch {}
    }

    if (openText?.name === renamingItem.oldName) {
      setOpenText((prev) => (prev ? { ...prev, name: newName } : null));
    }

    setRenamingItem(null);
    notify("File Renamed", `Renamed to "${newName}".`, "update");
  };

  // Delete user-created file
  const handleDeleteFile = async (item: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (isDefaultFile(item)) {
      notify("Protected File", "System default files cannot be deleted.", "warning");
      return;
    }

    if (systemSounds) soundFx.playClose();

    if (item.id) {
      try {
        await fetch(`${API_URL}/api/files/${item.id}`, { method: "DELETE" });
      } catch {}
      setCloudFiles((prev) => prev.filter((f) => f.id !== item.id));
    }

    setLocalCustomFiles((prev) => prev.filter((f) => f.name !== item.name));
    if (openText?.name === item.name) setOpenText(null);
    notify("File Removed", `Deleted "${item.name}" from documents.`, "delete");
  };

  // Upload external files from computer
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || "";
        const formattedName = file.name;
        const currentPathStr = "/" + path.join("/");

        const newCustom = {
          name: formattedName,
          type: "text",
          content: text,
          isCustom: true,
          readOnly: false,
          path: currentPathStr,
          size: `${Math.max(1, Math.round((file.size / 1024) * 10) / 10)} KB`,
          updatedAt: Date.now(),
        };

        setLocalCustomFiles((prev) => [newCustom, ...prev]);

        // Sync to cloud
        fetch(`${API_URL}/api/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formattedName,
            content: text,
            path: currentPathStr,
          }),
        }).catch(() => {});

        notify("File Uploaded", `Imported "${formattedName}" into Portfolio OS.`, "add");
      };
      reader.readAsText(file);
    });

    e.target.value = "";
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
    notify("Download Started", `Saving "${fileName}" to downloads.`, "info");
  };

  // Copy file content
  const handleCopyContent = (content: string) => {
    navigator.clipboard?.writeText(content);
    notify("Copied", "File content copied to clipboard.", "success", 2000);
  };

  return (
    <div
      className="relative flex h-full bg-[#0a0d14] text-white select-none overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          const fakeEvent = { target: { files, value: "" } } as any;
          handleFileUpload(fakeEvent);
        }
      }}
    >
      {/* Hidden File Input for Upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-accent/20 border-2 border-dashed border-accent backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none">
          <GIconUpload size={36} className="text-accent animate-bounce mb-2" />
          <p className="text-sm font-semibold text-white">Drop files to upload to Portfolio OS</p>
          <p className="text-xs text-white/60">Import files directly into current directory</p>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {mobileSidebar && (
        <div
          onClick={() => setMobileSidebar(false)}
          className="sm:hidden absolute inset-0 z-20 bg-black/60 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar */}
      <div
        className={`absolute sm:static inset-y-0 left-0 z-30 w-48 sm:w-44 border-r border-white/10 p-2 sm:p-3 shrink-0 flex flex-col justify-between bg-[#0b0f19] sm:bg-white/[0.02] transition-transform duration-200 ${
          mobileSidebar ? "translate-x-0 shadow-2xl" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-white/40 mb-2 px-1">
              <span className="flex items-center gap-1 font-semibold">
                <GIconPin size={11} className="text-amber-400" /> Favorites
              </span>
              <button
                onClick={() => setMobileSidebar(false)}
                className="sm:hidden text-white/50 hover:text-white p-0.5 cursor-pointer"
              >
                <GIconClose size={12} />
              </button>
            </div>
            <div className="space-y-0.5">
              {FAVORITES.map((f) => (
                <button
                  key={f.label}
                  onClick={() => goFavorite(f)}
                  className={`w-full flex items-center gap-2 text-left text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                    path.join("/") === f.path.join("/") && !f.target
                      ? "bg-white/15 text-white font-medium"
                      : "hover:bg-white/8 text-white/75 hover:text-white"
                  }`}
                >
                  <GIconHardDrive size={13} className="text-white/40 shrink-0" />
                  <span className="truncate">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Filter Section */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2 px-1 font-semibold">
              Filter By
            </div>
            <div className="space-y-0.5">
              {[
                { id: "all", label: "All Items" },
                { id: "system", label: "Protected System" },
                { id: "custom", label: "User Created" },
                { id: "docs", label: "Documents" },
              ].map((ft) => (
                <button
                  key={ft.id}
                  onClick={() => setFilterType(ft.id as any)}
                  className={`w-full flex items-center justify-between text-left text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                    filterType === ft.id
                      ? "bg-accent/20 text-accent font-medium border border-accent/30"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{ft.label}</span>
                  {filterType === ft.id && <GIconCheck size={12} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <button
            onClick={() => {
              setCreatingFile(true);
              setMobileSidebar(false);
            }}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-accent text-accent-contrast text-xs font-semibold shadow-md shadow-accent/20 hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            <GIconPlus size={13} />
            <span>New File</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs transition cursor-pointer"
            title="Import text or code files from your computer"
          >
            <GIconUpload size={12} />
            <span>Upload File</span>
          </button>

          <button
            onClick={fetchCloudFiles}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg text-white/40 hover:text-white/80 text-[11px] transition cursor-pointer"
            title="Refresh cloud drive files"
          >
            <GIconRotateRight size={11} className={syncingCloud ? "animate-spin text-accent" : ""} />
            <span>Sync Cloud</span>
          </button>
        </div>
      </div>

      {/* Main File Browser Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navigation & Toolbar Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-2.5 sm:px-3 py-2 border-b border-white/10 shrink-0 gap-1.5 sm:gap-2 bg-[#0d111d]/95 backdrop-blur-md">
          {/* Breadcrumbs & Navigation Controls */}
          <div className="flex items-center gap-1 text-xs text-white/60 min-w-0 flex-1 overflow-hidden">
            <button
              onClick={() => setMobileSidebar(true)}
              className="sm:hidden p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 shrink-0 cursor-pointer mr-0.5"
              title="Toggle Favorites"
            >
              <GIconPin size={12} />
            </button>

            {/* Back / Forward / Up Buttons */}
            <div className="flex items-center gap-0.5 mr-1 border-r border-white/10 pr-1 shrink-0">
              <button
                onClick={goBack}
                disabled={historyIdx <= 0}
                className="p-1 rounded-md hover:bg-white/10 text-white/70 disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                title="Back"
              >
                <GIconChevronLeft size={13} />
              </button>
              <button
                onClick={goForward}
                disabled={historyIdx >= history.length - 1}
                className="p-1 rounded-md hover:bg-white/10 text-white/70 disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                title="Forward"
              >
                <GIconChevronRight size={13} />
              </button>
              <button
                onClick={goUp}
                disabled={path.length === 0}
                className="p-1 rounded-md hover:bg-white/10 text-white/70 disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                title="Up Folder"
              >
                <GIconChevronUp size={13} />
              </button>
            </div>

            {/* Breadcrumb Path Trail */}
            <div className="flex items-center gap-1 min-w-0 truncate">
              <button
                onClick={() => navigateTo([])}
                className={`hover:text-white shrink-0 font-medium cursor-pointer ${
                  path.length === 0 ? "text-white" : "text-white/60"
                }`}
              >
                Root
              </button>
              {path.map((seg, i) => (
                <span key={i} className="flex items-center gap-1 shrink-0">
                  <GIconChevronRight size={11} className="text-white/30" />
                  <button
                    onClick={() => navigateTo(path.slice(0, i + 1))}
                    className={`hover:text-white truncate cursor-pointer ${
                      i === path.length - 1 ? "text-white font-medium" : "text-white/60"
                    }`}
                  >
                    {seg}
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Search bar, Sort & View Toggles */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Filter Search Input */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1 transition-all focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
              <GIconSearch size={12} className="text-white/40 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter..."
                className="bg-transparent text-xs text-white placeholder:text-white/30 outline-none w-14 xs:w-20 sm:w-28 focus:w-20 xs:focus:w-24 sm:focus:w-32 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-white/40 hover:text-white"
                >
                  <GIconClose size={10} />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="hidden md:block bg-white/5 border border-white/10 text-[11px] text-white/70 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-white/10 transition"
              title="Sort items"
            >
              <option value="name" className="bg-[#121622] text-white">Name (A-Z)</option>
              <option value="type" className="bg-[#121622] text-white">File Type</option>
              <option value="size" className="bg-[#121622] text-white">Size</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex gap-0.5 bg-white/5 p-0.5 rounded-lg border border-white/10 shrink-0">
              <button
                onClick={() => setView("grid")}
                title="Grid View"
                className={`p-1 rounded-md transition cursor-pointer ${
                  view === "grid" ? "bg-white/20 text-white" : "hover:bg-white/8 text-white/50"
                }`}
              >
                <GIconLayoutCells size={13} />
              </button>
              <button
                onClick={() => setView("list")}
                title="List View"
                className={`p-1 rounded-md transition cursor-pointer ${
                  view === "list" ? "bg-white/20 text-white" : "hover:bg-white/8 text-white/50"
                }`}
              >
                <GIconList size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* File Container Area */}
        <div className="flex-1 p-2.5 sm:p-3 overflow-y-auto thin-scroll">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/40 text-xs space-y-2">
              <GIconFolder size={36} className="opacity-30" />
              <p>No files found in this folder</p>
              <button
                onClick={() => setCreatingFile(true)}
                className="text-xs text-accent hover:underline cursor-pointer"
              >
                Create a new document here
              </button>
            </div>
          ) : view === "grid" ? (
            /* GRID VIEW */
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
              {filteredItems.map((item: any, i) => {
                const isDefault = isDefaultFile(item);
                return (
                  <div
                    key={i}
                    onClick={() => openItem(item)}
                    className="group relative flex flex-col items-center p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.07] border border-white/5 hover:border-white/15 transition-all duration-150 cursor-pointer text-center select-none shadow-xs"
                  >
                    {/* Protected / Custom Status Badge */}
                    <div className="absolute top-2 left-2">
                      {isDefault ? (
                        <span
                          title="Protected System File (Read-Only)"
                          className="flex items-center text-amber-400/80 p-0.5 rounded"
                        >
                          <GIconShield size={11} />
                        </span>
                      ) : (
                        <span
                          title="User File (Editable)"
                          className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]"
                        />
                      )}
                    </div>

                    {/* Quick Action Buttons for User Files */}
                    {!isDefault && (
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingItem({ id: item.id, oldName: item.name, name: item.name });
                          }}
                          title="Rename file"
                          className="p-1 rounded-md bg-white/15 hover:bg-white/25 text-white/80 hover:text-white transition"
                        >
                          <GIconPencil size={11} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteFile(item, e)}
                          title="Delete file"
                          className="p-1 rounded-md bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition"
                        >
                          <GIconTrash size={11} />
                        </button>
                      </div>
                    )}

                    {/* Duplicate button for default files */}
                    {isDefault && item.type === "text" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateFile(item);
                        }}
                        title="Duplicate & Make Editable Copy"
                        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-white/15 hover:bg-white/25 text-white/70 hover:text-white transition z-10"
                      >
                        <GIconCopy size={11} />
                      </button>
                    )}

                    <div className="my-2 p-1.5 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-150">
                      <FileIcon item={item} size={36} />
                    </div>

                    <span className="text-xs text-white/90 truncate max-w-full font-medium leading-tight">
                      {item.name}
                    </span>

                    <div className="flex items-center gap-1 text-[10px] text-white/40 mt-1">
                      <span>{item.type === "folder" ? "Folder" : item.size || "System"}</span>
                      {isDefault && <span className="text-[9px] text-amber-300/70 font-mono">· Locked</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.01]">
              <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] uppercase font-semibold tracking-wider text-white/40 border-b border-white/10 bg-white/[0.03]">
                <span className="col-span-6 sm:col-span-6">Name</span>
                <span className="col-span-3 sm:col-span-2">Type</span>
                <span className="col-span-3 sm:col-span-2">Size</span>
                <span className="hidden sm:inline sm:col-span-2 text-right">Status / Actions</span>
              </div>

              <div className="divide-y divide-white/5">
                {filteredItems.map((item: any, i) => {
                  const isDefault = isDefaultFile(item);
                  return (
                    <div
                      key={i}
                      onClick={() => openItem(item)}
                      className="group grid grid-cols-12 items-center px-3 py-2 text-xs hover:bg-white/[0.06] transition cursor-pointer"
                    >
                      <div className="col-span-6 sm:col-span-6 flex items-center gap-2.5 min-w-0 pr-2">
                        <FileIcon item={item} size={16} />
                        <span className="truncate font-medium text-white/90">{item.name}</span>
                      </div>

                      <div className="col-span-3 sm:col-span-2 text-[11px] text-white/50 capitalize truncate">
                        {item.type === "folder" ? "Folder" : item.name.split(".").pop() || "Document"}
                      </div>

                      <div className="col-span-3 sm:col-span-2 text-[11px] text-white/40 font-mono truncate">
                        {item.type === "folder" ? "--" : item.size || "1 KB"}
                      </div>

                      <div className="hidden sm:flex sm:col-span-2 items-center justify-end gap-1.5 shrink-0">
                        {isDefault ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-medium">
                            <GIconShield size={10} />
                            <span>Read-Only</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-emerald-300/80 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                              User File
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingItem({ id: item.id, oldName: item.name, name: item.name });
                              }}
                              title="Rename"
                              className="opacity-0 group-hover:opacity-100 p-1 text-white/50 hover:text-white transition"
                            >
                              <GIconPencil size={12} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteFile(item, e)}
                              title="Delete"
                              className="opacity-0 group-hover:opacity-100 p-1 text-white/50 hover:text-rose-400 transition"
                            >
                              <GIconTrash size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Storage Telemetry Bar */}
        <div className="px-2.5 sm:px-3 py-1.5 border-t border-white/5 bg-black/30 flex items-center justify-between text-[10px] sm:text-[11px] text-white/40 shrink-0 gap-2 overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="truncate">
              Cloud Drive: {storageStats ? `${storageStats.totalKb} KB / ${storageStats.allocatedDriveMb} MB` : "Online & Synced"}
            </span>
            <span>•</span>
            <span className="text-white/50 shrink-0">{allItems.filter((i) => !isDefaultFile(i)).length} user files</span>
          </div>
          <span className="shrink-0">{filteredItems.length} items</span>
        </div>
      </div>

      {/* New File Creation Modal */}
      {creatingFile && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs"
          onClick={() => setCreatingFile(false)}
        >
          <div
            className="bg-[#121624] rounded-2xl max-w-[94vw] sm:max-w-sm w-full p-4 sm:p-5 border border-white/15 shadow-2xl space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <GIconPlus size={15} className="text-accent" />
                <span>Create User Document</span>
              </h3>
              <button
                onClick={() => setCreatingFile(false)}
                className="text-white/40 hover:text-white p-1 cursor-pointer"
              >
                <GIconClose size={13} />
              </button>
            </div>

            <form onSubmit={handleCreateFile} className="space-y-3">
              <div>
                <label className="text-[11px] text-white/60 block mb-1">Document Format:</label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: "text", label: "Text", ext: ".txt" },
                    { id: "markdown", label: "Markdown", ext: ".md" },
                    { id: "json", label: "JSON", ext: ".json" },
                    { id: "javascript", label: "JS", ext: ".js" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setNewFileType(f.id)}
                      className={`py-1.5 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                        newFileType === f.id
                          ? "bg-accent text-accent-contrast shadow-sm"
                          : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-white/60 block mb-1">File Name:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. meeting-notes"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] text-white/60 block mb-1">Initial Content:</label>
                <textarea
                  rows={4}
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="Type document content here..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none thin-scroll transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCreatingFile(false)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-accent text-accent-contrast text-xs font-semibold shadow-md shadow-accent/20 hover:brightness-110 active:scale-95 transition cursor-pointer"
                >
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename File Modal */}
      {renamingItem && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs"
          onClick={() => setRenamingItem(null)}
        >
          <div
            className="bg-[#121624] rounded-2xl max-w-[94vw] sm:max-w-sm w-full p-4 sm:p-5 border border-white/15 shadow-2xl space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <GIconPencil size={15} className="text-accent" />
                <span>Rename File</span>
              </h3>
              <button
                onClick={() => setRenamingItem(null)}
                className="text-white/40 hover:text-white p-1 cursor-pointer"
              >
                <GIconClose size={13} />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-white/60 block mb-1">New Filename:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={renamingItem.name}
                  onChange={(e) => setRenamingItem({ ...renamingItem, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setRenamingItem(null)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-accent text-accent-contrast text-xs font-semibold shadow-md shadow-accent/20 hover:brightness-110 active:scale-95 transition cursor-pointer"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Viewer / Editor Modal */}
      {openText && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2.5 sm:p-6 backdrop-blur-xs"
          onClick={() => setOpenText(null)}
        >
          <div
            className="bg-[#101422] rounded-2xl w-full max-w-[95vw] sm:max-w-2xl p-3 sm:p-5 border border-white/15 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Responsive layout that never overlaps on mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2.5 sm:pb-3 mb-2.5 sm:mb-3 border-b border-white/10 gap-2">
              {/* Row 1 on Mobile / Left on Desktop: File icon, name, badge, and mobile close */}
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <GIconFileText size={17} className="text-accent shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-white truncate" title={openText.name}>
                    {openText.name}
                  </span>

                  {/* Read-Only Status Badge for Default System Files */}
                  {openText.readOnly ? (
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0 font-medium whitespace-nowrap">
                      <GIconShield size={10} />
                      <span>Read-Only</span>
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shrink-0 font-medium whitespace-nowrap">
                      User File
                    </span>
                  )}
                </div>

                {/* Mobile top-right close button */}
                <button
                  onClick={() => setOpenText(null)}
                  className="sm:hidden p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer shrink-0"
                  title="Close Modal"
                >
                  <GIconClose size={15} />
                </button>
              </div>

              {/* Row 2 on Mobile / Right on Desktop: Action Buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 flex-wrap">
                {/* Markdown Mode Toggle */}
                {openText.name.endsWith(".md") && !isEditingText && (
                  <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10 text-[11px] shrink-0">
                    <button
                      onClick={() => setPreviewMode("rendered")}
                      className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                        previewMode === "rendered" ? "bg-white/20 text-white font-medium" : "text-white/50 hover:text-white"
                      }`}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => setPreviewMode("source")}
                      className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                        previewMode === "source" ? "bg-white/20 text-white font-medium" : "text-white/50 hover:text-white"
                      }`}
                    >
                      Raw
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                  {/* EDIT BUTTON: ONLY shown for user-created files! NEVER for default files! */}
                  {!openText.readOnly && (
                    <button
                      onClick={() => {
                        if (isEditingText) handleSaveFileEdit();
                        else setIsEditingText(true);
                      }}
                      className={`text-xs px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
                        isEditingText
                          ? "bg-accent text-accent-contrast shadow-md shadow-accent/25 hover:brightness-110"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      }`}
                    >
                      {isEditingText ? "Save Changes" : "Edit"}
                    </button>
                  )}

                  {/* DUPLICATE & EDIT: Allows user to make an editable copy of protected default files */}
                  {openText.readOnly && (
                    <button
                      onClick={() => handleDuplicateFile(openText)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 font-medium transition cursor-pointer shrink-0 whitespace-nowrap"
                      title="Make an editable copy of this system file"
                    >
                      <GIconCopy size={12} />
                      <span>Duplicate & Edit</span>
                    </button>
                  )}

                  {/* Copy content button */}
                  <button
                    onClick={() => handleCopyContent(isEditingText ? editBuffer : openText.content)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer shrink-0"
                    title="Copy Content to Clipboard"
                  >
                    <GIconCopy size={14} />
                  </button>

                  {/* Download button */}
                  <button
                    onClick={() => handleDownloadFile(openText.name, isEditingText ? editBuffer : openText.content)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer shrink-0"
                    title="Download File to Computer"
                  >
                    <GIconDownload size={14} />
                  </button>

                  {/* Desktop close button */}
                  <button
                    onClick={() => setOpenText(null)}
                    className="hidden sm:inline-flex p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer shrink-0"
                    title="Close Modal"
                  >
                    <GIconClose size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content / Editor Viewport */}
            {isEditingText ? (
              <div className="flex-1 flex flex-col min-h-[160px] sm:min-h-[280px]">
                <textarea
                  value={editBuffer}
                  onChange={(e) => setEditBuffer(e.target.value)}
                  placeholder="Type document content..."
                  className="w-full flex-1 p-3 sm:p-3.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono leading-relaxed outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none thin-scroll transition-all"
                />
              </div>
            ) : previewMode === "rendered" && openText.name.endsWith(".md") ? (
              <div className="flex-1 p-3 sm:p-4 bg-black/30 rounded-xl border border-white/5 overflow-y-auto thin-scroll text-xs text-white/85 leading-relaxed space-y-2.5 min-h-[160px] sm:min-h-[280px]">
                {openText.content.split("\n\n").map((para, i) => {
                  if (para.startsWith("# ")) {
                    return <h1 key={i} className="text-base font-bold text-white border-b border-white/10 pb-1">{para.replace("# ", "")}</h1>;
                  }
                  if (para.startsWith("## ")) {
                    return <h2 key={i} className="text-sm font-semibold text-white/95">{para.replace("## ", "")}</h2>;
                  }
                  if (para.startsWith("- ") || para.startsWith("* ")) {
                    const lines = para.split("\n");
                    return (
                      <ul key={i} className="list-disc pl-4 space-y-1 text-white/80">
                        {lines.map((l, j) => (
                          <li key={j}>{l.replace(/^[-*]\s*/, "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={i} className="text-white/75">{para}</p>;
                })}
              </div>
            ) : (
              <pre className="text-xs text-white/85 whitespace-pre-wrap font-mono leading-relaxed overflow-y-auto thin-scroll flex-1 p-3 sm:p-3.5 bg-black/30 rounded-xl border border-white/5 min-h-[160px] sm:min-h-[280px]">
                {openText.content}
              </pre>
            )}

            {/* Footer with Metadata & Actions (Responsive wrap) */}
            <div className="mt-2.5 sm:mt-3 flex flex-col xs:flex-row justify-between items-start xs:items-center pt-2.5 border-t border-white/10 text-[10px] sm:text-[11px] text-white/40 gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span>{(isEditingText ? editBuffer : openText.content).length} chars</span>
                <span>•</span>
                <span>{(isEditingText ? editBuffer : openText.content).split(/\s+/).filter(Boolean).length} words</span>
                {openText.readOnly && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400/80 font-medium">Protected System File</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 self-end xs:self-auto shrink-0">
                <button
                  onClick={() => handleDownloadFile(openText.name, isEditingText ? editBuffer : openText.content)}
                  className="hover:text-white transition cursor-pointer"
                >
                  Export File
                </button>
                <span>•</span>
                <button
                  onClick={() => setOpenText(null)}
                  className="hover:text-white transition cursor-pointer"
                >
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
