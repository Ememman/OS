import { useState, useEffect, useCallback, useRef } from "react";
import { useOS } from "../../../store/useOS";
import { API_URL } from "../../../lib/config";
import { getEffectiveChatName, saveChatName } from "../../../lib/chatSession";
import {
  GIconRotateRight,
  GIconTrophy,
  GIconChevronUp,
  GIconChevronDown,
  GIconChevronLeft,
  GIconChevronRight,
  GIconCheck,
  GIconUndo,
  GIconSparkles,
  GIconVolume,
  GIconVolumeMute,
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

function spawnRandomTile(board: Board): { board: Board; pos: [number, number] | null } {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return { board, pos: null };
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = board.map((row) => [...row]);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return { board: next, pos: [r, c] };
}

function slideRow(row: number[]): { newRow: number[]; scoreGained: number; mergedIndices: number[] } {
  const filtered = row.filter((v) => v !== 0);
  const result: number[] = [];
  const mergedIndices: number[] = [];
  let scoreGained = 0;

  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
      const mergedVal = filtered[i] * 2;
      result.push(mergedVal);
      scoreGained += mergedVal;
      mergedIndices.push(result.length - 1);
      i++; // skip next
    } else {
      result.push(filtered[i]);
    }
  }

  while (result.length < SIZE) {
    result.push(0);
  }

  return { newRow: result, scoreGained, mergedIndices };
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

const TILE_STYLES: Record<number, { bg: string; text: string; glow?: string; border?: string }> = {
  2: { bg: "bg-white/10", text: "text-white/90", border: "border-white/10" },
  4: { bg: "bg-white/20", text: "text-white font-semibold", border: "border-white/20" },
  8: { bg: "bg-amber-500/85", text: "text-white font-bold", glow: "shadow-amber-500/30", border: "border-amber-400/40" },
  16: { bg: "bg-orange-500/85", text: "text-white font-bold", glow: "shadow-orange-500/40", border: "border-orange-400/40" },
  32: { bg: "bg-rose-500/85", text: "text-white font-bold", glow: "shadow-rose-500/40", border: "border-rose-400/40" },
  64: { bg: "bg-rose-600/90", text: "text-white font-black", glow: "shadow-rose-600/50", border: "border-rose-400/50" },
  128: { bg: "bg-yellow-500/95", text: "text-slate-950 font-black", glow: "shadow-yellow-500/60 ring-1 ring-yellow-300/50", border: "border-yellow-300" },
  256: { bg: "bg-yellow-400", text: "text-slate-950 font-black", glow: "shadow-yellow-400/70 ring-2 ring-yellow-200/60", border: "border-yellow-200" },
  512: { bg: "bg-emerald-500", text: "text-white font-black", glow: "shadow-emerald-500/70 ring-2 ring-emerald-300/60", border: "border-emerald-300" },
  1024: { bg: "bg-cyan-500", text: "text-white font-black", glow: "shadow-cyan-500/80 ring-2 ring-cyan-300/70", border: "border-cyan-200" },
  2048: { bg: "bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-600", text: "text-white font-black", glow: "shadow-violet-500/90 ring-2 ring-amber-300 animate-pulse", border: "border-amber-300" },
  4096: { bg: "bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600", text: "text-white font-black", glow: "shadow-fuchsia-500/90 ring-2 ring-fuchsia-300", border: "border-fuchsia-300" },
};

// Procedural Audio Engine for 2048
function use2048Audio(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    if (!enabled || typeof window === "undefined") return null;
    if (!ctxRef.current) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        ctxRef.current = new AudioContextClass();
      } catch {
        return null;
      }
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  };

  const tone = (freq: number, dur: number, type: OscillatorType = "sine", gainVal = 0.08) => {
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      const t = ctx.currentTime;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(gainVal, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
    } catch {}
  };

  return {
    slide: () => tone(240, 0.06, "triangle", 0.05),
    merge: (maxMerged: number) => {
      // Ascending pitch based on merged tile tier
      const baseFreq = Math.min(300 + Math.log2(maxMerged) * 75, 1200);
      tone(baseFreq, 0.14, "triangle", 0.08);
      tone(baseFreq * 1.25, 0.18, "sine", 0.06);
    },
    win: () => {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        setTimeout(() => tone(f, 0.3, "sine", 0.1), i * 100);
      });
    },
    undo: () => tone(200, 0.09, "sine", 0.06),
  };
}

