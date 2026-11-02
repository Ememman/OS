import { useState, useEffect, useMemo } from "react";
import {
  GIconPlus,
  GIconTrash,
  GIconNotes,
  GIconCheck,
  GIconSearch,
  GIconDownload,
  GIconPin,
  GIconCode,
} from "../icons/GravityIcons";
import { soundFx } from "../../lib/soundFx";
import { useOS } from "../../store/useOS";

export interface NoteItem {
  id: string;
  title: string;
  updatedAt: string;
  content: string;
  pinned?: boolean;
}

const DEFAULT_NOTES: NoteItem[] = [
  {
    id: "welcome-note",
    title: "Welcome to Portfolio OS Notes",
    updatedAt: "Just now",
    pinned: true,
    content: `# Welcome to Portfolio OS Notes

This is your persistent notepad and markdown scratchpad.

### Key Capabilities
- **Auto-saved**: Everything you write persists in your browser's local storage.
- **Search & Pinning**: Filter notes by title or keywords, and pin important notes to the top.
- **Markdown Friendly**: Use headers, lists, code blocks, and formatting quick-tools.
- **Export Ready**: Download any note instantly as a Markdown (.md) file to your local computer.

Enjoy exploring the apps! Press **⌘K** / **Ctrl+K** anytime for global Spotlight Search.`,
  },
  {
    id: "tech-stack",
    title: "Portfolio OS Architecture",
    updatedAt: "Yesterday",
    pinned: false,
    content: `## Portfolio OS Technical Stack

- **Frontend Core**: React 19 + Vite 8.1 + TypeScript
- **Styling**: Tailwind CSS v4 + Frosted Glassmorphism
- **Icons**: Gravity UI Icons (@gravity-ui/icons)
- **Audio Engine**: Web Audio API Synthesizer + Apple/YouTube Music Proxy
- **Real-Time Backend**: Express 5 & NestJS with Socket.IO parity`,
  },
];

