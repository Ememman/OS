import { useState, useEffect } from "react";
import { GIconPlus, GIconTrash, GIconNotes, GIconCheck } from "../icons/GravityIcons";
import { soundFx } from "../../lib/soundFx";
import { useOS } from "../../store/useOS";

const DEFAULT_NOTES = [
  {
    id: "welcome-note",
    title: "Welcome to Portfolio OS Notes",
    updatedAt: "Just now",
    content: `# Welcome to Portfolio OS Notes

This is your persistent notepad and markdown scratchpad.

### Features
- **Auto-saved**: Everything you write persists in your browser.
- **Markdown Friendly**: Use headers, lists, code blocks, and bullet points.
- **Keyboard Friendly**: Fast typing and quick note switching.

Enjoy exploring the apps! Press **⌘K** anytime for global Spotlight Search.`,
  },
  {
    id: "tech-stack",
    title: "Portfolio OS Architecture",
    updatedAt: "Yesterday",
    content: `## Portfolio OS Technical Stack

- **Frontend Core**: React 19 + Vite 8.1
- **Icons**: Gravity UI Icons (@gravity-ui/icons)
- **Styling**: Tailwind CSS v4 + Custom Glassmorphism
- **Audio Engine**: Web Audio API Synthesizer + Apple/YouTube Music Proxy
- **Real-Time Backend**: Express + Socket.IO (Live visitor presence & comic chats)`,
  },
];

export default function Notes() {
  const { systemSounds } = useOS();
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem("os_notes_data");
      return saved ? JSON.parse(saved) : DEFAULT_NOTES;
    } catch {
      return DEFAULT_NOTES;
    }
  });

  const [activeId, setActiveId] = useState(notes[0]?.id || "welcome-note");
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState("edit"); // "edit" | "preview"

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("os_notes_data", JSON.stringify(notes));
    } catch {}
  }, [notes]);

  const activeNote = notes.find((n) => n.id === activeId) || notes[0];

  const updateActiveNote = (fields) => {
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
    const newNote = {
      id: `note-${Date.now()}`,
      title: "Untitled Note",
      updatedAt: "Just now",
      content: "",
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveId(newNote.id);
    setMode("edit");
  };

  const deleteNote = (id) => {
    if (systemSounds) soundFx.playClose();
    if (notes.length <= 1) {
      updateActiveNote({ title: "Untitled Note", content: "" });
      return;
    }
    const filtered = notes.filter((n) => n.id !== id);
    setNotes(filtered);
    if (activeId === id) {
      setActiveId(filtered[0].id);
    }
  };

  const copyNote = () => {
    if (activeNote) {
      navigator.clipboard?.writeText(activeNote.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const wordCount = activeNote?.content ? activeNote.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = activeNote?.content ? activeNote.content.length : 0;

  return (
    <div className="flex h-full bg-[#0a0a0f] text-white">
      {/* Sidebar: Notes List */}
      <div className="w-48 sm:w-60 border-r border-white/10 flex flex-col shrink-0 bg-black/20">
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GIconNotes size={16} className="text-amber-400" />
            <span className="text-xs font-semibold text-white/80">All Notes</span>
          </div>
          <button
            onClick={createNote}
            className="p-1.5 hover:bg-white/10 active:scale-95 rounded-lg text-white/70 hover:text-white transition-all"
            title="New Note"
          >
            <GIconPlus size={14} />
          </button>
        </div>

        {/* Note List items */}
        <div className="flex-1 overflow-y-auto thin-scroll p-2 space-y-1">
          {notes.map((n) => {
            const isSelected = n.id === activeId;
            return (
              <div
                key={n.id}
                onClick={() => setActiveId(n.id)}
                className={`group relative p-2.5 rounded-xl cursor-pointer transition-all ${
                  isSelected ? "bg-white/10 shadow-sm border border-white/10" : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <h4 className="text-xs font-medium text-white truncate flex-1">
                    {n.title || "Untitled Note"}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(n.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition-opacity"
                    title="Delete Note"
                  >
                    <GIconTrash size={12} />
                  </button>
                </div>
                <p className="text-[10px] text-white/40 truncate mt-1">
                  {n.content ? n.content.replace(/[#*`_]/g, "") : "Empty note"}
                </p>
                <span className="text-[9px] text-white/25 mt-1.5 block font-mono">
                  {n.updatedAt}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Body */}
      {activeNote ? (
        <div className="flex-1 flex flex-col min-w-0 bg-[#0d0e15]">
          {/* Editor Header Bar */}
          <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between gap-3 bg-black/10">
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => updateActiveNote({ title: e.target.value })}
              placeholder="Note Title"
              className="bg-transparent text-sm sm:text-base font-semibold text-white outline-none flex-1 placeholder:text-white/30"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  mode === "preview" ? "bg-accent text-white" : "bg-white/10 hover:bg-white/15 text-white/70"
                }`}
              >
                {mode === "preview" ? "Edit" : "Preview"}
              </button>
              <button
                onClick={copyNote}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white/70 transition-colors flex items-center gap-1.5"
                title="Copy text"
              >
                {copied ? <GIconCheck size={12} className="text-emerald-400" /> : null}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

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
              <div className="text-xs sm:text-sm text-white/90 leading-relaxed font-sans space-y-2 select-text">
                <pre className="whitespace-pre-wrap font-sans bg-transparent p-0 border-none text-white/90 leading-relaxed">
                  {activeNote.content || "Empty note."}
                </pre>
              </div>
            )}
          </div>

          {/* Footer Stats Bar */}
          <div className="px-4 py-1.5 border-t border-white/10 bg-black/20 flex items-center justify-between text-[10px] text-white/40 font-mono">
            <div className="flex items-center gap-3">
              <span>{wordCount} words</span>
              <span>{charCount} characters</span>
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

