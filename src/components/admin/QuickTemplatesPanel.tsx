import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Moon, BookOpen, Star, Search, Plus, MoreVertical,
  Pencil, Trash2, Copy,
} from "lucide-react";
import { NotificationTemplateDialog } from "./NotificationTemplateDialog";
import { useToast } from "@/hooks/use-toast";

type Category = "all" | "prayer" | "daily" | "special" | "custom";

export type TemplateItem = {
  id: string;
  name: string;
  title: string;
  body: string;
  category: string;
  target_platform?: string;
  image_url?: string | null;
  deep_link?: string | null;
  isBuiltIn?: boolean;
};

const CATEGORY_COLORS: Record<string, string> = {
  prayer: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  daily: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  special: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  custom: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  prayer: Moon,
  daily: BookOpen,
  special: Star,
  custom: Plus,
};

const BUILT_IN_TEMPLATES: TemplateItem[] = [
  {
    id: "prayer-reminder",
    name: "Prayer Reminder",
    title: "🕌 Time for Prayer",
    body: "Don't forget to pray. May Allah accept your prayers.",
    category: "prayer",
    isBuiltIn: true,
  },
  {
    id: "daily-dua",
    name: "Daily Dua",
    title: "📿 Today's Dua",
    body: "Start your day with a beautiful dua. Open NOOR to read today's dua.",
    category: "daily",
    isBuiltIn: true,
  },
  {
    id: "quran-reminder",
    name: "Quran Reminder",
    title: "📖 Read Quran",
    body: "Take a moment to read and reflect on the Holy Quran.",
    category: "daily",
    isBuiltIn: true,
  },
  {
    id: "friday-blessing",
    name: "Jummah Mubarak",
    title: "🕋 Jummah Mubarak!",
    body: "May this blessed Friday bring you peace and blessings.",
    category: "special",
    isBuiltIn: true,
  },
  {
    id: "ramadan-reminder",
    name: "Ramadan Reminder",
    title: "🌙 Ramadan Kareem",
    body: "May this holy month bring you closer to Allah.",
    category: "special",
    isBuiltIn: true,
  },
];

const STORAGE_KEY = "noor_notification_templates";

function loadCustomTemplates(): TemplateItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as any[]).map((t) => ({ ...t, isBuiltIn: false }));
  } catch {
    return [];
  }
}

function saveCustomTemplates(templates: TemplateItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

interface Props {
  selectedTemplate: string | null;
  onSelect: (template: TemplateItem) => void;
}

export function QuickTemplatesPanel({ selectedTemplate, onSelect }: Props) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [customTemplates, setCustomTemplates] = useState<TemplateItem[]>(loadCustomTemplates);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateItem | null>(null);

  // Refresh custom templates from storage
  const refreshCustom = () => setCustomTemplates(loadCustomTemplates());

  const allTemplates = useMemo(
    () => [...BUILT_IN_TEMPLATES, ...customTemplates],
    [customTemplates],
  );

  const filtered = useMemo(() => {
    let list = allTemplates;
    if (category !== "all") list = list.filter((t) => t.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.body.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allTemplates, category, search]);

  const handleEdit = (t: TemplateItem) => {
    setEditingTemplate(t);
    setDialogOpen(true);
  };

  const handleDuplicate = (t: TemplateItem) => {
    const copy: TemplateItem = {
      ...t,
      id: crypto.randomUUID(),
      name: `${t.name} (Copy)`,
      isBuiltIn: false,
    };
    const updated = [...customTemplates, copy];
    saveCustomTemplates(updated);
    setCustomTemplates(updated);
    toast({ title: "Template duplicated" });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const updated = customTemplates.filter((t) => t.id !== deleteTarget.id);
    saveCustomTemplates(updated);
    setCustomTemplates(updated);
    setDeleteTarget(null);
    toast({ title: "Template deleted" });
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const categoryCount = (cat: Category) => {
    if (cat === "all") return allTemplates.length;
    return allTemplates.filter((t) => t.category === cat).length;
  };

  return (
    <>
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Quick Templates</CardTitle>
              <CardDescription className="mt-0.5">Select or manage templates</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={handleCreateNew}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              New
            </Button>
          </div>
          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          {/* Category tabs */}
          <Tabs value={category} onValueChange={(v) => setCategory(v as Category)} className="mt-2">
            <TabsList className="h-7 w-full grid grid-cols-5 gap-0 p-0.5">
              {(["all", "prayer", "daily", "special", "custom"] as Category[]).map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="text-[10px] h-6 px-1 data-[state=active]:shadow-sm capitalize"
                >
                  {cat} ({categoryCount(cat)})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-1.5 max-h-[420px] overflow-y-auto pt-0">
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No templates found</p>
          )}
          {filtered.map((template) => {
            const Icon = CATEGORY_ICONS[template.category] || Star;
            const isSelected = selectedTemplate === template.id;
            return (
              <div
                key={template.id}
                className={`group relative p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                }`}
                onClick={() => onSelect(template)}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">{template.name}</span>
                      <Badge
                        variant="secondary"
                        className={`text-[9px] px-1 py-0 h-4 shrink-0 ${CATEGORY_COLORS[template.category] || ""}`}
                      >
                        {template.category}
                      </Badge>
                      {template.isBuiltIn && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shrink-0">
                          Built-in
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {template.body}
                    </p>
                  </div>
                  {/* Actions menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(template); }}>
                        <Copy className="h-3.5 w-3.5 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      {!template.isBuiltIn && (
                        <>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(template); }}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(template); }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <NotificationTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refreshCustom}
        editingTemplate={
          editingTemplate
            ? {
                id: editingTemplate.id,
                name: editingTemplate.name,
                title: editingTemplate.title,
                body: editingTemplate.body,
                image_url: editingTemplate.image_url || null,
                deep_link: editingTemplate.deep_link || null,
                target_platform: editingTemplate.target_platform || "all",
                category: editingTemplate.category,
              }
            : null
        }
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
