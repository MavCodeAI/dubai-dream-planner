import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Itinerary from "./pages/Itinerary";
import MapPage from "./pages/Map";
import Trips from "./pages/Trips";
import Pricing from "./pages/Pricing";
import Print from "./pages/Print";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/itinerary" element={<Itinerary />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/print" element={<Print />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
