/**
 * Get all dua slugs for prerendering.
 * Fetches from Supabase at build time.
 */
import { supabase } from "@/integrations/supabase/client";

export async function getAllDuaSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from("admin_content")
    .select("slug")
    .eq("content_type", "dua")
    .eq("status", "published")
    .not("slug", "is", null)
    .order("created_at");

  if (error || !data) {
    console.error("Failed to fetch dua slugs:", error);
    return [];
  }

  return data.map((d: { slug: string }) => d.slug).filter(Boolean);
}
