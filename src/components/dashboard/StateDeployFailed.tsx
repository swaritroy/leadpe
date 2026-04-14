import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const font = { heading: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

interface Props {
  buildRequest: Record<string, unknown>;
  businessName: string;
  userId: string;
}

export default function StateDeployFailed({ buildRequest, businessName, userId }: Props) {
  const { toast } = useToast();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      // Reset status back to "review" so the coder can resubmit
      await (supabase as any).from("build_requests").update({
        status: "building",
        deploy_url: null,
        deployed_at: null,
      }).eq("id", buildRequest.id);

      // Notify admin
      await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: "919973383902",
          message: `🔄 RETRY REQUESTED\nBusiness: ${businessName}\nBuilder needs to resubmit.\nLeadPe ⚡`,
        },
      });

      toast({ title: "Retry requested ✅", description: "Your builder has been notified to fix and resubmit." });
    } catch {
      toast({ title: "Error", description: "Could not retry. Please contact support.", variant: "destructive" });
    }
    setRetrying(false);
  };

  const handleContactSupport = () => {
    window.open(
      `https://wa.me/919973383902?text=${encodeURIComponent(`Help needed: Deployment failed for ${businessName}`)}`,
      "_blank"
    );
  };

  return (
    <div style={{ backgroundColor: "#FFFFFF", minHeight: "calc(100vh - 56px)", paddingBottom: 80 }}>
      {/* Status bar */}
      <div style={{ backgroundColor: "#FFF3E0", padding: "14px 20px", textAlign: "center" }}>
        <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 600, color: "#E65100" }}>
          ⚠️ Deployment issue — your builder is working on it
        </span>
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{
          margin: 16, backgroundColor: "#fff", borderRadius: 20, padding: 24,
          border: "2px solid #FF9800", boxShadow: "0 4px 24px rgba(255,152,0,0.12)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔧</div>
          <p style={{ fontFamily: font.heading, fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
            {businessName}
          </p>
          <p style={{ fontFamily: font.body, fontSize: 14, color: "#E65100", fontWeight: 600, marginBottom: 8 }}>
            Deployment Failed
          </p>
          <p style={{ fontFamily: font.body, fontSize: 13, color: "#666", marginBottom: 24, lineHeight: 1.6 }}>
            There was a technical issue deploying your website.
            Your builder has been notified and is working on fixing it.
            Your project is safe — no data has been lost.
          </p>

          {/* Retry button */}
          <button
            onClick={handleRetry}
            disabled={retrying}
            style={{
              width: "100%", height: 52, borderRadius: 14,
              backgroundColor: "#FF9800", color: "#fff", border: "none",
              fontFamily: font.heading, fontSize: 16, fontWeight: 700,
              cursor: retrying ? "not-allowed" : "pointer", marginBottom: 12,
              opacity: retrying ? 0.6 : 1,
            }}
          >
            {retrying ? "Requesting..." : "Request Rebuild 🔄"}
          </button>

          {/* Contact support */}
          <button
            onClick={handleContactSupport}
            style={{
              width: "100%", height: 48, borderRadius: 14,
              backgroundColor: "#fff", color: "#666", border: "1px solid #E0E0E0",
              fontFamily: font.body, fontSize: 14, fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Contact Support 💬
          </button>
        </div>
      </motion.div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{
          margin: "0 16px 16px", backgroundColor: "#F5F5F5", borderRadius: 16, padding: 20,
        }}
      >
        <p style={{ fontFamily: font.heading, fontSize: 14, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
          What happens next?
        </p>
        <div style={{ fontFamily: font.body, fontSize: 13, color: "#666", lineHeight: 1.8 }}>
          <p>1. Your builder fixes the code issue</p>
          <p>2. Website is rebuilt and deployed</p>
          <p>3. You get a notification when preview is ready</p>
          <p>4. Usually fixed within 2-4 hours</p>
        </div>
      </motion.div>
    </div>
  );
}
