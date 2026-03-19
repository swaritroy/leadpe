import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface StateExpiredProps {
  profile: any;
  user: { id: string } | null;
}

export default function StateExpired({ profile, user }: StateExpiredProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reordering, setReordering] = useState(false);

  const handleReorder = async () => {
    if (!user || !profile) return;
    setReordering(true);

    try {
      // Fetch last order's package info
      const { data: lastOrder } = await supabase
        .from("build_requests")
        .select("package_id, package_price, coder_earning, website_purpose, reference_sites, special_requirements")
        .eq("business_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Create new build request with existing data
      const { error: insertError } = await supabase
        .from("build_requests")
        .insert({
          business_id: user.id,
          business_name: (profile.business_name as string) || (profile.full_name as string) || "Business",
          business_type: (profile.business_type as string) || null,
          city: (profile.city as string) || null,
          owner_name: (profile.full_name as string) || null,
          owner_whatsapp: (profile.whatsapp_number as string) || null,
          package_id: lastOrder?.package_id || "basic",
          package_price: lastOrder?.package_price || 800,
          coder_earning: lastOrder?.coder_earning || 640,
          website_purpose: lastOrder?.website_purpose || "business",
          reference_sites: lastOrder?.reference_sites || null,
          special_requirements: lastOrder?.special_requirements || null,
          status: "pending",
          hard_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          admin_notified: false,
        } as Record<string, unknown>);

      if (insertError) throw insertError;

      // Update profile
      await supabase
        .from("profiles")
        .update({ website_status: "pending" } as Record<string, unknown>)
        .eq("user_id", user.id);

      toast({
        title: "Order placed again!",
        description: "We will deliver in 48 hours.",
      });
    } catch (err) {
      console.error("Reorder error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="text-6xl mb-4">⏳</div>

        {/* Heading */}
        <h2
          className="text-xl font-bold mb-2"
          style={{ fontFamily: "Syne, sans-serif", color: "#1A1A1A" }}
        >
          Your order could not be completed in time.
        </h2>

        {/* Subtext */}
        <p className="text-sm mb-6" style={{ color: "#999" }}>
          We could not find a builder for your website within 48 hours. We apologise for this.
        </p>

        {/* Good news card */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{ backgroundColor: "#E8F5E9", border: "1px solid #C8E6C9" }}
        >
          <p className="text-sm font-medium" style={{ color: "#2E7D32" }}>
            Good news — your details are saved. One click to reorder.
          </p>
        </div>

        {/* Reorder button */}
        <Button
          onClick={handleReorder}
          disabled={reordering}
          className="w-full h-12 text-base font-bold rounded-xl text-white mb-3"
          style={{ backgroundColor: "#00C853", fontFamily: "Syne, sans-serif" }}
        >
          {reordering ? "Placing order..." : "Reorder My Website →"}
        </Button>

        <p className="text-xs mb-4" style={{ color: "#999" }}>
          Your package and details are pre-filled. No forms needed.
        </p>

        {/* Change package link */}
        <button
          onClick={() => navigate("/get-website")}
          className="text-sm font-semibold underline"
          style={{ color: "#666", background: "none", border: "none", cursor: "pointer" }}
        >
          Change Package →
        </button>
      </div>
    </div>
  );
}
