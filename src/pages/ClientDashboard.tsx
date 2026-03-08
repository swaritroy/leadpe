import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, LogOut, Phone, MessageCircle, Copy, TrendingUp, Clock, Zap, ChevronDown, ChevronUp, Wallet, Eye, Lock, AlertCircle, CheckCircle2, Star, Users, Globe, X, Wrench, User, Code, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import LeadPeLogo from "@/components/LeadPeLogo";
import { getTrialProgress, checkAndTriggerSequence, Language, languageLabels } from "@/lib/trialSequence";
import { LanguageSelector } from "@/components/LanguageSelector";
import { generateWeeklyReport, WeeklyReportData, getPastWeeklyReports, getWeekRange } from "@/lib/weeklyReport";
import { sendWhatsApp, getMessage } from "@/lib/whatsappService";
import { getBusinessIcon, formatDeadline } from "@/lib/clientBrief";

interface Lead {
  id: string;
  business_id: string;
  customer_name: string;
  customer_phone: string;
  interest: string;
  message?: string;
  source: string;
  status: "new" | "contacted" | "closed" | "lost";
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  business_name: string;
  whatsapp_number: string;
  subscription_plan: string;
  status: "trial" | "active" | "expired" | "paused";
  plan_status?: "trial" | "active" | "expired" | "paused";
  site_url?: string;
  trial_ends_at?: string;
  trial_start_date?: string;
  preferred_language?: Language;
  plan_renewal_date?: string;
}

interface SiteStats {
  visitors: number;
  inquiries: number;
  vsLastWeek: number;
  speedScore: number;
}

interface BuildRequest {
  id: string;
  business_id: string;
  business_name: string;
  business_type: string;
  city: string;
  owner_name: string;
  owner_whatsapp: string;
  plan_selected: string;
  preferred_language: string;
  status: string;
  assigned_coder_id: string;
  created_at: string;
  deadline: string;
  github_url: string;
  submitted_at: string;
  coder_name?: string;
}

const planNames: Record<string, string> = {
  basic: "Basic",
  growth: "Growth",
  pro: "Pro",
};

const statusOptions = [
  { value: "new", label: "New", color: "#00E676" },
  { value: "contacted", label: "Contacted", color: "#eab308" },
  { value: "closed", label: "Closed", color: "#3b82f6" },
  { value: "lost", label: "Lost", color: "#6b7280" },
];

