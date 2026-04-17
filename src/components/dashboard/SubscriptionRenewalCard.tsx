import { motion } from "framer-motion";
import { CalendarClock, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const font = { heading: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

interface Props {
  expiryDate: string | null | undefined;
}

export default function SubscriptionRenewalCard({ expiryDate }: Props) {
  const navigate = useNavigate();
  if (!expiryDate) return null;

  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return null;

  const now = Date.now();
  const diffMs = expiry.getTime() - now;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isExpired = diffMs <= 0;
  const isWarning = !isExpired && daysLeft <= 30;

  const bgColor = isExpired ? "#FFEBEE" : isWarning ? "#FFF3E0" : "#F0FFF4";
  const borderColor = isExpired ? "#EF4444" : isWarning ? "#FF9800" : "#00C853";
  const textColor = isExpired ? "#C62828" : isWarning ? "#E65100" : "#1A1A1A";
  const accentColor = isExpired ? "#EF4444" : isWarning ? "#FF6B00" : "#00C853";

  const handleRenew = () => {
    navigate("/payment?plan=renewal&amount=800");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={{
        margin: "0 16px 16px",
        backgroundColor: bgColor,
        borderRadius: 16,
        padding: 20,
        border: `2px solid ${borderColor}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <CalendarClock size={20} style={{ color: accentColor }} />
        <h3 style={{ fontFamily: font.heading, fontSize: 16, fontWeight: 700, color: textColor, margin: 0 }}>
          {isExpired ? "Subscription Expired" : "Hosting Subscription"}
        </h3>
      </div>

      {isExpired ? (
        <p style={{ fontFamily: font.body, fontSize: 14, color: textColor, marginBottom: 14 }}>
          Your 1-year hosting period has ended. Renew now to keep your website live and continue receiving customers.
        </p>
      ) : (
        <>
          <p style={{ fontFamily: font.body, fontSize: 14, color: "#1A1A1A", marginBottom: 4 }}>
            <strong style={{ color: accentColor }}>{daysLeft} days remaining</strong> until renewal
          </p>
          <p style={{ fontFamily: font.body, fontSize: 12, color: "#666", marginBottom: 14 }}>
            Expires on {expiry.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </>
      )}

      {(isExpired || isWarning) && (
        <button
          onClick={handleRenew}
          style={{
            width: "100%",
            height: 44,
            borderRadius: 10,
            backgroundColor: accentColor,
            color: "#fff",
            border: "none",
            fontFamily: font.body,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <RefreshCw size={16} />
          {isExpired ? "Renew Subscription →" : "Renew Now →"}
        </button>
      )}
    </motion.div>
  );
}
