import { MAX_UPLOAD_BYTES, prepareImageForUpload } from '@/lib/image-compress';

export async function uploadImage(file: File): Promise<string> {
  const prepared = await prepareImageForUpload(file);
  if (prepared.size > MAX_UPLOAD_BYTES) throw new Error('사진은 20MB 이하만 올릴 수 있습니다.');
  const body = new FormData();
  body.set('file', prepared, prepared.name);
  let response: Response;
  try {
    response = await fetch('/api/admin/upload', { method: 'POST', body });
  } catch {
    throw new Error('업로드 중 연결이 끊겼습니다. 다시 시도해주세요.');
  }
  const result: { publicUrl?: string; error?: string } = await response.json().catch(() => ({}));
  if (!response.ok || !result.publicUrl) throw new Error(result.error || '이미지 업로드에 실패했습니다.');
  return result.publicUrl;
}
