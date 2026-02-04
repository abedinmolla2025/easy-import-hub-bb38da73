import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminLayoutControl = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Layout</h1>
      <Card>
        <CardHeader>
          <CardTitle>Layout Control</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Configure app layout sections here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLayoutControl;
