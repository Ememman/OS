import { Injectable } from "@nestjs/common";
import { updates } from "../../data/updates.js";

export interface Update {
  id: string;
  date: string;
  tag: string;
  title: string;
  body: string;
  author?: string;
}

@Injectable()
export class UpdatesService {
  private readonly updateList: Update[] = [...(updates as Update[])];
  private readonly reactions: Record<string, Record<string, number>> = {};

  findAll(): Update[] {
    return this.updateList;
  }

  getReactions(): Record<string, Record<string, number>> {
    return this.reactions;
  }

  create(data: { title: string; body: string; tag?: string; author?: string }): Update {
    const validTags = ["feature", "fix", "launch", "perf", "announcement"];
    const cleanTag = validTags.includes(String(data.tag || "").toLowerCase()) ? String(data.tag).toLowerCase() : "feature";
    const entry: Update = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: new Date().toISOString(),
      tag: cleanTag,
      title: String(data.title || "").trim(),
      body: String(data.body || "").trim(),
      author: String(data.author || "Bron Mendoza").trim().slice(0, 40),
    };

    this.updateList.unshift(entry);
    if (this.updateList.length > 100) this.updateList.splice(100);
    return entry;
  }

  react(id: string, emoji = "❤️"): { id: string; emoji: string; counts: Record<string, number>; total: number } {
    const validEmojis = ["❤️", "🚀", "🔥", "👍"];
    const cleanEmoji = validEmojis.includes(emoji) ? emoji : "❤️";

    if (!this.reactions[id]) {
      this.reactions[id] = { "❤️": 0, "🚀": 0, "🔥": 0, "👍": 0 };
    }

    this.reactions[id][cleanEmoji] = (this.reactions[id][cleanEmoji] || 0) + 1;
    const total = Object.values(this.reactions[id]).reduce((a, b) => a + b, 0);

    return { id, emoji: cleanEmoji, counts: this.reactions[id], total };
  }
}
