import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Play, Pause } from "lucide-react";
import type { Track } from "@/lib/radio-types";

function useArtworkColor(url: string | null) {
  const [color, setColor] = useState<string | null>(null);
  useEffect(() => {
    if (!url) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 8;
        canvas.height = 8;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 8, 8);
        const data = ctx.getImageData(0, 0, 8, 8).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
        }
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        setColor(`${r}, ${g}, ${b}`);
      } catch {}
    };
    img.src = url;
  }, [url]);
  return color;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `00:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function MixRow({ mix, index, total }: { mix: Track; index: number; total: number }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const artworkColor = useArtworkColor(mix.artwork_url);

  // Apply a full-page color wash on hover via a fixed overlay
  useEffect(() => {
    const overlay = document.getElementById("artwork-color-overlay");
    if (!overlay) return;
    if (hovered && artworkColor) {
      overlay.style.backgroundColor = `rgba(${artworkColor}, 0.06)`;
      overlay.style.opacity = "1";
    } else if (!hovered) {
      overlay.style.opacity = "0";
    }
  }, [hovered, artworkColor]);
  const [probedDuration, setProbedDuration] = useState<number | null>(null);

  // Probe real audio duration
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    const onMeta = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setProbedDuration(Math.round(audio.duration));
      }
    };
    audio.addEventListener("loadedmetadata", onMeta);
    audio.src = mix.file_url;
    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.src = "";
    };
  }, [mix.file_url]);
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
      <div className="border-b border-muted-foreground/20">
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => navigate(`/mix/${mix.id}`)}
          className={`flex items-center px-2 py-4 md:px-4 transition-colors hover:bg-muted/30 cursor-pointer ${
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
            {formatDuration(probedDuration ?? mix.duration_seconds)}
          </span>
        </div>

        {isActive && isPlaying && (
          <div className="h-[2px] bg-foreground" />
        )}
    </div>
  );
}
