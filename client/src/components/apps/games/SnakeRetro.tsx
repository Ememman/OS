import { useState, useEffect, useRef, useCallback } from "react";
import {
  GIconPlay,
  GIconRotateRight,
  GIconTrophy,
  GIconChevronUp,
  GIconChevronDown,
  GIconChevronLeft,
  GIconChevronRight,
  GIconCheck,
  GIconVolume,
  GIconVolumeMute,
} from "../../icons/GravityIcons";
import { soundFx } from "../../../lib/soundFx";
import { useOS } from "../../../store/useOS";
import { API_URL } from "../../../lib/config";
import { getEffectiveChatName, saveChatName } from "../../../lib/chatSession";

type Point = { x: number; y: number };
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

const GRID_SIZE = 20;

// Re-tuned, balanced game speeds so the snake is comfortable and responsive
const SPEEDS = [
  { label: "Relaxed", ms: 165 },
  { label: "Classic", ms: 125 },
  { label: "Arcade", ms: 90 },
];

function getRandomPosition(snake: Point[]): Point {
  while (true) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    if (!snake.some((s) => s.x === x && s.y === y)) {
      return { x, y };
    }
  }
}

// Procedural Retro 8-bit Audio Engine
function useSnakeAudio(enabled: boolean) {
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

  const tone = (freq: number, dur: number, type: OscillatorType = "sine", gainVal = 0.08, delay = 0) => {
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      const t = ctx.currentTime + delay;
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
    eat: () => {
      tone(440, 0.06, "square", 0.05);
      tone(880, 0.09, "square", 0.06, 0.03);
    },
    goldenEat: () => {
      tone(659.25, 0.08, "triangle", 0.08);
      tone(830.61, 0.08, "triangle", 0.08, 0.04);
      tone(1046.5, 0.16, "sine", 0.1, 0.08);
    },
    turn: () => tone(220, 0.03, "sine", 0.02),
    crash: () => {
      tone(220, 0.2, "sawtooth", 0.08);
      tone(140, 0.35, "sawtooth", 0.09, 0.08);
    },
  };
}

