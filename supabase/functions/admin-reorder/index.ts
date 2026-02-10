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
    const { token, trackId1, order1, trackId2, order2 } = await req.json();
    if (!(await verifyToken(token))) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUIDs
    if (typeof trackId1 !== "string" || !UUID_RE.test(trackId1) ||
        typeof trackId2 !== "string" || !UUID_RE.test(trackId2)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid track ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // Validate order values
    if (typeof order1 !== "number" || typeof order2 !== "number" ||
        !Number.isInteger(order1) || !Number.isInteger(order2) ||
        order1 < 0 || order2 < 0 || order1 > 10000 || order2 > 10000) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid order values" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    await supabase.from("tracks").update({ play_order: order1 }).eq("id", trackId1);
    await supabase.from("tracks").update({ play_order: order2 }).eq("id", trackId2);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("admin-reorder error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
