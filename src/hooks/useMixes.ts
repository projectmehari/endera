import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Mix, MixTracklistEntry } from "@/lib/radio-types";

export function useMixes() {
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("mixes")
        .select("*")
        .order("display_order", { ascending: true });
      setMixes((data as Mix[]) || []);
      setLoading(false);
    }
    fetch();
  }, []);

  return { mixes, loading };
}

export function useMixTracklist(mixId: string | null) {
  const [tracks, setTracks] = useState<MixTracklistEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mixId) { setTracks([]); return; }
    setLoading(true);
    supabase
      .from("mix_tracklists")
      .select("*")
      .eq("mix_id", mixId)
      .order("position", { ascending: true })
      .then(({ data }) => {
        setTracks((data as MixTracklistEntry[]) || []);
        setLoading(false);
      });
  }, [mixId]);

  return { tracks, loading };
}
