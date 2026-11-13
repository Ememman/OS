import { useState } from "react";
import {
  GIconArrowLeft,
  GIconPuzzle,
  GIconLock,
  GIconTrophy,
  GIconPlay,
  GIconFlag,
  GIconSparkles,
  GIconClose,
  GIconCheck,
} from "../icons/GravityIcons";
import BlockBlast from "./games/BlockBlast";
import Game2048 from "./games/Game2048";
import SnakeRetro from "./games/SnakeRetro";
import MinesweeperRetro from "./games/MinesweeperRetro";
import ArcadeLeaderboard from "./games/ArcadeLeaderboard";

interface UpcomingGame {
  id: string;
  name: string;
  genre: string;
  desc: string;
  status: string;
  badgeColor: string;
  features: string[];
  version: string;
}

const UPCOMING_GAMES: UpcomingGame[] = [
  {
    id: "sudoku",
    name: "Sudoku Classic & Mini",
    genre: "Logic & Math",
    desc: "Daily 9×9 and quick 4×4 number deduction puzzles with auto-check and smart pencil markers.",
    status: "In Development",
    badgeColor: "bg-sky-500/15 border-sky-500/30 text-sky-400",
    features: ["Daily challenges", "Smart pencil notes", "3 difficulty tiers", "Timer & error streak"],
    version: "v1.4",
  },
  {
    id: "pacrunner",
    name: "Cyber Pac-Runner",
    genre: "Retro Arcade",
    desc: "Vintage neon maze dot-chaser with reactive ghost AI, power pellets, and fruit combos.",
    status: "Alpha Preview",
    badgeColor: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    features: ["Procedural mazes", "4 distinct ghost AI personalities", "Fruit multipliers", "Retro synth soundtrack"],
    version: "v1.4",
  },
  {
    id: "pong",
    name: "Retro Pong 1972",
    genre: "2-Player / Arcade",
    desc: "The timeless paddle rally. Play local 2-player or battle dynamic AI with CRT scanline optics.",
    status: "Design Phase",
    badgeColor: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    features: ["Local 2-player split screen", "Adaptive AI difficulty", "Vintage CRT filter", "Curve spin physics"],
    version: "v1.5",
  },
  {
    id: "invaders",
    name: "Galactic Defender",
    genre: "Space Shooter",
    desc: "Defend Earth against descending alien waves, mother-ship boss encounters, and destructible shields.",
    status: "In Development",
    badgeColor: "bg-purple-500/15 border-purple-500/30 text-purple-400",
    features: ["Destructible bunker shields", "Alien boss fights", "Special laser power-ups", "Global high scores"],
    version: "v1.5",
  },
  {
    id: "wordle",
    name: "Wordle Matrix",
    genre: "Word Deductions",
    desc: "5-letter daily word deduction challenge with color-coded hints and definition lookups.",
    status: "Alpha Preview",
    badgeColor: "bg-rose-500/15 border-rose-500/30 text-rose-400",
    features: ["Daily mystery word", "Virtual on-screen keyboard", "Shareable score grid", "Dictionary definitions"],
    version: "v1.4",
  },
];

