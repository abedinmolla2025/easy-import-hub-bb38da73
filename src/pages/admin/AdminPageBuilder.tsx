import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminPageBuilder = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Page Builder</h1>
      <Card>
        <CardHeader>
          <CardTitle>Custom Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Build custom pages here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPageBuilder;
