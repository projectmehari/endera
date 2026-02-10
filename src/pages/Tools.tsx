import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function Tools() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="meter-panel p-8 text-center max-w-sm">
          <div className="meter-label mb-3">— TOOLS —</div>
          <p className="meter-value text-lg">COMING SOON</p>
          <p className="meter-label mt-3">
            THIS SECTION IS UNDER DEVELOPMENT
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
