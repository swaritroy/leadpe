import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import Business from "./pages/Business";
import Auth from "./pages/Auth";
import ClientDashboard from "./pages/ClientDashboard";
import ClientSettings from "./pages/ClientSettings";
import Payment from "./pages/Payment";
import Studio from "./pages/Studio";
import StudioAuth from "./pages/StudioAuth";
import GetWebsite from "./pages/GetWebsite";
import DemoPreview from "./pages/DemoPreview";
import DevDashboard from "./pages/DevDashboard";
import DevOnboarding from "./pages/DevOnboarding";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import WhatsAppButton from "./components/WhatsAppButton";

const queryClient = new QueryClient();

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
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/business" element={<Business />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/studio/auth" element={<StudioAuth />} />
          <Route path="/get-website" element={<GetWebsite />} />

          {/* Protected business routes */}
          <Route path="/client/dashboard" element={
            <ProtectedRoute allowedRoles={["business"]} redirectTo="/auth">
              <ClientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/client/settings" element={
            <ProtectedRoute allowedRoles={["business"]} redirectTo="/auth">
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

          {/* Protected admin route */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={["admin"]} redirectTo="/auth">
              <Admin />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
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
