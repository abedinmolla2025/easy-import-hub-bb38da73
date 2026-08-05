import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";

/**
 * Exports all OG images from Supabase storage into a single ZIP file.
 */
export async function exportOgImagesToZip(opts?: { 
  bucket?: string; 
  folder?: string;
  filename?: string;
}): Promise<{ total: number }> {
  const bucket = opts?.bucket ?? "media";
  const folder = opts?.folder ?? "dua-og";
  const filename = opts?.filename ?? `og-images-${new Date().toISOString().slice(0, 10)}.zip`;

  const zip = new JSZip();
  
  // 1. List all files in the folder
  const { data: files, error: listError } = await supabase.storage
    .from(bucket)
    .list(folder, { limit: 1000 });

  if (listError) throw listError;
  if (!files || files.length === 0) {
    throw new Error("No images found in storage.");
  }

  // 2. Download each file and add to ZIP
  let count = 0;
  for (const file of files) {
    if (file.name === ".emptyKeep") continue;
    
    const { data: blob, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(`${folder}/${file.name}`);

    if (downloadError) {
      console.error(`Failed to download ${file.name}:`, downloadError);
      continue;
    }

    if (blob) {
      zip.file(file.name, blob);
      count++;
    }
  }

  // 3. Generate and download the ZIP
  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return { total: count };
}

/**
 * Imports OG images from a ZIP file and uploads them to Supabase storage.
 */
export async function importOgImagesFromZip(
  file: File, 
  opts?: { 
    bucket?: string; 
    folder?: string;
    onProgress?: (current: number, total: number) => void;
  }
): Promise<{ total: number }> {
  const bucket = opts?.bucket ?? "media";
  const folder = opts?.folder ?? "dua-og";
  
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);
  
  const imageFiles = Object.keys(zipContent.files).filter(name => {
    const lower = name.toLowerCase();
    return !zipContent.files[name].dir && (
      lower.endsWith(".webp") || 
      lower.endsWith(".png") || 
      lower.endsWith(".jpg") || 
      lower.endsWith(".jpeg")
    );
  });

  if (imageFiles.length === 0) {
    throw new Error("No valid image files found in the ZIP.");
  }

  let count = 0;
  for (const name of imageFiles) {
    const blob = await zipContent.files[name].async("blob");
    const fileName = name.split("/").pop() || name;
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(`${folder}/${fileName}`, blob, {
        upsert: true,
        contentType: `image/${fileName.split(".").pop() === "webp" ? "webp" : "png"}`
      });

    if (uploadError) {
      console.error(`Failed to upload ${fileName}:`, uploadError);
      continue;
    }

    count++;
    if (opts?.onProgress) {
      opts.onProgress(count, imageFiles.length);
    }
  }

  return { total: count };
}
