import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, MessageCircle, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  buildReferralUrl,
  buildBusinessShareMessage,
  buildCoderShareMessage,
} from "@/lib/referral";

const font = { heading: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

interface Props {
  variant: "business" | "coder";
  userId?: string;
  referralCode?: string | null;
  referralDiscount?: number;
  referralBonusTotal?: number;
}

export default function ReferralCard({
  variant,
  userId,
  referralCode,
  referralDiscount = 0,
  referralBonusTotal = 0,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ invited: 0, converted: 0 });

  const code = referralCode || "";
  const url = code ? buildReferralUrl(code) : "";

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("referrals")
        .select("status")
        .eq("referrer_id", userId);
      if (cancelled) return;
      const rows = data || [];
      setStats({
        invited: rows.length,
        converted: rows.filter(
          (r: any) => r.status === "converted" || r.status === "rewarded"
        ).length,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const message =
    variant === "business"
      ? buildBusinessShareMessage(code)
      : buildCoderShareMessage(code);
  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const heading =
    variant === "business" ? "Refer a Friend — Both Win" : "Bring Clients — Earn Extra";
  const sub =
    variant === "business"
      ? "Refer any business — both of you get ₹100 off."
      : "Bring a paying client — earn ₹100 bonus on top of your usual 60%.";

  const rewardLabel = variant === "business" ? "Credit earned" : "Bonus earned";
  const rewardValue = variant === "business" ? referralDiscount : referralBonusTotal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        border: "1px solid #E0F2E9",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Gift size={18} style={{ color: "#00C853" }} />
        <h3
          style={{
            fontFamily: font.heading,
            fontSize: 16,
            fontWeight: 700,
            color: "#1A1A1A",
            margin: 0,
          }}
        >
          {heading}
        </h3>
      </div>
      <p
        style={{
          fontFamily: font.body,
          fontSize: 13,
          color: "#666",
          marginBottom: 14,
        }}
      >
        {sub}
      </p>

      {variant === "coder" && (
        <div
          style={{
            backgroundColor: "#F0FFF4",
            border: "1px solid #C8E6C9",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 14,
            fontSize: 12,
            color: "#1A1A1A",
            lineHeight: 1.5,
          }}
        >
          <p style={{ fontWeight: 600, margin: "0 0 4px" }}>How it works:</p>
          <ol style={{ margin: 0, paddingLeft: 16 }}>
            <li>Share your link with a business owner.</li>
            <li>They sign up and pay for their first website.</li>
            <li>You build the website (60% earning as usual).</li>
            <li>₹100 referral bonus is added to your earnings.</li>
          </ol>
          <p style={{ margin: "8px 0 0", fontWeight: 600, color: "#00C853" }}>
            Note: ₹100 bonus is paid only after your client pays for their first website.
          </p>
        </div>
      )}

      {/* Referral link */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          backgroundColor: "#F0FFF4",
          border: "1px solid #C8E6C9",
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            flex: 1,
            fontFamily: "monospace",
            fontSize: 13,
            color: "#1A1A1A",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {url}
        </span>
        <button
          onClick={handleCopy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            backgroundColor: "#00C853",
            color: "#fff",
            border: "none",
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          height: 44,
          borderRadius: 10,
          backgroundColor: "#25D366",
          color: "#fff",
          fontFamily: font.body,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          marginBottom: 14,
        }}
      >
        <MessageCircle size={16} /> Share on WhatsApp
      </a>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[
          { label: "Invited", value: stats.invited },
          { label: "Converted", value: stats.converted },
          { label: rewardLabel, value: `₹${rewardValue}` },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              backgroundColor: "#F8FFF9",
              borderRadius: 10,
              padding: "10px 4px",
              textAlign: "center",
              border: "1px solid #E0F2E9",
            }}
          >
            <div
              style={{
                fontFamily: font.heading,
                fontSize: 18,
                fontWeight: 700,
                color: "#00C853",
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
