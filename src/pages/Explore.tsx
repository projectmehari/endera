import { useState, useMemo, useEffect } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LiveBar from "@/components/LiveBar";
import { useGenres, useTracksByGenre } from "@/hooks/useGenres";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Explore() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const { data: genres = [], isLoading: genresLoading } = useGenres();
  const { data: tracks = [], isLoading: tracksLoading } = useTracksByGenre(selectedGenres);
  const { playMix, currentMix } = useAudioPlayer();
  const [trackGenresMap, setTrackGenresMap] = useState<Record<string, string[]>>({});

  // Fetch all track genres for badge display
  useEffect(() => {
    supabase
      .from("track_genres" as any)
      .select("track_id, genre")
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string[]> = {};
          (data as any[]).forEach((r) => {
            if (!map[r.track_id]) map[r.track_id] = [];
            map[r.track_id].push(r.genre);
          });
          setTrackGenresMap(map);
        }
      });
  }, []);

  const filteredGenres = useMemo(() => {
    if (!search) return genres;
    return genres.filter((g) => g.includes(search.toLowerCase()));
  }, [genres, search]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 bg-background">
        <SiteHeader />
        <LiveBar />
      </div>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 md:px-8">
        {/* Genre filter section */}
        <div className="meter-panel mb-6">
          <div className="border-b border-foreground px-4 py-2">
            <span className="meter-label">— EXPLORE BY GENRE —</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search genres..."
                className="pl-9 font-mono text-xs"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {genresLoading ? (
                <span className="meter-label">LOADING...</span>
              ) : filteredGenres.length === 0 ? (
                <span className="meter-label">NO GENRES FOUND</span>
              ) : (
                filteredGenres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                      selectedGenres.includes(genre)
                        ? "bg-foreground text-background border-foreground"
                        : "bg-transparent text-foreground border-foreground/30 hover:border-foreground"
                    }`}
                  >
                    {genre}
                  </button>
                ))
              )}
            </div>
            {selectedGenres.length > 0 && (
              <button
                onClick={() => setSelectedGenres([])}
                className="meter-label hover:text-foreground transition-colors"
              >
                [CLEAR FILTERS]
              </button>
            )}
          </div>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <span className="meter-label">— TRACKS —</span>
          <span className="meter-label">{tracks.length} RESULTS</span>
        </div>

        {/* NTS-inspired card grid */}
        {tracksLoading ? (
          <p className="meter-label p-2">LOADING...</p>
        ) : tracks.length === 0 ? (
          <p className="meter-label p-2">NO TRACKS MATCH YOUR SELECTION</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-start">
            {tracks.map((track) => {
              const isActive = currentMix?.id === track.id;
              const trackGenres = trackGenresMap[track.id] || [];
              return (
                <button
                  key={track.id}
                  onClick={() =>
                    playMix({
                      ...track,
                      artwork_url: track.artwork_url || "",
                      display_order: 0,
                      description: null,
                    } as any)
                  }
                  className="group text-left border border-foreground/20 hover:border-foreground transition-colors bg-background"
                >
                  {/* Artwork */}
                  <div className="aspect-square w-full overflow-hidden bg-secondary relative">
                    {track.artwork_url ? (
                      <img
                        src={track.artwork_url}
                        alt={track.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="meter-label">NO ARTWORK</span>
                      </div>
                    )}
                    {/* Duration overlay */}
                    <span className="absolute bottom-1.5 right-1.5 bg-foreground/80 text-background text-[9px] font-mono px-1.5 py-0.5">
                      {formatDuration(track.duration_seconds)}
                    </span>
                    {/* Playing indicator */}
                    {isActive && (
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                        <div className="meter-dot-active" />
                        <span className="text-[8px] font-mono uppercase text-background bg-foreground/80 px-1">
                          PLAYING
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5 space-y-1.5">
                    {/* Date */}
                    {track.published_date && (
                      <span className="meter-label block">
                        {new Date(track.published_date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).toUpperCase()}
                      </span>
                    )}

                    {/* Title & artist */}
                    <p
                      className={`text-xs font-mono font-bold uppercase leading-tight line-clamp-2 ${
                        isActive ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="meter-label text-foreground/70">
                      {track.artist.toUpperCase()}
                    </p>

                    {/* Genre tags */}
                    {trackGenres.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {trackGenres.map((g) => (
                          <span
                            key={g}
                            className="text-[8px] font-mono uppercase tracking-wider border border-foreground/30 px-1.5 py-0.5 text-muted-foreground"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
