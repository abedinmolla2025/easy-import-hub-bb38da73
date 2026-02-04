import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminAuditPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Log</h1>
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No audit entries found.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditPage;
