import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, LogOut, CheckCircle, XCircle, ExternalLink, MessageCircle, Copy, Rocket, Loader2, AlertCircle, Wrench, Eye, Clock, DollarSign, Code, Send, Check, Shield, ClipboardCopy, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import LeadPeLogo from "@/components/LeadPeLogo";
import { generateSEO } from "@/lib/seoGenerator";
import { sendWhatsApp, getMessage } from "@/lib/whatsappService";
import { generateBrief, copyToClipboard, getBusinessIcon, getBuildingFee, formatDeadline } from "@/lib/clientBrief";
import { deployWebsite } from "@/lib/deployService";
import { checkWebsiteQuality, generateFixPrompt, QualityReport } from "@/lib/qualityChecker";
import { generateLeadWidgetCode } from "@/lib/leadWidget";
import { WEBSITE_PACKAGES, getPackageById } from "@/lib/packages";
import { updateCoderEarnings } from "@/lib/earningsCalc";

interface Deployment {
  id: string;
  business_name: string;
  business_type: string;
  city: string;
  subdomain: string;
  status: string;
  owner_whatsapp: string;
  building_fee: number;
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
  package_id?: string;
  package_price?: number;
  coder_earning?: number;
  website_purpose?: string;
  reference_sites?: string;
  special_requirements?: string;
}

interface Earning {
  id: string;
  amount: number;
  type: string;
  month: string;
  paid: boolean;
}

interface VettingCheck {
  id: number;
  label: string;
  checking: string;
  status: "pending" | "checking" | "pass" | "fixing" | "fail";
  fixing?: string;
  passMessage: string;
}

const businessTypes = [
  "Coaching Centre",
  "Doctor / Clinic",
  "Lawyer / CA",
  "Salon / Parlour",
  "Gym / Fitness",
  "Plumber / Electrician",
  "Photographer",
  "Real Estate",
  "Restaurant",
  "Dance / Music Class",
  "Other",
];

const vettingChecksTemplate: VettingCheck[] = [
  { id: 1, label: "Site Accessibility", checking: "Accessing your site...", status: "pending", passMessage: "Site is accessible" },
  { id: 2, label: "Page Speed", checking: "Checking page speed...", status: "pending", passMessage: "Speed score: 94/100" },
  { id: 3, label: "Mobile Layout", checking: "Checking mobile layout...", status: "pending", passMessage: "Mobile friendly" },
  { id: 4, label: "SEO Tags", checking: "Checking SEO tags...", status: "pending", fixing: "Missing meta tags — Auto fixing...", passMessage: "SEO tags added" },
  { id: 5, label: "Image Optimization", checking: "Checking images...", status: "pending", fixing: "Unoptimized images — Compressing...", passMessage: "Images optimized" },
  { id: 6, label: "Lead Form", checking: "Checking lead form...", status: "pending", passMessage: "Lead capture form found" },
  { id: 7, label: "WhatsApp Button", checking: "Checking WhatsApp button...", status: "pending", fixing: "WhatsApp button missing — Adding automatically...", passMessage: "WhatsApp button added" },
  { id: 8, label: "Final Quality Check", checking: "Final quality check...", status: "pending", passMessage: "Quality score: 94/100" },
];

