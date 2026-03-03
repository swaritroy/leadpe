import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Index from "./pages/Index";
import Developer from "./pages/Developer";
import Business from "./pages/Business";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import SelectRole from "./pages/SelectRole";
import ClientDashboard from "./pages/ClientDashboard";
import ClientSettings from "./pages/ClientSettings";
import DevDashboard from "./pages/DevDashboard";
import ViewSite from "./pages/ViewSite";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/select-role" element={<SelectRole />} />

            {/* Dynamic site rendering */}
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
              <ProtectedRoute allowedRoles={["developer"]}>
                <DevDashboard />
              </ProtectedRoute>
            } />

            {/* Public routes with shared Navbar */}
            <Route path="*" element={
              <>
                <Navbar />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/developer" element={<Developer />} />
                  <Route path="/business" element={<Business />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
