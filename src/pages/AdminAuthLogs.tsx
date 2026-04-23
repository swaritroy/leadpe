import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";

interface AuthEvent {
  id: string;
  user_id: string | null;
  email: string | null;
  event: string;
  intent: string | null;
  previous_role: string | null;
  new_role: string | null;
  promoted: boolean | null;
  redirect_to: string | null;
  details: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
}

const EVENT_COLORS: Record<string, string> = {
  callback_started: "bg-blue-100 text-blue-800",
  intent_detected: "bg-purple-100 text-purple-800",
  session_error: "bg-red-100 text-red-800",
  profile_missing: "bg-orange-100 text-orange-800",
  profile_loaded: "bg-gray-100 text-gray-800",
  role_promotion_attempt: "bg-yellow-100 text-yellow-800",
  role_promotion_success: "bg-green-100 text-green-800",
  role_promotion_failed: "bg-red-100 text-red-800",
  redirect: "bg-indigo-100 text-indigo-800",
  referral_claim_failed: "bg-red-100 text-red-800",
};

export default function AdminAuthLogs() {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("");

  const load = useCallback(async () => {
    setBusy(true);
    let q = supabase.from("auth_events").select("*").order("created_at", { ascending: false }).limit(500);
    if (eventFilter) q = q.eq("event", eventFilter);
    const { data } = await q;
    setEvents((data as AuthEvent[]) ?? []);
    setBusy(false);
  }, [eventFilter]);

  useEffect(() => {
    if (!loading && profile?.role !== "admin") {
      navigate("/", { replace: true });
      return;
    }
    if (!loading && profile?.role === "admin") load();
  }, [loading, profile, load, navigate]);

  const filtered = events.filter(e => {
    if (!filter.trim()) return true;
    const f = filter.toLowerCase();
    return (
      (e.email ?? "").toLowerCase().includes(f) ||
      (e.user_id ?? "").toLowerCase().includes(f) ||
      (e.intent ?? "").toLowerCase().includes(f) ||
      (e.error ?? "").toLowerCase().includes(f)
    );
  });

  const eventNames = Array.from(new Set(events.map(e => e.event)));

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "#F5FFF7" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Admin
            </Button>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
              OAuth & Role-Promotion Logs
            </h1>
          </div>
          <Button onClick={load} disabled={busy} size="sm">
            <RefreshCw className={`w-4 h-4 mr-1 ${busy ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search email, user_id, intent, error…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={eventFilter}
            onChange={e => setEventFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm bg-white"
          >
            <option value="">All events</option>
            {eventNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Time</th>
                <th className="px-3 py-2 font-medium">Event</th>
                <th className="px-3 py-2 font-medium">Email / User</th>
                <th className="px-3 py-2 font-medium">Intent</th>
                <th className="px-3 py-2 font-medium">Role change</th>
                <th className="px-3 py-2 font-medium">Redirect</th>
                <th className="px-3 py-2 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-t hover:bg-gray-50 align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <Badge className={EVENT_COLORS[e.event] ?? "bg-gray-100 text-gray-800"}>
                      {e.event}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div>{e.email ?? "—"}</div>
                    <div className="text-xs text-gray-500 font-mono">{e.user_id?.slice(0, 8) ?? "—"}</div>
                  </td>
                  <td className="px-3 py-2">{e.intent ?? "—"}</td>
                  <td className="px-3 py-2">
                    {e.previous_role || e.new_role ? (
                      <span className="text-xs">
                        {e.previous_role ?? "?"} → <strong>{e.new_role ?? "—"}</strong>
                        {e.promoted && <span className="ml-1 text-green-600">✓</span>}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">{e.redirect_to ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-red-600 max-w-xs truncate" title={e.error ?? ""}>
                    {e.error ?? "—"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-500">No events.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Showing latest {filtered.length} of {events.length} loaded events (max 500).
        </p>
      </div>
    </div>
  );
}
