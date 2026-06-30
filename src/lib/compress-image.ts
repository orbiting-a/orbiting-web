export async function compressImage(
  file: File,
  options?: { maxWidth?: number; quality?: number }
): Promise<File> {
  const maxWidth = options?.maxWidth ?? 1200;
  const quality = options?.quality ?? 0.8;

  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, maxWidth / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  if (scale >= 1 && file.size < 500 * 1024) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality)
  );
  if (!blob) throw new Error("Compression failed");

  const name = file.name.replace(/\.[^.]+$/, ".webp");
  return new File([blob], name, { type: "image/webp" });
}

export async function compressToThumbnail(
  file: File
): Promise<File> {
  return compressImage(file, { maxWidth: 200, quality: 0.3 });
}

export function thumbnailPath(originalPath: string): string {
  const parts = originalPath.split("/");
  const name = parts.pop()!;
  return [...parts, `thumb_${name}`].join("/");
}

export function thumbnailUrl(fullUrl: string): string {
  const parts = fullUrl.split("/");
  const name = parts.pop()!;
  return [...parts, `thumb_${name}`].join("/");
}
