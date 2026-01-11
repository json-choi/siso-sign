-- =============================================
-- siso-sign 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- =============================================
-- 기존 테이블 삭제 (초기화)
-- =============================================
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS social_links CASCADE;

-- =============================================
-- 테이블 생성
-- =============================================

-- 1. 포트폴리오 테이블
CREATE TABLE portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  image_url TEXT,
  images TEXT[],
  thumbnail_url TEXT,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 서비스 테이블
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 사이트 설정 테이블 (key-value 형태)
CREATE TABLE site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  type VARCHAR(50) DEFAULT 'text', -- text, html, json, image
  description VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 소셜 링크 테이블
CREATE TABLE social_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  icon VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 초기 데이터 삽입
-- =============================================

-- 사이트 설정 기본값
INSERT INTO site_settings (key, value, type, description) VALUES
  ('site_title', 'siso-sign', 'text', '사이트 제목'),
  ('site_description', 'Creative Design Agency', 'text', '사이트 설명'),
  ('hero_title', 'WE DESIGN!\nSIGNS THAT\nMATTER.', 'text', '히어로 섹션 타이틀'),
  ('about_text', 'siso-sign은 공간의 가치를 높이는 시각적 정체성을 만드는 비주얼 솔루션 파트너입니다. 전략, 디자인, 그리고 기술의 조화를 통해 상상하던 브랜드의 모습을 현실로 구현합니다.', 'text', 'About 섹션 텍스트'),
  ('contact_email', 'siso-sign@naver.com', 'text', '연락처 이메일'),
  ('contact_phone', '', 'text', '연락처 전화번호'),
  ('contact_address', '', 'text', '주소'),
  ('footer_copyright', '© 2026 siso-sign. All rights reserved.', 'text', '푸터 저작권 문구');

-- 서비스 기본값
INSERT INTO services (title, description, icon, sort_order) VALUES
  ('Branding', 'Comprehensive solutions for your business needs. We deliver high-quality results tailored to your brand.', 'Palette', 1),
  ('Exhibition', 'Comprehensive solutions for your business needs. We deliver high-quality results tailored to your brand.', 'Layout', 2),
  ('Signage', 'Comprehensive solutions for your business needs. We deliver high-quality results tailored to your brand.', 'PenTool', 3);

-- 소셜 링크 기본값
INSERT INTO social_links (platform, url, icon, sort_order) VALUES
  ('Instagram', 'https://instagram.com/siso-sign', 'Instagram', 1),
  ('Facebook', 'https://facebook.com/siso-sign', 'Facebook', 2),
  ('KakaoTalk', 'https://pf.kakao.com/siso-sign', 'MessageCircle', 3);

-- 포트폴리오 샘플 데이터
INSERT INTO portfolios (title, description, category, image_url, is_featured, sort_order) VALUES
  ('Project 1', '프로젝트 1 설명', 'Branding', '/project1.png', true, 1),
  ('Project 2', '프로젝트 2 설명', 'Exhibition', '/project2.jpg', true, 2),
  ('Project 3', '프로젝트 3 설명', 'Signage', '/project3.png', true, 3),
  ('Project 4', '프로젝트 4 설명', 'Branding', '/project4.gif', true, 4);

-- =============================================
-- 인덱스 생성
-- =============================================
CREATE INDEX idx_portfolios_featured ON portfolios(is_featured) WHERE is_featured = true;
CREATE INDEX idx_portfolios_published ON portfolios(is_published) WHERE is_published = true;
CREATE INDEX idx_portfolios_sort ON portfolios(sort_order);
CREATE INDEX idx_services_active ON services(is_active) WHERE is_active = true;
CREATE INDEX idx_services_sort ON services(sort_order);

-- =============================================
-- RLS (Row Level Security) 정책
-- =============================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

-- 읽기 정책 (공개)
CREATE POLICY "Public read portfolios" ON portfolios FOR SELECT USING (is_published = true);
CREATE POLICY "Public read services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public read social_links" ON social_links FOR SELECT USING (is_active = true);

-- 쓰기 정책 (service_role만 허용 - 어드민 API에서 사용)
CREATE POLICY "Service role full access portfolios" ON portfolios FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access services" ON services FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access site_settings" ON site_settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access social_links" ON social_links FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- updated_at 자동 업데이트 트리거
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Storage 버킷 생성 (Supabase Dashboard에서 수동 생성 필요)
-- Storage > New bucket > 'images' 생성 후 Public 설정
-- =============================================
