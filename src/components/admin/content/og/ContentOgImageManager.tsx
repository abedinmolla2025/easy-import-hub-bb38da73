import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Copy, ExternalLink, ImageIcon, Loader2, RefreshCw, Trash2, Upload } from 'lucide-react';

import {
  OG_BUCKET,
  OG_FOLDER,
  STORY_OG_FOLDER,
  ogPublicUrlForSlug,
  ogStoragePath,
  resolveOgImageUrl,
} from '@/lib/admin/content/ogImage';

export { OG_BUCKET, OG_FOLDER, STORY_OG_FOLDER, ogStoragePath };

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function formatBytes(bytes?: number | null) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

async function toOgWebp(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = OG_WIDTH;
  canvas.height = OG_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.imageSmoothingQuality = 'high';

  // cover-fit crop
  const scale = Math.max(OG_WIDTH / img.width, OG_HEIGHT / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (OG_WIDTH - w) / 2, (OG_HEIGHT - h) / 2, w, h);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/webp', 0.85),
  );
  if (!blob) throw new Error('Failed to convert image to WebP');
  return blob;
}

type Props = {
  contentId: string;
  slug: string | null | undefined;
  url: string | null | undefined;
  onChanged?: () => void;
  /** compact = inline card body inside the edit form */
  layout?: 'card' | 'modal';
  /** storage folder inside the media bucket (dua-og, story-og, ...) */
  folder?: string;
};

