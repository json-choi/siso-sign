import { supabase } from '@/lib/supabase';
import { compressImageToWebP } from '@/lib/image-compress';

export async function uploadImage(file: File): Promise<string> {
  const compressed = await compressImageToWebP(file);

  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.webp`;
  const filePath = `portfolios/${fileName}`;

  // 서버에서 서명된 업로드 URL 발급 (service_role 권한)
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '업로드 URL 발급에 실패했습니다.');
  }

  const { signedUrl, token, publicUrl } = await res.json();

  // 서명된 URL로 Supabase에 직접 업로드 (용량 제한 없음)
  const { error } = await supabase.storage
    .from('images')
    .uploadToSignedUrl(filePath, token, compressed, {
      contentType: 'image/webp',
    });

  if (error) {
    throw new Error('업로드에 실패했습니다: ' + error.message);
  }

  return publicUrl;
}
