import { Instagram } from "lucide-react";
import arenaIcon from "@/assets/arena-icon.png";

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
          <img src={arenaIcon} alt="Are.na" className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}
