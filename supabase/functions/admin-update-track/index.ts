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
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const sigBytes = Uint8Array.from(atob(parts[2].replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
    return await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(data));
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, trackId, publishedDate, title, artist, artworkUrl, genres, aboutText } = await req.json();

    if (!(await verifyToken(token))) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!trackId || typeof trackId !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "trackId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const updates: Record<string, unknown> = {};
    if (publishedDate !== undefined) {
      updates.published_date = publishedDate;
    }
    if (title !== undefined && typeof title === "string" && title.trim().length > 0) {
      updates.title = title.trim();
    }
    if (artist !== undefined && typeof artist === "string" && artist.trim().length > 0) {
      updates.artist = artist.trim();
    }
    if (artworkUrl !== undefined) {
      updates.artwork_url = artworkUrl || null;
    }
    if (aboutText !== undefined) {
      updates.about_text = aboutText || null;
    }

    if (Object.keys(updates).length === 0 && !Array.isArray(genres)) {
      return new Response(
        JSON.stringify({ success: false, error: "No fields to update" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from("tracks").update(updates).eq("id", trackId);
      if (error) throw error;
    }

    // Handle genres update
    if (Array.isArray(genres)) {
      // Delete existing genres
      await supabase.from("track_genres").delete().eq("track_id", trackId);
      // Insert new genres
      const genreRows = genres
        .map((g: string) => (typeof g === "string" ? g.trim().toLowerCase() : ""))
        .filter((g: string) => g.length > 0)
        .map((genre: string) => ({ track_id: trackId, genre }));
      if (genreRows.length > 0) {
        const { error: genreError } = await supabase.from("track_genres").insert(genreRows);
        if (genreError) console.error("Genre update error:", genreError);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("admin-update-track error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
