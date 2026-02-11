import { Instagram } from "lucide-react";

function ArenaIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
    >
      {/* Two overlapping 6-pointed stars with diamond negative space */}
      <path d="M35 50 L20 35 L35 5 L50 35 L65 5 L80 35 L65 50 L80 65 L65 95 L50 65 L35 95 L20 65 Z" fillRule="evenodd" />
      <path d="M42 50 L50 42 L58 50 L50 58 Z" fill="var(--arena-bg, hsl(60 10% 95%))" />
    </svg>
  );
}

export default function AboutSection() {
  return (
    <section className="meter-panel p-6">
      <div className="meter-label mb-3">— ABOUT —</div>
      <p className="text-xs font-mono leading-relaxed text-muted-foreground">
        ENDERA.FM is an experimental audio transmission platform delivering continuous, 
        curated sound experiences. Built around the philosophy of passive listening, 
        the station broadcasts a rotating selection of ambient, electronic, and 
        experimental compositions — always on, always evolving. Tune in, let the 
        signal carry you.
      </p>
      <div className="flex items-center gap-4 mt-4">
        <a
          href="https://www.instagram.com/endera.fm/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Instagram"
        >
          <Instagram size={16} />
        </a>
        <a
          href="https://www.are.na/vestiges/endera-fm"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Are.na"
        >
          <ArenaIcon size={16} />
        </a>
      </div>
    </section>
  );
}
