import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminMonetization = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Monetization</h1>
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No monetization data available.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMonetization;
