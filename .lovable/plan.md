# Phase 1 + 2 + 3 — Content Enrichment, Internal Linking, Dynamic Sitemap

This is a large body of work. Below is the concrete build plan, broken into shippable sub-phases so you can review after each one. All work follows the existing Hadith / Dua-SEO generator pattern already in the codebase (`generate-hadith-seo`, `generate-dua-seo`, `HadithSeoGeneratorPanel`, `DuaSeoGeneratorPanel`, `ContentQualityCheckPanel`) — same batch + preview + approve workflow, so nothing new to learn.

---

## Sub-phase A — Dua enrichment (extend, not rebuild)

The Dua SEO generator already exists (`DuaSeoGeneratorPanel` + `generate-dua-seo`) and fills `explanation` + `benefits` in 4 languages. What's missing for AdSense depth:

1. New edge function `enrich-dua-content` that generates, per Dua:
   - `context_bn/en/hi/ur` — 80-120 word background (when to recite, situation)
   - `virtues_bn/en/hi/ur` — 3-5 bullet virtues (fadail)
   - `related_duas` — 3-5 IDs of thematically related Duas (for internal linking)
   - `source_reference` — Quran ayah OR hadith book+number, **only if the AI is confident and cites an existing Bukhari/Muslim/Tirmidhi/Abu Dawud/Quran reference from our DB**. If not confident → leave null. No fabrication.
2. Migration adds nullable columns (`context_*`, `virtues_*`, `related_dua_ids uuid[]`, `source_ref jsonb`) to `admin_content` — no destructive changes.
3. Admin panel `DuaEnrichmentPanel` — same UI as Hadith generator: stats, batch-run, stop, error log, per-item **Preview → Approve → Publish**. Nothing writes to `is_published=true` fields without manual approval.
4. Validation: reject batches where source_ref points to a hadith not in `hadiths` table, or an out-of-range Quran ayah.

## Sub-phase B — 99 Names of Allah enrichment

Names data currently lives as short entries. Add per-name:

- `meaning_extended_bn/en/hi/ur` — 120-180 word explanation
- `quranic_reference` — Ayah where the name appears (validated against a static ayah map bundled in the edge function; drop reference if not verifiable)
- `benefits_bn/en/hi/ur` — 3-5 bullet spiritual benefits
- `related_names` — 3 thematically related names

New edge function `enrich-names-content` + `NamesEnrichmentPanel` in Admin → Content. Same preview/approve flow. Since 99 Names is a fixed small set, we can review every row.

## Sub-phase C — Baby Names enrichment

For each baby name row in `admin_content` where `content_type='name'`:

- `meaning_detail_bn/en` — 60-100 word meaning + cultural note
- `origin` (Arabic/Persian/Turkish/etc.) — enum, not free text
- `pronunciation_ipa` — optional
- `similar_names` — 5 IDs of similar names (same gender + phonetic/meaning similarity)

New edge function `enrich-baby-names` + `BabyNamesEnrichmentPanel`. Batch size 25 (short content). No fabricated Islamic references — baby names are cultural, not religious rulings, so we only cite origin & linguistic meaning.

## Sub-phase D — Internal linking

Add a shared `RelatedContent` component that reads `related_*` arrays from a page's row and renders a contextual "আরও পড়ুন" section. Wire into:

- `DuaDetailPage` — shows related Duas
- `NamesOfAllahPage` (detail view) — shows related names
- Baby name detail view — shows similar names
- `HadithDetailPage` — shows other hadiths in same chapter (already have chapter_id, no AI needed)

## Sub-phase E — Dynamic sitemap

Extend the existing `supabase/functions/sitemap` edge function (which already ships dynamic story URLs) to also emit:

- `/dua/:slug` — every published Dua row
- `/99-names/:slug` — every name
- `/baby-names/:slug` — every baby name where `is_published=true`
- `/hadith/h/:slug` — every hadith row

Also add a top-level `/sitemap-index.xml` that references the static `public/sitemap.xml` + the dynamic one, so Google gets both. Update `robots.txt` to point at the sitemap index.

---

## Technical notes

- All AI calls use Lovable AI Gateway (`LOVABLE_API_KEY`, model `openai/gpt-5.5`), same as existing generators.
- All new DB columns are **nullable**; nothing overwrites existing content.
- Two-stage write: AI output → `pending_review` field, then admin clicks **Approve** → copies into the live fields. Existing `ContentQualityCheckPanel` gets a "Pending Enrichment" tab.
- No UI/routing/auth changes on the public app beyond adding the `RelatedContent` block.
- Validation rules run **server-side inside the edge function** before writing pending_review, so bad AI output never reaches the admin queue.

## Suggested order & rough sizing

| Sub-phase | Effort | Ship independently? |
|---|---|---|
| A. Dua enrichment | ~1 hr | Yes |
| B. 99 Names | ~40 min | Yes |
| C. Baby Names | ~1 hr | Yes |
| D. Internal linking | ~30 min | After A/B/C rows exist |
| E. Dynamic sitemap | ~20 min | Anytime |

I'll ship A → B → C → D → E and give you a validation report after each, so you can run each generator, review the queue, and approve before moving on.

**Confirm to proceed with Sub-phase A (Dua enrichment) first**, or tell me to reorder / drop any sub-phase.