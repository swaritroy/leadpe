import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import LeadPeLogo from "@/components/LeadPeLogo";

const BUSINESS_TYPES = [
  "Doctor / Clinic",
  "CA / Lawyer / CS",
  "Coaching Institute",
  "Contractor / Plumber",
  "Photographer / Videographer",
  "Architect / Interior Designer",
  "Gym / Fitness Trainer",
  "Digital Agency",
  "Individual Consultant",
  "Other",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [whatsapp, setWhatsapp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");

  // Pre-fill from existing profile
  useEffect(() => {
    if (profile) {
      if (profile.whatsapp_number) setWhatsapp(profile.whatsapp_number);
      if (profile.business_name) setBusinessName(profile.business_name);
      if (profile.business_type) setBusinessType(profile.business_type);
      if (profile.city) setCity(profile.city);

      // If already complete, redirect
      if (profile.whatsapp_number && profile.business_name && profile.business_type && profile.city) {
        navigate("/client/dashboard", { replace: true });
      }
    }
  }, [profile, navigate]);

  const needsWhatsapp = !profile?.whatsapp_number;
  const needsBusinessName = !profile?.business_name;

  const handleSubmit = useCallback(async () => {
    if (needsWhatsapp && whatsapp.length !== 10) {
      toast({ title: "Enter a valid 10-digit WhatsApp number.", variant: "destructive" });
      return;
    }
    if (needsBusinessName && !businessName.trim()) {
      toast({ title: "Please enter your business name.", variant: "destructive" });
      return;
    }
    if (!businessType) {
      toast({ title: "Please select your business type.", variant: "destructive" });
      return;
    }
    if (!city.trim()) {
      toast({ title: "Please enter your city.", variant: "destructive" });
      return;
    }

    if (!user) return;
    setLoading(true);

    const updates: Record<string, string> = {
      business_type: businessType,
      city: city.trim(),
    };
    if (needsWhatsapp) updates.whatsapp_number = whatsapp;
    if (needsBusinessName) updates.business_name = businessName.trim();

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Something went wrong. Try again.", variant: "destructive" });
      setLoading(false);
      return;
    }

    await refreshProfile();
    navigate("/client/dashboard", { replace: true });
  }, [whatsapp, businessName, businessType, city, user, needsWhatsapp, needsBusinessName, navigate, refreshProfile, toast]);

  const labelStyle = { color: "#444", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 500 as const };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[460px]">
        <div className="text-center mb-6">
          <LeadPeLogo theme="light" size="lg" />
        </div>

        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h1 className="text-[22px] font-bold mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>
            Almost there! 👋
          </h1>
          <p className="text-sm mb-6" style={{ color: "#666", fontFamily: "DM Sans, sans-serif" }}>
            Tell us about your business so we can build your website correctly.
          </p>

          <div className="space-y-4">
            {needsWhatsapp && (
              <div>
                <label style={labelStyle}>WhatsApp Number *</label>
                <Input
                  type="tel"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="h-[48px] rounded-xl text-base"
                />
                <p className="text-xs mt-1" style={{ color: "#999", fontFamily: "DM Sans, sans-serif" }}>
                  All customer inquiries come directly here.
                </p>
              </div>
            )}

            {needsBusinessName && (
              <div>
                <label style={labelStyle}>Business Name *</label>
                <Input
                  placeholder="Dr. Sharma Clinic"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="h-[48px] rounded-xl text-base"
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Business Type *</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full h-[48px] rounded-xl text-base border px-3"
                style={{ borderColor: "#E0E0E0", fontFamily: "DM Sans, sans-serif", color: businessType ? "#1A1A1A" : "#999" }}
              >
                <option value="" disabled>Select your business type</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>City *</label>
              <Input
                placeholder="Patna, Bihar"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-[48px] rounded-xl text-base"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-[52px] rounded-xl font-semibold text-base transition-all disabled:opacity-60 mt-6"
            style={{ backgroundColor: "#00C853", color: "#fff", fontFamily: "DM Sans, sans-serif" }}
          >
            {loading ? "Saving..." : "Continue to Dashboard →"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
