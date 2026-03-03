import { Link, useLocation } from "react-router-dom";
import SynapseLogo from "./SynapseLogo";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "Marketplace", href: "/" },
  { label: "Developer", href: "/developer" },
  { label: "Business", href: "/business" },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDark = location.pathname === "/developer";
  const { user, role } = useAuth();

  const dashboardLink = role === "developer" ? "/dev/dashboard" : role === "business" ? "/client/dashboard" : role === "admin" ? "/admin" : "/auth";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl ${isDark ? "bg-synapse-dark/80 border-border/20" : "bg-background/80 border-border"}`}>
      <div className="container flex h-16 items-center justify-between">
        <Link to="/">
          <SynapseLogo size="sm" variant={isDark ? "dark" : "dark"} />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Button size="sm" className="bg-gradient-hero text-primary-foreground border-0 hover:opacity-90" asChild>
              <Link to={dashboardLink}>Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button size="sm" className="bg-gradient-hero text-primary-foreground border-0 hover:opacity-90" asChild>
                <Link to="/auth">Get Started</Link>
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
        <div className={`md:hidden border-t p-4 space-y-2 ${isDark ? "bg-synapse-dark border-border/20" : "bg-background border-border"}`}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
