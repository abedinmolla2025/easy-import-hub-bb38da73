import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Search, FileText, Activity } from "lucide-react";
import AdminSeoMetaTab from "@/components/admin/seo/AdminSeoMetaTab";
import AdminSeoPagesTab from "@/components/admin/seo/AdminSeoPagesTab";
import AdminSeoIndexingTab from "@/components/admin/seo/AdminSeoIndexingTab";

const AdminSeoPage = () => {
  const [tab, setTab] = useState("meta");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SEO & Indexing</h1>
        <p className="text-muted-foreground">Configure search engine optimization and auto-indexing</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="meta" className="flex items-center gap-1.5">
            <Search className="h-4 w-4" /> Meta Tags
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Sitemap Pages
          </TabsTrigger>
          <TabsTrigger value="indexing" className="flex items-center gap-1.5">
            <Activity className="h-4 w-4" /> Indexing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meta">
          <AdminSeoMetaTab />
        </TabsContent>
        <TabsContent value="pages">
          <AdminSeoPagesTab />
        </TabsContent>
        <TabsContent value="indexing">
          <AdminSeoIndexingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSeoPage;
