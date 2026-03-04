import { Link, useLocation } from "react-router-dom";
import LeadPeLogo from "./LeadPeLogo";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role } = useAuth();

  const dashboardLink = role === "developer" ? "/dev/dashboard" : role === "business" ? "/client/dashboard" : role === "admin" ? "/admin" : "/auth";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 backdrop-blur-xl bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/">
          <LeadPeLogo size="sm" />
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
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl" asChild>
              <Link to={dashboardLink}>Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl" asChild>
                <Link to="/auth">Get Started Free</Link>
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
            <Link to={dashboardLink} onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-sm font-medium text-primary">
              Dashboard
            </Link>
          ) : (
            <Link to="/auth" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-sm font-medium text-primary">
              Get Started Free
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
