/**
 * Turns an uploaded image into a small JPEG "data URL" we can keep in the demo
 * state. Photos from phones can be several MB — too big for localStorage — so
 * we shrink them first. (The real system will upload to file storage instead.)
 */
export async function imageFileToDataUrl(file: File, maxSize = 900): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}
