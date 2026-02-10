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
    new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { token, action, mix_id, position, timestamp_label, track_artist, track_title, entry_id } = await req.json();

    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!token || !(await verifyToken(token, secret))) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "list") {
      const { data, error } = await supabase
        .from("mix_tracklists")
        .select("*")
        .eq("mix_id", mix_id)
        .order("position", { ascending: true });
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true, entries: data });
    }

    if (action === "add") {
      const { error } = await supabase.from("mix_tracklists").insert({
        mix_id,
        position,
        timestamp_label: timestamp_label || null,
        track_artist: track_artist || "Unknown",
        track_title,
      });
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true });
    }

    if (action === "delete") {
      const { error } = await supabase.from("mix_tracklists").delete().eq("id", entry_id);
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true });
    }

    return json({ success: false, error: "Unknown action" }, 400);
  } catch {
    return json({ success: false, error: "Server error" }, 500);
  }
});
