import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Copy, CheckCircle, Loader2, Rocket, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const font = { heaing: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

interface ActivationPanelProps {
  buildRequests: any[];
  profiles: any[];
  onRefresh: () => void;
}

export default function ActivationPanel({ buildRequests, profiles, onRefresh }: ActivationPanelProps) {
  const { toast } = useToast();
  const [activating, setActivating] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<any>(null);
  const [coderPaidMap, setCoderPaidMap] = useState<Record<string, boolean>>({});

  // Surface anything that can be promoted: demos awaiting activation, or already-paid trials
  // we still need to push live. Includes "live" so admin can re-run if needed.
  const readyToActivate = buildRequests.filter(
    (r: any) => r.status === "demo_ready" || r.status === "approved" || r.status === "deploying" || r.status === "review" || r.status === "paid"
  );

  const findOwner = (request: any) =>
    profiles.find((p: any) =>
      (request.business_id && (p.user_id === request.business_id || p.id === request.business_id)) ||
      p.whatsapp_number === request.owner_whatsapp ||
      p.business_name === request.business_name
    );

  const findCoder = (request: any) =>
    profiles.find((p: any) => p.user_id === request.assigned_coder_id || p.id === request.assigned_coder_id);

  const handleActivate = async (request: any) => {
    setActivating(request.id);
    try {
      const ownerProfile = findOwner(request);
      const ownerUserId = ownerProfile?.user_id || request.business_id;
      const subdomain = ownerProfile?.subdomain
        || (ownerProfile?.business_name || request.business_name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        || "site";

      // 1. Trigger live deployment (custom domain + SEO + redeploy)
      if (request.github_url) {
        try {
          await supabase.functions.invoke("deploy-website", {
            body: { action: "deploy_live", data: { buildRequestId: request.id, subdomain, userId: ownerUserId } },
          });
        } catch (e) { console.error("deploy_live error:", e); }
      }

      // 2. Mark build live (in case deploy_live hasn't responded yet)
      const liveUrl = `https://${subdomain}.leadpe.online`;
      await (supabase as any).from("build_requests").update({
        status: "live",
        live_url: request.deploy_url || request.demo_url || liveUrl,
        deploy_url: request.deploy_url || request.demo_url || liveUrl,
        deployed_at: new Date().toISOString(),
      }).eq("id", request.id);

      // 3. Update profile
      if (ownerProfile) {
        await (supabase as any).from("profiles").update({
          status: "active",
          website_status: "live",
          subscription_plan: "growth",
          plan_type: "growth",
          plan_status: "active",
          site_url: liveUrl,
          subdomain,
        }).eq("user_id", ownerProfile.user_id);
      }

      // 4. Coder earnings (idempotent insert — only if missing)
      if (request.assigned_coder_id) {
        const { data: existing } = await (supabase as any).from("earnings")
          .select("id")
          .eq("deployment_id", request.id)
          .eq("vibe_coder_id", request.assigned_coder_id)
          .eq("type", "building")
          .maybeSingle();
        if (!existing) {
          const coderEarn = request.coder_earning || Math.round((request.package_price || 800) * 0.60);
          await (supabase as any).from("earnings").insert({
            vibe_coder_id: request.assigned_coder_id,
            deployment_id: request.id,
            amount: coderEarn,
            type: "building",
            month: new Date().toISOString().slice(0, 7),
            paid: false,
          });
        }
      }

      // 5. WhatsApp to business
      const url = liveUrl;
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

  const handleUpgradeToGrowth = async (request: any) => {
    const ownerProfile = findOwner(request);
    if (!ownerProfile?.user_id) {
      toast({ title: "Owner not found", description: "Cannot upgrade — no profile linked.", variant: "destructive" });
      return;
    }
    setUpgrading(request.id);
    try {
      const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      await (supabase as any).from("profiles").update({
        plan_type: "growth",
        plan_status: "active",
        subscription_plan: "growth",
        status: "active",
        plan_renewal_date: oneYearFromNow,
        growth_started_at: new Date().toISOString(),
        growth_ends_at: oneYearFromNow,
      }).eq("user_id", ownerProfile.user_id);

      await (supabase as any).from("businesses").update({
        subscription_active: true,
        subscription_expiry: oneYearFromNow,
      }).eq("owner_id", ownerProfile.user_id);

      // Record manual activation as a payment row for audit trail
      await (supabase as any).from("payments").insert({
        business_id: ownerProfile.user_id,
        business_name: ownerProfile.business_name || request.business_name,
        amount: 299,
        total: 299,
        method: "admin_manual",
        plan: "growth",
        status: "completed",
        activated_at: new Date().toISOString(),
      });

      if (ownerProfile.whatsapp_number) {
        const msg = `🎉 Your LeadPe Growth Plan is ACTIVE!\n\n✅ Customer details unlocked\n✅ WhatsApp lead alerts ON\n✅ Google visibility ON\n✅ Valid for 1 year\n\nLeadPe 🌱`;
        window.open(`https://wa.me/91${ownerProfile.whatsapp_number?.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
      }

      toast({ title: `✅ ${ownerProfile.business_name || request.business_name} upgraded to Growth!` });
      onRefresh();
    } catch (e: any) {
      console.error("upgrade error:", e);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setUpgrading(null);
  };

  const handleMarkCoderPaid = async (request: any) => {
    if (!request.assigned_coder_id) return;
    const coderProfile = findCoder(request);
    const coderEarn = request.coder_earning || Math.round((request.package_price || 800) * 0.60);

    await (supabase as any).from("earnings")
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq("deployment_id", request.id)
      .eq("vibe_coder_id", request.assigned_coder_id);

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
      <h3 className="text-lg font-bold mb-4" style={{ fontFamily: font.heaing }}>
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
            const coderProfile = findCoder(request);
            const ownerProfile = findOwner(request);
            const isPaid = coderPaidMap[request.id];

            return (
              <motion.div key={request.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5" style={{ border: "2px solid #00C853", boxShadow: "0 4px 16px rgba(0,200,83,0.12)" }}>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p style={{ fontFamily: font.heaing, fontSize: 16, fontWeight: 700 }}>{request.business_name}</p>
                    <p style={{ fontSize: 13, color: "#666" }}>{request.business_type} • {request.city}</p>
                    {ownerProfile && (
                      <p style={{ fontSize: 12, color: "#888" }}>Plan: {ownerProfile.plan_type || "free"} • Status: {ownerProfile.status || "—"}</p>
                    )}
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: "#FF9800" }}>
                    {request.status}
                  </span>
                </div>

                {(request.demo_url || request.deploy_url) && (
                  <button onClick={() => window.open(request.demo_url || request.deploy_url, "_blank")}
                    className="flex items-center gap-2 mb-3 text-sm" style={{ color: "#00C853", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                    <ExternalLink size={14} /> Preview Demo →
                  </button>
                )}

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
                      <span style={{ fontSize: 12, color: "#666" }}>Coder earns: ₹{request.coder_earning || Math.round((request.package_price || 800) * 0.60)}</span>
                      <button onClick={() => copyText(String(request.coder_earning || Math.round((request.package_price || 800) * 0.60)))} style={{ fontSize: 11, color: "#00C853", background: "none", border: "none", cursor: "pointer" }}>Copy</button>
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
                    ) : (
                      <span className="flex items-center justify-center gap-2"><Rocket size={16} /> Move Demo → Live 🚀</span>
                    )}
                  </button>

                  <button onClick={() => handleUpgradeToGrowth(request)}
                    disabled={upgrading === request.id}
                    style={{ width: "100%", backgroundColor: "#1976D2", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44 }}>
                    {upgrading === request.id ? (
                      <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Upgrading...</span>
                    ) : (
                      <span className="flex items-center justify-center gap-2"><Zap size={14} /> Upgrade Trial → Growth 💚</span>
                    )}
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
            <h3 style={{ fontFamily: font.heaing, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Move {showConfirm.business_name} to Live?
            </h3>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16, lineHeight: 1.6 }}>
              This will:<br />
              • Trigger live deployment with custom subdomain<br />
              • Mark website live<br />
              • Activate Growth plan on profile<br />
              • Update coder earnings<br />
              • Send WhatsApp to business
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
