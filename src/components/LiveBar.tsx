import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function LiveBar() {
  const {
    mode,
    isPlaying,
    currentMix,
    liveData,
    liveLoading,
    mixElapsed,
    togglePlay,
    playLive,
    skipTrack,
  } = useAudioPlayer();

  const hasAdminToken =
    typeof window !== "undefined" && !!sessionStorage.getItem("admin_token");

  const isLive = mode === "live";

  // Determine display info
  let title = "";
  let artist = "";
  let elapsed = 0;
  let duration = 0;

  if (isLive) {
    if (liveData?.now_playing) {
      title = liveData.now_playing.title;
      artist = liveData.now_playing.artist;
      elapsed = liveData.elapsed_seconds;
      duration = liveData.now_playing.duration_seconds;
    }
  } else if (currentMix) {
    title = currentMix.title;
    artist = currentMix.artist;
    elapsed = mixElapsed;
    duration = currentMix.duration_seconds;
  }

  const progress = duration > 0 ? (elapsed / duration) * 100 : 0;
  const hasTrack = isLive ? !!liveData?.now_playing : !!currentMix;

  return (
    <div className="sticky top-0 z-50 border-b border-foreground bg-background">
      <div className="max-w-5xl mx-auto px-4 py-2 md:px-8">
        <div className="flex items-center gap-3">
          {/* Mode indicator */}
          {isLive ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <div className={isPlaying ? "meter-dot-active" : "meter-dot-off"} />
              <span className="meter-label text-foreground">LIVE</span>
            </div>
          ) : (
            <button
              onClick={playLive}
              className="meter-label hover:text-foreground transition-colors shrink-0"
            >
              ← LIVE
            </button>
          )}

          {/* Track info */}
          <div className="flex-1 min-w-0">
            {liveLoading && isLive ? (
              <span className="meter-label">
                CALIBRATING<span className="animate-blink">_</span>
              </span>
            ) : hasTrack ? (
              <div className="flex items-center gap-2 min-w-0">
                {!isLive && currentMix && (
                  <img
                    src={currentMix.artwork_url}
                    alt=""
                    className="w-6 h-6 border border-foreground object-cover shrink-0"
                  />
                )}
                <span className="meter-value text-xs truncate">
                  {title}
                </span>
                <span className="meter-label text-foreground hidden sm:inline shrink-0">
                  {artist.toUpperCase()}
                </span>
              </div>
            ) : (
              <span className="meter-label">NO SIGNAL</span>
            )}
          </div>

          {/* Progress */}
          {hasTrack && (
            <div className="hidden md:flex items-center gap-2 shrink-0 w-48">
              <span className="meter-label text-foreground text-[8px]">
                {formatTime(elapsed)}
              </span>
              <div className="flex-1 h-[2px] bg-muted relative">
                <div
                  className="h-full bg-foreground transition-all duration-1000"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <span className="meter-label text-foreground text-[8px]">
                {formatTime(duration)}
              </span>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={togglePlay}
              disabled={!hasTrack}
              className="meter-panel px-3 py-1 meter-value text-xs hover:bg-foreground hover:text-background transition-colors disabled:opacity-30"
            >
              {isPlaying ? "■" : "▶"}
            </button>
            {hasAdminToken && isLive && (
              <button
                onClick={skipTrack}
                disabled={!liveData?.now_playing}
                className="meter-panel px-2 py-1 meter-value text-xs hover:bg-foreground hover:text-background transition-colors disabled:opacity-30"
              >
                ▶▶
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
