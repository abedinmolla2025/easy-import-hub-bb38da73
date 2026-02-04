import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Eye,
  Copy,
  ArrowUp,
  ArrowDown,
  Code,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, isWithinInterval } from "date-fns";
import { OccasionPresetGallery } from "@/components/admin/OccasionPresetGallery";
import { OccasionDesignPresetGallery } from "@/components/admin/OccasionDesignPresetGallery";
import { OccasionTextPresetGallery } from "@/components/admin/OccasionTextPresetGallery";
import { OccasionHtmlCard } from "@/components/OccasionHtmlCard";
import { cn } from "@/lib/utils";

type OccasionPlatform = "web" | "app" | "both";

type OccasionRow = {
  id: string;
  title: string;
  subtitle: string | null;
  message: string;
  dua_text: string | null;
  html_code: string | null;
  css_code: string | null;
  image_url: string | null;
  card_css: string | null;
  container_class_name: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  display_order: number;
  platform: OccasionPlatform;
  created_at: string;
  updated_at: string;
};

type OccasionFormData = Omit<OccasionRow, "id" | "created_at" | "updated_at">;

const DEFAULT_FORM_DATA: OccasionFormData = {
  title: "",
  subtitle: "",
  message: "",
  dua_text: "",
  html_code: "",
  css_code: "",
  image_url: "",
  card_css: "",
  container_class_name: "",
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  is_active: true,
  display_order: 0,
  platform: "both",
};

