import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "./integrations/supabase/client";

async function initPwa() {
  try {
    const { data } = await supabase
      .from("station_config")
      .select("pwa_enabled")
      .limit(1)
      .single();

    const pwaEnabled = data?.pwa_enabled ?? false;

    if (pwaEnabled) {
      const { registerSW } = await import("virtual:pwa-register");
      registerSW({ immediate: true });
    } else {
      // Unregister any existing service workers and clear caches
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }
    }
  } catch (e) {
    console.warn("PWA init check failed:", e);
  }
}

initPwa();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
