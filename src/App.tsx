import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import ErrorBoundary from "@/components/ErrorBoundary";


// Public pages
import Index from "./pages/Index";
import Business from "./pages/Business";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Studio from "./pages/Studio";
import StudioAuth from "./pages/StudioAuth";
import GetWebsite from "./pages/GetWebsite";
import DemoPreview from "./pages/DemoPreview";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Terms from "./pages/Terms";

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
  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Public — redirect if already logged in */}
            <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
            <Route path="/studio" element={<PublicRoute><Studio /></PublicRoute>} />
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/business" element={<PublicRoute><Business /></PublicRoute>} />
            <Route path="/studio/auth" element={<PublicRoute><StudioAuth /></PublicRoute>} />

            {/* Public pages */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Onboarding — protected, business only */}
            <Route path="/onboarding" element={
              <ProtectedRoute allowedRoles={["business"]}>
                <Onboarding />
              </ProtectedRoute>
            } />

            {/* Get website — protected business */}
            <Route path="/get-website" element={
              <ProtectedRoute allowedRoles={["business"]}>
                <GetWebsite />
              </ProtectedRoute>
            } />
            <Route path="/demo/:orderId" element={<DemoPreview />} />

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
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
