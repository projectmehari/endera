import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyToken(token: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.sub !== "admin") return false;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false;

    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const data = `${parts[0]}.${parts[1]}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = Uint8Array.from(atob(parts[2].replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
    return await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(data));
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!(await verifyToken(token))) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    const playlistStarted = new Date(config.playlist_started_at).getTime();
    const now = Date.now();
    const elapsedTotal = Math.floor((now - playlistStarted) / 1000);
    const totalDuration = tracks.reduce((sum: number, t: any) => sum + t.duration_seconds, 0);
    const positionInPlaylist = ((elapsedTotal % totalDuration) + totalDuration) % totalDuration;

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

    const newStartedAt = new Date(playlistStarted - remainingSeconds * 1000).toISOString();

    await supabase
      .from("station_config")
      .update({ playlist_started_at: newStartedAt, updated_at: new Date().toISOString() })
      .eq("id", config.id);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
