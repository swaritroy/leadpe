import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, Lock } from "lucide-react";
import { usePlanStatus } from "@/hooks/usePlanStatus";

interface Props {
  blurredLeadCount?: number;
}

const PlanBanner = ({ blurredLeadCount = 0 }: Props) => {
  const navigate = useNavigate();
  const { isTrialActive, isGrowthActive, isFree, trialDaysLeft } = usePlanStatus();

  if (isGrowthActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full px-4 py-2 text-center text-sm font-medium text-white"
        style={{ backgroundColor: "#00C853" }}
      >
        <Sparkles size={14} className="inline mr-1.5 -mt-0.5" />
        Growth Plan Active — All features unlocked
      </motion.div>
    );
  }

  if (isTrialActive) {
    const urgent = trialDaysLeft <= 7;
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full px-4 py-2 text-center text-sm font-medium text-white flex items-center justify-center gap-2 flex-wrap"
        style={{ backgroundColor: urgent ? "#FB8C00" : "#00C853" }}
      >
        <span>
          {urgent
            ? `Trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} — Upgrade to keep your customers`
            : `Free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`}
        </span>
        <button
          onClick={() => navigate("/payment")}
          className="px-3 py-1 rounded-md text-xs font-semibold bg-white"
          style={{ color: urgent ? "#FB8C00" : "#00C853" }}
        >
          Upgrade — ₹299/month →
        </button>
      </motion.div>
    );
  }

  if (isFree) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full px-4 py-3 text-center text-sm flex items-center justify-center gap-2 flex-wrap"
        style={{ backgroundColor: "#FFF8E1", color: "#8D6E00", borderBottom: "1px solid #FFE082" }}
      >
        <AlertTriangle size={14} />
        <span>
          Your trial ended. Website is still live.{" "}
          {blurredLeadCount > 0 && (
            <strong>
              <Lock size={12} className="inline -mt-0.5 mx-0.5" />
              {blurredLeadCount} customer{blurredLeadCount === 1 ? "" : "s"} tried to contact you.
            </strong>
          )}{" "}
          Upgrade to connect with them.
        </span>
        <button
          onClick={() => navigate("/payment")}
          className="px-3 py-1 rounded-md text-xs font-semibold text-white"
          style={{ backgroundColor: "#FB8C00" }}
        >
          Get Growth Plan →
        </button>
      </motion.div>
    );
  }

  return null;
};

export default PlanBanner;
