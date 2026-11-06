import { Injectable } from "@nestjs/common";
import { updates } from "../../data/updates.js";

export interface Update {
  id: string;
  date: string;
  tag: string;
  title: string;
  body: string;
  pinned?: boolean;
}

@Injectable()
export class UpdatesService {
  private updateList: Update[] = [...(updates as Update[])];
  private readonly reactions: Record<string, { heart: number; fire: number; rocket: number; party: number; total: number }> = {};

  constructor() {
    this.updateList.forEach((u) => {
      this.reactions[u.id] = { heart: 3, fire: 1, rocket: 1, party: 0, total: 5 };
    });
  }

  findAll(tag?: string, q?: string, sort?: string): Update[] {
    let list = [...this.updateList];
    if (tag && tag !== "all") {
      list = list.filter((u) => u.tag?.toLowerCase() === tag.toLowerCase());
    }
    if (q) {
      const query = q.toLowerCase();
      list = list.filter(
        (u) => u.title.toLowerCase().includes(query) || u.body.toLowerCase().includes(query)
      );
    }
    if (sort === "popular") {
      list.sort((a, b) => (this.reactions[b.id]?.total || 0) - (this.reactions[a.id]?.total || 0));
    } else if (sort === "oldest") {
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      list.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    }
    return list;
  }

  getReactions() {
    const counts: Record<string, number> = {};
    for (const [key, val] of Object.entries(this.reactions)) {
      counts[key] = val.total;
    }
    return { counts, detailed: this.reactions };
  }

  react(id: string, type: "heart" | "fire" | "rocket" | "party" = "heart") {
    if (!this.reactions[id]) {
      this.reactions[id] = { heart: 0, fire: 0, rocket: 0, party: 0, total: 0 };
    }
    this.reactions[id][type] = (this.reactions[id][type] || 0) + 1;
    this.reactions[id].total = (this.reactions[id].total || 0) + 1;
    return { id, count: this.reactions[id].total, reactions: this.reactions[id] };
  }

  create(payload: Partial<Update>): Update {
    const newUpdate: Update = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: payload.date || new Date().toISOString().slice(0, 10),
      tag: payload.tag || "feature",
      title: payload.title || "Untitled Update",
      body: payload.body || "",
      pinned: Boolean(payload.pinned)
    };
    this.updateList.unshift(newUpdate);
    this.reactions[newUpdate.id] = { heart: 1, fire: 0, rocket: 0, party: 0, total: 1 };
    return newUpdate;
  }

  togglePin(id: string): { id: string; pinned: boolean } {
    const item = this.updateList.find((u) => u.id === id);
    if (item) {
      item.pinned = !item.pinned;
      return { id, pinned: item.pinned };
    }
    return { id, pinned: false };
  }

  delete(id: string): boolean {
    const initialLen = this.updateList.length;
    this.updateList = this.updateList.filter((u) => u.id !== id);
    delete this.reactions[id];
    return this.updateList.length < initialLen;
  }
}
