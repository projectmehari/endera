import { useState, useMemo } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useGenres, useTracksByGenre } from "@/hooks/useGenres";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Explore() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const { data: genres = [], isLoading: genresLoading } = useGenres();
  const { data: tracks = [], isLoading: tracksLoading } = useTracksByGenre(selectedGenres);
  const { playMix, currentMix, isPlaying } = useAudioPlayer();

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
      <SiteHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 md:px-8">
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

        <div className="meter-panel">
          <div className="border-b border-foreground px-4 py-2 flex items-center justify-between">
            <span className="meter-label">— TRACKS —</span>
            <span className="meter-label">{tracks.length} RESULTS</span>
          </div>
          <div className="p-2">
            {tracksLoading ? (
              <p className="meter-label p-2">LOADING...</p>
            ) : tracks.length === 0 ? (
              <p className="meter-label p-2">NO TRACKS MATCH YOUR SELECTION</p>
            ) : (
              tracks.map((track, i) => {
                const isActive = currentMix?.id === track.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => playMix({ ...track, artwork_url: track.artwork_url || "", display_order: 0, description: null } as any)}
                    className="w-full flex items-center gap-2 py-1.5 px-2 receipt-line last:border-0 hover:bg-secondary transition-colors text-left"
                  >
                    <span className="meter-label text-foreground w-5 text-right">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {track.artwork_url && (
                      <img
                        src={track.artwork_url}
                        alt=""
                        className="w-6 h-6 border border-foreground object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-mono uppercase truncate block ${isActive ? "text-destructive" : ""}`}>
                        {track.title}
                      </span>
                      <span className="meter-label">{track.artist.toUpperCase()}</span>
                    </div>
                    <span className="meter-label text-foreground shrink-0">
                      {formatDuration(track.duration_seconds)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
