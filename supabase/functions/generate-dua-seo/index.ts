import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM_PROMPT = [
  "তুমি একজন ইসলামিক স্কলার এবং বাংলা SEO কন্টেন্ট লেখক।",
  "প্রতিটি দোয়ার জন্য সহজ, প্রাঞ্জল বাংলায় ব্যাখ্যা ও ফজিলত লিখবে।",
  "explanation_bn: ১০০–১৫০ শব্দ, সহজ বাংলা; দোয়ার অর্থ, প্রেক্ষাপট ও বাস্তব শিক্ষা ব্যাখ্যা করো।",
  "স্বাভাবিকভাবে অন্তত একবার এই phrase গুলোর কোনো একটি ব্যবহার করো: \"এই দোয়ার ফজিলত\", \"আমরা শিখি\", \"ইসলামে শিক্ষা\"।",
  "benefits_bn: ৩–৫টি ছোট bullet point, প্রতিটি ৬–১৫ শব্দ; দোয়ার আধ্যাত্মিক ও ব্যবহারিক উপকার।",
  "প্রতিটি দোয়ার জন্য কন্টেন্ট unique হতে হবে।",
  "একই কন্টেন্টের English (en), Hindi (hi) এবং Urdu (ur) অনুবাদও দাও — explanation_en/hi/ur (১০০–১৫০ words) এবং benefits_en/hi/ur (৩–৫ bullet points each)। অনুবাদ অর্থ-বিশ্বস্ত ও স্বাভাবিক হতে হবে।",
  "শুধু tool call এর মাধ্যমে structured output দাও, free text নয়।",
].join("\n");

