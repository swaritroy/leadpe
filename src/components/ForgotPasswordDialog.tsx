import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_WHATSAPP } from "@/lib/constants";

type Mode = "studio" | "business";

interface Props {
  open: boolean;
  onClose: () => void;
  mode: Mode;
}

const ADMIN_PHONE = (ADMIN_WHATSAPP || "+919973383902").replace(/\D/g, "");

export default function ForgotPasswordDialog({ open, onClose, mode }: Props) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const reset = () => {
    setValue("");
    setError("");
    setSent(false);
    setLoading(false);
  };

  const handleStudioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const email = value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    const { error: rpErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (rpErr) { setError(rpErr.message); return; }
    setSent(true);
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const phone = value.replace(/\D/g, "");
    if (phone.length !== 10 || !/^[6-9]/.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setLoading(true);
    // Log the request so admin can action it
    try {
      await supabase.from("auth_events").insert({
        event: "password_reset_request",
        intent: "business",
        email: phone + "@leadpe.com",
        details: { phone, source: "forgot_password_dialog" },
      } as any);
    } catch {}
    setLoading(false);
    setSent(true);
  };

  const waMessage = encodeURIComponent(
    `Hi LeadPe Admin, I forgot my LeadPe business password. My registered phone: ${value.replace(/\D/g, "")}. Please help me reset it.`
  );
  const waLink = `https://wa.me/${ADMIN_PHONE}?text=${waMessage}`;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); reset(); } }}>
      <DialogContent className="max-w-[420px] rounded-2xl">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Syne, sans-serif", color: "#1A1A1A" }}>
            {mode === "studio" ? "Reset Studio password" : "Forgot password"}
          </DialogTitle>
          <DialogDescription style={{ fontFamily: "DM Sans, sans-serif", color: "#666" }}>
            {mode === "studio"
              ? "Enter your registered email. We'll send you a secure reset link."
              : "Business accounts use phone-based login, so we can't email a reset link. Send a quick WhatsApp request and admin will reset it for you."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-xl text-sm text-center" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", fontFamily: "DM Sans, sans-serif" }}>
            {error}
          </div>
        )}

        {sent ? (
          mode === "studio" ? (
            <div className="p-4 rounded-xl text-sm" style={{ backgroundColor: "rgba(0,200,83,0.08)", color: "#00863a", border: "1px solid rgba(0,200,83,0.25)", fontFamily: "DM Sans, sans-serif" }}>
              ✅ If that email is registered, a reset link is on the way. Check your inbox (and spam folder) and click the link to set a new password.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-xl text-sm" style={{ backgroundColor: "rgba(0,200,83,0.08)", color: "#00863a", border: "1px solid rgba(0,200,83,0.25)", fontFamily: "DM Sans, sans-serif" }}>
                ✅ Request logged. Tap the button below to message admin on WhatsApp — your password will be reset within a few minutes.
              </div>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-[52px] rounded-xl font-semibold text-base text-center leading-[52px]"
                style={{ backgroundColor: "#25D366", color: "#fff", fontFamily: "DM Sans, sans-serif" }}
              >
                💬 Message Admin on WhatsApp
              </a>
            </div>
          )
        ) : (
          <form onSubmit={mode === "studio" ? handleStudioSubmit : handleBusinessSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: "#444", fontFamily: "DM Sans, sans-serif" }}>
                {mode === "studio" ? "Email" : "Registered phone number"}
              </label>
              <Input
                type={mode === "studio" ? "email" : "tel"}
                inputMode={mode === "studio" ? "email" : "numeric"}
                maxLength={mode === "studio" ? undefined : 10}
                placeholder={mode === "studio" ? "you@gmail.com" : "98765 43210"}
                value={value}
                onChange={(e) => setValue(mode === "studio" ? e.target.value : e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="h-[48px] rounded-xl text-base"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] rounded-xl font-semibold text-base transition-all disabled:opacity-60"
              style={{ backgroundColor: "#00C853", color: "#fff", fontFamily: "DM Sans, sans-serif" }}
            >
              {loading ? "Please wait..." : mode === "studio" ? "Send reset link" : "Continue"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
