import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminUsers = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No users found.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
