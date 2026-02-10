import { useState } from "react";
import { useMixTracklist } from "@/hooks/useMixes";
import type { Mix } from "@/lib/radio-types";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MixCard({ mix }: { mix: Mix }) {
  const [expanded, setExpanded] = useState(false);
  const { tracks, loading } = useMixTracklist(expanded ? mix.id : null);

  return (
    <div className="meter-panel overflow-hidden">
      {/* Artwork */}
      <div className="aspect-square overflow-hidden border-b border-foreground">
        <img
          src={mix.artwork_url}
          alt={mix.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="meter-value text-sm leading-tight truncate">{mix.title}</p>
        <p className="meter-label mt-1 text-foreground">{mix.artist.toUpperCase()}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="meter-label">{formatDuration(mix.duration_seconds)}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="meter-label hover:text-foreground transition-colors"
          >
            {expanded ? "[HIDE TRACKLIST]" : "[TRACKLIST]"}
          </button>
        </div>
      </div>

      {/* Tracklist */}
      {expanded && (
        <div className="border-t border-foreground px-3 py-2">
          {loading ? (
            <span className="meter-label">LOADING…</span>
          ) : tracks.length === 0 ? (
            <span className="meter-label">NO TRACKLIST AVAILABLE</span>
          ) : (
            tracks.map((t) => (
              <div key={t.id} className="flex items-baseline justify-between py-1 receipt-line last:border-0">
                <div className="flex items-baseline gap-2 min-w-0 flex-1">
                  <span className="meter-label text-foreground w-6">
                    {t.timestamp_label || String(t.position).padStart(2, "0")}
                  </span>
                  <span className="text-xs font-mono uppercase truncate">
                    {t.track_artist} — {t.track_title}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
