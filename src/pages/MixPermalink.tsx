import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LiveBar from "@/components/LiveBar";
import { supabase } from "@/integrations/supabase/client";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useMixTracklist } from "@/hooks/useMixes";
import { useFavorites } from "@/hooks/useFavorites";
import { Separator } from "@/components/ui/separator";
import { Play, Pause, Heart, Link as LinkIcon, ArrowLeft } from "lucide-react";
import type { Track } from "@/lib/radio-types";
import { toast } from "sonner";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MixPermalink() {
  const { id } = useParams<{ id: string }>();
  const [mix, setMix] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const { tracks: tracklist, loading: tracklistLoading } = useMixTracklist(id ?? null);
  const { playMix, currentMix, mode, isPlaying, pause, resume } = useAudioPlayer();
  const { isFavorite, toggle } = useFavorites();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <span className="meter-label">LOADING<span className="animate-blink">_</span></span>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!mix) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="meter-panel p-8 text-center">
            <p className="meter-value text-lg">NOT FOUND</p>
            <Link to="/" className="meter-label mt-3 block hover:text-foreground transition-colors">
              ← BACK TO HOME
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const isActive = mode === "mix" && currentMix?.id === mix.id;

  const handlePlay = () => {
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

  const handleShare = () => {
    const url = `${window.location.origin}/mix/${mix.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast("Link copied to clipboard");
    });
  };

  const fav = isFavorite(mix.id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 bg-background">
        <SiteHeader />
        <LiveBar />
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 md:px-8">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 meter-label hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={10} />
          BACK
        </Link>

        <div className="md:flex gap-6">
          {/* Artwork */}
          {mix.artwork_url && (
            <div className="shrink-0 mb-4 md:mb-0">
              <img
                src={mix.artwork_url}
                alt={mix.title}
                className="w-full md:w-64 aspect-square object-cover border border-foreground"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h1 className="font-mono text-lg font-bold text-foreground leading-tight">
                {mix.title.toLowerCase()}
              </h1>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase mt-1">
                {mix.artist}
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-2">
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
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlay}
                className={`w-10 h-10 flex items-center justify-center rounded-full border transition-colors ${
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-muted-foreground/40 text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {isActive && isPlaying ? (
                  <Pause size={18} fill="currentColor" />
                ) : (
                  <Play size={18} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              <button
                onClick={() => toggle(mix.id)}
                className={`p-2 transition-colors ${
                  fav ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                }`}
                title={fav ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart size={18} fill={fav ? "currentColor" : "none"} />
              </button>

              <button
                onClick={handleShare}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy link"
              >
                <LinkIcon size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Tracklist */}
        <Separator className="bg-muted-foreground/20 my-6" />
        <div>
          <span className="meter-label mb-3 block">— TRACKLIST —</span>
          {tracklistLoading ? (
            <span className="font-mono text-xs text-muted-foreground">loading…</span>
          ) : tracklist.length === 0 ? (
            <span className="font-mono text-xs text-muted-foreground">no tracklist available</span>
          ) : (
            <div className="space-y-2.5">
              {tracklist.map((t) => (
                <div key={t.id} className="flex gap-3 font-mono text-xs">
                  <span className="w-[4.5rem] shrink-0 text-muted-foreground/50 pt-0.5">
                    {t.timestamp_label ? t.timestamp_label.replace(/\b(\d)\b/g, "0$1") : ""}
                  </span>
                  <div className="min-w-0">
                    <span className="block font-bold text-foreground uppercase truncate">
                      {t.track_artist}
                    </span>
                    <span className="block text-muted-foreground truncate">{t.track_title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
