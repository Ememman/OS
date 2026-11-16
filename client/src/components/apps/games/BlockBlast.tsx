import { useCallback, useEffect, useRef, useState } from "react";
import {
  GIconRotateLeft,
  GIconTrophy,
  GIconVolume,
  GIconVolumeMute,
  GIconCheck,
  GIconSparkles,
} from "../../icons/GravityIcons";
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
  const maxR = Math.max(...shape.map((s) => s[0]));
  const maxC = Math.max(...shape.map((s) => s[1]));
  for (let r = 0; r <= SIZE - 1 - maxR; r++) {
    for (let c = 0; c <= SIZE - 1 - maxC; c++) {
      if (canPlace(grid, shape, r, c)) return true;
    }
  }
  return false;
}

// Procedural Synthetic Web Audio API Sound Engine
function useGameAudio(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    if (!enabled || typeof window === "undefined") return null;
    if (!ctxRef.current) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
      setTimeout(() => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      }, (delay + dur) * 1000 + 50);
    } catch {}
  };

  return {
    pick: () => {
      tone(440, 0.05, "sine", 0.04);
      tone(554.37, 0.07, "sine", 0.05, 0.015);
    },
    place: () => {
      tone(360, 0.08, "triangle", 0.08);
      tone(190, 0.1, "sine", 0.06, 0.02);
    },
    clear: (combo = 0) => {
      const base = 520 + Math.min(combo * 60, 320);
      const notes = [base, base * 1.25, base * 1.5, base * 2];
      notes.forEach((freq, i) => {
        tone(freq, 0.2, "sine", 0.08, i * 0.045);
      });
    },
    snapBack: () => {
      tone(280, 0.06, "sine", 0.03);
    },
    gameOver: () => {
      tone(320, 0.22, "sawtooth", 0.07);
      tone(240, 0.26, "sawtooth", 0.07, 0.1);
      tone(180, 0.4, "sawtooth", 0.08, 0.2);
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
  const [comboCount, setComboCount] = useState(0);
  const [comboBanner, setComboBanner] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem("blockblast_sound") !== "off");
  const [dropCells, setDropCells] = useState<Set<string>>(new Set());
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
  const [popups, setPopups] = useState<{ id: number; text: string; r: number; c: number; big: boolean }[]>([]);
  const [shake, setShake] = useState(false);

  // Dragging State
  // Active dragging piece info
  interface DragInfo {
    index: number;
    piece: Piece;
    isTouch: boolean;
    cellSize: number;
  }
  const [activeDragPiece, setActiveDragPiece] = useState<DragInfo | null>(null);
  // Grid hover target { r, c, isValid } updated ONLY when changing cells (zero React overhead)
  const [hoverTarget, setHoverTarget] = useState<{ r: number; c: number; isValid: boolean } | null>(null);

  // Leaderboard states
  const [playerName, setPlayerName] = useState(() => getEffectiveChatName());
  const [submittingScore, setSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const nextId = useRef(4);
  const popupId = useRef(0);
  const sfx = useGameAudio(soundOn);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);

  // Refs for drag tracking without triggering re-renders on every pixel
  const dragInfoRef = useRef<DragInfo | null>(null);
  const hoverTargetRef = useRef<{ r: number; c: number; isValid: boolean } | null>(null);
  const isClearingRef = useRef(false);

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

  // Safe game-over checker: verifies against current tray and grid
  const checkGameOverCondition = useCallback((currentGrid: (string | null)[][], currentTray: (Piece | null)[]) => {
    if (isClearingRef.current) return false;
    const remainingPieces = currentTray.filter((p): p is Piece => p !== null);
    if (remainingPieces.length === 0) return false;
    return !remainingPieces.some((p) => pieceFitsSomewhere(currentGrid, p.shape));
  }, []);

  // Execute placement of a piece at grid coordinate (r, c)
  const placePieceAt = useCallback((pieceIndex: number, r: number, c: number) => {
    const piece = tray[pieceIndex];
    if (!piece || gameOver || isClearingRef.current) return false;
    if (!canPlace(grid, piece.shape, r, c)) return false;

    const next = grid.map((row) => [...row]);
    const justDropped = new Set<string>();
    piece.shape.forEach(([dr, dc]) => {
      next[r + dr][c + dc] = piece.color;
      justDropped.add(`${r + dr}-${c + dc}`);
    });

    sfx.place();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(12);
    }
    setDropCells(justDropped);
    setTimeout(() => setDropCells(new Set()), 200);

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
    setHoverTarget(null);
    hoverTargetRef.current = null;

    if (cleared > 0) {
      isClearingRef.current = true;
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
      setTimeout(() => setShake(false), 200);

      // Trigger combo banner
      if (newCombo >= 2) {
        const text = newCombo >= 4 ? `MEGA BLAST x${newCombo}!` : newCombo === 3 ? "SUPER COMBO x3!" : "COMBO x2!";
        setComboBanner(text);
        setTimeout(() => setComboBanner(null), 1100);
      }

      // Finalize clearing lines smoothly
      setTimeout(() => {
        const finalGrid = next.map((row) => [...row]);
        fullRows.forEach((r2) => { for (let c2 = 0; c2 < SIZE; c2++) finalGrid[r2][c2] = null; });
        fullCols.forEach((c2) => { for (let r2 = 0; r2 < SIZE; r2++) finalGrid[r2][c2] = null; });
        setGrid(finalGrid);
        setClearingCells(new Set());
        isClearingRef.current = false;

        // Check game over ONLY on the final cleared board
        if (checkGameOverCondition(finalGrid, newTray)) {
          setGameOver(true);
          sfx.gameOver();
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([40, 60, 80]);
          }
        }
      }, 220);

      const newScore = score + gained;
      setScore(newScore);
      if (newScore > best) {
        setBest(newScore);
        localStorage.setItem("blockblast_best", String(newScore));
      }

      const id = popupId.current++;
      setPopups((p) => [...p, { id, text: `+${gained}`, r, c, big: true }]);
      setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), 650);
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
      setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), 650);

      // Check game over on next grid
      if (checkGameOverCondition(next, newTray)) {
        setGameOver(true);
        sfx.gameOver();
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([40, 60, 80]);
        }
      }
    }

    return true;
  }, [tray, grid, gameOver, comboCount, score, best, refillIfNeeded, sfx, checkGameOverCondition]);

  // Precise Target Calculation
  // Computes the grid origin (r, c) directly centered under pointer
  const calculateGridTarget = useCallback((clientX: number, clientY: number, shape: number[][], isTouch: boolean) => {
    if (!boardRef.current) return { r: null, c: null, isValid: false };
    const rect = boardRef.current.getBoundingClientRect();
    const cellSize = rect.width / SIZE;

    const maxR = Math.max(...shape.map((s) => s[0]));
    const maxC = Math.max(...shape.map((s) => s[1]));
    const shapeRows = maxR + 1;
    const shapeCols = maxC + 1;

    // Mobile touch offset: floats above fingertip so finger does not obstruct the piece or target cells
    // Desktop mouse: 0 offset (placed exactly where mouse pointer is)
    const touchOffsetY = isTouch ? -64 : 0;
    const pieceCenterX = clientX;
    const pieceCenterY = clientY + touchOffsetY;

    // Board relative coordinate
    const xOnBoard = pieceCenterX - rect.left;
    const yOnBoard = pieceCenterY - rect.top;

    // Generous boundary margin to allow snapping to edges smoothly
    const margin = cellSize * 0.75;
    if (
      xOnBoard < -margin ||
      xOnBoard > rect.width + margin ||
      yOnBoard < -margin ||
      yOnBoard > rect.height + margin
    ) {
      // Outside board area completely (e.g. in tray or off screen)
      return { r: null, c: null, isValid: false };
    }

    // Grid origin so that piece center corresponds to (xOnBoard, yOnBoard)
    const cellX = xOnBoard / cellSize;
    const cellY = yOnBoard / cellSize;
    const targetC = Math.round(cellX - (shapeCols - 1) / 2);
    const targetR = Math.round(cellY - (shapeRows - 1) / 2);

    // If completely outside playable grid bounds
    if (targetR < 0 || targetR + shapeRows > SIZE || targetC < 0 || targetC + shapeCols > SIZE) {
      return { r: targetR, c: targetC, isValid: false };
    }

    const isValid = canPlace(grid, shape, targetR, targetC);
    return { r: targetR, c: targetC, isValid };
  }, [grid]);

  // Pointer Down on Piece Tray Item
  const handlePiecePointerDown = (e: React.PointerEvent, pieceIndex: number) => {
    const piece = tray[pieceIndex];
    if (!piece || gameOver || isClearingRef.current) return;

    e.preventDefault();
    const isTouch = e.pointerType === "touch";
    const startX = e.clientX;
    const startY = e.clientY;
    let hasMoved = false;

    // Determine current board cell size for perfectly scaled drag ghost
    let cellSize = 38;
    if (boardRef.current) {
      cellSize = boardRef.current.getBoundingClientRect().width / SIZE;
    }

    const dragInfo: DragInfo = {
      index: pieceIndex,
      piece,
      isTouch,
      cellSize,
    };
    dragInfoRef.current = dragInfo;

    const updateGhostPosition = (cx: number, cy: number) => {
      if (ghostRef.current) {
        const offsetY = isTouch ? -64 : 0;
        ghostRef.current.style.transform = `translate3d(${cx}px, ${cy + offsetY}px, 0)`;
      }
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const current = dragInfoRef.current;
      if (!current) return;

      const dist = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (!hasMoved && dist > 5) {
        hasMoved = true;
        sfx.pick();
        setActiveDragPiece(current);
        setSelected(pieceIndex);
      }

      if (hasMoved) {
        updateGhostPosition(moveEvent.clientX, moveEvent.clientY);

        const target = calculateGridTarget(moveEvent.clientX, moveEvent.clientY, current.piece.shape, current.isTouch);
        const prev = hoverTargetRef.current;

        // ONLY update React state when target coordinate or validity actually changes!
        // This keeps dragging at locked 120 FPS without re-rendering the whole board on every pixel.
        if (
          !prev ||
          prev.r !== target.r ||
          prev.c !== target.c ||
          prev.isValid !== target.isValid
        ) {
          hoverTargetRef.current = target;
          setHoverTarget(target.r !== null && target.c !== null ? target : null);
        }
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      const current = dragInfoRef.current;
      dragInfoRef.current = null;

      if (!hasMoved) {
        // Simple click/tap without drag: toggle selection
        sfx.pick();
        setSelected((prev) => (prev === pieceIndex ? null : pieceIndex));
        setActiveDragPiece(null);
        setHoverTarget(null);
        hoverTargetRef.current = null;
        return;
      }

      const finalTarget = calculateGridTarget(upEvent.clientX, upEvent.clientY, current?.piece.shape || [], isTouch);

      if (current && finalTarget.r !== null && finalTarget.c !== null && finalTarget.isValid) {
        placePieceAt(current.index, finalTarget.r, finalTarget.c);
      } else {
        sfx.snapBack();
      }

      setActiveDragPiece(null);
      setHoverTarget(null);
      hoverTargetRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  // Click on a grid cell when a piece is selected via tap
  const handleCellClick = (r: number, c: number) => {
    if (selected === null || gameOver || isClearingRef.current) return;
    placePieceAt(selected, r, c);
  };

  // Sync score to backend leaderboard
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    setHoverTarget(null);
    hoverTargetRef.current = null;
    setActiveDragPiece(null);
    dragInfoRef.current = null;
    isClearingRef.current = false;
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

  // Preview cell calculation
  const activePiece = activeDragPiece ? activeDragPiece.piece : (selected !== null ? tray[selected] : null);
  const previewCells = new Set<string>();
  const isTargetValid = hoverTarget?.isValid ?? false;

  if (activePiece && hoverTarget && hoverTarget.r !== null && hoverTarget.c !== null) {
    activePiece.shape.forEach(([dr, dc]) => {
      const rr = hoverTarget.r + dr;
      const cc = hoverTarget.c + dc;
      if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) {
        previewCells.add(`${rr}-${cc}`);
      }
    });
  }

  return (
    <div className="p-3 sm:p-4 flex flex-col items-center justify-between gap-2.5 sm:gap-3.5 select-none h-full overflow-y-auto thin-scroll relative touch-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full max-w-[min(90vw,350px)] text-sm shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Score</div>
            <div className="font-display font-bold text-xl tabular-nums text-white">{score}</div>
          </div>
          {comboCount > 1 && (
            <div className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono text-xs font-bold">
              x{comboCount} Combo
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
        <div className="absolute top-12 z-30 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-display font-black text-xs shadow-xl shadow-amber-500/40 animate-bounce tracking-wider uppercase pointer-events-none">
          {comboBanner}
        </div>
      )}

      {/* 8x8 Board Container */}
      <div
        ref={boardRef}
        className={`relative grid gap-[3px] p-2 sm:p-2.5 rounded-2xl bg-[#0b0f19] border-2 border-white/15 shadow-2xl transition-transform w-full max-w-[min(90vw,350px)] aspect-square shrink-0 select-none ${
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

            let bg = "rgba(255,255,255,0.035)";
            if (cell) {
              bg = cell;
            } else if (isPreview) {
              bg = isTargetValid
                ? `${activePiece?.color || "#38bdf8"}d9`
                : "rgba(239, 68, 68, 0.4)";
            }

            return (
              <div
                key={key}
                onMouseEnter={() => {
                  if (selected !== null && !activeDragPiece) {
                    const piece = tray[selected];
                    if (piece) {
                      const valid = canPlace(grid, piece.shape, r, c);
                      setHoverTarget({ r, c, isValid: valid });
                    }
                  }
                }}
                onClick={() => handleCellClick(r, c)}
                className={`rounded-[5px] relative overflow-hidden select-none ${
                  isDropping ? "bb-drop scale-105" : ""
                } ${isClearing ? "bb-clear scale-90 opacity-60" : ""}`}
                style={{
                  background: bg,
                  boxShadow:
                    cell && !isClearing
                      ? "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -3px 0 rgba(0,0,0,0.35), 0 2px 5px rgba(0,0,0,0.35)"
                      : isPreview && isTargetValid
                      ? `0 0 10px ${activePiece?.color || "#38bdf8"}99`
                      : "inset 0 0 0 1px rgba(255,255,255,0.03)",
                }}
              >
                {/* 3D Glass Highlight on placed blocks */}
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
      <div className="w-full max-w-[min(90vw,350px)] flex flex-col items-center gap-1.5 shrink-0">
        <div className="flex justify-center items-center gap-2.5 sm:gap-3.5 w-full">
          {tray.map((p, i) => {
            const isDraggingThis = activeDragPiece?.index === i;
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
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center transition-all duration-150 cursor-grab active:cursor-grabbing touch-none select-none shrink-0 ${
                  isDraggingThis
                    ? "opacity-25 scale-90 border-accent/40 bg-accent/5"
                    : isSelectedThis
                    ? "border-accent bg-accent/20 ring-2 ring-accent/60 scale-105 shadow-lg shadow-accent/25"
                    : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/[0.08] active:scale-95"
                }`}
                title="Drag onto board or click to select"
              >
                <MiniShape shape={p.shape} color={p.color} cellSize={14} />
              </div>
            );
          })}
        </div>

        {/* Guidance tip */}
        <p className="text-[10px] sm:text-[11px] text-white/40 text-center font-medium">
          Drag any block onto the grid and release to place.
        </p>
      </div>

      {/* Hardware-Accelerated Floating Drag Ghost */}
      {activeDragPiece && (
        <div
          ref={ghostRef}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            pointerEvents: "none",
            zIndex: 99999,
            willChange: "transform",
          }}
        >
          <div
            style={{
              transform: "translate(-50%, -50%)",
            }}
            className="filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]"
          >
            <MiniShape
              shape={activeDragPiece.piece.shape}
              color={activeDragPiece.piece.color}
              cellSize={Math.max(24, Math.round(activeDragPiece.cellSize * 0.95))}
              glow={isTargetValid}
            />
          </div>
        </div>
      )}

      {/* Game Over Dialog */}
      {gameOver && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass rounded-2xl p-5 sm:p-6 text-center max-w-xs w-full shadow-2xl border border-white/15">
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

function MiniShape({
  shape,
  color,
  cellSize = 14,
  glow = false,
}: {
  shape: number[][];
  color: string;
  cellSize?: number;
  glow?: boolean;
}) {
  const maxR = Math.max(...shape.map((s) => s[0])) + 1;
  const maxC = Math.max(...shape.map((s) => s[1])) + 1;
  const pad = 3;
  const width = maxC * cellSize + pad * 2;
  const height = maxR * cellSize + pad * 2;

  return (
    <svg
      width={width}
      height={height}
      className={`overflow-visible ${glow ? "filter drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]" : ""}`}
    >
      {shape.map(([r, c], i) => (
        <g key={i}>
          <rect
            x={c * cellSize + pad}
            y={r * cellSize + pad}
            width={cellSize - 2.5}
            height={cellSize - 2.5}
            rx={3}
            fill={color}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
          />
          {/* Glass highlight on mini block */}
          <rect
            x={c * cellSize + pad + 1}
            y={r * cellSize + pad + 1}
            width={cellSize - 4.5}
            height={Math.max(2, (cellSize - 2.5) * 0.35)}
            rx={2}
            fill="rgba(255,255,255,0.25)"
          />
        </g>
      ))}
    </svg>
  );
}
