import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, CheckCircle2, KeyRound, Clock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import LeadPeLogo from "@/components/LeadPeLogo";

interface ResetRequest {
  id: string;
  user_id: string | null;
  user_phone: string;
  user_name: string | null;
  user_type: string;
  status: string;
  requested_at: string;
  completed_at: string | null;
  admin_note: string | null;
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

export default function AdminResets() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "completed">("pending");
  const [pwInputs, setPwInputs] = useState<Record<string, string>>({});
  const [resetting, setResetting] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("password_reset_requests")
      .select("*")
      .order("requested_at", { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    } else {
      setRequests((data as ResetRequest[]) || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("password-resets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "password_reset_requests" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as ResetRequest;
            setRequests((prev) => [row, ...prev]);
            toast({
              title: "🔐 New password reset request",
              description: `${row.user_name || "User"} • ${row.user_phone}`,
            });
          } else {
            load();
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, toast]);

  const pending = requests.filter((r) => r.status === "pending");
  const completed = requests.filter((r) => r.status !== "pending");
  const visible = tab === "pending" ? pending : completed;

  const buildWhatsAppLink = (r: ResetRequest) => {
    const greeting = r.user_name ? `Namaste ${r.user_name},` : "Namaste,";
    const msg =
      `${greeting}\n\n` +
      `This is from LeadPe Support. We received your password reset request.\n\n` +
      `Your new password:\n` +
      `[TYPE NEW PASSWORD HERE]\n\n` +
      `Please log in at leadpe.online and change your password after signing in.\n\n` +
      `— LeadPe Support`;
    return `https://wa.me/91${r.user_phone}?text=${encodeURIComponent(msg)}`;
  };

  const markComplete = async (id: string) => {
    const { error } = await supabase
      .from("password_reset_requests")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "completed", completed_at: new Date().toISOString() } : r))
      );
      toast({ title: "Marked complete" });
    }
  };

  const resetPassword = async (r: ResetRequest) => {
    const pw = (pwInputs[r.id] || "").trim();
    if (pw.length < 6) {
      toast({ title: "Password too short", description: "Min 6 characters.", variant: "destructive" });
      return;
    }
    if (!r.user_id) {
      toast({ title: "No user_id", description: "Cannot reset — request has no linked user.", variant: "destructive" });
      return;
    }
    const ok = window.confirm(
      `Set new password for ${r.user_name || r.user_phone}?\n\nNew password: ${pw}\n\nThe user will need to use this password to sign in. Make sure to share it with them.`
    );
    if (!ok) return;

    setResetting((s) => ({ ...s, [r.id]: true }));
    const { data, error } = await supabase.functions.invoke("admin-reset-password", {
      body: { user_id: r.user_id, new_password: pw, request_id: r.id },
    });
    setResetting((s) => ({ ...s, [r.id]: false }));

    const errMsg = error?.message || (data as any)?.error;
    if (errMsg) {
      console.error("admin-reset-password failed:", { error, data });
      toast({
        title: "Reset failed",
        description: errMsg,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Password reset ✓",
      description: `New password "${pw}" set for ${r.user_name || r.user_phone}. Share via WhatsApp now.`,
    });
    setPwInputs((s) => ({ ...s, [r.id]: "" }));
    setRequests((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, status: "completed", completed_at: new Date().toISOString() } : x))
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10" style={{ borderColor: "#E0E0E0" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="p-2 rounded-lg hover:bg-gray-100">
              <ArrowLeft size={20} />
            </Link>
            <LeadPeLogo theme="light" size="sm" />
            <span className="text-sm font-medium" style={{ color: "#666", fontFamily: "DM Sans, sans-serif" }}>
              / Password Resets
            </span>
          </div>
          <button
            onClick={load}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "Syne, sans-serif", color: "#1A1A1A" }}>
            Password Reset Requests
          </h1>
          <p className="text-sm mb-5" style={{ color: "#666", fontFamily: "DM Sans, sans-serif" }}>
            Manually reset passwords and notify users via WhatsApp.
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setTab("pending")}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{
                backgroundColor: tab === "pending" ? "#00C853" : "#fff",
                color: tab === "pending" ? "#fff" : "#1A1A1A",
                border: "1px solid #E0E0E0",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              Pending
              {pending.length > 0 && (
                <span
                  className="inline-flex items-center justify-center text-xs font-bold rounded-full"
                  style={{
                    backgroundColor: tab === "pending" ? "#fff" : "#ef4444",
                    color: tab === "pending" ? "#00C853" : "#fff",
                    minWidth: 22,
                    height: 22,
                    padding: "0 6px",
                  }}
                >
                  {pending.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("completed")}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{
                backgroundColor: tab === "completed" ? "#00C853" : "#fff",
                color: tab === "completed" ? "#fff" : "#1A1A1A",
                border: "1px solid #E0E0E0",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              Completed ({completed.length})
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="text-center py-12" style={{ color: "#666" }}>Loading...</div>
          ) : visible.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center" style={{ border: "1px solid #E0E0E0" }}>
              <CheckCircle2 size={36} className="mx-auto mb-3" style={{ color: "#00C853" }} />
              <p className="text-sm" style={{ color: "#666", fontFamily: "DM Sans, sans-serif" }}>
                {tab === "pending" ? "No pending reset requests. All clear!" : "No completed requests yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-5"
                  style={{ border: "1px solid #E0E0E0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base truncate" style={{ color: "#1A1A1A", fontFamily: "DM Sans, sans-serif" }}>
                          {r.user_name || "Unknown"}
                        </h3>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: r.user_type === "coder" ? "rgba(99,102,241,0.1)" : "rgba(0,200,83,0.1)",
                            color: r.user_type === "coder" ? "#6366f1" : "#00863a",
                          }}
                        >
                          {r.user_type === "coder" ? "Vibe Coder" : "Business"}
                        </span>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: r.status === "pending" ? "rgba(245,158,11,0.1)" : "rgba(0,200,83,0.1)",
                            color: r.status === "pending" ? "#d97706" : "#00863a",
                          }}
                        >
                          {r.status === "pending" ? "Pending" : "Completed"}
                        </span>
                      </div>
                      <p className="text-sm mt-1" style={{ color: "#666", fontFamily: "DM Sans, sans-serif" }}>
                        +91 {r.user_phone}
                      </p>
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#999" }}>
                        <Clock size={12} /> Requested {timeAgo(r.requested_at)}
                        {r.completed_at && ` • Completed ${timeAgo(r.completed_at)}`}
                      </p>
                    </div>
                  </div>

                  {r.status === "pending" && (
                    <>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <a
                          href={buildWhatsAppLink(r)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-[180px] h-[44px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                          style={{ backgroundColor: "#25D366", color: "#fff", fontFamily: "DM Sans, sans-serif" }}
                        >
                          <MessageCircle size={16} /> WhatsApp User →
                        </a>
                        <button
                          onClick={() => markComplete(r.id)}
                          className="flex-1 min-w-[160px] h-[44px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                          style={{
                            backgroundColor: "#fff",
                            color: "#1A1A1A",
                            border: "1px solid #E0E0E0",
                            fontFamily: "DM Sans, sans-serif",
                          }}
                        >
                          <CheckCircle2 size={16} /> Mark Complete
                        </button>
                      </div>

                      {/* Inline reset (optional) */}
                      <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: "#F5FFF7", border: "1px dashed #00C853" }}>
                        <p className="text-xs mb-2 flex items-center gap-1" style={{ color: "#00863a", fontFamily: "DM Sans, sans-serif", fontWeight: 600 }}>
                          <KeyRound size={12} /> Optional — set password directly
                        </p>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="New password (min 6 chars)"
                            value={pwInputs[r.id] || ""}
                            onChange={(e) => setPwInputs((s) => ({ ...s, [r.id]: e.target.value }))}
                            className="h-[40px] rounded-lg text-sm flex-1"
                          />
                          <button
                            onClick={() => resetPassword(r)}
                            disabled={resetting[r.id] || !r.user_id}
                            className="h-[40px] px-4 rounded-lg font-semibold text-sm whitespace-nowrap disabled:opacity-50"
                            style={{ backgroundColor: "#00C853", color: "#fff", fontFamily: "DM Sans, sans-serif" }}
                          >
                            {resetting[r.id] ? "..." : "Set Password →"}
                          </button>
                        </div>
                        {!r.user_id && (
                          <p className="text-xs mt-2" style={{ color: "#ef4444" }}>
                            No linked user_id — reset disabled. WhatsApp the user instead.
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {r.admin_note && r.status === "completed" && (
                    <p className="text-xs mt-3 p-2 rounded-lg" style={{ backgroundColor: "#F5FFF7", color: "#00863a" }}>
                      Note: {r.admin_note}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
