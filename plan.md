# siso-sign 브랜딩 홈페이지 기획안

## 1. 프로젝트 개요
- **브랜드명:** siso-sign
- **컨셉:** 크리에이티브 디자인 에이전시
- **목표:** 창의적이고 전문적인 이미지를 전달하며 포트폴리오를 효과적으로 보여주는 브랜딩 사이트 구축

## 2. 기술 스택 (Latest Versions)
- **Framework:** Next.js 15.1+ (App Router, TurboPack)
- **Core:** React 19 (RC or Latest Stable compatible with Next.js 15)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.4+
- **Animation:** Framer Motion 11+ (스크롤 애니메이션, 호버 효과 등 인터랙션 강화)
- **Icons:** Lucide React

## 3. 디자인 컨셉
- **스타일:** 모던, 볼드(Bold), 미니멀리즘
- **컬러 팔레트:**
  - **Background:** Black (#0a0a0a) 또는 Dark Gray - 몰입감 증대
  - **Text:** White (#ffffff) & Light Gray (#a1a1aa)
  - **Accent:** Electric Blue (#3b82f6) 또는 Neon Lime (#a3e635) - 포인트 강조
- **타이포그래피:** 크고 굵은 헤드라인으로 임팩트 전달

## 4. 페이지 구조 (Single Page Scroll)
사용자가 끊김 없이 경험할 수 있도록 원페이지 스크롤 방식을 기본으로 합니다.

### 1) Header (Navigation)
- 로고 (좌측)
- 메뉴 (우측): Work, About, Services, Contact
- 스크롤 시 배경 블러 처리 (Glassmorphism)

### 2) Hero Section (Intro)
- **내용:** 강렬한 캐치프레이즈 (예: "We Design Your Sign")
- **연출:** 큰 타이포그래피 등장 애니메이션, 마우스 인터랙션에 반응하는 배경 요소

### 3) About Section
- **내용:** 에이전시 철학 및 소개
- **연출:** 스크롤에 따라 텍스트가 서서히 나타나는 효과

### 4) Work Section (Portfolio)
- **내용:** 주요 프로젝트 썸네일 그리드 (Masonry 레이아웃 추천)
- **연출:** 이미지 호버 시 프로젝트 제목 및 설명 오버레이, 확대 효과

### 5) Services Section
- **내용:** 제공 서비스 목록 (Brand Identity, UI/UX, Signage, Motion Graphics)
- **연출:** 카드 형태의 레이아웃, 아이콘 활용

### 6) Contact / Footer
- **내용:** 프로젝트 문의 이메일, 소셜 미디어 링크, 카피라이트
- **연출:** 심플하고 명확한 CTA (Call To Action) 버튼

## 5. 구현 단계 (Todo)
1. **프로젝트 셋업:** Next.js 15, Tailwind, Framer Motion 설치
2. **기본 레이아웃:** 폰트 설정, 전역 스타일, Header/Footer 구현
3. **섹션별 구현:** Hero -> About -> Work -> Services -> Contact 순서로 개발
4. **인터랙션 추가:** 스크롤 애니메이션 및 마이크로 인터랙션 적용
5. **반응형 최적화:** 모바일/태블릿 대응

