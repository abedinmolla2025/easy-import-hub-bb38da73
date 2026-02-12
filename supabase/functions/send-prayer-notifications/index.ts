/// <reference lib="deno.ns" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type PrayerTimes = {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
};

async function getPrayerTimes(
  latitude: number,
  longitude: number,
  method: string,
  date: string
): Promise<PrayerTimes | null> {
  try {
    const url = `https://api.aladhan.com/v1/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=${getMethodCode(method)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Aladhan API error:", response.status);
      return null;
    }

    const data = await response.json();
    const timings = data.data.timings;

    return {
      fajr: timings.Fajr,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      maghrib: timings.Maghrib,
      isha: timings.Isha,
    };
  } catch (error) {
    console.error("Prayer times calculation error:", error);
    return null;
  }
}

function getMethodCode(method: string): number {
  const methods: Record<string, number> = {
    MWL: 3,
    ISNA: 2,
    Egypt: 5,
    Makkah: 4,
    Karachi: 1,
    Tehran: 7,
    Jafari: 0,
  };
  return methods[method] || 3;
}

function getPrayerDisplay(prayer: string): { emoji: string; name: string } {
  const displays: Record<string, { emoji: string; name: string }> = {
    fajr: { emoji: "🌅", name: "Fajr" },
    dhuhr: { emoji: "☀️", name: "Dhuhr" },
    asr: { emoji: "🌤️", name: "Asr" },
    maghrib: { emoji: "🌇", name: "Maghrib" },
    isha: { emoji: "🌙", name: "Isha" },
  };
  return displays[prayer] || { emoji: "🕌", name: prayer };
}

function isTimeToNotify(prayerTime: string, offsetMinutes: number, now: Date): boolean {
  const [hours, minutes] = prayerTime.split(":").map(Number);
  const prayerDate = new Date(now);
  prayerDate.setHours(hours, minutes + offsetMinutes, 0, 0);
  const diff = prayerDate.getTime() - now.getTime();
  return diff >= 0 && diff < 5 * 60 * 1000;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const svc = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const { data: preferences, error: prefError } = await svc
      .from("user_notification_preferences")
      .select("*")
      .eq("enabled", true);

    if (prefError) throw prefError;
    if (!preferences || preferences.length === 0) {
      return json(200, { message: "No active preferences", sent: 0 });
    }

    let sent = 0;
    const errors: string[] = [];

    for (const pref of preferences) {
      try {
        const times = await getPrayerTimes(
          Number(pref.latitude),
          Number(pref.longitude),
          pref.calculation_method,
          today
        );

        if (!times) {
          errors.push(`Failed to get times for preference ${pref.id}`);
          continue;
        }

        const enabledPrayers = pref.enabled_prayers as Record<string, boolean>;
        
        for (const [prayer, enabled] of Object.entries(enabledPrayers)) {
          if (!enabled) continue;

          const prayerTime = times[prayer as keyof PrayerTimes];
          if (!prayerTime) continue;

          if (!isTimeToNotify(prayerTime, pref.notification_offset, now)) continue;

          const { data: existing } = await svc
            .from("prayer_notification_log")
            .select("id")
            .eq("preference_id", pref.id)
            .eq("prayer_name", prayer)
            .eq("prayer_date", today)
            .maybeSingle();

          if (existing) continue;

          const { data: tokens } = await svc
            .from("device_push_tokens")
            .select("id, token, platform")
            .eq("device_id", pref.device_id)
            .eq("enabled", true);

          if (!tokens || tokens.length === 0) continue;

          const display = getPrayerDisplay(prayer);
          const { data: notification, error: notifErr } = await svc
            .from("admin_notifications")
            .insert({
              title: `${display.emoji} ${display.name} Time`,
              message: `It's time for ${display.name} prayer. May Allah accept your worship.`,
              status: "draft",
            })
            .select("id")
            .single();

          if (notifErr) {
            errors.push(`Failed to create notification: ${notifErr.message}`);
            continue;
          }

          const sendUrl = `${supabaseUrl}/functions/v1/send-push`;
          const sendRes = await fetch(sendUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ notificationId: notification.id }),
          });

          if (!sendRes.ok) {
            errors.push(`Failed to send notification: ${await sendRes.text()}`);
            continue;
          }

          await svc.from("prayer_notification_log").insert({
            preference_id: pref.id,
            prayer_name: prayer,
            prayer_time: `${today}T${prayerTime}:00Z`,
            prayer_date: today,
            notification_id: notification.id,
          });

          sent++;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push(`Error processing ${pref.id}: ${msg}`);
      }
    }

    return json(200, {
      message: "Prayer notifications processed",
      processed: preferences.length,
      sent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("send-prayer-notifications error:", msg);
    return json(500, { error: msg });
  }
});