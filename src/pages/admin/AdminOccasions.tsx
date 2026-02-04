import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminOccasions = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Occasions</h1>
      <Card>
        <CardHeader>
          <CardTitle>Islamic Occasions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No occasions configured.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOccasions;
