import { useState } from "react";
import { useMixTracklist } from "@/hooks/useMixes";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import type { Mix } from "@/lib/radio-types";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `00:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function MixRow({ mix, index }: { mix: Mix; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { tracks, loading } = useMixTracklist(expanded ? mix.id : null);
  const { playMix, currentMix, mode, isPlaying } = useAudioPlayer();

  const isActive = mode === "mix" && currentMix?.id === mix.id;

  return (
    <div className="border-b border-muted-foreground/20">
      {/* Main row — clickable to play */}
      <div
        className={`flex items-center px-2 py-4 md:px-4 cursor-pointer transition-colors hover:bg-muted/50 ${
          isActive ? "bg-muted/60" : ""
        }`}
        onClick={() => playMix(mix)}
      >
        {/* Number */}
        <span className="font-mono text-sm text-muted-foreground w-12 shrink-0">
          {mix.display_order || index + 1}
        </span>

        {/* Title */}
        <span
          className={`flex-1 min-w-0 font-mono text-sm truncate ${
            isActive ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {mix.title.toLowerCase()}
        </span>

        {/* Duration */}
        <span className="font-mono text-sm text-muted-foreground shrink-0 ml-4">
          {formatDuration(mix.duration_seconds)}
        </span>

        {/* Expand chevron */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="ml-4 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Now-playing indicator */}
      {isActive && isPlaying && (
        <div className="h-[2px] bg-foreground" />
      )}

      {/* Tracklist */}
      {expanded && (
        <div className="px-2 md:px-4 pb-4 pl-14">
          {loading ? (
            <span className="font-mono text-xs text-muted-foreground">
              loading…
            </span>
          ) : tracks.length === 0 ? (
            <span className="font-mono text-xs text-muted-foreground">
              no tracklist available
            </span>
          ) : (
            <div className="space-y-1">
              {tracks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-baseline gap-3 font-mono text-xs text-muted-foreground"
                >
                  <span className="w-10 shrink-0 text-muted-foreground/60">
                    {t.timestamp_label || String(t.position).padStart(2, "0")}
                  </span>
                  <span className="truncate">
                    {t.track_artist.toLowerCase()} — {t.track_title.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
