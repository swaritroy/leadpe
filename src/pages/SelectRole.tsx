import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Code2, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import LeadPeLogo from "@/components/LeadPeLogo";

const SelectRole = () => {
  const { user, refreshRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const selectRole = async (role: "developer" | "business") => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("user_roles").insert({
      user_id: user.id,
      role,
    });
    if (!error) {
      await refreshRole();
      navigate(role === "developer" ? "/dev/dashboard" : "/client/dashboard", { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background noise-overlay">
      <div className="mesh-bg" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg p-8 text-center relative z-10"
      >
        <div className="mb-6">
          <LeadPeLogo size="lg" />
        </div>
        <h1 className="text-2xl font-extrabold mb-2 font-display">Choose Your Role</h1>
        <p className="text-sm text-muted-foreground mb-8">This determines your dashboard experience</p>

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => selectRole("developer")}
            disabled={loading}
            variant="outline"
            className="h-auto p-6 flex flex-col items-center gap-3 rounded-2xl border-border hover:border-primary/50 hover:bg-primary/5"
          >
            <Code2 size={32} className="text-primary" />
            <span className="font-bold text-lg">Developer</span>
            <span className="text-xs text-muted-foreground">Build & earn monthly</span>
          </Button>
          <Button
            onClick={() => selectRole("business")}
            disabled={loading}
            variant="outline"
            className="h-auto p-6 flex flex-col items-center gap-3 rounded-2xl border-border hover:border-primary/50 hover:bg-primary/5"
          >
            <Building2 size={32} className="text-primary" />
            <span className="font-bold text-lg">Business</span>
            <span className="text-xs text-muted-foreground">Get more customers</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SelectRole;
