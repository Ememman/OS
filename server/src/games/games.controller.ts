import { Controller, Get, Post, Body, Query, Inject, BadRequestException } from "@nestjs/common";
import { ChatGateway } from "../chat/chat.gateway";
import { initialLeaderboard } from "../../data/leaderboard.js";

@Controller("api/games/leaderboard")
export class GamesController {
  private leaderboard = [...initialLeaderboard];

  constructor(@Inject(ChatGateway) private readonly chatGateway: ChatGateway) {}

  @Get()
  getLeaderboard(@Query("game") game?: string, @Query("limit") limit?: string) {
    let list = [...this.leaderboard];
    if (game && game !== "all") {
      list = list.filter((e) => e.game.toLowerCase() === String(game).toLowerCase());
    }
    list.sort((a, b) => {
      if (a.game === "minesweeper" && b.game === "minesweeper") {
        return a.score - b.score;
      }
      return b.score - a.score;
    });
    const max = Math.min(50, Math.max(1, parseInt(limit || "20", 10) || 20));
    return {
      ok: true,
      total: list.length,
      game: game || "all",
      leaderboard: list.slice(0, max)
    };
  }

  @Post()
  submitScore(
    @Body("game") game: string,
    @Body("player") player: string,
    @Body("score") score: number,
    @Body("details") details?: string
  ) {
    const cleanPlayer = String(player || "Anonymous Pilot").trim().slice(0, 25);
    const cleanGame = String(game || "").trim().toLowerCase();
    const numScore = Number(score);
    const cleanDetails = String(details || "").trim().slice(0, 60);

    const validGames: Record<string, string> = {
      blockblast: "Block Blast",
      "2048": "2048 Puzzle",
      snake: "Snake Retro",
      minesweeper: "Minesweeper Retro"
    };

    if (!validGames[cleanGame]) {
      throw new BadRequestException("Invalid game. Supported: blockblast, 2048, snake, minesweeper");
    }

    if (isNaN(numScore) || numScore < 0 || numScore > 1000000) {
      throw new BadRequestException("Invalid score value");
    }

    let badge = "🎮 Player";
    if (cleanGame === "minesweeper") {
      if (numScore < 30) badge = "⚡ Lightning Fast";
      else if (numScore < 60) badge = "🏆 Master Defuser";
      else badge = "🥈 Veteran";
    } else if (cleanGame === "blockblast") {
      if (numScore >= 5000) badge = "🏆 Legend";
      else if (numScore >= 3000) badge = "🥈 Master";
      else badge = "🥉 Pro";
    } else if (cleanGame === "2048") {
      if (numScore >= 15000) badge = "🏆 2048 Champion";
      else if (numScore >= 8000) badge = "🥈 Strategist";
      else badge = "🥉 Competitor";
    } else if (cleanGame === "snake") {
      if (numScore >= 300) badge = "🏆 Anaconda";
      else if (numScore >= 150) badge = "🥈 Viper";
      else badge = "🥉 Cobra";
    }

    const newEntry = {
      id: `lb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      game: cleanGame,
      gameName: validGames[cleanGame],
      player: cleanPlayer,
      score: numScore,
      details: cleanDetails,
      ts: Date.now(),
      badge
    };

    this.leaderboard.unshift(newEntry);
    if (this.leaderboard.length > 200) this.leaderboard = this.leaderboard.slice(0, 200);

    this.chatGateway.broadcast("game:score_submitted", newEntry);
    return { ok: true, entry: newEntry };
  }
}
