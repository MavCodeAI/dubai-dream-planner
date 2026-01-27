import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import ErrorBoundary from "@/components/ErrorBoundary";
import AgenticChat from "@/components/AgenticChat";
import AIFloatingButton from "@/components/AIFloatingButton";
import { isFirstVisit, markFirstVisitComplete } from "@/lib/storage";

// Lazy load all page components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Itinerary = lazy(() => import("./pages/Itinerary"));
const MapPage = lazy(() => import("./pages/Map"));
const Trips = lazy(() => import("./pages/Trips"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Print = lazy(() => import("./pages/Print"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Create QueryClient outside component to prevent re-creation on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function AppWrapper() {
  const [shouldRedirectToOnboarding, setShouldRedirectToOnboarding] = useState(false);

  useEffect(() => {
    if (isFirstVisit()) {
      // Check if user explicitly wants to see landing page
      const showLanding = new URLSearchParams(window.location.search).get('show_landing');
      if (showLanding !== 'true') {
        setShouldRedirectToOnboarding(true);
        markFirstVisitComplete();
      }
    }
  }, []);

  return (
    <Layout>
      <PageTransition>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route 
              path="/" 
              element={shouldRedirectToOnboarding ? <Navigate to="/onboarding" replace /> : <Index />} 
            />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/ai-chat" element={<AgenticChat />} />
            <Route path="/itinerary" element={<Itinerary />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/print" element={<Print />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </PageTransition>
    </Layout>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppWrapper />
          <AIFloatingButton />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
