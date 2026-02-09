import { useState, useRef, useEffect } from "react";
import { Play, Square, Radio } from "lucide-react";
import { useNowPlaying } from "@/hooks/useNowPlaying";

export default function RadioPlayer() {
  const { data, loading } = useNowPlaying(5000);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null);

  // When now_playing changes, update the audio source
  useEffect(() => {
    if (data?.now_playing && data.now_playing.file_url !== currentFileUrl) {
      setCurrentFileUrl(data.now_playing.file_url);
      if (audioRef.current) {
        audioRef.current.src = data.now_playing.file_url;
        // Seek to the elapsed position
        audioRef.current.currentTime = data.elapsed_seconds;
        if (isPlaying) {
          audioRef.current.play().catch(() => {});
        }
      }
    }
  }, [data?.now_playing?.file_url, data?.elapsed_seconds]);

  const togglePlay = () => {
    if (!audioRef.current || !data?.now_playing) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = data.now_playing.file_url;
      audioRef.current.currentTime = data.elapsed_seconds;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-radio-dark">
      <div className="w-full max-w-lg">
        {/* Station Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl font-bold radio-glow-text tracking-wide">
            INTERNET RADIO
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className={isPlaying ? "radio-indicator animate-pulse-glow" : "radio-indicator-off"} />
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
              {isPlaying ? "On Air" : "Off Air"}
            </span>
          </div>
        </div>

        {/* Main Radio Panel */}
        <div className="radio-panel rounded-xl p-6 border border-border">
          {/* Now Playing Display */}
          <div className="radio-embossed rounded-lg p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-primary" />
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Now Playing
              </span>
            </div>
            {loading ? (
              <div className="text-muted-foreground text-sm">Tuning in...</div>
            ) : data?.now_playing ? (
              <div>
                <p className="font-display text-xl font-bold text-foreground truncate">
                  {data.now_playing.title}
                </p>
                <p className="text-primary text-sm mt-1 font-typewriter">
                  {data.now_playing.artist}
                </p>
                <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground font-mono">
                  <span>{formatTime(data.elapsed_seconds)}</span>
                  <div className="flex-1 mx-3 h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{
                        width: `${(data.elapsed_seconds / Math.max(data.now_playing.duration_seconds, 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span>{formatTime(data.now_playing.duration_seconds)}</span>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground font-typewriter text-sm">
                No tracks in the queue. Silence...
              </div>
            )}
          </div>

          {/* Play Button */}
          <div className="flex justify-center mb-5">
            <button
              onClick={togglePlay}
              disabled={!data?.now_playing}
              className="w-16 h-16 rounded-full bg-secondary border-2 border-border flex items-center justify-center hover:border-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed group"
              aria-label={isPlaying ? "Stop" : "Play"}
            >
              {isPlaying ? (
                <Square className="w-6 h-6 text-primary group-hover:text-radio-glow transition-colors" />
              ) : (
                <Play className="w-6 h-6 text-primary group-hover:text-radio-glow transition-colors ml-1" />
              )}
            </button>
          </div>

          {/* Up Next */}
          {data?.up_next && data.up_next.length > 0 && (
            <div className="radio-embossed rounded-lg p-4">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 block">
                Up Next
              </span>
              <div className="space-y-2">
                {data.up_next.map((track, i) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-muted-foreground font-mono text-xs w-4">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-foreground truncate text-sm">{track.title}</p>
                        <p className="text-muted-foreground text-xs truncate">{track.artist}</p>
                      </div>
                    </div>
                    <span className="text-muted-foreground font-mono text-xs ml-2">
                      {formatTime(track.duration_seconds)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <a
            href="/admin"
            className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono"
          >
            ⚙ manage
          </a>
        </div>

        <audio ref={audioRef} preload="none" />
      </div>
    </div>
  );
}
