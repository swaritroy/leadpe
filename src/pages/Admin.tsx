import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LogOut, 
  RefreshCw, 
  Search, 
  MessageCircle, 
  ExternalLink,
  Download,
  CheckCircle,
  DollarSign,
  Users,
  Globe,
  Zap,
  TrendingUp,
  Building2,
  Code2,
  FileSpreadsheet,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Wrench,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import LeadPeLogo from "@/components/LeadPeLogo";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { generateWeeklyReport, sendWeeklyReportWhatsApp, saveWeeklyReport } from "@/lib/weeklyReport";
import { sendWhatsApp } from "@/lib/whatsappService";
import { getBusinessIcon, formatDeadline } from "@/lib/clientBrief";

// Interfaces
interface Profile {
  id: string;
  full_name: string;
  business_name?: string;
  whatsapp_number: string;
  email?: string;
  role: "business" | "vibe_coder" | "admin";
  status: "trial" | "active" | "paused" | "churned";
  subscription_plan?: string;
  city?: string;
  business_type?: string;
  trial_start_date?: string;
  site_url?: string;
  created_at: string;
}

interface Deployment {
  id: string;
  vibe_coder_id: string;
  business_name: string;
  owner_name?: string;
  owner_whatsapp: string;
  city?: string;
  business_type?: string;
  subdomain: string;
  status: string;
  trial_start_date?: string;
  trial_day?: number;
  day1_sent?: boolean;
  day2_sent?: boolean;
  day3_sent?: boolean;
  day4_sent?: boolean;
  day5_sent?: boolean;
  day6_sent?: boolean;
  day7_sent?: boolean;
  converted?: boolean;
  created_at: string;
  lead_count?: number;
  visitor_count?: number;
}

interface Lead {
  id: string;
  business_id: string;
  customer_name: string;
  customer_phone: string;
  interest: string;
  created_at: string;
}

interface Earning {
  id: string;
  vibe_coder_id: string;
  deployment_id: string;
  amount: number;
  type: "building" | "passive";
  month: string;
  paid: boolean;
  paid_at?: string;
  created_at: string;
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

interface ActionItem {
  id: string;
  type: "trial_day6" | "trial_day3" | "new_coder" | "no_leads";
  title: string;
  description: string;
  businessName: string;
  whatsapp: string;
  action: string;
  priority: "high" | "medium" | "low";
}

const planPrices: Record<string, number> = {
  basic: 0,
  growth: 299,
  pro: 599,
};

export default function Admin() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [buildRequests, setBuildRequests] = useState<BuildRequest[]>([]);
  const [availableCoders, setAvailableCoders] = useState<Profile[]>([]);
  
