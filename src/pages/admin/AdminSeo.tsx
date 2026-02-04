import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminSeoPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SEO</h1>
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Configure SEO settings here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSeoPage;
