import { Controller, Get, Post, Delete, Body, Param, Query, Inject, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { ChatGateway } from "../chat/chat.gateway";
import { initialCloudFiles } from "../../data/files.js";

@Controller("api/files")
export class FilesController {
  private files = [...initialCloudFiles];

  constructor(@Inject(ChatGateway) private readonly chatGateway: ChatGateway) {}

  @Get()
  getAll(@Query("path") filePath?: string, @Query("search") search?: string) {
    let list = [...this.files];
    if (filePath && filePath !== "all") {
      list = list.filter((f) => f.path === filePath);
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || (f.content && f.content.toLowerCase().includes(q)));
    }
    return { ok: true, count: list.length, files: list };
  }

  @Get("stats")
  getStats() {
    const totalFiles = this.files.length;
    const totalBytes = this.files.reduce((acc, f) => acc + (f.size || (f.content ? f.content.length : 0)), 0);
    const byType: Record<string, number> = {};
    this.files.forEach((f) => {
      byType[f.type || "unknown"] = (byType[f.type || "unknown"] || 0) + 1;
    });
    return {
      ok: true,
      totalFiles,
      totalBytes,
      totalKb: Math.round((totalBytes / 1024) * 10) / 10,
      byType,
      allocatedDriveMb: 50,
      usedPercentage: Math.round((totalBytes / (50 * 1024 * 1024)) * 10000) / 100
    };
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    const file = this.files.find((f) => f.id === id);
    if (!file) throw new NotFoundException("File not found");
    return { ok: true, file };
  }

  @Post()
  createOrUpdate(
    @Body("id") id?: string,
    @Body("name") name?: string,
    @Body("path") filePath?: string,
    @Body("content") content?: string,
    @Body("type") type?: string
  ) {
    const cleanName = String(name || "").trim().slice(0, 60);
    if (!cleanName) throw new BadRequestException("Filename is required");

    const rawContent = typeof content === "string" ? content : "";
    const cleanPath = String(filePath || "/").trim();
    const fileType = String(type || "text").trim().toLowerCase();

    const fileId = id || `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const existingIdx = this.files.findIndex((f) => f.id === fileId);

    const fileObj = {
      id: fileId,
      name: cleanName,
      path: cleanPath,
      type: fileType,
      size: Buffer.byteLength(rawContent, "utf8"),
      mimeType: fileType === "markdown" ? "text/markdown" : fileType === "json" ? "application/json" : "text/plain",
      content: rawContent,
      updatedAt: Date.now(),
      readOnly: false
    };

    if (existingIdx !== -1) {
      if (this.files[existingIdx].readOnly) {
        throw new ForbiddenException("System file is read-only and cannot be modified.");
      }
      this.files[existingIdx] = fileObj;
    } else {
      this.files.unshift(fileObj);
    }

    this.chatGateway.broadcast("files:updated", fileObj);
    return { ok: true, file: fileObj };
  }

  @Delete(":id")
  deleteFile(@Param("id") id: string) {
    const existing = this.files.find((f) => f.id === id);
    if (!existing) throw new NotFoundException("File not found");
    if (existing.readOnly) throw new ForbiddenException("System file is read-only and cannot be deleted.");

    this.files = this.files.filter((f) => f.id !== id);
    this.chatGateway.broadcast("files:deleted", { id });
    return { ok: true, id, message: `File ${existing.name} deleted successfully.` };
  }
}
