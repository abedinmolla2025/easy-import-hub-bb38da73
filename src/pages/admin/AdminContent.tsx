import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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

import { Plus, Edit, Trash2, Search, BookOpen, Download } from 'lucide-react';
import { MobileTableWrapper } from '@/components/admin/MobileTableWrapper';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';

interface AdminContentRow {
  id: string;
  content_type: string;
  title: string;
  title_arabic: string | null;
  title_en: string | null;
  content: string | null;
  content_arabic: string | null;
  content_en: string | null;
  category: string | null;
  is_published: boolean | null;
  status: string;
  created_at: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  in_review: 'outline',
  scheduled: 'outline',
  published: 'default',
  archived: 'destructive',
};

const CONTENT_TYPES = [
  { value: 'dua', label: 'Dua' },
  { value: 'name', label: 'Baby Name' },
  { value: 'hadith', label: 'Hadith' },
  { value: 'article', label: 'Article' },
];

const DUA_CATEGORIES = [
  'Morning', 'Evening', 'Salah', 'Travel', 'Food', 
  'Protection', 'Forgiveness', 'Health', 'Family', 'Dhikr'
];

export default function AdminContent() {
  const { user, isAdmin, isSuperAdmin } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [editForm, setEditForm] = useState({
    content_type: 'dua',
    title: '',
    title_arabic: '',
    title_en: '',
    content: '',
    content_arabic: '',
    content_en: '',
    category: '',
    status: 'draft',
  });

  const canEdit = !!user && isAdmin;
  const canPublish = !!user && (isAdmin || isSuperAdmin);

  const { data: content, isLoading } = useQuery<AdminContentRow[]>({
    queryKey: ['admin-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminContentRow[];
    },
  });

  const selectedContent = useMemo(
    () => content?.find((item) => item.id === selectedId) ?? null,
    [content, selectedId]
  );

  const filteredContent = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (content ?? []).filter((item) => {
      if (typeFilter !== 'all' && item.content_type !== typeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;

      const hay = [item.title, item.title_arabic, item.title_en]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return hay.includes(q);
    });
  }, [content, searchQuery, statusFilter, typeFilter]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const { error } = await supabase.from('admin_content').insert([{
        content_type: data.content_type,
        title: data.title || data.title_en || 'Untitled',
        title_arabic: data.title_arabic || null,
        title_en: data.title_en || null,
        content: data.content || null,
        content_arabic: data.content_arabic || null,
        content_en: data.content_en || null,
        category: data.category || null,
        status: data.status,
        is_published: data.status === 'published',
        created_by: user?.id,
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      toast({ title: 'Content created successfully' });
      resetForm();
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('admin_content')
        .update({
          content_type: data.content_type,
          title: data.title || data.title_en || 'Untitled',
          title_arabic: data.title_arabic || null,
          title_en: data.title_en || null,
          content: data.content || null,
          content_arabic: data.content_arabic || null,
          content_en: data.content_en || null,
          category: data.category || null,
          status: data.status,
          is_published: data.status === 'published',
          published_at: data.status === 'published' ? now : null,
        })
        .eq('id', selectedId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      toast({ title: 'Content updated successfully' });
      resetForm();
      setSelectedId(null);
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('admin_content').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      toast({ title: 'Content deleted successfully' });
      setDeleteDialogOpen(false);
      setContentToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setEditForm({
      content_type: 'dua',
      title: '',
      title_arabic: '',
      title_en: '',
      content: '',
      content_arabic: '',
      content_en: '',
      category: '',
      status: 'draft',
    });
  };

  const handleEdit = (item: AdminContentRow) => {
    setSelectedId(item.id);
    setEditForm({
      content_type: item.content_type,
      title: item.title || '',
      title_arabic: item.title_arabic || '',
      title_en: item.title_en || '',
      content: item.content || '',
      content_arabic: item.content_arabic || '',
      content_en: item.content_en || '',
      category: item.category || '',
      status: item.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId) {
      updateMutation.mutate(editForm);
    } else {
      createMutation.mutate(editForm);
    }
  };

  const handleExport = () => {
    if (!content) return;
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage duas, names, hadiths and articles
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            size="sm" 
            onClick={() => {
              resetForm();
              setSelectedId(null);
              setIsEditDialogOpen(true);
            }}
            disabled={!canEdit}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {CONTENT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>Content List ({filteredContent.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredContent.length > 0 ? (
            <MobileTableWrapper>
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContent.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate font-medium">{item.title}</div>
                        {item.title_arabic && (
                          <div className="truncate text-xs text-muted-foreground" dir="rtl">
                            {item.title_arabic}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CONTENT_TYPES.find(t => t.value === item.content_type)?.label || item.content_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[item.status] || 'outline'}>
                          {STATUS_LABELS[item.status] || item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            disabled={!canEdit}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              setContentToDelete(item.id);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={!canEdit}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </MobileTableWrapper>
          ) : (
            <AdminEmptyState
              title={searchQuery ? "No content matches your search" : "No content found"}
              description={
                searchQuery
                  ? "Try a different keyword or clear filters."
                  : "Create your first content item to get started."
              }
              icon={<BookOpen className="h-4 w-4" />}
              primaryAction={
                searchQuery
                  ? { label: "Clear search", onClick: () => setSearchQuery(""), variant: "outline" }
                  : canEdit
                  ? { label: "Add Content", onClick: () => setIsEditDialogOpen(true) }
                  : undefined
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setSelectedId(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedId ? 'Edit Content' : 'Add New Content'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select
                  value={editForm.content_type}
                  onValueChange={(v) => setEditForm({ ...editForm, content_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                  disabled={!canPublish && editForm.status === 'published'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs defaultValue="en" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="ar">العربية</TabsTrigger>
                <TabsTrigger value="main">Main</TabsTrigger>
              </TabsList>

              <TabsContent value="en" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Title (English)</Label>
                  <Input
                    value={editForm.title_en}
                    onChange={(e) => setEditForm({ ...editForm, title_en: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content (English)</Label>
                  <Textarea
                    value={editForm.content_en}
                    onChange={(e) => setEditForm({ ...editForm, content_en: e.target.value })}
                    rows={6}
                  />
                </div>
              </TabsContent>

              <TabsContent value="ar" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>العنوان (Arabic)</Label>
                  <Input
                    value={editForm.title_arabic}
                    onChange={(e) => setEditForm({ ...editForm, title_arabic: e.target.value })}
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>المحتوى (Arabic)</Label>
                  <Textarea
                    value={editForm.content_arabic}
                    onChange={(e) => setEditForm({ ...editForm, content_arabic: e.target.value })}
                    rows={6}
                    dir="rtl"
                  />
                </div>
              </TabsContent>

              <TabsContent value="main" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Title (Default)</Label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content (Default)</Label>
                  <Textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    rows={6}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {editForm.content_type === 'dua' && (
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(v) => setEditForm({ ...editForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DUA_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedId(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {selectedId ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this content? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => contentToDelete && deleteMutation.mutate(contentToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
