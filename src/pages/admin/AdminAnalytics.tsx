import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminAnalytics = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No analytics data available.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
