import { useState, useRef, useEffect } from "react";
import { useNowPlaying } from "@/hooks/useNowPlaying";
import { supabase } from "@/integrations/supabase/client";

export default function RadioPlayer() {
  const { data, loading, refetch } = useNowPlaying(5000);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (data?.now_playing && data.now_playing.file_url !== currentFileUrl) {
      setCurrentFileUrl(data.now_playing.file_url);
      if (audioRef.current) {
        audioRef.current.src = data.now_playing.file_url;
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

  const handleSkip = async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;
    await supabase.functions.invoke("skip-track", { body: { token } });
    if (audioRef.current) {
      audioRef.current.pause();
    }
    await refetch();
    if (audioRef.current && isPlaying && data?.now_playing) {
      audioRef.current.src = data.now_playing.file_url;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const hasAdminToken = typeof window !== "undefined" && !!sessionStorage.getItem("admin_token");

  return (
    <section className="w-full max-w-md mx-auto">
      <div className="meter-panel p-0">
        {/* Station ID */}
        <div className="px-4 pt-6 pb-2 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight uppercase leading-none">
            ENDERA
          </h1>
          <h1 className="font-display text-2xl font-bold tracking-tight uppercase leading-none">
            .FM
          </h1>
          <div className="mt-2 meter-label text-center">
            AUDIO TRANSMISSION EQUIPMENT BY ENDERA
          </div>
        </div>

        <div className="receipt-tear mx-4 my-4" />

        {/* Status indicator */}
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={isPlaying ? "meter-dot-active" : "meter-dot-off"} />
            <span className="meter-label">
              {isPlaying ? "TRANSMITTING" : "STANDBY"}
            </span>
          </div>
        </div>

        {/* Now Playing readout */}
        <div className="mx-4 mt-4 meter-inset p-4">
          <div className="meter-label mb-2">— CURRENT READING —</div>
          {loading ? (
            <div className="meter-value text-sm text-muted-foreground">
              CALIBRATING<span className="animate-blink">_</span>
            </div>
          ) : data?.now_playing ? (
            <div>
              <p className="meter-value text-lg leading-tight">
                {data.now_playing.title}
              </p>
              <p className="meter-label mt-1 text-foreground tracking-[0.1em]">
                BY {data.now_playing.artist.toUpperCase()}
              </p>

              {/* Progress bar */}
              <div className="mt-4 flex items-center gap-2">
                <span className="meter-label text-foreground">{formatTime(data.elapsed_seconds)}</span>
                <div className="flex-1 h-[3px] bg-muted relative">
                  <div
                    className="h-full bg-foreground transition-all duration-1000"
                    style={{
                      width: `${(data.elapsed_seconds / Math.max(data.now_playing.duration_seconds, 1)) * 100}%`,
                    }}
                  />
                </div>
                <span className="meter-label text-foreground">{formatTime(data.now_playing.duration_seconds)}</span>
              </div>
            </div>
          ) : (
            <div className="meter-value text-sm text-muted-foreground">
              NO SIGNAL DETECTED
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-4 mt-4 flex justify-center gap-2">
          <button
            onClick={togglePlay}
            disabled={!data?.now_playing}
            className="meter-panel px-8 py-2 meter-value text-sm hover:bg-foreground hover:text-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isPlaying ? "■ STOP" : "▶ TUNE IN"}
          </button>
          {hasAdminToken && (
            <button
              onClick={handleSkip}
              disabled={!data?.now_playing}
              className="meter-panel px-4 py-2 meter-value text-sm hover:bg-foreground hover:text-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              SKIP ▶▶
            </button>
          )}
        </div>

        <div className="receipt-tear mx-4 my-4" />

        {/* Up Next queue */}
        <div className="px-4 pb-2">
          <div className="meter-label mb-2">— UPCOMING READINGS —</div>
          {data?.up_next && data.up_next.length > 0 ? (
            <div>
              {data.up_next.map((track, i) => (
                <div
                  key={track.id}
                  className="flex items-baseline justify-between py-1 receipt-line last:border-0"
                >
                  <div className="flex items-baseline gap-2 min-w-0 flex-1">
                    <span className="meter-label text-foreground w-4">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-xs font-mono uppercase truncate">{track.title}</span>
                  </div>
                  <span className="meter-label text-foreground ml-2">{formatTime(track.duration_seconds)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="meter-value text-xs text-muted-foreground">QUEUE EMPTY</div>
          )}
        </div>

        <div className="receipt-tear mx-4 my-2" />

        {/* Footer */}
        <div className="px-4 py-3">
          <span className="meter-label">
            {data?.total_tracks || 0} TRACKS LOADED
          </span>
        </div>
      </div>

      <audio ref={audioRef} preload="none" />
    </section>
  );
}
