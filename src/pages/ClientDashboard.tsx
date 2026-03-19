import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import LeadPeLogo from "@/components/LeadPeLogo";
import { getTrialStatus, TrialStatus } from "@/lib/trialManager";
import { useToast } from "@/hooks/use-toast";

import StateANoWebsite from "@/components/dashboard/StateANoWebsite";
import StateBBuilding from "@/components/dashboard/StateBBuilding";
import StateCLive from "@/components/dashboard/StateCLive";
import StateExpired from "@/components/dashboard/StateExpired";

interface Lead {
  id: string;
  customer_name: string;
  phone: string | null;
  message: string | null;
  created_at: string;
}

const font = { heading: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

export default function ClientDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [trial, setTrial] = useState<TrialStatus | null>(null);
  const [buildRequest, setBuildRequest] = useState<Record<string, unknown> | null>(null);
  const [business, setBusiness] = useState<Record<string, unknown> | null>(null);
  const [showSignOut, setShowSignOut] = useState(false);
  const [newLeadAlert, setNewLeadAlert] = useState<Lead | null>(null);
  const dataFetched = useRef(false);

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  // Compute trial status
  useEffect(() => {
    if (!profile) return;
    setTrial(getTrialStatus(profile));
  }, [profile]);

  // Fetch all data ONCE on mount
  useEffect(() => {
    if (!user || dataFetched.current) return;
    dataFetched.current = true;

    const init = async () => {
      // Fetch build request
      const { data: br } = await supabase.from("build_requests")
        .select("*").eq("business_id", user.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (br) setBuildRequest(br as Record<string, unknown>);

      // Fetch business
      const { data: biz } = await supabase.from("businesses")
        .select("*").eq("owner_id", user.id).maybeSingle();
      if (biz) {
        setBusiness(biz as Record<string, unknown>);
        // Fetch leads
        const { data: leadsData } = await supabase.from("leads")
          .select("*").eq("business_id", biz.id)
          .order("created_at", { ascending: false }).limit(50);
        setLeads((leadsData || []) as Lead[]);
      }

      setLoading(false);
    };
    init();
  }, [user]);

  // Realtime subscriptions — set up once
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel("dashboard-realtime")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "build_requests",
        filter: `business_id=eq.${user.id}`,
      }, (payload) => {
        const updated = payload.new as Record<string, unknown>;
        setBuildRequest(updated);

        // Sync profile website_status based on build status
        const newStatus = updated.status as string;
        if (newStatus === "building" || newStatus === "demo_ready" || newStatus === "live") {
          // Force profile re-read isn't needed since we derive state from buildRequest
        }
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "profiles",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if ((payload.new as any).status === "active" && profile?.status !== "active") {
          toast({ title: "🎉 Customers unlocked!", description: "You can now see all your customers." });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, profile?.status, toast]);

  // Realtime leads subscription
  useEffect(() => {
    if (!business?.id) return;

    const channel = supabase.channel("client-leads")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "leads",
        filter: `business_id=eq.${business.id}`,
      }, (payload) => {
        const newLead = payload.new as Lead;
        setLeads((prev) => [newLead, ...prev]);
        setNewLeadAlert(newLead);
        setTimeout(() => setNewLeadAlert(null), 3000);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [business?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  // Determine dashboard state
  const status = (buildRequest?.status as string) || null;
  const websiteStatus = profile?.website_status || null;
  const isLive = status === "live";
  const isExpiredOrder = status === "expired" || websiteStatus === "expired";
  const isBuilding = !isExpiredOrder && (status === "pending" || status === "building" || status === "demo_ready");
  const hasNoWebsite = !buildRequest && !websiteStatus;

  const isExpired = trial?.isExpired;
  const isPaid = profile?.status === "active" && !trial?.isTrial;

  // Trial bar config
  const getTrialBar = () => {
    if (isPaid) return null;
    if (!trial) return null;
    if (isExpired) return { bg: "#FFEBEE", text: "Your free period ended", color: "#C62828", btnText: "Continue →", btnColor: "#FF5252" };
    if (trial.isTrialEning) return { bg: "#FFF3E0", text: `⚠️ Free period ends in ${trial.daysLeft} days`, color: "#E65100", btnText: "Continue →", btnColor: "#FF6B00" };
    if (trial.daysLeft <= 7 && trial.daysLeft > 3) return { bg: "#FFF3E0", text: `⚠️ Free period ends in ${trial.daysLeft} days`, color: "#E65100", btnText: "Continue →", btnColor: "#FF6B00" };
    return { bg: "#E8F5E9", text: `🟢 Free — ${trial.daysLeft} days left`, color: "#1A1A1A", btnText: null, btnColor: null };
  };
  const trialBar = getTrialBar();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F5FFF7" }}>
        <div style={{ width: 32, height: 32, border: "2px solid #E0E0E0", borderTopColor: "#00C853", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", fontFamily: font.body }}>
      {/* NAVBAR */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50, backgroundColor: "#fff",
        height: 56, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", padding: "0 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <LeadPeLogo theme="light" size="sm" />
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowSignOut(!showSignOut)}
            style={{
              width: 36, height: 36, borderRadius: "50%", backgroundColor: "#00C853",
              color: "#fff", border: "none", cursor: "pointer",
              fontFamily: font.heading, fontSize: 14, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {firstName[0]?.toUpperCase() || "U"}
          </button>
          {showSignOut && (
            <div style={{
              position: "absolute", right: 0, top: 44, backgroundColor: "#fff",
              borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", padding: 12,
              zIndex: 50, border: "1px solid #E0E0E0", minWidth: 140,
            }}>
              <button onClick={handleSignOut}
                style={{
                  width: "100%", textAlign: "left", fontFamily: font.body, fontSize: 14,
                  color: "#FF5252", padding: "8px 8px", borderRadius: 8,
                  background: "none", border: "none", cursor: "pointer",
                }}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* TRIAL BAR */}
      {trialBar && (
        <div style={{
          backgroundColor: trialBar.bg, padding: "0 20px", height: 40,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontFamily: font.body, fontSize: 13, color: trialBar.color }}>{trialBar.text}</span>
          {trialBar.btnText && (
            <button
              onClick={() => {
                sessionStorage.setItem("upgrade_intent", "true");
                navigate("/payment?plan=growth&amount=299");
              }}
              style={{
                background: "none", border: "none", fontFamily: font.body,
                fontSize: 13, fontWeight: 600, color: trialBar.btnColor || "#1A1A1A",
                cursor: "pointer",
              }}
            >
              {trialBar.btnText}
            </button>
          )}
        </div>
      )}

      {/* DASHBOARD STATES */}
      {hasNoWebsite && (
        <StateANoWebsite
          firstName={firstName}
          onGetWebsite={() => navigate("/get-website")}
        />
      )}

      {isBuilding && (
        <StateBBuilding
          buildRequest={buildRequest}
          businessName={profile?.business_name || profile?.full_name || "Business"}
        />
      )}

      {isExpiredOrder && (
        <StateExpired
          profile={profile}
          user={user}
        />
      )}

      {isLive && (
        <StateCLive
          buildRequest={buildRequest}
          business={business}
          profile={profile}
          leads={leads}
          trial={trial}
          user={user}
        />
      )}

      {/* NEW CUSTOMER TOAST */}
      <AnimatePresence>
        {newLeadAlert && (
          <motion.div
            initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            style={{
              position: "fixed", top: 58, left: 0, right: 0, zIndex: 40,
              backgroundColor: "#00C853", padding: "10px 20px",
            }}
          >
            <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: font.body, fontSize: 13, fontWeight: 500, color: "#fff" }}>
                📱 New customer contacted you!
              </span>
              {newLeadAlert.phone && (
                <a href={`https://wa.me/91${newLeadAlert.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  style={{
                    backgroundColor: "#fff", color: "#00C853", fontFamily: font.body,
                    fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 8,
                    textDecoration: "none",
                  }}>
                  Call →
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}