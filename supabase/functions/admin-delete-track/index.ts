import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function verifyToken(token: string): boolean {
  try {
    const decoded = atob(token);
    const parts = decoded.split(":");
    if (parts[0] !== "admin") return false;
    return parts[2] === Deno.env.get("ADMIN_PASSWORD");
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, trackId } = await req.json();
    if (!verifyToken(token)) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get track to find file URL
    const { data: track } = await supabase
      .from("tracks")
      .select("*")
      .eq("id", trackId)
      .maybeSingle();

    if (track) {
      // Extract file path from URL
      const url = new URL(track.file_url);
      const pathParts = url.pathname.split("/storage/v1/object/public/tracks/");
      if (pathParts[1]) {
        await supabase.storage.from("tracks").remove([decodeURIComponent(pathParts[1])]);
      }

      await supabase.from("tracks").delete().eq("id", trackId);
    }

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
