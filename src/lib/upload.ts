import { supabase } from '@/lib/supabase';
import { compressImageToWebP } from '@/lib/image-compress';

export async function uploadImage(file: File): Promise<string> {
  const compressed = await compressImageToWebP(file);

  const fileExt = 'webp';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `portfolios/${fileName}`;

  const { error } = await supabase.storage
    .from('images')
    .upload(filePath, compressed, {
      contentType: 'image/webp',
      upsert: false,
    });

  if (error) {
    throw new Error('업로드에 실패했습니다: ' + error.message);
  }

  const { data: urlData } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
