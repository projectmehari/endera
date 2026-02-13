import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMixTracklist } from "@/hooks/useMixes";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Play, Pause, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { Track } from "@/lib/radio-types";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MixDetail() {
  const { id } = useParams<{ id: string }>();
  const [mix, setMix] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const { tracks: tracklist, loading: tracklistLoading } = useMixTracklist(id ?? null);
  const { playMix, currentMix, mode, isPlaying, pause, resume } = useAudioPlayer();

  useEffect(() => {
    if (!id) return;
    supabase
      .from("tracks")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setMix(data as Track | null);
        setLoading(false);
      });
  }, [id]);

  const isActive = mode === "mix" && currentMix?.id === mix?.id;

  const handlePlay = () => {
    if (!mix) return;
    if (isActive && isPlaying) {
      pause();
    } else if (isActive) {
      resume();
    } else {
      playMix({
        id: mix.id,
        title: mix.title,
        artist: mix.artist,
        file_url: mix.file_url,
        duration_seconds: mix.duration_seconds,
        artwork_url: mix.artwork_url || "",
        description: null,
        display_order: mix.play_order,
        created_at: mix.created_at,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="font-mono text-sm text-muted-foreground">
          loading<span className="animate-blink">_</span>
        </span>
      </div>
    );
  }

  if (!mix) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <span className="font-mono text-sm text-muted-foreground">mix not found</span>
        <Link to="/" className="font-mono text-xs text-muted-foreground hover:text-foreground underline">
          ← back
        </Link>
      </div>
    );
  }

  const featuredArtists = tracklist.length > 0
    ? tracklist.map((t) => t.track_artist).join(", ")
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col items-center px-4 py-8 md:py-16">
        {/* Back link */}
        <div className="w-full max-w-lg mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={12} />
            back
          </Link>
        </div>

        {/* Artwork */}
        {mix.artwork_url && (
          <img
            src={mix.artwork_url}
            alt={mix.title}
            className="w-full max-w-lg aspect-square object-cover"
          />
        )}

        {/* Spacer */}
        <div className="h-10 md:h-16" />

        {/* Title + artist */}
        <div className="text-center max-w-lg w-full space-y-2">
          <h1 className="font-mono text-sm md:text-base text-foreground lowercase">
            {mix.title}
          </h1>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
            {mix.artist}
          </p>
        </div>

        {/* Featured artists blurb */}
        {featuredArtists && (
          <p className="font-mono text-xs text-muted-foreground text-center max-w-lg mt-6 leading-relaxed">
            Featuring: {featuredArtists}
          </p>
        )}

        {/* Play button */}
        <button
          onClick={handlePlay}
          className={`mt-8 w-12 h-12 flex items-center justify-center rounded-full border-2 transition-colors ${
            isActive
              ? "border-foreground text-foreground"
              : "border-muted-foreground/40 text-muted-foreground hover:border-foreground hover:text-foreground"
          }`}
        >
          {isActive && isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        {/* Duration + date */}
        <p className="font-mono text-xs text-muted-foreground mt-3">
          {formatDuration(mix.duration_seconds)}
          {mix.published_date && (
            <span className="ml-3 text-muted-foreground/60">
              {new Date(mix.published_date + "T00:00:00").toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </p>

        {/* Tracklist */}
        <div className="w-full max-w-lg mt-10">
          <Separator className="bg-muted-foreground/20 mb-6" />
          {tracklistLoading ? (
            <span className="font-mono text-xs text-muted-foreground">loading…</span>
          ) : tracklist.length === 0 ? (
            <span className="font-mono text-xs text-muted-foreground">no tracklist available</span>
          ) : (
            <div className="space-y-3">
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
        </div>
      </main>
    </div>
  );
}
