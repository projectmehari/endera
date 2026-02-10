import { useState } from "react";
import { useMixTracklist } from "@/hooks/useMixes";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Play, Pause } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Track } from "@/lib/radio-types";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `00:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function MixRow({ mix, index, total }: { mix: Track; index: number; total: number }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { tracks, loading } = useMixTracklist(dialogOpen ? mix.id : null);
  const { playMix, currentMix, mode, isPlaying, pause, resume } = useAudioPlayer();

  const isActive = mode === "mix" && currentMix?.id === mix.id;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        artwork_url: "",
        description: null,
        display_order: mix.play_order,
        created_at: mix.created_at,
      });
    }
  };

  return (
    <>
      <div className="border-b border-muted-foreground/20">
        <div
          onClick={() => setDialogOpen(true)}
          className={`flex items-center px-2 py-4 md:px-4 transition-colors hover:bg-muted/50 cursor-pointer ${
            isActive ? "bg-muted/60" : ""
          }`}
        >
          {/* Play button */}
          <button
            onClick={handlePlay}
            className={`w-8 h-8 flex items-center justify-center shrink-0 rounded-full border transition-colors ${
              isActive
                ? "border-foreground text-foreground"
                : "border-muted-foreground/40 text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {isActive && isPlaying ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          {/* Artwork + Number */}
          {mix.artwork_url && (
            <img
              src={mix.artwork_url}
              alt=""
              className="w-8 h-8 border border-foreground object-cover shrink-0 ml-3"
            />
          )}
          <span className="font-mono text-sm text-muted-foreground w-10 shrink-0 text-right mr-4 ml-3">
            {String(total - index).padStart(3, "0")}
          </span>

          {/* Title + Artist label */}
          <div className="flex-1 min-w-0">
            <span
              className={`font-mono text-sm truncate block ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {mix.title.toLowerCase()}
            </span>
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
              {mix.artist}
            </span>
          </div>

          {/* Duration */}
          <span className="font-mono text-sm text-muted-foreground shrink-0 ml-4">
            {formatDuration(mix.duration_seconds)}
          </span>
        </div>

        {isActive && isPlaying && (
          <div className="h-[2px] bg-foreground" />
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md border-foreground bg-background p-0 gap-0">
          <DialogTitle className="sr-only">{mix.title}</DialogTitle>

          {mix.artwork_url && (
            <img
              src={mix.artwork_url}
              alt={mix.title}
              className="w-full aspect-square object-cover"
            />
          )}

          <div className="px-5 py-4 space-y-3">
            {/* Info + Play */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-mono text-sm text-foreground truncate">
                  {mix.title.toLowerCase()}
                </h3>
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
                  {mix.artist}
                </p>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  {formatDuration(mix.duration_seconds)}
                  {mix.published_date && (
                    <span className="ml-3 text-muted-foreground/60">
                      {new Date(mix.published_date + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
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

            {/* Tracklist */}
            <Separator className="bg-muted-foreground/20" />
            <ScrollArea className="max-h-60">
              {loading ? (
                <span className="font-mono text-xs text-muted-foreground">loading…</span>
              ) : tracks.length === 0 ? (
                <span className="font-mono text-xs text-muted-foreground">no tracklist available</span>
              ) : (
                <div className="space-y-1.5 pr-3">
                  {tracks.map((t) => (
                    <div key={t.id} className="flex items-baseline gap-3 font-mono text-xs text-muted-foreground">
                      <span className="w-[4.5rem] shrink-0 text-muted-foreground/60">
                        {t.timestamp_label
                          ? t.timestamp_label.replace(/\b(\d)\b/g, "0$1")
                          : String(t.position).padStart(2, "0")}
                      </span>
                      <span className="truncate">
                        {t.track_artist.toLowerCase()} — {t.track_title.toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