async function generateForDua(args: {
  title: string | null;
  arabic: string | null;
  bengali: string | null;
  category: string | null;
}, attempt = 0): Promise<{ explanation_bn: string; benefits_bn: string[]; explanation_en: string; benefits_en: string[]; explanation_hi: string; benefits_hi: string[]; explanation_ur: string; benefits_ur: string[] }> {
  const userText = `দোয়ার নাম: ${args.title || "(নাম নেই)"}\nবিভাগ: ${args.category || "সাধারণ"}\n\nআরবি:\n${args.arabic || "(আরবি নেই)"}\n\nবাংলা অর্থ:\n${args.bengali || "(অনুবাদ নেই, আরবি থেকে বের করো)"}\n\nএই দোয়ার জন্য বাংলা explanation_bn ও benefits_bn তৈরি করো।`;

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
            name: "save_dua_seo",
            description: "Save the multilingual SEO explanation and benefits for a dua (Bengali + English + Hindi + Urdu).",
            parameters: {
              type: "object",
              properties: {
                explanation_bn: { type: "string" },
                benefits_bn: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 5,
                },
                explanation_en: { type: "string" },
                benefits_en: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 5,
                },
                explanation_hi: { type: "string" },
                benefits_hi: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 5,
                },
                explanation_ur: { type: "string" },
                benefits_ur: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 5,
                },
              },
              required: [
                "explanation_bn",
                "benefits_bn",
                "explanation_en",
                "benefits_en",
                "explanation_hi",
                "benefits_hi",
                "explanation_ur",
                "benefits_ur",
              ],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "save_dua_seo" } },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    if (resp.status === 429) {
      if (attempt < 2) {
        const waitMs = 1500 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, waitMs));
        return generateForDua(args, attempt + 1);
      }
      throw new Error("RATE_LIMIT");
    }
    if (resp.status === 402) throw new Error("PAYMENT_REQUIRED");
    throw new Error(`AI ${resp.status}: ${t.slice(0, 200)}`);
  }
  const data = await resp.json();
  const call = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) throw new Error("no tool call returned");
  const parsed = JSON.parse(call.function.arguments);
  if (!parsed.explanation_bn || !Array.isArray(parsed.benefits_bn)) {
    throw new Error("invalid tool args");
  }
  const cleanArr = (a: unknown) =>
    Array.isArray(a) ? a.map((s: any) => String(s).trim()).filter(Boolean) : [];
  return {
    explanation_bn: String(parsed.explanation_bn).trim(),
    benefits_bn: cleanArr(parsed.benefits_bn),
    explanation_en: parsed.explanation_en ? String(parsed.explanation_en).trim() : "",
    benefits_en: cleanArr(parsed.benefits_en),
    explanation_hi: parsed.explanation_hi ? String(parsed.explanation_hi).trim() : "",
    benefits_hi: cleanArr(parsed.benefits_hi),
    explanation_ur: parsed.explanation_ur ? String(parsed.explanation_ur).trim() : "",
    benefits_ur: cleanArr(parsed.benefits_ur),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "process";
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (action === "stats") {
      const { count: total } = await supabase
        .from("admin_content")
        .select("*", { count: "exact", head: true })
        .in("content_type", ["dua", "Dua"]);
      const { count: pending } = await supabase
        .from("admin_content")
        .select("*", { count: "exact", head: true })
        .in("content_type", ["dua", "Dua"])
        .or(
          "explanation_bn.is.null,benefits_bn.is.null,explanation_en.is.null,benefits_en.is.null,explanation_hi.is.null,benefits_hi.is.null,explanation_ur.is.null,benefits_ur.is.null",
        );
      return new Response(
        JSON.stringify({ total: total ?? 0, pending: pending ?? 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const batchSize = Math.min(Math.max(Number(body.batchSize) || 10, 1), 20);

    const { data: rows, error } = await supabase
      .from("admin_content")
      .select(
        "id, title, category, content_arabic, content, explanation_bn, benefits_bn, explanation_en, benefits_en, explanation_hi, benefits_hi, explanation_ur, benefits_ur",
      )
      .in("content_type", ["dua", "Dua"])
      .or(
        "explanation_bn.is.null,benefits_bn.is.null,explanation_en.is.null,benefits_en.is.null,explanation_hi.is.null,benefits_hi.is.null,explanation_ur.is.null,benefits_ur.is.null",
      )
      .limit(batchSize);

    if (error) throw error;
    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, failed: 0, pending: 0, done: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    const concurrency = 3;
    for (let i = 0; i < rows.length; i += concurrency) {
      const slice = rows.slice(i, i + concurrency);
      await Promise.all(
        slice.map(async (d: any) => {
          try {
            const out = await generateForDua({
              title: d.title,
              arabic: d.content_arabic,
              bengali: d.content,
              category: d.category,
            });
            const update: Record<string, unknown> = {};
            if (!d.explanation_bn) update.explanation_bn = out.explanation_bn;
            if (!d.benefits_bn || d.benefits_bn.length === 0)
              update.benefits_bn = out.benefits_bn;
            if (!d.explanation_en && out.explanation_en)
              update.explanation_en = out.explanation_en;
            if ((!d.benefits_en || d.benefits_en.length === 0) && out.benefits_en.length > 0)
              update.benefits_en = out.benefits_en;
            if (!d.explanation_hi && out.explanation_hi)
              update.explanation_hi = out.explanation_hi;
            if ((!d.benefits_hi || d.benefits_hi.length === 0) && out.benefits_hi.length > 0)
              update.benefits_hi = out.benefits_hi;
            if (!d.explanation_ur && out.explanation_ur)
              update.explanation_ur = out.explanation_ur;
            if ((!d.benefits_ur || d.benefits_ur.length === 0) && out.benefits_ur.length > 0)
              update.benefits_ur = out.benefits_ur;
            if (Object.keys(update).length === 0) return;
            const { error: upErr } = await supabase
              .from("admin_content")
              .update(update)
              .eq("id", d.id);
            if (upErr) throw upErr;
            processed++;
          } catch (e) {
            failed++;
            errors.push(`${d.id}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }),
      );
    }

    const { count: pending } = await supabase
      .from("admin_content")
      .select("*", { count: "exact", head: true })
      .in("content_type", ["dua", "Dua"])
      .or(
        "explanation_bn.is.null,benefits_bn.is.null,explanation_en.is.null,benefits_en.is.null,explanation_hi.is.null,benefits_hi.is.null,explanation_ur.is.null,benefits_ur.is.null",
      );

    return new Response(
      JSON.stringify({
        processed,
        failed,
        errors: errors.slice(0, 5),
        pending: pending ?? 0,
        done: (pending ?? 0) === 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-dua-seo error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});