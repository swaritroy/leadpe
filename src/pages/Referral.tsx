import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { saveReferralCode } from "@/lib/referral";
import Auth from "./Auth";

export default function Referral() {
  const { code } = useParams<{ code: string }>();
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!code) {
      setValid(false);
      return;
    }
    const cleaned = code.trim().toUpperCase();
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("referral_code", cleaned)
        .maybeSingle();
      if (data) {
        saveReferralCode(cleaned);
        setValid(true);
      } else {
        setValid(false);
      }
    })();
  }, [code]);

  if (valid === false) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5FFF7" }}>
      {/* Top banner */}
      <div
        style={{
          backgroundColor: "#00C853",
          color: "#fff",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        <Gift size={18} />
        <span>Your friend invited you! Sign up and get ₹100 off your first website.</span>
      </div>
      <Auth />
    </div>
  );
}