  const [businessSearch, setBusinessSearch] = useState("");
  const [businessFilter, setBusinessFilter] = useState<"all" | "trial" | "active" | "paused" | "churned">("all");
  const [coderSearch, setCoderSearch] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["metrics", "actions", "businesses", "coders", "deployments", "revenue", "payouts", "quick"]));
  
  const [sendingReports, setSendingReports] = useState(false);
  const [reportsProgress, setReportsProgress] = useState({ sent: 0, total: 0 });
  
  // Check admin access
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    const checkAdmin = async () => {
      const { data } = await (supabase.from("profiles") as any)
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (data?.role !== "admin") {
        navigate("/client/dashboard");
        toast({ title: "Access denied", description: "Admin only", variant: "destructive" });
      }
    };
    
    checkAdmin();
  }, [user, navigate, toast]);
  
  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { data: profilesData } = await (supabase.from("profiles") as any)
        .select("*")
        .order("created_at", { ascending: false });
      
      const { data: deploymentsData } = await (supabase as any).from("deployments")
        .select("*")
        .order("created_at", { ascending: false });
      
      const { data: leadsData } = await (supabase.from("leads") as any)
        .select("*")
        .order("created_at", { ascending: false });
      
      const { data: earningsData } = await (supabase as any).from("earnings")
        .select("*")
        .order("created_at", { ascending: false });
      
      const { data: buildRequestsData } = await (supabase as any).from("build_requests")
        .select("*")
        .order("created_at", { ascending: false });
      
      setProfiles(profilesData || []);
      setDeployments(deploymentsData || []);
      setLeads(leadsData || []);
      setEarnings(earningsData || []);
      setBuildRequests(buildRequestsData || []);
      
      // Set available coders
      const coders = (profilesData || []).filter(p => p.role === "vibe_coder");
      setAvailableCoders(coders);
      
      // Enrich build requests with coder names
      const enrichedRequests = (buildRequestsData || []).map(request => {
        const coder = coders.find(c => c.id === request.assigned_coder_id);
        return {
          ...request,
          coder_name: coder?.full_name || "Unassigned"
        };
      });
      setBuildRequests(enrichedRequests);
      
      generateActionItems(profilesData || [], deploymentsData || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
    
    setLoading(false);
  }, [user]);
  
  const generateActionItems = (profiles: Profile[], deployments: Deployment[]) => {
    const items: ActionItem[] = [];
    
    deployments.forEach(d => {
      if (d.trial_day === 6 && !d.converted) {
        items.push({
          id: `trial6-${d.id}`,
          type: "trial_day6",
          title: "Trial ending tomorrow",
          description: `Day 6 of 7 - needs conversion push`,
          businessName: d.business_name,
          whatsapp: d.owner_whatsapp,
          action: `Hi ${d.owner_name || "there"}! Your trial ends tomorrow. Continue for just ₹299/month. Reply YES to activate!`,
          priority: "high"
        });
      }
      
      if (d.trial_day === 3 && !d.day3_sent) {
        items.push({
          id: `trial3-${d.id}`,
          type: "trial_day3",
          title: "Google Business setup needed",
          description: `Day 3 - Set up Google Maps listing`,
          businessName: d.business_name,
          whatsapp: d.owner_whatsapp,
          action: `Set up Google Business for ${d.business_name}`,
          priority: "medium"
        });
      }
    });
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    profiles.filter(p => p.role === "vibe_coder" && new Date(p.created_at) > lastWeek).forEach(p => {
      items.push({
        id: `coder-${p.id}`,
        type: "new_coder",
        title: "New vibe coder signup",
        description: "Welcome and onboard",
        businessName: p.full_name,
        whatsapp: p.whatsapp_number,
        action: `Welcome to LeadPe Studio, ${p.full_name}! Here's how to deploy your first site...`,
        priority: "medium"
      });
    });
    
    deployments.forEach(d => {
      const daysSinceDeploy = Math.floor((Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const hasLeads = d.lead_count && d.lead_count > 0;
      
      if (daysSinceDeploy >= 7 && !hasLeads) {
        items.push({
          id: `noleads-${d.id}`,
          type: "no_leads",
          title: "No leads after 7 days",
          description: `Deployed ${daysSinceDeploy} days ago, 0 leads`,
          businessName: d.business_name,
          whatsapp: d.owner_whatsapp,
          action: `Hi! Your site is live but no leads yet. Are you sharing your link?`,
          priority: "low"
        });
      }
    });
    
    setActionItems(items.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }));
  };
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);
  
  // Metrics
  const businesses = profiles.filter(p => p.role === "business");
  const vibeCoders = profiles.filter(p => p.role === "vibe_coder");
  
  const totalMRR = businesses.reduce((sum, b) => {
    if (b.status === "active" && b.subscription_plan) {
      return sum + (planPrices[b.subscription_plan] || 0);
    }
    return sum;
  }, 0);
  
  const thisWeekRevenue = earnings
    .filter(e => new Date(e.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .reduce((sum, e) => sum + e.amount, 0);
  
  const activeBusinesses = businesses.filter(b => b.status === "active").length;
  const trialBusinesses = businesses.filter(b => b.status === "trial").length;
  
  const activeCoders = vibeCoders.filter(c => {
    const coderDeployments = deployments.filter(d => d.vibe_coder_id === c.id);
    return coderDeployments.length > 0;
  }).length;
  
  const thisMonthDeployments = deployments.filter(d => {
    const deployMonth = new Date(d.created_at).toISOString().slice(0, 7);
    const currentMonth = new Date().toISOString().slice(0, 7);
    return deployMonth === currentMonth;
  }).length;
  
  const churnedLast30Days = businesses.filter(b => {
    if (b.status !== "churned") return false;
    const daysSinceCreation = Math.floor((Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreation <= 30;
  }).length;
  
  const churnRate = activeBusinesses > 0 
    ? Math.round((churnedLast30Days / (activeBusinesses + churnedLast30Days)) * 100) 
    : 0;
  
  // Revenue chart data
  const revenueChartData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthKey = date.toISOString().slice(0, 7);
    const monthName = date.toLocaleString("en-US", { month: "short" });
    
    const monthRevenue = earnings
      .filter(e => e.month === monthKey)
      .reduce((sum, e) => sum + e.amount, 0);
    
    return { name: monthName, revenue: monthRevenue };
  });
  
  // Payouts
  const unpaidEarnings = earnings.filter(e => !e.paid);
  const payoutByCoder = new Map<string, { 
    name: string; 
    whatsapp: string;
    activeSites: number;
    passive: number;
    building: number;
    total: number;
  }>();
  
  unpaidEarnings.forEach(e => {
    const coder = vibeCoders.find(c => c.id === e.vibe_coder_id);
    if (!coder) return;
    
    const existing = payoutByCoder.get(coder.id);
    const activeSites = deployments.filter(d => d.vibe_coder_id === coder.id && d.status === "deployed").length;
    
    if (existing) {
      if (e.type === "passive") existing.passive += e.amount;
      if (e.type === "building") existing.building += e.amount;
      existing.total += e.amount;
    } else {
      payoutByCoder.set(coder.id, {
        name: coder.full_name,
        whatsapp: coder.whatsapp_number,
        activeSites,
        passive: e.type === "passive" ? e.amount : 0,
        building: e.type === "building" ? e.amount : 0,
        total: e.amount,
      });
    }
  });
  
  const payouts = Array.from(payoutByCoder.entries()).map(([id, data]) => ({ id, ...data }));
  
  const filteredBusinesses = businesses.filter(b => {
    const matchesSearch = (b.business_name || b.full_name).toLowerCase().includes(businessSearch.toLowerCase()) ||
                         (b.city || "").toLowerCase().includes(businessSearch.toLowerCase());
    const matchesFilter = businessFilter === "all" || b.status === businessFilter;
    return matchesSearch && matchesFilter;
  });
  
  const filteredCoders = vibeCoders.filter(c => {
    const matchesSearch = c.full_name.toLowerCase().includes(coderSearch.toLowerCase()) ||
                         c.whatsapp_number.includes(coderSearch);
    return matchesSearch;
  });
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };
  
  const sendWhatsApp = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const fullPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${fullPhone}?text=${encodedMessage}`, "_blank", "noopener,noreferrer");
  };
  
  const markPayoutPaid = async (coderId: string) => {
    const coderEarnings = unpaidEarnings.filter(e => e.vibe_coder_id === coderId);
    for (const earning of coderEarnings) {
      await (supabase as any).from("earnings")
        .update({ paid: true, paid_at: new Date().toISOString() })
        .eq("id", earning.id);
    }
    toast({ title: "Marked as paid", description: "Payout status updated" });
    fetchData();
  };
  
  const assignCoder = async (requestId: string, coderId: string) => {
    try {
      const { error } = await (supabase as any).from("build_requests")
        .update({
          status: "building",
          assigned_coder_id: coderId
        })
        .eq("id", requestId);
      
      if (error) throw error;
      
      const request = buildRequests.find(r => r.id === requestId);
      const coder = availableCoders.find(c => c.id === coderId);
      
      if (request && coder) {
        // Send WhatsApp to business owner
        await sendWhatsApp(
          request.owner_whatsapp,
          `🎉 Great news ${request.owner_name}!\nAapki website banana shuru ho gaya.\nBuilder: ${coder.full_name}\nReady in: 48 hours 🚀\nLeadPe ⚡`
        );
        
        toast({
          title: "✅ Coder Assigned!",
          description: `${coder.full_name} assigned to ${request.business_name}`
        });
      }
      
      fetchData();
    } catch (error) {
      console.error("Error assigning coder:", error);
      toast({
        title: "Error",
        description: "Failed to assign coder",
        variant: "destructive"
      });
    }
  };
  
  const markAllPaid = async () => {
    for (const earning of unpaidEarnings) {
      await (supabase as any).from("earnings")
        .update({ paid: true, paid_at: new Date().toISOString() })
        .eq("id", earning.id);
    }
    toast({ title: "All payouts marked as paid", description: "All earnings updated" });
    fetchData();
  };
  
  const exportCSV = () => {
    const csvData = businesses.map(b => ({
      Name: b.business_name || b.full_name,
      City: b.city || "N/A",
      Type: b.business_type || "N/A",
      Status: b.status,
      Plan: b.subscription_plan || "N/A",
      WhatsApp: b.whatsapp_number,
      Joined: new Date(b.created_at).toLocaleDateString()
    }));
    
    const headers = Object.keys(csvData[0] || {}).join(",");
    const rows = csvData.map(row => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leadpe-businesses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    
    toast({ title: "CSV downloaded", description: `${csvData.length} businesses exported` });
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
          <div className="flex items-center gap-2">
            <LeadPeLogo theme="light" size="sm" />
            <span className="font-bold text-xl text-[#00C853]">Admin ⚡</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchData} className="p-2 rounded-full hover:bg-white/5 transition-colors" title="Refresh data">
              <RefreshCw size={18} style={{ color: "#00E676" }} />
            </button>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email?.split("@")[0] || "Admin"}
            </span>
            <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-24">
        {/* Hero Metrics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => toggleSection("metrics")} className="flex items-center gap-2 text-lg font-bold font-display">
              {expandedSections.has("metrics") ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              Dashboard Metrics
            </button>
          </div>
          
          {expandedSections.has("metrics") && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="rounded-2xl border-2 p-5 text-center col-span-2 md:col-span-1" style={{ backgroundColor: "#FFFFFF", borderColor: "#00C853" }}>
                <div className="text-3xl md:text-4xl font-extrabold font-display mb-1" style={{ color: "#00C853" }}>
                  ₹{totalMRR.toLocaleString()}/mo
                </div>
                <div className="text-xs text-muted-foreground mb-2">Monthly Recurring Revenue</div>
                <div className="text-xs" style={{ color: "#00C853" }}>+₹{thisWeekRevenue.toLocaleString()} this week</div>
              </div>
              
              <div className="rounded-2xl border border-[#E0F2E9] p-5 text-center" style={{ backgroundColor: "#FFFFFF" }}>
                <div className="text-2xl md:text-3xl font-bold font-display mb-1">{businesses.length}</div>
                <div className="text-xs text-muted-foreground mb-2">Total Businesses</div>
                <div className="text-xs text-muted-foreground">{activeBusinesses} active, {trialBusinesses} trial</div>
              </div>
              
              <div className="rounded-2xl border border-[#E0F2E9] p-5 text-center" style={{ backgroundColor: "#FFFFFF" }}>
                <div className="text-2xl md:text-3xl font-bold font-display mb-1">{vibeCoders.length}</div>
                <div className="text-xs text-muted-foreground mb-2">Vibe Coders</div>
                <div className="text-xs text-muted-foreground">{activeCoders} active builders</div>
              </div>
              
              <div className="rounded-2xl border border-[#E0F2E9] p-5 text-center" style={{ backgroundColor: "#FFFFFF" }}>
                <div className="text-2xl md:text-3xl font-bold font-display mb-1">{deployments.length}</div>
                <div className="text-xs text-muted-foreground mb-2">Sites Deployed</div>
                <div className="text-xs text-muted-foreground">{thisMonthDeployments} this month</div>
              </div>
              
              <div className="rounded-2xl border border-[#E0F2E9] p-5 text-center" style={{ backgroundColor: "#FFFFFF" }}>
                <div className="text-2xl md:text-3xl font-bold font-display mb-1">{leads.length}</div>
                <div className="text-xs text-muted-foreground mb-2">Leads Generated</div>
                <div className="text-xs text-muted-foreground">All time</div>
              </div>
              
              <div className="rounded-2xl border border-[#E0F2E9] p-5 text-center" style={{ backgroundColor: "#FFFFFF" }}>
                <div className={`text-2xl md:text-3xl font-bold font-display mb-1 ${churnRate > 10 ? "text-red-500" : ""}`} style={churnRate <= 10 ? { color: "#00C853" } : {}}>
                  {churnRate}%
                </div>
                <div className="text-xs text-muted-foreground mb-2">Churn Rate</div>
                <div className="text-xs text-muted-foreground">Last 30 days</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Action Needed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => toggleSection("actions")} className="flex items-center gap-2 text-lg font-bold font-display">
              {expandedSections.has("actions") ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              🚨 Needs Your Attention
              {actionItems.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: "#ef4444", color: "white" }}>
                  {actionItems.length}
                </span>
              )}
            </button>
          </div>
          
          {expandedSections.has("actions") && (
            <div className="space-y-3">
              {actionItems.length === 0 ? (
                <div className="rounded-2xl border border-[#E0F2E9] p-6 text-center" style={{ backgroundColor: "#FFFFFF" }}>
                  <CheckCircle size={32} style={{ color: "#00C853" }} className="mx-auto mb-2" />
                  <p className="text-muted-foreground">All caught up! No urgent actions needed.</p>
                </div>
              ) : (
                actionItems.slice(0, 10).map((item) => (
                  <div key={item.id} className="rounded-xl border border-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ 
                    backgroundColor: "#FFFFFF",
                    borderColor: item.priority === "high" ? "#ef4444" : item.priority === "medium" ? "#eab308" : undefined 
                  }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${item.priority === "high" ? "bg-red-500" : item.priority === "medium" ? "bg-yellow-500" : "bg-blue-500"}`} />
                        <span className="font-semibold">{item.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.businessName}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <Button onClick={() => sendWhatsApp(item.whatsapp, item.action)} className="h-10 px-4 rounded-lg text-black font-medium whitespace-nowrap" style={{ backgroundColor: "#00C853" }}>
                      <MessageCircle size={16} className="mr-2" /> WhatsApp
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>

        {/* Businesses Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => toggleSection("businesses")} className="flex items-center gap-2 text-lg font-bold font-display">
              {expandedSections.has("businesses") ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              All Businesses
            </button>
          </div>
          
          {expandedSections.has("businesses") && (
            <div className="rounded-2xl border border-[#E0F2E9] overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
              <div className="p-4 border-b border-[#E0F2E9] flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={businessSearch} onChange={(e) => setBusinessSearch(e.target.value)} className="pl-9 h-10 rounded-lg border-border" style={{ backgroundColor: "#FAFAFA" }} placeholder="Search businesses..." />
                </div>
                <select value={businessFilter} onChange={(e) => setBusinessFilter(e.target.value as any)} className="h-10 px-3 rounded-lg border border-border outline-none text-sm" style={{ backgroundColor: "#FAFAFA" }}>
                  <option value="all">All Status</option>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="churned">Churned</option>
                </select>
              </div>
              
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: "#F0FFF4" }}>
                      <th className="text-left p-4 text-sm font-medium">Business</th>
                      <th className="text-left p-4 text-sm font-medium">City</th>
                      <th className="text-left p-4 text-sm font-medium">Type</th>
                      <th className="text-left p-4 text-sm font-medium">Trial Day</th>
                      <th className="text-left p-4 text-sm font-medium">Plan</th>
                      <th className="text-left p-4 text-sm font-medium">Leads</th>
                      <th className="text-left p-4 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBusinesses.slice(0, 50).map((b) => {
                      const businessLeads = leads.filter(l => l.business_id === b.id).length;
                      const deployment = deployments.find(d => d.owner_whatsapp === b.whatsapp_number);
                      return (
                        <tr key={b.id} className="border-t border-border">
                          <td className="p-4">
                            <div className="font-medium">{b.business_name || b.full_name}</div>
                            <div className="text-xs text-muted-foreground">{b.whatsapp_number}</div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{b.city || "-"}</td>
                          <td className="p-4 text-sm text-muted-foreground">{b.business_type || "-"}</td>
                          <td className="p-4">
                            {b.status === "trial" && deployment?.trial_day ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "rgba(234, 179, 8, 0.1)", color: "#eab308" }}>
                                Day {deployment.trial_day}/7
                              </span>
                            ) : <span className="text-sm text-muted-foreground">-</span>}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.subscription_plan === "growth" ? "bg-blue-500/20 text-blue-400" : b.subscription_plan === "pro" ? "bg-purple-500/20 text-purple-400" : "bg-gray-500/20 text-gray-400"}`}>
                              {b.subscription_plan || "basic"}
                            </span>
                          </td>
                          <td className="p-4 text-sm" style={{ color: "#00E676" }}>{businessLeads}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button onClick={() => sendWhatsApp(b.whatsapp_number, `Hi ${b.full_name}! This is LeadPe support. How can I help you today?`)} className="px-3 py-1.5 rounded-lg text-xs border border-border hover:border-[#00E676]/50 transition-colors">WhatsApp</button>
                              {deployment && <a href={`https://${deployment.subdomain}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-xs border border-border hover:border-[#00E676]/50 transition-colors"><ExternalLink size={12} className="inline mr-1" /> Site</a>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="md:hidden p-4 space-y-3">
                {filteredBusinesses.slice(0, 20).map((b) => {
                  const businessLeads = leads.filter(l => l.business_id === b.id).length;
                  const deployment = deployments.find(d => d.owner_whatsapp === b.whatsapp_number);
                  return (
                    <div key={b.id} className="p-4 rounded-xl border border-[#E0F2E9]" style={{ backgroundColor: "#FFFFFF" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{b.business_name || b.full_name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.status === "active" ? "bg-green-500/20 text-green-400" : b.status === "trial" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>{b.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{b.city} • {b.business_type}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground">Leads: <span style={{ color: "#00E676" }}>{businessLeads}</span></span>
                        <span className="text-xs text-muted-foreground">{b.subscription_plan || "basic"}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => sendWhatsApp(b.whatsapp_number, `Hi ${b.full_name}! This is LeadPe support.`)} className="flex-1 py-2 rounded-lg text-xs border border-border text-center">WhatsApp</button>
                        {deployment && <a href={`https://${deployment.subdomain}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 rounded-lg text-xs border border-border text-center">View Site</a>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Vibe Coders Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => toggleSection("coders")} className="flex items-center gap-2 text-lg font-bold font-display">
              {expandedSections.has("coders") ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              All Vibe Coders
            </button>
          </div>
          
          {expandedSections.has("coders") && (
            <div className="rounded-2xl border border-[#E0F2E9] overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
              <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={coderSearch} onChange={(e) => setCoderSearch(e.target.value)} className="pl-9 h-10 rounded-lg border-border" style={{ backgroundColor: "#FAFAFA" }} placeholder="Search coders..." />
                </div>
              </div>
              
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: "#F0FFF4" }}>
                      <th className="text-left p-4 text-sm font-medium">Name</th>
                      <th className="text-left p-4 text-sm font-medium">WhatsApp</th>
                      <th className="text-left p-4 text-sm font-medium">Sites Built</th>
                      <th className="text-left p-4 text-sm font-medium">Active Sites</th>
                      <th className="text-left p-4 text-sm font-medium">Earnings</th>
                      <th className="text-left p-4 text-sm font-medium">Payout Due</th>
                      <th className="text-left p-4 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCoders.map((c) => {
                      const coderDeployments = deployments.filter(d => d.vibe_coder_id === c.id);
                      const activeSites = coderDeployments.filter(d => d.status === "deployed").length;
                      const coderEarnings = earnings.filter(e => e.vibe_coder_id === c.id);
                      const totalEarned = coderEarnings.reduce((sum, e) => sum + e.amount, 0);
                      const unpaid = coderEarnings.filter(e => !e.paid).reduce((sum, e) => sum + e.amount, 0);
                      return (
                        <tr key={c.id} className="border-t border-border">
                          <td className="p-4 font-medium">{c.full_name}</td>
                          <td className="p-4 text-sm text-muted-foreground">{c.whatsapp_number}</td>
                          <td className="p-4 text-sm">{coderDeployments.length}</td>
                          <td className="p-4 text-sm" style={{ color: "#00E676" }}>{activeSites}</td>
                          <td className="p-4 text-sm" style={{ color: "#00E676" }}>₹{totalEarned.toLocaleString()}</td>
                          <td className="p-4 text-sm font-medium">₹{unpaid.toLocaleString()}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button onClick={() => sendWhatsApp(c.whatsapp_number, `Hi ${c.full_name}! This is LeadPe.`)} className="px-3 py-1.5 rounded-lg text-xs border border-border hover:border-[#00E676]/50 transition-colors">WhatsApp</button>
                              {unpaid > 0 && <button onClick={() => markPayoutPaid(c.id)} className="px-3 py-1.5 rounded-lg text-xs text-black font-medium" style={{ backgroundColor: "#00E676" }}>Mark Paid</button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="md:hidden p-4 space-y-3">
                {filteredCoders.slice(0, 20).map((c) => {
                  const coderDeployments = deployments.filter(d => d.vibe_coder_id === c.id);
                  const activeSites = coderDeployments.filter(d => d.status === "deployed").length;
                  const coderEarnings = earnings.filter(e => e.vibe_coder_id === c.id);
                  const unpaid = coderEarnings.filter(e => !e.paid).reduce((sum, e) => sum + e.amount, 0);
                  return (
                    <div key={c.id} className="p-4 rounded-xl border border-[#E0F2E9]" style={{ backgroundColor: "#FFFFFF" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{c.full_name}</span>
                        <span className="font-bold" style={{ color: "#00E676" }}>₹{unpaid.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">{c.whatsapp_number} • {activeSites} active sites</div>
                      <div className="flex gap-2">
                        <button onClick={() => sendWhatsApp(c.whatsapp_number, `Hi ${c.full_name}!`)} className="flex-1 py-2 rounded-lg text-xs border border-border text-center">WhatsApp</button>
                        {unpaid > 0 && <button onClick={() => markPayoutPaid(c.id)} className="flex-1 py-2 rounded-lg text-xs text-black font-medium text-center" style={{ backgroundColor: "#00E676" }}>Mark Paid</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Build Requests */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => toggleSection("buildRequests")} className="flex items-center gap-2 text-lg font-bold font-display">
              {expandedSections.has("buildRequests") ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              Build Requests ({buildRequests.length})
            </button>
          </div>
          
          {expandedSections.has("buildRequests") && (
            <div className="rounded-2xl border border-[#E0F2E9] overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: "#F0FFF4" }}>
                    <tr>
                      <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Business</th>
                      <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type | City</th>
                      <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Owner</th>
                      <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</th>
                      <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Coder</th>
                      <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Deadline</th>
                      <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {buildRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-[#1a1f1a]/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getBusinessIcon(request.business_type)}</span>
                            <div>
                              <div className="font-medium">{request.business_name}</div>
                              <div className="text-xs text-muted-foreground">{request.owner_whatsapp}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          <div>{request.business_type}</div>
                          <div className="text-muted-foreground">{request.city}</div>
                        </td>
                        <td className="p-4 text-sm">{request.owner_name}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.plan_selected === "basic" ? "bg-gray-500/20 text-gray-500" :
                            request.plan_selected === "growth" ? "bg-green-500/20 text-green-500" :
                            "bg-purple-500/20 text-purple-500"
                          }`}>
                            {request.plan_selected.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === "pending" ? "bg-yellow-500/20 text-yellow-500" :
                            request.status === "building" ? "bg-blue-500/20 text-blue-500" :
                            request.status === "review" ? "bg-purple-500/20 text-purple-500" :
                            request.status === "deployed" ? "bg-green-500/20 text-green-500" :
                            "bg-red-500/20 text-red-500"
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm">
                          {request.coder_name || "Unassigned"}
                        </td>
                        <td className="p-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDeadline(request.deadline)}
                          </div>
                        </td>
                        <td className="p-4">
                          {request.status === "pending" && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  assignCoder(request.id, e.target.value);
                                }
                              }}
                              className="text-xs px-2 py-1 rounded border border-[#E0F2E9] bg-[#FAFAFA] text-foreground"
                              defaultValue=""
                            >
                              <option value="">Assign...</option>
                              {availableCoders.map(coder => (
                                <option key={coder.id} value={coder.id}>{coder.full_name}</option>
                              ))}
                            </select>
                          )}
                          {request.github_url && (
                            <button
                              onClick={() => window.open(request.github_url, "_blank")}
                              className="text-xs px-2 py-1 rounded border border-border hover:border-[#00E676]/50 transition-colors"
                            >
                              GitHub
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Cards */}
              <div className="md:hidden p-4 space-y-3">
                {buildRequests.map((request) => (
                  <div key={request.id} className="p-4 rounded-xl border border-[#E0F2E9]" style={{ backgroundColor: "#FFFFFF" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getBusinessIcon(request.business_type)}</span>
                        <span className="font-medium">{request.business_name}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === "pending" ? "bg-yellow-500/20 text-yellow-500" :
                        request.status === "building" ? "bg-blue-500/20 text-blue-500" :
                        request.status === "review" ? "bg-purple-500/20 text-purple-500" :
                        request.status === "deployed" ? "bg-green-500/20 text-green-500" :
                        "bg-red-500/20 text-red-500"
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 mb-3">
                      <div>{request.business_type} • {request.city}</div>
                      <div>Owner: {request.owner_name}</div>
                      <div>Plan: {request.plan_selected.toUpperCase()}</div>
                      <div>Coder: {request.coder_name || "Unassigned"}</div>
                      <div className="flex items-center gap-1">
                        <Clock size={10} />
                        Deadline: {formatDeadline(request.deadline)}
                      </div>
                    </div>
                    {request.status === "pending" && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            assignCoder(request.id, e.target.value);
                          }
                        }}
                        className="w-full text-xs px-2 py-1 rounded border border-[#E0F2E9] bg-[#FAFAFA] text-foreground"
                        defaultValue=""
                      >
                        <option value="">Assign coder...</option>
                        {availableCoders.map(coder => (
                          <option key={coder.id} value={coder.id}>{coder.full_name}</option>
                        ))}
                      </select>
                    )}
                    {request.github_url && (
                      <button
                        onClick={() => window.open(request.github_url, "_blank")}
                        className="w-full text-xs px-2 py-1 rounded border border-border hover:border-[#00E676]/50 transition-colors mt-2"
                      >
                        View GitHub
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => toggleSection("revenue")} className="flex items-center gap-2 text-lg font-bold font-display">
              {expandedSections.has("revenue") ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              Revenue Chart
            </button>
          </div>
          
          {expandedSections.has("revenue") && (
            <div className="rounded-2xl border border-[#E0F2E9] p-6" style={{ backgroundColor: "#FFFFFF" }}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1f1a" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip contentStyle={{ backgroundColor: "#101810", border: "1px solid #1a1f1a", borderRadius: "8px" }} itemStyle={{ color: "#00E676" }} formatter={(val: number) => [`₹${val.toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="#00E676" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </motion.div>

        {/* Friday Payouts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => toggleSection("payouts")} className="flex items-center gap-2 text-lg font-bold font-display">
              {expandedSections.has("payouts") ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              Friday Payouts 💰
              {payouts.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: "#00E676", color: "#000" }}>{payouts.length} coders</span>}
            </button>
          </div>
          
          {expandedSections.has("payouts") && (
            <div className="rounded-2xl border border-border overflow-hidden" style={{ backgroundColor: "#101810" }}>
              {payouts.length === 0 ? (
                <div className="p-8 text-center">
                  <DollarSign size={32} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending payouts</p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-border flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total due: <span className="font-bold text-lg" style={{ color: "#00E676" }}>₹{payouts.reduce((sum, p) => sum + p.total, 0).toLocaleString()}</span></span>
                    <Button onClick={markAllPaid} className="h-10 px-4 rounded-lg text-black font-medium" style={{ backgroundColor: "#00E676" }}>Mark All Paid</Button>
                  </div>
                  
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ backgroundColor: "#080C09" }}>
                          <th className="text-left p-4 text-sm font-medium">Vibe Coder</th>
                          <th className="text-left p-4 text-sm font-medium">Active Sites</th>
                          <th className="text-left p-4 text-sm font-medium">Monthly Passive</th>
                          <th className="text-left p-4 text-sm font-medium">Building Fees</th>
                          <th className="text-left p-4 text-sm font-medium">Total Due</th>
                          <th className="text-left p-4 text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map((p) => (
                          <tr key={p.id} className="border-t border-border">
                            <td className="p-4 font-medium">{p.name}</td>
                            <td className="p-4 text-sm" style={{ color: "#00E676" }}>{p.activeSites}</td>
                            <td className="p-4 text-sm">₹{p.passive.toLocaleString()}</td>
                            <td className="p-4 text-sm">₹{p.building.toLocaleString()}</td>
                            <td className="p-4 font-bold" style={{ color: "#00E676" }}>₹{p.total.toLocaleString()}</td>
                            <td className="p-4">
                              <button onClick={() => markPayoutPaid(p.id)} className="px-3 py-1.5 rounded-lg text-xs text-black font-medium" style={{ backgroundColor: "#00E676" }}>Mark Paid</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="md:hidden p-4 space-y-3">
                    {payouts.map((p) => (
                      <div key={p.id} className="p-4 rounded-xl border border-border" style={{ backgroundColor: "#080C09" }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{p.name}</span>
                          <span className="font-bold" style={{ color: "#00E676" }}>₹{p.total.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-3">{p.activeSites} sites • Passive: ₹{p.passive} • Building: ₹{p.building}</div>
                        <div className="flex gap-2">
                          <button onClick={() => sendWhatsApp(p.whatsapp, `Hi ${p.name}! Your LeadPe payout of ₹${p.total} has been processed.`)} className="flex-1 py-2 rounded-lg text-xs border border-border text-center">Notify</button>
                          <button onClick={() => markPayoutPaid(p.id)} className="flex-1 py-2 rounded-lg text-xs text-black font-medium text-center" style={{ backgroundColor: "#00E676" }}>Mark Paid</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => toggleSection("quick")} className="flex items-center gap-2 text-lg font-bold font-display">
              {expandedSections.has("quick") ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              Quick Actions
            </button>
          </div>
          
          {expandedSections.has("quick") && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button onClick={() => toast({ title: "Reports", description: "Weekly reports triggered" })} className="p-6 rounded-2xl border border-border text-left hover:border-[#00E676]/50 transition-colors" style={{ backgroundColor: "#101810" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(0, 230, 118, 0.1)" }}>
                  <TrendingUp size={24} style={{ color: "#00E676" }} />
                </div>
                <div className="font-semibold mb-1">Send Weekly Reports</div>
                <div className="text-xs text-muted-foreground">Trigger all Day 4 reports</div>
              </button>
              
              <button onClick={() => toast({ title: "Trial Status", description: `${businesses.filter(b => b.status === "trial").length} businesses on trial` })} className="p-6 rounded-2xl border border-border text-left hover:border-[#00E676]/50 transition-colors" style={{ backgroundColor: "#101810" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(0, 230, 118, 0.1)" }}>
                  <AlertCircle size={24} style={{ color: "#00E676" }} />
                </div>
                <div className="font-semibold mb-1">Check All Trials</div>
                <div className="text-xs text-muted-foreground">View trial day statuses</div>
              </button>
              
              <button onClick={exportCSV} className="p-6 rounded-2xl border border-border text-left hover:border-[#00E676]/50 transition-colors" style={{ backgroundColor: "#101810" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(0, 230, 118, 0.1)" }}>
                  <FileSpreadsheet size={24} style={{ color: "#00E676" }} />
                </div>
                <div className="font-semibold mb-1">Export Data CSV</div>
                <div className="text-xs text-muted-foreground">Download all business data</div>
              </button>
              
              <button onClick={() => toast({ title: "Platform Health", description: "All systems operational" })} className="p-6 rounded-2xl border border-border text-left hover:border-[#00E676]/50 transition-colors" style={{ backgroundColor: "#101810" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(0, 230, 118, 0.1)" }}>
                  <Zap size={24} style={{ color: "#00E676" }} />
                </div>
                <div className="font-semibold mb-1">Platform Health</div>
                <div className="text-xs text-muted-foreground">Check all systems status</div>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
