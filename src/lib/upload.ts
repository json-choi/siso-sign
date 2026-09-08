import { compressImageToWebP } from '@/lib/image-compress';

export async function uploadImage(file: File): Promise<string> {
  const compressed = await compressImageToWebP(file);
  const body = new FormData();
  body.set('file', compressed, 'image.webp');
  const response = await fetch('/api/admin/upload', { method: 'POST', body });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '이미지 업로드에 실패했습니다.');
  return result.publicUrl;
}
