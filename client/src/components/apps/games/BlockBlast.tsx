import { useCallback, useEffect, useRef, useState } from "react";
import { GIconRotateLeft, GIconTrophy, GIconVolume, GIconVolumeMute, GIconCheck } from "../../icons/GravityIcons";
import { API_URL } from "../../../lib/config";
import { getEffectiveChatName, saveChatName } from "../../../lib/chatSession";
import { useOS } from "../../../store/useOS";

const SIZE = 8;
const COLORS = ["#e8543f", "#57d9c7", "#9478ff", "#f5a642", "#ec6096", "#5fbf7c"];

const SHAPES = [
  [[0, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 0]],
  [[0, 0], [0, 1], [0, 2], [1, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1]],
  [[0, 1], [1, 0], [1, 1], [2, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [2, 1]]
];

function randomPiece(id) {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { id, shape, color };
}

function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

function canPlace(grid, shape, r, c) {
  return shape.every(([dr, dc]) => {
    const rr = r + dr, cc = c + dc;
    return rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && !grid[rr][cc];
  });
}

function pieceFitsSomewhere(grid, shape) {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (canPlace(grid, shape, r, c)) return true;
  return false;
}

// --- Sound effects, synthesized with Web Audio — no audio files to ship. ---
function useGameAudio(enabled) {
  const ctxRef = useRef(null);
  const musicIntervalRef = useRef(null);
  const musicStepRef = useRef(0);

  const getCtx = () => {
    if (!enabled) return null;
    if (!ctxRef.current) {
      try {
        ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        return null;
      }
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  };

  const tone = (freq, dur, type = "sine", startGain = 0.09, delay = 0) => {
    const ctx = getCtx();
    if (!ctx) return;
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
  };

  // A short, deliberately simple looping bassline + off-beat pluck —
  // procedurally generated at runtime rather than a shipped audio file, kept
  // quiet enough to sit under the placement/clear sound effects. Loops
  // indefinitely via setInterval until explicitly stopped.
  const BASSLINE = [130.81, 0, 130.81, 164.81, 0, 146.83, 0, 174.61];
  const PLUCK = [0, 261.63, 0, 0, 329.63, 0, 293.66, 0];
  const STEP_MS = 340;

  const startMusic = () => {
    if (musicIntervalRef.current || !enabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    musicStepRef.current = 0;
    musicIntervalRef.current = setInterval(() => {
      const step = musicStepRef.current % BASSLINE.length;
      const bass = BASSLINE[step];
      const pluck = PLUCK[step];
      if (bass) tone(bass, 0.32, "triangle", 0.028);
      if (pluck) tone(pluck, 0.22, "sine", 0.02, 0.02);
      musicStepRef.current++;
    }, STEP_MS);
  };

  const stopMusic = () => {
    if (musicIntervalRef.current) {
      clearInterval(musicIntervalRef.current);
      musicIntervalRef.current = null;
    }
  };

  // If sound gets muted mid-loop, kill the interval immediately rather than
  // waiting for the next tick to silently no-op.
  useEffect(() => {
    if (!enabled) stopMusic();
    return stopMusic;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    place: () => tone(320, 0.09, "triangle", 0.07),
    clear: (combo) => {
      // A little ascending arpeggio, richer with bigger combos.
      const base = 520;
      for (let i = 0; i < Math.min(3 + combo, 6); i++) {
        tone(base + i * 90, 0.16, "sine", 0.08, i * 0.045);
      }
    },
    gameOver: () => {
      stopMusic();
      tone(300, 0.3, "sawtooth", 0.06);
      tone(220, 0.4, "sawtooth", 0.06, 0.12);
      tone(160, 0.5, "sawtooth", 0.06, 0.24);
    },
    startMusic,
    stopMusic
  };
}

export default function BlockBlast() {
  const { notify } = useOS();
  const [grid, setGrid] = useState(emptyGrid());
  const [tray, setTray] = useState(() => [randomPiece(1), randomPiece(2), randomPiece(3)]);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("blockblast_best") || 0));
  const [hover, setHover] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem("blockblast_sound") !== "off");
  const [dropCells, setDropCells] = useState(new Set());
  const [clearingCells, setClearingCells] = useState(new Set());
  const [popups, setPopups] = useState([]);
  const [shake, setShake] = useState(false);
  const [playerName, setPlayerName] = useState(() => getEffectiveChatName());
  const [submittingScore, setSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const nextId = useState({ current: 4 })[0];
  const popupId = useRef(0);
  const sfx = useGameAudio(soundOn);

  useEffect(() => {
    localStorage.setItem("blockblast_sound", soundOn ? "on" : "off");
  }, [soundOn]);

  const refillIfNeeded = useCallback((newTray) => {
    if (newTray.every((p) => p === null)) {
      return [randomPiece(nextId.current++), randomPiece(nextId.current++), randomPiece(nextId.current++)];
    }
    return newTray;
  }, [nextId]);

  useEffect(() => {
    if (gameOver) return;
    const anyFits = tray.some((p) => p && pieceFitsSomewhere(grid, p.shape));
    if (tray.some((p) => p) && !anyFits) {
      setGameOver(true);
      sfx.gameOver();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, tray, gameOver]);

  const place = (r, c) => {
    if (selected === null || gameOver) return;
    const piece = tray[selected];
    if (!piece || !canPlace(grid, piece.shape, r, c)) return;

    const next = grid.map((row) => row.slice());
    const justDropped = new Set();
    piece.shape.forEach(([dr, dc]) => {
      next[r + dr][c + dc] = piece.color;
      justDropped.add(`${r + dr}-${c + dc}`);
    });

    sfx.place();
    sfx.startMusic();
    setDropCells(justDropped);
    setTimeout(() => setDropCells(new Set()), 220);

    const fullRows = [];
    const fullCols = [];
    for (let i = 0; i < SIZE; i++) {
      if (next[i].every(Boolean)) fullRows.push(i);
      if (next.every((row) => row[i])) fullCols.push(i);
    }
    const cleared = fullRows.length + fullCols.length;
    const gained = piece.shape.length * 2 + cleared * 18;

    let newTray = tray.slice();
    newTray[selected] = null;
    newTray = refillIfNeeded(newTray);
    setTray(newTray);
    setSelected(null);

    if (cleared > 0) {
      // Flash the about-to-clear cells first, then actually remove them —
      // gives the eye a moment to register what happened instead of an
      // instant, jarring wipe.
      const clearSet = new Set();
      fullRows.forEach((r2) => { for (let c2 = 0; c2 < SIZE; c2++) clearSet.add(`${r2}-${c2}`); });
      fullCols.forEach((c2) => { for (let r2 = 0; r2 < SIZE; r2++) clearSet.add(`${r2}-${c2}`); });

      setGrid(next); // show the placed piece immediately
      setClearingCells(clearSet);
      sfx.clear(cleared - 1);
      setShake(true);
      setTimeout(() => setShake(false), 200);

      setTimeout(() => {
        const finalGrid = next.map((row) => row.slice());
        fullRows.forEach((r2) => { for (let c2 = 0; c2 < SIZE; c2++) finalGrid[r2][c2] = null; });
        fullCols.forEach((c2) => { for (let r2 = 0; r2 < SIZE; r2++) finalGrid[r2][c2] = null; });
        setGrid(finalGrid);
        setClearingCells(new Set());
      }, 240);
    } else {
      setGrid(next);
    }

    const newScore = score + gained;
    setScore(newScore);
    if (newScore > best) {
      setBest(newScore);
      localStorage.setItem("blockblast_best", String(newScore));
    }

    const id = popupId.current++;
    setPopups((p) => [...p, { id, text: `+${gained}`, r, c, big: cleared > 0 }]);
    setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), 700);
  };

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
          details: `${scoreToSync} pts · Best ${Math.max(scoreToSync, best)}`
        })
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
    setScore(0);
    setGameOver(false);
    setScoreSubmitted(false);
    setClearingCells(new Set());
    setDropCells(new Set());
    setPopups([]);
    sfx.startMusic();
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

  const previewCells = new Set();
  if (selected !== null && hover && tray[selected]) {
    tray[selected].shape.forEach(([dr, dc]) => {
      const rr = hover.r + dr, cc = hover.c + dc;
      if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) previewCells.add(`${rr}-${cc}`);
    });
  }
  const validHover = selected !== null && hover && tray[selected] && canPlace(grid, tray[selected].shape, hover.r, hover.c);

  return (
    <div className="p-3 sm:p-4 flex flex-col items-center gap-2 sm:gap-3 select-none h-full overflow-y-auto thin-scroll">
      <div className="flex items-center justify-between w-full max-w-[min(88vw,320px)] text-sm">
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-wide">Score</div>
          <div className="font-display font-semibold text-lg tabular-nums">{score}</div>
        </div>
        <div className="flex items-center gap-1.5 text-white/60">
          <GIconTrophy size={14} className="text-amber-300" />
          <span className="font-mono text-xs">{best}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setSoundOn((s) => !s)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer" title={soundOn ? "Mute" : "Unmute"}>
            {soundOn ? <GIconVolume size={15} /> : <GIconVolumeMute size={15} className="text-white/40" />}
          </button>
          <button onClick={reset} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer" title="Restart">
            <GIconRotateLeft size={15} />
          </button>
        </div>
      </div>

      <div
        className={`relative grid gap-[3px] p-2 rounded-xl bg-white/5 border border-white/10 transition-transform w-full max-w-[min(88vw,320px)] aspect-square ${shake ? "bb-shake" : ""}`}
        style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)`, gridTemplateRows: `repeat(${SIZE}, 1fr)` }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r}-${c}`;
            const isPreview = previewCells.has(key);
            const isDropping = dropCells.has(key);
            const isClearing = clearingCells.has(key);
            return (
              <div
                key={key}
                onMouseEnter={() => setHover({ r, c })}
                onClick={() => place(r, c)}
                className={`rounded-[4px] ${isDropping ? "bb-drop" : ""} ${isClearing ? "bb-clear" : ""}`}
                style={{
                  background: cell || (isPreview ? (validHover ? "rgba(255,255,255,0.35)" : "rgba(255,80,80,0.35)") : "rgba(255,255,255,0.06)"),
                  transition: "background .1s",
                  boxShadow: cell && !isClearing ? "inset 0 0 0 1px rgba(255,255,255,0.25), inset 0 -3px 0 rgba(0,0,0,0.18)" : "none"
                }}
              />
            );
          })
        )}

        {popups.map((p) => (
          <div
            key={p.id}
            className={`pointer-events-none absolute font-display font-bold bb-score-pop ${p.big ? "text-amber-300 text-sm" : "text-white/80 text-xs"}`}
            style={{
              left: `${(p.c / SIZE) * 100}%`,
              top: `${(p.r / SIZE) * 100}%`,
              transform: "translate(-10%, -60%)"
            }}
          >
            {p.text}
          </div>
        ))}
      </div>

      <div className="flex justify-center items-center gap-2 sm:gap-3 mt-1 w-full max-w-[min(88vw,320px)]">
        {tray.map((p, i) =>
          p ? (
            <button
              key={p.id}
              onClick={() => setSelected(selected === i ? null : i)}
              className={`p-2 rounded-xl border transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer ${
                selected === i
                  ? "border-accent bg-accent/20 ring-2 ring-accent/60 scale-105 shadow-md shadow-accent/20"
                  : "border-white/10 bg-white/5 hover:border-white/25"
              }`}
            >
              <MiniShape shape={p.shape} color={p.color} />
            </button>
          ) : (
            <div key={i} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-dashed border-white/5" />
          )
        )}
      </div>

      {selected !== null ? (
        <span className="text-[10px] text-accent font-semibold px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/25 animate-pulse">
          Tap board to place selected piece
        </span>
      ) : (
        <p className="text-[10px] sm:text-[11px] text-white/40 text-center max-w-xs">
          Tap a piece below, then tap a cell on the board to drop it.
        </p>
      )}

      {gameOver && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" style={{ animation: "fadeInOpacity 200ms ease both" }}>
          <div className="glass rounded-2xl p-5 sm:p-6 text-center max-w-xs w-full shadow-2xl border border-white/15" style={{ animation: "menuOpen 220ms cubic-bezier(.34,1.56,.64,1) both" }}>
            <h3 className="font-display text-lg font-semibold mb-1 text-white">Board's full</h3>
            <p className="text-sm text-white/60 mb-2">Final score: <span className="text-accent font-bold font-mono text-base">{score}</span></p>

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
                    className="w-full px-2.5 py-1.5 bg-black/40 border border-white/20 rounded-xl text-white text-xs outline-none focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/40 focus:shadow-[0_0_14px_rgba(0,145,255,0.28)] transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingScore}
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
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

            <button onClick={reset} className="w-full mt-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:brightness-110 active:scale-95 transition cursor-pointer">
              Play again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniShape({ shape, color }) {
  const maxR = Math.max(...shape.map((s) => s[0])) + 1;
  const maxC = Math.max(...shape.map((s) => s[1])) + 1;
  const cell = 10;
  return (
    <svg width={maxC * cell + 4} height={maxR * cell + 4}>
      {shape.map(([r, c], i) => (
        <rect key={i} x={c * cell + 2} y={r * cell + 2} width={cell - 2} height={cell - 2} rx={2} fill={color} />
      ))}
    </svg>
  );
}
