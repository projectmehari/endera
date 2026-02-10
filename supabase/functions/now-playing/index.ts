import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get station config
    const { data: config } = await supabase
      .from("station_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!config) {
      return new Response(
        JSON.stringify({ now_playing: null, up_next: [], elapsed_seconds: 0, total_tracks: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all tracks ordered by play_order
    const { data: tracks } = await supabase
      .from("tracks")
      .select("*")
      .order("play_order", { ascending: true });

    if (!tracks || tracks.length === 0) {
      return new Response(
        JSON.stringify({ now_playing: null, up_next: [], elapsed_seconds: 0, total_tracks: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate which track is playing based on server clock
    const playlistStarted = new Date(config.playlist_started_at).getTime();
    const now = Date.now();
    const elapsedTotal = Math.floor((now - playlistStarted) / 1000);

    // Calculate total playlist duration
    const totalDuration = tracks.reduce((sum: number, t: any) => sum + t.duration_seconds, 0);

    if (totalDuration === 0) {
      return new Response(
        JSON.stringify({ now_playing: null, up_next: [], elapsed_seconds: 0, total_tracks: tracks.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Loop the playlist
    const positionInPlaylist = ((elapsedTotal % totalDuration) + totalDuration) % totalDuration;

    // Find current track
    let accumulated = 0;
    let currentIndex = 0;
    let elapsedInTrack = 0;

    for (let i = 0; i < tracks.length; i++) {
      if (accumulated + tracks[i].duration_seconds > positionInPlaylist) {
        currentIndex = i;
        elapsedInTrack = positionInPlaylist - accumulated;
        break;
      }
      accumulated += tracks[i].duration_seconds;
    }

    // Build up_next (next 5 tracks, wrapping around)
    const upNext = [];
    for (let j = 1; j <= Math.min(5, tracks.length - 1); j++) {
      upNext.push(tracks[(currentIndex + j) % tracks.length]);
    }

    return new Response(
      JSON.stringify({
        now_playing: tracks[currentIndex],
        up_next: upNext,
        elapsed_seconds: elapsedInTrack,
        total_tracks: tracks.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("now-playing error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
