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

  findAll(): Project[] {
    return this.projectList;
  }

  findOne(id: string): Project | undefined {
    return this.projectList.find((p) => p.id === id);
  }
}

