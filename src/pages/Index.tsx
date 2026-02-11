import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LiveBar from "@/components/LiveBar";
import AboutSection from "@/components/AboutSection";
import MixFeed from "@/components/MixFeed";
import { Link } from "react-router-dom";

const Index = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <div className="sticky top-0 z-50 bg-background">
      <SiteHeader />
      <LiveBar />
    </div>
    <main className="flex-1 px-4 py-8 md:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <AboutSection />
        <div className="border-t border-foreground pt-4">
          <span className="meter-label">— LATEST TRACKS —</span>
        </div>
        <MixFeed />
        <section className="meter-panel p-6 text-center">
          <div className="meter-label mb-2">— TOOLS —</div>
          <Link to="/tools" className="meter-value text-sm hover:underline">
            EXPLORE TOOLS →
          </Link>
        </section>
      </div>
    </main>
    <SiteFooter />
  </div>
);

export default Index;
