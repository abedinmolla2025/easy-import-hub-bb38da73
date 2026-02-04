import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminContent = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Content</h1>
      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No content items found.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContent;
