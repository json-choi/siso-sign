import { compressImageToWebP } from '@/lib/image-compress';

export async function uploadImage(file: File): Promise<string> {
  const compressed = await compressImageToWebP(file);

  const formData = new FormData();
  formData.append('file', compressed);

  const response = await fetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || '업로드에 실패했습니다.');
  }

  const data = await response.json();
  return data.url;
}
