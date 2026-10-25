import { Controller, Get, Param, NotFoundException } from "@nestjs/common";
import { ProjectsService, Project } from "./projects.service";

@Controller("api/projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  getAll(): Project[] {
    return this.projectsService.findAll();
  }

  @Get(":id")
  getOne(@Param("id") id: string): Project {
    const proj = this.projectsService.findOne(id);
    if (!proj) throw new NotFoundException(`Project with ID ${id} not found`);
    return proj;
  }
}

