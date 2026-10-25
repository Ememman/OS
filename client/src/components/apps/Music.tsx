import { useEffect, useRef, useState } from "react";
import {
  GIconPlay,
  GIconPause,
  GIconBackward,
  GIconForward,
  GIconVolume,
  GIconVolumeMute,
  GIconSearch,
  GIconPlus,
  GIconCheck,
  GIconExternalLink,
  GIconLoader,
  GIconSparkles,
  GIconMusic,
  GIconBarsPlay,
  GIconList,
  GIconDisplayPulse,
} from "../icons/GravityIcons";
import { playlists } from "../../data/music";
import { API_URL } from "../../lib/config";
import { usePlayer } from "../../store/usePlayer";
import EqualizerBars from "../EqualizerBars";

const QUICK_SEARCHES = [
  "Photograph Ed Sheeran",
  "Anti-Hero Taylor Swift",
  "Forever Chris Brown",
  "Coldplay Yellow",
  "Lofi Chill Beats",
  "About You The 1975",
];

const MIX_STORAGE_KEY = "os_music_mix";

function fmt(s: number) {
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
  const [mode, setMode] = useState<"browse" | "search">("browse");
  const [playlistId, setPlaylistId] = useState(playlists[0].id);
  const [myMix, setMyMix] = useState(loadMix);

  const {
    queue,
    queueIdx,
    playing,
    progress,
    duration,
    volume,
    visualizerLive,
    analyser,
    playQueueAt,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    ensureVisualizer,
  } = usePlayer();
  const track = queue[queueIdx];

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchSource, setSearchSource] = useState<"preview" | "youtube">("preview");
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [ytConfigured, setYtConfigured] = useState(true);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [ytQuery, setYtQuery] = useState("");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem(MIX_STORAGE_KEY, JSON.stringify(myMix));
  }, [myMix]);

  // If no queue is active, initialize with the default playlist so user can hit play immediately
  useEffect(() => {
    if (queue.length === 0 && playlists[0]?.tracks?.length > 0) {
      usePlayer.setState({
        queue: playlists[0].tracks,
        queueIdx: 0,
        duration: playlists[0].tracks[0].duration,
      });
    }
  }, [queue.length]);

  // Audio canvas visualizer with live frequency data & smooth idle simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const barCount = 32;
    let idlePhase = 0;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const { width, height } = canvas;
      ctx2d.clearRect(0, 0, width, height);
      const barWidth = width / barCount;

      let values: number[];
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
          values = Array.from({ length: barCount }, (_, i) => {
            const wave = Math.sin(idlePhase + i * 0.45) * 0.4 + 0.5;
            const wave2 = Math.cos(idlePhase * 0.6 + i * 0.25) * 0.25;
            return Math.min(1, Math.max(0.08, wave + wave2));
          });
        } else {
          values = Array.from({ length: barCount }, () => 0.04);
        }
      }

      ctx2d.fillStyle = "rgba(255, 255, 255, 0.75)";
      values.forEach((v, i) => {
        const barHeight = Math.max(2, v * (height - 6));
        const x = i * barWidth;
        ctx2d.fillRect(x + 1, height - barHeight, barWidth - 2, barHeight);
      });
    };
    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [visualizerLive, analyser, playing]);

  const startPlaying = (newQueue: any[], idx: number) => {
    ensureVisualizer();
    playQueueAt(newQueue, idx);
  };

  const handleTogglePlay = () => {
    if (!track && playlists[0]?.tracks?.length > 0) {
      startPlaying(playlists[0].tracks, 0);
      return;
    }
    ensureVisualizer();
    togglePlay();
  };

  const openPlaylist = (id: string) => {
    setMode("browse");
    setPlaylistId(id);
  };

  // Robust Search Engine: Tries backend API -> Direct Apple Music iTunes API -> Curated Offline Fallbacks
  const runSearch = async (q?: string) => {
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
        if (data.results && data.results.length > 0) {
          setYtResults(data.results);
          setPlayingVideoId(data.results[0].id);
        } else {
          setYtResults([]);
        }
      } catch {
        setYtConfigured(false);
        setYtResults([]);
      } finally {
        setYtLoading(false);
      }
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      let tracks: any[] = [];

      // 1. Attempt backend proxy endpoint
      try {
        const res = await fetch(`${API_URL}/api/music/search?q=${encodeURIComponent(term)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.results) && data.results.length > 0) {
            tracks = data.results;
          }
        }
      } catch {
        // Backend not running, silently proceed to direct browser search
      }

      // 2. Direct browser fetch to iTunes API (supported globally with CORS headers)
      if (!tracks.length) {
        try {
          const directRes = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=16`
          );
          if (directRes.ok) {
            const data = await directRes.json();
            tracks = (data.results || [])
              .filter((t: any) => t.previewUrl)
              .map((t: any) => ({
                id: String(t.trackId),
                title: t.trackName,
                artist: t.artistName,
                album: t.collectionName,
                cover: t.artworkUrl100?.replace("100x100", "300x300"),
                previewUrl: t.previewUrl,
                durationMs: t.trackTimeMillis,
                genre: t.primaryGenreName,
                storeUrl: t.trackViewUrl,
              }));
          }
        } catch {
          // Network issues
        }
      }

      // 3. Fallback to local playlist matches if still empty
      if (!tracks.length) {
        const allLocal = playlists.flatMap((p) => p.tracks);
        const matches = allLocal.filter(
          (t) =>
            t.title.toLowerCase().includes(term.toLowerCase()) ||
            t.artist.toLowerCase().includes(term.toLowerCase()) ||
            t.genre.toLowerCase().includes(term.toLowerCase())
        );
        tracks = matches.map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          album: t.genre,
          cover: t.cover,
          previewUrl: t.src,
          durationMs: t.duration * 1000,
          genre: t.genre,
          storeUrl: "https://music.apple.com",
        }));
      }

      setResults(tracks);
    } catch (err: any) {
      console.error("Music search error:", err);
      setSearchError("Search could not complete. Check your connection.");
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const toTrack = (r: any) => ({
    id: `itunes-${r.id}`,
    title: r.title,
    artist: r.artist,
    genre: r.genre || "Music",
    cover: r.cover || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300",
    src: r.previewUrl,
    duration: r.durationMs ? Math.round(r.durationMs / 1000) : 30,
    storeUrl: r.storeUrl,
    isPreview: true,
  });

  const inMix = (id: string) => myMix.some((t: any) => t.id === id);
  const toggleMix = (r: any) => {
    const t = toTrack(r);
    setMyMix((mix: any[]) => (inMix(t.id) ? mix.filter((x) => x.id !== t.id) : [...mix, t]));
  };

  const currentPlaylistTracks =
    playlistId === "mymix"
      ? myMix
      : playlists.find((p) => p.id === playlistId)?.tracks || [];

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-white">
      {/* Top Visualizer Bar */}
      <div
        className={`px-3 pt-2.5 pb-2 border-b border-white/10 flex items-center gap-2.5 transition-colors ${
          playing ? "bg-accent/10" : "bg-black/20"
        }`}
      >
        <GIconDisplayPulse
          size={16}
          className={`shrink-0 transition-colors ${playing ? "text-accent" : "text-white/30"}`}
        />
        <canvas ref={canvasRef} width={600} height={46} className="w-full h-[46px]" />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-28 sm:w-44 border-r border-white/10 p-2 sm:p-3 space-y-1 shrink-0 overflow-y-auto thin-scroll bg-black/25">
          <button
            onClick={() => setMode("search")}
            className={`w-full flex items-center gap-2 text-left text-xs px-2.5 py-2 rounded-xl mb-2 font-medium transition-colors ${
              mode === "search"
                ? "bg-accent text-white shadow-lg shadow-accent/25"
                : "text-white/70 hover:bg-white/10"
            }`}
          >
            <GIconSearch size={14} /> Search
          </button>

          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1 px-1">
            <GIconList size={12} /> Playlists
          </div>
          {playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => openPlaylist(p.id)}
              className={`w-full flex items-center gap-2 text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                mode === "browse" && playlistId === p.id
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/60 hover:bg-white/5"
              }`}
            >
              <GIconMusic size={12} className="shrink-0 text-white/40" />
              <span className="truncate">{p.name}</span>
            </button>
          ))}

          {myMix.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-white/40 mt-3 mb-1 px-1">
                <GIconSparkles size={12} /> Library
              </div>
              <button
                onClick={() => openPlaylist("mymix")}
                className={`w-full flex items-center gap-2 text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                  mode === "browse" && playlistId === "mymix"
                    ? "bg-white/15 text-white font-medium"
                    : "text-white/60 hover:bg-white/5"
                }`}
              >
                <GIconSparkles size={12} className="shrink-0 text-amber-400" />
                <span className="truncate">My Mix ({myMix.length})</span>
              </button>
            </>
          )}
        </div>

        {/* Content Pane */}
        {mode === "search" ? (
          <div className="flex-1 flex flex-col min-h-0 bg-black/10">
            {/* Search Input Bar */}
            <div className="p-3 border-b border-white/10 shrink-0">
              <div className="flex gap-1 mb-2.5 bg-white/5 rounded-lg p-1 w-fit">
                <button
                  onClick={() => setSearchSource("preview")}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-md transition-colors ${
                    searchSource === "preview"
                      ? "bg-accent text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  <GIconBarsPlay size={12} /> Audio Previews
                </button>
                <button
                  onClick={() => setSearchSource("youtube")}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-md transition-colors ${
                    searchSource === "youtube"
                      ? "bg-accent text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  <GIconMusic size={12} /> Full Songs
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runSearch();
                }}
                className="flex items-center gap-2.5 bg-white/10 rounded-xl px-3 h-10 border border-white/10 focus-within:border-accent transition-colors"
              >
                <GIconSearch size={15} className="text-white/40 shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    searchSource === "youtube"
                      ? "Search any artist or song — full length playback"
                      : "Search any song, artist or genre — instant Apple Music stream"
                  }
                  className="bg-transparent outline-none text-xs w-full placeholder:text-white/35"
                />
                {(searchSource === "youtube" ? ytLoading : searchLoading) && (
                  <GIconLoader size={15} className="text-white/60 shrink-0" />
                )}
              </form>

              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {QUICK_SEARCHES.map((q) => (
                  <button
                    key={q}
                    onClick={() => runSearch(q)}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-white/15 text-white/60 hover:border-accent hover:text-white transition-all bg-white/5"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            {searchSource === "youtube" ? (
              <div className="flex-1 overflow-auto thin-scroll p-3 flex flex-col min-h-0">
                {!ytQuery && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-white/40">
                    <GIconMusic size={32} className="mb-2 text-white/20" />
                    <p className="text-xs">Search for any song to stream full-length audio video.</p>
                  </div>
                )}

                {ytQuery && ytConfigured && (
                  <>
                    {playingVideoId && (
                      <div className="w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl mb-3 shrink-0 border border-white/10">
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
                    {ytError && <p className="text-xs text-rose-300 text-center py-4">{ytError}</p>}
                    {!ytLoading && !ytError && ytResults.length === 0 && (
                      <p className="text-xs text-white/40 text-center py-4">
                        No results for "{ytQuery}".
                      </p>
                    )}
                    <div className="space-y-1">
                      {ytResults.map((v: any) => (
                        <button
                          key={v.id}
                          onClick={() => setPlayingVideoId(v.id)}
                          className={`w-full flex items-center gap-2.5 text-left px-2.5 py-2 rounded-xl transition-colors ${
                            playingVideoId === v.id ? "bg-white/15" : "hover:bg-white/5"
                          }`}
                        >
                          <img
                            src={v.thumbnail}
                            alt=""
                            className="w-12 h-8 rounded-lg object-cover shrink-0"
                          />
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
                    <GIconMusic size={28} className="text-white/25" />
                    <p className="text-xs text-white/50 max-w-xs">
                      Search directly on YouTube for full-length streams:
                    </p>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl bg-accent text-white hover:brightness-110 transition shadow-lg shadow-accent/20"
                    >
                      <GIconExternalLink size={13} /> Open "{ytQuery}" on YouTube
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-auto thin-scroll p-3 space-y-1.5">
                {searchError && (
                  <p className="text-xs text-rose-300 text-center mt-6 px-4">{searchError}</p>
                )}
                {!searchError && !searchLoading && hasSearched && results.length === 0 && (
                  <p className="text-xs text-white/40 text-center mt-6">
                    No results for "{query}". Try a different spelling or artist.
                  </p>
                )}
                {!hasSearched && !searchLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-white/40">
                    <GIconMusic size={32} className="mb-2 text-white/20" />
                    <p className="text-xs">
                      Search any track or artist to stream 256kbps audio instantly.
                    </p>
                  </div>
                )}
                {results.map((r, i) => {
                  const t = toTrack(r);
                  const isCurrent = track?.id === t.id;
                  return (
                    <div
                      key={r.id}
                      className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-xl transition-all group ${
                        isCurrent ? "bg-white/15" : "hover:bg-white/5"
                      }`}
                    >
                      <button
                        onClick={() => startPlaying(results.map(toTrack), i)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <img
                          src={r.cover}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate text-white">{r.title}</div>
                          <div className="text-[11px] text-white/50 truncate">
                            {r.artist} · {r.genre}
                          </div>
                        </div>
                        {isCurrent && playing && <EqualizerBars className="shrink-0" />}
                      </button>

                      <button
                        onClick={() => toggleMix(r)}
                        title={inMix(t.id) ? "Remove from My Mix" : "Add to My Mix"}
                        className={`p-2 rounded-full shrink-0 transition-colors ${
                          inMix(t.id)
                            ? "bg-accent text-white"
                            : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                        }`}
                      >
                        {inMix(t.id) ? <GIconCheck size={12} /> : <GIconPlus size={12} />}
                      </button>

                      {r.storeUrl && (
                        <a
                          href={r.storeUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open full album"
                          className="p-2 rounded-full shrink-0 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <GIconExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 p-3 overflow-auto thin-scroll space-y-1.5 bg-black/10">
            {currentPlaylistTracks.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-white/40">
                <GIconSparkles size={28} className="mb-2 text-white/20" />
                <p className="text-xs">
                  Your mix is empty. Search for songs and tap <GIconPlus size={12} className="inline text-accent" /> to add them here!
                </p>
              </div>
            )}
            {currentPlaylistTracks.map((t: any, i: number) => {
              const isCurrent = queue === currentPlaylistTracks && i === queueIdx;
              return (
                <button
                  key={t.id}
                  onClick={() => startPlaying(currentPlaylistTracks, i)}
                  className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-xl transition-all ${
                    isCurrent ? "bg-white/15" : "hover:bg-white/5"
                  }`}
                >
                  <img
                    src={t.cover}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover shadow-md shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate text-white">{t.title}</div>
                    <div className="text-[11px] text-white/50 truncate">
                      {t.artist} · {t.genre}
                    </div>
                  </div>
                  {t.isPreview && (
                    <span className="text-[9px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded font-mono shrink-0">
                      stream
                    </span>
                  )}
                  {isCurrent && playing && <EqualizerBars className="shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Transport Controls */}
      <div className="border-t border-white/10 p-3 flex items-center gap-3 bg-black/35">
        <div
          className={`relative w-12 h-12 shrink-0 rounded-xl overflow-hidden shadow-lg ${
            playing ? "ring-2 ring-accent" : ""
          } transition-all`}
        >
          <img
            src={track?.cover || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300"}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="min-w-0 w-32 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="text-xs font-semibold truncate text-white">
              {track?.title || "Ready to play"}
            </div>
            {playing && <EqualizerBars className="shrink-0" />}
          </div>
          <div className="text-[10px] text-white/40 truncate">{track?.artist || "Select a song"}</div>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={prev}
            disabled={!queue.length}
            className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 text-white/80 hover:text-white"
            title="Previous"
          >
            <GIconBackward size={15} />
          </button>

          <button
            onClick={handleTogglePlay}
            className="p-2.5 bg-accent rounded-full hover:brightness-110 active:scale-95 transition text-white shadow-lg shadow-accent/30"
            title={playing ? "Pause" : "Play"}
          >
            {playing ? <GIconPause size={15} /> : <GIconPlay size={15} />}
          </button>

          <button
            onClick={next}
            disabled={!queue.length}
            className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 text-white/80 hover:text-white"
            title="Next"
          >
            <GIconForward size={15} />
          </button>
        </div>

        {/* Scrubber / Progress Bar */}
        <div className="flex-1 flex items-center gap-2 text-[10px] text-white/50 min-w-0">
          <span className="font-mono">{fmt(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || track?.duration || 0}
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            className="flex-1 accent-[rgb(var(--accent))] cursor-pointer h-1.5 bg-white/15 rounded-lg"
          />
          <span className="font-mono">{fmt(duration || track?.duration || 0)}</span>
        </div>

        {/* Volume Slider */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
            className="text-white/50 hover:text-white transition-colors"
          >
            {volume === 0 ? <GIconVolumeMute size={15} /> : <GIconVolume size={15} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-16 accent-[rgb(var(--accent))] cursor-pointer h-1.5 bg-white/15 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
