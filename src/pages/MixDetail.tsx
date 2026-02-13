import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import MixDetailContent from "@/components/MixDetailContent";
import type { Track } from "@/lib/radio-types";
import { slugify } from "@/lib/utils";

export default function MixDetail() {
  const { artist, title } = useParams<{ artist: string; title: string }>();
  const [mix, setMix] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artist || !title) return;
    supabase
      .from("tracks")
      .select("*")
      .then(({ data }) => {
        const match = (data as Track[] | null)?.find(
          (t) => slugify(t.artist) === artist && slugify(t.title) === title
        );
        setMix(match ?? null);
        setLoading(false);
      });
  }, [artist, title]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="font-mono text-sm text-muted-foreground">
          loading<span className="animate-blink">_</span>
        </span>
      </div>
    );
  }

  if (!mix) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <span className="font-mono text-sm text-muted-foreground">mix not found</span>
        <Link to="/" className="font-mono text-xs text-muted-foreground hover:text-foreground underline">
          ← back
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col items-center px-4 py-8 md:py-16">
        <div className="w-full max-w-lg mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={12} />
            back
          </Link>
        </div>
        <MixDetailContent mix={mix} />
      </main>
    </div>
  );
}
