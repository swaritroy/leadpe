import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, LogOut, Code, Clock, DollarSign,
  User, CheckCircle, Rocket, Wrench, Eye, MessageCircle, Wallet, Calendar, ShieldCheck, Home,
  Star, Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import LeadPeLogo from "@/components/LeadPeLogo";
import { getBusinessIcon, getBuildingFee, formatDeadline } from "@/lib/clientBrief";
import { checkWebsiteQuality, QualityReport } from "@/lib/qualityChecker";
import { deployWebsite } from "@/lib/deployService";
import { getPackageById } from "@/lib/packages";
import { updateCoderEarnings } from "@/lib/earningsCalc";
import BriefModal from "@/components/BriefModal";
import { copyToClipboard } from "@/lib/clientBrief";

interface BuildRequest {
  id: string;
  business_id: string;
  business_name: string;
  business_type: string;
  city: string;
  owner_name: string;
  owner_whatsapp: string;
  plan_selected: string;
  preferred_language?: string;
  status: string;
  assigned_coder_id: string;
  created_at: string;
  deadline: string;
  github_url: string;
  submitted_at: string;
  package_id?: string;
  package_price?: number;
  coder_earning?: number;
}

interface Earning {
  id: string;
  amount: number;
  type: string;
  month: string;
  paid: boolean;
}