const timeAgo = (date: string) => {
  const hours = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.floor(hours / 24)} days ago`;
};

const demoLead: Lead = {
  id: "demo",
  business_id: "demo",
  customer_name: "Rahul Sharma (Demo)",
  customer_phone: "XXXXXXXXXX",
  interest: "Your service",
  message: "",
  source: "website",
  status: "new",
  created_at: new Date().toISOString(),
};

export default function ClientDashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SiteStats>({ visitors: 0, inquiries: 0, vsLastWeek: 0, speedScore: 94 });
  const [buildRequest, setBuildRequest] = useState<BuildRequest | null>(null);

  // Modal states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalValue, setModalValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  // Realtime subscription
  const [subscription, setSubscription] = useState<any>(null);

  // Trial progress tracking
  const [trialProgress, setTrialProgress] = useState({ day: 1, daysRemaining: 6, percentComplete: 0, isEnding: false });

  // Language selector
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  // Weekly report state
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportData | null>(null);
  const [pastReports, setPastReports] = useState<any[]>([]);
  const [showPastReports, setShowPastReports] = useState(false);

  // Lead Lock Mechanism states
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [currentTrialDay, setCurrentTrialDay] = useState(1);
  const [isLocked, setIsLocked] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: profileData } = await (supabase.from("profiles") as any)
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(profileData);

    if (profileData) {
      const { data: leadsData } = await (supabase.from("leads") as any)
        .select("*")
        .eq("business_id", user.id)
        .order("created_at", { ascending: false });
      
      const realLeads = leadsData || [];
      // Add demo lead if no real leads exist
      setLeads(realLeads.length === 0 ? [demoLead] : realLeads);

      setStats({
        visitors: Math.floor(Math.random() * 150) + 50,
        inquiries: realLeads.length,
        vsLastWeek: Math.floor(Math.random() * 40) - 15,
        speedScore: 94,
      });

      // Fetch build request
      const { data: buildRequestData } = await (supabase as any).from("build_requests")
        .select("*")
        .eq("business_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      // Enrich with coder name if assigned
      if (buildRequestData && buildRequestData.assigned_coder_id) {
        const { data: coderData } = await (supabase.from("profiles") as any)
          .select("full_name")
          .eq("id", buildRequestData.assigned_coder_id)
          .single();
        
        setBuildRequest({
          ...buildRequestData,
          coder_name: coderData?.full_name || "Unknown"
        });
      } else {
        setBuildRequest(buildRequestData);
      }

      // Fetch deployment for trial data (matching by owner whatsapp)
      const { data: deploymentData } = await (supabase as any).from("deployments")
        .select("*")
        .eq("owner_whatsapp", profileData.whatsapp_number.replace(/\D/g, ""))
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (deploymentData?.trial_start_date) {
        const progress = getTrialProgress(deploymentData.trial_start_date);
        setTrialProgress(progress);
        setCurrentTrialDay(progress.day);
      }

      // Check plan status for lead locking
      const effectiveStatus = profileData?.plan_status || profileData?.status || "trial";
      const locked = effectiveStatus === "expired" || effectiveStatus === "paused";
      setIsLocked(locked);

      // Fetch weekly report
      const report = await generateWeeklyReport(user.id);
      if (report) {
        setWeeklyReport(report);
      }

      // Fetch past reports
      const past = await getPastWeeklyReports(user.id, 4);
      setPastReports(past);
    }

    setLoading(false);
  }, [user]);

  // Check trial sequence on load
  const checkTrialSequence = useCallback(async () => {
    if (!user) return;
    
    // Trigger sequence check (admin notifications, etc.)
    // This uses the deployment record, not the profile
    try {
      await checkAndTriggerSequence(user.id);
    } catch (e) {
      console.log("Trial sequence check failed (expected if no deployment record)");
    }

    // Check and send day 6 and day 7 messages
    await checkTrialDayMessages();
  }, [user]);

  // Check trial day messages (day 6 and day 7)
  const checkTrialDayMessages = useCallback(async () => {
    if (!user || !profile) return;

    try {
      // Get deployment record
      const { data: deploymentData } = await (supabase as any).from("deployments")
        .select("*")
        .eq("owner_whatsapp", profile.whatsapp_number.replace(/\D/g, ""))
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!deploymentData?.trial_start_date) return;

      const progress = getTrialProgress(deploymentData.trial_start_date);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Check if day 6 message should be sent
      if (progress.day === 6 && !deploymentData.day6_sent) {
        const messageData = {
          ownerName: deploymentData.owner_name,
          leads: stats.inquiries
        };

        await sendWhatsApp(
          deploymentData.owner_whatsapp,
          getMessage('day6', 'hinglish', messageData),
          deploymentData.id,
          'day6',
          'hinglish'
        );

        // Mark as sent
        await (supabase as any).from("deployments")
          .update({ day6_sent: true })
          .eq("id", deploymentData.id);
      }

      // Check if day 7 message should be sent
      if (progress.day === 7 && !deploymentData.day7_sent) {
        const messageData = {
          ownerName: deploymentData.owner_name,
          leads: stats.inquiries
        };

        await sendWhatsApp(
          deploymentData.owner_whatsapp,
          getMessage('day7', 'hinglish', messageData),
          deploymentData.id,
          'day7',
          'hinglish'
        );

        // Mark as sent
        await (supabase as any).from("deployments")
          .update({ day7_sent: true })
          .eq("id", deploymentData.id);
      }
    } catch (error) {
      console.log("Error checking trial day messages:", error);
    }
  }, [user, profile, stats.inquiries]);

  useEffect(() => {
    checkTrialSequence();
  }, [checkTrialSequence]);

  // Setup realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchData();

    const sub = (supabase.channel("leads-channel") as any)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
          filter: `business_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newLead = payload.new as Lead;
          setLeads((prev) => {
            // Remove demo lead if present
            const filtered = prev.filter((l) => l.id !== "demo");
            return [newLead, ...filtered];
          });
          setStats((s) => ({ ...s, inquiries: s.inquiries + 1 }));
          
          // Browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("New lead!", {
              body: `${newLead.customer_name} is interested in ${newLead.interest}`,
              icon: "/favicon.ico",
            });
          } else if ("Notification" in window && Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
              if (permission === "granted") {
                new Notification("New lead!", {
                  body: `${newLead.customer_name} is interested in ${newLead.interest}`,
                });
              }
            });
          }

          toast({
            title: "New lead received! 🔔",
            description: `${newLead.customer_name} — ${newLead.interest}`,
          });
        }
      )
      .subscribe();

    setSubscription(sub);

    return () => {
      sub.unsubscribe();
    };
  }, [user, fetchData, toast]);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    if (leadId === "demo") return;
    
    const { error } = await (supabase.from("leads") as any)
      .update({ status: newStatus })
      .eq("id", leadId);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus as any } : l))
    );

    toast({ title: "Status updated", description: `Lead marked as ${newStatus}` });
  };

  // Calculate metrics
  const todayLeads = leads.filter((l) => {
    if (l.id === "demo") return false;
    const leadDate = new Date(l.created_at).toDateString();
    return leadDate === new Date().toDateString();
  }).length;

  const thisMonthLeads = leads.filter((l) => {
    if (l.id === "demo") return false;
    const leadMonth = new Date(l.created_at).toISOString().slice(0, 7);
    return leadMonth === new Date().toISOString().slice(0, 7);
  }).length;

  const isTrial = profile?.status === "trial";
  const isActive = profile?.status === "active";
  const isPaused = profile?.status === "paused";
  const isExpired = profile?.status === "expired" || profile?.plan_status === "expired";
  const plan = profile?.subscription_plan || "basic";

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 7;

  // Get trial banner text for days 5-7
  const getTrialBannerText = () => {
    if (currentTrialDay === 5) return { text: "⚠️ Trial ends in 2 days", color: "#eab308" };
    if (currentTrialDay === 6) return { text: "⚠️ Trial ends tomorrow", color: "#f97316" };
    if (currentTrialDay >= 7) return { text: "⚠️ Trial ended today", color: "#ef4444" };
    return null;
  };

  const trialBanner = isTrial ? getTrialBannerText() : null;

  const realLeadsCount = leads.filter((l) => l.id !== "demo").length;
  const hasDemoLead = leads.some((l) => l.id === "demo");

  const handleCopyLink = () => {
    const url = profile?.site_url || `https://${profile?.business_name?.toLowerCase().replace(/[^a-z0-9]/g, "")}.leadpe.online`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Share it in your WhatsApp groups" });
  };

  const handleSaveModal = async () => {
    if (!modalValue.trim() || !activeModal) return;
    setSaving(true);

    const fieldMap: Record<string, string> = {
      phone: "whatsapp_number",
      hours: "working_hours",
      prices: "prices",
      photos: "photos",
    };

    await (supabase.from("profiles") as any)
      .update({ [fieldMap[activeModal]]: modalValue })
      .eq("id", user?.id);

    const message = [
      `${profile?.business_name || "Business"} updated their ${activeModal}:`,
      modalValue,
      "",
      "LeadPe ⚡",
    ].join("%0A");

    window.open(`https://wa.me/919973383902?text=${message}`, "_blank", "noopener,noreferrer");

    toast({ title: "Saved! ✅", description: "Changes sent to you via WhatsApp" });
    setSaving(false);
    setActiveModal(null);
    setModalValue("");
    fetchData();
  };

  const getTip = () => {
    if (todayLeads === 0 && realLeadsCount > 0) {
      return "You got leads before but none today. Share your site link in WhatsApp groups to get more!";
    }
    if (stats.vsLastWeek < 0) {
      return "Your traffic is down this week. Try posting your site link on your Facebook page!";
    }
    return "Your site speed is 94/100. Excellent! Keep it up.";
  };

  const handleLanguageChange = async (newLanguage: Language) => {
    if (!user) return;
    
    // Update in Supabase
    await (supabase.from("profiles") as any)
      .update({ preferred_language: newLanguage })
      .eq("id", user.id);
    
    // Update local state
    setProfile(prev => prev ? { ...prev, preferred_language: newLanguage } : null);
    
    toast({
      title: "Language updated!",
      description: `WhatsApp messages will now be sent in ${languageLabels[newLanguage].label}`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="animate-spin w-8 h-8 border-2 border-[#00C853] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F5FFF7" }}>
      {/* Top Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#E0F2E9] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <LeadPeLogo theme="light" size="sm" />
          <div className="flex-1 text-center px-4">
            <span className="text-sm font-medium truncate block text-[#1A1A1A]">{profile?.business_name || "Your Business"}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-[#F0FFF4] transition-colors relative">
              <Bell size={18} className="text-[#666]" />
              {todayLeads > 0 && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#00C853]" />}
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-[#00C853] text-white">
              {user?.email?.[0].toUpperCase() || "U"}
            </div>
            <button onClick={signOut} className="text-xs text-[#666] hover:text-[#1A1A1A]">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-20">
        {/* Hero Metric */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
          <div className="text-6xl md:text-7xl font-extrabold font-display mb-2 text-[#00C853]">
            {todayLeads}
          </div>
          <div className="text-lg font-medium mb-1 text-[#1A1A1A]">New Leads Today 🔔</div>
          <div className="text-sm text-[#666]">{thisMonthLeads} total leads this month</div>

          {todayLeads === 0 && !hasDemoLead && (
            <div className="mt-4 p-4 rounded-xl border border-[#E0F2E9] bg-white">
              <p className="text-sm text-[#666]">
                Your site is live and working. First leads usually come within 7-14 days.
              </p>
            </div>
          )}
        </motion.div>

        {/* Build Status Tracker */}
        {buildRequest && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="rounded-2xl border border-[#E0F2E9] p-6 mb-6" 
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">{getBusinessIcon(buildRequest.business_type)}</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Website Build Status</h3>
                <p className="text-sm text-muted-foreground">
                  {buildRequest.business_name} • {buildRequest.plan_selected.toUpperCase()} Plan
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                buildRequest.status === "pending" ? "bg-yellow-500/20 text-yellow-500" :
                buildRequest.status === "building" ? "bg-blue-500/20 text-blue-500" :
                buildRequest.status === "review" ? "bg-purple-500/20 text-purple-500" :
                buildRequest.status === "deployed" ? "bg-green-500/20 text-green-500" :
                "bg-red-500/20 text-red-500"
              }`}>
                {buildRequest.status === "pending" ? "Pending Assignment" :
                 buildRequest.status === "building" ? "Building" :
                 buildRequest.status === "review" ? "In Review" :
                 buildRequest.status === "deployed" ? "Deployed" :
                 buildRequest.status}
              </div>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-4">
              {[
                { id: "pending", label: "Assigned", icon: User },
                { id: "building", label: "Building", icon: Wrench },
                { id: "review", label: "Review", icon: Code },
                { id: "deployed", label: "Live", icon: Globe }
              ].map((step, index) => {
                const isActive = buildRequest.status === step.id || 
                  (step.id === "deployed" && buildRequest.status === "deployed") ||
                  (step.id === "review" && (buildRequest.status === "review" || buildRequest.status === "deployed")) ||
                  (step.id === "building" && (buildRequest.status === "building" || buildRequest.status === "review" || buildRequest.status === "deployed")) ||
                  (step.id === "pending" && buildRequest.assigned_coder_id);
                
                const isCompleted = isActive && buildRequest.status !== step.id;
                
                return (
                  <div key={step.id} className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      isCompleted ? "bg-green-500 text-white" :
                      isActive ? "bg-blue-500 text-white" :
                      "bg-gray-700 text-gray-400"
                    }`}>
                      <step.icon size={16} />
                    </div>
                    <span className={`text-xs ${
                      isActive ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full overflow-hidden mb-4" style={{ backgroundColor: "#E5E7EB" }}>
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ 
                  backgroundColor: "#00C853",
                  width: buildRequest.status === "pending" && !buildRequest.assigned_coder_id ? "0%" :
                         buildRequest.status === "pending" && buildRequest.assigned_coder_id ? "25%" :
                         buildRequest.status === "building" ? "50%" :
                         buildRequest.status === "review" ? "75%" :
                         buildRequest.status === "deployed" ? "100%" : "0%"
                }}
              />
            </div>
            
            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">Builder:</span>
                <span className="font-medium">
                  {buildRequest.coder_name || "Assigning..."}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">Deadline:</span>
                <span className="font-medium">
                  {formatDeadline(buildRequest.deadline)}
                </span>
              </div>
              {buildRequest.github_url && (
                <div className="flex items-center gap-2">
                  <ExternalLink size={14} className="text-muted-foreground" />
                  <Button
                    onClick={() => window.open(buildRequest.github_url, "_blank")}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 rounded-lg border-border text-xs"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    View GitHub
                  </Button>
                </div>
              )}
            </div>
            
            {/* Status Messages */}
            <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: "#F8F9FA" }}>
              <p className="text-sm text-muted-foreground">
                {buildRequest.status === "pending" && !buildRequest.assigned_coder_id && 
                  "🔍 Finding the perfect builder for your website..."}
                {buildRequest.status === "pending" && buildRequest.assigned_coder_id && 
                  "✅ Builder assigned! Starting work on your website..."}
                {buildRequest.status === "building" && 
                  "🔨 Your website is being built. You'll receive updates here!"}
                {buildRequest.status === "review" && 
                  "👀 Website is ready and under review. Almost live!"}
                {buildRequest.status === "deployed" && 
                  "🎉 Your website is live! Check your leads section for customer inquiries."}
              </p>
            </div>
          </motion.div>
        )}

        {/* Trial Progress Bar */}
        {(profile?.status === "trial" || trialProgress.day > 1) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="rounded-2xl border border-border p-4 mb-6" 
            style={{ 
              backgroundColor: trialProgress.isEnding ? "rgba(234, 179, 8, 0.1)" : "#FFFFFF",
              borderColor: trialProgress.isEnding ? "#eab308" : "#E0F2E9" 
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">
                Free Trial — Day {trialProgress.day} of 7
              </span>
              <span className={`text-sm ${trialProgress.isEnding ? "text-yellow-500" : "text-muted-foreground"}`}>
                {trialProgress.daysRemaining} days remaining
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#E5E7EB" }}>
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ 
                  width: `${trialProgress.percentComplete}%`, 
                  backgroundColor: trialProgress.isEnding ? "#eab308" : "#00C853" 
                }} 
              />
            </div>
            
            {/* Day 6-7 Warning */}
            {trialProgress.isEnding && (
              <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: "rgba(234, 179, 8, 0.15)" }}>
                <p className="text-sm text-yellow-500 font-medium mb-2">
                  ⚠️ Trial ending soon
                </p>
                <Button 
                  className="w-full h-10 rounded-lg text-black font-medium" 
                  style={{ backgroundColor: "#00C853" }}
                >
                  Continue — ₹299/mo →
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Site Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border p-5 mb-6"
          style={{ backgroundColor: "#FFFFFF", borderColor: isActive ? "#00C853" : isPaused ? "#ef4444" : "#eab308" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isActive ? "#00C853" : isPaused ? "#ef4444" : "#eab308" }} />
            <span className="font-semibold">{isActive ? "● Live" : isPaused ? "⚠️ Paused" : "⏳ Building"}</span>
          </div>

          {isActive && (
            <>
              <p className="text-sm text-muted-foreground mb-3">Your site is live and appearing on Google.</p>
              <p className="text-sm mb-3" style={{ color: "#00E676" }}>
                {profile?.site_url || `${profile?.business_name?.toLowerCase().replace(/[^a-z0-9]/g, "")}.leadpe.online`}
              </p>
              <a
                href={`https://${profile?.site_url || `${profile?.business_name?.toLowerCase().replace(/[^a-z0-9]/g, "")}.leadpe.online`}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                style={{ color: "#00E676" }}
              >
                View My Site →
              </a>
            </>
          )}

          {isTrial && (
            <>
              <p className="text-sm text-muted-foreground mb-3">Our team is building your website. Ready in 48 hours.</p>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#E5E7EB" }}>
                <div className="h-full rounded-full" style={{ width: "60%", backgroundColor: "#eab308" }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">60% complete</p>
            </>
          )}

          {isPaused && (
            <>
              <p className="text-sm text-muted-foreground mb-3">Renew your plan to bring your site back online.</p>
              <Button className="w-full h-12 rounded-xl text-black font-semibold" style={{ backgroundColor: "#00E676" }}>
                Renew Now — ₹299 →
              </Button>
            </>
          )}
        </motion.div>

        {/* Weekly Report Card */}
        {weeklyReport && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.15 }}
            className="rounded-2xl border-t-2 border-x border-b border-border p-5 mb-6"
            style={{ backgroundColor: "#FFFFFF", borderTopColor: "#00C853" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold font-display">📊 This Week's Report</h2>
              <span className="text-xs text-muted-foreground">{getWeekRange(new Date(weeklyReport.weekStart))}</span>
            </div>
            
            {/* 2x2 Grid Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-xl border border-[#E0F2E9]" style={{ backgroundColor: "#F0FFF4" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">👁</span>
                  <span className="text-xs text-muted-foreground">Visitors</span>
                </div>
                <div className="text-2xl font-bold">{weeklyReport.visitors}</div>
              </div>
              
              <div className="p-3 rounded-xl border border-[#E0F2E9]" style={{ backgroundColor: "#F0FFF4" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📋</span>
                  <span className="text-xs text-muted-foreground">Inquiries</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: "#00E676" }}>{weeklyReport.leadsThisWeek}</div>
              </div>
              
              <div className="p-3 rounded-xl border border-[#E0F2E9]" style={{ backgroundColor: "#F0FFF4" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📈</span>
                  <span className="text-xs text-muted-foreground">vs Last Week</span>
                </div>
                <div className={`text-2xl font-bold ${weeklyReport.growth >= 0 ? "" : "text-red-500"}`}>
                  {weeklyReport.growth >= 0 ? "+" : ""}{weeklyReport.growth}%
                </div>
              </div>
              
              <div className="p-3 rounded-xl border border-[#E0F2E9]" style={{ backgroundColor: "#F0FFF4" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">⚡</span>
                  <span className="text-xs text-muted-foreground">Site Health</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: "#00E676" }}>{weeklyReport.siteHealth}/100</div>
              </div>
            </div>
            
            {/* Auto Tip */}
            <div className="p-4 rounded-xl border border-[#E0F2E9]" style={{ backgroundColor: "#F0FFF4" }}>
              <p className="text-sm">{weeklyReport.tip}</p>
            </div>
          </motion.div>
        )}

        {/* Past Reports Section */}
        {pastReports.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.16 }}
            className="rounded-2xl border border-border p-5 mb-6"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <button 
              onClick={() => setShowPastReports(!showPastReports)}
              className="flex items-center justify-between w-full"
            >
              <h2 className="text-lg font-bold font-display">📋 Past Reports</h2>
              {showPastReports ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {showPastReports && (
              <div className="mt-4 space-y-3">
                {pastReports.map((report, index) => (
                  <div 
                    key={report.id || index}
                    className="p-4 rounded-xl border border-border"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Week of {new Date(report.week_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      <span className="text-xs text-muted-foreground">{report.leads_count} inquiries</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>👁 {report.visitors} visitors</span>
                      <span>📈 {report.growth_percent >= 0 ? "+" : ""}{report.growth_percent}%</span>
                      <span>⚡ {report.site_health}/100 health</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Trial Banner for Day 5-7 */}
        {trialBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-16 z-40 mb-4"
          >
            <div
              className="rounded-xl p-4 flex items-center justify-between"
              style={{ backgroundColor: "#fef3c7", border: "1px solid #fbbf24" }}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: trialBanner.color }}>{trialBanner.text}</span>
              </div>
              <Button
                onClick={() => setShowRenewModal(true)}
                className="h-9 px-4 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: "#00C853" }}
              >
                Renew Now →
              </Button>
            </div>
          </motion.div>
        )}

        {/* Lead Table / Cards */}
        <section className="mb-6 relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-display">Your Customer Inquiries</h2>
            {isLocked && realLeadsCount > 0 && (
              <span className="text-sm text-red-500 font-medium">
                {realLeadsCount} customers waiting
              </span>
            )}
          </div>

          {isLocked && realLeadsCount > 0 ? (
            // LOCKED STATE - Lead Lock Overlay + Blurred Table
            <>
              {/* Lock Overlay Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border-2 p-6 text-center mb-6 relative z-10"
                style={{ borderColor: "#ef4444", backgroundColor: "#fef2f2" }}
              >
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                  <Lock size={32} style={{ color: "#ef4444" }} />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-[#1A1A1A]">
                  {realLeadsCount} Customers Are Waiting
                </h3>
                <p className="text-sm text-[#666666] mb-4">
                  They tried to contact you.<br />
                  Renew your plan to see their name and number.
                </p>
                <p className="text-xs text-red-500 mb-4 font-medium">
                  You are LOSING customers every day!
                </p>
                <Button
                  onClick={() => setShowRenewModal(true)}
                  className="w-full h-14 rounded-xl text-white font-semibold text-lg animate-pulse"
                  style={{ backgroundColor: "#00C853" }}
                >
                  See Their Details — ₹299/mo →
                </Button>
              </motion.div>

              {/* Blurred Lead Table Preview */}
              <div className="hidden md:block rounded-2xl border border-[#E0F2E9] overflow-hidden opacity-50" style={{ backgroundColor: "#FFFFFF", filter: "blur(2px)" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: "#F0FFF4" }}>
                      <th className="text-left p-4 text-sm font-medium">Name</th>
                      <th className="text-left p-4 text-sm font-medium">Interest</th>
                      <th className="text-left p-4 text-sm font-medium">Number</th>
                      <th className="text-left p-4 text-sm font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-4 text-sm" style={{ filter: "blur(6px)" }}>███████</td>
                        <td className="p-4 text-sm" style={{ filter: "blur(6px)" }}>████████</td>
                        <td className="p-4 text-sm" style={{ filter: "blur(6px)" }}>98XXXXXXX</td>
                        <td className="p-4 text-sm text-muted-foreground">2 hours ago</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Blurred Cards */}
              <div className="md:hidden space-y-3 opacity-50">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-[#E0F2E9] p-4" style={{ backgroundColor: "#FFFFFF", filter: "blur(2px)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold" style={{ filter: "blur(6px)" }}>███████</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3" style={{ filter: "blur(6px)" }}>████████</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Phone size={14} style={{ color: "#00E676" }} />
                      <span className="text-sm" style={{ filter: "blur(6px)" }}>98XXXXXXX</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : leads.length === 0 ? (
            // Empty State
            <div className="rounded-2xl border border-[#E0F2E9] p-8 text-center" style={{ backgroundColor: "#FFFFFF" }}>
              <div className="text-4xl mb-4">📭</div>
              <p className="font-medium mb-2">No inquiries yet.</p>
              <p className="text-sm text-muted-foreground mb-4">Your site is working hard. First leads usually arrive within 7 days of going live.</p>
              <div className="p-4 rounded-xl border border-dashed border-[#E0F2E9] mb-4" style={{ backgroundColor: "#F0FFF4" }}>
                <p className="text-sm text-muted-foreground mb-3">💡 Tip: Share your site link in your WhatsApp groups to get leads faster!</p>
                <Button onClick={handleCopyLink} className="h-10 rounded-lg border border-[#E0F2E9]" style={{ backgroundColor: "#FFFFFF" }}>
                  <Copy size={16} className="mr-2" /> Copy Site Link
                </Button>
              </div>
            </div>
          ) : (
            // ACTIVE STATE - Full Lead Display
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-2xl border border-[#E0F2E9] overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: "#F0FFF4" }}>
                      <th className="text-left p-4 text-sm font-medium">Name</th>
                      <th className="text-left p-4 text-sm font-medium">Interest</th>
                      <th className="text-left p-4 text-sm font-medium">Number</th>
                      <th className="text-left p-4 text-sm font-medium">Time</th>
                      <th className="text-left p-4 text-sm font-medium">Status</th>
                      <th className="text-left p-4 text-sm font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className={`border-t border-border ${lead.id === "demo" ? "opacity-50" : ""}`}>
                        <td className="p-4 text-sm font-medium">{lead.customer_name}</td>
                        <td className="p-4 text-sm text-muted-foreground">{lead.interest}</td>
                        <td className="p-4 text-sm" style={{ color: "#00E676" }}>{lead.customer_phone}</td>
                        <td className="p-4 text-sm text-muted-foreground">{timeAgo(lead.created_at)}</td>
                        <td className="p-4">
                          {lead.id === "demo" ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "rgba(107, 114, 128, 0.2)", color: "#6b7280" }}>
                              Demo
                            </span>
                          ) : (
                            <select
                              value={lead.status}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                              className="text-xs px-2 py-1 rounded-lg border border-border outline-none"
                              style={{ backgroundColor: "#FFFFFF" }}
                            >
                              {statusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="p-4">
                          {lead.id === "demo" ? (
                            <span className="text-xs text-muted-foreground">Not Real</span>
                          ) : (
                            <div className="flex gap-2">
                              <a
                                href={`tel:${lead.customer_phone}`}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-black"
                                style={{ backgroundColor: "#00C853" }}
                              >
                                Call Now
                              </a>
                              <a
                                href={`https://wa.me/91${lead.customer_phone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg text-xs border border-border"
                              >
                                WhatsApp
                              </a>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {leads.map((lead) => (
                  <div key={lead.id} className={`rounded-xl border border-[#E0F2E9] p-4 ${lead.id === "demo" ? "opacity-50" : ""}`} style={{ backgroundColor: "#FFFFFF" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{lead.customer_name}</span>
                      {lead.id === "demo" ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "rgba(107, 114, 128, 0.2)", color: "#6b7280" }}>
                          Demo — Not Real
                        </span>
                      ) : (
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className="text-xs px-2 py-1 rounded-lg border border-border outline-none"
                          style={{ backgroundColor: "#FFFFFF" }}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{lead.interest}</p>
                    {lead.id !== "demo" && (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <Phone size={14} style={{ color: "#00E676" }} />
                          <a href={`tel:${lead.customer_phone}`} className="text-sm" style={{ color: "#00E676" }}>
                            {lead.customer_phone}
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{timeAgo(lead.created_at)}</p>
                        <div className="flex gap-2">
                          <a
                            href={`tel:${lead.customer_phone}`}
                            className="flex-1 py-2 rounded-lg text-xs font-medium text-black text-center"
                            style={{ backgroundColor: "#00C853" }}
                          >
                            Call Now
                          </a>
                          <a
                            href={`https://wa.me/91${lead.customer_phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 rounded-lg text-xs border border-border text-center flex items-center justify-center gap-1"
                          >
                            <MessageCircle size={12} /> WhatsApp
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Weekly Report */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border p-5 mb-6" style={{ backgroundColor: "#101810" }}>
          <h2 className="text-lg font-bold font-display mb-4">This Week's Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl mb-1">👁</div>
              <div className="text-xl font-bold">{stats.visitors}</div>
              <div className="text-xs text-muted-foreground">Visitors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">📋</div>
              <div className="text-xl font-bold">{stats.inquiries}</div>
              <div className="text-xs text-muted-foreground">Inquiries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">📈</div>
              <div className={`text-xl font-bold ${stats.vsLastWeek >= 0 ? "" : "text-red-500"}`}>{stats.vsLastWeek >= 0 ? "+" : ""}{stats.vsLastWeek}%</div>
              <div className="text-xs text-muted-foreground">vs Last Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-xl font-bold" style={{ color: "#00E676" }}>{stats.speedScore}</div>
              <div className="text-xs text-muted-foreground">Site Speed</div>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-border" style={{ backgroundColor: "#080C09" }}>
            <p className="text-sm">💡 <span className="font-medium">Tip of the week:</span> {getTip()}</p>
          </div>
        </motion.div>

        {/* Plan & Wallet */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border p-5 mb-6" style={{ backgroundColor: "#101810" }}>
          <h2 className="text-lg font-bold font-display mb-4">Your Plan</h2>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: "rgba(0, 230, 118, 0.1)", color: "#00E676" }}>
              {planNames[plan] || "Basic"}
            </span>
            {isTrial && <span className="text-sm text-muted-foreground">Trial ends in {trialDaysLeft} days</span>}
          </div>
          {plan === "basic" && isActive && (
            <div className="p-4 rounded-xl border border-dashed border-border mb-4" style={{ backgroundColor: "#080C09" }}>
              <p className="text-sm text-muted-foreground mb-3">More customers are waiting. Growth plan gives you unlimited leads and WhatsApp notifications.</p>
              <Button 
                onClick={() => setShowRenewModal(true)}
                className="h-10 rounded-lg text-black font-medium" 
                style={{ backgroundColor: "#00E676" }}
              >
                See Their Details →
              </Button>
            </div>
          )}
        </motion.div>

        {/* Google Presence Status - Simple, No Actions */}
        {profile && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.35 }} 
            className="rounded-2xl border border-border p-5 mb-6" 
            style={{ backgroundColor: "#101810" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🗺️</span>
              <h2 className="text-lg font-bold font-display">Your Google Presence</h2>
            </div>
            
            {/* Three Simple Status Items */}
            <div className="space-y-3">
              {/* Website Status */}
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: "#080C09" }}>
                <div className="flex items-center gap-3">
                  <span className="text-green-500">✅</span>
                  <span className="text-sm font-medium">Website</span>
                </div>
                <span className="text-sm" style={{ color: "#00E676" }}>Live</span>
              </div>

              {/* Google Search Status */}
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: "#080C09" }}>
                <div className="flex items-center gap-3">
                  <span className="text-yellow-500">⏳</span>
                  <span className="text-sm font-medium">Google Search</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Coming soon</span>
                  <p className="text-xs text-muted-foreground">Usually 2-4 weeks</p>
                </div>
              </div>

              {/* Google Maps Status */}
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: "#080C09" }}>
                <div className="flex items-center gap-3">
                  <span className="text-yellow-500">⏳</span>
                  <span className="text-sm font-medium">Google Maps</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Our team is setting this up</span>
                </div>
              </div>
            </div>

            {/* Reassuring Message */}
            <p className="text-xs text-muted-foreground mt-4 text-center">
              We handle everything. You just receive customers.
            </p>
          </motion.div>
        )}

        {/* Google Maps Setup Card */}
        {profile && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }} 
            className="rounded-2xl border border-border p-5 mb-6" 
            style={{ backgroundColor: "#101810" }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(0, 230, 118, 0.1)" }}>
                <span className="text-2xl">🗺️</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Google Maps Setup</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Our team is setting up your Google Maps listing. You will appear on Maps within 3-5 days.
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#eab308" }} />
                  <span className="text-sm text-muted-foreground">In Progress ⏳</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-6">
          <h2 className="text-lg font-bold font-display mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "phone", icon: Phone, label: "Update Phone" },
              { id: "hours", icon: Clock, label: "Working Hours" },
              { id: "prices", icon: Wallet, label: "Your Prices" },
              { id: "photos", icon: Eye, label: "Add Photos" },
            ].map((action) => (
              <button
                key={action.id}
                onClick={() => setActiveModal(action.id)}
                className="p-4 rounded-xl border border-border text-left hover:border-[#00E676]/30 transition-colors"
                style={{ backgroundColor: "#101810" }}
              >
                <action.icon size={20} className="mb-2" style={{ color: "#00E676" }} />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Language Preference */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.45 }} 
          className="rounded-2xl border border-border p-5 mb-6" 
          style={{ backgroundColor: "#101810" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0, 230, 118, 0.1)" }}>
                <Globe size={20} style={{ color: "#00E676" }} />
              </div>
              <div>
                <h3 className="font-medium">Change Language</h3>
                <p className="text-xs text-muted-foreground">भाषा बदलें</p>
              </div>
            </div>
            <button
              onClick={() => setShowLanguageSelector(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:border-[#00E676] transition-colors"
              style={{ backgroundColor: "#080C09" }}
            >
              {languageLabels[profile?.preferred_language || "hinglish"].flag} {languageLabels[profile?.preferred_language || "hinglish"].label}
            </button>
          </div>
        </motion.div>

        {/* Support */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-3">Need Help? We're Here.</p>
          <a
            href="https://wa.me/919973383902?text=Hi,%20I%20need%20help%20with%20my%20LeadPe%20account."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-black font-medium"
            style={{ backgroundColor: "#00E676" }}
          >
            <MessageCircle size={18} /> Chat with LeadPe Support →
          </a>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-border p-6"
              style={{ backgroundColor: "#101810" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  {activeModal === "phone" && "Update Phone Number"}
                  {activeModal === "hours" && "Update Working Hours"}
                  {activeModal === "prices" && "Update Your Prices"}
                  {activeModal === "photos" && "Add Photos"}
                </h3>
                <button onClick={() => { setActiveModal(null); setModalValue(""); }}>
                  <AlertCircle size={20} className="text-muted-foreground" />
                </button>
              </div>

              {activeModal === "photos" ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Send your photos via WhatsApp to 919973383902. We'll add them to your site within 24 hours.
                  </p>
                  <a
                    href="https://wa.me/919973383902?text=Hi,%20I%20want%20to%20add%20photos%20to%20my%20site"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-12 rounded-xl flex items-center justify-center text-black font-medium"
                    style={{ backgroundColor: "#00C853" }}
                  >
                    <MessageCircle size={18} className="mr-2" /> Send Photos on WhatsApp
                  </a>
                </>
              ) : (
                <>
                  <Input
                    value={modalValue}
                    onChange={(e) => setModalValue(e.target.value)}
                    className="h-12 rounded-xl border-border mb-4"
                    style={{ backgroundColor: "#FFFFFF" }}
                    placeholder={
                      activeModal === "phone" ? "Enter new phone number" :
                      activeModal === "hours" ? "e.g. 9 AM - 7 PM" :
                      "e.g. ₹500 per session"
                    }
                  />
                  <Button
                    onClick={handleSaveModal}
                    disabled={saving || !modalValue.trim()}
                    className="w-full h-12 rounded-xl text-black font-medium"
                    style={{ backgroundColor: "#00C853" }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Renew Modal - Lead Lock Mechanism */}
      <AnimatePresence>
        {showRenewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-border p-6"
              style={{ backgroundColor: "#101810" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Your Customers Are Waiting</h3>
                <button 
                  onClick={() => setShowRenewModal(false)}
                  className="p-1 rounded-full hover:bg-white/10"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              {/* Week Results */}
              <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "#080C09" }}>
                <p className="text-sm text-muted-foreground mb-2">This week:</p>
                <p className="text-lg font-bold mb-1">
                  {weeklyReport?.leadsThisWeek || realLeadsCount || 0} people tried to contact you
                </p>
                <p className="text-xs text-red-500">
                  You are LOSING them without their contact details!
                </p>
              </div>

              {/* Price Card */}
              <div 
                className="rounded-xl p-4 mb-4 text-center border-2"
                style={{ backgroundColor: "#00C853", borderColor: "#00C853" }}
              >
                <div className="text-3xl font-bold text-black mb-1">₹299</div>
                <div className="text-sm text-black/80 mb-2">per month</div>
                <p className="text-xs text-black/70">
                  Less than one cup of chai per customer per month
                </p>
              </div>

              {/* Payment Instructions */}
              <div className="rounded-xl p-4 mb-4 border border-border" style={{ backgroundColor: "#080C09" }}>
                <p className="text-sm font-medium mb-3">Pay via GPay/PhonePe:</p>
                <div 
                  className="text-2xl font-bold text-center mb-3"
                  style={{ color: "#00E676" }}
                >
                  9973383902
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>1. Send screenshot after payment</p>
                  <p>2. Activated in 5 minutes ✅</p>
                </div>
              </div>

              {/* WhatsApp Button */}
              <a
                href={`https://wa.me/919973383902?text=Hi%20LeadPe!%20I%20have%20paid%20₹299%20for%20Growth%20Plan.%0A%0AHere%20is%20my%20payment%20screenshot.%0A%0ABusiness:%20${encodeURIComponent(profile?.business_name || "My Business")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-14 rounded-xl flex items-center justify-center text-black font-semibold"
                style={{ backgroundColor: "#00E676" }}
              >
                <MessageCircle size={20} className="mr-2" />
                Send Payment Screenshot →
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Selector Modal */}
      <LanguageSelector
        isOpen={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        onSelect={handleLanguageChange}
        currentLanguage={profile?.preferred_language || "hinglish"}
      />
    </div>
  );
}
