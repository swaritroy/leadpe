import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_WHATSAPP } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

const font = { heading: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

const REVISION_OPTIONS = [
  { id: "colors", label: "Colors — don't match my brand" },
  { id: "logo", label: "Logo — not placed correctly" },
  { id: "text", label: "Text/content — needs editing" },
  { id: "photos", label: "Photos — wrong images used" },
  { id: "layout", label: "Layout — needs reordering" },
  { id: "whatsapp", label: "WhatsApp button — wrong number" },
  { id: "contact", label: "Contact form — not working" },
  { id: "missing", label: "Missing section" },
  { id: "other", label: "Something else" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  buildRequest: any;
  businessName: string;
  onSubmitted: () => void;
}

export default function RevisionRequestSheet({ open, onClose, buildRequest, businessName, onSubmitted }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const revisionCount = buildRequest?.revision_count || 0;
  const maxRevisions = buildRequest?.max_revisions || 2;

  const toggleOption = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (selected.length === 0 || !buildRequest) return;
    setSubmitting(true);

    const newCount = revisionCount + 1;
    const feedback = {
      selected: selected.map(id => REVISION_OPTIONS.find(o => o.id === id)?.label || id),
      description: description.trim(),
      requested_at: new Date().toISOString(),
    };

    await (supabase.from("build_requests") as any).update({
      status: "revision",
      revision_count: newCount,
      revision_feedback: feedback,
    }).eq("id", buildRequest.id);

    // Update profile status
    if (buildRequest.business_id) {
      await (supabase.from("profiles") as any)
        .update({ website_status: "revision" })
        .eq("user_id", buildRequest.business_id);
    }

    // WhatsApp notify admin
    const issuesList = feedback.selected.join(", ");
    const msg = `✏️ REVISION REQUEST\nBusiness: ${businessName}\nRevision: ${newCount}/${maxRevisions}\nIssues: ${issuesList}\nDetails: ${feedback.description || "None"}\nFix and resubmit: leadpe.tech/studio`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");

    toast({ title: "Changes sent to your builder ✅", description: "Updated website ready in 24 hours." });
    setSelected([]);
    setDescription("");
    setSubmitting(false);
    onClose();
    onSubmitted();
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
            className="bg-white w-full rounded-t-[20px] overflow-y-auto"
            style={{ maxHeight: "80vh", padding: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div style={{ width: 32, height: 4, backgroundColor: "#E0E0E0", borderRadius: 2, margin: "0 auto 16px" }} />

            <h3 style={{ fontFamily: font.heading, fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
              What needs to be changed?
            </h3>
            <p style={{ fontFamily: font.body, fontSize: 13, color: "#999", marginBottom: 16 }}>
              Select all that apply
            </p>

            {/* Checkboxes */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {REVISION_OPTIONS.map(opt => (
                <label
                  key={opt.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 12,
                    border: selected.includes(opt.id) ? "2px solid #00C853" : "1px solid #E0E0E0",
                    backgroundColor: selected.includes(opt.id) ? "#F0FFF4" : "#fff",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.id)}
                    onChange={() => toggleOption(opt.id)}
                    style={{ width: 18, height: 18, accentColor: "#00C853" }}
                  />
                  <span style={{ fontFamily: font.body, fontSize: 14, color: "#1A1A1A" }}>{opt.label}</span>
                </label>
              ))}
            </div>

            {/* Description */}
            <label style={{ fontFamily: font.body, fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 6, display: "block" }}>
              Describe specifically (what exactly to change)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              placeholder="Example: Change hero background color to blue, and add our address in footer"
              rows={3}
              style={{
                width: "100%", border: "1px solid #E0E0E0", borderRadius: 12, padding: 14,
                fontFamily: font.body, fontSize: 14, color: "#1A1A1A", resize: "none",
                boxSizing: "border-box",
              }}
            />
            <p style={{ fontFamily: font.body, fontSize: 11, color: "#999", textAlign: "right", marginTop: 4 }}>
              {description.length}/300
            </p>

            {/* Revision counter */}
            <p style={{ fontFamily: font.body, fontSize: 13, color: "#666", textAlign: "center", margin: "8px 0 16px" }}>
              Revision {revisionCount + 1} of {maxRevisions}
            </p>

            <button
              onClick={handleSubmit}
              disabled={selected.length === 0 || submitting}
              style={{
                width: "100%", backgroundColor: "#00C853", color: "#fff", border: "none",
                borderRadius: 12, height: 52, fontFamily: font.body, fontSize: 15, fontWeight: 600,
                cursor: selected.length > 0 ? "pointer" : "not-allowed",
                opacity: selected.length === 0 ? 0.5 : 1,
              }}
            >
              {submitting ? "Sending..." : "Send to Builder →"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