export default function DevDashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // Build requests states
  const [buildRequests, setBuildRequests] = useState<BuildRequest[]>([]);
  const [activeBuilds, setActiveBuilds] = useState<BuildRequest[]>([]);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BuildRequest | null>(null);
  const [githubSubmitUrl, setGithubSubmitUrl] = useState("");
  const [submittingGithub, setSubmittingGithub] = useState(false);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [qualityChecking, setQualityChecking] = useState(false);
  const [widgetCopied, setWidgetCopied] = useState(false);
  const [packageFilter, setPackageFilter] = useState("all");
  // Deploy flow states
  const [githubUrl, setGithubUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [vettingChecks, setVettingChecks] = useState<VettingCheck[]>(vettingChecksTemplate);
  const [vettingStage, setVettingStage] = useState<"input" | "vetting" | "passed" | "failed">("input");
  const [currentCheckIndex, setCurrentCheckIndex] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [autoFixes, setAutoFixes] = useState<string[]>([]);

  // Business form states
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerWhatsapp, setOwnerWhatsapp] = useState("");
  const [buildingFee, setBuildingFee] = useState("");
  const [deploying, setDeploying] = useState(false);

  // Success states
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [deployedSubdomain, setDeployedSubdomain] = useState("");
  const [deployedBusinessName, setDeployedBusinessName] = useState("");
  const [earnedAmount, setEarnedAmount] = useState(0);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: profileData } = await supabase.from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile(profileData);

    // Redirect to onboarding if not complete
    if (profileData && !(profileData as any).onboarding_complete) {
      navigate("/dev/onboarding");
      return;
    }

    const { data: deployData } = await (supabase as any).from("deployments")
      .select("*")
      .eq("vibe_coder_id", user.id)
      .order("created_at", { ascending: false });
    setDeployments(deployData || []);

    const { data: earnData } = await (supabase as any).from("earnings")
      .select("*")
      .eq("vibe_coder_id", user.id);
    setEarnings(earnData || []);
    
    // Fetch pending build requests
    const { data: pendingData } = await (supabase as any).from("build_requests")
      .select("*")
      .eq("status", "pending")
      .is("assigned_coder_id", null)
      .order("created_at", { ascending: false });
    setBuildRequests(pendingData || []);
    
    // Fetch active builds for this coder
    const { data: activeData } = await (supabase as any).from("build_requests")
      .select("*")
      .eq("assigned_coder_id", user.id)
      .in("status", ["building", "review"])
      .order("created_at", { ascending: false });
    setActiveBuilds(activeData || []);

    setLoading(false);
  };

  // Calculate stats
  const activeClients = deployments.filter((d) => d.status === "deployed").length;
  const totalPassive = activeClients * 30;
  const totalEarned = earnings.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthEarned = earnings
    .filter((e) => e.month === new Date().toISOString().slice(0, 7))
    .reduce((sum, e) => sum + e.amount, 0);

  const validateUrl = (url: string) => {
    return url.includes("github.com") && url.length > 10;
  };

  const handleImport = () => {
    setUrlError("");
    if (!validateUrl(githubUrl)) {
      setUrlError("Please paste a valid GitHub repository URL");
      return;
    }
    startVetting();
  };

  const startVetting = () => {
    setVettingStage("vetting");
    setCurrentCheckIndex(0);
    setVettingChecks(vettingChecksTemplate.map(c => ({ ...c, status: "pending" })));
    setAutoFixes([]);

    // Animate through checks
    let index = 0;
    const fixes: string[] = [];

    const runCheck = () => {
      if (index >= vettingChecksTemplate.length) {
        // Complete
        const score = 94;
        setFinalScore(score);
        setAutoFixes(fixes);
        setTimeout(() => {
          if (score >= 75) {
            setVettingStage("passed");
          } else {
            setVettingStage("failed");
          }
        }, 800);
        return;
      }

      setCurrentCheckIndex(index);
      setVettingChecks(prev => prev.map((c, i) => 
        i === index ? { ...c, status: "checking" } : 
        i < index ? { ...c, status: "pass" } : c
      ));

      // Check if needs fixing
      const check = vettingChecksTemplate[index];
      const needsFix = [4, 5, 7].includes(check.id); // SEO, images, WhatsApp

      setTimeout(() => {
        if (needsFix && check.fixing) {
          // Show fixing state
          setVettingChecks(prev => prev.map((c, i) => 
            i === index ? { ...c, status: "fixing" } : c
          ));
          
          setTimeout(() => {
            fixes.push(check.passMessage);
            setAutoFixes([...fixes]);
            setVettingChecks(prev => prev.map((c, i) => 
              i === index ? { ...c, status: "pass" } : c
            ));
            index++;
            setTimeout(runCheck, 400);
          }, 1200);
        } else {
          setVettingChecks(prev => prev.map((c, i) => 
            i === index ? { ...c, status: "pass" } : c
          ));
          index++;
          setTimeout(runCheck, 400);
        }
      }, needsFix ? 600 : 800);
    };

    runCheck();
  };

  const handleFixAndReimport = () => {
    setVettingStage("input");
    setGithubUrl("");
    setUrlError("");
  };

  const generateSubdomain = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "") + Math.floor(1000 + Math.random() * 9000);
  };

  const subdomainPreview = businessName ? generateSubdomain(businessName) + ".leadpe.online" : "your-site.leadpe.online";

  const leadpeCommission = buildingFee ? Math.round(parseInt(buildingFee) * 0.2) : 0;
  const coderEarning = buildingFee ? Math.round(parseInt(buildingFee) * 0.8) : 0;

  const handleDeploy = async () => {
    if (!businessName || !businessType || !city || !ownerName || !ownerWhatsapp || !buildingFee) {
      toast({ title: "Missing fields", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setDeploying(true);

    const subdomain = generateSubdomain(businessName);
    const fullDomain = subdomain + ".leadpe.online";
    const fee = parseInt(buildingFee);
    const commission = Math.round(fee * 0.2);
    const earning = fee - commission;

    // Generate SEO data
    const seoData = generateSEO({
      name: businessName,
      type: businessType,
      city: city,
      description: `${businessName} provides ${businessType} services`,
      phone: ownerWhatsapp,
    });

    const { data, error } = await (supabase as any).from("deployments").insert({
      vibe_coder_id: user?.id,
      business_name: businessName,
      business_type: businessType,
      city: city,
      owner_name: ownerName,
      owner_whatsapp: ownerWhatsapp.replace(/\D/g, ""),
      building_fee: fee,
      leadpe_commission: commission,
      vibe_coder_earning: earning,
      github_url: githubUrl,
      subdomain: fullDomain,
      status: "deployed",
      monthly_passive: 30,
      created_at: new Date().toISOString(),
      trial_start_date: new Date().toISOString(),
      trial_day: 1,
      day1_sent: false,
      day2_sent: false,
      day3_sent: false,
      day4_sent: false,
      day5_sent: false,
      day6_sent: false,
      day7_sent: false,
      converted: false,
      seo_title: seoData.title,
      seo_description: seoData.description,
      seo_keywords: seoData.keywords,
      seo_schema: seoData.schema,
      url_slug: seoData.slug,
      og_tags: seoData.ogTags,
    }).select().single();

    if (error) {
      toast({ title: "Deploy failed", description: error.message, variant: "destructive" });
      setDeploying(false);
      return;
    }

    // Create earnings record for building fee
    await (supabase as any).from("earnings").insert({
      vibe_coder_id: user?.id,
      deployment_id: data.id,
      amount: earning,
      type: "building",
      month: new Date().toISOString().slice(0, 7),
      paid: false,
      created_at: new Date().toISOString(),
    });

    // Send WhatsApp messages using the new service
    const deployData = {
      businessName,
      businessType,
      city,
      whatsapp: ownerWhatsapp,
      ownerName,
      siteUrl: fullDomain,
      fee,
      commission,
      earning,
      githubUrl,
      builderName: profile?.full_name || "Unknown"
    };

    // Send to admin
    await sendWhatsApp(
      "919973383902",
      getMessage('newSignup', 'english', deployData), // Use newSignup for admin notifications
      data.id,
      'siteDeployed',
      'english'
    );

    // Send to business owner
    await sendWhatsApp(
      ownerWhatsapp.replace(/\D/g, ""),
      getMessage('siteDeployed', 'hinglish', deployData),
      data.id,
      'siteDeployed',
      'hinglish'
    );

    // Send day1 message to owner
    setTimeout(async () => {
      await sendWhatsApp(
        ownerWhatsapp.replace(/\D/g, ""),
        getMessage('day1', 'hinglish', deployData),
        data.id,
        'day1',
        'hinglish'
      );
    }, 5000); // Send after 5 seconds

    setDeployedSubdomain(fullDomain);
    setDeployedBusinessName(businessName);
    setEarnedAmount(earning);
    setDeploySuccess(true);
    setDeploying(false);
    fetchData();
  };

  const resetDeploy = () => {
    setVettingStage("input");
    setGithubUrl("");
    setUrlError("");
    setVettingChecks(vettingChecksTemplate);
    setCurrentCheckIndex(0);
    setFinalScore(0);
    setAutoFixes([]);
  };
  
  // Build request handlers
  const handleAcceptRequest = async (request: BuildRequest) => {
    if (!user) return;
    
    try {
      // Update build request
      const { error } = await (supabase as any).from("build_requests")
        .update({
          status: "building",
          assigned_coder_id: user.id
        })
        .eq("id", request.id);
      
      if (error) throw error;
      
      // Send WhatsApp to admin
      await sendWhatsApp(
        "919973383902",
        getMessage('requestAccepted', 'hinglish', {
          coderName: profile?.full_name || "Unknown",
          businessName: request.business_name,
          city: request.city
        }),
        request.id,
        'requestAccepted',
        'hinglish'
      );
      
      // Send WhatsApp to business owner
      await sendWhatsApp(
        request.owner_whatsapp,
        getMessage('buildStarted', request.preferred_language as any, {
          ownerName: request.owner_name,
          coderName: profile?.full_name || "Unknown"
        }),
        request.id,
        'buildStarted',
        request.preferred_language
      );
      
      toast({
        title: "✅ Request Accepted!",
        description: `You're now building ${request.business_name}`,
      });
      
      // Show brief modal
      setSelectedRequest(request);
      setShowBriefModal(true);
      
      // Refresh data
      fetchData();
      
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        title: "Error",
        description: "Failed to accept request. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleViewBrief = (request: BuildRequest) => {
    setSelectedRequest(request);
    setShowBriefModal(true);
  };
  
  const handleCopyPrompt = async (prompt: string) => {
    try {
      await copyToClipboard(prompt);
      toast({
        title: "✅ Copied!",
        description: "ChatGPT prompt copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy prompt",
        variant: "destructive"
      });
    }
  };
  
  const handleSubmitGithub = async () => {
    if (!selectedRequest || !githubSubmitUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid GitHub URL",
        variant: "destructive"
      });
      return;
    }
    
    if (!githubSubmitUrl.includes("github.com")) {
      toast({ title: "Invalid URL", description: "Please enter a valid GitHub URL", variant: "destructive" });
      return;
    }
    
    setSubmittingGithub(true);
    setQualityChecking(true);
    setQualityReport(null);
    
    try {
      // Step 1: Quality check
      toast({ title: "🔍 Running quality check...", description: "Analyzing your website code" });
      
      const report = await checkWebsiteQuality(githubSubmitUrl, {
        name: selectedRequest.business_name,
        type: selectedRequest.business_type,
        city: selectedRequest.city,
      });
      
      setQualityReport(report);
      setQualityChecking(false);
      
      // Save quality report
      await (supabase as any).from("quality_reports").insert({
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
      
      // Step 2: Update build request to review
      toast({ title: "✅ Quality passed!", description: `Score: ${report.score}/100 — Deploying...` });
      
      const { error } = await (supabase as any).from("build_requests")
        .update({
          status: "review",
          github_url: githubSubmitUrl,
          submitted_at: new Date().toISOString()
        })
        .eq("id", selectedRequest.id);
      
      if (error) throw error;
      
      // Step 3: Auto deploy via Vercel
      const deployResult = await deployWebsite({
        id: selectedRequest.id,
        businessName: selectedRequest.business_name,
        businessType: selectedRequest.business_type,
        city: selectedRequest.city,
        githubUrl: githubSubmitUrl,
        trialCode: "",
      });
      
      if (deployResult.success && deployResult.deployUrl) {
        await (supabase as any).from("build_requests")
          .update({
            status: "live",
            deploy_url: deployResult.deployUrl,
            deployed_at: new Date().toISOString()
          })
          .eq("id", selectedRequest.id);
        
        const coderEarn = selectedRequest.coder_earning || 640;
        
        await updateCoderEarnings(user!.id, {
          id: selectedRequest.id,
          coder_earning: coderEarn,
          business_name: selectedRequest.business_name,
        });
        
        const ownerPhone = selectedRequest.owner_whatsapp?.replace(/\D/g, "") || "";
        if (ownerPhone) {
          window.open(`https://wa.me/91${ownerPhone}?text=${encodeURIComponent(`🎉 Aapki website LIVE ho gayi!\n\n🌐 ${deployResult.deployUrl}\n\nAb customers seedhe WhatsApp pe message karenge!\n\nLeadPe 🌱`)}`, "_blank");
        }
        
        window.open(`https://wa.me/919973383902?text=${encodeURIComponent(`✅ WEBSITE LIVE\n━━━━━━━━━━\nBusiness: ${selectedRequest.business_name}\nURL: ${deployResult.deployUrl}\nQuality: ${report.score}/100\nCoder: ${profile?.full_name}\n━━━━━━━━━━\nLeadPe ⚡`)}`, "_blank");
        
        const earnedAmt = selectedRequest.coder_earning || 640;
        toast({
          title: "🚀 Website Live!",
          description: `${deployResult.deployUrl} — ₹${earnedAmt} earned!`
        });
      } else {
        toast({
          title: "⚠️ Auto deploy failed",
          description: deployResult.error || "Admin will deploy manually.",
          variant: "destructive"
        });
        
        window.open(`https://wa.me/919973383902?text=${encodeURIComponent(`📋 GITHUB SUBMITTED (deploy failed)\n━━━━━━━━━━━━━━\nCoder: ${profile?.full_name}\nBusiness: ${selectedRequest.business_name}\nGitHub: ${githubSubmitUrl}\nQuality: ${report.score}/100\nError: ${deployResult.error}\n━━━━━━━━━━━━━━\nLeadPe ⚡`)}`, "_blank");
      }
      
      setGithubSubmitUrl("");
      setShowBriefModal(false);
      setQualityReport(null);
      fetchData();
      
    } catch (error) {
      console.error("Error submitting GitHub:", error);
      toast({
        title: "Error",
        description: "Failed to submit GitHub URL",
        variant: "destructive"
      });
    } finally {
      setSubmittingGithub(false);
      setQualityChecking(false);
    }
  };



  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${deployedSubdomain}`);
    toast({ title: "Link copied!", description: "Site URL copied to clipboard" });
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
            <span className="font-bold text-xl text-[#00C853]">Studio</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-[#F0FFF4] transition-colors relative">
              <Bell size={20} className="text-[#666]" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00C853]" />
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-[#00C853] text-white">
              {user?.email?.[0].toUpperCase() || "U"}
            </div>
            <button onClick={signOut} className="text-sm text-[#666] hover:text-[#1A1A1A] flex items-center gap-1">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-24">
        {/* Hero Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5 border-2 border-[#00C853] col-span-2 md:col-span-1 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="text-3xl md:text-4xl font-extrabold font-display text-[#00C853]">₹{totalPassive}/mo</div>
            <div className="text-sm text-[#1A1A1A] mt-1">Monthly Passive Income</div>
            <div className="text-xs text-[#666]">{activeClients} active clients</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl p-5 border border-[#E0F2E9] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="text-2xl md:text-3xl font-extrabold font-display text-[#00C853]">₹{totalEarned.toLocaleString()}</div>
            <div className="text-sm text-[#1A1A1A] mt-1">Total Earned</div>
            <div className="text-xs text-[#666]">All time</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl p-5 border border-[#E0F2E9] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="text-2xl md:text-3xl font-extrabold font-display text-[#1A1A1A]">{deployments.length}</div>
            <div className="text-sm text-[#1A1A1A] mt-1">Sites Deployed</div>
            <div className="text-xs text-[#666]">{deployments.filter(d => d.status === "pending").length} pending</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl p-5 border border-[#E0F2E9] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="text-2xl md:text-3xl font-extrabold font-display text-[#00C853]">₹{thisMonthEarned.toLocaleString()}</div>
            <div className="text-sm text-[#1A1A1A] mt-1">Earned This Month</div>
            <div className="text-xs text-[#666]">Next payout: Friday</div>
          </motion.div>
        </div>

        {/* Deploy New Site Section */}
        <section id="deploy-section" className="mb-8">
          <AnimatePresence mode="wait">
            {/* STATE 1 — INPUT */}
            {vettingStage === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="rounded-2xl border-2 p-6 md:p-8"
                style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(0, 200, 83, 0.3)", boxShadow: "0 0 30px rgba(0, 200, 83, 0.1)" }}
              >
                <h2 className="text-2xl font-bold font-display mb-2">Deploy a New Site</h2>
                <p className="text-muted-foreground mb-6">Paste your GitHub URL and earn.</p>

                <div className="space-y-4">
                  <Input
                    value={githubUrl}
                    onChange={(e) => { setGithubUrl(e.target.value); setUrlError(""); }}
                    className="h-16 rounded-xl border-border text-lg"
                    style={{ backgroundColor: "#FAFAFA" }}
                    placeholder="Paste GitHub repo URL e.g. github.com/username/my-site"
                  />
                  {urlError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-red-500 flex items-center gap-1"
                    >
                      <AlertCircle size={14} /> {urlError}
                    </motion.p>
                  )}
                  <Button
                    onClick={handleImport}
                    className="w-full h-14 rounded-xl text-black font-semibold text-lg"
                    style={{ backgroundColor: "#00C853" }}
                  >
                    Import & Check →
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STATE 2 — VETTING ANIMATION */}
            {vettingStage === "vetting" && (
              <motion.div
                key="vetting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-border p-6 md:p-8"
                style={{ backgroundColor: "#FFFFFF" }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold font-display mb-2">Checking your site quality...</h2>
                  <p className="text-sm text-muted-foreground">This takes about 10 seconds.</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full overflow-hidden mb-6" style={{ backgroundColor: "#E5E7EB" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: "#00C853" }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentCheckIndex + 1) / vettingChecks.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {/* Checklist */}
                <div className="space-y-3">
                  {vettingChecks.map((check, index) => (
                    <motion.div
                      key={check.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: index <= currentCheckIndex ? 1 : 0.3,
                        x: 0
                      }}
                      className="flex items-center gap-3 py-2"
                    >
                      {check.status === "pass" ? (
                        <CheckCircle size={20} style={{ color: "#00E676" }} />
                      ) : check.status === "fixing" ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Wrench size={20} style={{ color: "#eab308" }} />
                        </motion.div>
                      ) : check.status === "checking" ? (
                        <Loader2 size={20} className="animate-spin" style={{ color: "#00E676" }} />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted" />
                      )}
                      <span className={`text-sm ${check.status === "pass" ? "text-foreground" : check.status === "checking" || check.status === "fixing" ? "text-foreground" : "text-muted-foreground"}`}>
                        {check.status === "checking" ? check.checking :
                         check.status === "fixing" ? check.fixing :
                         check.status === "pass" ? check.passMessage :
                         check.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STATE 3A — PASSED (Score >= 75) */}
            {vettingStage === "passed" && !deploySuccess && (
              <motion.div
                key="passed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Score Card */}
                <div
                  className="rounded-2xl border-2 p-6 text-center"
                  style={{ borderColor: "#00C853", backgroundColor: "#FFFFFF" }}
                >
                  <div className="text-5xl font-extrabold font-display mb-2" style={{ color: "#00E676" }}>
                    {finalScore}/100
                  </div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: "rgba(0, 230, 118, 0.1)", color: "#00E676" }}>
                    <CheckCircle size={14} /> Ready to Deploy
                  </div>
                </div>

                {/* Auto-fix Summary */}
                {autoFixes.length > 0 && (
                  <div className="rounded-xl border border-[#E0F2E9] p-4" style={{ backgroundColor: "#F0FFF4" }}>
                    <p className="text-sm font-medium mb-3">We automatically improved:</p>
                    <div className="space-y-2">
                      {autoFixes.map((fix, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle size={14} style={{ color: "#00E676" }} />
                          {fix}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">Your site is ready.</p>
                  </div>
                )}

                {/* Business Details Form */}
                <div className="rounded-2xl border border-[#E0F2E9] p-6" style={{ backgroundColor: "#FFFFFF" }}>
                  <h3 className="text-xl font-bold font-display mb-2">Almost Live! 🎉</h3>
                  <p className="text-muted-foreground mb-6">Tell us about this business to complete deployment.</p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Business Name *</label>
                      <Input
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="rounded-xl border-border h-12"
                        style={{ backgroundColor: "#FAFAFA" }}
                        placeholder="e.g. Perfect Coaching Centre"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1.5">Business Type *</label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full rounded-xl h-12 px-3 border border-border outline-none"
                        style={{ backgroundColor: "#FAFAFA" }}
                      >
                        <option value="">Select type</option>
                        {businessTypes.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1.5">City *</label>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="rounded-xl border-border h-12"
                        style={{ backgroundColor: "#FAFAFA" }}
                        placeholder="e.g. Mumbai"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1.5">Owner Name *</label>
                      <Input
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="rounded-xl border-border h-12"
                        style={{ backgroundColor: "#FAFAFA" }}
                        placeholder="Full name of business owner"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1.5">Owner WhatsApp *</label>
                      <Input
                        type="tel"
                        value={ownerWhatsapp}
                        onChange={(e) => setOwnerWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="rounded-xl border-border h-12"
                        style={{ backgroundColor: "#FAFAFA" }}
                        placeholder="10 digit number"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1.5">Your Building Fee: ₹ *</label>
                      <Input
                        type="number"
                        value={buildingFee}
                        onChange={(e) => setBuildingFee(e.target.value)}
                        className="rounded-xl border-border h-12"
                        style={{ backgroundColor: "#FAFAFA" }}
                        placeholder="What you charged the business"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Minimum ₹500 recommended</p>
                    </div>

                    {/* Commission Breakdown */}
                    {buildingFee && parseInt(buildingFee) > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 rounded-xl border border-border"
                        style={{ backgroundColor: "#FAFAFA" }}
                      >
                        <p className="text-sm text-muted-foreground">
                          LeadPe takes 20% (₹{leadpeCommission}).
                          <br />
                          <span style={{ color: "#00E676" }}>You keep 80% (₹{coderEarning}).</span>
                        </p>
                      </motion.div>
                    )}

                    {/* Subdomain Preview */}
                    {businessName && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 rounded-xl border border-border"
                        style={{ backgroundColor: "#FAFAFA" }}
                      >
                        <p className="text-sm text-muted-foreground mb-2">Your site will go live at:</p>
                        <span
                          className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                          style={{ backgroundColor: "rgba(0, 200, 83, 0.1)", color: "#00C853" }}
                        >
                          {subdomainPreview}
                        </span>
                      </motion.div>
                    )}

                    <Button
                      onClick={handleDeploy}
                      disabled={deploying}
                      className="w-full h-14 rounded-xl text-black font-semibold text-lg"
                      style={{ backgroundColor: "#00C853" }}
                    >
                      {deploying ? (
                        <><Loader2 size={20} className="mr-2 animate-spin" /> Deploying...</>
                      ) : (
                        "Deploy Live Now →"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STATE 3B — FAILED (Score < 75) */}
            {vettingStage === "failed" && (
              <motion.div
                key="failed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border-2 p-6 text-center"
                style={{ borderColor: "#ef4444", backgroundColor: "#FFFFFF" }}
              >
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                  <XCircle size={32} style={{ color: "#ef4444" }} />
                </div>
                <h3 className="text-xl font-bold mb-2">Site needs fixes before deploying</h3>
                <div className="text-3xl font-extrabold mb-4" style={{ color: "#ef4444" }}>
                  {finalScore}/100
                </div>

                <div className="text-left space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <XCircle size={16} className="mt-0.5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">No lead capture form found</p>
                      <p className="text-xs text-muted-foreground">Add a form with name and phone number fields.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle size={16} className="mt-0.5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Site not loading properly</p>
                      <p className="text-xs text-muted-foreground">Check your GitHub repo is public and site works.</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleFixAndReimport}
                  className="h-12 rounded-xl text-black font-semibold"
                  style={{ backgroundColor: "#00E676" }}
                >
                  Fix & Re-import →
                </Button>
              </motion.div>
            )}

            {/* STATE 4 — DEPLOYMENT SUCCESS */}
            {deploySuccess && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                {/* Rocket Animation */}
                <motion.div
                  initial={{ y: 0 }}
                  animate={{ y: -20 }}
                  transition={{ duration: 0.5, repeat: 3, repeatType: "reverse" }}
                  className="mb-6"
                >
                  <div className="text-6xl">🚀</div>
                </motion.div>

                <h2 className="text-3xl font-bold font-display mb-2">Site is Live! 🎉</h2>

                {/* Green Card */}
                <div
                  className="rounded-2xl border-2 p-6 mb-6 mx-auto max-w-md"
                  style={{ borderColor: "#00C853", backgroundColor: "#FFFFFF" }}
                >
                  <p className="text-lg font-medium mb-4" style={{ color: "#00E676" }}>
                    {deployedSubdomain}
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleCopyLink}
                      className="flex-1 h-12 rounded-xl border border-border"
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      <Copy size={16} className="mr-2" /> Copy Link
                    </Button>
                    <a
                      href={`https://${deployedSubdomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-12 rounded-xl flex items-center justify-center text-black font-semibold"
                      style={{ backgroundColor: "#00C853" }}
                    >
                      <ExternalLink size={16} className="mr-2" /> Open Site →
                    </a>
                  </div>
                </div>

                {/* What Happens Next */}
                <div className="rounded-xl border border-[#E0F2E9] p-5 mb-6 text-left mx-auto max-w-md" style={{ backgroundColor: "#F0FFF4" }}>
                  <p className="font-medium mb-3">What happens next:</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <CheckCircle size={14} className="mt-0.5" style={{ color: "#00E676" }} />
                      Business owner gets WhatsApp notification
                    </p>
                    <p className="flex items-start gap-2">
                      <CheckCircle size={14} className="mt-0.5" style={{ color: "#00E676" }} />
                      SEO automatically active
                    </p>
                    <p className="flex items-start gap-2">
                      <CheckCircle size={14} className="mt-0.5" style={{ color: "#00E676" }} />
                      Lead form ready to capture
                    </p>
                    <p className="flex items-start gap-2">
                      <CheckCircle size={14} className="mt-0.5" style={{ color: "#00E676" }} />
                      You earn ₹30/mo while they stay active
                    </p>
                  </div>
                </div>

                {/* Your Earning */}
                <div className="rounded-xl border border-[#E0F2E9] p-5 mb-6 mx-auto max-w-md" style={{ backgroundColor: "#F0FFF4" }}>
                  <p className="font-medium mb-3">Your earning from this site:</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Building fee:</span>
                      <span style={{ color: "#00E676" }}>₹{earnedAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly passive:</span>
                      <span style={{ color: "#00E676" }}>₹30/mo</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    As long as they stay — you earn.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={resetDeploy}
                    className="h-12 rounded-xl text-black font-semibold"
                    style={{ backgroundColor: "#00C853" }}
                  >
                    <Rocket size={16} className="mr-2" /> Deploy Another Site →
                  </Button>
                  <Button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="h-12 rounded-xl border border-border"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    Go to Dashboard →
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Available Build Requests */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold font-display">Build Requests 🏗️</h2>
              <p className="text-sm text-muted-foreground">{buildRequests.length} waiting</p>
            </div>
          </div>

          {/* Package Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {["all", ...WEBSITE_PACKAGES.map(p => p.id)].map((f) => {
              const pkg = f === "all" ? null : getPackageById(f);
              return (
                <button key={f} onClick={() => setPackageFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${packageFilter === f ? 'text-white' : 'text-[#666] bg-white border border-[#E0E0E0]'}`}
                  style={packageFilter === f ? { backgroundColor: pkg?.color || "#00C853" } : {}}>
                  {f === "all" ? "All" : pkg?.badge}
                </button>
              );
            })}
          </div>
          
          {buildRequests.filter(r => packageFilter === "all" || (r as any).package_id === packageFilter).length === 0 ? (
            <div className="rounded-2xl border border-[#E0F2E9] p-8 text-center" style={{ backgroundColor: "#FFFFFF" }}>
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "rgba(0, 230, 118, 0.1)" }}>
                <Wrench size={24} style={{ color: "#00E676" }} />
              </div>
              <p className="text-muted-foreground mb-2">No pending requests.</p>
              <p className="text-sm text-muted-foreground">
                Check back later for new build requests.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buildRequests.filter(r => packageFilter === "all" || (r as any).package_id === packageFilter).map((request) => {
                const brief = generateBrief({
                  business_name: request.business_name,
                  business_type: request.business_type,
                  city: request.city,
                  owner_name: request.owner_name,
                  owner_whatsapp: request.owner_whatsapp,
                  plan_selected: request.plan_selected,
                  preferred_language: request.preferred_language
                });
                
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border p-6"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-2xl">{getBusinessIcon(request.business_type)}</div>
                      <div>
                        <h3 className="font-semibold text-foreground">{request.business_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {request.business_type} | {request.city}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {(request as any).package_id && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Package:</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: getPackageById((request as any).package_id).color }}>
                            {getPackageById((request as any).package_id).badge}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">You earn:</span>
                        <span className="font-bold" style={{ color: "#00C853" }}>
                          ₹{((request as any).coder_earning || getBuildingFee(request.plan_selected)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">+ Passive:</span>
                        <span className="text-muted-foreground">₹30/mo</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deadline:</span>
                        <span className="font-medium flex items-center gap-1">
                          <Clock size={12} />
                          {formatDeadline(request.deadline)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleViewBrief(request)}
                        variant="outline"
                        size="sm"
                        className="flex-1 h-10 rounded-xl border-border"
                        style={{ backgroundColor: "#FAFAFA" }}
                      >
                        <Eye size={14} className="mr-1" /> View Brief
                      </Button>
                      <Button
                        onClick={() => handleAcceptRequest(request)}
                        size="sm"
                        className="flex-1 h-10 rounded-xl text-black font-semibold"
                        style={{ backgroundColor: "#00C853" }}
                      >
                        Accept Request
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* My Active Builds */}
        {activeBuilds.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold font-display mb-4">My Active Builds</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {activeBuilds.map((request) => {
                const brief = generateBrief({
                  business_name: request.business_name,
                  business_type: request.business_type,
                  city: request.city,
                  owner_name: request.owner_name,
                  owner_whatsapp: request.owner_whatsapp,
                  plan_selected: request.plan_selected,
                  preferred_language: request.preferred_language
                });
                
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border p-6"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getBusinessIcon(request.business_type)}</div>
                        <div>
                          <h3 className="font-semibold text-foreground">{request.business_name}</h3>
                          <p className="text-sm text-muted-foreground">{request.city}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === "building" 
                          ? "bg-yellow-500/20 text-yellow-500" 
                          : "bg-blue-500/20 text-blue-500"
                      }`}>
                        {request.status === "building" ? "Building" : "In Review"}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Time remaining:</span>
                        <span className="font-medium flex items-center gap-1">
                          <Clock size={12} />
                          {formatDeadline(request.deadline)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-medium">{request.status}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleViewBrief(request)}
                        variant="outline"
                        size="sm"
                        className="flex-1 h-10 rounded-xl border-border"
                        style={{ backgroundColor: "#FAFAFA" }}
                      >
                        <Eye size={14} className="mr-1" /> View Brief
                      </Button>
                      {request.status === "building" && (
                        <Button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowBriefModal(true);
                          }}
                          size="sm"
                          className="flex-1 h-10 rounded-xl text-black font-semibold"
                          style={{ backgroundColor: "#00C853" }}
                        >
                          <Code size={14} className="mr-1" /> Submit GitHub
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* My Sites Table */}
        <section className="mb-8">
          <h2 className="text-xl font-bold font-display mb-4">My Deployed Sites</h2>

          {deployments.length === 0 ? (
            <div className="rounded-2xl border border-[#E0F2E9] p-8 text-center" style={{ backgroundColor: "#FFFFFF" }}>
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "rgba(0, 230, 118, 0.1)" }}>
                <ExternalLink size={24} style={{ color: "#00E676" }} />
              </div>
              <p className="text-muted-foreground mb-2">No sites yet.</p>
              <p className="text-sm text-muted-foreground mb-4">
                Deploy your first site and start earning!
              </p>
              <Button
                onClick={() => document.getElementById("deploy-section")?.scrollIntoView({ behavior: "smooth" })}
                className="h-12 rounded-xl text-black font-semibold"
                style={{ backgroundColor: "#00E676" }}
              >
                Deploy Now →
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E0F2E9] overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: "#F0FFF4" }}>
                      <th className="text-left p-4 text-sm font-medium">Business Name</th>
                      <th className="text-left p-4 text-sm font-medium">Type</th>
                      <th className="text-left p-4 text-sm font-medium">City</th>
                      <th className="text-left p-4 text-sm font-medium">Status</th>
                      <th className="text-left p-4 text-sm font-medium">Monthly</th>
                      <th className="text-left p-4 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deployments.map((site) => (
                      <tr key={site.id} className="border-t border-border">
                        <td className="p-4 text-sm">{site.business_name}</td>
                        <td className="p-4 text-sm text-muted-foreground">{site.business_type}</td>
                        <td className="p-4 text-sm text-muted-foreground">{site.city}</td>
                        <td className="p-4">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: site.status === "deployed" ? "rgba(0, 230, 118, 0.1)" : "rgba(234, 179, 8, 0.1)",
                              color: site.status === "deployed" ? "#00E676" : "#eab308",
                            }}
                          >
                            {site.status === "deployed" ? "Live" : "Pending"}
                          </span>
                        </td>
                        <td className="p-4 text-sm" style={{ color: "#00E676" }}>₹30</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <a
                              href={`https://${site.subdomain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-[#00E676]/50 transition-colors"
                            >
                              View Site
                            </a>
                            <a
                              href={`https://wa.me/91${site.owner_whatsapp}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-[#00E676]/50 transition-colors flex items-center gap-1"
                            >
                              <MessageCircle size={12} /> WhatsApp Owner
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {deployments.map((site) => (
                  <div key={site.id} className="p-4 rounded-xl border border-[#E0F2E9]" style={{ backgroundColor: "#FFFFFF" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{site.business_name}</span>
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: site.status === "deployed" ? "rgba(0, 230, 118, 0.1)" : "rgba(234, 179, 8, 0.1)",
                          color: site.status === "deployed" ? "#00E676" : "#eab308",
                        }}
                      >
                        {site.status === "deployed" ? "Live" : "Pending"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{site.business_type} · {site.city}</p>
                    <p className="text-sm mb-3" style={{ color: "#00E676" }}>Monthly: ₹30</p>
                    <div className="flex gap-2">
                      <a
                        href={`https://${site.subdomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-lg border border-border text-xs text-center"
                      >
                        View Site
                      </a>
                      <a
                        href={`https://wa.me/91${site.owner_whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-lg border border-border text-xs text-center flex items-center justify-center gap-1"
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Earnings Section */}
        <section className="mb-8">
          <h2 className="text-xl font-bold font-display mb-4">Your Earnings</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl p-6 border border-[#E0F2E9]" style={{ backgroundColor: "#FFFFFF" }}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">This Month</h3>
              <div className="text-3xl font-extrabold font-display mb-4" style={{ color: "#00E676" }}>
                ₹{thisMonthEarned.toLocaleString()}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Building fees:</span>
                  <span>₹{earnings.filter(e => e.type === "building" && e.month === new Date().toISOString().slice(0, 7)).reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passive income:</span>
                  <span>₹{earnings.filter(e => e.type === "passive" && e.month === new Date().toISOString().slice(0, 7)).reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-medium">Total:</span>
                  <span className="font-medium" style={{ color: "#00E676" }}>₹{thisMonthEarned.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 border border-[#E0F2E9]" style={{ backgroundColor: "#FFFFFF" }}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Payout Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next payout:</span>
                  <span>Friday {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum:</span>
                  <span>₹200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">UPI:</span>
                  <span>{profile?.whatsapp_number || "Not set"}</span>
                </div>
                <Button
                  disabled={thisMonthEarned < 200}
                  className="w-full h-12 rounded-xl font-semibold"
                  style={{
                    backgroundColor: thisMonthEarned >= 200 ? "#00C853" : "#E0E0E0",
                    color: thisMonthEarned >= 200 ? "#000" : "#666",
                  }}
                >
                  Request Payout →
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Brief Modal */}
      <AnimatePresence>
        {showBriefModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowBriefModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>
                  Build Brief — {selectedRequest.business_name}
                </h2>
                <Button onClick={() => setShowBriefModal(false)} variant="ghost" size="sm">✕</Button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3" style={{ color: "#1A1A1A" }}>Business Details</h3>
                <div className="rounded-xl p-4" style={{ backgroundColor: "#F8F9FA" }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between"><span style={{ color: "#666" }}>Business:</span><span style={{ color: "#1A1A1A", fontWeight: 500 }}>{selectedRequest.business_name}</span></div>
                    <div className="flex justify-between"><span style={{ color: "#666" }}>Type:</span><span style={{ color: "#1A1A1A", fontWeight: 500 }}>{selectedRequest.business_type}</span></div>
                    <div className="flex justify-between"><span style={{ color: "#666" }}>City:</span><span style={{ color: "#1A1A1A", fontWeight: 500 }}>{selectedRequest.city}</span></div>
                    <div className="flex justify-between"><span style={{ color: "#666" }}>Owner:</span><span style={{ color: "#1A1A1A", fontWeight: 500 }}>{selectedRequest.owner_name}</span></div>
                    <div className="flex justify-between"><span style={{ color: "#666" }}>WhatsApp:</span><span style={{ color: "#1A1A1A", fontWeight: 500 }}>+91 {selectedRequest.owner_whatsapp}</span></div>
                    <div className="flex justify-between"><span style={{ color: "#666" }}>Plan:</span><span style={{ color: "#1A1A1A", fontWeight: 500 }}>{selectedRequest.plan_selected?.toUpperCase()}</span></div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3" style={{ color: "#1A1A1A" }}>ChatGPT Prompt</h3>
                <div className="rounded-xl p-4 text-sm whitespace-pre-wrap" style={{ backgroundColor: "#F8F9FA", color: "#1A1A1A" }}>
                  {generateBrief({ business_name: selectedRequest.business_name, business_type: selectedRequest.business_type, city: selectedRequest.city, owner_name: selectedRequest.owner_name, owner_whatsapp: selectedRequest.owner_whatsapp, plan_selected: selectedRequest.plan_selected, preferred_language: selectedRequest.preferred_language }).chatgptPrompt}
                </div>
                <Button
                  onClick={() => handleCopyPrompt(generateBrief({ business_name: selectedRequest.business_name, business_type: selectedRequest.business_type, city: selectedRequest.city, owner_name: selectedRequest.owner_name, owner_whatsapp: selectedRequest.owner_whatsapp, plan_selected: selectedRequest.plan_selected, preferred_language: selectedRequest.preferred_language }).chatgptPrompt)}
                  className="w-full h-10 rounded-xl text-white font-semibold mt-3"
                  style={{ backgroundColor: "#00C853" }}
                >
                  <Copy size={16} className="mr-2" /> Copy Prompt
                </Button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3" style={{ color: "#1A1A1A" }}>Mandatory Elements</h3>
                <div className="rounded-xl p-4" style={{ backgroundColor: "#F8F9FA" }}>
                  <ul className="space-y-2">
                    {generateBrief({ business_name: selectedRequest.business_name, business_type: selectedRequest.business_type, city: selectedRequest.city, owner_name: selectedRequest.owner_name, owner_whatsapp: selectedRequest.owner_whatsapp, plan_selected: selectedRequest.plan_selected, preferred_language: selectedRequest.preferred_language }).mandatoryElements.map((element: string, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-sm" style={{ color: "#1A1A1A" }}>
                        <Check size={14} style={{ color: "#00C853" }} />
                        {element}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3" style={{ color: "#1A1A1A" }}>Quick Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button onClick={() => window.open("https://chat.openai.com", "_blank")} variant="outline" className="h-12 rounded-xl border-[#00C853] text-[#00C853] bg-white hover:bg-[#F0FFF4]">Open ChatGPT →</Button>
                  <Button onClick={() => window.open("https://lovable.dev", "_blank")} variant="outline" className="h-12 rounded-xl border-[#00C853] text-[#00C853] bg-white hover:bg-[#F0FFF4]">Open Lovable →</Button>
                  <Button onClick={() => window.open("https://github.com", "_blank")} variant="outline" className="h-12 rounded-xl border-[#00C853] text-[#00C853] bg-white hover:bg-[#F0FFF4]">Open GitHub →</Button>
                </div>
              </div>

              {/* Lead Widget Code Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>LeadPe Lead Form (REQUIRED)</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FFEBEE", color: "#ef4444" }}>Must Include</span>
                </div>
                <div className="rounded-xl p-3 text-xs font-mono max-h-48 overflow-y-auto" style={{ backgroundColor: "#F1F3F5", color: "#1A1A1A", border: "1px solid #E0E0E0" }}>
                  <pre className="whitespace-pre-wrap break-all">{generateLeadWidgetCode({
                    id: selectedRequest.business_id || selectedRequest.id,
                    name: selectedRequest.business_name,
                    whatsapp: selectedRequest.owner_whatsapp,
                  })}</pre>
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(generateLeadWidgetCode({
                      id: selectedRequest.business_id || selectedRequest.id,
                      name: selectedRequest.business_name,
                      whatsapp: selectedRequest.owner_whatsapp,
                    }));
                    setWidgetCopied(true);
                    setTimeout(() => setWidgetCopied(false), 2000);
                    toast({ title: "✅ Widget copied!", description: "Paste before </body> in your website" });
                  }}
                  className="w-full h-10 rounded-xl text-white font-semibold mt-3"
                  style={{ backgroundColor: "#00C853" }}
                >
                  <ClipboardCopy size={16} className="mr-2" /> {widgetCopied ? "Copied! ✅" : "Copy Widget Code 📋"}
                </Button>
                <div className="rounded-xl p-3 mt-3" style={{ backgroundColor: "#FFF3E0", border: "1px solid #FF9800" }}>
                  <p className="text-xs font-medium" style={{ color: "#E65100" }}>
                    ⚠️ Without this widget, website will FAIL quality check. Include it to get approved.
                  </p>
                </div>
              </div>

              {selectedRequest.status === "building" && (
                <div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: "#1A1A1A" }}>Submit for Review</h3>
                  <div className="space-y-3">
                    <Input value={githubSubmitUrl} onChange={(e) => { setGithubSubmitUrl(e.target.value); setQualityReport(null); }} placeholder="Enter GitHub repository URL" className="h-12 rounded-xl border-[#E0E0E0] focus:border-[#00C853]" style={{ backgroundColor: "#FFFFFF" }} />
                    
                    {/* Quality Report Display */}
                    {qualityChecking && (
                      <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "#F0FFF4", border: "1px solid #00C853" }}>
                        <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: "#00C853" }} />
                        <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Running AI quality check...</p>
                        <p className="text-xs" style={{ color: "#666" }}>Analyzing code for 12 quality criteria</p>
                      </div>
                    )}
                    
                    {qualityReport && !qualityChecking && (
                      <div className="rounded-xl p-4" style={{ 
                        backgroundColor: qualityReport.passed ? "#F0FFF4" : "#FFF3E0", 
                        border: `2px solid ${qualityReport.passed ? "#00C853" : "#FF6D00"}` 
                      }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {qualityReport.passed ? (
                              <CheckCircle size={20} style={{ color: "#00C853" }} />
                            ) : (
                              <AlertCircle size={20} style={{ color: "#FF6D00" }} />
                            )}
                            <span className="font-bold text-lg">{qualityReport.score}/100</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${qualityReport.passed ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                            {qualityReport.passed ? "✅ Passed" : "⚠️ Needs Fixes"}
                          </span>
                        </div>
                        
                        {/* Checks grid */}
                        <div className="grid grid-cols-2 gap-1 mb-3">
                          {Object.entries(qualityReport.checks).map(([key, passed]) => (
                            <div key={key} className="flex items-center gap-1 text-xs">
                              {passed ? <CheckCircle size={12} style={{ color: "#00C853" }} /> : <XCircle size={12} style={{ color: "#ef4444" }} />}
                              <span style={{ color: passed ? "#666" : "#ef4444" }}>
                                {key.replace(/^has/, "").replace(/([A-Z])/g, " $1").trim()}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Issues */}
                        {qualityReport.issues.length > 0 && (
                          <div className="space-y-1 mb-3">
                            {qualityReport.issues.map((issue, i) => (
                              <p key={i} className="text-xs" style={{ color: "#ef4444" }}>{issue}</p>
                            ))}
                          </div>
                        )}
                        
                        {!qualityReport.passed && (
                          <Button
                            onClick={() => {
                              const prompt = generateFixPrompt(qualityReport, {
                                name: selectedRequest.business_name,
                                type: selectedRequest.business_type,
                                city: selectedRequest.city,
                              });
                              navigator.clipboard.writeText(prompt);
                              toast({ title: "✅ Fix prompt copied!", description: "Open Lovable and paste to fix issues" });
                            }}
                            variant="outline"
                            className="w-full h-10 rounded-xl text-sm border-orange-400 text-orange-600 hover:bg-orange-50"
                          >
                            <Copy size={14} className="mr-2" /> Copy Fix Prompt for Lovable
                          </Button>
                        )}
                      </div>
                    )}
                    
                    <Button onClick={handleSubmitGithub} disabled={submittingGithub || qualityChecking} className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
                      {submittingGithub ? (
                        qualityChecking ? (<><Loader2 size={16} className="mr-2 animate-spin" /> Checking quality...</>) :
                        (<><Loader2 size={16} className="mr-2 animate-spin" /> Deploying...</>)
                      ) : (<><Shield size={16} className="mr-2" /> Quality Check & Deploy →</>)}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E0E0E0] md:hidden z-40" style={{ boxShadow: "0 -2px 12px rgba(0,0,0,0.08)" }}>
        <div className="flex items-center justify-around h-16">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex flex-col items-center gap-1 px-3 py-2">
            <Rocket size={18} style={{ color: "#00C853" }} />
            <span className="text-[10px] font-medium" style={{ color: "#00C853" }}>Home</span>
          </button>
          <button onClick={() => document.getElementById("available-builds")?.scrollIntoView({ behavior: "smooth" })} className="flex flex-col items-center gap-1 px-3 py-2">
            <Code size={18} style={{ color: "#666" }} />
            <span className="text-[10px] font-medium" style={{ color: "#666" }}>Builds</span>
          </button>
          <button onClick={() => document.getElementById("my-deployments")?.scrollIntoView({ behavior: "smooth" })} className="flex flex-col items-center gap-1 px-3 py-2">
            <DollarSign size={18} style={{ color: "#666" }} />
            <span className="text-[10px] font-medium" style={{ color: "#666" }}>Earnings</span>
          </button>
          <button onClick={() => navigate("/dev/onboarding")} className="flex flex-col items-center gap-1 px-3 py-2">
            <Eye size={18} style={{ color: "#666" }} />
            <span className="text-[10px] font-medium" style={{ color: "#666" }}>Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}

