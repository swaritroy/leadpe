import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Send, Copy } from "lucide-react";

interface MsgLogRow {
  sent_at: string | null;
  status: string | null;
  error_message: string | null;
  channel: string | null;
}

const SANDBOX_NUMBER = "+1 415 523 8886";

export default function TwilioStatusCard() {
  const { toast } = useToast();
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const [lastError, setLastError] = useState<MsgLogRow | null>(null);
  const [sending, setSending] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string>(
    () => localStorage.getItem("lp:twilio:join_code") || "",
  );

  useEffect(() => {
    void loadStatus();
  }, []);

  async function loadStatus() {
    const { data: ok } = await (supabase as any)
      .from("message_log")
      .select("sent_at,status,channel")
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(1);
    setLastSuccess(ok?.[0]?.sent_at ?? null);

    const { data: err } = await (supabase as any)
      .from("message_log")
      .select("sent_at,status,error_message,channel")
      .eq("status", "failed")
      .order("sent_at", { ascending: false })
      .limit(1);
    setLastError(err?.[0] ?? null);
  }

  async function sendTestPing() {
    setSending(true);
    setPingResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("notify-admin", {
        body: { event_type: "test_ping", payload: {} },
      });
      if (error) throw error;
      setPingResult(JSON.stringify(data, null, 2));
      toast({
        title: data?.admin_sent ? "Test sent ✅" : "Send failed ❌",
        description: data?.admin_sent
          ? `Channel: ${data.channel}. Check your WhatsApp on +91 99733 83902.`
          : `Error: ${data?.error || "unknown"}`,
        variant: data?.admin_sent ? "default" : "destructive",
      });
      await loadStatus();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setPingResult(msg);
      toast({ title: "Test failed", description: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  function saveJoinCode(v: string) {
    setJoinCode(v);
    localStorage.setItem("lp:twilio:join_code", v);
  }

  function copyJoinMessage() {
    const code = joinCode.trim() || "<your-sandbox-code>";
    navigator.clipboard.writeText(`join ${code}`);
    toast({ title: "Copied", description: `"join ${code}" — paste into WhatsApp to ${SANDBOX_NUMBER}` });
  }

  return (
    <div className="rounded-2xl border bg-white p-5 space-y-4" style={{ borderColor: "#E0E0E0" }}>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl p-3" style={{ backgroundColor: "#F0FFF4" }}>
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "#00C853" }}>
            <CheckCircle size={16} /> Last successful send
          </div>
          <div className="text-xs mt-1" style={{ color: "#1A1A1A" }}>
            {lastSuccess ? new Date(lastSuccess).toLocaleString() : "No successful sends yet"}
          </div>
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: lastError ? "#FFF1F0" : "#F0F0F0" }}>
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: lastError ? "#dc2626" : "#666" }}>
            <XCircle size={16} /> Last error
          </div>
          <div className="text-xs mt-1 break-all" style={{ color: "#1A1A1A" }}>
            {lastError
              ? `${new Date(lastError.sent_at!).toLocaleString()} — ${lastError.error_message?.slice(0, 200) || "(no message)"}`
              : "No errors logged"}
          </div>
        </div>
      </div>

      <Button
        onClick={sendTestPing}
        disabled={sending}
        className="w-full h-12 rounded-xl text-white font-semibold"
        style={{ backgroundColor: "#00C853" }}
      >
        <Send size={18} className="mr-2" />
        {sending ? "Sending..." : "Send Test Ping to my WhatsApp (9973383902)"}
      </Button>

      {pingResult && (
        <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-48 border" style={{ borderColor: "#E0E0E0" }}>
          {pingResult}
        </pre>
      )}

      <div className="rounded-xl border-2 border-dashed p-4" style={{ borderColor: "#FFB800", backgroundColor: "#FFFBEB" }}>
        <div className="text-sm font-semibold mb-2" style={{ color: "#92400e" }}>
          ⚠️ WhatsApp Sandbox expires every 72h
        </div>
        <p className="text-xs mb-3" style={{ color: "#78350f" }}>
          To re-join: open WhatsApp → send <code className="bg-white px-1 rounded">join &lt;your-code&gt;</code> to{" "}
          <strong>{SANDBOX_NUMBER}</strong>. Paste your current sandbox code below for one-tap copy.
        </p>
        <div className="flex gap-2">
          <Input
            value={joinCode}
            onChange={(e) => saveJoinCode(e.target.value)}
            placeholder="e.g. happy-tiger"
            className="h-10"
          />
          <Button onClick={copyJoinMessage} variant="outline" className="h-10 px-3">
            <Copy size={14} className="mr-1" /> Copy
          </Button>
        </div>
      </div>
    </div>
  );
}
