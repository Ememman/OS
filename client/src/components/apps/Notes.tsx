import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  GIconPlus,
  GIconTrash,
  GIconNotes,
  GIconCheck,
  GIconSearch,
  GIconDownload,
  GIconPin,
  GIconCode,
  GIconCopy,
  GIconBold,
  GIconItalic,
  GIconUnderline,
  GIconStrikethrough,
  GIconListUl,
  GIconListOl,
  GIconListCheck,
  GIconQuote,
  GIconLink,
  GIconUndo,
  GIconRedo,
  GIconFontCursor,
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

This is your persistent notepad, rich markdown editor, and task scratchpad.

### Key Capabilities
- [x] **Full Formatting Tools**: Bold, italic, underline, strikethrough, headings & code
- [x] **Smart Cursor**: Real-time cursor coordinates (Ln, Col), auto-focus & vibrant accent caret
- [x] **Keyboard Shortcuts**: **Ctrl+B** (Bold), **Ctrl+I** (Italic), **Ctrl+U** (Underline), **Ctrl+K** (Link), **Tab** (Indent)
- [ ] **Interactive Checklists**: Click checkboxes in preview or split view to toggle tasks
- [x] **Auto-saved**: Everything you write persists immediately in your browser storage

### Architecture Notes
Portfolio OS runs on **React 19**, **TypeScript**, and **Tailwind CSS v4** with a frosted dark glassmorphism system.

> "Simplicity is prerequisite for reliability." — Edsger W. Dijkstra

