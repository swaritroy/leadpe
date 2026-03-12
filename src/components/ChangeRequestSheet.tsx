import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_WHATSAPP } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

const font = { heaing: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

interface Props {
  open: boolean;
  onClose: () => void;
  buildRequest: any;
  businessName: string;
}

export default function ChangeRequestSheet({ open, onClose, buildRequest, businessName }: Props) {
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!feedback.trim() || !buildRequest) return;
    setSubmitting(true);
    const newCount = (buildRequest.revision_count || 0) + 1;
    await (supabase.from("build_requests") as any).update({
      status: "building",
      revision_feedback: feedback,
      revision_count: newCount,
    }).eq("id", buildRequest.id);

    const msg = `🔄 Change request from ${businessName}:\n${feedback}`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");

    toast({ title: "✅ Change request sent!", description: "Usually fixed in 24 hours." });
    setFeedback("");
    setSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-full rounded-t-[20px]"
            style={{ maxHeight: "50vh", padding: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div style={{ width: 32, height: 4, backgroundColor: "#E0E0E0", borderRadius: 2, margin: "0 auto 20px" }} />

            <h3 style={{ fontFamily: font.heaing, fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 16 }}>
              What would you like changed?
            </h3>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={"e.g. Please change\ncolor to blue, add my address,\nchange the font..."}
              rows={5}
              style={{
                width: "100%", border: "1px solid #E0E0E0", borderRadius: 12, padding: 14,
                fontFamily: font.body, fontSize: 14, color: "#1A1A1A", resize: "none",
                boxSizing: "border-box",
              }}
            />

            <button
              onClick={handleSubmit}
              disabled={!feedback.trim() || submitting}
              style={{
                width: "100%", backgroundColor: "#00C853", color: "#fff", border: "none",
                borderRadius: 12, height: 52, fontFamily: font.body, fontSize: 15, fontWeight: 600,
                cursor: feedback.trim() ? "pointer" : "not-allowed",
                marginTop: 16, opacity: !feedback.trim() ? 0.5 : 1,
              }}
            >
              {submitting ? "Sending..." : "Send Request →"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
