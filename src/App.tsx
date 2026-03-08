import { useState, useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import SplashScreen from "@/components/SplashScreen";
import WhatsAppButton from "./components/WhatsAppButton";

// Public pages
import Index from "./pages/Index";
import Business from "./pages/Business";
import Auth from "./pages/Auth";
import Studio from "./pages/Studio";
import StudioAuth from "./pages/StudioAuth";
import GetWebsite from "./pages/GetWebsite";
import DemoPreview from "./pages/DemoPreview";
import NotFound from "./pages/NotFound";

// Protected pages (lazy loaded)
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const ClientSettings = lazy(() => import("./pages/ClientSettings"));
const Payment = lazy(() => import("./pages/Payment"));
const DevDashboard = lazy(() => import("./pages/DevDashboard"));
const DevOnboarding = lazy(() => import("./pages/DevOnboarding"));
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5FFF7" }}>
    <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: "#E0E0E0", borderTopColor: "#00C853" }} />
  </div>
);

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <SplashScreen show={showSplash} />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Fully public */}
            <Route path="/" element={<Index />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/get-website" element={<GetWebsite />} />
            <Route path="/demo/:orderId" element={<DemoPreview />} />

            {/* Public — redirect if already logged in */}
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/business" element={<PublicRoute><Business /></PublicRoute>} />
            <Route path="/studio/auth" element={<PublicRoute><StudioAuth /></PublicRoute>} />

            {/* Protected — business */}
            <Route path="/client/dashboard" element={
              <ProtectedRoute allowedRoles={["business"]}>
                <ClientDashboard />
              </ProtectedRoute>
            } />
            <Route path="/client/settings" element={
              <ProtectedRoute allowedRoles={["business"]}>
                <ClientSettings />
              </ProtectedRoute>
            } />
            <Route path="/payment" element={
              <ProtectedRoute allowedRoles={["business"]}>
                <Payment />
              </ProtectedRoute>
            } />

            {/* Protected — vibe coder */}
            <Route path="/dev/dashboard" element={
              <ProtectedRoute allowedRoles={["developer", "vibe_coder"]}>
                <DevDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dev/onboarding" element={
              <ProtectedRoute allowedRoles={["developer", "vibe_coder"]}>
                <DevOnboarding />
              </ProtectedRoute>
            } />

            {/* Protected — admin */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Admin />
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <WhatsAppButton />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
