import { useCallback, useEffect, useRef, useState } from "react";
import { GIconRotateLeft, GIconTrophy, GIconVolume, GIconVolumeMute, GIconCheck, GIconSparkles } from "../../icons/GravityIcons";
import { API_URL } from "../../../lib/config";
import { getEffectiveChatName, saveChatName } from "../../../lib/chatSession";
import { useOS } from "../../../store/useOS";

const SIZE = 8;
const COLORS = [
  "#e8543f", // Crimson
  "#00c49f", // Emerald / Mint
  "#8b5cf6", // Purple / Violet
  "#f59e0b", // Amber / Gold
  "#ec4899", // Pink
  "#0ea5e9", // Sky Blue
  "#10b981", // Lime
];

const SHAPES = [
  [[0, 0]], // 1x1
  [[0, 0], [0, 1]], // 1x2
  [[0, 0], [1, 0]], // 2x1
  [[0, 0], [0, 1], [0, 2]], // 1x3
  [[0, 0], [1, 0], [2, 0]], // 3x1
  [[0, 0], [0, 1], [0, 2], [0, 3]], // 1x4
  [[0, 0], [1, 0], [2, 0], [3, 0]], // 4x1
  [[0, 0], [0, 1], [1, 0], [1, 1]], // 2x2 Square
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], // 3x3 Big Block
  [[0, 0], [0, 1], [0, 2], [1, 0]], // L-shape
  [[0, 0], [0, 1], [0, 2], [1, 2]], // J-shape
  [[0, 0], [1, 0], [2, 0], [2, 1]], // L-tall
  [[0, 1], [1, 1], [2, 1], [2, 0]], // J-tall
  [[0, 0], [1, 0], [1, 1], [2, 1]], // Z-shape
  [[0, 1], [1, 0], [1, 1], [2, 0]], // S-shape
  [[0, 0], [0, 1], [0, 2], [1, 1]], // T-shape
];

interface Piece {
  id: number;
  shape: number[][];
  color: string;
}

function randomPiece(id: number): Piece {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { id, shape, color };
}

function emptyGrid(): (string | null)[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

function canPlace(grid: (string | null)[][], shape: number[][], r: number, c: number): boolean {
  return shape.every(([dr, dc]) => {
    const rr = r + dr;
    const cc = c + dc;
    return rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && !grid[rr][cc];
  });
}

function pieceFitsSomewhere(grid: (string | null)[][], shape: number[][]): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (canPlace(grid, shape, r, c)) return true;
    }
  }
  return false;
}

// Synthetic Web Audio API Sound Effects Engine
function useGameAudio(enabled: boolean) {
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

  const tone = (freq: number, dur: number, type: OscillatorType = "sine", startGain = 0.08, delay = 0) => {
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      const t0 = ctx.currentTime + delay;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(startGain, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur);
    } catch {}
  };

  return {
    pick: () => {
      tone(440, 0.06, "sine", 0.04);
      tone(554.37, 0.08, "sine", 0.05, 0.02);
    },
    place: () => {
      tone(340, 0.09, "triangle", 0.09);
      tone(180, 0.12, "sine", 0.07, 0.02);
    },
    clear: (combo = 0) => {
      const base = 520 + Math.min(combo * 60, 300);
      const notes = [base, base * 1.25, base * 1.5, base * 2];
      notes.forEach((freq, i) => {
        tone(freq, 0.22, "sine", 0.09, i * 0.05);
      });
    },
    combo: () => {
      tone(659.25, 0.15, "triangle", 0.1);
      tone(880, 0.2, "sine", 0.12, 0.06);
      tone(1046.5, 0.3, "sine", 0.14, 0.12);
    },
    snapBack: () => {
      tone(260, 0.08, "sine", 0.03);
    },
    gameOver: () => {
      tone(320, 0.25, "sawtooth", 0.08);
      tone(240, 0.3, "sawtooth", 0.08, 0.12);
      tone(180, 0.45, "sawtooth", 0.08, 0.24);
    },
  };
}

