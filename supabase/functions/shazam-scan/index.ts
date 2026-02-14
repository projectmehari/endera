import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return false;
    const data = `${header}.${body}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = Uint8Array.from(
      atob(sig.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(data));
    if (!valid) return false;
    const payload = JSON.parse(atob(body));
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

async function detectTrack(audioBase64: string, apiKey: string): Promise<{ artist: string; title: string } | null> {
  try {
    const response = await fetch("https://shazam.p.rapidapi.com/songs/v2/detect", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "shazam.p.rapidapi.com",
      },
      body: audioBase64,
    });

    if (!response.ok) {
      console.error("Shazam API error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    if (data.matches && data.matches.length > 0 && data.track) {
      return {
        artist: data.track.subtitle || "Unknown",
        title: data.track.title || "Unknown",
      };
    }
    return null;
  } catch (err) {
    console.error("Shazam detect error:", err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (d: unknown, s = 200) =>
    new Response(JSON.stringify(d), {
      status: s,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { token, mix_id } = await req.json();

    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!token || !(await verifyToken(token, secret))) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const shazamKey = Deno.env.get("SHAZAM_API_KEY");
    if (!shazamKey) {
      return json({ success: false, error: "SHAZAM_API_KEY not configured" }, 500);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the track/mix info
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .select("*")
      .eq("id", mix_id)
      .single();

    if (trackError || !track) {
      return json({ success: false, error: "Mix not found" }, 404);
    }

    const fileUrl = track.file_url;
    const durationSeconds = track.duration_seconds;

    // Sample at intervals: every 3 minutes, 5 seconds each
    const SAMPLE_DURATION = 5; // seconds
    const SAMPLE_INTERVAL = 180; // every 3 minutes
    const BITRATE_BYTES_PER_SEC = 40000; // ~320kbps

    const offsets: number[] = [];
    for (let t = 30; t < durationSeconds - 10; t += SAMPLE_INTERVAL) {
      offsets.push(t);
    }

    console.log(`Scanning mix "${track.title}" with ${offsets.length} samples`);

    const detectedTracks: { position: number; artist: string; title: string; timestamp_label: string }[] = [];

    for (let i = 0; i < offsets.length; i++) {
      const offsetSec = offsets[i];
      const startByte = Math.floor(offsetSec * BITRATE_BYTES_PER_SEC);
      const endByte = startByte + Math.floor(SAMPLE_DURATION * BITRATE_BYTES_PER_SEC);

      try {
        // Fetch audio chunk using range request
        const audioRes = await fetch(fileUrl, {
          headers: { Range: `bytes=${startByte}-${endByte}` },
        });

        if (!audioRes.ok && audioRes.status !== 206) {
          console.error(`Failed to fetch chunk at offset ${offsetSec}s: ${audioRes.status}`);
          continue;
        }

        const audioBuffer = await audioRes.arrayBuffer();
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(audioBuffer))
        );

        const result = await detectTrack(base64, shazamKey);
        if (result) {
          // Check for duplicates
          const isDuplicate = detectedTracks.some(
            (t) => t.title.toLowerCase() === result.title.toLowerCase() && t.artist.toLowerCase() === result.artist.toLowerCase()
          );
          if (!isDuplicate) {
            const mins = Math.floor(offsetSec / 60);
            const secs = Math.floor(offsetSec % 60);
            detectedTracks.push({
              position: detectedTracks.length + 1,
              artist: result.artist,
              title: result.title,
              timestamp_label: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
            });
            console.log(`  [${detectedTracks.length}] ${result.artist} — ${result.title} @ ${mins}:${secs}`);
          }
        }

        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(`Error at offset ${offsetSec}:`, err);
      }
    }

    // Insert detected tracks into mix_tracklists
    if (detectedTracks.length > 0) {
      // First clear existing entries
      await supabase.from("mix_tracklists").delete().eq("mix_id", mix_id);

      const entries = detectedTracks.map((t) => ({
        mix_id,
        position: t.position,
        track_artist: t.artist,
        track_title: t.title,
        timestamp_label: t.timestamp_label,
      }));

      const { error: insertError } = await supabase.from("mix_tracklists").insert(entries);
      if (insertError) {
        console.error("Insert error:", insertError);
        return json({ success: false, error: "Failed to save tracklist", detected: detectedTracks });
      }
    }

    return json({
      success: true,
      detected_count: detectedTracks.length,
      tracks: detectedTracks,
    });
  } catch (err) {
    console.error("Server error:", err);
    return json({ success: false, error: "Server error" }, 500);
  }
});
