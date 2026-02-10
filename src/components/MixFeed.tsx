import { useMixes } from "@/hooks/useMixes";
import MixCard from "./MixCard";

export default function MixFeed() {
  const { mixes, loading } = useMixes();

  return (
    <section>
      <div className="meter-label mb-4">— MIXES —</div>
      {loading ? (
        <div className="meter-value text-sm text-muted-foreground">
          LOADING<span className="animate-blink">_</span>
        </div>
      ) : mixes.length === 0 ? (
        <div className="meter-panel p-6 text-center">
          <span className="meter-label">NO MIXES AVAILABLE YET</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mixes.map((mix) => (
            <MixCard key={mix.id} mix={mix} />
          ))}
        </div>
      )}
    </section>
  );
}
