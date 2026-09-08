# Cloudflare 배포 메모

Cloudflare 미리보기 https://siso-sign.cjs5241.workers.dev 에 배포했다. 운영 도메인과 Vercel production은 아직 전환하지 않았다. 프로젝트 전용 KV를 개인 계정에 생성했다.
개인 소유 Cloudflare 계정과 개인 GitHub 세션을 먼저 확인한다. 서로 다른 계정의 토큰·버킷·zone을 공유하지 않는다.

배포는 `.github/workflows/cloudflare.yml`의 수동 실행으로 시작한다. `cloudflare-production` 환경에
`CLOUDFLARE_ACCOUNT_ID` 변수와 해당 계정에만 권한이 있는 `CLOUDFLARE_API_TOKEN` secret이 필요하다.
앱 실행 비밀은 GitHub 빌드 변수에 넣지 않고 Worker Secrets에 등록한다. `.env*`, `.dev.vars*`와 빌드 출력은 커밋하지 않는다.
CI는 아직 원격 실행하지 않았다. DNS는 프리뷰 기능 검증 후에만 전환한다.

## 구성 및 설정

- vinext beta → Workers + Static Assets + Images + KV. `wrangler.jsonc`의 KV는 프로젝트 전용 namespace로 연결했다.
- 빌드 변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, 사용 중이면 `NEXT_PUBLIC_META_PIXEL_ID`.
- 런타임: 같은 공개 Supabase 설정, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `ADMIN_PASSWORD`, 사용 중이면 `NAVER_SITE_VERIFICATION`.
- 기존 Supabase DB·스토리지와 JWT 키를 보존한다. 프리뷰에서 운영 데이터를 수정하지 않는다.
- `worker.js`는 `siso-sign.com` 요청의 경로·쿼리를 보존해 `www.siso-sign.com`으로 307 응답한다.

## 검증 및 전환

로컬 Workers 빌드, Next 빌드, 홈페이지·공개 작업 페이지 200, 비인증 관리자 API 401, 기존 키로 서명한 관리자 세션 조회 200을 확인했다. 리다이렉트 경로·쿼리 보존도 통과했다.
관리자 실제 로그인·CRUD·이미지 업로드 및 Images 변환은 프리뷰에서 추가 검증해야 한다.
가비아의 전체 DNS 레코드와 DS를 백업하고 Cloudflare NS 이전 후 두 호스트를 연결한다. 등록기관 이전은 필요하지 않다.

원격 미리보기에서 공개 페이지 200, 비인증 관리자 API 401, 기존 관리자 키로 서명한 세션 조회 200, 대표 이미지 3개 200을 확인했다.
