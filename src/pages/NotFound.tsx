import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import LeadPeLogo from "@/components/LeadPeLogo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5FFF7" }}>
      <div className="text-center px-4">
        <div className="mb-6"><LeadPeLogo theme="light" size="lg" /></div>
        <h1 className="text-7xl font-extrabold text-[#1A1A1A] mb-2" style={{ fontFamily: "Syne, sans-serif" }}>404</h1>
        <p className="text-lg text-[#666] mb-8">Page not found</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="h-12 px-8 rounded-xl bg-[#00C853] hover:bg-[#00A843] text-white font-semibold">
            <Link to="/">Go Home →</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 px-8 rounded-xl border-[#00C853] text-[#00C853] hover:bg-[#F0FFF4]">
            <Link to="/client/dashboard">Go to Dashboard →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
