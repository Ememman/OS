import { useState, useEffect, useRef, useCallback } from "react";
import { soundFx } from "../../../lib/soundFx";
import { useOS } from "../../../store/useOS";
import { API_URL } from "../../../lib/config";
import { getEffectiveChatName, saveChatName } from "../../../lib/chatSession";
import {
  GIconTrophy,
  GIconSliders,
  GIconCheck,
  GIconFlag,
  GIconRotateRight,
  GIconSmile,
} from "../../icons/GravityIcons";

type Difficulty = "beginner" | "intermediate" | "expert";

interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
  label: string;
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: { rows: 9, cols: 9, mines: 10, label: "Beginner (9x9 · 10 mines)" },
  intermediate: { rows: 16, cols: 16, mines: 40, label: "Intermediate (16x16 · 40 mines)" },
  expert: { rows: 16, cols: 30, mines: 99, label: "Expert (16x30 · 99 mines)" },
};

interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  revealed: boolean;
  flagged: boolean;
  neighborMines: number;
  exploded?: boolean;
}

const NUMBER_COLORS: Record<number, string> = {
  1: "text-blue-400 font-bold",
  2: "text-emerald-400 font-bold",
  3: "text-rose-400 font-bold",
  4: "text-purple-400 font-bold",
  5: "text-amber-400 font-bold",
  6: "text-cyan-400 font-bold",
  7: "text-pink-400 font-bold",
  8: "text-red-500 font-black",
};

