import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PRONUNCIATION_MIN = 50;
const MEANING_MIN = 80;

const SYSTEM_PROMPT = [
  "তুমি একজন ইসলামিক স্কলার এবং বাংলা ভাষার বিশেষজ্ঞ।",
  "প্রতিটি দোয়ার জন্য সম্পূর্ণ বাংলা উচ্চারণ (transliteration) এবং সম্পূর্ণ বাংলা অর্থ লিখবে।",
  "content_pronunciation: সম্পূর্ণ আরবি text এর বাংলা উচ্চারণ; কোনো অংশ বাদ দেবে না; প্রতিটি শব্দ স্পষ্টভাবে; প্রয়োজনে multi-line।",
  "content (অর্থ): সহজ, প্রাঞ্জল বাংলায় ৩–৫ লাইনের সম্পূর্ণ অনুবাদ; multi-line paragraph; পাঠযোগ্য।",
  "কোনো অংশ সংক্ষেপ করবে না। আরবি text এর প্রতিটি বাক্যের অনুবাদ ও উচ্চারণ থাকতে হবে।",
  "শুধু tool call এর মাধ্যমে structured output দাও।",
].join("\n");

async function generate(args: {
  title: string | null;
  arabic: string | null;
  existingPron: string | null;
  existingMeaning: string | null;
  needPron: boolean;
  needMeaning: boolean;
}) {
  const userText = `দোয়ার নাম: ${args.title || "(নাম নেই)"}\n\nআরবি text:\n${args.arabic || "(নেই)"}\n\nবর্তমান বাংলা উচ্চারণ (অসম্পূর্ণ হতে পারে):\n${args.existingPron || "(নেই)"}\n\nবর্তমান বাংলা অর্থ (অসম্পূর্ণ হতে পারে):\n${args.existingMeaning || "(নেই)"}\n\nসম্পূর্ণ ও পরিচ্ছন্ন বাংলা content_pronunciation এবং content (অর্থ) তৈরি করো।`;

  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  if (args.needPron) {
    properties.content_pronunciation = { type: "string", description: "সম্পূর্ণ বাংলা উচ্চারণ, multi-line" };
    required.push("content_pronunciation");
  }
  if (args.needMeaning) {
    properties.content = { type: "string", description: "সম্পূর্ণ বাংলা অর্থ, ৩–৫ লাইন, multi-line paragraph" };
    required.push("content");
  }

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userText },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "save_dua_content",
            description: "Save complete Bengali pronunciation and meaning for a dua.",
            parameters: {
              type: "object",
              properties,
              required,
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "save_dua_content" } },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    if (resp.status === 429) throw new Error("RATE_LIMIT");
    if (resp.status === 402) throw new Error("PAYMENT_REQUIRED");
    throw new Error(`AI ${resp.status}: ${t.slice(0, 200)}`);
  }
  const data = await resp.json();
  const call = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) throw new Error("no tool call returned");
  const parsed = JSON.parse(call.function.arguments);
  const out: { content_pronunciation?: string; content?: string } = {};
  if (args.needPron && typeof parsed.content_pronunciation === "string") {
    out.content_pronunciation = parsed.content_pronunciation.trim();
  }
  if (args.needMeaning && typeof parsed.content === "string") {
    out.content = parsed.content.trim();
  }
  return out;
}

function isIncomplete(pron: string | null, meaning: string | null) {
  const pronLen = (pron ?? "").trim().length;
  const meanLen = (meaning ?? "").trim().length;
  return {
    needPron: pronLen < PRONUNCIATION_MIN,
    needMeaning: meanLen < MEANING_MIN,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "process";
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (action === "stats") {
      // Fetch all duas (light columns) to count incomplete client-side (lengths)
      const { data, error } = await supabase
        .from("admin_content")
        .select("id, content, content_pronunciation")
        .in("content_type", ["dua", "Dua"]);
      if (error) throw error;
      const total = data?.length ?? 0;
      let pending = 0;
      for (const d of data ?? []) {
        const { needPron, needMeaning } = isIncomplete(d.content_pronunciation, d.content);
        if (needPron || needMeaning) pending++;
      }
      return new Response(
        JSON.stringify({ total, pending }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const batchSize = Math.min(Math.max(Number(body.batchSize) || 10, 1), 20);

    // Pull a candidate window then filter by length to find incomplete ones
    const { data: rows, error } = await supabase
      .from("admin_content")
      .select("id, title, content_arabic, content, content_pronunciation")
      .in("content_type", ["dua", "Dua"]);
    if (error) throw error;

    const incomplete = (rows ?? [])
      .map((d: any) => {
        const { needPron, needMeaning } = isIncomplete(d.content_pronunciation, d.content);
        return { row: d, needPron, needMeaning };
      })
      .filter((x) => x.needPron || x.needMeaning);

    const totalPending = incomplete.length;
    const slice = incomplete.slice(0, batchSize);

    if (slice.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, failed: 0, pending: 0, done: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    const concurrency = 3;
    for (let i = 0; i < slice.length; i += concurrency) {
      const chunk = slice.slice(i, i + concurrency);
      await Promise.all(
        chunk.map(async ({ row, needPron, needMeaning }) => {
          try {
            const out = await generate({
              title: row.title,
              arabic: row.content_arabic,
              existingPron: row.content_pronunciation,
              existingMeaning: row.content,
              needPron,
              needMeaning,
            });
            const update: Record<string, unknown> = {};
            if (needPron && out.content_pronunciation && out.content_pronunciation.length >= PRONUNCIATION_MIN) {
              update.content_pronunciation = out.content_pronunciation;
            }
            if (needMeaning && out.content && out.content.length >= MEANING_MIN) {
              update.content = out.content;
            }
            if (Object.keys(update).length === 0) {
              throw new Error("AI returned content too short");
            }
            const { error: upErr } = await supabase
              .from("admin_content")
              .update(update)
              .eq("id", row.id);
            if (upErr) throw upErr;
            processed++;
          } catch (e) {
            failed++;
            errors.push(`${row.id}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }),
      );
    }

    const pending = Math.max(totalPending - processed, 0);
    return new Response(
      JSON.stringify({
        processed,
        failed,
        errors: errors.slice(0, 5),
        pending,
        done: pending === 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("fix-dua-content error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});