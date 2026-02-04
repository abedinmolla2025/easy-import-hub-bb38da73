import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminQuiz = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quiz Questions</h1>
      <Card>
        <CardHeader>
          <CardTitle>Quiz Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Manage quiz questions here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminQuiz;
