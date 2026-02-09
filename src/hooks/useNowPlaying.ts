import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { NowPlayingResponse } from "@/lib/radio-types";

export function useNowPlaying(pollIntervalMs = 5000) {
  const [data, setData] = useState<NowPlayingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNowPlaying = useCallback(async () => {
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("now-playing");
      if (fnError) throw fnError;
      setData(result as NowPlayingResponse);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to fetch now playing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchNowPlaying, pollIntervalMs]);

  return { data, loading, error, refetch: fetchNowPlaying };
}
