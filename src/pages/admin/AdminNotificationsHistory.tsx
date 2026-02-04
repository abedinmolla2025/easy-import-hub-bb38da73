import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminNotificationsHistory = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notification History</h1>
      <Card>
        <CardHeader>
          <CardTitle>Sent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No notifications sent yet.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotificationsHistory;
