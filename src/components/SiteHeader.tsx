import { Link } from "react-router-dom";
import LiveClock from "./LiveClock";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-foreground px-4 py-3 md:px-8">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link to="/" className="meter-value text-base tracking-tight">
          ENDERA.FM
        </Link>
        <nav className="flex items-center gap-4 md:gap-6">
          <Link to="/" className="meter-label hover:text-foreground transition-colors">
            HOME
          </Link>
          <Link to="/explore" className="meter-label hover:text-foreground transition-colors">
            EXPLORE
          </Link>
          <Link to="/tools" className="meter-label hover:text-foreground transition-colors">
            TOOLS
          </Link>
          <LiveClock />
        </nav>
      </div>
    </header>
  );
}
