import { supabase } from "./supabase";

const BUCKET = "template-media";

/**
 * Uploads a single file to the `template-media` storage bucket and returns
 * its public URL. Throws on failure (caller should catch and show the error).
 */
export async function uploadMediaFile(file: File): Promise<string> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
