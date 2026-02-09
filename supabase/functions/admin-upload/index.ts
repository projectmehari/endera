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
    const { token, title, artist, fileName, fileBase64, contentType } = await req.json();

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

    // Decode base64 to Uint8Array
    const binaryStr = atob(fileBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Upload to storage
    const filePath = `${crypto.randomUUID()}-${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("tracks")
      .upload(filePath, bytes, { contentType: contentType || "audio/mpeg" });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage.from("tracks").getPublicUrl(filePath);
    const fileUrl = urlData.publicUrl;

    // Get duration estimate (we'll default to 0, user can update)
    // Try to parse duration from the audio data
    let durationSeconds = 0;
    // Rough MP3 duration estimate: file size / bitrate
    // Assuming ~192kbps = 24000 bytes/sec
    durationSeconds = Math.round(bytes.length / 24000);

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
      duration_seconds: durationSeconds,
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