const LiveTimer = ({ deadline }: { deadline: string }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [color, setColor] = useState("#00C853");
  useEffect(() => {
    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Time Up"); setColor("#EF4444"); return; }
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} left ⏰`);
      setColor(hrs < 6 ? "#EF4444" : hrs < 24 ? "#F57F17" : "#00C853");
    };
    tick();
    const inv = setInterval(tick, 1000);
    return () => clearInterval(inv);
  }, [deadline]);
  return <span style={{ color, fontWeight: 700 }}>{timeLeft}</span>;
};

export default function DevDashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"home" | "builds" | "earnings" | "profile">("home");
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  const [buildRequests, setBuildRequests] = useState<BuildRequest[]>([]);
  const [activeBuilds, setActiveBuilds] = useState<BuildRequest[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BuildRequest | null>(null);
  const [githubSubmitUrl, setGithubSubmitUrl] = useState("");
  const [submittingGithub, setSubmittingGithub] = useState(false);
  const [qualityChecking, setQualityChecking] = useState(false);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; type: string }>>([]);

  // Payout 
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutUpi, setPayoutUpi] = useState("");
  const [requestingPayout, setRequestingPayout] = useState(false);

  // Profile Edit
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [editingNumber, setEditingNumber] = useState(false);
  const [editNumberValue, setEditNumberValue] = useState("");
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  
  const [completedBuilds, setCompletedBuilds] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalCompleted, setTotalCompleted] = useState<number>(0);


  useEffect(() => {
    fetchData();

    if (!user) return;

    const channel = supabase.channel('build_requests_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'build_requests' },
        (payload) => {
          const newRow = payload.new as BuildRequest;
          if (newRow.status === "building" && newRow.assigned_coder_id) {
            setBuildRequests(prev => prev.filter(r => r.id !== newRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: profileData } = await supabase.from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
      
    setProfile(profileData);

    if (profileData && !profileData.onboarding_complete) {
      navigate("/dev/onboarding");
      return;
    }

    const { data: earnData } = await supabase.from("earnings")
      .select("*")
      .eq("vibe_coder_id", user.id);
    setEarnings(earnData || []);
    
    const { data: pendingData } = await supabase.from("build_requests")
      .select("*")
      .eq("status", "pending")
      .is("assigned_coder_id", null)
      .order("created_at", { ascending: false });
    setBuildRequests(pendingData || []);
    
    
    const { data: compData } = await supabase.from("build_requests")
      .select(`*, ratings(rating)`)
      .eq("assigned_coder_id", user.id)
      .eq("status", "live")
      .order("deployed_at", { ascending: false });
      
    if (compData) {
      setCompletedBuilds(compData);
      setTotalCompleted(compData.length);
      let sum = 0, count = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      compData.forEach((b: any) => {
        if (b.ratings && b.ratings.length > 0) {
          sum += b.ratings[0].rating;
          count++;
        }
      });
      setAvgRating(count > 0 ? Number((sum / count).toFixed(1)) : 0);
    }

    const { data: activeData } = await supabase.from("build_requests")
      .select("*")
      .eq("assigned_coder_id", user.id)
      .in("status", ["building", "review", "demo_ready", "revision"])
      .order("created_at", { ascending: false });
    setActiveBuilds((activeData as BuildRequest[]) || []);

    setLoading(false);
  };

  const totalEarned = earnings.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthEarned = earnings
    .filter((e) => e.month === new Date().toISOString().slice(0, 7))
    .reduce((sum, e) => sum + e.amount, 0);
    
  const buildingFees = earnings
    .filter((e) => e.type === "building")
    .reduce((s, e) => s + e.amount, 0);
  const passiveTotal = earnings
    .filter((e) => e.type === "passive")
    .reduce((s, e) => s + e.amount, 0);

  
    const hasRevisionAlert = activeBuilds.some(b => (b as any).change_requests && (b as any).change_requests.some((cr: any) => cr.status === 'pending'));

  const eligiblePayout = earnings.filter(e => !e.paid && e.type !== "payout_request").reduce((sum, e) => sum + (e.amount || 0), 0);

  // Realtime earnings listener inside useEffect (actually can just rely on basic fetch for now, but realtime added)
  useEffect(() => {
    if (!user) return;
    const earnSub = supabase.channel('earnings_tab')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'earnings', filter: `vibe_coder_id=eq.${user.id}` }, 
      () => fetchData() ).subscribe();
    return () => { supabase.removeChannel(earnSub); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRequestPayout = async () => {
    if (!user) return;
    setRequestingPayout(true);
    await supabase.from("profiles").update({ upi_id: payoutUpi }).eq("user_id", user.id);
    await supabase.from("earnings").insert({
      vibe_coder_id: user.id,
      amount: eligiblePayout,
      type: "payout_request",
      month: new Date().toISOString().slice(0, 7),
      paid: false
    });
    toast({ title: "Payout Requested", description: `Requested ₹${eligiblePayout}` });
    setRequestingPayout(false);
    setShowPayoutModal(false);
    fetchData();
  };

  const nameChangesLeft = 2 - (profile?.name_changes_this_month || 0);
  const numberChangesLeft = 2 - (profile?.number_changes_this_month || 0);

  const handleUpdateProfile = async (field: "name" | "number") => {
    if (field === "name" && nameChangesLeft <= 0) return toast({ title: "Limit reached", description: "Monthly limit reached. Try again next month.", variant: "destructive" });
    if (field === "number" && numberChangesLeft <= 0) return toast({ title: "Limit reached", description: "Monthly limit reached. Try again next month.", variant: "destructive" });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {};
    if (field === "name") {
      updates.full_name = editNameValue;
      updates.name_changes_this_month = (profile?.name_changes_this_month || 0) + 1;
    } else {
      updates.whatsapp_number = editNumberValue;
      updates.number_changes_this_month = (profile?.number_changes_this_month || 0) + 1;
    }
    
    await supabase.from("profiles").update(updates).eq("user_id", user!.id);
    toast({ title: "Profile updated" });
    if (field === "name") setEditingName(false);
    else setEditingNumber(false);
    fetchData();
  };

  const handleAcceptRequest = async (request: BuildRequest) => {
    if (!user || acceptingId) return;

    // Max 3 active builds check
    const activeBuildCount = activeBuilds.filter(b => 
      ["building", "demo_ready", "revision"].includes(b.status)
    ).length;
    if (activeBuildCount >= 3) {
      toast({
        title: "Limit reached",
        description: "You have 3 active builds. Complete one before accepting more.",
        variant: "destructive"
      });
      return;
    }

    setAcceptingId(request.id);
    try {
      const { data, error } = await (supabase as any).from("build_requests")
        .update({
          status: "building",
          assigned_coder_id: user.id,
          assigned_coder_name: profile?.full_name || "Unknown",
        })
        .eq("id", request.id)
        .is("assigned_coder_id", null)
        .select();
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast({
          title: "Already taken",
          description: "Another builder accepted this request.",
          variant: "destructive"
        });
        setBuildRequests(prev => prev.filter(r => r.id !== request.id));
        setAcceptingId(null);
        return;
      }
      
      // Success
      setBuildRequests(prev => prev.filter(r => r.id !== request.id));
      setActiveBuilds(prev => [...prev, { ...request, status: "building", assigned_coder_id: user.id }]);
      
      toast({
        title: "✅ Request Accepted!",
        description: "Open brief and start building.",
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not accept. Try again.",
        variant: "destructive"
      });
      fetchData();
    } finally {
      setAcceptingId(null);
    }
  };
  
  const handleViewBrief = (request: BuildRequest) => {
    setSelectedRequest(request);
    setShowBriefModal(true);
  };

  const handleSubmitGithub = async () => {
    if (!selectedRequest || !githubSubmitUrl.trim()) return;
    if (!githubSubmitUrl.includes("github.com")) {
      toast({ title: "Invalid URL", description: "Must be a valid GitHub URL", variant: "destructive" });
      return;
    }
    
    setSubmittingGithub(true);
    setQualityChecking(true);
    
    try {
      toast({ title: "🔍 Running quality check...", description: "Analyzing code" });
      const report = await checkWebsiteQuality(githubSubmitUrl, {
        name: selectedRequest.business_name,
        type: selectedRequest.business_type,
        city: selectedRequest.city,
      });
      
      setQualityReport(report);
      setQualityChecking(false);
      
      await supabase.from("quality_reports").insert({
        build_request_id: selectedRequest.id,
        score: report.score,
        passed: report.passed,
        checks: report.checks,
        issues: report.issues,
        fixes: report.fixes,
        ai_suggestions: report.aiSuggestions,
      });
      
      if (!report.passed) {
        toast({
          title: `⚠️ Quality score: ${report.score}/100`,
          description: "Fix the issues and resubmit. Score must be ≥ 70.",
          variant: "destructive"
        });
        setSubmittingGithub(false);
        return;
      }
      
      toast({ title: "✅ Quality passed!", description: `Score: ${report.score}/100 — Deploying...` });
      
      const { error } = await supabase.from("build_requests")
        .update({
          status: "review",
          github_url: githubSubmitUrl,
          submitted_at: new Date().toISOString()
        })
        .eq("id", selectedRequest.id);
      if (error) throw error;
      
      const deployResult = await deployWebsite({
        id: selectedRequest.id,
        businessName: selectedRequest.business_name,
        businessType: selectedRequest.business_type,
        city: selectedRequest.city,
        githubUrl: githubSubmitUrl,
        trialCode: "",
      });
      
      if (deployResult.success && deployResult.deployUrl) {
        await supabase.from("build_requests")
          .update({
            status: "demo_ready",
            deploy_url: deployResult.deployUrl,
            deployed_at: new Date().toISOString()
          })
          .eq("id", selectedRequest.id);
        
        // Update business profile so dashboard shows demo_ready state
        if (selectedRequest.business_id) {
          await supabase.from("profiles")
            .update({ website_status: "demo_ready" } as any)
            .eq("user_id", selectedRequest.business_id);
        }
        
        toast({
          title: "🎨 Demo Deployed!",
          description: `Business will review at ${deployResult.deployUrl}`
        });
      }
      
      setGithubSubmitUrl("");
      setShowBriefModal(false);
      fetchData();
      
    } catch (error) {
      toast({ title: "Error", description: "Submission failed", variant: "destructive" });
    } finally {
      setSubmittingGithub(false);
      setQualityChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="animate-spin w-8 h-8 border-2 border-[#00C853] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: "#F5FFF7", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Top Bar */}
      <nav className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-[#E0F2E9] shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LeadPeLogo theme="light" size="sm" />
            <span className="font-bold text-lg text-[#00C853]" style={{ fontFamily: "Syne, sans-serif" }}>Studio</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-[#F0FFF4] transition-colors relative"
              onClick={() => {
                setShowNotifications(!showNotifications);
                // Build notifications from build requests and earnings
                const notifs: Array<{ id: string; text: string; time: string; type: string }> = [];
                buildRequests.slice(0, 3).forEach(r => notifs.push({ id: r.id, text: `New build request: ${r.business_name}`, time: r.created_at, type: "request" }));
                activeBuilds.forEach(b => {
                  if ((b as any).status === "revision_requested") notifs.push({ id: b.id, text: `Client requested changes: ${b.business_name}`, time: b.created_at, type: "revision" });
                });
                earnings.filter(e => e.type === "building_fee").slice(0, 3).forEach(e => notifs.push({ id: e.id, text: `Payment received — ₹${e.amount} earned`, time: "", type: "payment" }));
                if (notifs.length === 0) notifs.push({ id: "none", text: "No new notifications", time: "", type: "empty" });
                setNotifications(notifs.slice(0, 10));
              }}>
              <Bell size={18} className="text-[#666]" />
              {buildRequests.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00C853]" />}
            </button>
            {showNotifications && (
              <div className="absolute right-12 top-12 w-72 bg-white rounded-xl shadow-lg border z-50 overflow-hidden" style={{ borderColor: "#E0E0E0" }}>
                <div className="px-4 py-3 border-b font-bold text-sm" style={{ borderColor: "#F0F0F0", color: "#1A1A1A" }}>Notifications</div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-[#F0FFF4] transition-colors"
                      style={{ borderColor: "#F5F5F5" }}
                      onClick={() => {
                        setShowNotifications(false);
                        if (n.type === "request") setActiveTab("home");
                        else if (n.type === "revision") setActiveTab("builds");
                        else if (n.type === "payment") setActiveTab("earnings");
                      }}>
                      <p className="text-sm" style={{ color: "#1A1A1A" }}>
                        {n.type === "request" && "🔔 "}{n.type === "revision" && "🔄 "}{n.type === "payment" && "💰 "}{n.type === "empty" && "📭 "}
                        {n.text}
                      </p>
                      {n.time && <p className="text-xs mt-1" style={{ color: "#999" }}>{new Date(n.time).toLocaleDateString()}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-[#00C853] text-white">
              {user?.email?.[0].toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 pt-6 pb-24 max-w-5xl">
        <AnimatePresence mode="wait">
          
          {/* HOME TAB */}
          {activeTab === "home" && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <h2 className="text-2xl font-bold mb-4 text-[#1A1A1A]" style={{ fontFamily: "Syne, sans-serif" }}>Home</h2>
              
              <div className="mb-6 rounded-xl bg-white p-5 border border-[#E0F2E9] shadow-sm flex items-start gap-4">
                 <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                   <Bell size={20} className="text-[#00C853]" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-[#1A1A1A]" style={{ fontFamily: "Syne, sans-serif" }}>Notifications</h3>
                   <p className="text-sm text-[#666] mt-1">You have {buildRequests.length} build requests waiting for you!</p>
                 </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: "Syne, sans-serif" }}>Build Requests 🏗️</h3>
                <span className="text-sm text-[#666]">{buildRequests.length} waiting</span>
              </div>
              
              {buildRequests.length === 0 ? (
                <div className="rounded-2xl border border-[#E0F2E9] p-8 text-center bg-white shadow-sm">
                  <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center bg-green-50">
                    <Wrench size={20} className="text-[#00C853]" />
                  </div>
                  <p className="text-[#666] font-medium">No pending requests right now.</p>
                  <p className="text-sm text-[#999] mt-1">Check back soon!</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buildRequests.map((request) => (
                    <div key={request.id} className="rounded-xl border border-[#E0F2E9] p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-2xl">{getBusinessIcon(request.business_type)}</div>
                        <div>
                          <h4 className="font-bold text-[#1A1A1A]" style={{ fontFamily: "Syne, sans-serif" }}>{request.business_name}</h4>
                          <p className="text-xs text-[#666]">{request.business_type} · {request.city}</p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#666]">You earn:</span>
                          <span className="font-bold text-[#00C853]">₹{(request.coder_earning || getBuildingFee(request.plan_selected)).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#666]">Deadline:</span>
                          <LiveTimer deadline={request.deadline} />
                        </div>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <Button variant="outline" className="flex-1 font-semibold text-[#00C853] border-2 border-[#00C853]" onClick={() => handleViewBrief(request)}>
                          Details →
                        </Button>
                        <Button onClick={() => handleAcceptRequest(request)} disabled={acceptingId === request.id} className="flex-1 font-semibold text-white" style={{ backgroundColor: "#00C853" }}>
                          {acceptingId === request.id ? "Accepting..." : "Accept ✓"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* BUILDS TAB */}
          {activeTab === "builds" && (
            <motion.div key="builds" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <h2 className="text-2xl font-bold mb-4 text-[#1A1A1A]" style={{ fontFamily: "Syne, sans-serif" }}>Active Builds</h2>
              
              {activeBuilds.length === 0 ? (
                <div className="rounded-2xl border border-[#E0F2E9] p-8 text-center bg-white shadow-sm">
                  <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center bg-green-50">
                    <Code size={20} className="text-[#00C853]" />
                  </div>
                  <p className="text-[#666] font-medium">You don't have any active builds.</p>
                  <p className="text-sm text-[#999] mt-1">Go to Home to accept a new request.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
                  {activeBuilds.map((request) => (
                    <div key={request.id} className="rounded-xl border border-[#E0F2E9] p-5 bg-white shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{getBusinessIcon(request.business_type)}</div>
                            <div>
                              <h4 className="font-bold text-[#1A1A1A]" style={{ fontFamily: "Syne, sans-serif" }}>{request.business_name}</h4>
                              <p className="text-xs text-[#666]">{request.package_id ? getPackageById(request.package_id).badge : request.plan_selected}</p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-green-50 text-[#00C853] border border-green-200">
                            ACCEPTED ✓
                          </span>
                        </div>
                        
                        {(request as any).change_requests && (request as any).change_requests.filter((cr: any) => cr.status === 'pending').map((cr: any) => (
                           <div key={cr.id} style={{ backgroundColor: "#FEF2F2", color: "#EF4444", padding: "12px", borderRadius: "12px", marginBottom: "12px", border: "1px solid #FECACA" }}>
                              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>🚨 Client requested changes</div>
                              <div style={{ fontSize: 13, color: "#991B1B" }}>"{cr.revision_text}"</div>
                           </div>
                        ))}
                        
                        <div className="flex items-center text-sm mb-4 gap-2 bg-gray-50 p-2 rounded justify-center">
                          <Clock size={14} className="text-[#666]" />
                          <LiveTimer deadline={request.deadline} />
                        </div>
                        <div className="flex justify-between items-center text-sm mb-4 px-2">
                           <span className="font-bold text-[#1A1A1A]">This build =</span>
                           <span className="font-bold text-[#00C853]">₹{(request.coder_earning || getBuildingFee(request.plan_selected)).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-auto">
                        <Button size="sm" className="w-full h-10 font-semibold text-white shadow-md focus:outline-none" style={{ backgroundColor: "#0A0A0A" }} onClick={() => { setSelectedRequest(request); setShowBriefModal(true); }}>
                          Submit GitHub →
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            
              {completedBuilds.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4 text-[#1A1A1A]" style={{ fontFamily: "Syne, sans-serif" }}>Completed Builds</h3>
                  <div className="space-y-3">
                    {completedBuilds.map(b => (
                      <div key={b.id} className="bg-white rounded-xl p-4 flex justify-between items-center border border-[#E0F2E9] shadow-sm">
                         <div>
                            <h4 className="font-bold text-[#1A1A1A]">{b.business_name}</h4>
                            <div className="text-xs text-[#666] mt-1">{new Date(b.deployed_at).toLocaleDateString()}</div>
                         </div>
                         <div className="text-right">
                            <div className="font-bold text-[#00C853]">₹{b.coder_earning || 640}</div>
                            {b.ratings && b.ratings.length > 0 && (
                              <div className="flex items-center text-xs mt-1 gap-1 text-[#F5B041]">
                                {Array.from({length: b.ratings[0].rating}).map((_, i) => <Star key={i} size={10} fill="#F5B041" stroke="#F5B041"/>)}
                              </div>
                            )}
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          )}

          {/* EARNINGS TAB */}
          {activeTab === "earnings" && (
            <motion.div key="earnings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <h2 className="text-2xl font-bold mb-4 text-[#1A1A1A]" style={{ fontFamily: "Syne, sans-serif" }}>Earnings</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-2xl p-5 border border-[#00C853] bg-white shadow-sm text-center">
                  <div className="text-sm text-[#666] mb-1">Monthly Passive</div>
                  <div className="text-3xl font-bold text-[#00C853]" style={{ fontFamily: "Syne, sans-serif" }}>₹{passiveTotal}</div>
                  <div className="text-xs mt-1 text-[#999]">Recurs every month</div>
                </div>
                <div className="rounded-2xl p-5 border border-[#E0F2E9] bg-white shadow-sm text-center">
                  <div className="text-sm text-[#666] mb-1">Total Earned</div>
                  <div className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: "Syne, sans-serif" }}>₹{totalEarned}</div>
                  <div className="text-xs mt-1 text-[#999]">All time</div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Breakdown */}
                <div className="rounded-2xl p-6 border border-[#E0F2E9] bg-white shadow-sm">
                  <h3 className="text-lg font-bold mb-4 text-[#1A1A1A]" style={{ fontFamily: "Syne, sans-serif" }}>Earnings Breakdown</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[#666] flex items-center gap-2"><Wrench size={14}/> Building Fees</span>
                      <span className="font-bold">₹{buildingFees}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#666] flex items-center gap-2"><DollarSign size={14}/> Passive Income</span>
                      <span className="font-bold">₹{passiveTotal}</span>
                    </div>
                    <div className="pt-3 border-t border-[#E0E0E0] flex justify-between items-center">
                      <span className="font-semibold">Lifetime Total</span>
                      <span className="font-bold text-[#00C853]">₹{totalEarned}</span>
                    </div>
                  </div>
                </div>
                
                {/* Payout */}
                <div className="rounded-2xl p-6 border border-[#E0F2E9] bg-white shadow-sm">
                  <h3 className="text-lg font-bold mb-4 text-[#1A1A1A]" style={{ fontFamily: "Syne, sans-serif" }}>Payout Status</h3>
                  <div className="space-y-3 text-sm mb-5">
                    <div className="flex justify-between">
                      <span className="text-[#666] flex items-center gap-2"><Calendar size={14}/> Next Payout</span>
                      <span className="font-medium">Every Friday</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666] flex items-center gap-2"><DollarSign size={14}/> Minimum</span>
                      <span className="font-medium">₹200</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666] flex items-center gap-2"><Wallet size={14}/> UPI ID</span>
                      <span className="font-medium">{profile?.whatsapp_number || "Not set"}</span>
                    </div>
                  </div>
                  <Button className="w-full font-semibold text-white" style={{ backgroundColor: "#00C853" }} disabled={eligiblePayout < 200} onClick={() => { setPayoutUpi(profile?.whatsapp_number || ""); setShowPayoutModal(true); }}>
                    Request Payout →
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <h2 className="text-2xl font-bold mb-4 text-[#1A1A1A]" style={{ fontFamily: "Syne, sans-serif" }}>Profile</h2>
              
              <div className="rounded-2xl p-6 border border-[#E0F2E9] bg-white shadow-sm flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold text-[#00C853]" style={{ fontFamily: "Syne, sans-serif" }}>
                    {profile?.full_name?.charAt(0) || "C"}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: "Syne, sans-serif" }}>{profile?.full_name || "Coder"}</h3>
                <p className="text-sm text-[#666] flex items-center gap-1"><ShieldCheck size={14} className="text-[#00C853]"/> Verified Partner</p>
              </div>

              <div className="text-center mb-6">
                 <p className="text-[15px] font-bold text-[#1A1A1A] flex items-center justify-center gap-1"><Star size={16} fill="#FFD700" stroke="#FFD700"/> Your rating: ⭐ {avgRating}/5 ({totalCompleted} builds)</p>
              </div>
              <div className="rounded-2xl p-6 border border-[#E0F2E9] bg-white shadow-sm space-y-4 mb-6">
                
                <div className="border-b border-[#f0f0f0] pb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[#999] uppercase tracking-wider">Name</label>
                    <button onClick={() => { setEditingName(!editingName); setEditNameValue(profile?.full_name || ""); }} className="text-[#00C853]"><Edit2 size={14}/></button>
                  </div>
                  {editingName ? (
                    <div className="mt-2 space-y-2">
                       <Input value={editNameValue} onChange={e => setEditNameValue(e.target.value)} className="h-10 text-sm" />
                       <div className="flex justify-between items-center">
                          <span className="text-xs text-[#666]">{} of 2 changes left this month</span>
                          <Button size="sm" onClick={() => handleUpdateProfile("name")} style={{backgroundColor:"#00C853"}} className="h-8">Save</Button>
                       </div>
                    </div>
                  ) : <p className="text-[15px] font-medium mt-1">{profile?.full_name || "Coder"}</p>}
                </div>

                <div className="border-b border-[#f0f0f0] pb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[#999] uppercase tracking-wider">WhatsApp Number / UPI</label>
                    <button onClick={() => { setEditingNumber(!editingNumber); setEditNumberValue(profile?.whatsapp_number || ""); }} className="text-[#00C853]"><Edit2 size={14}/></button>
                  </div>
                  {editingNumber ? (
                    <div className="mt-2 space-y-2">
                       <Input value={editNumberValue} onChange={e => setEditNumberValue(e.target.value)} className="h-10 text-sm" />
                       <div className="flex justify-between items-center">
                          <span className="text-xs text-[#666]">{} of 2 changes left this month</span>
                          <Button size="sm" onClick={() => handleUpdateProfile("number")} style={{backgroundColor:"#00C853"}} className="h-8">Save</Button>
                       </div>
                    </div>
                  ) : <p className="text-[15px] font-medium mt-1">{profile?.whatsapp_number || "Not provided"}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#999] uppercase tracking-wider">City</label>
                  <p className="text-[15px] font-medium mt-1">{profile?.city || "Not provided"}</p>
                </div>
              </div>

              <div className="rounded-2xl p-6 border border-[#E0F2E9] bg-[#E8F5E9] flex flex-col items-center mb-10 text-center">
                 <MessageCircle size={32} className="text-[#00C853] mb-3" />
                 <h3 className="font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Need Help?</h3>
                 <p className="text-sm text-[#666] mb-4">Contact admin directly on WhatsApp for any issues regarding builds or payouts.</p>
                 <a 
                   href="https://wa.me/919973383902?text=Hello%20Admin,%20need%20help%20with%20Studio"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[#00C853] border-2 border-[#00C853] transition-transform hover:scale-[1.02]"
                 >
                   <MessageCircle size={18} /> Chat with us →
                 </a>
              </div>
                          
              {/* Bottom Sign Out */}
              <div className="mt-6 mb-12">
                 {!confirmSignOut ? (
                   <Button variant="outline" className="w-full text-red-500 border-red-500 hover:bg-red-50 h-12 rounded-xl text-base font-bold" onClick={() => setConfirmSignOut(true)}>
                     Sign Out
                   </Button>
                 ) : (
                   <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center">
                      <p className="text-red-700 font-bold mb-3">Are you sure you want to sign out?</p>
                      <div className="flex gap-2">
                         <Button onClick={signOut} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold h-11">Yes, Sign Out</Button>
                         <Button variant="ghost" onClick={() => setConfirmSignOut(false)} className="flex-1 text-[#666] h-11">No, Go Back</Button>
                      </div>
                   </div>
                 )}
              </div>
</motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E0E0E0] pb-safe z-[60] shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-[68px] max-w-md mx-auto">
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "builds", icon: Wrench, label: "Builds" },
            { id: "earnings", icon: Wallet, label: "Earnings" },
            { id: "profile", icon: User, label: "Profile" }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={() => { setActiveTab(tab.id as any); window.scrollTo(0, 0); }}
                className="flex flex-col items-center justify-center w-20 flex-1 h-full gap-1 transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <div className="relative">
                  <Icon size={22} color={isActive ? "#00C853" : "#999999"} strokeWidth={isActive ? 2.5 : 2} />
                  {tab.id === "builds" && hasRevisionAlert && (
                     <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <span 
                  className="text-[11px] font-bold" 
                  style={{ color: isActive ? "#00C853" : "#999999" }}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div layoutId="indicator" className="absolute top-0 w-8 h-[3px] bg-[#00C853] rounded-b-full" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Brief Modal */}
      <AnimatePresence>
        {showBriefModal && selectedRequest && (
          <BriefModal
            request={selectedRequest}
            profile={profile}
            userId={user?.id || ""}
            onClose={() => { setShowBriefModal(false); setSelectedRequest(null); setGithubSubmitUrl(""); setQualityReport(null); }}
            onRefresh={() => { fetchData(); setActiveTab("home"); }}
          />
        )}
      </AnimatePresence>
      
      {/* Suppress WhatsApp button on these tabs except on profile maybe, wait the requirements said
        "remove WhatsApp floating button from all other Studio tabs — Home, Builds, Earnings
        Do NOT remove WhatsApp button from Profile tab"
        I'll pass a prop or use a ref, or simply I shouldn't rely on the global WhatsApp button.
        Wait, I'll add a style tag to hide the global WhatsApp tooltip and button if activeTab !== "profile" 
      */}
      {activeTab !== "profile" && (
        <style dangerouslySetInnerHTML={{ __html: `
          #whatsapp-tooltip, button[aria-label="Chat on WhatsApp"] {
            display: none !important;
          }
        `}} />
      )}
    </div>
  );
}
