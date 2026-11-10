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
} from "../../icons/GravityIcons";
import { soundFx } from "../../../lib/soundFx";
import { useOS } from "../../../store/useOS";
import { API_URL } from "../../../lib/config";
import { getEffectiveChatName, saveChatName } from "../../../lib/chatSession";

type Point = { x: number; y: number };
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

const GRID_SIZE = 20;

const SPEEDS = [
  { label: "Casual", ms: 120 },
  { label: "Normal", ms: 80 },
  { label: "Hyper", ms: 50 },
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

export default function SnakeRetro() {
  const { systemSounds, notify } = useOS();
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
  const [speedIdx, setSpeedIdx] = useState(1); // Normal default

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

  const resetGame = useCallback(() => {
    if (systemSounds) soundFx.playPop();
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
  }, [systemSounds]);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || submittingScore || scoreSubmitted || score <= 0) return;

    setSubmittingScore(true);
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
          score,
          details: `${score / 10} Apples (${SPEEDS[speedIdx].label})`
        })
      });

      if (res.ok) {
        setScoreSubmitted(true);
        notify("Score Posted!", `Your Snake score of ${score} was added to the leaderboard!`, "success");
      }
    } catch {
      notify("Network Error", "Could not reach leaderboard API.", "warning");
    } finally {
      setSubmittingScore(false);
    }
  };

  const changeDirection = useCallback(
    (newDir: Direction) => {
      const current = dir;
      if (newDir === "UP" && current !== "DOWN") nextDirRef.current = "UP";
      if (newDir === "DOWN" && current !== "UP") nextDirRef.current = "DOWN";
      if (newDir === "LEFT" && current !== "RIGHT") nextDirRef.current = "LEFT";
      if (newDir === "RIGHT" && current !== "LEFT") nextDirRef.current = "RIGHT";
      if (!hasStarted) setHasStarted(true);
    },
    [dir, hasStarted]
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
        else setIsPaused((p) => !p);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeDirection, isGameOver, resetGame]);

  // Game loop interval
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
          if (systemSounds) soundFx.playClose();
          setIsGameOver(true);
          return prevSnake;
        }

        // Self collision check
        if (prevSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
          if (systemSounds) soundFx.playClose();
          setIsGameOver(true);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          if (systemSounds) soundFx.playPop();
          const newScore = score + 10;
          setScore(newScore);

          if (newScore > bestScore) {
            setBestScore(newScore);
            try {
              localStorage.setItem("os_snake_best", String(newScore));
            } catch {}
          }

          setFood(getRandomPosition(newSnake));

          // 20% chance of golden food
          if (Math.random() < 0.25 && !goldenFood) {
            setGoldenFood(getRandomPosition(newSnake));
          }
        } else if (goldenFood && head.x === goldenFood.x && head.y === goldenFood.y) {
          if (systemSounds) soundFx.playNotification();
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
  }, [hasStarted, isPaused, isGameOver, speedIdx, food, goldenFood, score, bestScore, systemSounds]);

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
      if (systemSounds) soundFx.playPop();
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
    <div className="flex flex-col items-center justify-center p-3 text-white select-none max-w-md mx-auto">
      {/* Top Header & Stats */}
      <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs">
            <span className="text-white/40 mr-1.5">Score</span>
            <span className="font-mono font-bold text-accent text-sm">{score}</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <GIconTrophy size={13} />
            <span className="font-mono font-bold">{bestScore}</span>
          </div>
        </div>

        {/* Speed Level Selector */}
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10">
          {SPEEDS.map((s, idx) => (
            <button
              key={s.label}
              onClick={() => {
                if (systemSounds) soundFx.playClick();
                setSpeedIdx(idx);
              }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition ${
                speedIdx === idx
                  ? "bg-accent text-white shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Board Canvas Grid with Swipe & Mobile Responsive Sizing */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-square w-full max-w-[min(84vw,300px)] sm:max-w-[340px] bg-black/60 rounded-2xl border-2 border-white/15 shadow-2xl overflow-hidden p-1 backdrop-blur-md touch-none select-none"
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
                <div key={i} className="p-[1px]">
                  <div className="w-full h-full rounded-md bg-accent shadow-md shadow-accent/50 scale-105" />
                </div>
              );
            }
            if (isBody) {
              return (
                <div key={i} className="p-[1px]">
                  <div className="w-full h-full rounded-sm bg-accent/70" />
                </div>
              );
            }
            if (isFood) {
              return (
                <div key={i} className="p-[1px] flex items-center justify-center animate-pulse">
                  <div className="w-3/4 h-3/4 rounded-full bg-rose-500 shadow-md shadow-rose-500/50" />
                </div>
              );
            }
            if (isGolden) {
              return (
                <div key={i} className="p-[1px] flex items-center justify-center animate-bounce">
                  <div className="w-4/5 h-4/5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/80" />
                </div>
              );
            }
            return <div key={i} className="w-full h-full border border-white/[0.02]" />;
          })}
        </div>

        {/* Start / Pause / Game Over Overlay */}
        {!hasStarted && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
            <h3 className="font-display text-xl font-bold text-white mb-1">Snake Retro</h3>
            <p className="text-xs text-white/60 mb-4 max-w-[200px]">
              Use arrow keys or WASD to navigate and eat fruit.
            </p>
            <button
              onClick={() => {
                if (systemSounds) soundFx.playPop();
                setHasStarted(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white font-semibold text-xs shadow-lg shadow-accent/30 hover:brightness-110 active:scale-95 transition"
            >
              <GIconPlay size={14} /> Start Game
            </button>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-fade-in z-20">
            <h3 className="text-xl font-bold text-rose-400 mb-1">Game Over</h3>
            <p className="text-xs text-white/70 mb-1 font-mono">
              Final Score: <span className="text-accent font-bold">{score}</span>
            </p>
            {score >= bestScore && score > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-semibold mb-2">
                <GIconTrophy size={12} />
                <span>New High Score!</span>
              </span>
            )}

            {score > 0 && !scoreSubmitted && (
              <form onSubmit={handleSubmitScore} className="my-2 flex items-center gap-1.5 max-w-[220px]">
                <input
                  type="text"
                  maxLength={16}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Pilot call-sign"
                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-[11px] outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingScore}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg text-[11px] shrink-0"
                >
                  {submittingScore ? "..." : "Post"}
                </button>
              </form>
            )}

            {scoreSubmitted && (
              <div className="my-2 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <GIconCheck size={13} />
                <span>Score posted to Leaderboard!</span>
              </div>
            )}

            <button
              onClick={resetGame}
              className="flex items-center gap-1.5 px-4 py-2 mt-2 rounded-xl bg-accent text-white font-semibold text-xs shadow-lg shadow-accent/30 hover:brightness-110 active:scale-95 transition"
            >
              <GIconRotateRight size={14} /> Play Again
            </button>
          </div>
        )}

        {isPaused && !isGameOver && hasStarted && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-4">
            <span className="text-sm font-semibold tracking-wider uppercase text-white/90">Paused</span>
            <button
              onClick={() => setIsPaused(false)}
              className="mt-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs transition"
            >
              Resume
            </button>
          </div>
        )}
      </div>

      {/* On-Screen D-Pad for Mobile & Touch */}
      <div className="mt-3 flex flex-col items-center gap-1.5 sm:hidden">
        <button
          onClick={() => changeDirection("UP")}
          className="w-12 h-12 rounded-2xl bg-white/10 active:bg-accent active:scale-90 active:text-white flex items-center justify-center transition border border-white/15 shadow-md cursor-pointer"
          title="Move Up"
        >
          <GIconChevronUp size={20} />
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => changeDirection("LEFT")}
            className="w-12 h-12 rounded-2xl bg-white/10 active:bg-accent active:scale-90 active:text-white flex items-center justify-center transition border border-white/15 shadow-md cursor-pointer"
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
            className="w-12 h-12 rounded-2xl bg-accent/20 active:scale-90 border border-accent/40 text-accent font-mono text-[11px] flex items-center justify-center font-bold shadow-md cursor-pointer"
            title={isGameOver ? "Play Again" : isPaused ? "Resume" : "Pause"}
          >
            {isGameOver ? "REV" : isPaused ? "GO" : "PAU"}
          </button>
          <button
            onClick={() => changeDirection("RIGHT")}
            className="w-12 h-12 rounded-2xl bg-white/10 active:bg-accent active:scale-90 active:text-white flex items-center justify-center transition border border-white/15 shadow-md cursor-pointer"
            title="Move Right"
          >
            <GIconChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={() => changeDirection("DOWN")}
          className="w-12 h-12 rounded-2xl bg-white/10 active:bg-accent active:scale-90 active:text-white flex items-center justify-center transition border border-white/15 shadow-md cursor-pointer"
          title="Move Down"
        >
          <GIconChevronDown size={20} />
        </button>
        <p className="text-[10px] text-white/40 mt-1">Tip: Swipe directly on the board to steer</p>
      </div>

      {/* Footer controls tip */}
      <div className="hidden sm:flex items-center justify-between w-full mt-3 text-[10px] text-white/40 font-mono">
        <span>Controls: Arrow keys / WASD</span>
        <span>Space: Pause / Restart</span>
      </div>
    </div>
  );
}
