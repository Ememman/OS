import { Controller, Get, Post, Body, Param, Inject, NotFoundException, BadRequestException } from "@nestjs/common";
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
    @Body("message") message: string
  ) {
    const cleanName = String(name || "").trim().slice(0, 30);
    const cleanRole = String(role || "Visitor").trim().slice(0, 30);
    const cleanAvatar = String(avatar || "👋").trim().slice(0, 8);
    const cleanMsg = String(message || "").trim().slice(0, 400);

    if (!cleanName || !cleanMsg) {
      throw new BadRequestException("Name and message are required");
    }

    const newEntry = {
      id: `gb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      role: cleanRole,
      avatar: cleanAvatar,
      message: cleanMsg,
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
}
