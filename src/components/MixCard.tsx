import { useState } from "react";
import { useMixTracklist } from "@/hooks/useMixes";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import type { Mix } from "@/lib/radio-types";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MixRow({ mix, index }: { mix: Mix; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { tracks, loading } = useMixTracklist(expanded ? mix.id : null);
  const { playMix, currentMix, mode, isPlaying } = useAudioPlayer();

  const isActive = mode === "mix" && currentMix?.id === mix.id;

  return (
    <div
      className={`border-b border-foreground transition-colors ${
        isActive ? "bg-foreground text-background" : ""
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Number */}
        <span
          className={`meter-label w-6 shrink-0 ${
            isActive ? "text-background" : "text-foreground"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Title + Artist */}
        <button
          onClick={() => playMix(mix)}
          className="flex-1 min-w-0 text-left"
        >
          <span
            className={`meter-value text-sm truncate block ${
              isActive ? "text-background" : ""
            }`}
          >
            {mix.title}
          </span>
          <span
            className={`meter-label mt-0.5 block ${
              isActive ? "text-background/60" : ""
            }`}
          >
            {mix.artist.toUpperCase()}
          </span>
        </button>

        {/* Duration */}
        <span
          className={`meter-label shrink-0 ${
            isActive ? "text-background/60" : "text-foreground"
          }`}
        >
          {formatDuration(mix.duration_seconds)}
        </span>

        {/* Play / Now Playing indicator */}
        <button
          onClick={() => playMix(mix)}
          className={`shrink-0 meter-value text-xs px-2 py-1 transition-colors ${
            isActive
              ? "text-background"
              : "meter-panel hover:bg-foreground hover:text-background"
          }`}
        >
          {isActive && isPlaying ? "◼" : "▶"}
        </button>

        {/* Expand tracklist */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className={`shrink-0 meter-label transition-colors ${
            isActive ? "text-background/60 hover:text-background" : "hover:text-foreground"
          }`}
        >
          {expanded ? "▾" : "▸"}
        </button>
      </div>

      {/* Tracklist */}
      {expanded && (
        <div
          className={`px-4 pb-3 pl-12 ${
            isActive ? "border-t border-background/20" : "border-t border-foreground/20"
          }`}
        >
          {loading ? (
            <span className={`meter-label ${isActive ? "text-background/60" : ""}`}>
              LOADING…
            </span>
          ) : tracks.length === 0 ? (
            <span className={`meter-label ${isActive ? "text-background/60" : ""}`}>
              NO TRACKLIST AVAILABLE
            </span>
          ) : (
            tracks.map((t) => (
              <div
                key={t.id}
                className={`flex items-baseline gap-2 py-0.5 ${
                  isActive ? "text-background/80" : ""
                }`}
              >
                <span
                  className={`meter-label w-8 shrink-0 ${
                    isActive ? "text-background/50" : "text-foreground"
                  }`}
                >
                  {t.timestamp_label || String(t.position).padStart(2, "0")}
                </span>
                <span className="text-xs font-mono uppercase truncate">
                  {t.track_artist} — {t.track_title}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
