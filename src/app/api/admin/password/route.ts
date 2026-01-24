import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { hashPassword, verifyPasswordHash } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '새 비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: existingPassword } = await supabase
      .from('admin_password')
      .select('id, password_hash')
      .single();

    let isValidCurrentPassword = false;

    if (existingPassword?.password_hash) {
      isValidCurrentPassword = await verifyPasswordHash(currentPassword, existingPassword.password_hash);
    } else {
      const envPassword = process.env.ADMIN_PASSWORD;
      isValidCurrentPassword = envPassword ? currentPassword === envPassword : false;
    }

    if (!isValidCurrentPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);

    if (existingPassword?.id) {
      await supabase
        .from('admin_password')
        .update({ password_hash: newPasswordHash })
        .eq('id', existingPassword.id);
    } else {
      const { error } = await supabase
        .from('admin_password')
        .insert({ password_hash: newPasswordHash });

      if (error) {
        console.error('Insert error:', error);
        return NextResponse.json(
          { error: '비밀번호 저장에 실패했습니다.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
