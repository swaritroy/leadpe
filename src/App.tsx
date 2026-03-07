import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import SplashScreen from "@/components/SplashScreen";
import Navbar from "./components/Navbar";
import WhatsAppButton from "./components/WhatsAppButton";
import Index from "./pages/Index";
import Developer from "./pages/Developer";
import Business from "./pages/Business";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import SelectRole from "./pages/SelectRole";
import ClientDashboard from "./pages/ClientDashboard";
import ClientSettings from "./pages/ClientSettings";
import DevDashboard from "./pages/DevDashboard";
import DevOnboarding from "./pages/DevOnboarding";
import ViewSite from "./pages/ViewSite";
import Studio from "./pages/Studio";
import StudioAuth from "./pages/StudioAuth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <SplashScreen show={showSplash} />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/select-role" element={<SelectRole />} />

          {/* Studio auth route */}
          <Route path="/studio/auth" element={<StudioAuth />} />
          <Route path="/view/:slug" element={<ViewSite />} />

          {/* Admin has its own nav */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Admin />
            </ProtectedRoute>
          } />

          {/* Protected business routes */}
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

          {/* Protected dev routes */}
          <Route path="/dev/dashboard" element={
            <ProtectedRoute allowedRoles={["developer", "vibe_coder"]} redirectTo="/studio/auth">
              <DevDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dev/onboarding" element={
            <ProtectedRoute allowedRoles={["developer", "vibe_coder"]} redirectTo="/studio/auth">
              <DevOnboarding />
            </ProtectedRoute>
          } />

          {/* Public routes with shared Navbar */}
          <Route path="*" element={
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/studio" element={<Studio />} />
                <Route path="/business" element={<Business />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </>
          } />
        </Routes>
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
