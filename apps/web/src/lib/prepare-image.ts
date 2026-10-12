/**
 * Shrinks a photo in the browser before upload. Vercel Functions reject request
 * bodies over 4.5 MB (and the upload is relayed as base64, +33%), so large
 * camera photos are resized to at most MAX_SIDE px and re-encoded as JPEG.
 */
const MAX_SIDE = 2400;
const SKIP_BELOW_BYTES = 1_500_000;
export const MAX_UPLOAD_BYTES = 3_000_000;

export async function prepareImageForUpload(file: File): Promise<File> {
  if (file.size <= SKIP_BELOW_BYTES && file.type !== 'image/avif') return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // unsupported format: let the server validate it
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) return file;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85),
  );
  if (!blob || blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
}
