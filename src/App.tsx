import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Itinerary from "./pages/Itinerary";
import MapPage from "./pages/Map";
import Trips from "./pages/Trips";
import Pricing from "./pages/Pricing";
import Print from "./pages/Print";
import NotFound from "./pages/NotFound";
import { isFirstVisit, markFirstVisitComplete } from "@/lib/storage";

const queryClient = new QueryClient();

function AppWrapper() {
  const [shouldRedirectToOnboarding, setShouldRedirectToOnboarding] = useState(false);

  useEffect(() => {
    if (isFirstVisit()) {
      setShouldRedirectToOnboarding(true);
      markFirstVisitComplete();
    }
  }, []);

  return (
    <Layout>
      <PageTransition>
        <Routes>
          <Route path="/" element={shouldRedirectToOnboarding ? <Navigate to="/onboarding" replace /> : <Index />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/itinerary" element={<Itinerary />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/print" element={<Print />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppWrapper />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
