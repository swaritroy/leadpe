import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, RefreshCw, MessageCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface OutboxRow {
  id: string;
  to: string;
  message: string;
  type: string | null;
  event_type: string | null;
  client_name: string | null;
  whatsapp_url: string | null;
  status: string | null;
  created_at: string | null;
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "welcome", label: "Welcome" },
  { id: "demo_ready", label: "Demo" },
  { id: "website_live", label: "Live" },
  { id: "new_lead", label: "Lead" },
  { id: "payment_received", label: "Payment" },
  { id: "trial_nudge", label: "Trial nudge" },
];

const QUICK_REPLIES: { label: string; text: string }[] = [
  { label: "Greeting", text: "Hi! This is LeadPe team 👋. How can we help you today?" },
  { label: "Follow-up", text: "Hi, just checking in on your website request. Anything you need from us?" },
  { label: "Payment reminder", text: "Hi! Friendly reminder — your LeadPe Growth plan (₹299) is pending. Activate to unlock leads ✅" },
  { label: "Thank you", text: "Thank you for being with LeadPe 🙏. Reply anytime if you need help!" },
  { label: "Support", text: "We're on it 🛠️. Our team will update you within a few hours. Thanks for your patience!" },
];

export default function AdminOutbox() {
  const { toast } = useToast();
  const [rows, setRows] = useState<OutboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [quickPhone, setQuickPhone] = useState("");
  const [quickText, setQuickText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("scheduled_messages")
      .select("id, to, message, type, event_type, client_name, whatsapp_url, status, created_at")
      .eq("recipient_type", "client")
      .eq("status", "queued_for_admin")
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data as OutboxRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = async (row: OutboxRow) => {
    const text = edits[row.id] ?? row.message;
    const cleanPhone = String(row.to).replace(/\D/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    await (supabase as any)
      .from("scheduled_messages")
      .update({ status: "sent_manual", sent_at: new Date().toISOString(), message: text })
      .eq("id", row.id);
    toast({ title: "Opened WhatsApp", description: "Tap Send in WhatsApp to deliver." });
    setRows((rs) => rs.filter((r) => r.id !== row.id));
  };

  const markDone = async (id: string) => {
    await (supabase as any).from("scheduled_messages").update({ status: "dismissed" }).eq("id", id);
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  const sendQuick = () => {
    const clean = quickPhone.replace(/\D/g, "");
    if (clean.length < 10 || !quickText.trim()) {
      toast({ title: "Need phone + message", variant: "destructive" });
      return;
    }
    const phone = clean.length === 10 ? `91${clean}` : clean;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(quickText)}`, "_blank");
  };

  const filtered = filter === "all"
    ? rows
    : rows.filter((r) => (r.event_type || r.type || "") === filter);

  return (
    <div className="space-y-4">
      {/* Quick Reply panel */}
      <div className="rounded-2xl border border-[#E0F2E9] bg-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle size={16} style={{ color: "#00C853" }} />
          <span className="font-semibold">Quick send (any number)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          <input
            value={quickPhone}
            onChange={(e) => setQuickPhone(e.target.value)}
            placeholder="WhatsApp number (10 or 12 digits)"
            className="h-10 rounded-lg border border-[#E0E0E0] px-3 text-sm"
          />
          <Textarea
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            placeholder="Type message..."
            className="md:col-span-2 min-h-[40px] text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q.label}
              onClick={() => setQuickText(q.text)}
              className="px-3 py-1 rounded-full text-xs border border-[#E0E0E0] hover:bg-[#F5FFF7]"
            >
              {q.label}
            </button>
          ))}
        </div>
        <Button onClick={sendQuick} className="h-10 rounded-lg text-black" style={{ backgroundColor: "#00C853" }}>
          <Send size={14} className="mr-2" /> Open WhatsApp
        </Button>
      </div>

      {/* Filter chips + refresh */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: filter === f.id ? "#00C853" : "#FFFFFF",
                color: filter === f.id ? "white" : "#1A1A1A",
                borderColor: filter === f.id ? "#00C853" : "#E0E0E0",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button onClick={load} variant="outline" className="h-9 rounded-lg">
          <RefreshCw size={14} className="mr-2" /> Refresh
        </Button>
      </div>

      {/* Queued cards */}
      {loading ? (
        <div className="rounded-2xl border border-[#E0F2E9] bg-white p-6 text-center text-sm text-muted-foreground">
          Loading queued messages...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E0F2E9] bg-white p-6 text-center text-sm text-muted-foreground">
          📭 Nothing queued. New events will appear here automatically.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-2xl border border-[#E0F2E9] bg-white p-4">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div>
                  <div className="font-semibold">{r.client_name || "Client"}</div>
                  <div className="text-xs text-muted-foreground">📱 {r.to}</div>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ backgroundColor: "#F5FFF7", color: "#00C853", border: "1px solid #00C853" }}
                >
                  {r.event_type || r.type || "message"}
                </span>
              </div>
              <Textarea
                defaultValue={r.message}
                onChange={(e) => setEdits((s) => ({ ...s, [r.id]: e.target.value }))}
                className="text-sm mb-3 min-h-[90px]"
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => send(r)}
                  className="h-10 rounded-lg text-black font-semibold flex-1"
                  style={{ backgroundColor: "#00C853" }}
                >
                  <Send size={14} className="mr-2" /> Send via WhatsApp
                </Button>
                <Button
                  onClick={() => markDone(r.id)}
                  variant="outline"
                  className="h-10 rounded-lg"
                >
                  <Check size={14} className="mr-2" /> Dismiss
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
