import { useMixes } from "@/hooks/useMixes";
import MixRow from "./MixCard";

export default function MixFeed() {
  const { mixes, loading } = useMixes();

  return (
    <section>
      <div className="meter-label mb-4">— ARCHIVE —</div>
      {loading ? (
        <div className="meter-value text-sm text-muted-foreground">
          LOADING<span className="animate-blink">_</span>
        </div>
      ) : mixes.length === 0 ? (
        <div className="meter-panel p-6 text-center">
          <span className="meter-label">NO MIXES AVAILABLE YET</span>
        </div>
      ) : (
        <div className="meter-panel border-t-0">
          {mixes.map((mix, i) => (
            <MixRow key={mix.id} mix={mix} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
