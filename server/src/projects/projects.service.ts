import { Injectable } from "@nestjs/common";
import { projects } from "../../data/projects.js";
import { initialFeedback } from "../../data/feedback.js";

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

export interface ProjectFeedback {
  id: string;
  projectId: string;
  author: string;
  role: string;
  rating: number;
  comment: string;
  ts: number;
}

@Injectable()
export class ProjectsService {
  private readonly projectList: Project[] = projects as Project[];
  private readonly likes: Record<string, number> = {
    "sandrealee-customer": 29,
    "sandrealee-staff": 21,
    "sandrealee-admin": 36,
    "straive-ims": 18
  };
  private readonly feedbackList: ProjectFeedback[] = [...initialFeedback] as ProjectFeedback[];

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

  getFeedback(projectId: string): ProjectFeedback[] {
    return this.feedbackList.filter((f) => f.projectId === projectId);
  }

  addFeedback(
    projectId: string,
    data: { author?: string; role?: string; rating?: number; comment: string }
  ): ProjectFeedback {
    const cleanAuthor = String(data.author || "").trim().slice(0, 40) || "Anonymous Visitor";
    const cleanRole = String(data.role || "Developer").trim().slice(0, 40);
    const cleanRating = Math.min(5, Math.max(1, Number(data.rating) || 5));
    const cleanComment = String(data.comment || "").trim().slice(0, 400);

    const newFeedback: ProjectFeedback = {
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectId,
      author: cleanAuthor,
      role: cleanRole,
      rating: cleanRating,
      comment: cleanComment,
      ts: Date.now()
    };

    this.feedbackList.unshift(newFeedback);
    return newFeedback;
  }
}
