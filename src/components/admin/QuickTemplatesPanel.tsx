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

type Category = "all" | "prayer" | "daily" | "special" | "ramadan" | "custom";

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
  ramadan: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  custom: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  prayer: Moon,
  daily: BookOpen,
  special: Star,
  ramadan: Moon,
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
  // ─── Ramadan 30-Day Templates ───
  {
    id: "ramadan-day-1",
    name: "Ramadan Day 1",
    title: "🌙 রমজান ১ম দিন",
    body: "রমজান মুবারক! আজ থেকে পবিত্র মাস শুরু। নিয়ত করুন এবং আল্লাহর নৈকট্য লাভ করুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-2",
    name: "Ramadan Day 2",
    title: "🌙 রমজান ২য় দিন",
    body: "তওবা ও ইস্তেগফারের দিন। আজ বেশি বেশি ইস্তেগফার পড়ুন এবং আল্লাহর কাছে ক্ষমা চান।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-3",
    name: "Ramadan Day 3",
    title: "🌙 রমজান ৩য় দিন",
    body: "কুরআন তিলাওয়াতের দিন। আজ অন্তত ১ পারা কুরআন পড়ার চেষ্টা করুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600&q=80",
    deep_link: "/quran",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-4",
    name: "Ramadan Day 4",
    title: "🌙 রমজান ৪র্থ দিন",
    body: "দান-সদকার দিন। আজ কিছু দান করুন, ছোট হোক বা বড়। প্রতিটি দানই মূল্যবান।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-5",
    name: "Ramadan Day 5",
    title: "🌙 রমজান ৫ম দিন",
    body: "ধৈর্যের দিন। রোজা আমাদের ধৈর্য শেখায়। আজ সবর ধরুন এবং আল্লাহর উপর ভরসা রাখুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1590076215667-875c2d473470?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-6",
    name: "Ramadan Day 6",
    title: "🌙 রমজান ৬ষ্ঠ দিন",
    body: "তাহাজ্জুদের রাত। আজ রাতে তাহাজ্জুদ নামাজ পড়ুন এবং আল্লাহর কাছে প্রার্থনা করুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=600&q=80",
    deep_link: "/prayer-times",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-7",
    name: "Ramadan Day 7",
    title: "🌙 রমজান ৭ম দিন",
    body: "পরিবারের সাথে ইফতার। আজ পরিবারের সাথে একসাথে ইফতার করুন এবং দোয়া করুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-8",
    name: "Ramadan Day 8",
    title: "🌙 রমজান ৮ম দিন",
    body: "যিকিরের দিন। সুবহানাল্লাহ, আলহামদুলিল্লাহ, আল্লাহু আকবার - বেশি বেশি যিকির করুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1585036156171-384164a8c159?w=600&q=80",
    deep_link: "/tasbih",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-9",
    name: "Ramadan Day 9",
    title: "🌙 রমজান ৯ম দিন",
    body: "প্রতিবেশীর হক। আজ প্রতিবেশীকে ইফতারে দাওয়াত দিন বা কিছু খাবার পাঠান।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-10",
    name: "Ramadan Day 10",
    title: "🌙 রমজান ১০ম দিন — রহমতের দশক শেষ",
    body: "রহমতের প্রথম দশক শেষ হচ্ছে। আল্লাহর রহমত কামনা করে দোয়া করুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1573848953246-2e1f5f0e3207?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-11",
    name: "Ramadan Day 11",
    title: "🌙 রমজান ১১তম দিন",
    body: "মাগফিরাতের দশক শুরু। আজ থেকে আল্লাহর কাছে বেশি বেশি ক্ষমা প্রার্থনা করুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1466442929976-97f336a657be?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-12",
    name: "Ramadan Day 12",
    title: "🌙 রমজান ১২তম দিন",
    body: "সুন্নত নামাজের দিন। ফরজের পাশাপাশি সুন্নত ও নফল নামাজ পড়ুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=600&q=80",
    deep_link: "/prayer-guide",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-13",
    name: "Ramadan Day 13",
    title: "🌙 রমজান ১৩তম দিন",
    body: "দরূদ শরীফ পড়ুন। নবীজি (সা.) এর উপর বেশি বেশি দরূদ পাঠান।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1542379653-b928db1f4739?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-14",
    name: "Ramadan Day 14",
    title: "🌙 রমজান ১৪তম দিন",
    body: "গরীব-দুঃখীদের সাহায্য করুন। রমজানে দানের সওয়াব বহুগুণ বৃদ্ধি পায়।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-15",
    name: "Ramadan Day 15",
    title: "🌙 রমজান ১৫তম দিন — অর্ধেক পথ!",
    body: "রমজানের অর্ধেক পথ পার হয়েছে! বাকি দিনগুলো আরও বেশি ইবাদতে কাটান।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    deep_link: "/quran",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-16",
    name: "Ramadan Day 16",
    title: "🌙 রমজান ১৬তম দিন",
    body: "কুরআন বোঝার চেষ্টা করুন। আজ তাফসীর সহ কুরআন পড়ুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600&q=80",
    deep_link: "/quran",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-17",
    name: "Ramadan Day 17",
    title: "🌙 রমজান ১৭তম দিন",
    body: "বদর দিবস। ঐতিহাসিক বদর যুদ্ধের স্মরণে আল্লাহর শোকর আদায় করুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-18",
    name: "Ramadan Day 18",
    title: "🌙 রমজান ১৮তম দিন",
    body: "পিতা-মাতার জন্য দোয়া। আজ বিশেষভাবে পিতা-মাতার জন্য দোয়া করুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-19",
    name: "Ramadan Day 19",
    title: "🌙 রমজান ১৯তম দিন",
    body: "গুনাহ থেকে বিরত থাকুন। চোখ, কান ও জবানের হেফাজত করুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1590076215667-875c2d473470?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-20",
    name: "Ramadan Day 20",
    title: "🌙 রমজান ২০তম দিন — মাগফিরাতের দশক শেষ",
    body: "মাগফিরাতের দশক শেষ হচ্ছে। নাজাতের দশকের জন্য প্রস্তুতি নিন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1573848953246-2e1f5f0e3207?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-21",
    name: "Ramadan Day 21",
    title: "🌙 রমজান ২১তম দিন — লাইলাতুল কদর!",
    body: "নাজাতের দশক ও লাইলাতুল কদরের সন্ধান শুরু! বেজোড় রাতগুলোতে বেশি ইবাদত করুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-22",
    name: "Ramadan Day 22",
    title: "🌙 রমজান ২২তম দিন",
    body: "ইতিকাফের প্রস্তুতি। যারা পারেন মসজিদে ইতিকাফ করুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1466442929976-97f336a657be?w=600&q=80",
    deep_link: "/prayer-times",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-23",
    name: "Ramadan Day 23",
    title: "🌙 রমজান ২৩তম দিন — বেজোড় রাত",
    body: "লাইলাতুল কদর হতে পারে আজ রাতে! দোয়া: আল্লাহুম্মা ইন্নাকা আফুউন তুহিব্বুল আফওয়া ফা'ফু আন্নি।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-24",
    name: "Ramadan Day 24",
    title: "🌙 রমজান ২৪তম দিন",
    body: "জাকাত ও ফিতরা হিসাব করুন। জাকাত আদায় করা রমজানে অত্যন্ত ফজিলতপূর্ণ।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-25",
    name: "Ramadan Day 25",
    title: "🌙 রমজান ২৫তম দিন — বেজোড় রাত",
    body: "আজ রাতেও লাইলাতুল কদর হতে পারে! সারা রাত ইবাদতে কাটানোর চেষ্টা করুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-26",
    name: "Ramadan Day 26",
    title: "🌙 রমজান ২৬তম দিন",
    body: "উম্মতের জন্য দোয়া করুন। সমস্ত মুসলিম উম্মাহর জন্য শান্তি ও হেদায়েত কামনা করুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-27",
    name: "Ramadan Day 27",
    title: "🌙 রমজান ২৭তম দিন — শবে কদর!",
    body: "অনেকে বিশ্বাস করেন ২৭তম রাত লাইলাতুল কদর। আজ রাত হাজার মাসের চেয়ে উত্তম!",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-28",
    name: "Ramadan Day 28",
    title: "🌙 রমজান ২৮তম দিন",
    body: "ঈদের প্রস্তুতি শুরু করুন। ফিতরা আদায় করুন এবং ঈদের নামাজের প্রস্তুতি নিন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-29",
    name: "Ramadan Day 29",
    title: "🌙 রমজান ২৯তম দিন — বেজোড় রাত",
    body: "শেষ বেজোড় রাত! সর্বশেষ সুযোগ লাইলাতুল কদর পাওয়ার। সারা রাত ইবাদত করুন।",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=600&q=80",
    deep_link: "/dua",
    isBuiltIn: true,
  },
  {
    id: "ramadan-day-30",
    name: "Ramadan Day 30",
    title: "🌙 রমজান ৩০তম দিন — বিদায় রমজান",
    body: "আলবিদা রমজান! আল্লাহ আমাদের সকল রোজা, নামাজ ও ইবাদত কবুল করুন। ঈদ মুবারক! 🎉",
    category: "ramadan",
    image_url: "https://images.unsplash.com/photo-1573848953246-2e1f5f0e3207?w=600&q=80",
    deep_link: "/dua",
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
            <TabsList className="h-7 w-full grid grid-cols-6 gap-0 p-0.5">
              {(["all", "prayer", "daily", "special", "ramadan", "custom"] as Category[]).map((cat) => (
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