export function ContentOgImageControls({
  contentId,
  slug,
  url: rawUrl,
  onChanged,
  layout = 'card',
  folder = OG_FOLDER,
}: Props) {
  const { toast } = useToast();
  const [broken, setBroken] = useState(false);
  const [storageUrl, setStorageUrl] = useState<string | null>(null);

  // Stored value may be an absolute URL or a legacy storage path.
  const dbUrl = resolveOgImageUrl(rawUrl, folder);
  // Fallback: an image may exist in storage even when the column is empty
  // (legacy rows / interrupted uploads). We only read — never write.
  const url = dbUrl ?? storageUrl;

  useEffect(() => {
    let cancelled = false;
    setBroken(false);
    if (dbUrl || !slug) {
      setStorageUrl(null);
      return;
    }
    (async () => {
      const { data } = await supabase.storage
        .from(OG_BUCKET)
        .list(folder, { limit: 1, search: `${slug}.webp` });
      if (cancelled) return;
      const found = (data ?? []).some((f) => f.name === `${slug}.webp`);
      setStorageUrl(found ? ogPublicUrlForSlug(slug, folder) : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [dbUrl, slug, folder]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [info, setInfo] = useState<{ size?: number; width?: number; height?: number } | null>(null);

  const readInfo = useCallback(async () => {
    if (!url) {
      setInfo(null);
      return;
    }
    try {
      const img = await loadImage(await (await fetch(url)).blob());
      setInfo((prev) => ({ ...prev, width: img.naturalWidth, height: img.naturalHeight }));
    } catch {
      /* ignore */
    }
    try {
      const head = await fetch(url, { method: 'HEAD' });
      const len = head.headers.get('content-length');
      if (len) setInfo((prev) => ({ ...prev, size: Number(len) }));
    } catch {
      /* ignore */
    }
  }, [url]);

  useEffect(() => {
    readInfo();
  }, [readInfo]);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!slug) {
      toast({ title: 'Slug missing', description: 'Add a slug before uploading an OG image.', variant: 'destructive' });
      return;
    }
    if (!ACCEPTED.includes(file.type)) {
      toast({ title: 'Unsupported file', description: 'Use JPG, PNG or WebP.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: 'File too large', description: 'Maximum size is 5 MB.', variant: 'destructive' });
      return;
    }

    setBusy(true);
    try {
      const webp = await toOgWebp(file);
      const path = ogStoragePath(slug, folder);
      const { error: upErr } = await supabase.storage.from(OG_BUCKET).upload(path, webp, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true,
      });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(OG_BUCKET).getPublicUrl(path);
      const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;

      const { error: dbErr } = await supabase
        .from('admin_content')
        .update({ og_image_url: publicUrl })
        .eq('id', contentId);
      if (dbErr) throw dbErr;

      setBroken(false);
      setStorageUrl(publicUrl);
      setInfo({ size: webp.size, width: OG_WIDTH, height: OG_HEIGHT });
      toast({ title: 'OG image updated', description: `${OG_WIDTH}×${OG_HEIGHT} WebP · ${formatBytes(webp.size)}` });
      onChanged?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      toast({ title: 'Upload failed', description: msg, variant: 'destructive' });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      if (slug) {
        await supabase.storage.from(OG_BUCKET).remove([ogStoragePath(slug, folder)]);
      }
      const { error } = await supabase.from('admin_content').update({ og_image_url: null }).eq('id', contentId);
      if (error) throw error;
      setInfo(null);
      setStorageUrl(null);
      setBroken(false);
      toast({ title: 'OG image deleted' });
      onChanged?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Delete failed';
      toast({ title: 'Delete failed', description: msg, variant: 'destructive' });
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  const copyUrl = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast({ title: 'Image URL copied' });
  };

  return (
    <div className="space-y-3">
      <div
        className={`relative w-full overflow-hidden rounded-lg border border-border bg-muted ${
          layout === 'modal' ? 'max-w-[640px]' : 'max-w-[420px]'
        }`}
        style={{ aspectRatio: '1200 / 630' }}
      >
        {url && !broken ? (
          <img
            src={url}
            alt="OG preview"
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
            <span className="text-[11px]">{url ? 'Image unavailable in storage' : 'No OG image'}</span>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          {url ? <RefreshCw className="mr-1 h-3.5 w-3.5" /> : <Upload className="mr-1 h-3.5 w-3.5" />}
          {url ? 'Replace Image' : 'Upload Image'}
        </Button>
        {url && (
          <>
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
              <Upload className="mr-1 h-3.5 w-3.5" />
              Upload New
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={copyUrl}>
              <Copy className="mr-1 h-3.5 w-3.5" />
              Copy URL
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                View Full Image
              </a>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground sm:text-xs">
        <div>
          <span className="text-muted-foreground/70">Resolution:</span>{' '}
          {info?.width && info?.height ? `${info.width}×${info.height}` : url ? '—' : `${OG_WIDTH}×${OG_HEIGHT} (target)`}
        </div>
        <div>
          <span className="text-muted-foreground/70">File size:</span> {formatBytes(info?.size)}
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground/70">Storage path:</span>{' '}
          {slug ? `${OG_BUCKET}/${ogStoragePath(slug, folder)}` : 'slug required'}
        </div>
      </div>

      <Input value={url ?? ''} readOnly placeholder="No image URL" className="text-[11px] sm:text-xs" />
      <p className="text-[11px] text-muted-foreground">
        JPG / PNG / WebP · max 5 MB · auto-resized to {OG_WIDTH}×{OG_HEIGHT} WebP.
      </p>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete OG image?</AlertDialogTitle>
            <AlertDialogDescription>
              The file will be removed from storage and the OG image URL will be cleared. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} disabled={busy}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ContentOgImageManagerDialog({
  open,
  onOpenChange,
  title,
  ...rest
}: Props & { open: boolean; onOpenChange: (v: boolean) => void; title?: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="truncate text-base">OG Image Manager{title ? ` — ${title}` : ''}</DialogTitle>
        </DialogHeader>
        <ContentOgImageControls {...rest} layout="modal" />
      </DialogContent>
    </Dialog>
  );
}

export function ContentOgThumbnail({
  url: rawUrl,
  onClick,
  slug,
  folder = OG_FOLDER,
  storageIndex,
}: {
  url?: string | null;
  onClick: () => void;
  slug?: string | null;
  folder?: string;
  /** Set of file names present in the OG folder, used as a fallback source. */
  storageIndex?: Set<string>;
}) {
  const [broken, setBroken] = useState(false);
  const dbUrl = resolveOgImageUrl(rawUrl, folder);
  const fallbackUrl =
    !dbUrl && slug && storageIndex?.has(`${slug}.webp`) ? ogPublicUrlForSlug(slug, folder) : null;
  const url = dbUrl ?? fallbackUrl;

  useEffect(() => {
    setBroken(false);
  }, [url]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block h-[63px] w-[120px] overflow-hidden rounded-md border border-border bg-muted transition-all hover:ring-2 hover:ring-primary/40"
      aria-label="Manage OG image"
    >
      {url && !broken ? (
        <img
          src={url}
          alt="OG"
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          <span className="text-[9px]">{url ? 'Unavailable' : 'No image'}</span>
        </span>
      )}
    </button>
  );
}
