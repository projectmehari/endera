import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useNowPlaying } from "@/hooks/useNowPlaying";
import type { Mix, NowPlayingResponse } from "@/lib/radio-types";

type PlaybackMode = "live" | "mix";

interface AudioPlayerContextValue {
  mode: PlaybackMode;
  isPlaying: boolean;
  currentMix: Mix | null;
  liveData: NowPlayingResponse | null;
  liveLoading: boolean;
  mixElapsed: number;
  realDuration: number | null;
  volume: number;
  playLive: () => void;
  playMix: (mix: Mix) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  skipTrack: () => Promise<void>;
  setVolume: (v: number) => void;
  seek: (delta: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return ctx;
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [mode, setMode] = useState<PlaybackMode>("live");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMix, setCurrentMix] = useState<Mix | null>(null);
  const [mixElapsed, setMixElapsed] = useState(0);
  const [realDuration, setRealDuration] = useState<number | null>(null);
  const [currentLiveUrl, setCurrentLiveUrl] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(1);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
  }, []);

  const seek = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + delta));
  }, []);

  const { data: liveData, loading: liveLoading, refetch } = useNowPlaying(5000);
  const hasAutoPlayed = useRef(false);

  // Auto-play live radio on first load
  useEffect(() => {
    if (hasAutoPlayed.current || !liveData?.now_playing) return;
    hasAutoPlayed.current = true;
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.src = liveData.now_playing.file_url;
    audio.currentTime = liveData.elapsed_seconds;
    setCurrentLiveUrl(liveData.now_playing.file_url);
    audio.play().then(() => setIsPlaying(true)).catch(() => {
      // Browser blocked autoplay — stay in standby
    });
  }, [liveData]);

  // Sync live track changes
  useEffect(() => {
    if (mode !== "live" || !liveData?.now_playing) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (liveData.now_playing.file_url !== currentLiveUrl) {
      setCurrentLiveUrl(liveData.now_playing.file_url);
      audio.src = liveData.now_playing.file_url;
      audio.currentTime = liveData.elapsed_seconds;
      if (isPlaying) audio.play().catch(() => {});
    }
  }, [liveData?.now_playing?.file_url, liveData?.elapsed_seconds, mode]);

  // Track timeupdate + duration + ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (mode === "mix") setMixElapsed(audio.currentTime);
    };
    const onMeta = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setRealDuration(audio.duration);
      }
    };
    const onEnded = () => {
      if (mode === "mix") {
        setCurrentMix(null);
        setMode("live");
        setMixElapsed(0);
        if (liveData?.now_playing) {
          audio.src = liveData.now_playing.file_url;
          audio.currentTime = liveData.elapsed_seconds;
          audio.play().catch(() => {});
          setIsPlaying(true);
        } else {
          setIsPlaying(false);
        }
      } else if (mode === "live") {
        // Track ended in live mode — immediately fetch next track
        refetch().then(() => {});
      }
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("ended", onEnded);
    };
  }, [mode, liveData, refetch]);

  const playLive = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setMode("live");
    setCurrentMix(null);
    setMixElapsed(0);
    await refetch();
    if (liveData?.now_playing) {
      audio.src = liveData.now_playing.file_url;
      audio.currentTime = liveData.elapsed_seconds;
      audio.play().catch(() => {});
      setIsPlaying(true);
      setCurrentLiveUrl(liveData.now_playing.file_url);
    }
  }, [liveData, refetch]);

  const playMix = useCallback((mix: Mix) => {
    const audio = audioRef.current;
    if (!audio) return;
    setMode("mix");
    setCurrentMix(mix);
    setMixElapsed(0);
    audio.src = mix.file_url;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      if (mode === "live" && audioRef.current && liveData?.now_playing) {
        const audio = audioRef.current;
        if (!audio.src || audio.src !== liveData.now_playing.file_url) {
          audio.src = liveData.now_playing.file_url;
          audio.currentTime = liveData.elapsed_seconds;
        }
        audio.play().catch(() => {});
        setIsPlaying(true);
        setCurrentLiveUrl(liveData.now_playing.file_url);
      } else {
        resume();
      }
    }
  }, [isPlaying, pause, resume, mode, liveData]);

  const skipTrack = useCallback(async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.functions.invoke("skip-track", { body: { token } });
    audioRef.current?.pause();
    await refetch();
    if (audioRef.current && liveData?.now_playing) {
      audioRef.current.src = liveData.now_playing.file_url;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [refetch, liveData]);

  return (
    <AudioPlayerContext.Provider
      value={{
        mode,
        isPlaying,
        currentMix,
        liveData,
        liveLoading,
        mixElapsed,
        realDuration,
        volume,
        playLive,
        playMix,
        pause,
        resume,
        togglePlay,
        skipTrack,
        setVolume,
        seek,
      }}
    >
      {children}
      <audio ref={audioRef} preload="none" />
    </AudioPlayerContext.Provider>
  );
}
