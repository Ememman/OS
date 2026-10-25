import { Controller, Get, Query } from "@nestjs/common";
import { MusicService } from "./music.service";

@Controller("api/music")
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Get("search")
  search(@Query("q") query: string) {
    return this.musicService.search(query);
  }

  @Get("youtube-search")
  searchYouTube(@Query("q") query: string) {
    return this.musicService.searchYouTube(query);
  }
}

