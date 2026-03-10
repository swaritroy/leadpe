import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Copy, CheckCircle, Loader2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_WHATSAPP } from "@/lib/constants";

const font = { heading: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

interface ActivationPanelProps {
  buildRequests: any[];
  profiles: any[];
  onRefresh: () => void;
}

export default function ActivationPanel({ buildRequests, profiles, onRefresh }: ActivationPanelProps) {
  const { toast } = useToast();
  const [activating, setActivating] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<any>(null);
  const [coderPaidMap, setCoderPaidMap] = useState<Record<string, boolean>>({});

  // Get businesses with demo_ready or paid status that need activation
  const readyToActivate = buildRequests.filter(
    (r: any) => r.status === "demo_ready" || r.status === "approved" || r.status === "deploying"
  );

  const handleActivate = async (request: any) => {
    setActivating(request.id);
    try {
      // 1. Update build_request status to live
      await (supabase as any).from("build_requests").update({
        status: "live",
        live_url: request.deploy_url || request.demo_url,
        deployed_at: new Date().toISOString(),
      }).eq("id", request.id);

      // 2. Update profile
      const ownerProfile = profiles.find((p: any) =>
        p.whatsapp_number === request.owner_whatsapp ||
        p.business_name === request.business_name
      );
      if (ownerProfile) {
        await (supabase as any).from("profiles").update({
          status: "active",
          subscription_plan: "growth",
          site_url: request.deploy_url || request.demo_url,
        }).eq("id", ownerProfile.id);
      }

      // 3. Create earnings record for the coder
      if (request.assigned_coder_id) {
        const coderEarn = request.coder_earning || 640;
        await (supabase as any).from("earnings").insert({
          vibe_coder_id: request.assigned_coder_id,
          deployment_id: request.id,
          amount: coderEarn,
          type: "building",
          month: new Date().toISOString().slice(0, 7),
          paid: false,
        });

        // Update coder profile
        const coderProfile = profiles.find((p: any) => p.user_id === request.assigned_coder_id || p.id === request.assigned_coder_id);
        if (coderProfile) {
          await (supabase as any).from("profiles").update({
            total_earned: (coderProfile.total_earned || 0) + coderEarn,
            total_sites_live: (coderProfile.total_sites_live || 0) + 1,
            monthly_passive: ((coderProfile.total_sites_live || 0) + 1) * 30,
          }).eq("id", coderProfile.id);
        }
      }

      // 4. WhatsApp to business
      const url = request.deploy_url || request.demo_url || "";
      const msg = `🚀 ${request.business_name}, you're LIVE!\n\nVisit: ${url}\n\nCustomers can now find you on Google!\nLeads will come to your WhatsApp.\n\nLeadPe 🌱`;
      window.open(`https://wa.me/91${request.owner_whatsapp?.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");

      toast({ title: `✅ ${request.business_name} is LIVE!` });
      setShowConfirm(null);
      onRefresh();
    } catch (e: any) {
      console.error("Activation error:", e);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setActivating(null);
  };

  const handleMarkCoderPaid = async (request: any) => {
    if (!request.assigned_coder_id) return;
    const coderProfile = profiles.find((p: any) => p.user_id === request.assigned_coder_id || p.id === request.assigned_coder_id);
    const coderEarn = request.coder_earning || 640;

    // Mark earnings as paid
    await (supabase as any).from("earnings")
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq("deployment_id", request.id)
      .eq("vibe_coder_id", request.assigned_coder_id);

    // WhatsApp to coder
    if (coderProfile?.whatsapp_number) {
      const msg = `💰 Payment sent! ₹${coderEarn} to your UPI: ${coderProfile.upi_id || "not set"}\nBusiness: ${request.business_name} is now live.\n₹30/month passive starts now! 🎉`;
      window.open(`https://wa.me/91${coderProfile.whatsapp_number?.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
    }

    setCoderPaidMap(prev => ({ ...prev, [request.id]: true }));
    toast({ title: "✅ Coder marked as paid!" });
    onRefresh();
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4" style={{ fontFamily: font.heading }}>
        Ready to Activate 🔴
        {readyToActivate.length > 0 && (
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: "#ef4444" }}>
            {readyToActivate.length}
          </span>
        )}
      </h3>

      {readyToActivate.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: "#F9F9F9", border: "1px solid #E0E0E0" }}>
          <CheckCircle size={32} className="mx-auto mb-2" style={{ color: "#00C853" }} />
          <p style={{ fontSize: 14, color: "#666" }}>No pending activations</p>
        </div>
      ) : (
        <div className="space-y-4">
          {readyToActivate.map((request: any) => {
            const coderProfile = profiles.find((p: any) => p.user_id === request.assigned_coder_id || p.id === request.assigned_coder_id);
            const isPaid = coderPaidMap[request.id];

            return (
              <motion.div key={request.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5" style={{ border: "2px solid #00C853", boxShadow: "0 4px 16px rgba(0,200,83,0.12)" }}>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p style={{ fontFamily: font.heading, fontSize: 16, fontWeight: 700 }}>{request.business_name}</p>
                    <p style={{ fontSize: 13, color: "#666" }}>{request.business_type} • {request.city}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: "#FF9800" }}>
                    {request.status}
                  </span>
                </div>

                {/* Preview button */}
                {(request.demo_url || request.deploy_url) && (
                  <button onClick={() => window.open(request.demo_url || request.deploy_url, "_blank")}
                    className="flex items-center gap-2 mb-3 text-sm" style={{ color: "#00C853", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                    <ExternalLink size={14} /> Preview Demo →
                  </button>
                )}

                {/* Coder info */}
                {coderProfile && (
                  <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: "#F8F9FA" }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>Coder: {coderProfile.full_name || request.assigned_coder_name}</p>
                    {coderProfile.upi_id && (
                      <div className="flex items-center gap-2 mt-1">
                        <span style={{ fontSize: 12, color: "#666" }}>UPI: {coderProfile.upi_id}</span>
                        <button onClick={() => copyText(coderProfile.upi_id)} style={{ fontSize: 11, color: "#00C853", background: "none", border: "none", cursor: "pointer" }}>Copy</button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span style={{ fontSize: 12, color: "#666" }}>Earning: ₹{request.coder_earning || 640}</span>
                      <button onClick={() => copyText(String(request.coder_earning || 640))} style={{ fontSize: 11, color: "#00C853", background: "none", border: "none", cursor: "pointer" }}>Copy</button>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-2">
                  <button onClick={() => setShowConfirm(request)}
                    disabled={activating === request.id}
                    style={{ width: "100%", backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", minHeight: 52 }}>
                    {activating === request.id ? (
                      <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Activating...</span>
                    ) : "Activate Website 🚀"}
                  </button>

                  {request.status === "live" && coderProfile && !isPaid && (
                    <button onClick={() => handleMarkCoderPaid(request)}
                      style={{ width: "100%", backgroundColor: "#1A1A1A", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44 }}>
                      Mark Coder Paid ✓
                    </button>
                  )}
                  {isPaid && (
                    <p style={{ fontSize: 12, color: "#00C853", textAlign: "center" }}>✅ Coder paid</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: font.heading, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Activate {showConfirm.business_name}?
            </h3>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16, lineHeight: 1.6 }}>
              This will:<br />
              • Remove demo watermark<br />
              • Enable all contact buttons<br />
              • Start Google indexing<br />
              • Send WhatsApp to business<br />
              • Update coder earnings
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)}
                style={{ flex: 1, backgroundColor: "#F5F5F5", color: "#666", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={() => handleActivate(showConfirm)}
                disabled={activating === showConfirm.id}
                style={{ flex: 1, backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {activating === showConfirm.id ? "..." : "Confirm 🚀"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
