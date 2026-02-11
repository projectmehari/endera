import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="meter-panel w-full max-w-sm">
        <div className="border-b border-foreground px-4 py-2">
          <span className="meter-label">INSTALL ENDERA.FM</span>
        </div>
        <div className="p-6 space-y-4 text-center">
          {installed ? (
            <>
              <p className="font-mono text-sm text-foreground">APP INSTALLED ✓</p>
              <p className="font-mono text-xs text-muted-foreground">
                endera.fm is now available on your home screen with offline listening.
              </p>
              <a
                href="/"
                className="inline-block meter-panel px-6 py-2 meter-value text-xs hover:bg-foreground hover:text-background transition-colors"
              >
                OPEN APP
              </a>
            </>
          ) : deferredPrompt ? (
            <>
              <p className="font-mono text-sm text-foreground">
                INSTALL FOR OFFLINE LISTENING
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                Add endera.fm to your home screen to listen to mixes without an internet connection.
              </p>
              <button
                onClick={handleInstall}
                className="meter-panel px-6 py-2 meter-value text-xs hover:bg-foreground hover:text-background transition-colors"
              >
                INSTALL APP
              </button>
            </>
          ) : (
            <>
              <p className="font-mono text-sm text-foreground">
                OFFLINE LISTENING
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                To install endera.fm on your device:
              </p>
              <div className="text-left font-mono text-xs text-muted-foreground space-y-2 mt-2">
                <p>• <strong>iPhone:</strong> Tap Share → "Add to Home Screen"</p>
                <p>• <strong>Android:</strong> Tap the browser menu → "Install app" or "Add to Home Screen"</p>
                <p>• <strong>Desktop:</strong> Click the install icon in the address bar</p>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground/60 mt-4">
                Once installed, previously played mixes will be available offline.
              </p>
              <a
                href="/"
                className="inline-block mt-2 meter-panel px-6 py-2 meter-value text-xs hover:bg-foreground hover:text-background transition-colors"
              >
                BACK TO RADIO
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
