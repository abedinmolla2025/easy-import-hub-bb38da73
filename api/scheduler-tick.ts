// Vercel Cron heartbeat — calls the scheduler-dispatch Supabase Edge Function
// every minute with the shared CRON_SECRET. The Edge Function selects due
// schedules, picks content, generates Bengali copy and sends pushes.

const EDGE_URL =
  "https://llicfiepatzgllmjhzbw.supabase.co/functions/v1/scheduler-dispatch";

export default async function handler() {
  const secret = process.env.SCHEDULER_CRON_SECRET || "";
  if (!secret) {
    return new Response(
      JSON.stringify({ ok: false, error: "missing SCHEDULER_CRON_SECRET" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const res = await fetch(EDGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dispatch_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(60_000),
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return new Response(
      JSON.stringify({ ok: res.ok, status: res.status, body: data }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}
