import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminAds = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ads</h1>
      <Card>
        <CardHeader>
          <CardTitle>Advertisement Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No ads configured.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAds;
