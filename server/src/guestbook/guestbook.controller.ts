import { Controller, Get, Post, Delete, Body, Param, Inject, NotFoundException, BadRequestException } from "@nestjs/common";
import { ChatGateway } from "../chat/chat.gateway";
import { initialGuestbook } from "../../data/guestbook.js";

@Controller("api/guestbook")
export class GuestbookController {
  private entries = [...initialGuestbook];

  constructor(@Inject(ChatGateway) private readonly chatGateway: ChatGateway) {}

  @Get()
  getAll() {
    return this.entries;
  }

  @Post()
  createEntry(
    @Body("name") name: string,
    @Body("role") role: string,
    @Body("avatar") avatar: string,
    @Body("message") message: string,
    @Body("link") link?: string,
    @Body("location") location?: string
  ) {
    const cleanName = String(name || "").trim().slice(0, 40);
    const cleanRole = String(role || "Visitor").trim().slice(0, 30);
    const cleanAvatar = String(avatar || "lorelei:guest").trim().slice(0, 500000);
    const cleanMsg = String(message || "").trim().slice(0, 500);
    const cleanLink = String(link || "").trim().slice(0, 200);
    const cleanLocation = String(location || "").trim().slice(0, 80);

    if (!cleanName || !cleanMsg) {
      throw new BadRequestException("Name and message are required");
    }

    const newEntry = {
      id: `gb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      role: cleanRole,
      avatar: cleanAvatar,
      message: cleanMsg,
      link: cleanLink || undefined,
      location: cleanLocation || undefined,
      ts: Date.now(),
      reactions: 0
    };

    this.entries.unshift(newEntry);
    if (this.entries.length > 100) {
      this.entries = this.entries.slice(0, 100);
    }

    this.chatGateway.broadcast("guestbook:entry", newEntry);
    return newEntry;
  }

  @Post(":id/react")
  react(@Param("id") id: string) {
    const entry = this.entries.find((e) => e.id === id);
    if (!entry) throw new NotFoundException("Entry not found");

    entry.reactions = (entry.reactions || 0) + 1;
    this.chatGateway.broadcast("guestbook:reacted", { id, reactions: entry.reactions });
    return { id, reactions: entry.reactions };
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    const initialLen = this.entries.length;
    this.entries = this.entries.filter((e) => e.id !== id);
    if (this.entries.length === initialLen) {
      throw new NotFoundException("Entry not found");
    }
    this.chatGateway.broadcast("guestbook:deleted", { id });
    return { success: true, id };
  }
}
