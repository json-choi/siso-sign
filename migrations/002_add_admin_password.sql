-- =============================================
-- 관리자 비밀번호 테이블 추가
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 관리자 비밀번호 테이블 생성
CREATE TABLE IF NOT EXISTS admin_password (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE admin_password ENABLE ROW LEVEL SECURITY;

-- service_role만 접근 가능 (API에서만 사용)
CREATE POLICY "Service role full access admin_password" ON admin_password 
  FOR ALL USING (auth.role() = 'service_role');

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_admin_password_updated_at BEFORE UPDATE ON admin_password
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 초기 비밀번호 없음 - 첫 로그인 시 ENV의 ADMIN_PASSWORD 사용 후 
-- 사용자가 변경하면 DB에 저장됨
