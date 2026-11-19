# siso-sign 마케팅 소재

인스타그램 광고 소재를 실제 포트폴리오 사진으로 만드는 작업 폴더입니다. 사이트 코드와 분리된
별도 패키지라서 여기서 무엇을 설치하거나 바꿔도 사이트 빌드와 배포(`pnpm`, Cloudflare)에는
영향이 없습니다. 이 폴더는 `npm`을 씁니다.

| 폴더 | 내용 |
|---|---|
| `instagram-carousel-01/` | 피드 카루셀 7장 (1080×1350). `output/`에 완성 이미지가 있습니다 |
| `reels-01/` | 릴스 영상 17초 (1080×1920, 무음). [HyperFrames](https://hyperframes.heygen.com)로 렌더링 |
| `scripts/fetch-media.mjs` | 사이트에 공개된 포트폴리오 사진을 `media/`로 내려받기 |
| `scripts/reels-assets.mjs` | 릴스에 쓰는 사진·폰트·GSAP을 `reels-01/assets/`로 복사 |

## 처음 한 번

Node 22 이상이 필요합니다.

```bash
cd marketing
npm install
npx playwright install chromium   # 카루셀 이미지 렌더링용 브라우저
npm run fetch-media               # 공개 포트폴리오 사진 받기 (약 60MB, media/는 git에 올리지 않음)
```

`fetch-media`는 www.siso-sign.com의 `/work` 페이지에서 사진을 1920px WebP로 받아
`media/<R2 키>.webp`로 저장하고, 프로젝트별 목록을 `media/manifest.json`에 적습니다.
이미 받은 파일은 건너뜁니다. 사이트에 접속할 수 없는 환경이라면 GitHub Actions의
**Export portfolio media** 워크플로를 직접 실행해서 결과물(artifact)을 받으면 됩니다
(그 경우 파일 이름이 순번이므로 manifest의 `source`로 키를 찾아 이름을 바꿔야 합니다).

## 카루셀 (instagram-carousel-01)

- 디자인: `instagram-carousel-01/ad.html` 한 파일에 7장이 모두 있습니다. 브라우저로 열고
  주소 끝에 `#1` … `#7`을 붙이면 한 장씩 보입니다.
- 이미지 다시 만들기: `npm run carousel` → `output/siso-sign-ad-01.jpg` … `07.jpg`
- 폰트: Pretendard(한글), Geist(영문, 사이트와 같음), Cal Sans(로고). 모두 OFL 라이선스.

## 릴스 (reels-01)

```bash
npm run reels:preview   # 브라우저 미리보기 (스튜디오)
npm run reels:check     # 레이아웃·대비·가독성 검사
npm run reels:render    # marketing/reels-01-output.mp4 생성 (git에 올리지 않음)
```

구성 (`reels-01/index.html`, GSAP 타임라인):

| 시간 | 장면 |
|---|---|
| 0.0–2.9초 | 맑은수한약국 간판이 어둠에서 켜지듯 밝아지고 "간판은 가게의 첫 문장입니다." |
| 2.6–11.3초 | 오브옉트 레코드바 · you need ramen · scalartis · 애니포스만화학원 · Next ID, 각 1.7초 |
| 11.1–13.2초 | KINFOLK · YU:Z · TOMO FC · make by sona 빠른 컷 + "33개의 공간" |
| 13.1–17.0초 | 밝은 배경 CTA: "사진 한 장으로 시작하세요" + DM 상담 버튼 |

사진을 바꾸려면 `scripts/reels-assets.mjs`의 `photos` 목록과 `index.html`의 `src`를 함께
고칩니다. 음악은 넣지 않았습니다. 인스타그램에 올릴 때 메타의 무료 음원을 고르세요.

### HyperFrames 메모

- 버전은 `0.9.13`으로 고정했습니다. 거의 매시간 새 버전이 나오는 패키지라 검증된 버전을
  씁니다. 올리려면 `npx hyperframes@latest upgrade --project reels-01 --check`로 차이를 먼저 봅니다.
- 사용 통계 전송을 끄려면 `HYPERFRAMES_NO_TELEMETRY=1` 환경 변수를 설정합니다.
- `reels-01/CLAUDE.md`(=`AGENTS.md`)는 HyperFrames가 만든 AI 작업 안내문입니다. 로컬
  Claude Code로 릴스를 고칠 때 자동으로 읽힙니다. 안내문에 나오는 `/hyperframes` 스킬은
  `npx hyperframes skills update`로 설치합니다.
- 클라우드 작업 환경처럼 브라우저를 따로 받을 수 없는 곳에서는 이미 있는 Chromium을 지정하면
  됩니다: `HYPERFRAMES_BROWSER_PATH`, `PRODUCER_HEADLESS_SHELL_PATH`.

## 올리기 전 확인

- 광고에 고객사 상호와 매장이 나오므로 해당 고객사의 동의를 받습니다.
- 사진 설명("입체 간판", "후광 입체 사인" 등)은 사진을 보고 붙인 것이니 실제 시공 방식과 맞는지 확인합니다.
- 광고 링크에는 `?utm_source=ig&utm_campaign=<이름>`을 붙이면 어드민 대시보드의 유입 경로에
  "인스타그램 (광고)"로 따로 집계됩니다.

### 광고 문구 (카루셀·릴스 공통)

- 본문: 카페, 병원, 학원, 매장까지. 공간에 맞는 간판을 디자인하고 직접 제작합니다. 현장 사진 한 장만 DM으로 보내주세요. 어울리는 간판을 제안해 드립니다.
- 제목: 간판은 가게의 첫 문장입니다
- 버튼: 메시지 보내기 (Instagram Direct)
