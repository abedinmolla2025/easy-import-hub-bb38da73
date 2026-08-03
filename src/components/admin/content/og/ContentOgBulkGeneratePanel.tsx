import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ImageIcon, Loader2, RefreshCw, StopCircle } from 'lucide-react';
import { OG_BUCKET, OG_FOLDER, ogStoragePath } from './ContentOgImageManager';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

type PendingDua = {
  id: string;
  slug: string | null;
  title: string;
  title_arabic: string | null;
  content_arabic: string | null;
  category: string | null;
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    if (ctx.measureText(last).width > maxWidth) {
      while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
      lines[maxLines - 1] = `${last}…`;
    }
  }
  return lines;
}

async function renderOgImage(dua: PendingDua, brandLabel: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = OG_WIDTH;
  canvas.height = OG_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const bg = ctx.createLinearGradient(0, 0, OG_WIDTH, OG_HEIGHT);
  bg.addColorStop(0, '#05261c');
  bg.addColorStop(0.55, '#0b6b4f');
  bg.addColorStop(1, '#0f172a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

  // decorative arcs
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(OG_WIDTH - 120, OG_HEIGHT / 2, 120 + i * 70, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // left accent bar
  ctx.fillStyle = '#34d399';
  ctx.fillRect(72, 132, 8, 120);

  // brand
  ctx.fillStyle = '#a7f3d0';
  ctx.font = '600 30px system-ui, sans-serif';
  ctx.fillText(brandLabel, 72, 92);

  // category
  if (dua.category) {
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '500 26px system-ui, sans-serif';
    ctx.fillText(dua.category.replace(/[-_]/g, ' ').toUpperCase(), 104, 170);
  }

  // title
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 62px "Noto Sans Bengali", system-ui, sans-serif';
  const titleLines = wrapText(ctx, dua.title || 'Untitled', OG_WIDTH - 220, 3);
  let y = dua.category ? 250 : 220;
  for (const line of titleLines) {
    ctx.fillText(line, 104, y);
    y += 78;
  }

  // arabic
  const arabic = (dua.title_arabic || dua.content_arabic || '').trim();
  if (arabic) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '400 46px "Noto Naskh Arabic", "Amiri", serif';
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    const arabicLines = wrapText(ctx, arabic, OG_WIDTH - 220, 1);
    ctx.fillText(arabicLines[0] ?? '', OG_WIDTH - 104, Math.min(y + 60, OG_HEIGHT - 110));
    ctx.direction = 'ltr';
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 26px system-ui, sans-serif';
  ctx.fillText('noorapp.in', 104, OG_HEIGHT - 56);

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/webp', 0.85));
  if (!blob) throw new Error('Failed to encode WebP');
  return blob;
}

type BulkPanelProps = {
  canEdit?: boolean;
  /** admin_content.content_type to target */
  contentType?: string;
  /** storage folder inside the media bucket */
  folder?: string;
  /** brand line printed on the generated image */
  brandLabel?: string;
};

export function ContentOgBulkGeneratePanel({
  canEdit = true,
  contentType = 'dua',
  folder = OG_FOLDER,
  brandLabel = 'NoorApp · Dua',
}: BulkPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const stopRef = useRef(false);

  const [pending, setPending] = useState<PendingDua[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState<{ slug: string; error: string }[]>([]);
  const [current, setCurrent] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_content')
        .select('id, slug, title, title_arabic, content_arabic, category')
        .eq('content_type', contentType)
        .is('og_image_url', null)
        .order('title');
      if (error) throw error;
      setPending((data ?? []) as PendingDua[]);
    } catch (e) {
      toast({
        title: 'Could not load duas',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, contentType]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const run = async () => {
    if (!pending?.length) return;
    stopRef.current = false;
    setRunning(true);
    setDone(0);
    setFailed([]);

    const errors: { slug: string; error: string }[] = [];
    let ok = 0;

    for (const dua of pending) {
      if (stopRef.current) break;
      setCurrent(dua.title);
      try {
        if (!dua.slug) throw new Error('Missing slug');
        const blob = await renderOgImage(dua, brandLabel);
        const path = ogStoragePath(dua.slug, folder);
        const { error: upErr } = await supabase.storage.from(OG_BUCKET).upload(path, blob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: true,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(OG_BUCKET).getPublicUrl(path);
        const { error: dbErr } = await supabase
          .from('admin_content')
          .update({ og_image_url: `${pub.publicUrl}?v=${Date.now()}` })
          .eq('id', dua.id);
        if (dbErr) throw dbErr;
        ok += 1;
      } catch (e) {
        errors.push({ slug: dua.slug ?? dua.title, error: e instanceof Error ? e.message : 'Failed' });
      }
      setDone((d) => d + 1);
      setFailed([...errors]);
    }

    setCurrent(null);
    setRunning(false);
    queryClient.invalidateQueries({ queryKey: ['admin-content'] });
    await loadPending();
    toast({
      title: stopRef.current ? 'Generation stopped' : 'OG images generated',
      description: `${ok} uploaded${errors.length ? ` · ${errors.length} failed` : ''}`,
      variant: errors.length && !ok ? 'destructive' : 'default',
    });
  };

  const total = pending?.length ?? 0;
  const progress = total ? Math.round((done / total) * 100) : 0;

  return (
    <Card className="shadow-sm border-border/80">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4" />
              Bulk OG Image Generation
            </CardTitle>
            <CardDescription>
              Generates branded 1200×630 WebP previews for every item missing an OG image.
            </CardDescription>
          </div>
          <Badge variant={total ? 'secondary' : 'outline'} className="rounded-full">
            {loading ? 'Checking…' : `${total} missing`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={run} disabled={!canEdit || running || loading || !total}>
            {running ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="mr-1 h-3.5 w-3.5" />}
            {running ? 'Generating…' : `Generate ${total || ''} missing OG images`.trim()}
          </Button>
          {running ? (
            <Button size="sm" variant="destructive" onClick={() => { stopRef.current = true; }}>
              <StopCircle className="mr-1 h-3.5 w-3.5" />
              Stop
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={loadPending} disabled={loading}>
              <RefreshCw className={`mr-1 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>

        {(running || done > 0) && (
          <div className="space-y-1">
            <Progress value={progress} />
            <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
              {done}/{total} processed{current ? ` · ${current}` : ''}
            </p>
          </div>
        )}

        {failed.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-[11px] sm:text-xs">
            <p className="mb-1 font-medium text-destructive">{failed.length} failed</p>
            <ul className="max-h-28 space-y-0.5 overflow-y-auto text-muted-foreground">
              {failed.slice(0, 20).map((f) => (
                <li key={f.slug} className="truncate">{f.slug}: {f.error}</li>
              ))}
            </ul>
          </div>
        )}

        {!loading && !total && (
          <p className="text-[11px] text-muted-foreground sm:text-xs">Everything already has an OG image. 🎉</p>
        )}
      </CardContent>
    </Card>
  );
}

export default ContentOgBulkGeneratePanel;
