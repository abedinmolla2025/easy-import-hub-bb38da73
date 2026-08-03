/**
 * Dua-flavoured aliases over the shared content OG image manager.
 * Kept so existing Dua call sites stay untouched.
 */
export {
  ContentOgImageControls as DuaOgImageControls,
  ContentOgImageManagerDialog as DuaOgImageManagerDialog,
  ContentOgThumbnail as DuaOgThumbnail,
  OG_BUCKET,
  OG_FOLDER,
  STORY_OG_FOLDER,
  ogStoragePath,
  formatBytes,
} from '@/components/admin/content/og/ContentOgImageManager';