export default function Game2048() {
  const { notify } = useOS();
  const [board, setBoard] = useState<Board>(() => {
    let b = createEmptyBoard();
    b = spawnRandomTile(b).board;
    b = spawnRandomTile(b).board;
    return b;
  });

  const [history, setHistory] = useState<{ board: Board; score: number }[]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    return Number(localStorage.getItem("os_2048_best") || 0);
  });
  const [scoreDelta, setScoreDelta] = useState<{ id: number; val: number } | null>(null);
  const [mergedCoords, setMergedCoords] = useState<Set<string>>(new Set());
  const [spawnedCoord, setSpawnedCoord] = useState<string | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem("os_2048_sound") !== "off");

  const [playerName, setPlayerName] = useState(() => getEffectiveChatName());
  const [submittingScore, setSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const syncTimerRef = useRef<any>(null);
  const sfx = use2048Audio(soundOn);

  useEffect(() => {
    localStorage.setItem("os_2048_sound", soundOn ? "on" : "off");
  }, [soundOn]);

  const syncScoreToBackend = useCallback(async (scoreToSync: number) => {
    if (scoreToSync <= 0) return;
    const cleanName = playerName.trim() || getEffectiveChatName();
    saveChatName(cleanName);
    localStorage.setItem("os_player_name", cleanName);

    const maxTile = Math.max(...board.flat(), 0);

    try {
      const res = await fetch(`${API_URL}/api/games/leaderboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: "2048",
          player: cleanName,
          score: scoreToSync,
          details: `Max Tile: ${maxTile}`,
        }),
      });
      if (res.ok) {
        setScoreSubmitted(true);
      }
    } catch {}
  }, [board, playerName]);

  // Real-time automatic score syncing to global leaderboard as the user plays
  useEffect(() => {
    if (score > 0) {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        syncScoreToBackend(score);
      }, 1000);
    }
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [score, syncScoreToBackend]);

  // Immediate sync on Game Over or Reaching 2048
  useEffect(() => {
    if ((gameOver || won) && score > 0) {
      syncScoreToBackend(score);
    }
  }, [gameOver, won, score, syncScoreToBackend]);

  const resetGame = () => {
    if (score > 0) syncScoreToBackend(score);
    sfx.slide();
    let b = createEmptyBoard();
    b = spawnRandomTile(b).board;
    b = spawnRandomTile(b).board;
    setBoard(b);
    setHistory([]);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
    setScoreSubmitted(false);
    setMergedCoords(new Set());
    setSpawnedCoord(null);
  };

  const undoMove = useCallback(() => {
    if (history.length === 0 || gameOver) return;
    sfx.undo();
    const prev = history[history.length - 1];
    setBoard(prev.board);
    setScore(prev.score);
    setHistory((h) => h.slice(0, -1));
    setMergedCoords(new Set());
    setSpawnedCoord(null);
  }, [history, gameOver, sfx]);

  const handleSubmitScore = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submittingScore || score <= 0) return;

    setSubmittingScore(true);
    const cleanName = playerName.trim() || getEffectiveChatName();
    saveChatName(cleanName);
    localStorage.setItem("os_player_name", cleanName);

    await syncScoreToBackend(score);
    setSubmittingScore(false);
    notify("Score Posted!", `Your 2048 score of ${score} is live on the leaderboard!`, "success");
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
      let maxMergedVal = 0;
      const nextBoard: Board = [];

      for (let r = 0; r < SIZE; r++) {
        const { newRow, scoreGained, mergedIndices } = slideRow(current[r]);
        nextBoard.push(newRow);
        totalScoreGained += scoreGained;
        if (mergedIndices.length > 0) {
          anyMerged = true;
          mergedIndices.forEach((c) => {
            if (newRow[c] > maxMergedVal) maxMergedVal = newRow[c];
          });
        }
      }

      current = nextBoard;
      for (let i = 0; i < (4 - rotations) % 4; i++) {
        current = rotateBoard(current);
      }

      if (!boardsEqual(board, current)) {
        // Save history for Undo
        setHistory((prev) => [...prev.slice(-4), { board: board.map((r) => [...r]), score }]);

        if (anyMerged) {
          sfx.merge(maxMergedVal);
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(15);
          }
        } else {
          sfx.slide();
        }

        const { board: withSpawn, pos: spawnPos } = spawnRandomTile(current);
        setBoard(withSpawn);

        if (spawnPos) {
          setSpawnedCoord(`${spawnPos[0]}-${spawnPos[1]}`);
          setTimeout(() => setSpawnedCoord(null), 250);
        }

        const newScore = score + totalScoreGained;
        setScore(newScore);
        if (totalScoreGained > 0) {
          setScoreDelta({ id: Date.now(), val: totalScoreGained });
          setTimeout(() => setScoreDelta(null), 700);
        }

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
                sfx.win();
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
    [board, score, bestScore, gameOver, won, keepPlaying, sfx]
  );

  // Keyboard navigation (Arrow keys + WASD)
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
      } else if (e.code === "KeyZ" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        undoMove();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move, undoMove]);

  // Touch swipe handling with non-passive cancelation
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

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 24) {
      if (dx > 0) move("right");
      else move("left");
    } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 24) {
      if (dy > 0) move("down");
      else move("up");
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-between h-full p-3 sm:p-4 select-none touch-none bg-black/30 text-white overflow-y-auto thin-scroll gap-2"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header & Scoreboard */}
      <div className="w-full max-w-[min(90vw,330px)] flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-display text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
            2048
          </h3>
          <p className="text-[10px] text-white/50">Merge tiles to hit 2048!</p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Current Score with Popup Delta */}
          <div className="relative bg-white/10 px-3 py-1.5 rounded-xl text-center min-w-[56px] border border-white/10 shadow-sm">
            <div className="text-[9px] uppercase tracking-wider text-white/50 font-semibold">Score</div>
            <div className="font-mono font-bold text-sm text-white">{score}</div>
            {scoreDelta && (
              <span className="absolute -top-3 right-1/2 translate-x-1/2 px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-mono text-[10px] font-black animate-bounce shadow-md">
                +{scoreDelta.val}
              </span>
            )}
          </div>

          {/* Best Score */}
          <div className="bg-white/10 px-3 py-1.5 rounded-xl text-center min-w-[56px] border border-white/10 shadow-sm">
            <div className="text-[9px] uppercase tracking-wider text-amber-400 font-semibold flex items-center justify-center gap-0.5">
              <GIconTrophy size={10} /> Best
            </div>
            <div className="font-mono font-bold text-sm text-amber-300">{bestScore}</div>
          </div>

          {/* Controls: Audio, Undo, Restart */}
          <div className="flex flex-col gap-1 ml-0.5">
            <div className="flex gap-1">
              <button
                onClick={() => setSoundOn(!soundOn)}
                title={soundOn ? "Mute" : "Unmute"}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition cursor-pointer text-white/70 hover:text-white"
              >
                {soundOn ? <GIconVolume size={13} /> : <GIconVolumeMute size={13} className="text-white/40" />}
              </button>
              <button
                onClick={undoMove}
                disabled={history.length === 0}
                title="Undo Move (Ctrl+Z)"
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition cursor-pointer text-white/70 hover:text-white disabled:opacity-25"
              >
                <GIconUndo size={13} />
              </button>
              <button
                onClick={resetGame}
                title="Restart Game"
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition cursor-pointer text-white/70 hover:text-white"
              >
                <GIconRotateRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4x4 Responsive Grid Board */}
      <div
        className="relative w-full max-w-[min(90vw,330px)] aspect-square bg-[#0d1220]/90 p-2 sm:p-2.5 rounded-2xl border-2 border-white/15 shadow-2xl flex flex-col justify-between shrink-0 touch-none"
        style={{ touchAction: "none" }}
      >
        {board.map((row, r) => (
          <div key={r} className="flex justify-between h-[23%] gap-2">
            {row.map((val, c) => {
              const key = `${r}-${c}`;
              const style = TILE_STYLES[val] || { bg: "bg-white/5", text: "text-white/20", border: "border-white/5" };
              const isSpawned = spawnedCoord === key;
              const isMerged = mergedCoords.has(key);

              return (
                <div
                  key={c}
                  className={`flex-1 rounded-xl flex items-center justify-center transition-all duration-150 font-display relative overflow-hidden select-none border ${
                    val === 0
                      ? "bg-white/[0.03] border-white/5"
                      : `${style.bg} ${style.text} ${style.border || "border-white/10"} ${
                          style.glow ? `shadow-lg ${style.glow}` : ""
                        } ${isSpawned ? "scale-105 animate-in zoom-in duration-200" : ""} ${
                          isMerged ? "scale-110" : "scale-100"
                        }`
                  }`}
                >
                  {val > 0 && (
                    <>
                      <span
                        className={`${
                          val > 512
                            ? "text-base sm:text-lg"
                            : val > 64
                            ? "text-lg sm:text-xl"
                            : "text-xl sm:text-2xl"
                        } font-black drop-shadow-sm`}
                      >
                        {val}
                      </span>
                      {/* Gloss highlight */}
                      <div className="absolute inset-x-0 top-0 h-1/3 bg-white/15 rounded-t-xl pointer-events-none" />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Win / Game Over Overlay */}
        {(gameOver || (won && !keepPlaying)) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-4 text-center z-20 animate-in fade-in duration-200">
            {won && !keepPlaying ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center mx-auto mb-2 text-amber-300">
                  <GIconSparkles size={24} />
                </div>
                <h4 className="font-display text-lg font-black text-amber-300 mb-0.5">2048 Master!</h4>
                <p className="text-xs text-white/60 mb-2">
                  Final Score: <span className="text-accent font-bold font-mono">{score}</span>
                </p>

                {score > 0 && !scoreSubmitted && (
                  <form onSubmit={handleSubmitScore} className="my-2 w-full max-w-[220px] space-y-1.5">
                    <input
                      type="text"
                      maxLength={18}
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Player call-sign"
                      className="w-full px-2.5 py-1.5 bg-black/40 border border-white/20 rounded-xl text-white text-xs outline-none text-center focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/40 transition-all font-mono"
                    />
                    <button
                      type="submit"
                      disabled={submittingScore}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-amber-500/20"
                    >
                      <GIconTrophy size={13} />
                      <span>{submittingScore ? "Posting..." : "Post to Leaderboard"}</span>
                    </button>
                  </form>
                )}

                {scoreSubmitted && (
                  <div className="my-2 py-1.5 px-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-center gap-1 font-medium">
                    <GIconCheck size={13} />
                    <span>Score posted to Leaderboard!</span>
                  </div>
                )}

                <div className="flex gap-2 mt-2 w-full max-w-[220px]">
                  <button
                    onClick={() => setKeepPlaying(true)}
                    className="flex-1 py-2 rounded-xl bg-accent text-white font-bold text-xs shadow-md shadow-accent/25 hover:brightness-110 active:scale-95 transition cursor-pointer"
                  >
                    Keep Playing
                  </button>
                  <button
                    onClick={resetGame}
                    className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/10 transition cursor-pointer"
                  >
                    New Game
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4 className="font-display text-lg font-bold text-rose-400 mb-0.5">No More Moves!</h4>
                <p className="text-xs text-white/60 mb-2">
                  Final Score: <span className="text-accent font-bold font-mono">{score}</span>
                </p>

                {score > 0 && !scoreSubmitted && (
                  <form onSubmit={handleSubmitScore} className="my-2 w-full max-w-[220px] space-y-1.5">
                    <input
                      type="text"
                      maxLength={18}
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Player call-sign"
                      className="w-full px-2.5 py-1.5 bg-black/40 border border-white/20 rounded-xl text-white text-xs outline-none text-center focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/40 transition-all font-mono"
                    />
                    <button
                      type="submit"
                      disabled={submittingScore}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-amber-500/20"
                    >
                      <GIconTrophy size={13} />
                      <span>{submittingScore ? "Posting..." : "Post to Leaderboard"}</span>
                    </button>
                  </form>
                )}

                {scoreSubmitted && (
                  <div className="my-2 py-1.5 px-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-center gap-1 font-medium">
                    <GIconCheck size={13} />
                    <span>Score posted to Leaderboard!</span>
                  </div>
                )}

                <button
                  onClick={resetGame}
                  className="w-full max-w-[220px] mt-2 py-2.5 rounded-xl bg-accent hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-lg shadow-accent/25 transition cursor-pointer"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tactile D-pad Navigation for Mouse & Touch */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <button
          onClick={() => move("up")}
          className="w-11 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center border border-white/10 transition cursor-pointer shadow-sm text-white/80 hover:text-white"
          title="Move Up (W / ↑)"
        >
          <GIconChevronUp size={18} />
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => move("left")}
            className="w-11 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center border border-white/10 transition cursor-pointer shadow-sm text-white/80 hover:text-white"
            title="Move Left (A / ←)"
          >
            <GIconChevronLeft size={18} />
          </button>
          <button
            onClick={() => move("down")}
            className="w-11 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center border border-white/10 transition cursor-pointer shadow-sm text-white/80 hover:text-white"
            title="Move Down (S / ↓)"
          >
            <GIconChevronDown size={18} />
          </button>
          <button
            onClick={() => move("right")}
            className="w-11 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center border border-white/10 transition cursor-pointer shadow-sm text-white/80 hover:text-white"
            title="Move Right (D / →)"
          >
            <GIconChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
