import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Trash2, Copy, Search, Image, FileText, Music, Video, File, Loader2, RefreshCw } from "lucide-react";

const BUCKET = "media";

type MediaFile = {
  name: string;
  id: string;
  created_at: string;
  metadata: { size?: number; mimetype?: string } | null;
  publicUrl: string;
};

function fileIcon(mime?: string) {
  if (!mime) return <File className="h-5 w-5" />;
  if (mime.startsWith("image/")) return <Image className="h-5 w-5" />;
  if (mime.startsWith("video/")) return <Video className="h-5 w-5" />;
  if (mime.startsWith("audio/")) return <Music className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
}

function formatSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const AdminMedia = () => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<MediaFile | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from(BUCKET).list("", {
        limit: 500,
        sortBy: { column: "created_at", order: "desc" },
      });
      if (error) throw error;

      const mapped: MediaFile[] = (data ?? [])
        .filter((f) => f.name !== ".emptyFolderPlaceholder")
        .map((f) => {
          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(f.name);
          return {
            name: f.name,
            id: f.id ?? f.name,
            created_at: f.created_at ?? "",
            metadata: f.metadata as MediaFile["metadata"],
            publicUrl: urlData.publicUrl,
          };
        });
      setFiles(mapped);
    } catch (e: any) {
      toast({ title: "Failed to load media", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setUploading(true);
    try {
      const uploadPromises = Array.from(fileList).map(async (file) => {
        const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await supabase.storage.from(BUCKET).upload(safeName, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;
      });
      await Promise.all(uploadPromises);
      toast({ title: `${fileList.length} file(s) uploaded` });
      fetchFiles();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (name: string) => {
    setDeleting(name);
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([name]);
      if (error) throw error;
      toast({ title: "File deleted" });
      setFiles((prev) => prev.filter((f) => f.name !== name));
      if (preview?.name === name) setPreview(null);
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "URL copied!" });
  };

  const filtered = search
    ? files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  const isImage = (mime?: string) => mime?.startsWith("image/");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Media Library</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchFiles()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
            Upload
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {loading ? "Loading…" : `${filtered.length} file${filtered.length !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {search ? "No files match your search." : "No media files uploaded yet."}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map((file) => {
                const mime = file.metadata?.mimetype;
                return (
                  <div
                    key={file.id}
                    className="group relative rounded-xl border border-border bg-card overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                    onClick={() => setPreview(file)}
                  >
                    {isImage(mime) ? (
                      <img
                        src={file.publicUrl}
                        alt={file.name}
                        className="aspect-square w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-square w-full flex flex-col items-center justify-center gap-2 bg-muted">
                        {fileIcon(mime)}
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {mime?.split("/")[1] ?? "file"}
                        </span>
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs truncate font-medium">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatSize(file.metadata?.size)}</p>
                    </div>

                    {/* Quick actions on hover */}
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyUrl(file.publicUrl);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7"
                        disabled={deleting === file.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file.name);
                        }}
                      >
                        {deleting === file.name ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="truncate text-sm">{preview?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {isImage(preview?.metadata?.mimetype) ? (
              <img
                src={preview?.publicUrl}
                alt={preview?.name}
                className="w-full max-h-[400px] object-contain rounded-lg border border-border"
              />
            ) : (
              <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
                {fileIcon(preview?.metadata?.mimetype)}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Size:</span>{" "}
                {formatSize(preview?.metadata?.size)}
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>{" "}
                {preview?.metadata?.mimetype ?? "Unknown"}
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Uploaded:</span>{" "}
                {preview?.created_at ? new Date(preview.created_at).toLocaleString() : "—"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input value={preview?.publicUrl ?? ""} readOnly className="text-xs" />
              <Button size="sm" variant="outline" onClick={() => preview && copyUrl(preview.publicUrl)}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleting === preview?.name}
              onClick={() => preview && handleDelete(preview.name)}
            >
              {deleting === preview?.name ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMedia;