function useOccasions() {
  return useQuery({
    queryKey: ["admin-occasions"],
    queryFn: async (): Promise<OccasionRow[]> => {
      const { data, error } = await (supabase as any)
        .from("admin_occasions")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}

function OccasionStatusBadge({ occasion }: { occasion: OccasionRow }) {
  const now = new Date();
  const start = parseISO(occasion.start_date);
  const end = parseISO(occasion.end_date);

  if (!occasion.is_active) {
    return <Badge variant="secondary">Inactive</Badge>;
  }

  const isLive = isWithinInterval(now, { start, end });

  if (isLive) {
    return <Badge className="bg-green-500 hover:bg-green-600">Live</Badge>;
  }

  if (now < start) {
    return <Badge variant="outline">Scheduled</Badge>;
  }

  return <Badge variant="destructive">Expired</Badge>;
}

const AdminOccasions = () => {
  const queryClient = useQueryClient();
  const { data: occasions, isLoading } = useOccasions();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<OccasionFormData>(DEFAULT_FORM_DATA);
  const [activeTab, setActiveTab] = useState("basic");
  const [previewOpen, setPreviewOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: OccasionFormData) => {
      const { error } = await (supabase as any)
        .from("admin_occasions")
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-occasions"] });
      toast.success("Occasion created successfully");
      closeDialog();
    },
    onError: (err: any) => {
      toast.error(`Failed to create: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: OccasionFormData }) => {
      const { error } = await (supabase as any)
        .from("admin_occasions")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-occasions"] });
      toast.success("Occasion updated successfully");
      closeDialog();
    },
    onError: (err: any) => {
      toast.error(`Failed to update: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("admin_occasions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-occasions"] });
      toast.success("Occasion deleted");
    },
    onError: (err: any) => {
      toast.error(`Failed to delete: ${err.message}`);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({
      id,
      newOrder,
    }: {
      id: string;
      newOrder: number;
    }) => {
      const { error } = await (supabase as any)
        .from("admin_occasions")
        .update({ display_order: newOrder })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-occasions"] });
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(DEFAULT_FORM_DATA);
    setActiveTab("basic");
  };

  const openCreate = () => {
    setFormData(DEFAULT_FORM_DATA);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEdit = (occasion: OccasionRow) => {
    setFormData({
      title: occasion.title,
      subtitle: occasion.subtitle ?? "",
      message: occasion.message,
      dua_text: occasion.dua_text ?? "",
      html_code: occasion.html_code ?? "",
      css_code: occasion.css_code ?? "",
      image_url: occasion.image_url ?? "",
      card_css: occasion.card_css ?? "",
      container_class_name: occasion.container_class_name ?? "",
      start_date: occasion.start_date,
      end_date: occasion.end_date,
      is_active: occasion.is_active,
      display_order: occasion.display_order,
      platform: occasion.platform,
    });
    setEditingId(occasion.id);
    setIsDialogOpen(true);
  };

  const handleDuplicate = (occasion: OccasionRow) => {
    setFormData({
      title: `${occasion.title} (Copy)`,
      subtitle: occasion.subtitle ?? "",
      message: occasion.message,
      dua_text: occasion.dua_text ?? "",
      html_code: occasion.html_code ?? "",
      css_code: occasion.css_code ?? "",
      image_url: occasion.image_url ?? "",
      card_css: occasion.card_css ?? "",
      container_class_name: occasion.container_class_name ?? "",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: false,
      display_order: (occasions?.length ?? 0) + 1,
      platform: occasion.platform,
    });
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleMoveUp = (occasion: OccasionRow, index: number) => {
    if (index === 0 || !occasions) return;
    const prevOccasion = occasions[index - 1];
    reorderMutation.mutate({ id: occasion.id, newOrder: prevOccasion.display_order });
    reorderMutation.mutate({ id: prevOccasion.id, newOrder: occasion.display_order });
  };

  const handleMoveDown = (occasion: OccasionRow, index: number) => {
    if (!occasions || index === occasions.length - 1) return;
    const nextOccasion = occasions[index + 1];
    reorderMutation.mutate({ id: occasion.id, newOrder: nextOccasion.display_order });
    reorderMutation.mutate({ id: nextOccasion.id, newOrder: occasion.display_order });
  };

  const applyPreset = (presetClassName: string) => {
    const existing = formData.container_class_name ?? "";
    const classes = existing.split(/\s+/).filter(Boolean);

    presetClassName.split(/\s+/).forEach((cls) => {
      if (!classes.includes(cls)) {
        classes.push(cls);
      }
    });

    setFormData((prev) => ({
      ...prev,
      container_class_name: classes.join(" "),
    }));
  };

  const stats = useMemo(() => {
    if (!occasions) return { total: 0, active: 0, live: 0 };
    const now = new Date();
    const active = occasions.filter((o) => o.is_active).length;
    const live = occasions.filter((o) => {
      if (!o.is_active) return false;
      const start = parseISO(o.start_date);
      const end = parseISO(o.end_date);
      return isWithinInterval(now, { start, end });
    }).length;
    return { total: occasions.length, active, live };
  }, [occasions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Occasions</h1>
          <p className="text-sm text-muted-foreground">
            Manage Islamic occasions and special event banners
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Occasion
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.live}</div>
            <p className="text-xs text-muted-foreground">Live Now</p>
          </CardContent>
        </Card>
      </div>

      {/* Occasions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            All Occasions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !occasions?.length ? (
            <div className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No occasions yet</p>
              <Button onClick={openCreate} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create First Occasion
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {occasions.map((occasion, index) => (
                    <TableRow key={occasion.id}>
                      <TableCell className="font-mono text-xs">
                        {occasion.display_order}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{occasion.title}</div>
                          {occasion.subtitle && (
                            <div className="text-xs text-muted-foreground">
                              {occasion.subtitle}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <OccasionStatusBadge occasion={occasion} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {occasion.platform}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{format(parseISO(occasion.start_date), "MMM d, yyyy")}</div>
                        <div className="text-muted-foreground">
                          to {format(parseISO(occasion.end_date), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveUp(occasion, index)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveDown(occasion, index)}
                            disabled={index === occasions.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setFormData({
                                title: occasion.title,
                                subtitle: occasion.subtitle ?? "",
                                message: occasion.message,
                                dua_text: occasion.dua_text ?? "",
                                html_code: occasion.html_code ?? "",
                                css_code: occasion.css_code ?? "",
                                image_url: occasion.image_url ?? "",
                                card_css: occasion.card_css ?? "",
                                container_class_name: occasion.container_class_name ?? "",
                                start_date: occasion.start_date,
                                end_date: occasion.end_date,
                                is_active: occasion.is_active,
                                display_order: occasion.display_order,
                                platform: occasion.platform,
                              });
                              setPreviewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicate(occasion)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(occasion)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Delete this occasion?")) {
                                deleteMutation.mutate(occasion.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Occasion" : "Create Occasion"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g., Ramadan Mubarak"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, subtitle: e.target.value }))
                    }
                    placeholder="Optional subtitle"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="Main message to display"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date.slice(0, 16)}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        start_date: new Date(e.target.value).toISOString(),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date.slice(0, 16)}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        end_date: new Date(e.target.value).toISOString(),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value: OccasionPlatform) =>
                      setFormData((prev) => ({ ...prev, platform: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both</SelectItem>
                      <SelectItem value="web">Web Only</SelectItem>
                      <SelectItem value="app">App Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        display_order: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_active: checked }))
                    }
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="dua_text">Dua Text</Label>
                <Textarea
                  id="dua_text"
                  value={formData.dua_text ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dua_text: e.target.value }))
                  }
                  placeholder="Arabic dua or special prayer"
                  rows={3}
                  dir="rtl"
                  className="font-arabic"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, image_url: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="html_code" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Custom HTML
                </Label>
                <Textarea
                  id="html_code"
                  value={formData.html_code ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, html_code: e.target.value }))
                  }
                  placeholder="<div class='...'> ... </div>"
                  rows={6}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Use .occasion-scope as parent selector for CSS
                </p>
              </div>
            </TabsContent>

            <TabsContent value="design" className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="container_class_name" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Container Classes
                </Label>
                <Input
                  id="container_class_name"
                  value={formData.container_class_name ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      container_class_name: e.target.value,
                    }))
                  }
                  placeholder="occasion-float occasion-shimmer"
                />
              </div>

              <OccasionPresetGallery
                value={formData.container_class_name ?? ""}
                onApply={applyPreset}
              />

              <OccasionDesignPresetGallery
                value={formData.container_class_name ?? ""}
                onApply={applyPreset}
              />

              <OccasionTextPresetGallery
                value={formData.container_class_name ?? ""}
                onApply={applyPreset}
              />

              <div className="space-y-2">
                <Label htmlFor="css_code">Custom CSS</Label>
                <Textarea
                  id="css_code"
                  value={formData.css_code ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, css_code: e.target.value }))
                  }
                  placeholder=".occasion-scope .custom-class { ... }"
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="pt-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="mb-4 text-sm text-muted-foreground">Live Preview:</p>
                <div className="mx-auto max-w-md">
                  <OccasionHtmlCard
                    occasionId="preview"
                    title={formData.title || "Title"}
                    subtitle={formData.subtitle || formData.message}
                    htmlCode={formData.html_code}
                    cssCode={formData.css_code}
                    containerClassName={formData.container_class_name}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <OccasionHtmlCard
            occasionId="preview"
            title={formData.title || "Title"}
            subtitle={formData.subtitle || formData.message}
            htmlCode={formData.html_code}
            cssCode={formData.css_code}
            containerClassName={formData.container_class_name}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOccasions;
