import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="border-t border-foreground px-4 py-4 md:px-8">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <span className="meter-label">
          © {new Date().getFullYear()} ENDERA.FM — CONTINUOUS AUDIO TRANSMISSION
        </span>
        <div className="flex items-center gap-4">
          <Link to="/install" className="meter-label hover:text-foreground transition-colors">
            [INSTALL]
          </Link>
          <Link to="/admin" className="meter-label hover:text-foreground transition-colors">
            [ADMIN]
          </Link>
        </div>
      </div>
    </footer>
  );
}
