import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Code2, Building2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg p-8 text-center"
      >
        <div className="hexagon-clip bg-gradient-hero w-12 h-12 flex items-center justify-center mx-auto mb-4">
          <Zap size={20} className="text-white" />
        </div>
        <h1 className="text-2xl font-black mb-2">Choose Your Role</h1>
        <p className="text-sm text-muted-foreground mb-8">This determines your dashboard experience</p>

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => selectRole("developer")}
            disabled={loading}
            variant="outline"
            className="h-auto p-6 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary/5"
          >
            <Code2 size={32} className="text-primary" />
            <span className="font-bold text-lg">Developer</span>
            <span className="text-xs text-muted-foreground">Build & deploy AI sites</span>
          </Button>
          <Button
            onClick={() => selectRole("business")}
            disabled={loading}
            variant="outline"
            className="h-auto p-6 flex flex-col items-center gap-3 hover:border-accent/50 hover:bg-accent/5"
          >
            <Building2 size={32} className="text-accent" />
            <span className="font-bold text-lg">Business</span>
            <span className="text-xs text-muted-foreground">Manage leads & site</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SelectRole;
