import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, RotateCcw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logEvent, ORDER_EVENTS } from "@/lib/evidence";
import LeadPeLogo from "@/components/LeadPeLogo";

export default function DemoPreview() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionText, setRevisionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await (supabase as any)
        .from("orders")
        .select("*")
        .eq("order_id", orderId)
        .single();
      if (data) {
        setOrder(data);
        // Log view event
        if (data.status === "demo_ready") {
          await logEvent(data.order_id, ORDER_EVENTS.DEMO_VIEWED_BY_CUSTOMER);
          await (supabase as any).from("orders").update({ demo_viewed_at: new Date().toISOString() }).eq("id", data.id);
        }
      }
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  const handleApprove = async () => {
    if (!order) return;
    await (supabase as any).from("orders").update({
      status: "approved",
      demo_approved_at: new Date().toISOString(),
    }).eq("id", order.id);
    await logEvent(order.order_id, ORDER_EVENTS.DEMO_APPROVED);
    navigate(`/payment?order=${order.order_id}&amount=${order.total_price}`);
  };

  const handleRevision = async () => {
    if (!revisionText.trim()) return;
    setSubmitting(true);
    const revisions = Array.isArray(order.revision_requests) ? order.revision_requests : [];
    revisions.push({ text: revisionText, at: new Date().toISOString() });

    await (supabase as any).from("orders").update({
      status: "revision_requested",
      revision_count: (order.revision_count || 0) + 1,
      revision_requests: revisions,
    }).eq("id", order.id);

    await logEvent(order.order_id, ORDER_EVENTS.REVISION_REQUESTED, revisionText);

    // WhatsApp to admin
    const msg = encodeURIComponent(`🔄 REVISION REQUEST\nOrder: ${order.order_id}\nBusiness: ${order.business_name}\nChanges: ${revisionText}`);
    window.open(`https://wa.me/919973383902?text=${msg}`, "_blank", "noopener,noreferrer");

    setSubmitting(false);
    setShowRevisionModal(false);
    toast({ title: "Changes submitted!", description: "We'll update your demo soon." });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="animate-spin w-8 h-8 border-2 border-[#00C853] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order || !order.demo_url) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-[#1A1A1A] mb-2">Demo Not Ready Yet</h1>
          <p className="text-[#666] text-sm">We're still building your website. You'll get a WhatsApp when it's ready!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5FFF7" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-[#1A1A1A] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LeadPeLogo theme="dark" size="sm" />
          <span className="text-xs text-[#999]">Demo Preview</span>
        </div>
        <span className="text-sm font-medium">{order.business_name}</span>
      </div>

      {/* iframe */}
      <div className="flex-1 relative">
        <iframe
          src={order.demo_url}
          className="w-full h-full min-h-[70vh] border-0"
          title="Demo Preview"
        />
        {/* Watermark overlay */}
        <div className="absolute top-0 left-0 right-0 bg-yellow-500/90 text-center py-2 text-sm font-bold text-black">
          🔒 DEMO — Not Live Yet — Approve to Go Live
        </div>
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 bg-white border-t border-[#E0E0E0] px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <p className="text-center text-sm text-[#666] mb-3">Pasand aaya apni website?</p>
        <div className="flex gap-3 max-w-md mx-auto">
          <Button
            onClick={() => setShowRevisionModal(true)}
            variant="outline"
            className="flex-1 h-12 rounded-xl font-semibold border-[#E0E0E0] text-[#666]"
          >
            <RotateCcw size={16} className="mr-2" /> Request Changes
          </Button>
          <Button
            onClick={handleApprove}
            className="flex-1 h-12 rounded-xl font-semibold text-white bg-[#00C853] hover:bg-[#00A843]"
          >
            <Check size={16} className="mr-2" /> Approve & Pay ₹{order.total_price?.toLocaleString()}
          </Button>
        </div>
      </div>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
              Request Changes 🔄
            </h3>
            <p className="text-sm text-[#666] mb-4">Tell us what changes you need.</p>
            <Textarea
              value={revisionText}
              onChange={(e) => setRevisionText(e.target.value)}
              placeholder="e.g. Change color to blue, add phone number in footer..."
              className="bg-[#FAFAFA] border-[#E0E0E0] rounded-xl text-[#111] mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowRevisionModal(false)} className="flex-1 h-11 rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={handleRevision}
                disabled={submitting || !revisionText.trim()}
                className="flex-1 h-11 rounded-xl bg-[#00C853] hover:bg-[#00A843] text-white font-semibold"
              >
                {submitting ? "Sending..." : "Submit Changes"}
              </Button>
            </div>
            {(order.revision_count || 0) >= 1 && (
              <p className="text-xs text-[#999] text-center mt-3">
                Note: Extra revisions after the first may cost ₹200 each.
              </p>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