export default function MinesweeperRetro({ onOpenLeaderboard }: { onOpenLeaderboard?: () => void }) {
  const { systemSounds, notify } = useOS();
  const [diff, setDiff] = useState<Difficulty>("beginner");
  const config = DIFFICULTIES[diff];

  const [grid, setGrid] = useState<Cell[][]>([]);
  const [status, setStatus] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [flagsLeft, setFlagsLeft] = useState(config.mines);
  const [elapsed, setElapsed] = useState(0);
  const [flagMode, setFlagMode] = useState(false); // Mobile friendly flag toggle
  const [faceState, setFaceState] = useState<"normal" | "surprised" | "won" | "lost">("normal");

  // Leaderboard submission dialog
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [playerName, setPlayerName] = useState(() => getEffectiveChatName());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initBoard = useCallback((difficultyKey: Difficulty) => {
    const cfg = DIFFICULTIES[difficultyKey];
    const initialGrid: Cell[][] = [];
    for (let r = 0; r < cfg.rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cfg.cols; c++) {
        row.push({
          row: r,
          col: c,
          isMine: false,
          revealed: false,
          flagged: false,
          neighborMines: 0,
        });
      }
      initialGrid.push(row);
    }
    setGrid(initialGrid);
    setStatus("idle");
    setFlagsLeft(cfg.mines);
    setElapsed(0);
    setFaceState("normal");
    setShowSubmitModal(false);
    setSubmitted(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    initBoard(diff);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [diff, initBoard]);

  // Timer runner
  useEffect(() => {
    if (status === "playing") {
      timerRef.current = setInterval(() => {
        setElapsed((e) => Math.min(999, e + 1));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Place mines ensuring first clicked cell is always safe
  const placeMines = (firstR: number, firstC: number, board: Cell[][]) => {
    const cfg = config;
    let placed = 0;
    while (placed < cfg.mines) {
      const r = Math.floor(Math.random() * cfg.rows);
      const c = Math.floor(Math.random() * cfg.cols);
      // Guarantee safe spot + 3x3 surrounding radius for comfortable start
      const isNeighbor = Math.abs(r - firstR) <= 1 && Math.abs(c - firstC) <= 1;
      if (!board[r][c].isMine && !isNeighbor) {
        board[r][c].isMine = true;
        placed++;
      }
    }

    // Calculate neighboring mine counts
    for (let r = 0; r < cfg.rows; r++) {
      for (let c = 0; c < cfg.cols; c++) {
        if (board[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols) {
              if (board[nr][nc].isMine) count++;
            }
          }
        }
        board[r][c].neighborMines = count;
      }
    }
  };

  // Reveal cell cascade
  const revealCell = (r: number, c: number) => {
    if (status === "won" || status === "lost") return;

    let currentGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    const target = currentGrid[r][c];

    if (target.flagged || target.revealed) return;

    if (systemSounds) soundFx.playClick();

    // First click: generate mines safely
    if (status === "idle") {
      placeMines(r, c, currentGrid);
      setStatus("playing");
    }

    if (target.isMine) {
      // Stepped on a mine!
      target.exploded = true;
      // Reveal all mines
      currentGrid.forEach((row) =>
        row.forEach((cell) => {
          if (cell.isMine) cell.revealed = true;
        })
      );
      setGrid(currentGrid);
      setStatus("lost");
      setFaceState("lost");
      notify("Mine Detonated!", `You survived ${elapsed} seconds in ${config.label}.`, "warning");
      return;
    }

    // Recursive flood fill reveal
    const queue: [number, number][] = [[r, c]];
    target.revealed = true;

    while (queue.length > 0) {
      const [currR, currC] = queue.shift()!;
      const cell = currentGrid[currR][currC];

      if (cell.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = currR + dr;
            const nc = currC + dc;
            if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
              const neighbor = currentGrid[nr][nc];
              if (!neighbor.revealed && !neighbor.flagged && !neighbor.isMine) {
                neighbor.revealed = true;
                if (neighbor.neighborMines === 0) {
                  queue.push([nr, nc]);
                }
              }
            }
          }
        }
      }
    }

    // Check victory condition
    let unrevealedSafeCells = 0;
    currentGrid.forEach((row) =>
      row.forEach((cell) => {
        if (!cell.isMine && !cell.revealed) unrevealedSafeCells++;
      })
    );

    setGrid(currentGrid);

    if (unrevealedSafeCells === 0) {
      setStatus("won");
      setFaceState("won");
      setFlagsLeft(0);
      setShowSubmitModal(true);
      notify("Clear Victory!", `All mines defused in ${elapsed}s! Score synced to leaderboard!`, "success");

      // Auto-submit victory clear time in real-time
      const cleanName = getEffectiveChatName();
      fetch(`${API_URL}/api/games/leaderboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: "minesweeper",
          player: cleanName,
          score: elapsed,
          details: `${config.label.split(" ")[0]} Clear (${elapsed}s)`
        })
      }).then((r) => r.ok && setSubmitted(true)).catch(() => {});
    }
  };

  // Toggle flag
  const toggleFlag = (r: number, c: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (status === "won" || status === "lost") return;

    const currentGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    const target = currentGrid[r][c];

    if (target.revealed) return;

    if (systemSounds) soundFx.playPop();

    if (target.flagged) {
      target.flagged = false;
      setFlagsLeft((f) => f + 1);
    } else {
      if (flagsLeft <= 0) return;
      target.flagged = true;
      setFlagsLeft((f) => f - 1);
    }

    setGrid(currentGrid);
  };

  // Chording: clicking an already revealed cell
  const handleChord = (r: number, c: number) => {
    const cell = grid[r][c];
    if (!cell.revealed || cell.neighborMines === 0) return;

    // Count neighbor flags
    let flagCount = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
          if (grid[nr][nc].flagged) flagCount++;
        }
      }
    }

    if (flagCount === cell.neighborMines) {
      // Reveal unflagged neighbors
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
            if (!grid[nr][nc].revealed && !grid[nr][nc].flagged) {
              revealCell(nr, nc);
            }
          }
        }
      }
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (flagMode) {
      toggleFlag(r, c);
    } else {
      const cell = grid[r][c];
      if (cell.revealed) {
        handleChord(r, c);
      } else {
        revealCell(r, c);
      }
    }
  };

  // Submit high score to backend
  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || submitting || submitted) return;

    setSubmitting(true);
    const cleanName = playerName.trim() || getEffectiveChatName();
    saveChatName(cleanName);
    localStorage.setItem("os_player_name", cleanName);

    try {
      const res = await fetch(`${API_URL}/api/games/leaderboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: "minesweeper",
          player: cleanName,
          score: elapsed,
          details: `${config.label.split(" ")[0]} Clear (${elapsed}s)`
        })
      });

      if (res.ok) {
        setSubmitted(true);
        notify("Score Recorded!", `Your ${elapsed}s record was posted to the Arcade Leaderboard!`, "success");
        if (onOpenLeaderboard) {
          setTimeout(onOpenLeaderboard, 1200);
        }
      } else {
        notify("Submission Error", "Could not submit score to server.", "warning");
      }
    } catch {
      notify("Network Error", "Unable to connect to leaderboard server.", "warning");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-full p-4 select-none">
      {/* Top Controls Bar */}
      <div className="w-full max-w-xl flex flex-wrap items-center justify-between gap-2 mb-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2 backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-xs">
          <GIconSliders size={14} className="text-accent" />
          <span className="text-white/60 font-medium">Difficulty:</span>
          {(["beginner", "intermediate", "expert"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDiff(d)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize transition ${
                diff === d
                  ? "bg-accent text-white shadow-sm"
                  : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Flag Mode Toggle */}
          <button
            onClick={() => {
              if (systemSounds) soundFx.playClick();
              setFlagMode(!flagMode);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 font-medium transition cursor-pointer ${
              flagMode
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-400/50"
                : "bg-white/10 hover:bg-white/15 text-white/80"
            }`}
            title="Toggle click mode between Dig and Flag"
          >
            <GIconFlag size={12} className={flagMode ? "text-white" : "text-rose-400"} />
            <span className="font-semibold">{flagMode ? "Mode: Flag 🚩" : "Mode: Dig ⛏️"}</span>
          </button>

          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="px-2.5 py-1 rounded text-xs flex items-center gap-1 font-medium bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition"
              title="View Global Arcade High Scores"
            >
              <GIconTrophy size={13} />
              <span>Leaderboard</span>
            </button>
          )}
        </div>
      </div>

      {/* Retro Arcade Container */}
      <div className="bg-[#1e2330] p-3 rounded-2xl border-4 border-slate-700/80 shadow-2xl inline-flex flex-col items-center max-w-full overflow-x-auto thin-scroll">
        {/* Header: LED Mines Count, Smiley Face, LED Timer */}
        <div className="w-full flex items-center justify-between px-3 py-2 mb-3 bg-[#11141c] rounded-xl border border-white/10">
          {/* Mines remaining counter */}
          <div className="bg-black/80 px-3 py-1 rounded border border-rose-950 font-mono text-xl font-black text-rose-500 tracking-widest shadow-inner">
            {String(Math.max(-99, flagsLeft)).padStart(3, "0")}
          </div>

          {/* Reset / Status Button */}
          <button
            onClick={() => initBoard(diff)}
            onMouseDown={() => setFaceState("surprised")}
            onMouseUp={() => setFaceState(status === "won" ? "won" : status === "lost" ? "lost" : "normal")}
            className="w-10 h-10 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 active:scale-95 flex items-center justify-center shadow-lg border-2 border-amber-600 transition text-slate-900 cursor-pointer"
            title="Click to Restart"
          >
            {faceState === "won" ? (
              <GIconTrophy size={20} className="text-slate-900" />
            ) : faceState === "lost" ? (
              <GIconRotateRight size={20} className="text-slate-900" />
            ) : (
              <GIconSmile size={20} className="text-slate-900" />
            )}
          </button>

          {/* Elapsed Timer */}
          <div className="bg-black/80 px-3 py-1 rounded border border-rose-950 font-mono text-xl font-black text-rose-500 tracking-widest shadow-inner">
            {String(elapsed).padStart(3, "0")}
          </div>
        </div>

        {/* Minesweeper Grid */}
        <div
          className="grid gap-[2px] bg-slate-900/90 p-2 rounded-xl border border-white/10 select-none"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isRevealed = cell.revealed;
              const isMine = cell.isMine;
              const isExploded = cell.exploded;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => toggleFlag(r, c, e)}
                  disabled={status === "won" || (status === "lost" && !cell.isMine)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-mono font-bold transition-all rounded-[4px] cursor-pointer ${
                    isRevealed
                      ? isMine
                        ? isExploded
                          ? "bg-rose-600 text-white shadow-inner scale-95"
                          : "bg-rose-950/80 text-rose-400"
                        : "bg-[#161a23] shadow-inner text-white"
                      : "bg-[#2d3446] hover:bg-[#394258] active:bg-[#202533] border-t-2 border-l-2 border-white/20 border-b-2 border-r-2 border-black/40 shadow-sm"
                  }`}
                >
                  {isRevealed ? (
                    isMine ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
                    ) : cell.neighborMines > 0 ? (
                      <span className={NUMBER_COLORS[cell.neighborMines]}>
                        {cell.neighborMines}
                      </span>
                    ) : null
                  ) : cell.flagged ? (
                    <GIconFlag size={13} className="text-rose-400 drop-shadow" />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Game Over / Victory Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c2230] border border-white/15 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="flex justify-center mb-2 text-amber-400">
              <GIconTrophy size={42} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Minefield Cleared!</h3>
            <p className="text-white/60 text-xs mb-4">
              You defused all mines in <span className="text-emerald-400 font-bold">{elapsed}s</span> on{" "}
              <span className="text-accent font-semibold">{config.label.split(" ")[0]}</span>!
            </p>

            {submitted ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-center gap-2">
                <GIconCheck size={16} />
                <span>Score posted to Global Leaderboard!</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitScore} className="space-y-3">
                <div className="text-left">
                  <label className="text-[11px] font-medium text-white/70 block mb-1">Your Pilot Call-Sign:</label>
                  <input
                    type="text"
                    maxLength={20}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter call-sign"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-accent"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 py-2 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-white/70 transition"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-accent hover:bg-accent/80 text-white shadow-lg shadow-accent/20 transition flex items-center justify-center gap-1.5"
                  >
                    {submitting ? "Posting..." : "Post Record"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
