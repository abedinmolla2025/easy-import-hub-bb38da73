import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminContentWorkflowPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Content Workflow</h1>
      <Card>
        <CardHeader>
          <CardTitle>Workflow Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No workflow items found.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContentWorkflowPage;
