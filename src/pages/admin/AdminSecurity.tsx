import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminSecurity = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Security</h1>
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Manage security settings here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSecurity;
