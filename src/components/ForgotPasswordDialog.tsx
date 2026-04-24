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

const ADMIN_PHONE = (ADMIN_WHATSAPP || "919973383902").replace(/\D/g, "");

export default function ForgotPasswordDialog({ open, onClose, mode }: Props) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [resolvedName, setResolvedName] = useState<string>("");

  const reset = () => {
    setPhone("");
    setError("");
    setSent(false);
    setLoading(false);
    setResolvedName("");
  };

  const userType = mode === "studio" ? "coder" : "business";
  const typeLabel = mode === "studio" ? "Vibe Coder" : "Business";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);

    // Look up profile by whatsapp_number (works for both business and studio accounts)
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, full_name, role, whatsapp_number")
      .eq("whatsapp_number", digits)
      .maybeSingle();

    if (!profile) {
      setLoading(false);
      setError("This number is not registered. Please check and try again.");
      return;
    }

    const userName = profile.full_name || "User";
    setResolvedName(userName);

    // Insert reset request (RLS allows anonymous insert)
    await supabase.from("password_reset_requests").insert({
      user_id: profile.user_id,
      user_phone: digits,
      user_name: userName,
      user_type: userType,
      status: "pending",
    } as any);

    // Notify admin via existing send-whatsapp edge function
    try {
      await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: ADMIN_PHONE,
          message:
            `🔐 PASSWORD RESET REQUEST\n\n` +
            `Name: ${userName}\n` +
            `Phone: ${digits}\n` +
            `Type: ${typeLabel}\n` +
            `Time: ${new Date().toLocaleString("en-IN")}\n\n` +
            `Admin panel:\nleadpe.online/admin/resets\n\n` +
            `Reset the password and WhatsApp it to the user.`,
        },
      });
    } catch (err) {
      console.warn("Admin notify failed (non-blocking):", err);
    }

    setLoading(false);
    setSent(true);
  };

  const waMessage = encodeURIComponent(
    `Hi LeadPe Admin, I forgot my LeadPe password. My registered phone: ${phone.replace(/\D/g, "")}. Please help me reset it.`
  );
  const waLink = `https://wa.me/${ADMIN_PHONE}?text=${waMessage}`;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); reset(); } }}>
      <DialogContent className="max-w-[440px] rounded-2xl">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Syne, sans-serif", color: "#1A1A1A" }}>
            Reset your password
          </DialogTitle>
          <DialogDescription style={{ fontFamily: "DM Sans, sans-serif", color: "#666" }}>
            Our admin will WhatsApp you a new password within 24 hours.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-xl text-sm text-center" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", fontFamily: "DM Sans, sans-serif" }}>
            {error}
          </div>
        )}

        {sent ? (
          <div className="space-y-3">
            <div className="p-4 rounded-xl text-sm" style={{ backgroundColor: "rgba(0,200,83,0.08)", color: "#00863a", border: "1px solid rgba(0,200,83,0.25)", fontFamily: "DM Sans, sans-serif" }}>
              ✅ Request submitted{resolvedName ? `, ${resolvedName}` : ""}!<br /><br />
              We'll WhatsApp your new password within 24 hours.<br /><br />
              <strong>WhatsApp:</strong> +91 99733 83902<br /><br />
              You can also message admin directly to speed it up.
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
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: "#444", fontFamily: "DM Sans, sans-serif" }}>
                Your registered phone number
              </label>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="h-[48px] rounded-xl text-base"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] rounded-xl font-semibold text-base transition-all disabled:opacity-60"
              style={{ backgroundColor: "#00C853", color: "#fff", fontFamily: "DM Sans, sans-serif" }}
            >
              {loading ? "Submitting..." : "Send Reset Request →"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
