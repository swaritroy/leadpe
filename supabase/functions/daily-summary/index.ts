// Daily 9pm IST summary → admin via notify-admin.
// Counts signups, orders, demos, payments (today) + Outbox pending.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Today = last 24h (simpler & timezone-safe for cron)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [signups, orders, demos, paymentsRes, outbox] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("build_requests").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("build_requests").select("id", { count: "exact", head: true }).gte("submitted_at", since).not("demo_url", "is", null),
    supabase.from("payments").select("amount").eq("status", "paid").gte("created_at", since),
    supabase.from("scheduled_messages").select("id", { count: "exact", head: true }).eq("status", "queued_for_admin"),
  ]);

  const paymentsTotal = (paymentsRes.data ?? []).reduce((s: number, r: any) => s + (r.amount || 0), 0);

  // Call notify-admin
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-admin`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({
      event_type: "daily_summary",
      payload: {
        signups: signups.count ?? 0,
        orders: orders.count ?? 0,
        demos: demos.count ?? 0,
        payments: paymentsTotal,
        outbox: outbox.count ?? 0,
      },
    }),
  });
  const result = await r.json().catch(() => ({}));

  return new Response(
    JSON.stringify({
      ok: true,
      summary: {
        signups: signups.count ?? 0,
        orders: orders.count ?? 0,
        demos: demos.count ?? 0,
        payments: paymentsTotal,
        outbox: outbox.count ?? 0,
      },
      notify_result: result,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