function GameHeader({
  title,
  current,
  onSelect,
  onBack,
}: {
  title: string;
  current: string;
  onSelect: (g: string) => void;
  onBack: () => void;
}) {
  const games = [
    { id: "blockblast", label: "Block Blast" },
    { id: "2048", label: "2048" },
    { id: "snake", label: "Snake" },
    { id: "minesweeper", label: "Mines" },
  ];

  return (
    <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 sticky top-0 z-20 bg-[#0a0a0f]/95 backdrop-blur-md">
      <div className="flex items-center gap-1.5 shrink-0 min-w-0">
        <button
          onClick={onBack}
          className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition cursor-pointer shrink-0"
          title="Back to Arcade Hub"
        >
          <GIconArrowLeft size={15} />
        </button>
        <span className="text-xs font-bold text-white truncate">{title}</span>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto thin-scroll no-scrollbar py-0.5 shrink-0 max-w-[70%] sm:max-w-none">
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => onSelect(g.id)}
            className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-medium transition cursor-pointer shrink-0 ${
              current === g.id
                ? "bg-accent text-white shadow-sm font-semibold"
                : "text-white/60 hover:text-white bg-white/5 hover:bg-white/10"
            }`}
          >
            {g.label}
          </button>
        ))}
        <button
          onClick={() => onSelect("leaderboard")}
          className="text-amber-300 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] sm:text-[11px] font-semibold transition flex items-center gap-1 shrink-0 cursor-pointer hover:bg-amber-500/25"
        >
          <GIconTrophy size={11} />
          <span className="hidden xs:inline">Scores</span>
        </button>
      </div>
    </div>
  );
}

export default function Games() {
  const [open, setOpen] = useState<string | null>("blockblast");
  const [previewGame, setPreviewGame] = useState<UpcomingGame | null>(null);
  const [notifiedGames, setNotifiedGames] = useState<Set<string>>(new Set());

  const toggleNotify = (gameId: string) => {
    setNotifiedGames((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) next.delete(gameId);
      else next.add(gameId);
      return next;
    });
  };

  if (open === "leaderboard") {
    return (
      <div className="h-full flex flex-col min-w-0">
        <ArcadeLeaderboard onClose={() => setOpen(null)} />
      </div>
    );
  }

  if (open === "minesweeper") {
    return (
      <div className="h-full flex flex-col min-w-0">
        <GameHeader title="Minesweeper" current="minesweeper" onSelect={setOpen} onBack={() => setOpen(null)} />
        <div className="flex-1 overflow-auto thin-scroll">
          <MinesweeperRetro onOpenLeaderboard={() => setOpen("leaderboard")} />
        </div>
      </div>
    );
  }

  if (open === "blockblast") {
    return (
      <div className="h-full flex flex-col min-w-0">
        <GameHeader title="Block Blast" current="blockblast" onSelect={setOpen} onBack={() => setOpen(null)} />
        <div className="flex-1 overflow-auto thin-scroll">
          <BlockBlast />
        </div>
      </div>
    );
  }

  if (open === "2048") {
    return (
      <div className="h-full flex flex-col min-w-0">
        <GameHeader title="2048 Puzzle" current="2048" onSelect={setOpen} onBack={() => setOpen(null)} />
        <div className="flex-1 overflow-auto thin-scroll">
          <Game2048 />
        </div>
      </div>
    );
  }

  if (open === "snake") {
    return (
      <div className="h-full flex flex-col min-w-0">
        <GameHeader title="Snake Retro" current="snake" onSelect={setOpen} onBack={() => setOpen(null)} />
        <div className="flex-1 overflow-auto thin-scroll">
          <SnakeRetro />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 space-y-5 text-white select-none h-full overflow-y-auto thin-scroll">
      {/* Arcade Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              Portfolio Arcade & Games
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/20 border border-accent/40 text-accent font-bold">
              4 Playable Games
            </span>
          </div>
          <p className="text-xs text-white/50 max-w-lg">
            High-performance, touch-responsive mini-games built with synthetic audio, persistent scores, and live global leaderboards.
          </p>
        </div>

        <button
          onClick={() => setOpen("leaderboard")}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <GIconTrophy size={14} />
          <span>Global Leaderboard</span>
        </button>
      </div>

      {/* Primary Playable Games Grid */}
      <div>
        <div className="text-[11px] text-white/50 uppercase tracking-wider mb-2.5 font-bold flex items-center gap-1.5">
          <GIconPlay size={12} className="text-emerald-400" />
          <span>Instant Play Minigames</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Block Blast */}
          <button
            onClick={() => setOpen("blockblast")}
            className="flex flex-col justify-between p-3.5 rounded-2xl border border-accent/40 bg-gradient-to-b from-accent/15 to-accent/5 hover:from-accent/25 hover:to-accent/10 transition-all text-left group cursor-pointer shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                  <GIconPuzzle className="text-accent" size={22} />
                </div>
                <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-accent/20 text-accent border border-accent/30">
                  Drag & Drop
                </span>
              </div>
              <div className="text-sm font-bold text-white group-hover:text-accent transition-colors">Block Blast</div>
              <div className="text-[11px] text-white/60 mt-1 leading-snug">
                Drag blocks onto the 8×8 board to clear rows and columns with combos.
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-0.5" /> Play Now
              </span>
              <span className="text-white/40 text-[10px]">Scores Enabled</span>
            </div>
          </button>

          {/* 2048 Puzzle */}
          <button
            onClick={() => setOpen("2048")}
            className="flex flex-col justify-between p-3.5 rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/15 to-amber-500/5 hover:from-amber-500/25 hover:to-amber-500/10 transition-all text-left group cursor-pointer shadow-lg hover:shadow-amber-500/20 active:scale-[0.98]"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                  <GIconTrophy className="text-amber-400" size={20} />
                </div>
                <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Undo + Merge
                </span>
              </div>
              <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">2048 Puzzle</div>
              <div className="text-[11px] text-white/60 mt-1 leading-snug">
                Slide and merge matching number tiles to build the legendary 2048 tile.
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-0.5" /> Play Now
              </span>
              <span className="text-white/40 text-[10px]">Scores Enabled</span>
            </div>
          </button>

          {/* Snake Retro */}
          <button
            onClick={() => setOpen("snake")}
            className="flex flex-col justify-between p-3.5 rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/15 to-emerald-500/5 hover:from-emerald-500/25 hover:to-emerald-500/10 transition-all text-left group cursor-pointer shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                  <GIconPlay className="text-emerald-400" size={20} />
                </div>
                <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Tuned Speed
                </span>
              </div>
              <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Snake Retro</div>
              <div className="text-[11px] text-white/60 mt-1 leading-snug">
                Classic arcade snake with adjusted playable speed, golden apples, & touch D-pad.
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-0.5" /> Play Now
              </span>
              <span className="text-white/40 text-[10px]">Scores Enabled</span>
            </div>
          </button>

          {/* Minesweeper */}
          <button
            onClick={() => setOpen("minesweeper")}
            className="flex flex-col justify-between p-3.5 rounded-2xl border border-rose-500/40 bg-gradient-to-b from-rose-500/15 to-rose-500/5 hover:from-rose-500/25 hover:to-rose-500/10 transition-all text-left group cursor-pointer shadow-lg hover:shadow-rose-500/20 active:scale-[0.98]"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm text-rose-400">
                  <GIconFlag size={20} />
                </div>
                <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Chording + Flags
                </span>
              </div>
              <div className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">Minesweeper Retro</div>
              <div className="text-[11px] text-white/60 mt-1 leading-snug">
                Defuse minefields with responsive auto-scale, digital timers, & chording.
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-0.5" /> Play Now
              </span>
              <span className="text-white/40 text-[10px]">Scores Enabled</span>
            </div>
          </button>
        </div>
      </div>

      {/* Enhanced Upcoming Games Section */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-[11px] text-white/50 uppercase tracking-wider font-bold flex items-center gap-1.5">
            <GIconSparkles size={12} className="text-amber-400" />
            <span>Upcoming Arcade Releases</span>
          </div>
          <span className="text-[10px] text-white/40">In active development</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {UPCOMING_GAMES.map((g) => {
            const isNotified = notifiedGames.has(g.id);

            return (
              <div
                key={g.id}
                onClick={() => setPreviewGame(g)}
                className="group relative flex flex-col justify-between p-3.5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all text-left cursor-pointer shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${g.badgeColor}`}>
                      {g.genre}
                    </span>
                    <span className="text-[9.5px] font-mono text-white/40">
                      {isNotified ? <span className="text-emerald-400 font-semibold">★ Wishlisted</span> : g.version}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <GIconLock size={13} className="text-white/40 group-hover:text-white/70 transition-colors shrink-0" />
                    <h4 className="text-sm font-bold text-white group-hover:text-accent transition-colors">
                      {g.name}
                    </h4>
                  </div>

                  <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                    {g.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-semibold text-amber-300/80">
                    ● {g.status}
                  </span>
                  <span className="text-[10px] text-white/40 group-hover:text-accent font-medium transition-colors">
                    Preview Details →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Game Preview Modal */}
      {previewGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#141824] border border-white/15 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setPreviewGame(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <GIconClose size={14} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${previewGame.badgeColor}`}>
                {previewGame.genre}
              </span>
              <span className="text-[10px] font-mono text-white/40">{previewGame.version}</span>
            </div>

            <h3 className="text-lg font-bold text-white mb-1">{previewGame.name}</h3>
            <p className="text-xs text-white/60 mb-3 leading-relaxed">{previewGame.desc}</p>

            <div className="bg-black/40 rounded-xl p-3 border border-white/10 mb-4 space-y-1.5">
              <div className="text-[10.5px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                Planned Features
              </div>
              {previewGame.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-white/75">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => toggleNotify(previewGame.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  notifiedGames.has(previewGame.id)
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-white/10 hover:bg-white/15 text-white"
                }`}
              >
                {notifiedGames.has(previewGame.id) ? (
                  <>
                    <GIconCheck size={14} />
                    <span>Wishlisted!</span>
                  </>
                ) : (
                  <span>Wishlist Game</span>
                )}
              </button>
              <button
                onClick={() => setPreviewGame(null)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-accent hover:brightness-110 active:scale-95 text-white shadow-lg shadow-accent/25 transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