Enjoy exploring! Press **⌘K** or **Ctrl+K** anytime for global Spotlight Search.`,
  },
  {
    id: "tech-stack",
    title: "Portfolio OS Technical Stack",
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

  const [activeId, setActiveId] = useState<string>(notes[0]?.id || "welcome-note");
  const [copied, setCopied] = useState(false);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const [mode, setMode] = useState<"edit" | "split" | "preview">("edit");
  const [searchQuery, setSearchQuery] = useState("");
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [isFocused, setIsFocused] = useState(false);

  // Undo / Redo history stack per note
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const isHistoryActionRef = useRef(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("os_notes_data", JSON.stringify(notes));
    } catch {}
  }, [notes]);

  const activeNote = notes.find((n) => n.id === activeId) || notes[0];

  // Initialize history when active note changes
  useEffect(() => {
    if (activeNote) {
      setHistory([activeNote.content]);
      setHistoryIdx(0);
    }
  }, [activeNote?.id]);

  // Push new history state on user edits (debounced / discrete)
  const pushHistory = useCallback((newContent: string) => {
    if (isHistoryActionRef.current) return;
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIdx + 1);
      if (sliced[sliced.length - 1] === newContent) return prev;
      return [...sliced, newContent].slice(-50); // Keep max 50 states
    });
    setHistoryIdx((prev) => Math.min(prev + 1, 49));
  }, [historyIdx]);

  const updateActiveNote = useCallback((fields: Partial<NoteItem>, recordHistory = true) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === activeId) {
          const updated = { ...n, ...fields, updatedAt: "Just now" };
          if (recordHistory && fields.content !== undefined && fields.content !== n.content) {
            pushHistory(fields.content);
          }
          return updated;
        }
        return n;
      })
    );
  }, [activeId, pushHistory]);

  const updateCursor = (el: HTMLTextAreaElement) => {
    const pos = el.selectionStart || 0;
    const textBefore = el.value.slice(0, pos);
    const lines = textBefore.split("\n");
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
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
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (systemSounds) soundFx.playClick();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
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
      if (systemSounds) soundFx.playPop();
      navigator.clipboard?.writeText(activeNote.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      notify("Note Copied", "Markdown content copied to clipboard.", "update");
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

  // Undo / Redo Handlers
  const handleUndo = () => {
    if (historyIdx > 0 && activeNote) {
      isHistoryActionRef.current = true;
      const targetContent = history[historyIdx - 1];
      setHistoryIdx((idx) => idx - 1);
      updateActiveNote({ content: targetContent }, false);
      if (systemSounds) soundFx.playClick();
      setTimeout(() => {
        isHistoryActionRef.current = false;
        if (textareaRef.current) updateCursor(textareaRef.current);
      }, 50);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1 && activeNote) {
      isHistoryActionRef.current = true;
      const targetContent = history[historyIdx + 1];
      setHistoryIdx((idx) => idx + 1);
      updateActiveNote({ content: targetContent }, false);
      if (systemSounds) soundFx.playClick();
      setTimeout(() => {
        isHistoryActionRef.current = false;
        if (textareaRef.current) updateCursor(textareaRef.current);
      }, 50);
    }
  };

  // Selection-aware text formatting engine
  const applyFormat = (type: string) => {
    const textarea = textareaRef.current;
    if (!textarea || !activeNote) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.slice(start, end);

    let replacement = "";
    let newStart = start;
    let newEnd = end;

    if (type === "bold") {
      // Toggle off if selected is already wrapped in **
      if (selected.startsWith("**") && selected.endsWith("**") && selected.length >= 4) {
        replacement = selected.slice(2, -2);
        newStart = start;
        newEnd = start + replacement.length;
      } else if (
        start >= 2 &&
        end <= text.length - 2 &&
        text.slice(start - 2, start) === "**" &&
        text.slice(end, end + 2) === "**"
      ) {
        const before = text.slice(0, start - 2);
        const after = text.slice(end + 2);
        const newContent = before + selected + after;
        updateActiveNote({ content: newContent });
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(start - 2, end - 2);
          updateCursor(textarea);
        });
        if (systemSounds) soundFx.playClick();
        return;
      } else if (selected.length > 0) {
        replacement = `**${selected}**`;
        newStart = start + 2;
        newEnd = end + 2;
      } else {
        replacement = "****";
        newStart = start + 2;
        newEnd = start + 2;
      }
    } else if (type === "italic") {
      if (selected.startsWith("*") && selected.endsWith("*") && selected.length >= 2 && !selected.startsWith("**")) {
        replacement = selected.slice(1, -1);
        newStart = start;
        newEnd = start + replacement.length;
      } else if (
        start >= 1 &&
        end <= text.length - 1 &&
        text.slice(start - 1, start) === "*" &&
        text.slice(end, end + 1) === "*" &&
        text.slice(start - 2, start) !== "**"
      ) {
        const before = text.slice(0, start - 1);
        const after = text.slice(end + 1);
        const newContent = before + selected + after;
        updateActiveNote({ content: newContent });
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(start - 1, end - 1);
          updateCursor(textarea);
        });
        if (systemSounds) soundFx.playClick();
        return;
      } else if (selected.length > 0) {
        replacement = `*${selected}*`;
        newStart = start + 1;
        newEnd = end + 1;
      } else {
        replacement = "**";
        newStart = start + 1;
        newEnd = start + 1;
      }
    } else if (type === "underline") {
      if (selected.startsWith("<u>") && selected.endsWith("</u>") && selected.length >= 7) {
        replacement = selected.slice(3, -4);
        newStart = start;
        newEnd = start + replacement.length;
      } else if (selected.length > 0) {
        replacement = `<u>${selected}</u>`;
        newStart = start + 3;
        newEnd = end + 3;
      } else {
        replacement = "<u></u>";
        newStart = start + 3;
        newEnd = start + 3;
      }
    } else if (type === "strikethrough") {
      if (selected.startsWith("~~") && selected.endsWith("~~") && selected.length >= 4) {
        replacement = selected.slice(2, -2);
        newStart = start;
        newEnd = start + replacement.length;
      } else if (selected.length > 0) {
        replacement = `~~${selected}~~`;
        newStart = start + 2;
        newEnd = end + 2;
      } else {
        replacement = "~~~~";
        newStart = start + 2;
        newEnd = start + 2;
      }
    } else if (type === "code") {
      if (selected.includes("\n")) {
        replacement = `\`\`\`\n${selected || "code here"}\n\`\`\``;
        newStart = start + 4;
        newEnd = start + 4 + (selected.length || 9);
      } else if (selected.startsWith("`") && selected.endsWith("`") && selected.length >= 2) {
        replacement = selected.slice(1, -1);
        newStart = start;
        newEnd = start + replacement.length;
      } else if (selected.length > 0) {
        replacement = `\`${selected}\``;
        newStart = start + 1;
        newEnd = end + 1;
      } else {
        replacement = "``";
        newStart = start + 1;
        newEnd = start + 1;
      }
    } else if (type === "link") {
      if (selected.length > 0) {
        replacement = `[${selected}](https://)`;
        newStart = start + selected.length + 3;
        newEnd = start + selected.length + 11;
      } else {
        replacement = "[link](https://)";
        newStart = start + 1;
        newEnd = start + 5;
      }
    } else if (type === "hr") {
      replacement = `\n\n---\n\n`;
      newStart = start + replacement.length;
      newEnd = newStart;
    } else if (
      type === "h1" ||
      type === "h2" ||
      type === "h3" ||
      type === "bullet" ||
      type === "numbered" ||
      type === "task" ||
      type === "quote"
    ) {
      // Line-based formatting
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      let lineEnd = text.indexOf("\n", end);
      if (lineEnd === -1) lineEnd = text.length;

      const lines = text.slice(lineStart, lineEnd).split("\n");
      const prefix =
        type === "h1" ? "# " :
        type === "h2" ? "## " :
        type === "h3" ? "### " :
        type === "bullet" ? "- " :
        type === "numbered" ? "" :
        type === "task" ? "- [ ] " :
        "> ";

      const formattedLines = lines.map((line, idx) => {
        const clean = line.replace(/^(#{1,6}\s+|-\s+\[[ xX]\]\s+|-\s+|\*\s+|\d+\.\s+|>\s+)/, "");
        if (type === "h1" || type === "h2" || type === "h3") {
          if (line.startsWith(prefix)) return clean;
          return `${prefix}${clean}`;
        }
        if (type === "bullet") {
          if (line.startsWith("- ")) return clean;
          return `- ${clean}`;
        }
        if (type === "numbered") {
          return `${idx + 1}. ${clean}`;
        }
        if (type === "task") {
          if (line.startsWith("- [ ] ") || line.startsWith("- [x] ")) return clean;
          return `- [ ] ${clean}`;
        }
        if (type === "quote") {
          if (line.startsWith("> ")) return clean;
          return `> ${clean}`;
        }
        return line;
      });

      const replacementText = formattedLines.join("\n");
      const newContent = text.slice(0, lineStart) + replacementText + text.slice(lineEnd);
      updateActiveNote({ content: newContent });
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(lineStart, lineStart + replacementText.length);
        updateCursor(textarea);
      });
      if (systemSounds) soundFx.playClick();
      return;
    }

    // Standard in-place replacement
    const newContent = text.slice(0, start) + replacement + text.slice(end);
    updateActiveNote({ content: newContent });
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
      updateCursor(textarea);
    });
    if (systemSounds) soundFx.playClick();
  };

  // Keyboard shortcut & smart indentation / list engine
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    if (cmdOrCtrl && !e.shiftKey && !e.altKey) {
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        applyFormat("bold");
        return;
      }
      if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        applyFormat("italic");
        return;
      }
      if (e.key.toLowerCase() === "u") {
        e.preventDefault();
        applyFormat("underline");
        return;
      }
      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        applyFormat("link");
        return;
      }
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }
    }

    if (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      handleRedo();
      return;
    }

    // Tab key handling (2 spaces or multi-line indent/un-indent)
    if (e.key === "Tab") {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      if (e.shiftKey) {
        // Un-indent lines
        const lineStart = text.lastIndexOf("\n", start - 1) + 1;
        let lineEnd = text.indexOf("\n", end);
        if (lineEnd === -1) lineEnd = text.length;

        const lines = text.slice(lineStart, lineEnd).split("\n");
        const unindented = lines.map((l) =>
          l.startsWith("  ") ? l.slice(2) : l.startsWith("\t") ? l.slice(1) : l
        );
        const replacement = unindented.join("\n");
        const newContent = text.slice(0, lineStart) + replacement + text.slice(lineEnd);
        updateActiveNote({ content: newContent });
        requestAnimationFrame(() => {
          textarea.setSelectionRange(lineStart, lineStart + replacement.length);
          updateCursor(textarea);
        });
      } else {
        if (start === end) {
          // Single cursor 2-space insertion
          const newContent = text.slice(0, start) + "  " + text.slice(end);
          updateActiveNote({ content: newContent });
          requestAnimationFrame(() => {
            textarea.setSelectionRange(start + 2, start + 2);
            updateCursor(textarea);
          });
        } else {
          // Multi-line indent
          const lineStart = text.lastIndexOf("\n", start - 1) + 1;
          let lineEnd = text.indexOf("\n", end);
          if (lineEnd === -1) lineEnd = text.length;

          const lines = text.slice(lineStart, lineEnd).split("\n");
          const indented = lines.map((l) => `  ${l}`);
          const replacement = indented.join("\n");
          const newContent = text.slice(0, lineStart) + replacement + text.slice(lineEnd);
          updateActiveNote({ content: newContent });
          requestAnimationFrame(() => {
            textarea.setSelectionRange(lineStart, lineStart + replacement.length);
            updateCursor(textarea);
          });
        }
      }
      return;
    }

    // Smart Enter key (Auto-continue checklists, bullets, numbered lists)
    if (e.key === "Enter" && !e.shiftKey) {
      const start = textarea.selectionStart;
      const text = textarea.value;
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const currentLine = text.slice(lineStart, start);

      // Check task list: "- [ ] " or "- [x] "
      const taskMatch = currentLine.match(/^(\s*-\s*\[[ xX]\]\s*)(.*)$/);
      if (taskMatch) {
        e.preventDefault();
        const content = taskMatch[2].trim();
        if (!content) {
          // Empty task line: clear prefix and leave blank line
          const newContent = text.slice(0, lineStart) + text.slice(start);
          updateActiveNote({ content: newContent });
          requestAnimationFrame(() => {
            textarea.setSelectionRange(lineStart, lineStart);
            updateCursor(textarea);
          });
        } else {
          // Auto-continue task
          const continuation = "\n- [ ] ";
          const newContent = text.slice(0, start) + continuation + text.slice(start);
          updateActiveNote({ content: newContent });
          requestAnimationFrame(() => {
            const nextPos = start + continuation.length;
            textarea.setSelectionRange(nextPos, nextPos);
            updateCursor(textarea);
          });
        }
        return;
      }

      // Check bullet list: "- " or "* "
      const bulletMatch = currentLine.match(/^(\s*[-*]\s+)(.*)$/);
      if (bulletMatch) {
        e.preventDefault();
        const prefix = bulletMatch[1];
        const content = bulletMatch[2].trim();
        if (!content) {
          const newContent = text.slice(0, lineStart) + text.slice(start);
          updateActiveNote({ content: newContent });
          requestAnimationFrame(() => {
            textarea.setSelectionRange(lineStart, lineStart);
            updateCursor(textarea);
          });
        } else {
          const continuation = `\n${prefix}`;
          const newContent = text.slice(0, start) + continuation + text.slice(start);
          updateActiveNote({ content: newContent });
          requestAnimationFrame(() => {
            const nextPos = start + continuation.length;
            textarea.setSelectionRange(nextPos, nextPos);
            updateCursor(textarea);
          });
        }
        return;
      }

      // Check numbered list: "1. "
      const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (numberMatch) {
        e.preventDefault();
        const indent = numberMatch[1];
        const num = parseInt(numberMatch[2], 10);
        const content = numberMatch[3].trim();
        if (!content) {
          const newContent = text.slice(0, lineStart) + text.slice(start);
          updateActiveNote({ content: newContent });
          requestAnimationFrame(() => {
            textarea.setSelectionRange(lineStart, lineStart);
            updateCursor(textarea);
          });
        } else {
          const continuation = `\n${indent}${num + 1}. `;
          const newContent = text.slice(0, start) + continuation + text.slice(start);
          updateActiveNote({ content: newContent });
          requestAnimationFrame(() => {
            const nextPos = start + continuation.length;
            textarea.setSelectionRange(nextPos, nextPos);
            updateCursor(textarea);
          });
        }
        return;
      }
    }
  };

  // Toggle interactive task in preview mode
  const toggleTaskInNote = (taskLineText: string) => {
    if (!activeNote) return;
    if (systemSounds) soundFx.playPop();

    const isDone = taskLineText.startsWith("- [x] ") || taskLineText.startsWith("- [X] ");
    const toggled = isDone
      ? taskLineText.replace(/^-\s*\[[xX]\]\s*/, "- [ ] ")
      : taskLineText.replace(/^-\s*\[\s*\]\s*/, "- [x] ");

    const newContent = activeNote.content.replace(taskLineText, toggled);
    updateActiveNote({ content: newContent });
  };

  // Helper to render inline markdown (bold, italic, code, links, etc.)
  const renderInline = (str: string): React.ReactNode => {
    if (!str) return null;

    // Tokenizer pattern for markdown inline elements
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|~~[^~]+~~|<u>.*?<\/u>|`[^`]+`|\[.*?\]\(.*?\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.slice(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith("**") && token.endsWith("**")) {
        parts.push(<strong key={match.index} className="font-semibold text-white">{token.slice(2, -2)}</strong>);
      } else if (token.startsWith("*") && token.endsWith("*")) {
        parts.push(<em key={match.index} className="italic text-white/90">{token.slice(1, -1)}</em>);
      } else if (token.startsWith("__") && token.endsWith("__")) {
        parts.push(<strong key={match.index} className="font-semibold text-white">{token.slice(2, -2)}</strong>);
      } else if (token.startsWith("_") && token.endsWith("_")) {
        parts.push(<em key={match.index} className="italic text-white/90">{token.slice(1, -1)}</em>);
      } else if (token.startsWith("<u>") && token.endsWith("</u>")) {
        parts.push(<u key={match.index} className="underline underline-offset-2">{token.slice(3, -4)}</u>);
      } else if (token.startsWith("~~") && token.endsWith("~~")) {
        parts.push(<del key={match.index} className="line-through text-white/40">{token.slice(2, -2)}</del>);
      } else if (token.startsWith("`") && token.endsWith("`")) {
        parts.push(
          <code key={match.index} className="font-mono text-[11px] bg-white/10 text-amber-300 px-1.5 py-0.5 rounded border border-white/10">
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
        const titleMatch = token.match(/\[(.*?)\]/);
        const urlMatch = token.match(/\((.*?)\)/);
        const title = titleMatch ? titleMatch[1] : "link";
        const url = urlMatch ? urlMatch[1] : "#";
        parts.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline inline-flex items-center gap-0.5 font-medium"
          >
            {title}
          </a>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < str.length) {
      parts.push(str.slice(lastIndex));
    }

    return parts.length ? parts : str;
  };

  // Filter & sort notes
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
      <div className="w-56 sm:w-64 border-r border-white/10 flex flex-col shrink-0 bg-black/25">
        <div className="p-2.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GIconNotes size={16} className="text-amber-400" />
            <span className="text-xs font-semibold text-white/85">Notes</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/50 font-mono">
              {notes.length}
            </span>
          </div>
          <button
            onClick={createNote}
            className="flex items-center gap-1 px-2.5 py-1 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg text-xs font-medium transition cursor-pointer"
            title="Create New Note"
          >
            <GIconPlus size={13} />
            <span>New</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="p-2 border-b border-white/10">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
            <GIconSearch size={12} className="text-white/40 shrink-0" />
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
                  onClick={() => {
                    setActiveId(n.id);
                    requestAnimationFrame(() => textareaRef.current?.focus());
                  }}
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
                        className={`w-6 h-6 aspect-square shrink-0 rounded-md flex items-center justify-center hover:bg-white/10 ${
                          n.pinned ? "text-amber-300" : "text-white/40 hover:text-white"
                        }`}
                        title={n.pinned ? "Unpin note" : "Pin note"}
                      >
                        <GIconPin size={11} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(n.id);
                        }}
                        className="w-6 h-6 aspect-square shrink-0 rounded-md flex items-center justify-center hover:text-rose-400 hover:bg-white/10 text-white/40"
                        title="Delete Note"
                      >
                        <GIconTrash size={11} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/45 truncate mt-1">
                    {n.content ? n.content.replace(/[#*`_~]/g, "") : "Empty note"}
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
              {/* Copy Button */}
              <button
                onClick={copyNote}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white/75 transition flex items-center gap-1 cursor-pointer"
                title="Copy note markdown text"
              >
                {copied ? <GIconCheck size={12} className="text-emerald-400" /> : <GIconCopy size={12} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              {/* Download / Export Button */}
              <button
                onClick={exportNote}
                className="w-7 h-7 aspect-square shrink-0 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/15 text-white/75 hover:text-white transition cursor-pointer"
                title="Download as .md file"
              >
                <GIconDownload size={13} />
              </button>
            </div>
          </div>

          {/* Rich Editing & Formatting Toolbar */}
          <div className="px-3 py-1.5 bg-white/[0.03] border-b border-white/5 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar text-xs">
            {/* Left Tools Group */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* History Undo / Redo */}
              <button
                onClick={handleUndo}
                disabled={historyIdx <= 0}
                title="Undo (Ctrl+Z)"
                className="w-7 h-7 aspect-square shrink-0 rounded-md flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
              >
                <GIconUndo size={13} />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIdx >= history.length - 1}
                title="Redo (Ctrl+Y)"
                className="w-7 h-7 aspect-square shrink-0 rounded-md flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
              >
                <GIconRedo size={13} />
              </button>

              <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />

              {/* Inline Text Formats */}
              <button
                onClick={() => applyFormat("bold")}
                title="Bold (Ctrl+B)"
                className="w-7 h-7 aspect-square shrink-0 rounded-md flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              >
                <GIconBold size={13} />
              </button>
              <button
                onClick={() => applyFormat("italic")}
                title="Italic (Ctrl+I)"
                className="w-7 h-7 aspect-square shrink-0 rounded-md flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              >
                <GIconItalic size={13} />
              </button>
              <button
                onClick={() => applyFormat("underline")}
                title="Underline (Ctrl+U)"
                className="w-7 h-7 aspect-square shrink-0 rounded-md flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              >
                <GIconUnderline size={13} />
              </button>
              <button
                onClick={() => applyFormat("strikethrough")}
                title="Strikethrough"
                className="w-7 h-7 aspect-square shrink-0 rounded-md flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              >
                <GIconStrikethrough size={13} />
              </button>

              <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />

              {/* Headings */}
              <button
                onClick={() => applyFormat("h1")}
                title="Heading 1 (#)"
                className="px-1.5 py-0.5 rounded-md hover:bg-white/10 text-[11px] font-bold text-white/70 hover:text-white transition cursor-pointer"
              >
                H1
              </button>
              <button
                onClick={() => applyFormat("h2")}
                title="Heading 2 (##)"
                className="px-1.5 py-0.5 rounded-md hover:bg-white/10 text-[11px] font-bold text-white/70 hover:text-white transition cursor-pointer"
              >
                H2
              </button>
              <button
                onClick={() => applyFormat("h3")}
                title="Heading 3 (###)"
                className="px-1.5 py-0.5 rounded-md hover:bg-white/10 text-[11px] font-bold text-white/70 hover:text-white transition cursor-pointer"
              >
                H3
              </button>

              <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />

              {/* Lists & Tasks */}
              <button
                onClick={() => applyFormat("bullet")}
                title="Bulleted List (-)"
                className="w-7 h-7 aspect-square shrink-0 rounded-md flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              >
                <GIconListUl size={13} />
              </button>
              <button
                onClick={() => applyFormat("numbered")}
                title="Numbered List (1.)"
                className="w-7 h-7 aspect-square shrink-0 rounded-md flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              >
                <GIconListOl size={13} />
              </button>
              <button
                onClick={() => applyFormat("task")}
                title="Task Checklist (- [ ])"
                className="w-7 h-7 aspect-square shrink-0 rounded-md flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              >
                <GIconListCheck size={13} />
              </button>

              <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />

              {/* Inserts: Quote, Code, Link, HR */}
              <button
                onClick={() => applyFormat("quote")}
                title="Blockquote (>)"
                className="w-7 h-7 aspect-square shrink-0 rounded-md flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              >
                <GIconQuote size={13} />
              </button>
              <button
                onClick={() => applyFormat("code")}
                title="Code (Inline or Block)"
                className="w-7 h-7 aspect-square shrink-0 rounded-md flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              >
                <GIconCode size={13} />
              </button>
              <button
                onClick={() => applyFormat("link")}
                title="Insert Link (Ctrl+K)"
                className="w-7 h-7 aspect-square shrink-0 rounded-md flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              >
                <GIconLink size={13} />
              </button>
              <button
                onClick={() => applyFormat("hr")}
                title="Horizontal Divider (---)"
                className="px-1.5 py-0.5 rounded-md hover:bg-white/10 text-[10px] text-white/70 hover:text-white font-mono transition cursor-pointer"
              >
                —
              </button>
            </div>

            {/* Right: View Mode Toggle Pills (Edit | Split | Preview) */}
            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10 shrink-0">
              <button
                onClick={() => setMode("edit")}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition cursor-pointer ${
                  mode === "edit" ? "bg-accent text-white shadow-sm" : "text-white/50 hover:text-white"
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setMode("split")}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition cursor-pointer hidden md:inline-block ${
                  mode === "split" ? "bg-accent text-white shadow-sm" : "text-white/50 hover:text-white"
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setMode("preview")}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition cursor-pointer ${
                  mode === "preview" ? "bg-accent text-white shadow-sm" : "text-white/50 hover:text-white"
                }`}
              >
                Preview
              </button>
            </div>
          </div>

          {/* Text Area & Markdown View Container */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Editor Canvas (Visible in "edit" and "split") */}
            {(mode === "edit" || mode === "split") && (
              <div
                className={`flex-1 p-4 overflow-y-auto thin-scroll cursor-text select-text relative flex flex-col ${
                  mode === "split" ? "border-r border-white/10" : ""
                }`}
                onClick={(e) => {
                  // If user clicked below the text or on canvas padding, autofocus textarea
                  if (e.target === e.currentTarget && textareaRef.current) {
                    textareaRef.current.focus();
                    const len = textareaRef.current.value.length;
                    textareaRef.current.setSelectionRange(len, len);
                    updateCursor(textareaRef.current);
                  }
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={activeNote.content}
                  onChange={(e) => {
                    updateActiveNote({ content: e.target.value });
                    updateCursor(e.target);
                  }}
                  onSelect={(e) => updateCursor(e.currentTarget)}
                  onKeyUp={(e) => updateCursor(e.currentTarget)}
                  onClick={(e) => updateCursor(e.currentTarget)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder="Start typing your note or markdown here... Use Ctrl+B for bold, Ctrl+I for italic, Tab to indent."
                  className="w-full flex-1 min-h-[300px] bg-transparent text-white/90 text-xs sm:text-sm leading-relaxed outline-none resize-none font-mono placeholder:text-white/25 cursor-text select-text"
                  style={{ caretColor: "rgb(var(--accent))" }}
                  autoFocus
                />
              </div>
            )}

            {/* Markdown Preview Canvas (Visible in "preview" and "split") */}
            {(mode === "preview" || mode === "split") && (
              <div className="flex-1 p-5 overflow-y-auto thin-scroll select-text bg-black/10">
                {activeNote.content ? (
                  <div className="max-w-2xl space-y-3.5 text-xs sm:text-sm text-white/85 leading-relaxed font-sans">
                    {activeNote.content.split("\n\n").map((block, idx) => {
                      const trimmed = block.trim();

                      // Code Block
                      if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
                        const lines = trimmed.slice(3, -3).trim().split("\n");
                        const lang = lines[0].match(/^[a-z0-9_-]+$/i) ? lines[0] : "";
                        const codeBody = lang ? lines.slice(1).join("\n") : lines.join("\n");

                        return (
                          <div key={idx} className="relative group/code my-3 rounded-xl border border-white/10 bg-black/60 overflow-hidden">
                            <div className="px-3 py-1.5 border-b border-white/10 bg-white/5 flex items-center justify-between text-[10px] text-white/50 font-mono">
                              <span>{lang || "code"}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard?.writeText(codeBody);
                                  setCopiedCodeIdx(idx);
                                  setTimeout(() => setCopiedCodeIdx(null), 2000);
                                }}
                                className="hover:text-white flex items-center gap-1 transition cursor-pointer"
                              >
                                {copiedCodeIdx === idx ? <GIconCheck size={11} className="text-emerald-400" /> : <GIconCopy size={11} />}
                                <span>{copiedCodeIdx === idx ? "Copied" : "Copy"}</span>
                              </button>
                            </div>
                            <pre className="p-3 font-mono text-[11px] sm:text-xs text-emerald-300 overflow-x-auto thin-scroll">
                              {codeBody}
                            </pre>
                          </div>
                        );
                      }

                      // Horizontal rule
                      if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
                        return <hr key={idx} className="border-white/15 my-4" />;
                      }

                      // Headings
                      if (trimmed.startsWith("# ")) {
                        return (
                          <h1 key={idx} className="text-lg sm:text-xl font-bold text-white border-b border-white/10 pb-1.5 mt-4 mb-2">
                            {renderInline(trimmed.slice(2))}
                          </h1>
                        );
                      }
                      if (trimmed.startsWith("## ")) {
                        return (
                          <h2 key={idx} className="text-base sm:text-lg font-bold text-white mt-3.5 mb-1.5">
                            {renderInline(trimmed.slice(3))}
                          </h2>
                        );
                      }
                      if (trimmed.startsWith("### ")) {
                        return (
                          <h3 key={idx} className="text-sm sm:text-base font-semibold text-accent mt-3 mb-1">
                            {renderInline(trimmed.slice(4))}
                          </h3>
                        );
                      }
                      if (trimmed.startsWith("#### ")) {
                        return (
                          <h4 key={idx} className="text-xs sm:text-sm font-semibold text-white/80 mt-2 mb-1">
                            {renderInline(trimmed.slice(5))}
                          </h4>
                        );
                      }

                      // Blockquote
                      if (trimmed.startsWith("> ")) {
                        const quoteText = trimmed.split("\n").map((l) => l.replace(/^>\s*/, "")).join(" ");
                        return (
                          <blockquote key={idx} className="border-l-2 border-accent pl-3.5 py-1 text-white/70 italic bg-white/[0.02] rounded-r my-2">
                            {renderInline(quoteText)}
                          </blockquote>
                        );
                      }

                      // Task List (- [ ] or - [x])
                      if (trimmed.split("\n").some((l) => /^-\s*\[[ xX]\]/.test(l.trim()))) {
                        const lines = trimmed.split("\n");
                        return (
                          <div key={idx} className="space-y-1.5 my-2">
                            {lines.map((l, lineIdx) => {
                              const match = l.trim().match(/^-\s*\[([ xX])\]\s*(.*)$/);
                              if (match) {
                                const isDone = match[1].toLowerCase() === "x";
                                const taskText = match[2];
                                return (
                                  <label
                                    key={lineIdx}
                                    onClick={() => toggleTaskInNote(l.trim())}
                                    className="flex items-start gap-2.5 p-1 rounded-lg hover:bg-white/5 transition cursor-pointer group"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isDone}
                                      onChange={() => {}}
                                      className="mt-0.5 accent-accent w-3.5 h-3.5 rounded cursor-pointer shrink-0"
                                    />
                                    <span className={`text-xs sm:text-sm ${isDone ? "line-through text-white/40" : "text-white/90"}`}>
                                      {renderInline(taskText)}
                                    </span>
                                  </label>
                                );
                              }
                              return <p key={lineIdx}>{renderInline(l)}</p>;
                            })}
                          </div>
                        );
                      }

                      // Bullet list
                      if (trimmed.split("\n").every((l) => /^[-*]\s+/.test(l.trim()))) {
                        const items = trimmed.split("\n").map((l) => l.trim().replace(/^[-*]\s+/, ""));
                        return (
                          <ul key={idx} className="list-disc list-inside space-y-1 text-white/80 my-2">
                            {items.map((item, i) => (
                              <li key={i} className="leading-relaxed">
                                {renderInline(item)}
                              </li>
                            ))}
                          </ul>
                        );
                      }

                      // Numbered list
                      if (trimmed.split("\n").every((l) => /^\d+\.\s+/.test(l.trim()))) {
                        const items = trimmed.split("\n").map((l) => l.trim().replace(/^\d+\.\s+/, ""));
                        return (
                          <ol key={idx} className="list-decimal list-inside space-y-1 text-white/80 my-2">
                            {items.map((item, i) => (
                              <li key={i} className="leading-relaxed">
                                {renderInline(item)}
                              </li>
                            ))}
                          </ol>
                        );
                      }

                      // Standard paragraph
                      return (
                        <p key={idx} className="leading-relaxed text-white/80 whitespace-pre-wrap">
                          {renderInline(block)}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-white/30 italic text-xs">
                    Empty note. Start typing in edit mode!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Stats & Real-Time Cursor Coordinates Bar */}
          <div className="px-4 py-1.5 border-t border-white/10 bg-black/25 flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/45 font-mono">
            {/* Word & Reading stats */}
            <div className="flex items-center gap-3">
              <span>{wordCount} words</span>
              <span className="hidden sm:inline">{charCount} chars</span>
              <span>~{readTimeMin} min read</span>
            </div>

            {/* Live Cursor Indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-all ${
                  isFocused
                    ? "bg-accent/15 border-accent/40 text-accent font-semibold"
                    : "bg-white/5 border-white/10 text-white/60"
                }`}
                title="Active cursor position"
              >
                <GIconFontCursor size={11} className={isFocused ? "text-accent animate-pulse" : "text-white/40"} />
                <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
              </div>
              <span className="text-white/30 hidden md:inline">Auto-saved to browser</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30 text-xs space-y-2">
          <GIconNotes size={32} className="opacity-30" />
          <span>Select or create a note to begin.</span>
        </div>
      )}
    </div>
  );
}
