import { useState } from "react";
import { GIconArrowLeft, GIconPuzzle, GIconLock, GIconTrophy, GIconPlay, GIconFlag } from "../icons/GravityIcons";
import BlockBlast from "./games/BlockBlast";
import Game2048 from "./games/Game2048";
import SnakeRetro from "./games/SnakeRetro";
import MinesweeperRetro from "./games/MinesweeperRetro";
import ArcadeLeaderboard from "./games/ArcadeLeaderboard";

const UPCOMING_GAMES = [
  { name: "Sudoku Mini", desc: "5-minute daily logic puzzles." },
  { name: "Pac-Retro Runner", desc: "Classic maze dot-eater." }
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
          title="Back to Arcade Menu"
        >
          <GIconArrowLeft size={15} />
        </button>
        <span className="text-xs font-bold text-white truncate">{title}</span>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto thin-scroll no-scrollbar py-0.5 shrink-0 max-w-[65%] sm:max-w-none">
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
          className="text-amber-300 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] sm:text-[11px] font-semibold transition flex items-center gap-1 shrink-0 cursor-pointer"
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
    <div className="p-3 sm:p-5 space-y-4 text-white select-none h-full overflow-y-auto thin-scroll">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-white mb-0.5">Arcade & Games</h2>
          <p className="text-xs text-white/50">Take a break with responsive minigames built for Portfolio OS.</p>
        </div>
        <button
          onClick={() => setOpen("leaderboard")}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition flex items-center gap-1.5 shadow-lg shadow-amber-500/10 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <GIconTrophy size={14} />
          <span>Global Leaderboard</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setOpen("blockblast")}
          className="flex flex-col items-start gap-2.5 p-3.5 rounded-2xl border border-accent/40 bg-accent/10 hover:bg-accent/15 transition-all text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <GIconPuzzle className="text-accent" size={22} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Block Blast</div>
            <div className="text-[11px] text-white/50 mt-0.5">Clear 8×8 rows and columns before board fills.</div>
            <span className="inline-block mt-2 text-[10px] text-emerald-400 font-medium">● Play Now</span>
          </div>
        </button>

        <button
          onClick={() => setOpen("2048")}
          className="flex flex-col items-start gap-2.5 p-3.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15 transition-all text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <GIconTrophy className="text-amber-400" size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">2048 Puzzle</div>
            <div className="text-[11px] text-white/50 mt-0.5">Slide and merge numbers to hit the 2048 tile!</div>
            <span className="inline-block mt-2 text-[10px] text-emerald-400 font-medium">● Play Now</span>
          </div>
        </button>

        <button
          onClick={() => setOpen("snake")}
          className="flex flex-col items-start gap-2.5 p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15 transition-all text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <GIconPlay className="text-emerald-400" size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Snake Retro</div>
            <div className="text-[11px] text-white/50 mt-0.5">Classic arcade snake with speeds, high score & touch D-pad.</div>
            <span className="inline-block mt-2 text-[10px] text-emerald-400 font-medium">● Play Now</span>
          </div>
        </button>

        <button
          onClick={() => setOpen("minesweeper")}
          className="flex flex-col items-start gap-2.5 p-3.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/15 transition-all text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-rose-400">
            <GIconFlag size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Minesweeper Retro</div>
            <div className="text-[11px] text-white/50 mt-0.5">Defuse mines with retro styling, timer, & flags.</div>
            <span className="inline-block mt-2 text-[10px] text-rose-400 font-medium">● Play Now</span>
          </div>
        </button>
      </div>

      <div className="pt-2">
        <div className="text-[11px] text-white/40 uppercase tracking-wide mb-2 font-medium">Coming Soon</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {UPCOMING_GAMES.map((g) => (
            <div
              key={g.name}
              className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 opacity-60"
            >
              <GIconLock size={16} className="text-white/40" />
              <div>
                <div className="text-sm font-medium text-white/80">{g.name}</div>
                <div className="text-[11px] text-white/40">{g.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