export default function Notes() {
  const { systemSounds, notify } = useOS();
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem("os_notes_data");
      return saved ? JSON.parse(saved) : DEFAULT_NOTES;
    } catch {
      return DEFAULT_NOTES;
    }
  });

  const [activeId, setActiveId] = useState(notes[0]?.id || "welcome-note");
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [searchQuery, setSearchQuery] = useState("");

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("os_notes_data", JSON.stringify(notes));
    } catch {}
  }, [notes]);

  const activeNote = notes.find((n) => n.id === activeId) || notes[0];

  const updateActiveNote = (fields: Partial<NoteItem>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeId
          ? { ...n, ...fields, updatedAt: "Just now" }
          : n
      )
    );
  };

  const createNote = () => {
    if (systemSounds) soundFx.playClick();
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: "Untitled Note",
      updatedAt: "Just now",
      content: "",
      pinned: false,
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveId(newNote.id);
    setMode("edit");
    notify("Note Created", `Added "${newNote.title}" to notepad.`, "add");
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (systemSounds) soundFx.playClick();
    const target = notes.find((n) => n.id === id);
    const willPin = !target?.pinned;
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
    notify(willPin ? "Note Pinned" : "Note Unpinned", `"${target?.title || "Note"}" ${willPin ? "pinned to top" : "unpinned"}.`, "update", 2200);
  };

  const deleteNote = (id: string) => {
    if (systemSounds) soundFx.playClose();
    const target = notes.find((n) => n.id === id);
    if (notes.length <= 1) {
      updateActiveNote({ title: "Untitled Note", content: "" });
      notify("Note Cleared", "Scratchpad content was reset.", "delete");
      return;
    }
    const filtered = notes.filter((n) => n.id !== id);
    setNotes(filtered);
    if (activeId === id) {
      setActiveId(filtered[0].id);
    }
    notify("Note Deleted", `"${target?.title || "Note"}" was removed.`, "delete");
  };

  const copyNote = () => {
    if (activeNote) {
      navigator.clipboard?.writeText(activeNote.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      notify("Note Copied", `Copied "${activeNote.title}" markdown to clipboard.`, "update", 2200);
    }
  };

  const exportNote = () => {
    if (!activeNote) return;
    if (systemSounds) soundFx.playPop();
    const blob = new Blob([activeNote.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(activeNote.title || "note").replace(/[^a-z0-9_-]/gi, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify("Note Exported", `Saved "${activeNote.title}.md" to Downloads.`, "update");
  };

  // Insert markdown snippet at cursor or append
  const insertSyntax = (syntax: string, wrap = false) => {
    if (!activeNote) return;
    const current = activeNote.content || "";
    if (wrap) {
      updateActiveNote({ content: current ? `${current}\n${syntax}text${syntax}` : `${syntax}text${syntax}` });
    } else {
      updateActiveNote({ content: current ? `${current}\n${syntax} ` : `${syntax} ` });
    }
  };

  // Sort: pinned notes first, then chronological
  const filteredNotes = useMemo(() => {
    const list = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  const wordCount = activeNote?.content ? activeNote.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = activeNote?.content ? activeNote.content.length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex h-full bg-[#0a0a0f] text-white select-none">
      {/* Sidebar: Notes List */}
      <div className="w-52 sm:w-64 border-r border-white/10 flex flex-col shrink-0 bg-black/25">
        <div className="p-2.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GIconNotes size={16} className="text-amber-400" />
            <span className="text-xs font-semibold text-white/85">Notes</span>
          </div>
          <button
            onClick={createNote}
            className="flex items-center gap-1 px-2 py-1 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg text-xs font-medium transition"
            title="Create New Note"
          >
            <GIconPlus size={13} />
            <span>New</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="p-2 border-b border-white/10">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
            <GIconSearch size={12} className="text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="bg-transparent text-xs text-white placeholder:text-white/35 outline-none w-full"
            />
          </div>
        </div>

        {/* Note List items */}
        <div className="flex-1 overflow-y-auto thin-scroll p-2 space-y-1">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-xs text-white/30">
              No matching notes found.
            </div>
          ) : (
            filteredNotes.map((n) => {
              const isSelected = n.id === activeId;
              return (
                <div
                  key={n.id}
                  onClick={() => setActiveId(n.id)}
                  className={`group relative p-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-white/12 shadow-md border border-white/15"
                      : "hover:bg-white/6 border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {n.pinned && (
                        <span className="text-amber-400 text-xs shrink-0" title="Pinned note">
                          📌
                        </span>
                      )}
                      <h4 className="text-xs font-medium text-white truncate flex-1">
                        {n.title || "Untitled Note"}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => togglePin(n.id, e)}
                        className={`p-1 rounded hover:bg-white/10 ${n.pinned ? "text-amber-300" : "text-white/40 hover:text-white"}`}
                        title={n.pinned ? "Unpin note" : "Pin note"}
                      >
                        <GIconPin size={11} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(n.id);
                        }}
                        className="hover:text-rose-400 p-1 rounded hover:bg-white/10 text-white/40"
                        title="Delete Note"
                      >
                        <GIconTrash size={11} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/45 truncate mt-1">
                    {n.content ? n.content.replace(/[#*`_]/g, "") : "Empty note"}
                  </p>
                  <span className="text-[9px] text-white/30 mt-1.5 block font-mono">
                    {n.updatedAt}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Editor Body */}
      {activeNote ? (
        <div className="flex-1 flex flex-col min-w-0 bg-[#0d0e15]">
          {/* Editor Header Bar */}
          <div className="px-3.5 py-2 border-b border-white/10 flex items-center justify-between gap-2 bg-black/15">
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => updateActiveNote({ title: e.target.value })}
              placeholder="Note Title"
              className="bg-transparent text-sm sm:text-base font-semibold text-white outline-none flex-1 placeholder:text-white/30 truncate"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  mode === "preview" ? "bg-accent text-white" : "bg-white/10 hover:bg-white/15 text-white/75"
                }`}
              >
                {mode === "preview" ? "Edit Mode" : "Preview"}
              </button>
              <button
                onClick={copyNote}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white/75 transition flex items-center gap-1"
                title="Copy note text"
              >
                {copied ? <GIconCheck size={12} className="text-emerald-400" /> : null}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                onClick={exportNote}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/75 hover:text-white transition"
                title="Download as .md file"
              >
                <GIconDownload size={13} />
              </button>
            </div>
          </div>

          {/* Quick Markdown Toolbar (Edit mode only) */}
          {mode === "edit" && (
            <div className="px-3 py-1 bg-white/[0.02] border-b border-white/5 flex items-center gap-1 overflow-x-auto no-scrollbar text-[10px] text-white/50">
              <span className="font-mono text-white/30 mr-1 shrink-0">Syntax:</span>
              <button onClick={() => insertSyntax("**", true)} className="px-1.5 py-0.5 rounded hover:bg-white/10 font-bold shrink-0">B</button>
              <button onClick={() => insertSyntax("*", true)} className="px-1.5 py-0.5 rounded hover:bg-white/10 italic shrink-0">I</button>
              <button onClick={() => insertSyntax("##")} className="px-1.5 py-0.5 rounded hover:bg-white/10 font-mono shrink-0">H2</button>
              <button onClick={() => insertSyntax("###")} className="px-1.5 py-0.5 rounded hover:bg-white/10 font-mono shrink-0">H3</button>
              <button onClick={() => insertSyntax("-")} className="px-1.5 py-0.5 rounded hover:bg-white/10 shrink-0">List</button>
              <button onClick={() => insertSyntax("- [ ]")} className="px-1.5 py-0.5 rounded hover:bg-white/10 shrink-0">Task</button>
              <button onClick={() => insertSyntax("`", true)} className="px-1.5 py-0.5 rounded hover:bg-white/10 font-mono shrink-0">Code</button>
            </div>
          )}

          {/* Text Area / Markdown Preview */}
          <div className="flex-1 p-4 overflow-y-auto thin-scroll">
            {mode === "edit" ? (
              <textarea
                value={activeNote.content}
                onChange={(e) => updateActiveNote({ content: e.target.value })}
                placeholder="Start typing your note or markdown here..."
                className="w-full h-full bg-transparent text-white/90 text-xs sm:text-sm leading-relaxed outline-none resize-none font-mono placeholder:text-white/25 allow-select"
              />
            ) : (
              <div className="text-xs sm:text-sm text-white/90 leading-relaxed font-sans space-y-3 select-text">
                {activeNote.content ? (
                  activeNote.content.split("\n\n").map((block, idx) => {
                    const trimmed = block.trim();
                    if (trimmed.startsWith("### ")) {
                      return <h3 key={idx} className="text-sm font-semibold text-accent mt-3">{trimmed.slice(4)}</h3>;
                    }
                    if (trimmed.startsWith("## ")) {
                      return <h2 key={idx} className="text-base font-bold text-white mt-4 border-b border-white/10 pb-1">{trimmed.slice(3)}</h2>;
                    }
                    if (trimmed.startsWith("# ")) {
                      return <h1 key={idx} className="text-lg font-bold text-white mt-4">{trimmed.slice(2)}</h1>;
                    }
                    if (trimmed.startsWith("- ")) {
                      const items = trimmed.split("\n").filter((l) => l.trim().startsWith("- "));
                      return (
                        <ul key={idx} className="list-disc list-inside space-y-1 text-white/80">
                          {items.map((item, i) => (
                            <li key={i}>{item.replace(/^- /, "")}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={idx} className="text-white/80 leading-relaxed whitespace-pre-wrap">{block}</p>;
                  })
                ) : (
                  <p className="text-white/30 italic">Empty note.</p>
                )}
              </div>
            )}
          </div>

          {/* Footer Stats Bar */}
          <div className="px-4 py-1.5 border-t border-white/10 bg-black/25 flex items-center justify-between text-[10px] text-white/40 font-mono">
            <div className="flex items-center gap-3">
              <span>{wordCount} words</span>
              <span>{charCount} chars</span>
              <span>~{readTimeMin} min read</span>
            </div>
            <span>Auto-saved to local storage</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-white/30 text-xs">
          Select or create a note to begin.
        </div>
      )}
    </div>
  );
}
