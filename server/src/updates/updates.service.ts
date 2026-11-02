import { Injectable } from "@nestjs/common";
import { updates } from "../../data/updates.js";

export interface Update {
  id: string;
  date: string;
  tag: string;
  title: string;
  body: string;
}

@Injectable()
export class UpdatesService {
  private readonly updateList: Update[] = updates as Update[];
  private readonly reactions: Record<string, number> = {};

  findAll(): Update[] {
    return this.updateList;
  }

  getReactions(): Record<string, number> {
    return this.reactions;
  }

  react(id: string): { id: string; count: number } {
    this.reactions[id] = (this.reactions[id] || 0) + 1;
    return { id, count: this.reactions[id] };
  }
}

