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
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    return parts[2] === adminPassword;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, title, artist, fileUrl, durationSeconds } = await req.json();

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

    // Get max play_order
    const { data: maxOrderData } = await supabase
      .from("tracks")
      .select("play_order")
      .order("play_order", { ascending: false })
      .limit(1);

    const nextOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].play_order + 1 : 0;

    // Insert track record
    const { error: insertError } = await supabase.from("tracks").insert({
      title,
      artist: artist || "Unknown",
      duration_seconds: durationSeconds || 0,
      file_url: fileUrl,
      play_order: nextOrder,
    });

    if (insertError) throw insertError;

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
