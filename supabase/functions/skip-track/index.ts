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
    const { token } = await req.json();
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");

    // Validate admin token
    if (!token || !adminPassword) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const decoded = atob(token);
      if (!decoded.includes(adminPassword)) {
        throw new Error("Invalid token");
      }
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
        JSON.stringify({ success: false, error: "No station config" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tracks
    const { data: tracks } = await supabase
      .from("tracks")
      .select("*")
      .order("play_order", { ascending: true });

    if (!tracks || tracks.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No tracks" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate current position
    const playlistStarted = new Date(config.playlist_started_at).getTime();
    const now = Date.now();
    const elapsedTotal = Math.floor((now - playlistStarted) / 1000);
    const totalDuration = tracks.reduce((sum: number, t: any) => sum + t.duration_seconds, 0);
    const positionInPlaylist = ((elapsedTotal % totalDuration) + totalDuration) % totalDuration;

    // Find current track and remaining seconds
    let accumulated = 0;
    let remainingSeconds = 0;
    for (let i = 0; i < tracks.length; i++) {
      if (accumulated + tracks[i].duration_seconds > positionInPlaylist) {
        const elapsedInTrack = positionInPlaylist - accumulated;
        remainingSeconds = tracks[i].duration_seconds - elapsedInTrack;
        break;
      }
      accumulated += tracks[i].duration_seconds;
    }

    // Subtract remaining seconds from playlist_started_at to skip forward
    const newStartedAt = new Date(playlistStarted - remainingSeconds * 1000).toISOString();

    await supabase
      .from("station_config")
      .update({ playlist_started_at: newStartedAt, updated_at: new Date().toISOString() })
      .eq("id", config.id);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
