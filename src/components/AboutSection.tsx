import { Instagram } from "lucide-react";

function ArenaIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="0" />
      <circle cx="12" cy="12" r="4" />
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
