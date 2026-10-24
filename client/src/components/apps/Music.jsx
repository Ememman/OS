import { useEffect, useRef, useState } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, ListMusic, AudioLines,
  Search, Plus, Check, ExternalLink, Loader2, Sparkles, MonitorPlay, Disc3
} from "lucide-react";
import { playlists } from "../../data/music";
import { API_URL } from "../../lib/config";
import { usePlayer } from "../../store/usePlayer";
import EqualizerBars from "../EqualizerBars";

const QUICK_SEARCHES = [
  "Photograph Ed Sheeran",
  "Anti-Hero Taylor Swift",
  "Forever Chris Brown",
  "Kanibalismo",
  "Kalapastangan Fitter Karma",
  "About You The 1975"
];
const MIX_STORAGE_KEY = "os_music_mix";

function fmt(s) {
  if (!s || Number.isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function loadMix() {
  try {
    return JSON.parse(localStorage.getItem(MIX_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function Music() {
  const [mode, setMode] = useState("browse"); // "browse" | "search"
  const [playlistId, setPlaylistId] = useState(playlists[0].id);
  const [myMix, setMyMix] = useState(loadMix);

  // Playback state now lives in a global store (see usePlayer.js) so it
  // survives this window being minimized or closed entirely — only an
  // explicit pause, or the track ending with nothing queued next, stops it.
  const {
    queue, queueIdx, playing, progress, duration, volume, visualizerLive, analyser,
    playQueueAt, togglePlay, next, prev, seek, setVolume, ensureVisualizer
  } = usePlayer();
  const track = queue[queueIdx];

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchSource, setSearchSource] = useState("preview"); // "preview" | "youtube"
  const [ytResults, setYtResults] = useState([]);
  const [ytConfigured, setYtConfigured] = useState(true); // assume yes until we hear otherwise
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState(null);
  const [ytQuery, setYtQuery] = useState("");
  const [playingVideoId, setPlayingVideoId] = useState(null);

  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(MIX_STORAGE_KEY, JSON.stringify(myMix));
  }, [myMix]);

  // Canvas visualizer — reads live frequency data from the shared analyser
  // (set up once, lazily, by the global player store) so it keeps working
  // no matter how many times this window has been closed and reopened.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "232 84 63";
    const barCount = 28;
    let idlePhase = 0;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const { width, height } = canvas;
      ctx2d.clearRect(0, 0, width, height);
      const barWidth = width / barCount;

      let values;
      let hasSignal = false;
      if (visualizerLive && analyser && playing) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        hasSignal = data.some((v) => v > 2);
        const step = Math.floor(data.length / barCount);
        values = Array.from({ length: barCount }, (_, i) => data[i * step] / 255);
      }
      if (!hasSignal) {
        if (playing) {
          idlePhase += 0.08;
          values = Array.from({ length: barCount }, (_, i) => 0.15 + Math.abs(Math.sin(idlePhase + i * 0.5)) * 0.25);
        } else {
          values = Array.from({ length: barCount }, () => 0.04);
        }
      }

      values.forEach((v, i) => {
        const barHeight = Math.max(2, v * height);
        ctx2d.fillStyle = `rgba(${accent}, ${0.35 + v * 0.65})`;
        const x = i * barWidth;
        if (typeof ctx2d.roundRect === "function") {
          const r = Math.min(2, barWidth / 2);
          ctx2d.beginPath();
          ctx2d.roundRect(x + 1, height - barHeight, barWidth - 2, barHeight, r);
          ctx2d.fill();
        } else {
          ctx2d.fillRect(x + 1, height - barHeight, barWidth - 2, barHeight);
        }
      });
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [visualizerLive, analyser, playing]);

  const startPlaying = (newQueue, idx) => {
    ensureVisualizer();
    playQueueAt(newQueue, idx);
  };

  const handleTogglePlay = () => {
    if (!track) return;
    ensureVisualizer();
    togglePlay();
  };

  const openPlaylist = (id) => {
    setMode("browse");
    setPlaylistId(id);
  };

  const runSearch = async (q) => {
    const term = (q ?? query).trim();
    if (!term) return;
    setQuery(term);
    setHasSearched(true);

    if (searchSource === "youtube") {
      setYtQuery(term);
      setPlayingVideoId(null);
      setYtLoading(true);
      setYtError(null);
      try {
        const res = await fetch(`${API_URL}/api/music/youtube-search?q=${encodeURIComponent(term)}`);
        const data = await res.json();
        setYtConfigured(data.configured !== false);
        if (!res.ok && data.configured) throw new Error(data.error || "Search failed");
        setYtResults(data.results || []);
        if (data.results?.length) setPlayingVideoId(data.results[0].id);
      } catch {
        setYtError("Couldn't reach the search API — make sure the backend server is running.");
        setYtResults([]);
      } finally {
        setYtLoading(false);
      }
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(`${API_URL}/api/music/search?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.results || []);
    } catch {
      setSearchError("Couldn't reach the search API — make sure the backend server is running.");
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const toTrack = (r) => ({
    id: `itunes-${r.id}`,
    title: r.title,
    artist: r.artist,
    genre: r.genre,
    cover: r.cover,
    src: r.previewUrl,
    duration: r.durationMs ? Math.round(r.durationMs / 1000) : 30,
    storeUrl: r.storeUrl,
    isPreview: true
  });

  const inMix = (id) => myMix.some((t) => t.id === id);
  const toggleMix = (r) => {
    const t = toTrack(r);
    setMyMix((mix) => (inMix(t.id) ? mix.filter((x) => x.id !== t.id) : [...mix, t]));
  };

  const currentPlaylistTracks = playlistId === "mymix" ? myMix : (playlists.find((p) => p.id === playlistId)?.tracks || []);

  return (
    <div className="flex flex-col h-full">
      <div className={`px-3 pt-2.5 pb-2 border-b border-white/10 flex items-center gap-2 transition-colors ${playing ? "bg-accent/5" : ""}`}>
        <AudioLines size={13} className={`shrink-0 transition-colors ${playing ? "accent" : "text-white/30"}`} />
        <canvas ref={canvasRef} width={600} height={52} className="w-full h-[52px]" />
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-24 sm:w-40 border-r border-white/10 p-2 sm:p-3 space-y-1 shrink-0 overflow-y-auto thin-scroll">
          <button
            onClick={() => setMode("search")}
            className={`w-full flex items-center gap-1.5 text-left text-xs px-2 py-1.5 rounded-lg mb-2 font-medium transition-colors ${
              mode === "search" ? "bg-accent/25 text-white" : "text-white/70 hover:bg-white/5"
            }`}
          >
            <Search size={12} /> Search
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-white/50 mb-1"><ListMusic size={12} /> Ambient</div>
          {playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => openPlaylist(p.id)}
              className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors ${mode === "browse" && playlistId === p.id ? "bg-accent/25 text-white" : "text-white/60 hover:bg-white/5"}`}
            >
              {p.name}
            </button>
          ))}

          {myMix.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 text-[11px] text-white/50 mt-3 mb-1"><Sparkles size={12} /> My Mix</div>
              <button
                onClick={() => openPlaylist("mymix")}
                className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors ${mode === "browse" && playlistId === "mymix" ? "bg-accent/25 text-white" : "text-white/60 hover:bg-white/5"}`}
              >
                My Mix ({myMix.length})
              </button>
            </>
          )}
        </div>

        {mode === "search" ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b border-white/10 shrink-0">
              <div className="flex gap-1 mb-2 bg-white/5 rounded-lg p-0.5 w-fit">
                <button
                  onClick={() => setSearchSource("preview")}
                  className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                    searchSource === "preview" ? "bg-accent text-white" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <Disc3 size={11} /> Previews
                </button>
                <button
                  onClick={() => setSearchSource("youtube")}
                  className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                    searchSource === "youtube" ? "bg-accent text-white" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <MonitorPlay size={11} /> Full Song
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); runSearch(); }} className="flex items-center gap-2 bg-white/8 rounded-xl px-3 h-9">
                <Search size={13} className="text-white/40 shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchSource === "youtube" ? "Search any song — plays full-length via YouTube" : "Search any song — real 30-second previews via Apple Music"}
                  className="bg-transparent outline-none text-xs w-full placeholder:text-white/35"
                />
                {(searchSource === "youtube" ? ytLoading : searchLoading) && <Loader2 size={13} className="animate-spin text-white/40 shrink-0" />}
              </form>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_SEARCHES.map((q) => (
                  <button
                    key={q}
                    onClick={() => runSearch(q)}
                    className="text-[10px] px-2 py-1 rounded-full border border-white/15 text-white/60 hover:border-accent hover:text-white transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {searchSource === "youtube" ? (
              <div className="flex-1 overflow-auto thin-scroll p-3 flex flex-col min-h-0">
                {!ytQuery && (
                  <p className="text-xs text-white/40 text-center mt-6 px-4">
                    Search any song for full-length playback via YouTube.
                  </p>
                )}

                {ytQuery && ytConfigured && (
                  <>
                    {playingVideoId && (
                      <div className="w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg mb-3 shrink-0">
                        <iframe
                          key={playingVideoId}
                          src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`}
                          title="Full song player"
                          allow="autoplay; encrypted-media; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      </div>
                    )}
                    {ytError && <p className="text-xs text-red-300 text-center py-4">{ytError}</p>}
                    {!ytLoading && !ytError && ytResults.length === 0 && (
                      <p className="text-xs text-white/40 text-center py-4">No results for "{ytQuery}".</p>
                    )}
                    <div className="space-y-1">
                      {ytResults.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setPlayingVideoId(v.id)}
                          className={`w-full flex items-center gap-2.5 text-left px-2 py-1.5 rounded-lg transition-colors ${playingVideoId === v.id ? "bg-white/10" : "hover:bg-white/5"}`}
                        >
                          <img src={v.thumbnail} alt="" className="w-12 h-8 rounded object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{v.title}</div>
                            <div className="text-[10px] text-white/45 truncate">{v.channel}</div>
                          </div>
                          {playingVideoId === v.id && <EqualizerBars className="shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {ytQuery && !ytConfigured && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-3">
                    <MonitorPlay size={28} className="text-white/25" />
                    <p className="text-xs text-white/50 max-w-xs">
                      Inline full-song search needs a free YouTube API key on the backend (not set up yet — see <code className="font-mono">server/.env.example</code>).
                      Until then, here's a direct link that always works:
                    </p>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-accent hover:brightness-110 transition"
                    >
                      <ExternalLink size={12} /> Open "{ytQuery}" on YouTube
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-auto thin-scroll p-2">
                {searchError && <p className="text-xs text-red-300 text-center mt-6 px-4">{searchError}</p>}
                {!searchError && !searchLoading && hasSearched && results.length === 0 && (
                  <p className="text-xs text-white/40 text-center mt-6">No results for "{query}". Try a different spelling or the artist name.</p>
                )}
                {!hasSearched && !searchLoading && (
                  <p className="text-xs text-white/40 text-center mt-6 px-4">
                    Search real songs — try one of the quick picks above, or type any track or artist.
                  </p>
                )}
                {results.map((r, i) => {
                  const t = toTrack(r);
                  const isCurrent = track?.id === t.id;
                  return (
                    <div
                      key={r.id}
                      className={`w-full flex items-center gap-2.5 text-left px-2 py-2 rounded-lg transition-colors group ${isCurrent ? "bg-white/10" : "hover:bg-white/5"}`}
                    >
                      <button
                        onClick={() => startPlaying(results.map(toTrack), i)}
                        className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                      >
                        <img src={r.cover} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{r.title}</div>
                          <div className="text-[10px] text-white/45 truncate">{r.artist} · {r.genre}</div>
                        </div>
                        {isCurrent && playing && <EqualizerBars className="shrink-0" />}
                      </button>
                      <button
                        onClick={() => toggleMix(r)}
                        title={inMix(t.id) ? "Remove from My Mix" : "Add to My Mix"}
                        className={`p-1.5 rounded-full shrink-0 transition-colors ${inMix(t.id) ? "bg-accent text-white" : "bg-white/10 text-white/50 hover:bg-white/20"}`}
                      >
                        {inMix(t.id) ? <Check size={11} /> : <Plus size={11} />}
                      </button>
                      <a
                        href={r.storeUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Open full song in Apple Music"
                        className="p-1.5 rounded-full shrink-0 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 p-3 overflow-auto thin-scroll">
            {currentPlaylistTracks.length === 0 && (
              <p className="text-xs text-white/40 text-center mt-6">
                Nothing here yet — search for real songs and tap + to build your mix.
              </p>
            )}
            {currentPlaylistTracks.map((t, i) => (
              <button
                key={t.id}
                onClick={() => startPlaying(currentPlaylistTracks, i)}
                className={`w-full flex items-center gap-3 text-left px-2 py-2 rounded-lg transition-colors ${queue === currentPlaylistTracks && i === queueIdx ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <img src={t.cover} alt="" className="w-9 h-9 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{t.title}</div>
                  <div className="text-[10px] text-white/45 truncate">{t.artist} · {t.genre}</div>
                </div>
                {t.isPreview && <span className="text-[9px] text-white/30 shrink-0">preview</span>}
                {queue === currentPlaylistTracks && i === queueIdx && playing && <EqualizerBars className="shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-3 flex items-center gap-3">
        <div className={`relative w-11 h-11 shrink-0 rounded-lg ${playing ? "ring-2 ring-accent/60" : ""} transition-all`}>
          <img src={track?.cover} alt="" className="w-full h-full rounded-lg object-cover bg-white/5" />
          {playing && <span className="absolute inset-0 rounded-lg animate-ping bg-accent/20" />}
        </div>
        <div className="min-w-0 w-28 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="text-xs font-medium truncate">{track?.title || "Nothing playing"}</div>
            {playing && <EqualizerBars className="shrink-0" />}
          </div>
          <div className="text-[10px] text-white/45 truncate">{track?.artist || "—"}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={prev} disabled={!queue.length} className="p-1.5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"><SkipBack size={14} /></button>
          <button onClick={handleTogglePlay} disabled={!track} className="p-2 bg-accent rounded-full hover:brightness-110 active:scale-95 transition disabled:opacity-40">
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button onClick={next} disabled={!queue.length} className="p-1.5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"><SkipForward size={14} /></button>
        </div>
        <div className="flex-1 flex items-center gap-2 text-[10px] text-white/50 min-w-0">
          <span className="font-mono">{fmt(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || track?.duration || 0}
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            className="flex-1 accent-[rgb(var(--accent))]"
          />
          <span className="font-mono">{fmt(duration || track?.duration)}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <Volume2 size={14} className="text-white/50" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-16 accent-[rgb(var(--accent))]"
          />
        </div>
      </div>
    </div>
  );
}
