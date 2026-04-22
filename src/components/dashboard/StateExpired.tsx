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
  const [loading, setLoading] = useState(false);

  const handleReorder = async () => {
    if (!user || !profile) return;
    setLoading(true);

    try {
      // Get last order details for pre-fill
      const { data: lastOrder } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_whatsapp", profile.whatsapp_number || "")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Create new build request
      const { error } = await supabase
        .from("build_requests")
        .insert({
          business_id: user.id,
          business_name: profile.business_name || profile.full_name || "Business",
          business_type: profile.business_type || null,
          city: profile.city || null,
          owner_name: profile.full_name || null,
          owner_whatsapp: profile.whatsapp_number || null,
          package_id: lastOrder?.package_id || "basic",
          package_price: lastOrder?.package_price || 800,
          coder_earning: Math.round(((lastOrder?.package_price as number) || 800) * 0.60),
          website_purpose: "business",
          status: "pending",
          hard_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          admin_notified: false,
          assigned_coder_id: null,
        } as Record<string, unknown>);

      if (error) {
        toast({
          title: "Error",
          description: "Could not place order. Try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Update profile status
      await supabase
        .from("profiles")
        .update({ website_status: "pending" } as Record<string, unknown>)
        .eq("user_id", user.id);

      // Alert admin via WhatsApp
      try {
        await supabase.functions.invoke("send-whatsapp", {
          body: {
            to: "919973383902",
            message:
              "🔔 NEW REORDER\n" +
              "Business: " + (profile.business_name || profile.full_name || "Unknown") + "\n" +
              "Type: " + (profile.business_type || "N/A") + "\n" +
              "City: " + (profile.city || "N/A") + "\n" +
              "Accept now: leadpe.online/studio"
          }
        });
      } catch (e) {
        console.error("WhatsApp reorder alert error:", e);
      }

      toast({
        title: "Order placed! ✅",
        description: "We will build your website within 48 hours.",
      });

      // Reload to show building state
      window.location.reload();
    } catch (err) {
      console.error("Reorder error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-4">⏳</div>

        <h2
          className="text-xl font-bold mb-2"
          style={{ fontFamily: "Syne, sans-serif", color: "#1A1A1A" }}
        >
          Your order could not be completed in time.
        </h2>

        <p className="text-sm mb-6" style={{ color: "#999" }}>
          We could not find a builder for your website within 48 hours. We apologise for this.
        </p>

        <div
          className="rounded-xl p-4 mb-6"
          style={{ backgroundColor: "#E8F5E9", border: "1px solid #C8E6C9" }}
        >
          <p className="text-sm font-medium" style={{ color: "#2E7D32" }}>
            Good news — your details are saved. One click to reorder.
          </p>
        </div>

        <Button
          onClick={handleReorder}
          disabled={loading}
          className="w-full h-12 text-base font-bold rounded-xl text-white mb-3"
          style={{ backgroundColor: "#00C853", fontFamily: "Syne, sans-serif" }}
        >
          {loading ? "Placing order..." : "Reorder My Website →"}
        </Button>

        <p className="text-xs mb-4" style={{ color: "#999" }}>
          Your package and details are pre-filled. No forms needed.
        </p>

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
