import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../../lib/config";
import { socket } from "../../../lib/socket";
import {
  GIconTrophy,
  GIconRotateRight,
  GIconClose,
} from "../../icons/GravityIcons";

interface LeaderboardEntry {
  id: string;
  game: string;
  gameName: string;
  player: string;
  score: number;
  details?: string;
  ts: number;
  badge?: string;
}

const GAME_FILTERS = [
  { id: "all", label: "All Games" },
  { id: "blockblast", label: "Block Blast" },
  { id: "2048", label: "2048" },
  { id: "snake", label: "Snake Retro" },
  { id: "minesweeper", label: "Minesweeper" },
];

export default function ArcadeLeaderboard({ onClose }: { onClose?: () => void }) {
  const [selectedGame, setSelectedGame] = useState("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    try {
      const q = selectedGame === "all" ? "" : `?game=${selectedGame}`;
      const res = await fetch(`${API_URL}/api/games/leaderboard${q}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.leaderboard || []);
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  }, [selectedGame]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  // Real-time socket updates for new score submissions
  useEffect(() => {
    const handleNewScore = (newScore: LeaderboardEntry) => {
      setEntries((prev) => {
        if (selectedGame !== "all" && newScore.game !== selectedGame) {
          return prev;
        }
        const updated = [newScore, ...prev.filter((e) => e.id !== newScore.id)];
        updated.sort((a, b) => {
          if (a.game === "minesweeper" && b.game === "minesweeper") {
            return a.score - b.score;
          }
          return b.score - a.score;
        });
        return updated;
      });
    };

    socket.on("game:score_submitted", handleNewScore);
    return () => {
      socket.off("game:score_submitted", handleNewScore);
    };
  }, [selectedGame]);

  const getRankBadge = (idx: number) => {
    if (idx === 0) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/50 flex items-center justify-center text-xs font-black shadow-sm shadow-amber-400/30">
          🥇
        </span>
      );
    }
    if (idx === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center justify-center text-xs font-black">
          🥈
        </span>
      );
    }
    if (idx === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 flex items-center justify-center text-xs font-black">
          🥉
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-full bg-white/5 text-white/50 flex items-center justify-center text-[11px] font-mono font-bold">
        #{idx + 1}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#12151f]/95 text-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <GIconTrophy size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Global Arcade Leaderboard</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Live Synced via Socket.IO" />
            </h3>
            <p className="text-[11px] text-white/50">Real-time high scores across all Portfolio OS players</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchScores}
            disabled={loading}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition"
            title="Refresh Leaderboard"
          >
            <GIconRotateRight size={14} className={loading ? "animate-spin text-accent" : ""} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition"
              title="Close Leaderboard"
            >
              <GIconClose size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 bg-white/[0.02] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto thin-scroll">
        {GAME_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedGame(f.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
              selectedGame === f.id
                ? "bg-accent text-white shadow-sm"
                : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Score Table */}
      <div className="flex-1 overflow-y-auto thin-scroll p-4">
        {loading && entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/40 text-xs">
            <GIconRotateRight size={24} className="animate-spin mb-2 text-accent" />
            <p>Loading arcade telemetry...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/40 text-xs">
            <p className="text-2xl mb-1">🎮</p>
            <p>No recorded scores yet for this game.</p>
            <p className="text-[11px] text-white/30 mt-0.5">Be the first player to submit a record!</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {entries.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                  idx === 0
                    ? "bg-amber-500/10 border-amber-500/30 shadow-md shadow-amber-500/5"
                    : idx === 1
                    ? "bg-slate-400/5 border-slate-400/20"
                    : idx === 2
                    ? "bg-amber-800/5 border-amber-800/20"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {getRankBadge(idx)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{entry.player}</span>
                      {entry.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 text-white/80 font-medium">
                          {entry.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/40 mt-0.5">
                      <span>{entry.gameName}</span>
                      {entry.details && (
                        <>
                          <span>•</span>
                          <span>{entry.details}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black font-mono text-accent">
                    {entry.game === "minesweeper" ? `${entry.score}s` : entry.score.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-white/30">
                    {new Date(entry.ts).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex items-center justify-between text-[11px] text-white/40">
        <span>Total Records: {entries.length}</span>
        <span>Synced with Portfolio OS Cloud API</span>
      </div>
    </div>
  );
}