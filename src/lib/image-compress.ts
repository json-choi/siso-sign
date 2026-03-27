/**
 * 클라이언트에서 이미지를 WebP로 변환하고 압축합니다.
 * Canvas API를 사용하여 브라우저에서 처리합니다.
 */
export async function compressImageToWebP(
  file: File,
  maxWidth = 1920,
  quality = 1
): Promise<File> {
  // 이미 작은 WebP 파일이면 그대로 반환
  if (file.type === 'image/webp' && file.size < 1024 * 1024) {
    return file;
  }

  const bitmap = await createImageBitmap(file);

  let width = bitmap.width;
  let height = bitmap.height;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: 'image/webp', quality });

  const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${nameWithoutExt}.webp`, { type: 'image/webp' });
}
