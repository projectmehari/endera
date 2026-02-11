import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Track } from "@/lib/radio-types";

export function useGenres() {
  return useQuery({
    queryKey: ["genres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("track_genres" as any)
        .select("genre");
      if (error) throw error;
      const genres = [...new Set((data as any[]).map((r) => r.genre as string))].sort();
      return genres;
    },
  });
}

export function useTracksByGenre(selectedGenres: string[]) {
  return useQuery({
    queryKey: ["tracks-by-genre", selectedGenres],
    queryFn: async () => {
      if (selectedGenres.length === 0) {
        // Return all tracks when no genre filter
        const { data, error } = await supabase
          .from("tracks" as any)
          .select("*")
          .order("published_date", { ascending: false });
        if (error) throw error;
        return data as unknown as Track[];
      }

      // Get track IDs matching selected genres
      const { data: genreData, error: genreError } = await supabase
        .from("track_genres" as any)
        .select("track_id")
        .in("genre", selectedGenres);
      if (genreError) throw genreError;

      const trackIds = [...new Set((genreData as any[]).map((r) => r.track_id as string))];
      if (trackIds.length === 0) return [];

      const { data, error } = await supabase
        .from("tracks" as any)
        .select("*")
        .in("id", trackIds)
        .order("published_date", { ascending: false });
      if (error) throw error;
      return data as unknown as Track[];
    },
  });
}

export function useTrackGenres(trackId: string | null) {
  return useQuery({
    queryKey: ["track-genres", trackId],
    enabled: !!trackId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("track_genres" as any)
        .select("genre")
        .eq("track_id", trackId!);
      if (error) throw error;
      return (data as any[]).map((r) => r.genre as string);
    },
  });
}
