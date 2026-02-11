import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Slider } from "@/components/ui/slider";
import { SkipBack, SkipForward, Volume2 } from "lucide-react";

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
    realDuration,
    volume,
    togglePlay,
    playLive,
    skipTrack,
    setVolume,
    seek,
  } = useAudioPlayer();

  const hasAdminToken =
    typeof window !== "undefined" && !!sessionStorage.getItem("admin_token");

  const isLive = mode === "live";

  let title = "";
  let artist = "";
  let elapsed = 0;
  let duration = 0;
  let artworkUrl: string | null = null;

  if (isLive) {
    if (liveData?.now_playing) {
      title = liveData.now_playing.title;
      artist = liveData.now_playing.artist;
      elapsed = liveData.elapsed_seconds;
      duration = realDuration ?? liveData.now_playing.duration_seconds;
      artworkUrl = (liveData.now_playing as any).artwork_url ?? null;
    }
  } else if (currentMix) {
    title = currentMix.title;
    artist = currentMix.artist;
    elapsed = mixElapsed;
    duration = realDuration ?? currentMix.duration_seconds;
    artworkUrl = currentMix.artwork_url;
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
          <div className="min-w-0 shrink-0 max-w-[40%]">
            {liveLoading && isLive ? (
              <span className="meter-label">
                CALIBRATING<span className="animate-blink">_</span>
              </span>
            ) : hasTrack ? (
              <div className="flex items-center gap-2 min-w-0">
                {artworkUrl && (
                  <img
                    src={artworkUrl}
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
            <div className="hidden md:flex flex-1 items-center gap-2">
              <span className="meter-label text-foreground text-[8px]">
                {formatTime(elapsed)}
              </span>
              <Slider
                value={[elapsed]}
                max={duration || 1}
                step={1}
                onValueChange={([v]) => {
                  const audio = document.querySelector('audio');
                  if (audio) audio.currentTime = v;
                }}
                className="flex-1 [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_[role=slider]]:border-foreground [&_.relative]:h-[2px]"
              />
              <span className="meter-label text-foreground text-[8px]">
                {formatTime(duration)}
              </span>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Seek back */}
            <button
              onClick={() => seek(-10)}
              disabled={!hasTrack}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            >
              <SkipBack size={12} />
            </button>

            <button
              onClick={togglePlay}
              disabled={!hasTrack}
              className="meter-panel px-3 py-1 meter-value text-xs hover:bg-foreground hover:text-background transition-colors disabled:opacity-30"
            >
              {isPlaying ? "■" : "▶"}
            </button>

            {/* Seek forward */}
            <button
              onClick={() => seek(10)}
              disabled={!hasTrack}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            >
              <SkipForward size={12} />
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

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <Volume2 size={12} className="text-muted-foreground shrink-0" />
              <Slider
                value={[volume * 100]}
                onValueChange={([v]) => setVolume(v / 100)}
                max={100}
                step={1}
                className="w-20 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-foreground [&_.relative]:h-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
