import { supabase } from '@/integrations/supabase/client';

export const OG_BUCKET = 'media';
export const OG_FOLDER = 'dua-og';
export const STORY_OG_FOLDER = 'story-og';

export const ogStoragePath = (slug: string, folder: string = OG_FOLDER) => `${folder}/${slug}.webp`;

/**
 * Normalizes any stored OG image value into a loadable URL.
 *
 * Supports every value shape written by older versions of the OG system:
 *  - absolute public URL (current format, may carry a ?v= cache-buster)
 *  - bucket-qualified path  ("media/dua-og/slug.webp")
 *  - bare storage path      ("dua-og/slug.webp" or "slug.webp")
 * Returns null when there is nothing renderable.
 */
export function resolveOgImageUrl(raw?: string | null, folder: string = OG_FOLDER): string | null {
  const value = (raw ?? '').trim();
  if (!value) return null;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  let path = value.replace(/^\/+/, '');
  if (path.startsWith(`${OG_BUCKET}/`)) path = path.slice(OG_BUCKET.length + 1);
  if (!path.includes('/')) path = `${folder}/${path}`;

  const { data } = supabase.storage.from(OG_BUCKET).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

/** Public URL for the deterministic storage location of a slug's OG image. */
export function ogPublicUrlForSlug(slug?: string | null, folder: string = OG_FOLDER): string | null {
  const s = (slug ?? '').trim();
  if (!s) return null;
  const { data } = supabase.storage.from(OG_BUCKET).getPublicUrl(ogStoragePath(s, folder));
  return data?.publicUrl ?? null;
}
