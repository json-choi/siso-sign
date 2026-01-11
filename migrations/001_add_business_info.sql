-- 사업자 정보 설정 추가 (기존 DB에 실행)
-- Supabase SQL Editor에서 실행하세요

INSERT INTO site_settings (key, value, type, description) VALUES
  ('business_name', '', 'text', '상호명 (사업자등록증 상 상호)'),
  ('business_representative', '', 'text', '대표자 성명'),
  ('business_registration_number', '', 'text', '사업자등록번호'),
  ('business_address', '', 'text', '사업장 소재지'),
  ('business_phone', '', 'text', '대표 전화번호'),
  ('business_email', '', 'text', '대표 이메일'),
  ('business_hosting_provider', 'Vercel', 'text', '호스팅 제공자')
ON CONFLICT (key) DO NOTHING;
