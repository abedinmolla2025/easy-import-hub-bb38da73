import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeoPages, useUpsertSeoPage, useDeleteSeoPage, type SeoPageRow } from "@/hooks/useSeoIndexing";
import { FileText, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

const CHANGEFREQ_OPTIONS = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

export default function AdminSeoPagesTab() {
  const { data: pages, isLoading } = useSeoPages();
  const upsertMutation = useUpsertSeoPage();
  const deleteMutation = useDeleteSeoPage();
  const [editPage, setEditPage] = useState<Partial<SeoPageRow> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openNew = () => {
    setEditPage({ path: "", title: "", description: "", robots: "index,follow", changefreq: "weekly", priority: 0.8 });
    setDialogOpen(true);
  };

  const openEdit = (page: SeoPageRow) => {
    setEditPage({ ...page });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editPage?.path) return;
    await upsertMutation.mutateAsync(editPage as any);
    setDialogOpen(false);
    setEditPage(null);
  };

  if (isLoading) {
    return <div className="space-y-4 pt-4"><Skeleton className="h-40 w-full" /></div>;
  }

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Sitemap Pages</CardTitle>
            <CardDescription>All pages included in sitemap ({pages?.length ?? 0})</CardDescription>
          </div>
          <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New Page</Button>
        </CardHeader>
        <CardContent>
          <div className="divide-y rounded-md border">
            {(pages ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.path}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.title || "—"}</div>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <Badge variant="outline" className="text-xs">{p.changefreq}</Badge>
                  <Badge variant="secondary" className="text-xs">{p.priority}</Badge>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editPage?.id ? "Edit Page" : "Add New Page"}</DialogTitle>
          </DialogHeader>
          {editPage && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Path</Label>
                <Input value={editPage.path ?? ""} onChange={(e) => setEditPage({ ...editPage, path: e.target.value })} placeholder="/example" />
              </div>
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={editPage.title ?? ""} onChange={(e) => setEditPage({ ...editPage, title: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input value={editPage.description ?? ""} onChange={(e) => setEditPage({ ...editPage, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Robots</Label>
                  <Input value={editPage.robots ?? ""} onChange={(e) => setEditPage({ ...editPage, robots: e.target.value })} placeholder="index,follow" />
                </div>
                <div className="space-y-1">
                  <Label>Priority</Label>
                  <Input type="number" step="0.1" min="0" max="1" value={editPage.priority ?? 0.8} onChange={(e) => setEditPage({ ...editPage, priority: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Change Frequency</Label>
                <Select value={editPage.changefreq ?? "weekly"} onValueChange={(v) => setEditPage({ ...editPage, changefreq: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANGEFREQ_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={upsertMutation.isPending} className="w-full">
                {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
