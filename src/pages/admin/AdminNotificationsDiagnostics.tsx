import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminNotificationsDiagnostics = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notification Diagnostics</h1>
      <Card>
        <CardHeader>
          <CardTitle>Push Notification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Diagnostics information will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotificationsDiagnostics;
