import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Check, MessageCircle, RefreshCw, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LeadPeLogo from "@/components/LeadPeLogo";
import { Button } from "@/components/ui/button";

interface Msg {
  id: string;
  from_type: string | null;
  from_id: string | null;
  from_name: string | null;
  to_type: string | null;
  message: string;
  meta: Record<string, any> | null;
  read: boolean;
  created_at: string;
}

type FilterTab = "all" | "unread" | "business" | "coder" | "system";

const AdminMessages = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("all");

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setMessages((data || []) as unknown as Msg[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel("admin-messages-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => fetchMessages()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    return messages.filter((m) => {
      if (tab === "unread") return !m.read;
      if (tab === "business") return m.from_type === "business";
      if (tab === "coder") return m.from_type === "coder" || m.from_type === "vibe_coder";
      if (tab === "system") return m.from_type === "system";
      return true;
    });
  }, [messages, tab]);

  const unreadCount = messages.filter((m) => !m.read).length;

  const markRead = async (id: string) => {
    await supabase.from("messages" as any).update({ read: true }).eq("id", id);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
  };

  const markAllRead = async () => {
    await supabase.from("messages" as any).update({ read: true }).eq("read", false);
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
  };

  const replyOnWhatsApp = (m: Msg) => {
    const phone = (m.meta?.whatsapp || m.meta?.phone || "").toString().replace(/\D/g, "");
    if (!phone) return;
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      <header className="sticky top-0 bg-white border-b z-10" style={{ borderColor: "#E0E0E0" }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin")} className="p-2 rounded-lg hover:bg-gray-100">
              <ArrowLeft size={18} />
            </button>
            <LeadPeLogo theme="light" size="sm" />
            <span className="text-sm font-semibold flex items-center gap-2" style={{ color: "#1A1A1A" }}>
              <MessageCircle size={16} style={{ color: "#00C853" }} />
              Messages Inbox
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: "#E53935" }}>
                  {unreadCount}
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={markAllRead} disabled={!unreadCount}>
              <Check size={14} className="mr-1" /> Mark all read
            </Button>
            <Button variant="outline" size="sm" onClick={fetchMessages}>
              <RefreshCw size={14} />
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
          {(
            [
              { id: "all", label: "All" },
              { id: "unread", label: `Unread (${unreadCount})` },
              { id: "business", label: "From Business" },
              { id: "coder", label: "From Coders" },
              { id: "system", label: "System Alerts" },
            ] as { id: FilterTab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition"
              style={{
                backgroundColor: tab === t.id ? "#00C853" : "#FFFFFF",
                color: tab === t.id ? "#FFFFFF" : "#666666",
                border: `1px solid ${tab === t.id ? "#00C853" : "#E0E0E0"}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {loading ? (
          <p className="text-center text-sm text-gray-500 py-8">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border" style={{ borderColor: "#E0E0E0" }}>
            <Bell size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No messages in this view</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 border"
                style={{
                  borderColor: m.read ? "#E0E0E0" : "#00C853",
                  borderLeftWidth: m.read ? 1 : 4,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                      {m.from_name || "Unknown"}{" "}
                      <span className="text-xs font-normal" style={{ color: "#999" }}>
                        ({m.from_type || "system"})
                      </span>
                    </p>
                    <p className="text-xs" style={{ color: "#999" }}>
                      {new Date(m.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!m.read && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: "#E53935" }}
                    >
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "#333" }}>
                  {m.message}
                </p>
                <div className="mt-3 flex gap-2">
                  {!m.read && (
                    <Button size="sm" variant="outline" onClick={() => markRead(m.id)}>
                      <Check size={12} className="mr-1" /> Mark read
                    </Button>
                  )}
                  {(m.meta?.whatsapp || m.meta?.phone) && (
                    <Button
                      size="sm"
                      onClick={() => replyOnWhatsApp(m)}
                      className="text-white"
                      style={{ backgroundColor: "#00C853" }}
                    >
                      <MessageCircle size={12} className="mr-1" /> Reply on WhatsApp
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminMessages;
