import { Controller, Get, Post, Delete, Body, Param, Inject, BadRequestException, NotFoundException } from "@nestjs/common";
import { ChatGateway } from "../chat/chat.gateway";

@Controller("api/notes")
export class NotesController {
  private notes: any[] = [
    {
      id: "welcome-note",
      title: "Welcome to Portfolio OS Notes",
      updatedAt: "Cloud Synced",
      pinned: true,
      tag: "guide",
      color: "amber",
      content: `# Welcome to Portfolio OS Notes\n\nThis is your persistent notepad, rich markdown editor, and task scratchpad with real-time cloud sync.\n\n### Key Capabilities\n- [x] **Full Formatting Tools**: Bold, italic, underline, strikethrough, headings & code\n- [x] **Cloud Sync & Backup**: Seamlessly sync across tabs and devices\n- [x] **Document Analytics**: Word count, character count, and reading time\n- [x] **Smart Tagging**: Organize thoughts with #tags\n- [x] **Auto-saved**: Everything you write persists locally and in the cloud`
    },
    {
      id: "tech-stack",
      title: "Portfolio OS Technical Stack",
      updatedAt: "Cloud Synced",
      pinned: false,
      tag: "architecture",
      color: "sky",
      content: `## Portfolio OS Technical Stack\n\n- **Frontend Core**: React 19 + Vite 8.1 + TypeScript\n- **Styling**: Tailwind CSS v4 + Frosted Glassmorphism\n- **Icons**: Gravity UI Icons (@gravity-ui/icons)\n- **Real-Time Backend**: Express 5 & Socket.IO realtime parity\n- **Storage**: Real-time cloud sync engine + localStorage persistence`
    }
  ];

  constructor(@Inject(ChatGateway) private readonly chatGateway: ChatGateway) {}

  @Get()
  getNotes() {
    return this.notes;
  }

  @Post("sync")
  syncNotes(@Body("notes") clientNotes: any[]) {
    if (!Array.isArray(clientNotes)) {
      throw new BadRequestException("Invalid notes payload");
    }

    const map = new Map<string, any>();
    this.notes.forEach((n) => map.set(n.id, n));
    clientNotes.forEach((clientNote) => {
      if (clientNote && clientNote.id) {
        map.set(clientNote.id, {
          ...(map.get(clientNote.id) || {}),
          ...clientNote,
          serverSyncedAt: Date.now()
        });
      }
    });

    this.notes = Array.from(map.values());
    this.chatGateway.broadcast("notes:synced", this.notes);
    return { ok: true, notes: this.notes };
  }

  @Post()
  saveNote(@Body() note: any) {
    if (!note || !note.id) throw new BadRequestException("Invalid note");

    const idx = this.notes.findIndex((n) => n.id === note.id);
    const updatedNote = { ...note, serverSyncedAt: Date.now() };

    if (idx !== -1) {
      this.notes[idx] = updatedNote;
    } else {
      this.notes.unshift(updatedNote);
    }

    this.chatGateway.broadcast("notes:updated", updatedNote);
    return updatedNote;
  }

  @Delete(":id")
  deleteNote(@Param("id") id: string) {
    this.notes = this.notes.filter((n) => n.id !== id);
    this.chatGateway.broadcast("notes:deleted", { id });
    return { ok: true, id };
  }
}
