import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { lazy, Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import Index from "./pages/Index";

const Admin = lazy(() => import("./pages/Admin"));
const Tools = lazy(() => import("./pages/Tools"));
const Explore = lazy(() => import("./pages/Explore"));
const Install = lazy(() => import("./pages/Install"));
const MixDetail = lazy(() => import("./pages/MixDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LiveChat = lazy(() => import("./components/LiveChat"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AudioPlayerProvider>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/mix/:artist/:title" element={<MixDetail />} />
              <Route path="/install" element={<Install />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <LiveChat />
          </Suspense>
        </AudioPlayerProvider>
      </BrowserRouter>
      <Analytics />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
