import { useState, useEffect, useCallback, useRef } from "react";
import { soundFx } from "../../../lib/soundFx";
import { useOS } from "../../../store/useOS";
import {
  GIconRotateRight,
  GIconTrophy,
  GIconChevronUp,
  GIconChevronDown,
  GIconChevronLeft,
  GIconChevronRight,
} from "../../icons/GravityIcons";

type Board = number[][];

const SIZE = 4;

function createEmptyBoard(): Board {
  return Array(SIZE).fill(0).map(() => Array(SIZE).fill(0));
}

function getEmptyCells(board: Board): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) cells.push([r, c]);
    }
  }
  return cells;
}

function spawnRandomTile(board: Board): Board {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = board.map((row) => [...row]);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function slideRow(row: number[]): { newRow: number[]; scoreGained: number; merged: boolean } {
  const filtered = row.filter((v) => v !== 0);
  const result: number[] = [];
  let scoreGained = 0;
  let merged = false;

  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
      const mergedVal = filtered[i] * 2;
      result.push(mergedVal);
      scoreGained += mergedVal;
      merged = true;
      i++; // skip next
    } else {
      result.push(filtered[i]);
    }
  }

  while (result.length < SIZE) {
    result.push(0);
  }

  return { newRow: result, scoreGained, merged };
}

function rotateBoard(board: Board): Board {
  const next = createEmptyBoard();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      next[c][SIZE - 1 - r] = board[r][c];
    }
  }
  return next;
}

function boardsEqual(a: Board, b: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function hasAvailableMoves(board: Board): boolean {
  if (getEmptyCells(board).length > 0) return true;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const current = board[r][c];
      if (c < SIZE - 1 && current === board[r][c + 1]) return true;
      if (r < SIZE - 1 && current === board[r + 1][c]) return true;
    }
  }
  return false;
}

const TILE_STYLES: Record<number, { bg: string; text: string; glow?: string }> = {
  2: { bg: "bg-white/10", text: "text-white/90" },
  4: { bg: "bg-white/20", text: "text-white" },
  8: { bg: "bg-amber-500/80", text: "text-white", glow: "shadow-amber-500/30" },
  16: { bg: "bg-orange-500/85", text: "text-white", glow: "shadow-orange-500/30" },
  32: { bg: "bg-rose-500/85", text: "text-white", glow: "shadow-rose-500/30" },
  64: { bg: "bg-rose-600/90", text: "text-white", glow: "shadow-rose-600/40" },
  128: { bg: "bg-yellow-500/90", text: "text-white font-bold", glow: "shadow-yellow-500/50" },
  256: { bg: "bg-yellow-400/95", text: "text-zinc-900 font-extrabold", glow: "shadow-yellow-400/60" },
  512: { bg: "bg-emerald-500/95", text: "text-white font-extrabold", glow: "shadow-emerald-500/60" },
  1024: { bg: "bg-cyan-500/95", text: "text-white font-extrabold", glow: "shadow-cyan-500/70" },
  2048: { bg: "bg-violet-600", text: "text-white font-black", glow: "shadow-violet-600/80" },
};

