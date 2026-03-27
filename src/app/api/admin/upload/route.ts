import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// 서명된 업로드 URL 발급 (클라이언트가 Supabase에 직접 업로드하기 위해 사용)
export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json();

    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json({ error: '유효하지 않은 파일 경로입니다.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase.storage
      .from('images')
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('Signed URL error:', error);
      return NextResponse.json(
        { error: '서명된 URL 생성에 실패했습니다: ' + error.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      publicUrl: urlData.publicUrl,
    });
  } catch (error) {
    console.error('Upload sign error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
