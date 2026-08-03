import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OG_BUCKET, OG_FOLDER } from '@/lib/admin/content/ogImage';

/**
 * Lists the OG image folder once and exposes a Set of existing file names.
 * Lets the admin display OG images that exist in storage but whose
 * `og_image_url` column was never populated (legacy / interrupted uploads),
 * without issuing one request per row and without writing to the database.
 */
export function useOgStorageIndex(folder: string = OG_FOLDER, enabled = true) {
  return useQuery<Set<string>>({
    queryKey: ['og-storage-index', folder],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const names = new Set<string>();
      const pageSize = 1000;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase.storage
          .from(OG_BUCKET)
          .list(folder, { limit: pageSize, offset });
        if (error) break;
        for (const file of data ?? []) names.add(file.name);
        if (!data || data.length < pageSize) break;
      }
      return names;
    },
  });
}
