/** Uploads up to this size go to the server untouched, so no quality is lost in the browser. */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
/** Larger files are shrunk to this longest edge first; still above the 3840px the server keeps. */
const MAX_EDGE = 4096;
const OVERSIZE_QUALITY = 0.92;

/**
 * Prepares a photo for upload. The server converts every upload to a
 * high-quality WebP master, so the browser only steps in when a file is too
 * large to send, and then encodes at near-lossless quality. Safari cannot
 * encode WebP from a canvas and silently returns PNG, so the result type is
 * checked and JPEG is used instead.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  // GIFs may be animated; re-encoding would keep only the first frame.
  if (file.type === 'image/gif') return file;
  // iPhone HEIC photos only decode in Safari. Turn them into a high-quality JPEG
  // there so every later step can read them; elsewhere the server tries itself.
  const heic = /^image\/hei[cf]$/.test(file.type) || /\.hei[cf]$/i.test(file.name);
  if (!heic && file.size <= MAX_UPLOAD_BYTES) return file;

  let bitmap: ImageBitmap;
  try {
    // from-image applies the EXIF rotation, so portrait iPhone photos stay upright.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    if (heic && file.size <= MAX_UPLOAD_BYTES) return file;
    throw new Error('사진이 너무 크고 이 브라우저에서 줄일 수 없습니다. 20MB 이하로 줄여서 올려주세요.');
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('사진을 줄이지 못했습니다.');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // HEIC becomes JPEG at 0.95; the server then makes the WebP master from it.
  let blob = heic && file.size <= MAX_UPLOAD_BYTES
    ? await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.95 })
    : await canvas.convertToBlob({ type: 'image/webp', quality: OVERSIZE_QUALITY });
  if (blob.type !== 'image/webp' && blob.type !== 'image/jpeg') blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: OVERSIZE_QUALITY });
  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const name = `${file.name.replace(/\.[^.]+$/, '') || 'image'}.${extension}`;
  return new File([blob], name, { type: blob.type });
}
