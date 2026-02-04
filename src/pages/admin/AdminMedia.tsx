import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminMedia = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Media</h1>
      <Card>
        <CardHeader>
          <CardTitle>Media Library</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No media files uploaded.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMedia;
