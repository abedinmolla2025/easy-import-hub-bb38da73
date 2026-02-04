import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminSplashScreens = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Splash Screens</h1>
      <Card>
        <CardHeader>
          <CardTitle>Splash Screen Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Configure splash screens here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSplashScreens;
