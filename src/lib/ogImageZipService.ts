import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";

/**
 * Exports all OG images from Supabase storage into a single ZIP file.
 * Uses parallel downloads for speed and provides progress feedback.
 */
export async function exportOgImagesToZip(opts?: { 
  bucket?: string; 
  folder?: string;
  filename?: string;
  onProgress?: (current: number, total: number) => void;
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

  const validFiles = files.filter(f => f.name !== ".emptyKeep");
  const total = validFiles.length;
  let count = 0;

  // 2. Download files in batches to prevent browser hang and speed up
  const batchSize = 10;
  for (let i = 0; i < total; i += batchSize) {
    const batch = validFiles.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (file) => {
      try {
        const { data: blob, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(`${folder}/${file.name}`);

        if (downloadError) throw downloadError;
        
        if (blob) {
          zip.file(file.name, blob);
        }
      } catch (err) {
        console.error(`Failed to download ${file.name}:`, err);
      } finally {
        count++;
        if (opts?.onProgress) {
          opts.onProgress(count, total);
        }
      }
    }));
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

  const total = imageFiles.length;
  let count = 0;

  // Upload in batches
  const batchSize = 5;
  for (let i = 0; i < total; i += batchSize) {
    const batch = imageFiles.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (name) => {
      try {
        const blob = await zipContent.files[name].async("blob");
        const fileName = name.split("/").pop() || name;
        
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(`${folder}/${fileName}`, blob, {
            upsert: true,
            contentType: `image/${fileName.split(".").pop() === "webp" ? "webp" : "png"}`
          });

        if (uploadError) throw uploadError;
      } catch (err) {
        console.error(`Failed to upload ${name}:`, err);
      } finally {
        count++;
        if (opts?.onProgress) {
          opts.onProgress(count, total);
        }
      }
    }));
  }

  return { total: count };
}