export default function BlockBlast() {
  const { notify } = useOS();
  const [grid, setGrid] = useState<(string | null)[][]>(emptyGrid());
  const [tray, setTray] = useState<(Piece | null)[]>(() => [randomPiece(1), randomPiece(2), randomPiece(3)]);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(() => Number(localStorage.getItem("blockblast_best") || 0));
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const [comboCount, setComboCount] = useState(0);
  const [comboBanner, setComboBanner] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem("blockblast_sound") !== "off");
  const [dropCells, setDropCells] = useState<Set<string>>(new Set());
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
  const [popups, setPopups] = useState<{ id: number; text: string; r: number; c: number; big: boolean }[]>([]);
  const [shake, setShake] = useState(false);

  // Leaderboard states
  const [playerName, setPlayerName] = useState(() => getEffectiveChatName());
  const [submittingScore, setSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const nextId = useRef(4);
  const popupId = useRef(0);
  const sfx = useGameAudio(soundOn);
  const boardRef = useRef<HTMLDivElement | null>(null);

  // ----------------------------------------------------
  // DRAG & DROP INTERACTION SYSTEM
  // ----------------------------------------------------
  interface ActiveDrag {
    index: number;
    piece: Piece;
    pointerX: number;
    pointerY: number;
    targetR: number | null;
    targetC: number | null;
    isValid: boolean;
    isTouch: boolean;
  }
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const activeDragRef = useRef<ActiveDrag | null>(null);
  activeDragRef.current = activeDrag;

  useEffect(() => {
    localStorage.setItem("blockblast_sound", soundOn ? "on" : "off");
  }, [soundOn]);

  const refillIfNeeded = useCallback((newTray: (Piece | null)[]) => {
    if (newTray.every((p) => p === null)) {
      return [
        randomPiece(nextId.current++),
        randomPiece(nextId.current++),
        randomPiece(nextId.current++),
      ];
    }
    return newTray;
  }, []);

  // Check Game Over condition
  useEffect(() => {
    if (gameOver) return;
    const anyFits = tray.some((p) => p && pieceFitsSomewhere(grid, p.shape));
    if (tray.some((p) => p) && !anyFits) {
      setGameOver(true);
      sfx.gameOver();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([40, 60, 80]);
      }
    }
  }, [grid, tray, gameOver, sfx]);

  // Execute placement of a piece at grid coordinate (r, c)
  const placePieceAt = useCallback((pieceIndex: number, r: number, c: number) => {
    const piece = tray[pieceIndex];
    if (!piece || gameOver) return false;
    if (!canPlace(grid, piece.shape, r, c)) return false;

    const next = grid.map((row) => [...row]);
    const justDropped = new Set<string>();
    piece.shape.forEach(([dr, dc]) => {
      next[r + dr][c + dc] = piece.color;
      justDropped.add(`${r + dr}-${c + dc}`);
    });

    sfx.place();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
    setDropCells(justDropped);
    setTimeout(() => setDropCells(new Set()), 220);

    // Check full rows and full columns
    const fullRows: number[] = [];
    const fullCols: number[] = [];
    for (let i = 0; i < SIZE; i++) {
      if (next[i].every(Boolean)) fullRows.push(i);
      if (next.every((row) => row[i])) fullCols.push(i);
    }
    const cleared = fullRows.length + fullCols.length;

    let newTray = [...tray];
    newTray[pieceIndex] = null;
    newTray = refillIfNeeded(newTray);
    setTray(newTray);
    setSelected(null);
    setHover(null);

    if (cleared > 0) {
      const newCombo = comboCount + 1;
      setComboCount(newCombo);

      const comboMultiplier = newCombo > 1 ? newCombo * 10 : 0;
      const gained = piece.shape.length * 4 + cleared * 24 + comboMultiplier;

      const clearSet = new Set<string>();
      fullRows.forEach((r2) => { for (let c2 = 0; c2 < SIZE; c2++) clearSet.add(`${r2}-${c2}`); });
      fullCols.forEach((c2) => { for (let r2 = 0; r2 < SIZE; r2++) clearSet.add(`${r2}-${c2}`); });

      setGrid(next);
      setClearingCells(clearSet);
      sfx.clear(newCombo);
      setShake(true);
      setTimeout(() => setShake(false), 240);

      // Trigger combo banner
      if (newCombo >= 2) {
        const text = newCombo >= 4 ? `MEGA BLAST x${newCombo}!` : newCombo === 3 ? "SUPER COMBO x3!" : "COMBO x2!";
        setComboBanner(text);
        setTimeout(() => setComboBanner(null), 1200);
      }

      setTimeout(() => {
        const finalGrid = next.map((row) => [...row]);
        fullRows.forEach((r2) => { for (let c2 = 0; c2 < SIZE; c2++) finalGrid[r2][c2] = null; });
        fullCols.forEach((c2) => { for (let r2 = 0; r2 < SIZE; r2++) finalGrid[r2][c2] = null; });
        setGrid(finalGrid);
        setClearingCells(new Set());
      }, 240);

      const newScore = score + gained;
      setScore(newScore);
      if (newScore > best) {
        setBest(newScore);
        localStorage.setItem("blockblast_best", String(newScore));
      }

      const id = popupId.current++;
      setPopups((p) => [...p, { id, text: `+${gained}`, r, c, big: true }]);
      setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), 700);
    } else {
      setGrid(next);
      setComboCount(0);
      const gained = piece.shape.length * 4;
      const newScore = score + gained;
      setScore(newScore);
      if (newScore > best) {
        setBest(newScore);
        localStorage.setItem("blockblast_best", String(newScore));
      }

      const id = popupId.current++;
      setPopups((p) => [...p, { id, text: `+${gained}`, r, c, big: false }]);
      setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), 700);
    }

    return true;
  }, [tray, grid, gameOver, comboCount, score, best, refillIfNeeded, sfx]);

  // Compute grid cell from client coordinates
  const calculateGridTarget = useCallback((clientX: number, clientY: number, shape: number[][], isTouch: boolean) => {
    if (!boardRef.current) return { r: null, c: null, isValid: false };
    const rect = boardRef.current.getBoundingClientRect();
    const cellSize = rect.width / SIZE;

    // Offset on touch so piece floats above finger, easily visible
    const touchOffsetY = isTouch ? -54 : -18;
    const adjustedY = clientY + touchOffsetY;

    // Calculate piece dimensions to center it under pointer
    const maxR = Math.max(...shape.map((s) => s[0]));
    const maxC = Math.max(...shape.map((s) => s[1]));
    const pieceCenterOffsetX = (maxC * cellSize) / 2;
    const pieceCenterOffsetY = (maxR * cellSize) / 2;

    const rawCol = Math.round((clientX - rect.left - pieceCenterOffsetX) / cellSize);
    const rawRow = Math.round((adjustedY - rect.top - pieceCenterOffsetY) / cellSize);

    const r = Math.max(0, Math.min(SIZE - 1, rawRow));
    const c = Math.max(0, Math.min(SIZE - 1, rawCol));

    const isValid = canPlace(grid, shape, r, c);
    return { r, c, isValid };
  }, [grid]);

  // Handle pointer down on tray piece to start dragging
  const handlePiecePointerDown = (e: React.PointerEvent, pieceIndex: number) => {
    const piece = tray[pieceIndex];
    if (!piece || gameOver) return;

    e.preventDefault();
    const isTouch = e.pointerType === "touch";
    sfx.pick();
    setSelected(pieceIndex);

    const target = calculateGridTarget(e.clientX, e.clientY, piece.shape, isTouch);

    setActiveDrag({
      index: pieceIndex,
      piece,
      pointerX: e.clientX,
      pointerY: e.clientY,
      targetR: target.r,
      targetC: target.c,
      isValid: target.isValid,
      isTouch,
    });

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const current = activeDragRef.current;
      if (!current) return;

      const newTarget = calculateGridTarget(moveEvent.clientX, moveEvent.clientY, current.piece.shape, current.isTouch);
      setActiveDrag({
        ...current,
        pointerX: moveEvent.clientX,
        pointerY: moveEvent.clientY,
        targetR: newTarget.r,
        targetC: newTarget.c,
        isValid: newTarget.isValid,
      });
      if (newTarget.r !== null && newTarget.c !== null) {
        setHover({ r: newTarget.r, c: newTarget.c });
      } else {
        setHover(null);
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      const current = activeDragRef.current;
      if (current && current.targetR !== null && current.targetC !== null && current.isValid) {
        placePieceAt(current.index, current.targetR, current.targetC);
      } else {
        sfx.snapBack();
      }

      setActiveDrag(null);
      setHover(null);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  // Sync score to backend
  const syncTimerRef = useRef<any>(null);
  const syncScoreToBackend = useCallback(async (scoreToSync: number) => {
    if (scoreToSync <= 0) return;
    const cleanName = playerName.trim() || getEffectiveChatName();
    saveChatName(cleanName);
    localStorage.setItem("os_player_name", cleanName);

    try {
      const res = await fetch(`${API_URL}/api/games/leaderboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: "blockblast",
          player: cleanName,
          score: scoreToSync,
          details: `${scoreToSync} pts · Best ${Math.max(scoreToSync, best)}`,
          time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          ts: Date.now(),
        }),
      });
      if (res.ok) setScoreSubmitted(true);
    } catch {}
  }, [playerName, best]);

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

  useEffect(() => {
    if (gameOver && score > 0) {
      syncScoreToBackend(score);
    }
  }, [gameOver, score, syncScoreToBackend]);

  const reset = () => {
    if (score > 0) syncScoreToBackend(score);
    setGrid(emptyGrid());
    setTray([randomPiece(nextId.current++), randomPiece(nextId.current++), randomPiece(nextId.current++)]);
    setSelected(null);
    setHover(null);
    setActiveDrag(null);
    setScore(0);
    setComboCount(0);
    setComboBanner(null);
    setGameOver(false);
    setScoreSubmitted(false);
    setClearingCells(new Set());
    setDropCells(new Set());
    setPopups([]);
    sfx.place();
  };

  const handleSubmitScore = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submittingScore || score <= 0) return;

    setSubmittingScore(true);
    const cleanName = playerName.trim() || getEffectiveChatName();
    saveChatName(cleanName);
    localStorage.setItem("os_player_name", cleanName);

    await syncScoreToBackend(score);
    setSubmittingScore(false);
    notify("Score Posted!", `Your Block Blast score of ${score} is live on the leaderboard!`, "success");
  };

  // Compute preview cells when dragging or hovering
  const activePiece = activeDrag ? activeDrag.piece : (selected !== null ? tray[selected] : null);
  const activeAnchor = activeDrag && activeDrag.targetR !== null && activeDrag.targetC !== null
    ? { r: activeDrag.targetR, c: activeDrag.targetC }
    : hover;

  const previewCells = new Set<string>();
  let validPlacement = false;

  if (activePiece && activeAnchor) {
    validPlacement = canPlace(grid, activePiece.shape, activeAnchor.r, activeAnchor.c);
    activePiece.shape.forEach(([dr, dc]) => {
      const rr = activeAnchor.r + dr;
      const cc = activeAnchor.c + dc;
      if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) {
        previewCells.add(`${rr}-${cc}`);
      }
    });
  }

  return (
    <div className="p-3 sm:p-4 flex flex-col items-center justify-between gap-2 sm:gap-3 select-none h-full overflow-y-auto thin-scroll relative">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full max-w-[min(90vw,340px)] text-sm shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Score</div>
            <div className="font-display font-bold text-xl tabular-nums text-white">{score}</div>
          </div>
          {comboCount > 1 && (
            <div className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono text-xs font-bold animate-pulse">
              x{comboCount}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-white/70">
          <GIconTrophy size={14} className="text-amber-400" />
          <span className="font-mono text-xs font-semibold">{best}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSoundOn((s) => !s)}
            className="p-1.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-white/70 hover:text-white"
            title={soundOn ? "Mute" : "Unmute"}
          >
            {soundOn ? <GIconVolume size={16} /> : <GIconVolumeMute size={16} className="text-white/40" />}
          </button>
          <button
            onClick={reset}
            className="p-1.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-white/70 hover:text-white"
            title="Restart Game"
          >
            <GIconRotateLeft size={16} />
          </button>
        </div>
      </div>

      {/* Combo Banner Animation */}
      {comboBanner && (
        <div className="absolute top-12 z-30 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-display font-black text-xs shadow-xl shadow-amber-500/40 animate-bounce tracking-wider uppercase">
          {comboBanner}
        </div>
      )}

      {/* 8x8 Board Container */}
      <div
        ref={boardRef}
        className={`relative grid gap-[3.5px] p-2.5 rounded-2xl bg-[#0c101c]/90 border-2 border-white/15 shadow-2xl transition-transform w-full max-w-[min(90vw,340px)] aspect-square shrink-0 ${
          shake ? "bb-shake" : ""
        }`}
        style={{
          gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${SIZE}, 1fr)`,
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r}-${c}`;
            const isPreview = previewCells.has(key);
            const isDropping = dropCells.has(key);
            const isClearing = clearingCells.has(key);

            let bg = "rgba(255,255,255,0.04)";
            if (cell) {
              bg = cell;
            } else if (isPreview) {
              bg = validPlacement
                ? `${activePiece?.color || "#38bdf8"}cc`
                : "rgba(239, 68, 68, 0.4)";
            }

            return (
              <div
                key={key}
                onMouseEnter={() => {
                  if (!activeDrag) setHover({ r, c });
                }}
                onClick={() => {
                  if (selected !== null) {
                    placePieceAt(selected, r, c);
                  }
                }}
                className={`rounded-[5px] transition-all duration-150 relative overflow-hidden ${
                  isDropping ? "bb-drop scale-105" : ""
                } ${isClearing ? "bb-clear scale-90 opacity-60" : ""}`}
                style={{
                  background: bg,
                  boxShadow:
                    cell && !isClearing
                      ? "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.4)"
                      : isPreview && validPlacement
                      ? `0 0 12px ${activePiece?.color || "#38bdf8"}aa`
                      : "inset 0 0 0 1px rgba(255,255,255,0.03)",
                }}
              >
                {/* Subtle glass reflection highlight on filled tiles */}
                {cell && !isClearing && (
                  <div className="absolute inset-x-0 top-0 h-1/3 bg-white/20 rounded-t-[4px] pointer-events-none" />
                )}
              </div>
            );
          })
        )}

        {/* Floating Score Popups */}
        {popups.map((p) => (
          <div
            key={p.id}
            className={`pointer-events-none absolute font-display font-black bb-score-pop z-20 ${
              p.big ? "text-amber-300 text-sm" : "text-white/90 text-xs"
            }`}
            style={{
              left: `${(p.c / SIZE) * 100}%`,
              top: `${(p.r / SIZE) * 100}%`,
              transform: "translate(0, -60%)",
              textShadow: "0 2px 8px rgba(0,0,0,0.9)",
            }}
          >
            {p.text}
          </div>
        ))}
      </div>

      {/* Piece Tray with Drag & Drop Handles */}
      <div className="w-full max-w-[min(90vw,340px)] flex flex-col items-center gap-1.5 shrink-0">
        <div className="flex justify-center items-center gap-2 sm:gap-3 w-full">
          {tray.map((p, i) => {
            const isDraggingThis = activeDrag?.index === i;
            const isSelectedThis = selected === i;

            if (!p) {
              return (
                <div
                  key={i}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] flex items-center justify-center shrink-0"
                />
              );
            }

            return (
              <div
                key={p.id}
                onPointerDown={(e) => handlePiecePointerDown(e, i)}
                onClick={() => setSelected(selected === i ? null : i)}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center transition-all duration-150 cursor-grab active:cursor-grabbing touch-none select-none shrink-0 ${
                  isDraggingThis
                    ? "opacity-20 scale-90 border-accent/40 bg-accent/5"
                    : isSelectedThis
                    ? "border-accent bg-accent/20 ring-2 ring-accent/60 scale-105 shadow-lg shadow-accent/25"
                    : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/[0.08] active:scale-95"
                }`}
                title="Drag onto the board or click to place"
              >
                <MiniShape shape={p.shape} color={p.color} cellSize={14} />
              </div>
            );
          })}
        </div>

        {/* Hint text */}
        <p className="text-[10px] sm:text-[11px] text-white/40 text-center font-medium">
          Drag any block directly onto the board and release to place.
        </p>
      </div>

      {/* Floating Drag Clone that follows pointer / touch */}
      {activeDrag && (
        <div
          style={{
            position: "fixed",
            left: `${activeDrag.pointerX}px`,
            top: `${activeDrag.pointerY + (activeDrag.isTouch ? -54 : -18)}px`,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 99999,
          }}
        >
          <div
            className={`p-2 rounded-2xl bg-slate-950/85 backdrop-blur-md border shadow-2xl transition-transform ${
              activeDrag.isValid
                ? "border-emerald-400 ring-2 ring-emerald-400/50 scale-110 shadow-emerald-500/30"
                : "border-rose-500/70 ring-2 ring-rose-500/40 scale-100 shadow-rose-500/20"
            }`}
          >
            <MiniShape shape={activeDrag.piece.shape} color={activeDrag.piece.color} cellSize={18} />
          </div>
        </div>
      )}

      {/* Game Over Dialog */}
      {gameOver && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            className="glass rounded-2xl p-5 sm:p-6 text-center max-w-xs w-full shadow-2xl border border-white/15"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center mx-auto mb-3 text-amber-300">
              <GIconSparkles size={24} />
            </div>
            <h3 className="font-display text-lg font-bold mb-1 text-white">Board's Full!</h3>
            <p className="text-xs text-white/60 mb-2">
              Final score: <span className="text-accent font-bold font-mono text-base">{score}</span>
            </p>

            {score > 0 && !scoreSubmitted && (
              <form onSubmit={handleSubmitScore} className="my-3 space-y-2">
                <div className="text-left">
                  <label className="text-[10px] text-white/60 block mb-1">Player Call-Sign:</label>
                  <input
                    type="text"
                    maxLength={18}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter call-sign"
                    className="w-full px-2.5 py-1.5 bg-black/40 border border-white/20 rounded-xl text-white text-xs outline-none focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/40 transition-all font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingScore}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/25"
                >
                  <GIconTrophy size={13} />
                  <span>{submittingScore ? "Posting..." : "Post Score to Leaderboard"}</span>
                </button>
              </form>
            )}

            {scoreSubmitted && (
              <div className="my-3 py-2 px-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-center gap-1.5 font-medium">
                <GIconCheck size={14} />
                <span>Score posted to Leaderboard!</span>
              </div>
            )}

            <button
              onClick={reset}
              className="w-full mt-2 px-4 py-2.5 rounded-xl bg-accent hover:brightness-110 active:scale-95 text-white text-xs font-bold transition shadow-lg shadow-accent/25 cursor-pointer"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniShape({ shape, color, cellSize = 12 }: { shape: number[][]; color: string; cellSize?: number }) {
  const maxR = Math.max(...shape.map((s) => s[0])) + 1;
  const maxC = Math.max(...shape.map((s) => s[1])) + 1;
  const pad = 2;
  const width = maxC * cellSize + pad * 2;
  const height = maxR * cellSize + pad * 2;

  return (
    <svg width={width} height={height} className="overflow-visible drop-shadow-sm">
      {shape.map(([r, c], i) => (
        <rect
          key={i}
          x={c * cellSize + pad}
          y={r * cellSize + pad}
          width={cellSize - 2}
          height={cellSize - 2}
          rx={3}
          fill={color}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}
