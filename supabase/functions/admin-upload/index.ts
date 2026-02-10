import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const { token, title, artist, fileUrl, durationSeconds, artworkUrl, publishedDate } = await req.json();

    if (!(await verifyToken(token))) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input validation
    if (typeof title !== "string" || title.trim().length === 0 || title.length > 500) {
      return new Response(
        JSON.stringify({ success: false, error: "Title is required and must be under 500 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (artist !== undefined && (typeof artist !== "string" || artist.length > 500)) {
      return new Response(
        JSON.stringify({ success: false, error: "Artist must be under 500 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (typeof fileUrl !== "string" || !fileUrl.startsWith("https://")) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid file URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (durationSeconds !== undefined && (typeof durationSeconds !== "number" || durationSeconds < 0 || durationSeconds > 86400)) {
      return new Response(
        JSON.stringify({ success: false, error: "Duration must be between 0 and 86400 seconds" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: maxOrderData } = await supabase
      .from("tracks")
      .select("play_order")
      .order("play_order", { ascending: false })
      .limit(1);

    const nextOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].play_order + 1 : 0;

    const insertData: Record<string, unknown> = {
      title: title.trim(),
      artist: (artist || "Unknown").trim(),
      duration_seconds: durationSeconds || 0,
      file_url: fileUrl,
      play_order: nextOrder,
    };
    if (artworkUrl && typeof artworkUrl === "string" && artworkUrl.startsWith("https://")) {
      insertData.artwork_url = artworkUrl;
    }
    if (publishedDate && typeof publishedDate === "string") {
      insertData.published_date = publishedDate;
    }

    const { error: insertError } = await supabase.from("tracks").insert(insertData);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Insert failed");
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("admin-upload error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
