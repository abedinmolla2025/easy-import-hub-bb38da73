import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Loader2, RefreshCw, Upload } from 'lucide-react';
import { estimateReadingMinutes, type Story } from '@/lib/stories';

export type StoryImportResult = { insertedIds: string[]; updatedIds: string[] };

export function storyRowFromJson(story: Story, publish: boolean) {
  const bn = story.content_bn ?? '';
  const en = story.content_en ?? '';
  return {
    content_type: 'story',
    slug: story.slug,
    title: story.title_bn || story.title_en || story.slug,
    title_en: story.title_en ?? null,
    title_ur: story.title_ur ?? null,
    content: bn || null,
    content_en: en || null,
    content_ur: story.content_ur ?? null,
    moral_bn: story.moral_bn ?? null,
    moral_en: story.moral_en ?? null,
    moral_ur: story.moral_ur ?? null,
    category: story.category ?? null,
    source_name: story.source_name ?? null,
    source_detail: story.source_detail ?? null,
    reference: story.reference ?? null,
    reading_time_minutes: estimateReadingMinutes(bn || en),
    seo: (story.seo ?? null) as any,
    navigation: (story.navigation ?? null) as any,
    engagement: (story.engagement ?? null) as any,
    growth: (story.growth ?? null) as any,
    related_stories:
      (story.navigation?.related_stories ?? story.growth?.related ?? []).map((r) => r.slug) || null,
    tags: Array.isArray(story.seo?.keywords) ? (story.seo?.keywords as string[]) : null,
    status: publish ? 'published' : 'draft',
    is_published: publish,
    ...(publish ? { published_at: new Date().toISOString() } : {}),
  };
}

export function StoryImportPanel({
  canEdit = true,
  onImported,
}: {
  canEdit?: boolean;
  onImported?: (result: StoryImportResult) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [dbCount, setDbCount] = useState<number | null>(null);
  const [bundledCount, setBundledCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const refresh = useCallback(async () => {
    const { count } = await supabase
      .from('admin_content')
      .select('id', { count: 'exact', head: true })
      .eq('content_type', 'story');
    setDbCount(count ?? 0);
    const mod = await import('@/data/stories.json');
    setBundledCount((mod.default as unknown as Story[]).length);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const importStories = async (stories: Story[], publish: boolean) => {
    if (!canEdit) {
      toast({ title: 'No permission', variant: 'destructive' });
      return;
    }
    setBusy(true);
    setProgress(0);
    const insertedIds: string[] = [];
    const updatedIds: string[] = [];
    let failed = 0;

    try {
      const { data: existing } = await supabase
        .from('admin_content')
        .select('id, slug')
        .eq('content_type', 'story');
      const bySlug = new Map((existing ?? []).map((r: any) => [r.slug, r.id as string]));

      for (let i = 0; i < stories.length; i++) {
        const story = stories[i];
        if (!story?.slug) {
          failed += 1;
          continue;
        }
        const row = storyRowFromJson(story, publish);
        const existingId = bySlug.get(story.slug);
        try {
          if (existingId) {
            const { status, is_published, published_at, ...rest } = row as any;
            const { error } = await supabase.from('admin_content').update(rest).eq('id', existingId);
            if (error) throw error;
            updatedIds.push(existingId);
          } else {
            const { data, error } = await supabase.from('admin_content').insert(row as any).select('id').single();
            if (error) throw error;
            insertedIds.push(data.id as string);
          }
        } catch (e) {
          failed += 1;
          console.error('Story import failed for', story.slug, e);
        }
        setProgress(Math.round(((i + 1) / stories.length) * 100));
      }

      await queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      await refresh();
      onImported?.({ insertedIds, updatedIds });
      toast({
        title: 'Stories imported',
        description: `${insertedIds.length} new · ${updatedIds.length} updated${failed ? ` · ${failed} failed` : ''}`,
        variant: failed && !insertedIds.length && !updatedIds.length ? 'destructive' : 'default',
      });
    } finally {
      setBusy(false);
    }
  };

  const importBundled = async () => {
    const mod = await import('@/data/stories.json');
    await importStories(mod.default as unknown as Story[], true);
  };

  const importFile = async (file?: File | null) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const list: Story[] = Array.isArray(parsed) ? parsed : parsed?.stories;
      if (!Array.isArray(list)) throw new Error('Expected a JSON array of stories');
      await importStories(list, false);
    } catch (e) {
      toast({
        title: 'Invalid JSON',
        description: e instanceof Error ? e.message : 'Could not read file',
        variant: 'destructive',
      });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Card className="shadow-sm border-border/80">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              Story Import &amp; Sync
            </CardTitle>
            <CardDescription>
              Sync the bundled stories dataset into the database, or upload your own stories JSON.
              Existing stories are matched by slug and updated — never duplicated.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="rounded-full">
            {dbCount ?? '…'} in DB · {bundledCount ?? '…'} bundled
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={importBundled} disabled={!canEdit || busy}>
            {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <BookOpen className="mr-1 h-3.5 w-3.5" />}
            Sync bundled stories
          </Button>
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={!canEdit || busy}>
            <Upload className="mr-1 h-3.5 w-3.5" />
            Import Stories (JSON)
          </Button>
          <Button size="sm" variant="outline" onClick={refresh} disabled={busy}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Refresh
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => importFile(e.target.files?.[0])}
          />
        </div>
        {busy && <Progress value={progress} />}
      </CardContent>
    </Card>
  );
}

export default StoryImportPanel;
