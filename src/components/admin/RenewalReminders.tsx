import { useEffect, useState } from "react";
import { CalendarClock, MessageCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendWhatsApp } from "@/lib/whatsappService";
import { useToast } from "@/hooks/use-toast";

interface BusinessRow {
  id: string;
  name: string;
  owner_name: string | null;
  whatsapp_number: string | null;
  subscription_expiry: string | null;
}

export default function RenewalReminders() {
  const { toast } = useToast();
  const [rows, setRows] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id,name,owner_name,whatsapp_number,subscription_expiry")
        .not("subscription_expiry", "is", null)
        .order("subscription_expiry", { ascending: true });
      setRows((data as BusinessRow[]) || []);
      setLoading(false);
    })();
  }, []);

  const sendReminder = async (b: BusinessRow) => {
    if (!b.whatsapp_number) {
      toast({ title: "No WhatsApp number", variant: "destructive" });
      return;
    }
    setSending(b.id);
    const expiry = new Date(b.subscription_expiry!);
    const days = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
    const msg = `Hi ${b.owner_name || b.name},\n\nYour LeadPe website hosting expires in ${days} day(s) on ${expiry.toLocaleDateString("en-IN")}.\n\nRenew now (₹800/year) to keep your site live and continue receiving customers.\n\n👉 https://leadpe.tech/payment?plan=renewal\n\n— Team LeadPe`;
    try {
      await sendWhatsApp(b.whatsapp_number, msg);
      toast({ title: "Reminder sent ✅", description: b.name });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
    setSending(null);
  };

  if (loading) return <div className="text-sm text-muted-foreground p-4">Loading…</div>;

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E0F2E9] p-6 text-center text-sm text-muted-foreground" style={{ backgroundColor: "#FFFFFF" }}>
        No businesses with subscription expiry set yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E0F2E9] overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "#F0FFF4" }}>
              <th className="text-left p-3 font-semibold">Business</th>
              <th className="text-left p-3 font-semibold">Owner</th>
              <th className="text-left p-3 font-semibold">Expires</th>
              <th className="text-left p-3 font-semibold">Days Left</th>
              <th className="text-left p-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const expiry = new Date(b.subscription_expiry!);
              const days = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
              const expired = days <= 0;
              const warning = !expired && days <= 30;
              const showButton = expired || warning;
              const color = expired ? "#EF4444" : warning ? "#FF6B00" : "#00C853";
              return (
                <tr key={b.id} className="border-t border-[#E0F2E9]">
                  <td className="p-3 font-medium">{b.name}</td>
                  <td className="p-3 text-muted-foreground">{b.owner_name || "—"}</td>
                  <td className="p-3">{expiry.toLocaleDateString("en-IN")}</td>
                  <td className="p-3">
                    <span style={{ color, fontWeight: 700 }}>
                      {expired ? `Expired ${Math.abs(days)}d ago` : `${days} days`}
                    </span>
                  </td>
                  <td className="p-3">
                    {showButton ? (
                      <button
                        onClick={() => sendReminder(b)}
                        disabled={sending === b.id || !b.whatsapp_number}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: color }}
                      >
                        {expired ? <AlertTriangle size={14} /> : <MessageCircle size={14} />}
                        {sending === b.id ? "Sending…" : expired ? "Send Renewal Alert" : "Send Reminder"}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <CalendarClock size={12} /> Active
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
