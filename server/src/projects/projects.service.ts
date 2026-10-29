import { Injectable } from "@nestjs/common";
import { projects } from "../../data/projects.js";

export interface Project {
  id: string;
  title: string;
  stack: string[];
  category: string;
  year: string;
  cover: string;
  summary: string;
  highlights: string[];
  links: { repo: string; live: string };
}

@Injectable()
export class ProjectsService {
  private readonly projectList: Project[] = projects as Project[];
  private readonly likes: Record<string, number> = {
    "sandrealee-customer": 29,
    "sandrealee-staff": 19,
    "sandrealee-admin": 36,
    "straive-ims": 18
  };

  findAll(): Project[] {
    return this.projectList;
  }

  findOne(id: string): Project | undefined {
    return this.projectList.find((p) => p.id === id);
  }

  getLikes(): Record<string, number> {
    return this.likes;
  }

  likeProject(id: string): number {
    this.likes[id] = (this.likes[id] || 0) + 1;
    return this.likes[id];
  }

  getStats() {
    const totalLikes = Object.values(this.likes).reduce((a, b) => a + b, 0);
    const stacks = Array.from(new Set(this.projectList.flatMap((p) => p.stack)));
    return {
      totalProjects: this.projectList.length,
      totalLikes,
      categories: Array.from(new Set(this.projectList.map((p) => p.category))),
      techStack: stacks,
      lastUpdated: "2026"
    };
  }
}