export default function Game2048() {
  const { systemSounds } = useOS();
  const [board, setBoard] = useState<Board>(() => {
    let b = createEmptyBoard();
    b = spawnRandomTile(b);
    b = spawnRandomTile(b);
    return b;
  });

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    return Number(localStorage.getItem("os_2048_best") || 0);
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const resetGame = () => {
    if (systemSounds) soundFx.playClick();
    let b = createEmptyBoard();
    b = spawnRandomTile(b);
    b = spawnRandomTile(b);
    setBoard(b);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
  };

  const move = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (gameOver) return;

      let current = board.map((r) => [...r]);
      let rotations = 0;

      if (direction === "up") rotations = 3;
      else if (direction === "right") rotations = 2;
      else if (direction === "down") rotations = 1;

      for (let i = 0; i < rotations; i++) {
        current = rotateBoard(current);
      }

      let totalScoreGained = 0;
      let anyMerged = false;
      const nextBoard: Board = [];

      for (let r = 0; r < SIZE; r++) {
        const { newRow, scoreGained, merged } = slideRow(current[r]);
        nextBoard.push(newRow);
        totalScoreGained += scoreGained;
        if (merged) anyMerged = true;
      }

      current = nextBoard;
      for (let i = 0; i < (4 - rotations) % 4; i++) {
        current = rotateBoard(current);
      }

      if (!boardsEqual(board, current)) {
        if (anyMerged && systemSounds) soundFx.playPop();
        else if (systemSounds) soundFx.playClick();

        const withSpawn = spawnRandomTile(current);
        setBoard(withSpawn);

        const newScore = score + totalScoreGained;
        setScore(newScore);
        if (newScore > bestScore) {
          setBestScore(newScore);
          localStorage.setItem("os_2048_best", String(newScore));
        }

        // Check 2048 win
        if (!won && !keepPlaying) {
          for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
              if (withSpawn[r][c] === 2048) {
                setWon(true);
                if (systemSounds) soundFx.playNotification();
                break;
              }
            }
          }
        }

        if (!hasAvailableMoves(withSpawn)) {
          setGameOver(true);
        }
      }
    },
    [board, score, bestScore, gameOver, won, keepPlaying, systemSounds]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "KeyW"].includes(e.code)) {
        e.preventDefault();
        move("up");
      } else if (["ArrowDown", "KeyS"].includes(e.code)) {
        e.preventDefault();
        move("down");
      } else if (["ArrowLeft", "KeyA"].includes(e.code)) {
        e.preventDefault();
        move("left");
      } else if (["ArrowRight", "KeyD"].includes(e.code)) {
        e.preventDefault();
        move("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
      if (dx > 0) move("right");
      else move("left");
    } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 30) {
      if (dy > 0) move("down");
      else move("up");
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-start sm:justify-between h-full p-3 sm:p-4 select-none touch-none bg-black/30 text-white overflow-y-auto thin-scroll gap-2"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top scoreboard */}
      <div className="w-full max-w-[min(86vw,320px)] flex items-center justify-between mb-1 sm:mb-2">
        <div>
          <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight">2048</h3>
          <p className="text-[10px] text-white/40">Join tiles to reach 2048!</p>
        </div>

        <div className="flex gap-1.5 sm:gap-2">
          <div className="bg-white/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-center min-w-[50px] border border-white/5">
            <div className="text-[9px] uppercase tracking-wide text-white/50">Score</div>
            <div className="font-mono font-bold text-xs sm:text-sm text-white">{score}</div>
          </div>
          <div className="bg-white/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-center min-w-[50px] border border-white/5">
            <div className="text-[9px] uppercase tracking-wide text-amber-400 flex items-center justify-center gap-0.5">
              <GIconTrophy size={10} /> Best
            </div>
            <div className="font-mono font-bold text-xs sm:text-sm text-amber-300">{bestScore}</div>
          </div>
          <button
            onClick={resetGame}
            title="Restart"
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/5 transition self-center cursor-pointer"
          >
            <GIconRotateRight size={15} />
          </button>
        </div>
      </div>

      {/* 4x4 Grid Board */}
      <div className="relative w-full max-w-[min(86vw,320px)] aspect-square bg-white/5 p-2 sm:p-2.5 rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-between">
        {board.map((row, r) => (
          <div key={r} className="flex justify-between h-[23%] gap-2">
            {row.map((val, c) => {
              const style = TILE_STYLES[val] || { bg: "bg-white/5", text: "text-white/20" };
              return (
                <div
                  key={c}
                  className={`flex-1 rounded-xl flex items-center justify-center transition-all duration-150 font-display ${
                    val === 0
                      ? "bg-white/5"
                      : `${style.bg} ${style.text} ${style.glow ? `shadow-lg ${style.glow}` : ""} scale-100`
                  }`}
                >
                  {val > 0 && (
                    <span
                      className={`${
                        val > 512
                          ? "text-lg sm:text-xl"
                          : val > 64
                            ? "text-xl sm:text-2xl"
                            : "text-2xl sm:text-3xl"
                      } font-bold`}
                    >
                      {val}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Win / Game Over Overlay */}
        {(gameOver || (won && !keepPlaying)) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 text-center z-20 animate-fade-in">
            {won && !keepPlaying ? (
              <>
                <div className="flex justify-center mb-1 text-amber-400">
                  <GIconTrophy size={36} />
                </div>
                <h4 className="font-display text-xl font-bold text-amber-300 mb-1">You reached 2048!</h4>
                <p className="text-xs text-white/60 mb-4">Legendary puzzle mastery achieved.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setKeepPlaying(true)}
                    className="px-3 py-1.5 rounded-xl bg-accent text-white font-medium text-xs shadow-md shadow-accent/20"
                  >
                    Keep Playing
                  </button>
                  <button
                    onClick={resetGame}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs"
                  >
                    New Game
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4 className="font-display text-xl font-bold text-rose-400 mb-1">Game Over</h4>
                <p className="text-xs text-white/60 mb-3">No more legal moves left on the board.</p>
                <button
                  onClick={resetGame}
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/80 text-white font-medium text-xs shadow-lg shadow-accent/20"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* On-screen controls for mobile & convenience */}
      <div className="mt-3 flex flex-col items-center gap-1">
        <button
          onClick={() => move("up")}
          className="w-10 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center border border-white/5 transition"
        >
          <GIconChevronUp size={16} />
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => move("left")}
            className="w-10 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center border border-white/5 transition"
          >
            <GIconChevronLeft size={16} />
          </button>
          <button
            onClick={() => move("down")}
            className="w-10 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center border border-white/5 transition"
          >
            <GIconChevronDown size={16} />
          </button>
          <button
            onClick={() => move("right")}
            className="w-10 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center border border-white/5 transition"
          >
            <GIconChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

