import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const AdminNotifications = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Send Notification</h1>
      <Card>
        <CardHeader>
          <CardTitle>New Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Notification title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" placeholder="Notification message" />
          </div>
          <Button>Send Notification</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotifications;
