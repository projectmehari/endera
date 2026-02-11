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
    const { token, trackId, audioUrl, trackTitle, trackArtist } = await req.json();

    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!token || !(await verifyToken(token, secret))) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return json({ success: false, error: "AI not configured" }, 500);
    }

    // Fetch audio file and convert to base64 (limit to ~15MB)
    const MAX_BYTES = 15 * 1024 * 1024;
    const audioResp = await fetch(audioUrl);
    if (!audioResp.ok) {
      return json({ success: false, error: "Failed to fetch audio file" }, 400);
    }

    const arrayBuffer = await audioResp.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const truncated = bytes.length > MAX_BYTES ? bytes.slice(0, MAX_BYTES) : bytes;

    // Convert to base64
    let base64 = "";
    const CHUNK = 32768;
    for (let i = 0; i < truncated.length; i += CHUNK) {
      base64 += String.fromCharCode(...truncated.slice(i, i + CHUNK));
    }
    base64 = btoa(base64);

    const systemPrompt = `You are a music expert analyzing a DJ mix or radio show audio. Your task is to identify individual tracks played in this mix and their approximate timestamps.

For each track you can identify, provide:
- The timestamp when it starts (format: HH:MM:SS or MM:SS)
- The artist name
- The track title

Be as accurate as possible. If you can't identify a specific track, describe it (e.g. "Unknown Artist - Untitled ambient track"). Focus on detecting transitions and identifying songs.

The mix is titled "${trackTitle || "Unknown"}" by ${trackArtist || "Unknown"}.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this audio and identify all the tracks with their timestamps. Return your analysis using the extract_tracklist function.",
              },
              {
                type: "input_audio",
                input_audio: {
                  data: base64,
                  format: "mp3",
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_tracklist",
              description: "Extract the identified tracklist from the audio analysis",
              parameters: {
                type: "object",
                properties: {
                  tracks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        timestamp: {
                          type: "string",
                          description: "Start time in HH:MM:SS or MM:SS format",
                        },
                        artist: {
                          type: "string",
                          description: "Artist name",
                        },
                        title: {
                          type: "string",
                          description: "Track title",
                        },
                      },
                      required: ["timestamp", "artist", "title"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["tracks"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_tracklist" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return json({ success: false, error: "Rate limit exceeded, please try again later" }, 429);
      }
      if (aiResponse.status === 402) {
        return json({ success: false, error: "AI credits exhausted" }, 402);
      }
      return json({ success: false, error: "AI analysis failed" }, 500);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      // Fallback: try to parse from content
      return json({ success: false, error: "AI could not identify tracks" }, 400);
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const tracks = parsed.tracks || [];

    return json({ success: true, tracks });
  } catch (e) {
    console.error("analyze-tracklist error:", e);
    return json({ success: false, error: e instanceof Error ? e.message : "Server error" }, 500);
  }
});
