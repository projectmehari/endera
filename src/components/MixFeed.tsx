import { useMixes } from "@/hooks/useMixes";
import MixRow from "./MixCard";

export default function MixFeed() {
  const { mixes, loading } = useMixes();

  return (
    <section>
      {loading ? (
        <div className="font-mono text-sm text-muted-foreground py-8 text-center">
          loading<span className="animate-blink">_</span>
        </div>
      ) : mixes.length === 0 ? (
        <div className="font-mono text-sm text-muted-foreground py-8 text-center">
          no mixes available yet
        </div>
      ) : (
        <div className="border-t border-muted-foreground/20">
          {mixes.map((mix, i) => (
            <MixRow key={mix.id} mix={mix} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
