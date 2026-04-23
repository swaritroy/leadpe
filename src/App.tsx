import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import StudioGuard from "@/components/StudioGuard";
import ClientGuard from "@/components/ClientGuard";
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
import About from "./pages/About";
import Services from "./pages/Services";
import Privacy from "./pages/Privacy";
import Refund from "./pages/Refund";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Referral from "./pages/Referral";

// Protected pages (lazy loaded)
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const ClientSettings = lazy(() => import("./pages/ClientSettings"));
const Payment = lazy(() => import("./pages/Payment"));
const DevDashboard = lazy(() => import("./pages/DevDashboard"));
const DevOnboarding = lazy(() => import("./pages/DevOnboarding"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminMessages = lazy(() => import("./pages/AdminMessages"));
const AdminAuthLogs = lazy(() => import("./pages/AdminAuthLogs"));
const CheckoutReturn = lazy(() => import("./pages/CheckoutReturn"));
const DeployStatus = lazy(() => import("./pages/DeployStatus"));

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
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/studio/auth/callback" element={<AuthCallback />} />
            <Route path="/checkout/return" element={<CheckoutReturn />} />
            <Route path="/ref/:code" element={<Referral />} />

            {/* Onboarding — protected, business only */}
            <Route path="/onboarding" element={
              <ClientGuard>
                <Onboarding />
              </ClientGuard>
            } />

            {/* Get website — business only */}
            <Route path="/get-website" element={
              <ClientGuard>
                <GetWebsite />
              </ClientGuard>
            } />
            <Route path="/demo/:orderId" element={<DemoPreview />} />

            {/* Protected — business (ClientGuard forces coders/admin away) */}
            <Route path="/client/dashboard" element={
              <ClientGuard>
                <ClientDashboard />
              </ClientGuard>
            } />
            <Route path="/client/settings" element={
              <ClientGuard>
                <ClientSettings />
              </ClientGuard>
            } />
            <Route path="/payment" element={
              <ClientGuard>
                <Payment />
              </ClientGuard>
            } />

            {/* Protected — vibe coder (StudioGuard forces clients to /client/dashboard) */}
            <Route path="/dev/dashboard" element={
              <StudioGuard>
                <DevDashboard />
              </StudioGuard>
            } />
            <Route path="/dev/onboarding" element={
              <StudioGuard>
                <DevOnboarding />
              </StudioGuard>
            } />
            <Route path="/dev/deploy/:id" element={
              <StudioGuard>
                <DeployStatus />
              </StudioGuard>
            } />

            {/* Protected — admin */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/admin/messages" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminMessages />
              </ProtectedRoute>
            } />
            <Route path="/admin/auth-logs" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAuthLogs />
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
