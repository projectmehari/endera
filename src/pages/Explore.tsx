import { useState, useMemo, useEffect } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LiveBar from "@/components/LiveBar";
import { useGenres, useTracksByGenre } from "@/hooks/useGenres";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useMixTracklist } from "@/hooks/useMixes";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Track } from "@/lib/radio-types";

function ExploreTrackDialog({
  track,
  open,
  onOpenChange,
}: {
  track: Track;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { tracks: tracklist, loading } = useMixTracklist(open ? track.id : null);
  const { playMix, currentMix, mode, isPlaying, pause, resume } = useAudioPlayer();

  const isActive = mode === "mix" && currentMix?.id === track.id;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive && isPlaying) {
      pause();
    } else if (isActive) {
      resume();
    } else {
      playMix({
        id: track.id,
        title: track.title,
        artist: track.artist,
        file_url: track.file_url,
        duration_seconds: track.duration_seconds,
        artwork_url: track.artwork_url || "",
        description: null,
        display_order: 0,
        created_at: track.created_at,
      });
    }
  };

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-foreground bg-background p-0 gap-0">
        <DialogTitle className="sr-only">{track.title}</DialogTitle>

        {track.artwork_url && (
          <img
            src={track.artwork_url}
            alt={track.title}
            className="w-full aspect-square object-cover"
          />
        )}

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-mono text-sm text-foreground truncate">
                {track.title.toLowerCase()}
              </h3>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
                {track.artist}
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                {formatDuration(track.duration_seconds)}
                {track.published_date && (
                  <span className="ml-3 text-muted-foreground/60">
                    {new Date(track.published_date + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handlePlay}
              className={`w-9 h-9 flex items-center justify-center shrink-0 rounded-full border transition-colors ${
                isActive
                  ? "border-foreground text-foreground"
                  : "border-muted-foreground/40 text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {isActive && isPlaying ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" className="ml-0.5" />
              )}
            </button>
          </div>

          <Separator className="bg-muted-foreground/20" />
          <ScrollArea className="max-h-[50vh]">
            {loading ? (
              <span className="font-mono text-xs text-muted-foreground">loading…</span>
            ) : tracklist.length === 0 ? (
              <span className="font-mono text-xs text-muted-foreground">no tracklist available</span>
            ) : (
              <div className="space-y-2.5 pr-3">
                {tracklist.map((t) => (
                  <div key={t.id} className="flex gap-3 font-mono text-xs">
                    <span className="w-[4.5rem] shrink-0 text-muted-foreground/50 pt-0.5">
                      {t.timestamp_label
                        ? t.timestamp_label.replace(/\b(\d)\b/g, "0$1")
                        : ""}
                    </span>
                    <div className="min-w-0">
                      <span className="block font-bold text-foreground uppercase truncate">
                        {t.track_artist}
                      </span>
                      <span className="block text-muted-foreground truncate">
                        {t.track_title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Explore() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const { data: genres = [], isLoading: genresLoading } = useGenres();
  const { data: tracks = [], isLoading: tracksLoading } = useTracksByGenre(selectedGenres);
  const { currentMix } = useAudioPlayer();
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
                  onClick={() => setSelectedTrack(track)}
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
                    {track.published_date && (
                      <span className="meter-label block">
                        {new Date(track.published_date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).toUpperCase()}
                      </span>
                    )}
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

      {selectedTrack && (
        <ExploreTrackDialog
          track={selectedTrack}
          open={!!selectedTrack}
          onOpenChange={(open) => { if (!open) setSelectedTrack(null); }}
        />
      )}
    </div>
  );
}