export default function SnakeRetro() {
  const { notify } = useOS();
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const [food, setFood] = useState<Point>({ x: 14, y: 10 });
  const [goldenFood, setGoldenFood] = useState<Point | null>(null);
  const [dir, setDir] = useState<Direction>("RIGHT");
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(1); // Default to Classic (125ms)
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem("os_snake_sound") !== "off");

  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem("os_snake_best") || 0);
    } catch {
      return 0;
    }
  });

  const [playerName, setPlayerName] = useState(() => getEffectiveChatName());
  const [submittingScore, setSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const nextDirRef = useRef<Direction>("RIGHT");
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const sfx = useSnakeAudio(soundOn);

  useEffect(() => {
    localStorage.setItem("os_snake_sound", soundOn ? "on" : "off");
  }, [soundOn]);

  const resetGame = useCallback(() => {
    sfx.eat();
    setSnake([
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ]);
    setFood({ x: 14, y: 10 });
    setGoldenFood(null);
    setDir("RIGHT");
    nextDirRef.current = "RIGHT";
    setIsGameOver(false);
    setIsPaused(false);
    setHasStarted(false);
    setScore(0);
    setScoreSubmitted(false);
  }, [sfx]);

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
          game: "snake",
          player: cleanName,
          score: scoreToSync,
          details: `${scoreToSync / 10} Apples (${SPEEDS[speedIdx].label})`,
          time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          ts: Date.now(),
        }),
      });
      if (res.ok) setScoreSubmitted(true);
    } catch {}
  }, [playerName, speedIdx]);

  useEffect(() => {
    if (score > 0) {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        syncScoreToBackend(score);
      }, 1200);
    }
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [score, syncScoreToBackend]);

  useEffect(() => {
    if (isGameOver && score > 0) {
      syncScoreToBackend(score);
    }
  }, [isGameOver, score, syncScoreToBackend]);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || submittingScore || score <= 0) return;

    setSubmittingScore(true);
    const cleanName = playerName.trim() || getEffectiveChatName();
    saveChatName(cleanName);
    localStorage.setItem("os_player_name", cleanName);

    await syncScoreToBackend(score);
    setSubmittingScore(false);
    notify("Score Posted!", `Your Snake score of ${score} is live on the leaderboard!`, "success");
  };

  const changeDirection = useCallback(
    (newDir: Direction) => {
      const current = dir;
      if (newDir === "UP" && current !== "DOWN") { nextDirRef.current = "UP"; sfx.turn(); }
      if (newDir === "DOWN" && current !== "UP") { nextDirRef.current = "DOWN"; sfx.turn(); }
      if (newDir === "LEFT" && current !== "RIGHT") { nextDirRef.current = "LEFT"; sfx.turn(); }
      if (newDir === "RIGHT" && current !== "LEFT") { nextDirRef.current = "RIGHT"; sfx.turn(); }
      if (!hasStarted) setHasStarted(true);
    },
    [dir, hasStarted, sfx]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }

      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") changeDirection("UP");
      else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") changeDirection("DOWN");
      else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") changeDirection("LEFT");
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") changeDirection("RIGHT");
      else if (e.code === "Space") {
        if (isGameOver) resetGame();
        else if (hasStarted) setIsPaused((p) => !p);
        else setHasStarted(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeDirection, isGameOver, resetGame, hasStarted]);

  // Main game loop interval
  useEffect(() => {
    if (!hasStarted || isPaused || isGameOver) return;

    const intervalMs = SPEEDS[speedIdx].ms;

    const timer = setInterval(() => {
      setDir(nextDirRef.current);

      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };

        switch (nextDirRef.current) {
          case "UP": head.y -= 1; break;
          case "DOWN": head.y += 1; break;
          case "LEFT": head.x -= 1; break;
          case "RIGHT": head.x += 1; break;
        }

        // Wall collision check
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          sfx.crash();
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([50, 50, 100]);
          }
          setIsGameOver(true);
          return prevSnake;
        }

        // Self collision check
        if (prevSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
          sfx.crash();
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([50, 50, 100]);
          }
          setIsGameOver(true);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          sfx.eat();
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(15);
          }
          const newScore = score + 10;
          setScore(newScore);

          if (newScore > bestScore) {
            setBestScore(newScore);
            try {
              localStorage.setItem("os_snake_best", String(newScore));
            } catch {}
          }

          setFood(getRandomPosition(newSnake));

          // 25% chance to spawn golden bonus apple
          if (Math.random() < 0.25 && !goldenFood) {
            setGoldenFood(getRandomPosition(newSnake));
          }
        } else if (goldenFood && head.x === goldenFood.x && head.y === goldenFood.y) {
          sfx.goldenEat();
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([20, 20]);
          }
          const newScore = score + 35;
          setScore(newScore);
          setGoldenFood(null);

          if (newScore > bestScore) {
            setBestScore(newScore);
            try {
              localStorage.setItem("os_snake_best", String(newScore));
            } catch {}
          }
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [hasStarted, isPaused, isGameOver, speedIdx, food, goldenFood, score, bestScore, sfx]);

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
    const threshold = 18;

    if (!hasStarted) {
      sfx.eat();
      setHasStarted(true);
      return;
    }

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      if (dx > 0) changeDirection("RIGHT");
      else changeDirection("LEFT");
    } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > threshold) {
      if (dy > 0) changeDirection("DOWN");
      else changeDirection("UP");
    }
  };

  return (
    <div className="flex flex-col items-center justify-start p-3 sm:p-4 pb-12 sm:pb-16 text-white select-none max-w-md mx-auto min-h-full overflow-y-auto thin-scroll space-y-2.5">
      {/* Top Header & Stats */}
      <div className="w-full max-w-[min(84vw,275px)] flex items-center justify-between pb-2 mb-1 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs">
            <span className="text-white/50 mr-1.5 font-semibold">Score</span>
            <span className="font-mono font-bold text-accent text-sm">{score}</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <GIconTrophy size={13} />
            <span className="font-mono font-bold">{bestScore}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundOn(!soundOn)}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition cursor-pointer"
            title={soundOn ? "Mute" : "Unmute"}
          >
            {soundOn ? <GIconVolume size={14} /> : <GIconVolumeMute size={14} className="text-white/40" />}
          </button>

          {/* Speed Level Selector */}
          <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-xl border border-white/10 text-[10px]">
            {SPEEDS.map((s, idx) => (
              <button
                key={s.label}
                onClick={() => {
                  soundFx.playClick();
                  setSpeedIdx(idx);
                }}
                className={`px-2 py-0.5 rounded-lg font-medium transition cursor-pointer ${
                  speedIdx === idx
                    ? "bg-accent text-white font-semibold shadow-xs"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Board Canvas Grid */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-square w-full max-w-[min(84vw,275px)] bg-[#070b14]/90 rounded-2xl border-2 border-white/15 shadow-2xl overflow-hidden p-1 backdrop-blur-md touch-none select-none shrink-0"
        style={{ touchAction: "none" }}
      >
        <div
          className="w-full h-full grid"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);

            const isHead = snake[0]?.x === x && snake[0]?.y === y;
            const isBody = snake.slice(1).some((s) => s.x === x && s.y === y);
            const isFood = food.x === x && food.y === y;
            const isGolden = goldenFood?.x === x && goldenFood?.y === y;

            if (isHead) {
              return (
                <div key={i} className="p-[0.5px] relative">
                  <div className="w-full h-full rounded-md bg-accent shadow-md shadow-accent/60 scale-105 flex items-center justify-center relative overflow-hidden">
                    {/* Cute Snake Eyes looking towards direction of travel */}
                    <div
                      className={`absolute flex gap-1 ${
                        dir === "UP"
                          ? "top-0.5 inset-x-0 justify-center"
                          : dir === "DOWN"
                          ? "bottom-0.5 inset-x-0 justify-center"
                          : dir === "LEFT"
                          ? "left-0.5 inset-y-0 flex-col justify-center"
                          : "right-0.5 inset-y-0 flex-col justify-center"
                      }`}
                    >
                      <div className="w-1 h-1 rounded-full bg-slate-950" />
                      <div className="w-1 h-1 rounded-full bg-slate-950" />
                    </div>
                  </div>
                </div>
              );
            }
            if (isBody) {
              return (
                <div key={i} className="p-[0.5px]">
                  <div className="w-full h-full rounded-sm bg-gradient-to-br from-accent/80 to-sky-400/70 shadow-xs" />
                </div>
              );
            }
            if (isFood) {
              return (
                <div key={i} className="p-[1px] flex items-center justify-center animate-pulse">
                  <div className="w-4/5 h-4/5 rounded-full bg-rose-500 shadow-md shadow-rose-500/70 border border-rose-300" />
                </div>
              );
            }
            if (isGolden) {
              return (
                <div key={i} className="p-[1px] flex items-center justify-center animate-bounce">
                  <div className="w-4/5 h-4/5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/90 border border-yellow-200" />
                </div>
              );
            }
            return <div key={i} className="w-full h-full border border-white/[0.02]" />;
          })}
        </div>

        {/* Start Overlay */}
        {!hasStarted && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20">
            <h3 className="font-display text-2xl font-black text-white mb-1">Snake Retro</h3>
            <p className="text-xs text-white/60 mb-4 max-w-[200px]">
              Use Arrow keys, WASD, or swipe to steer.
            </p>
            <button
              onClick={() => {
                sfx.eat();
                setHasStarted(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs shadow-lg shadow-accent/30 hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <GIconPlay size={14} /> Start Game
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center animate-in fade-in z-20">
            <h3 className="text-xl font-black text-rose-400 mb-1">Crash!</h3>
            <p className="text-xs text-white/70 mb-1 font-mono">
              Final Score: <span className="text-accent font-bold text-sm">{score}</span>
            </p>
            {score >= bestScore && score > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-semibold mb-2">
                <GIconTrophy size={12} />
                <span>New High Score!</span>
              </span>
            )}

            {score > 0 && !scoreSubmitted && (
              <form onSubmit={handleSubmitScore} className="my-2 w-full max-w-[220px] space-y-1.5">
                <input
                  type="text"
                  maxLength={16}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Pilot call-sign"
                  className="w-full px-2.5 py-1.5 bg-black/40 border border-white/20 rounded-xl text-white text-xs outline-none text-center focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/40 transition-all font-mono"
                />
                <button
                  type="submit"
                  disabled={submittingScore}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-amber-500/20"
                >
                  <GIconTrophy size={12} />
                  <span>{submittingScore ? "Posting..." : "Post Score"}</span>
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
              className="flex items-center justify-center gap-1.5 w-full max-w-[220px] px-4 py-2.5 mt-2 rounded-xl bg-accent text-white font-bold text-xs shadow-lg shadow-accent/25 hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <GIconRotateRight size={14} /> Play Again
            </button>
          </div>
        )}

        {/* Pause Overlay */}
        {isPaused && !isGameOver && hasStarted && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-20">
            <span className="text-sm font-bold tracking-widest uppercase text-white/90">Paused</span>
            <button
              onClick={() => setIsPaused(false)}
              className="mt-3 px-4 py-2 rounded-xl bg-accent text-white font-semibold text-xs shadow-md shadow-accent/25 hover:brightness-110 transition cursor-pointer"
            >
              Resume
            </button>
          </div>
        )}
      </div>

      {/* On-Screen D-Pad for Mobile & Touch Controls */}
      <div className="mt-1 flex flex-col items-center gap-1 shrink-0 pb-2">
        <button
          onClick={() => changeDirection("UP")}
          className="w-11 h-9 sm:w-12 sm:h-10 rounded-xl bg-white/10 active:bg-accent active:scale-90 active:text-white flex items-center justify-center transition border border-white/15 shadow-md cursor-pointer text-white/80 hover:text-white"
          title="Move Up"
        >
          <GIconChevronUp size={20} />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => changeDirection("LEFT")}
            className="w-11 h-9 sm:w-12 sm:h-10 rounded-xl bg-white/10 active:bg-accent active:scale-90 active:text-white flex items-center justify-center transition border border-white/15 shadow-md cursor-pointer text-white/80 hover:text-white"
            title="Move Left"
          >
            <GIconChevronLeft size={20} />
          </button>
          <button
            onClick={() => {
              if (isGameOver) resetGame();
              else if (hasStarted) setIsPaused(!isPaused);
              else setHasStarted(true);
            }}
            className="w-11 h-9 sm:w-12 sm:h-10 rounded-xl bg-accent/20 active:scale-90 border border-accent/40 text-accent font-mono text-xs flex items-center justify-center font-bold shadow-md cursor-pointer"
            title={isGameOver ? "Play Again" : isPaused ? "Resume" : "Pause"}
          >
            {isGameOver ? "REV" : isPaused ? "GO" : "PAU"}
          </button>
          <button
            onClick={() => changeDirection("RIGHT")}
            className="w-11 h-9 sm:w-12 sm:h-10 rounded-xl bg-white/10 active:bg-accent active:scale-90 active:text-white flex items-center justify-center transition border border-white/15 shadow-md cursor-pointer text-white/80 hover:text-white"
            title="Move Right"
          >
            <GIconChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={() => changeDirection("DOWN")}
          className="w-11 h-9 sm:w-12 sm:h-10 rounded-xl bg-white/10 active:bg-accent active:scale-90 active:text-white flex items-center justify-center transition border border-white/15 shadow-md cursor-pointer text-white/80 hover:text-white"
          title="Move Down"
        >
          <GIconChevronDown size={20} />
        </button>
      </div>

      <p className="text-[10px] text-white/40 mt-1 font-mono text-center">
        Swipe on board or tap D-pad · Space: Pause/Resume
      </p>
    </div>
  );
}
