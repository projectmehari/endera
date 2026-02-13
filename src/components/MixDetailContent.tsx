import { useEffect } from "react";
import { useMixTracklist } from "@/hooks/useMixes";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Play, Pause, Download } from "lucide-react";
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

interface MixDetailContentProps {
  mix: Track;
}

export default function MixDetailContent({ mix }: MixDetailContentProps) {
  const { tracks: tracklist, loading: tracklistLoading } = useMixTracklist(mix.id);
  const { playMix, currentMix, mode, isPlaying, pause, resume } = useAudioPlayer();

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

  const featuredArtists =
    tracklist.length > 0 ? tracklist.map((t) => t.track_artist).join(", ") : null;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Artwork */}
      {mix.artwork_url && (
        <img
          src={mix.artwork_url}
          alt={mix.title}
          className="w-full max-w-lg aspect-square object-cover"
        />
      )}

      <div className="h-6 md:h-10" />

      {/* Title + artist */}
      <div className="text-center max-w-lg w-full space-y-2">
        <h2 className="font-mono text-sm md:text-base text-foreground lowercase">
          {mix.title}
        </h2>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
          {mix.artist}
        </p>
      </div>

      {/* Featured artists */}
      {featuredArtists && (
        <p className="font-mono text-xs text-muted-foreground text-center max-w-lg mt-4 leading-relaxed">
          Featuring: {featuredArtists}
        </p>
      )}

      {/* Play + Download buttons */}
      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={handlePlay}
          className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-colors ${
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
        <a
          href={mix.file_url}
          download
          className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-muted-foreground/40 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          title="Download mix"
        >
          <Download size={18} />
        </a>
      </div>

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
      <div className="w-full max-w-lg mt-8">
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
                  {t.timestamp_label ? t.timestamp_label.replace(/\b(\d)\b/g, "0$1") : ""}
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
    </div>
  );
}
