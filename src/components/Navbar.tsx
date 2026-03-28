import { Link, useLocation } from "react-router-dom";
import LeadPeLogo from "./LeadPeLogo";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role, profile } = useAuth();

  const dashboardLink = role === "developer" || role === "vibe_coder" ? "/dev/dashboard" : role === "business" ? "/client/dashboard" : role === "admin" ? "/admin" : "/auth";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 backdrop-blur-xl bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/">
          <LeadPeLogo theme="light" size="sm" />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          <a href="/#how-it-works" className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            How it Works
          </a>
          <a href="/#pricing" className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {profile?.plan_type === "free" && (
                <Button size="sm" variant="outline" className="rounded-xl border-[#00C853] text-[#00C853] hover:bg-[#F0FFF4]" asChild>
                  <Link to="/payment?plan=growth&amount=299" onClick={() => sessionStorage.setItem("upgrade_intent", "true")}>Upgrade →</Link>
                </Button>
              )}
              <Link to={dashboardLink} className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "#00E676", color: "#000" }}>
                  {user.email?.[0].toUpperCase() || "U"}
                </div>
              </Link>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl" asChild>
                <Link to={dashboardLink}>Dashboard</Link>
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button size="sm" className="text-black font-semibold hover:opacity-90 rounded-xl" style={{ backgroundColor: "#00E676" }} asChild>
                <a href="/#business-signup">Get Started Free</a>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/30 p-4 space-y-2 bg-background">
          <a href="/#how-it-works" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">
            How it Works
          </a>
          <a href="/#pricing" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">
            Pricing
          </a>
          {user ? (
            <Link to={dashboardLink} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "#00E676", color: "#000" }}>
                {user.email?.[0].toUpperCase() || "U"}
              </div>
              Dashboard
            </Link>
          ) : (
            <a href="/#business-signup" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-sm font-medium text-primary">
              Get Started Free
            </a>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
