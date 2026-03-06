import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface GoogleBusinessGuideProps {
  userId: string;
  businessName: string;
  city: string;
}

const steps = [
  {
    id: 1,
    title: "Go to Google Business",
    description: "Visit business.google.com",
    action: "Open Google Business",
    url: "https://business.google.com",
  },
  {
    id: 2,
    title: "Click 'Manage now'",
    description: "Start adding your business",
    action: null,
    url: null,
  },
  {
    id: 3,
    title: "Search your business",
    description: "Enter your business name",
    action: null,
    url: null,
  },
  {
    id: 4,
    title: "Add your details",
    description: "Name, category, address, phone",
    action: null,
    url: null,
  },
  {
    id: 5,
    title: "Verify via phone",
    description: "Google will call you with a code",
    action: null,
    url: null,
  },
];

export default function GoogleBusinessGuide({ userId }: GoogleBusinessGuideProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [userId]);

  const fetchProgress = async () => {
    const { data } = await ((supabase as any)
      .from("google_business_progress")
      .select("completed_steps")
      .eq("user_id", userId)
      .single());

    if (data) {
      setCompletedSteps(data.completed_steps || []);
    }
    setLoading(false);
  };

  const toggleStep = async (stepId: number) => {
    const newCompleted = completedSteps.includes(stepId)
      ? completedSteps.filter((s) => s !== stepId)
      : [...completedSteps, stepId];

    setCompletedSteps(newCompleted);

    await ((supabase as any)
      .from("google_business_progress")
      .upsert({
        user_id: userId,
        completed_steps: newCompleted,
        updated_at: new Date().toISOString(),
      }));
  };

  const allDone = completedSteps.length === steps.length;

  if (loading) {
    return (
      <div className="rounded-2xl border border-border p-6" style={{ backgroundColor: "#101810" }}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded" style={{ backgroundColor: "#1a1f1a" }} />
          <div className="h-4 w-64 rounded" style={{ backgroundColor: "#1a1f1a" }} />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded-lg" style={{ backgroundColor: "#1a1f1a" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border p-5" style={{ backgroundColor: "#101810" }}>
      <div className="flex items-center gap-2 mb-2">
        <MapPin size={20} style={{ color: "#00E676" }} />
        <h3 className="text-lg font-bold font-display">Get on Google Maps</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Free. Takes 10 minutes. Brings more customers.
      </p>

      {allDone ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-6"
        >
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "rgba(0, 230, 118, 0.1)" }}>
            <Check size={32} style={{ color: "#00E676" }} />
          </div>
          <h4 className="text-xl font-bold mb-2">🎉 You're on Google Maps!</h4>
          <p className="text-sm text-muted-foreground">
            Customers can now find you on Google Maps and Search.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isDone = completedSteps.includes(step.id);
            const isNext = !isDone && completedSteps.length === index;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  isDone ? "opacity-50" : "hover:border-[#00E676]/30"
                }`}
                style={{ 
                  backgroundColor: isDone ? "#0a0f0a" : "#080C09",
                  borderColor: isNext ? "#00E676" : "#1a1f1a"
                }}
                onClick={() => toggleStep(step.id)}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isDone ? "#00E676" : "#1a1f1a",
                    border: isNext ? "2px solid #00E676" : "2px solid transparent",
                  }}
                >
                  {isDone && <Check size={14} className="text-black" />}
                  {!isDone && <span className="text-xs">{step.id}</span>}
                </div>

                <div className="flex-1">
                  <p className={`text-sm font-medium ${isDone ? "line-through" : ""}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>

                {step.action && step.url && (
                  <a
                    href={step.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                    style={{ backgroundColor: "#00E676", color: "#000" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {step.action} <ExternalLink size={12} />
                  </a>
                )}
              </motion.div>
            );
          })}

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{Math.round((completedSteps.length / steps.length) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#1a1f1a" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: "#00E676" }}
                initial={{ width: 0 }}
                animate={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
