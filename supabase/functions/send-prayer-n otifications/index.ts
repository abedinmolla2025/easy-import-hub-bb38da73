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

/**
 * Calculate prayer times using Aladhan API
 */
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

/**
 * Convert method name to Aladhan API method code
 */
function getMethodCode(method: string): number {
  const methods: Record<string, number> = {
    MWL: 3, // Muslim World League
    ISNA: 2, // Islamic Society of North America
    Egypt: 5, // Egyptian General Authority of Survey
    Makkah: 4, // Umm Al-Qura University, Makkah
    Karachi: 1, // University of Islamic Sciences, Karachi
    Tehran: 7, // Institute of Geophysics, University of Tehran
    Jafari: 0, // Shia Ithna-Ashari, Leva Institute, Qum
  };
  return methods[method] || 3;
}

/**
 * Get prayer name display
 */
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

/**
 * Check if it's time to send notification (within 5-minute window)
 */
function isTimeToNotify(prayerTime: string, offsetMinutes: number, now: Date): boolean {
  // Parse prayer time (format: HH:MM)
  const [hours, minutes] = prayerTime.split(":").map(Number);
  
  // Create prayer time date with offset
  const prayerDate = new Date(now);
  prayerDate.setHours(hours, minutes + offsetMinutes, 0, 0);

  // Check if we're within 5 minutes before the prayer time
  const diff = prayerDate.getTime() - now.getTime();
  return diff >= 0 && diff < 5 * 60 * 1000; // 0-5 minutes window
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const svc = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Get all enabled notification preferences
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

    // Process each user's preferences
    for (const pref of preferences) {
      try {
        // Get prayer times for this location
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

        // Check each enabled prayer
        const enabledPrayers = pref.enabled_prayers as Record<string, boolean>;
        
        for (const [prayer, enabled] of Object.entries(enabledPrayers)) {
          if (!enabled) continue;

          const prayerTime = times[prayer as keyof PrayerTimes];
          if (!prayerTime) continue;

          // Check if it's time to send notification
          if (!isTimeToNotify(prayerTime, pref.notification_offset, now)) continue;

          // Check if already sent today
          const { data: existing } = await svc
            .from("prayer_notification_log")
            .select("id")
            .eq("preference_id", pref.id)
            .eq("prayer_name", prayer)
            .eq("prayer_date", today)
            .maybeSingle();

          if (existing) continue; // Already sent

          // Find device tokens for this preference
          const { data: tokens } = await svc
            .from("device_push_tokens")
            .select("id, token, platform")
            .eq("device_id", pref.device_id)
            .eq("enabled", true);

          if (!tokens || tokens.length === 0) continue;

          // Create notification
          const display = getPrayerDisplay(prayer);
          const { data: notification, error: notifErr } = await svc
            .from("notifications")
            .insert({
              title: `${display.emoji} ${display.name} Time`,
              body: `It's time for ${display.name} prayer. May Allah accept your worship.`,
              deep_link: "/prayer-times",
              target_platform: "all",
              status: "draft",
              created_by: pref.user_id || "00000000-0000-0000-0000-000000000000",
            })
            .select("id")
            .single();

          if (notifErr) {
            errors.push(`Failed to create notification: ${notifErr.message}`);
            continue;
          }

          // Send via edge function
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

          // Log the sent notification
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
