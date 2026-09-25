# 개발 계획과 인계 — API 기능 기준

## 현재 상태

- 하네스와 제품 명세 정리는 완료됐다.
- Spring·FastAPI·운영 서비스와 실제 API 구현은 아직 시작하지 않았다. 웹은 mock 데이터 기반 관리자 컴퓨터 화면만 구현돼 있다(PR #6).
- `API명세서/API명세서`의 API 문서는 모두 `시작 전`이다.
- 계획은 API 그룹별 파일로 나누고, 파일명은 기능을 설명하는 이름으로 정한다.

## 하네스 개선과 CI 선구축

초기 하네스 정리 이후의 결함과 개선 과제는 [2026-09-23 평가](../reviews/harness-assessment-2026-09-23.md) 및 [하네스 개선 계획](harness-improvements.md)에서 관리한다.
CI/CD 구성·정적 검사는 서비스 개발 전에 준비할 수 있고, 테스트·빌드는 실행 가능한 골격·명령부터 연결한다(DEC-013).
이 작업 흐름은 아래 제품 API 개발과 병행할 수 있다. 하네스 개선 전체 완료를 제품 개발의 새 선행 조건으로 만들지 않는다.

## API 그룹별 계획

| API 그룹 | 계획 파일 | API 범위 | 담당자 | 상태 |
| --- | --- | --- | --- | --- |
| 인증 | [auth.md](auth.md) | `/api/v1/auth/*` | 강민우 | 미착수 |
| 상태 확인 | [health-check.md](health-check.md) | `/api/v1/health` | 김준수 | 미착수 |
| 학생·출석 | [student-attendance.md](student-attendance.md) | `/api/v1/student`, `/api/v1/attend` | 김준수 | 미착수 |
| 호실 명단 | [room-roster.md](room-roster.md) | `/api/v1/room/student` | 임서하 | 미착수 |
| QR 출석 | [qr-attendance.md](qr-attendance.md) | `/api/v1/qr*` | 김성찬 | 미착수 |
| 얼굴 인식 | [face-recognition.md](face-recognition.md) | `/api/v1/face/*` | 임서하 | 미착수 |
| 봉사 관리 | [volunteer-management.md](volunteer-management.md) | `/api/v1/volunteer/*` | 김성찬·강민우 | 미착수 |
| DataGSM 동기화 | [datagsm-webhook.md](datagsm-webhook.md) | `/api/v1/webhook` | 강민우 | 미착수 |

## 공통 선행 작업

- [ ] 인증 헤더, 사용자 식별자 타입, 공통 오류 envelope, `requestId`를 정한다.
- [ ] 서버 UTC 시각과 Asia/Seoul 08:00 운영일 계산을 공통화한다.
- [ ] `student_id`, `studentId`, `studentNumber`, `dormitoryRoom` 매핑을 고정한다.
- [ ] DB migration, 테스트용 clock, 민감정보 없는 로그·fixture를 준비한다.
- [ ] 실제 구현 뒤 비어 있지 않은 OpenAPI 계약을 `contracts/`에 생성한다.
- [ ] 관리자·본인·본인 호실 권한을 서버에서 검증한다.

## 기능 간 의존성

인증과 DataGSM 동기화가 먼저다. 이후 학생·출석, 호실, QR, 얼굴, 봉사 기능을 병렬 진행하고 마지막에 웹·운영·수용 검증을 연결한다.

## API 문서와 제품 명세의 보완 목록

1. QR 발급 문서에 `purpose`, 독립 세션 ID, lease/heartbeat, 종료, 15분 갱신이 없다.
2. QR 출석 문서에 운영일·중복 결과·현재 사용자 범위가 없다.
3. 얼굴 감지는 `GET` + `File[]` body이며 단일 `student_id`·`success`만 반환해 다수 얼굴·unknown·점수·모델 정보를 표현하지 못한다.
4. 얼굴 인식 결과의 출석 확정·오프라인 임시 기록 동기화 API가 없다.
5. 관리자 호실 수동 출석 저장 API가 없다.
6. 공지 CRUD·내부 알림 API가 없다.
7. 호실 API는 단일 호실 조회만 정의해 관리자 층 전개도 전체 조회를 직접 지원하지 않는다.
8. webhook의 event 값, 서명 방식, old/new 실제 필드, 재전송 idempotency가 미정이다.
9. 인증 JSON 예시의 쉼표, `RefreshToken` 헤더 규칙, 공통 오류 envelope가 정리되지 않았다.
10. 봉사 증가·차감 API의 재시도 idempotency와 0회 하한 검증을 구현 계약에 반영한다. UI 노출은 SRC-NOTION-CHECKUPZIP 승인으로 `+ / −` 모두 확정됐다.

없는 경로를 임의로 구현하지 않고, 제공자·소비자·관련 REQ·수용 시나리오를 정한 뒤 `contracts/`에 반영한다.

## 웹·운영 통합

- [ ] OAuth, 학생 홈·마이·QR, 관리자 홈·QR·얼굴·봉사 화면을 각 API와 연결한다.
- [ ] 로딩·빈 상태·권한 부족·만료·중복·일시 장애를 오류 코드와 분리한다.
- [ ] 카메라 track·타이머·구독을 이탈/로그아웃 때 정리한다.
- [ ] Docker Compose, PostgreSQL/Redis 볼륨, health check, secret 주입을 구성한다.
- [ ] GSM SV 권한·VM 만료·자원·포트/TLS·OAuth callback을 확인한다.
- [ ] 원본 얼굴·당일 출석·임시 기록을 백업에서 제외하고 삭제 복원을 검사한다.

## 완료 기준

- API 요청·응답·권한·오류가 각 계획과 `contracts/`에 연결된다.
- 출석은 학생+용도+운영일 DB 원자성과 가장 이른 유효 기록 규칙을 갖는다.
- 얼굴 원본·프레임·벡터·당일 출석의 수명을 DB·캐시·로그·백업까지 검증한다.
- 실제 제품 테스트 전에는 수용 시나리오를 `verified`로 표시하지 않는다.
- 실제 서비스 테스트 후 `npm run harness:check`를 실행한다.

## 실행 기록

| 시점 | 실행 | 결과 |
| --- | --- | --- |
| 2026-09-21 | `npm run harness:sync` | 공통 스킬 동기화 완료 |
| 2026-09-21 | `npm run harness:check` | 하네스·명세·스킬 검사 통과, 제품 서비스는 미구현 |
| 2026-09-22 | API 명세 폴더 대조 | 8개 API 그룹별 기능 계획으로 재편 |
| 2026-09-23 | CI 선구축 지침 반영·공식 문서/공개 저장소 비교·로컬 진단 | DEC-013 추가, 평가와 개선 계획 작성. 기준 검사 20/20 통과와 별개로 훅 입력/경로 및 검증 증빙의 허점을 재현. 실제 에이전트 새 세션·원격 CI·제품 실행은 미검증. |
| 2026-09-24 | Notion ZIP 항목 3개 사용자 승인 반영 | 얼굴 자동 촬영, 관리자 휴대폰 5탭, 봉사 횟수 `+ / −`를 출처·명세·수용 시나리오·분야별 계획에 반영. 제품 코드는 미구현. 이번 변경 뒤 자동 검사는 실행하지 않음. |
| 2026-09-22 | web/ Next.js 16 + TS + Tailwind 4 골격, `npm run check` (Windows / Node 24.15.0) | lint·typecheck·prettier·build 통과. 원격 CI 실행은 PR에서 확인 예정. 화면·카메라는 미검증 |
| 2026-09-23 | `web/` 골격 생성(DEC-015) + 관리자 컴퓨터 화면 첫 컴포넌트(사이드바, 홈 전개도) 구현. `npm run lint`/`npm run typecheck`/`npm run build` 실행, `npm audit` 0건 | 이슈 [#5](https://github.com/Start-Up-10th/CheckUp-Client/issues/5), 브랜치 `feature/5-admin-computer-home`. `npm run dev` 기동 후 `curl`로 `/admin` 200 확인. 헤드리스 브라우저 스크린샷은 샌드박스 네트워크 제한으로 미실행 — 실제 브라우저 시각 검증 남음 |
| 2026-09-23 | Figma `스타일 가이드`/`상태 컴포넌트` 페이지(343/446/523) 확인 후 색상·버튼(Primary/Accent/Danger/Ghost)·모달 규격을 토큰화. 실제 프로덕트 폰트가 Pretendard(Noto Sans KR은 Figma 미설치 대체 표시)임을 확인해 `@font-face`로 교체. 호실 상세 다이얼로그(REQ-UI-002) + 수동 출석 수정(REQ-ATT-006) 구현 | Playwright(Chromium) 헤드리스로 실제 클릭→토글→저장 상호작용 실행, 호실 카드/층 통계 갱신 확인. Figma 인스턴스 대비 라운드 불일치 2건 수정. 모달 폭은 스타일 가이드 값(460px)을 채택(인스턴스는 480px, 사용자 확인 대기) |
| 2026-09-23 | QR 코드 생성 화면(REQ-ATT-003/004) 구현: 자습실/기숙사 탭, `qrcode.react`로 QR 렌더링(DEC-017), mm:ss 카운트다운, 목적 전환 시 새 세션 발급, 상태 배너(StatusBanner) 컴포넌트 추가 | `npm run lint`/`typecheck`/`build` 통과. Playwright로 탭 전환 시 새 QR·15:00 리셋 확인. 최초 구현에서 Math.random 기반 세션을 초기 렌더에 바로 만들어 hydration mismatch(devtools "1 Issue")가 났던 것을 발견해 마운트 후 발급 + 스켈레톤으로 수정, 재검증 후 경고 사라짐 확인 |
| 2026-09-23 | 사용자 피드백으로 호실 상세를 2단계로 재구성: 상세(`RoomDetailDialog`, 읽기 전용 배지 + 닫기/수정, Figma 540:1003)와 수정(`RoomAttendanceEditDialog`, 좌우 세그먼트 토글 + 닫기/저장, Figma 572:150)을 분리. 이전 커밋은 두 화면을 하나로 합쳐 REQ-UI-002의 "상세→수정 2단계"를 놓쳤던 것 | Playwright로 상세→수정→토글→저장 전체 흐름 재검증, 스크린샷이 사용자가 준 참고 이미지와 일치함을 확인 |
| 2026-09-23 | 사용자가 홈 화면 호실 카드 비율이 다르다고 지적 → 재검토. Figma는 호실 행에 고정 `h-[210px]`를 주는데 `RoomGrid`의 CSS grid는 행 높이를 content-driven(auto)으로 둬서 카드가 훨씬 납작하게 렌더링되고 있었다. `auto-rows-[210px]` 추가로 수정. 같은 방식으로 전 컴포넌트를 Figma 리터럴 값과 재대조해 사이드바 네비 항목 높이도 42px 고정(이전엔 패딩 기반 자동 계산으로 ~44px)으로 맞춤. 스타일 가이드 "모달 폭" 재확인 결과 디자이너가 호실 다이얼로그 인스턴스를 460px로 고쳐 스타일 가이드와 일치시켰음을 확인(DEC-016 갱신) | `npm run lint`/`typecheck`/`build` 통과. Playwright 전체 페이지 스크린샷(1440×1500)으로 카드 비율이 사용자 참고 이미지와 일치함을 확인 |
| 2026-09-23 | 호실 다이얼로그 2종을 Figma가 렌더링한 스크린샷과 픽셀 크기까지 비교(PNG 헤더 직접 파싱). 두 다이얼로그 모두 정확히 33px 낮게 렌더링됨을 발견 — 원인은 Figma의 Actions 프레임이 버튼 실제 크기보다 큰 고정 `h-[100px]`을 갖는데 내 구현은 버튼 크기에 맞춰 자동 축소된 것. `h-[100px]` 추가로 재현. 남은 7px 차이는 Tailwind `text-xl`/`text-sm`의 기본 line-height(28px/20px)가 Figma 텍스트 박스(24px/17px)보다 커서 발생 — `leading-[24px]`/`leading-[17px]`로 명시해 최종 1px 이내로 수렴 | 재스크린샷 비교: 상세 419→420, 수정 427→428 (1px, 서브픽셀 반올림 수준) |
| 2026-09-23 | 얼굴 인식 생성 화면(REQ-FACE-004/007) 구현: `getUserMedia` 실카메라 스트림, LIVE 표시(허용 후에만), 전체화면(Fullscreen API, 같은 `<video>` 유지), 최근 인식 목록. 목적 탭 라벨이 QR 화면과 달리 "기숙사 입소"임을 Figma에서 확인해 `PurposeTabs`에 라벨 오버라이드 추가(DEC-018) | Playwright `--use-fake-device-for-media-stream`으로 실제 카메라 권한·스트림·LIVE·전체화면 진입/종료까지 실행 확인. 전체화면 전/후 스크린샷에서 가짜 카메라의 내장 타임스탬프가 끊기지 않고 이어지는 것으로 세션이 재시작되지 않았음을 확인 |
| 2026-09-23 | 사용자 요청으로 얼굴 인식 화면을 Figma 좌표 metadata까지 재대조. "최근 인식" 목록 폭이 리터럴 626px인데 320px로 임의 축소했던 것을 되돌림(캔버스 폭에 맞춘 의도된 비율로 판단). 일반 화면의 카메라 패널에는 "인식 대기 중" 안내 문구가 Figma 목업에 아예 없고(전체화면 목업에만 있음) 전체화면 버튼만 있음을 발견 — 사용자 확인 후 일반 화면에서는 안내 문구를 빼고 전체화면에서만 표시하도록 수정(에러 문구는 두 모드 모두 유지, REQ-FACE-004 필수 정보이므로) | `npm run lint`/`typecheck`/`build` 통과, Playwright 재스크린샷으로 레이아웃 비율 확인 |
| 2026-09-23 | 이어서 크기까지 검증. Playwright `boundingBox()`로 실제 렌더된 요소 픽셀 크기를 Figma 리터럴 값과 직접 대조(전체화면 스크린샷 대신 요소 단위 측정) | expand 버튼 44×44, 아이콘 20×20, 최근 인식 행 582×41·행간 10px, LIVE 점 7px(일반)/9px(전체화면), 목록 폭 626px 모두 일치. 전체화면 닫기 버튼만 (24,24)로 3px 벗어나 있어 Figma 값(27,23)으로 수정 후 재측정 일치 확인 |
| 2026-09-23 | 카메라 패널 폭을 두고 왕복: 사용자가 자신의 스크린샷으로 폭 불일치 지적 → PIL로 픽셀 스캔해 카메라(flex-1)가 뷰포트에 따라 계속 늘어나 Figma 910:626 비율이 깨짐을 확인 → "의도한대로 말고 피그마대로" 요청으로 카메라도 910px 고정 → 되돌려 요청으로 원복 → "관리자-컴퓨터는 데스크톱 기준이라 피그마대로 해야 한다"는 설명과 함께 재적용 → 재적용 후 헤더의 목적 탭이 `w-full` 정렬이라 아래 고정폭과 안 맞는 새 버그 발견, 헤더도 `w-[1556px]`로 고정해 수정 → 최종적으로 사용자가 "그냥 반응형으로 해줘"로 결론 → 카메라 `flex-1` + 목록 626px 고정으로 최종 복귀(DEC-019 갱신) | 각 단계마다 `npm run lint`/`typecheck`/`build` 통과 확인. 최종 상태는 Playwright로 카메라가 뷰포트 폭에 반응하고 목록만 626px로 고정됨을 재확인 |
| 2026-09-23 | 사용자가 자신의 스크린샷에서 최근 인식 목록 폭이 다르다고 지적. Python PIL로 사용자 이미지와 내 스크린샷을 픽셀 단위로 스캔해 대조한 결과, 카메라 패널을 `flex-1`(뷰포트에 따라 계속 늘어남)로 구현했던 것이 원인 — 뷰포트가 넓을수록 카메라만 커지고 목록은 626px 고정이라 캔버스 기준 비율(910:626)과 어긋났다. 사용자가 "의도한대로 말고 피그마대로" 요청 → 카메라도 Figma 리터럴 값인 910px 고정폭으로 변경(반응형 늘어남 포기). 부작용으로 총 콘텐츠 폭이 1556px 고정이라 1920px보다 좁은 화면(예: 1440px 노트북)에서 오른쪽이 잘리므로 `main`에 `overflow-x-auto`를 추가해 최소한 가로 스크롤로 접근 가능하게 함 | `npm run lint`/`typecheck`/`build` 통과, Playwright로 910px/626px 고정 확인, 홈·QR 화면은 영향 없음 확인 |
| 2026-09-23 | 사용자가 전개도 흰색 여백이 Figma와 다르다고 지적 → Figma `02 · 메인`(16:404) metadata와 대조. 범례 줄이 Figma에선 높이 100px(범례가 세로 중앙)인데 구현은 글자 높이(16px)뿐이라 그리드가 86px 위로 붙고 아래 여백만 커졌음. `RoomGrid` 범례 줄에 `h-[100px]` 적용. 함께 헤더·통계 카드·층 탭이 Tailwind 기본 line-height 때문에 17.5px 높아 패널 전체가 밀려 있던 것을 `leading-[15px]/[36px]/[17px]/[14px]/[29px]`로 Figma 텍스트 박스에 맞춤 | Playwright 1920×1080 측정: 헤더 28/55, 통계 카드 103/79, 패널 202/850, 범례 224/100, 그리드 340(하단 여백 62) — Figma 좌표와 모두 일치. `npm run lint`/`typecheck` 통과 |
| 2026-09-23 | 사용자가 "반응형 기준" 문서(기기별 라우트 분리 없이 한 페이지가 폭에 따라 변함: ~767px 관리자-핸드폰 하단 탭바 4개 · 768~1279px 관리자-패드 축소 레일 · 1280px~ 관리자-컴퓨터 사이드바 300px)를 제공 → 관리자 네비게이션을 반응형 셸로 재구성. `ADMIN_NAV_ITEMS`를 `lib/admin/nav-items.ts`로 공유화하고 `AdminSidebar`(xl+)·`AdminRail`(md~xl, 아이콘 전용)·`AdminBottomTabBar`(md 미만, 축약 라벨 4개)를 Tailwind 기본 breakpoint(`md`=768, `xl`=1280)로 전환. 처음엔 로그아웃을 탭바 5번째로 넣었다가 "하단 탭바 4개" 명세와 안 맞아 `AdminMobileLogoutButton`(우상단 고정 아이콘)으로 분리. 얼굴 인식 화면은 폰 폭에서 카메라+목록이 나란히 있으면 카메라가 짜부라져 `md` 미만에서 세로 스택(`flex-col md:flex-row`)으로 전환 | `npm run lint`/`typecheck`/`build` 통과. Playwright로 400/1000/1440px 3단계 × 홈/QR/얼굴 3화면 가로 스크롤 없음 확인, 폰/패드/데스크톱 스크린샷으로 탭바·레일·사이드바 전환과 얼굴 인식 세로 스택 확인 |
| 2026-09-23 | 이어서 노트북 폭 아래 여백 확인: 카드가 `auto-rows-[210px]` 고정 높이라 1440×900에서 139×210으로 길쭉해지고 패널 안 아래 여백이 22px로 줄며 세로 스크롤이 생겼음. 카드를 Figma 비율 `aspect-[207.43/210]`로, 패널은 `flex-1` 대신 아래 패딩 62px 고정으로 변경 — 1920에선 기존과 동일(210px), 좁은 폭에선 같은 모양으로 축소 | Playwright로 1920×1080/1536×864/1440×900/1366×768/1280×800 측정: 모든 폭에서 패널 안 아래 여백 62px, 1920 패널 202~1052 Figma 일치, 1440×900·1280×800은 스크롤 없음(1536×864 21px, 1366×768 44px). `lint`/`typecheck` 통과 |
| 2026-09-23 | 사용자가 "그냥 다" 반응형으로 해달라고 요청(호실 다이얼로그 폭 항상 460px 고정, QR 박스 항상 300px 고정으로 남아있던 부분) → 다이얼로그는 스타일 가이드 3단계 값(컴퓨터 460 / 패드 400 / 폰 310)을 `w-[310px] md:w-[400px] xl:w-[460px]` + `max-w-[calc(100vw-32px)]` 안전장치로 반응형화. QR 박스는 `size-[min(300px,70vw)]`로 좁은 화면에서 자동 축소, `QRCodeSVG`에 `className="size-full"` 추가해 내부 SVG가 컨테이너를 따라가게 함. 홈 화면도 같은 기준으로 확인 요청받아 재검증 | Playwright로 홈/QR/다이얼로그를 320~1440px 여러 폭에서 가로 스크롤 없음과 다이얼로그 폭 310/400/460 전환 확인. `lint`/`typecheck`/`build` 통과 |
| 2026-09-23 | 사용자가 넓은 화면 스크린샷에서 세로 스크롤이 생긴다고 지적 → 원인은 호실 카드가 `aspect-ratio`로 폭에 비례해 높이도 커져서, 화면이 넓을수록(특히 와이드 모니터) 3행 전체 높이가 뷰포트를 넘는 것. "반응형이면 화면에 맞게 줄어드는 거 아니냐"는 사용자 판단에 따라 데스크톱(`xl`, 항상 7열×3행)에서는 `RoomGrid`/Rooms 그리드를 `xl:flex-1 xl:min-h-0 xl:grid-rows-3`로 바꿔 남은 세로 공간에 정확히 맞춤 — `RoomCard`도 `xl:aspect-auto xl:h-full`로 그리드 셀에 맞춰 늘어나게 함(정사각형 비율 대신 셀 크기 그대로). 패드/폰(3행보다 많음)은 원래대로 세로 스크롤 유지 | `main` 스크롤 컨테이너 기준(`document.documentElement`가 아님) 측정: 1280×720~2560×1080 등 7개 데스크톱 해상도에서 `scrollHeight === clientHeight`로 스크롤 완전히 없음, 패드(1000×700)·폰(375×700)은 여전히 스크롤됨을 확인. `lint`/`typecheck`/`build` 통과 |
| 2026-09-23 | 사용자가 Figma 원본 스크린샷을 보여주며 패널 하단 회색 여백이 다르다고 지적 → 그 여백이 고정 `pb-[62px]`라 화면이 커져도 카드만 늘어나고 여백은 안 늘어난다는 걸 발견. "그것도 다 반응형으로 해" 요청에 따라 카드 영역과 하단 여백을 Figma 1920 기준 비율(650:62)로 `xl:flex-[650]`/`xl:flex-[62]` 형제 요소로 나눠 같은 비율로 함께 커지게 변경 | Playwright로 1280×720~2560×1440 측정: 여백이 30.7px→46.3px→**62px(1920×1080, Figma 기준 해상도와 정확히 일치)**→72.5px→93.3px로 화면 높이에 비례해 커짐, 모든 해상도에서 스크롤 없음 유지 확인. `lint`/`typecheck`/`build` 통과 |
| 2026-09-23 | 사용자가 홈 화면 호실 그리드가 양쪽 가로로 잘린 스크린샷 제보. 자동화된 12뷰포트×3화면 가로 스크롤 검사(직전 기록)에서는 재현되지 않아 원인 특정은 못 했지만, CSS Grid 아이템의 기본 `min-width: auto`가 좁은 칸에서 내용 최소폭 때문에 넘치는 전형적인 문제를 막기 위해 `RoomCard`에 `min-w-0 overflow-hidden`을 방어적으로 추가. 사용자가 "해결됐어"로 확인 | `lint`/`typecheck`/`build` 통과. 정확한 재현 폭·스크린샷이 실제 창 그대로인지는 받지 못해 근본 원인은 문서화하지 못함 — 재발하면 재현 폭을 다시 요청 |
| 2026-09-23 | 이슈 #5 체크리스트 마지막 항목(봉사자 관리/추가, REQ-COM-001/002) 구현. `mock-volunteers.ts`(명단 소속 여부와 누적 횟수를 분리한 `Volunteer` 타입, 재추가 시 누적 유지 시나리오를 보여주는 mock 10명), 관리 화면(`AdminVolunteerManagement`/`VolunteerListRow`, Figma 317:473 — 행별 "+"로 확인 없이 즉시 1회 적립, 0회는 outline 배지), 추가 화면(`AdminVolunteerAdd`/`VolunteerSearchRow`, Figma 513:8 — 이름/학번 검색, 미소속 추가/소속 제외 버튼), 제외 확인 다이얼로그(`RemoveVolunteerDialog`, Figma 522:117 — "적립된 봉사 횟수는 그대로 유지됩니다" 안내, 취소/제외) 구현. `get_design_context`로 세 노드의 리터럴 값을 다시 대조해 초안에서 어긋났던 부분을 수정: 추가 화면 검색창은 전체 폭이 아니라 고정 173×46(반응형을 위해 `max-w-[173px]`로 유지), 배경 `rowSurface`(#f6f6f7)·테두리 `border`(#e3e3e5); 제외 다이얼로그 제목은 `text-xl`(20px)이 아니라 18px, 부제(이름·학번·호실)는 `textMuted`가 아니라 `ghost.text`(#3a3a3c), 안내문이 `textMuted`(#8e8e93); 헤더에 있던 "돌아가기" 버튼은 Figma에 없고 사이드바 "봉사자 관리" 활성 상태(`isAdminNavActive`의 `startsWith` 매칭)가 이미 `/admin/volunteers/add`를 포함해 대신 제거 | `npm run lint`/`typecheck`/`build` 통과, `npm run harness:check` 20/20 통과. Playwright(Chromium, npx로 즉석 설치)로 1920×1080(컴퓨터)·1024×768(패드)·390×844(폰) 스크린샷과 `main.scrollHeight===clientHeight`·`documentElement.scrollWidth===clientWidth` 확인 — 4개 뷰포트 모두 스크롤/오버플로 없음. 제외 확인 다이얼로그도 버튼 클릭으로 실제 열어 스크린샷 검증 |
| 2026-09-23 | 사용자가 "디자인 바뀌었는데 그거에 맞게 ㄱㄱ"로 Figma 재대조 요청 → 봉사자 관리(317:473)/명단 편집(구 513:8) 페이지가 갱신됨을 발견. (1) 행별 "+" 옆에 "−"(1회 차감) 버튼 추가, 0회에서는 비활성(테두리 `#ebebed`/글자 `#d5d5d8`) — 기존 REQ-COM-002 "감소/취소 UI는 현재 범위에 없다"와 정면 충돌해 `dorm-spec-update` 스킬로 REQ-COM-002/DEC-010 폐기 후 갱신, DEC-023 신설, ACC-COM-002 문구 정정 + ACC-COM-006(봉사 -1) 시나리오 추가, `sources/README.md` SRC-CORRECTIONS에 정정 근거 기록. (2) "+ 봉사자 추가" 버튼 라벨→"명단 편집", 07번 화면 이름 "봉사자 추가"→"봉사자 명단 편집"(구조 동일, REQ 영향 없음). (3) 두 화면에 새 상태 토스트 세트(345:66, 519:814) 발견 — `StatusBanner`에 `neutral` variant 추가(제외 성공처럼 담담한 안내용, bg `rowSurface`/text `textMuted`; Figma가 neutral 토스트에도 danger 테두리색 `#f3cfcb`를 그대로 쓴 것은 컴포넌트 재사용 흔적으로 보고 `admin.border`로 대체). 적립 성공 토스트("봉사 1회를 적립했습니다.")는 관리 화면에, 추가/제외 성공 토스트("봉사자 명단에 추가했습니다."/"명단에서 제외했습니다.")는 편집 화면에 2.5초 자동 소멸로 연결. 차감·중복·검색결과없음 토스트는 mock에 실제 실패/중복 경로가 없어 임의로 만들지 않고 보류(실 서버 연동 시 채움) | `npm run harness:check`(REQ 38·시나리오 39) 통과, `npm run lint`/`typecheck`/`build` 통과. Playwright로 1920×1080에서 관리 화면 "+"/"−" 렌더와 적립 토스트, 편집 화면 제목·추가 토스트를 실제 클릭으로 재현해 스크린샷 확인 — 가로 스크롤 없음 |
| 2026-09-23 | 사용자가 "봉사자 추가할 때 위에 문구가 나오는데 좀 어색하지 않아?" 피드백 → 토스트가 문서 흐름 안에 인라인으로 끼어 있어 뜰 때마다 아래 리스트 패널 전체가 밀려 내려가는 레이아웃 흔들림이 원인으로 판단. 관리/편집 두 화면 모두 토스트를 `fixed` 우상단 오버레이(모바일은 상단 중앙)로 옮겨 문서 흐름에서 제외 | Playwright로 적립 클릭 전/후 첫 행의 `boundingBox()`가 완전히 동일함을 확인(레이아웃 시프트 0). `lint`/`typecheck`/`build` 통과 |
| 2026-09-23 | 사용자가 "우리 프로젝트는 PWA로 할거임"이라고 결정 → 범위를 물어 "설치 가능한 앱 셸만"으로 확정(DEC-024, 오프라인 얼굴 인식 DEC-005와는 분리). `app/manifest.ts`(Next 16 네이티브 Metadata API, name/short_name/theme_color `#b9ee84`/아이콘 4종)와 `public/sw.js`(정적 자산 `/_next/static/`·`/icons/`만 캐시-우선, 그 외 전부 네트워크 직행)를 손으로 작성 — `next-pwa` 같은 webpack 플러그인은 이 프로젝트의 Turbopack 빌드(DEC-015)에서 `webpack()` 훅이 안 돌아 서비스워커가 조용히 안 만들어질 위험이 있어 배제. 실제 로고가 없어 브랜드 라임/다크 색 체크마크를 Playwright로 PNG 렌더해 192/512(any+maskable)·애플터치아이콘·파비콘으로 사용(placeholder, DEC-024에 교체 예정 기록). `ServiceWorkerRegistrar` 클라이언트 컴포넌트로 `load` 이후 등록, `viewport.themeColor`·`appleWebApp` 메타데이터 추가 | `npm run build` 결과 라우트에 `/manifest.webmanifest`·`/icon.png` 생성 확인. 프로덕션 빌드(`next start`)를 Playwright로 열어 `<link rel="manifest">`/`theme-color`/`apple-touch-icon`이 실제 렌더된 head에 들어있음을 확인, 서비스워커가 `active:true`로 등록됨을 확인, 재방문 시 캐시(`app-shell-v1`)에 `/_next/static/...` 청크만 들어가고 다른 경로는 전혀 안 들어감을 캐시 키 덤프로 확인(API/데이터 캐싱 없음 검증). `lint`/`typecheck` 통과. Lighthouse PWA 감사·실제 모바일 기기 설치는 미실행 |
| 2026-09-23 | 사용자가 "관리자랑 사용자가 따로 있는데 스타트 url은 뭘로 했어"라고 질문 → 루트 manifest 하나만 있던 것을 지적받고 범위를 물어 "역할별로 따로 설치"로 확정(DEC-025). `app/admin/manifest.ts`(Next 파일 컨벤션)로 먼저 시도했으나 빌드는 성공해도 `/admin/manifest.webmanifest` 요청 시 404가 나는 것을 직접 확인 — `icon.tsx`류와 달리 `manifest.ts`는 세그먼트 스코프를 지원하지 않는 것으로 판단. `app/admin/manifest.webmanifest/route.ts` route handler로 대체하고 `app/admin/layout.tsx`의 `metadata.manifest`로 연결. name "관리자"/short_name "관리자"/start_url·scope `/admin`으로 학생용(루트, 아직 미구현 영역을 대표)과 분리 | 프로덕션 빌드로 `/admin/manifest.webmanifest`가 관리자 전용 JSON을 반환함을 curl로 확인, `/admin`과 `/admin/volunteers` 페이지 head에 `<link rel="manifest" href="/admin/manifest.webmanifest">`와 `apple-mobile-web-app-title: 관리자`가 실제로 들어가는지 확인(레이아웃 아래로 상속됨), 루트 `/`는 여전히 `/manifest.webmanifest`를 가리킴을 대조 확인. `lint`/`typecheck`/`build` 통과 |
| 2026-09-23 | 사용자가 "하네스에 넣었어?"라고 질문 → 지금까지 PWA(DEC-024/023)를 decisions.md에만 기록하고 REQ/수용 시나리오에는 안 넣었음을 답변. 사용자가 "ㄱㄱ"로 정식 등록 승인 → `dorm-spec-update`로 `docs/spec/screens.md`에 REQ-UI-007(설치 가능한 앱 셸) 신설: 관리자/학생 역할별 별도 설치, 정적 자산만 캐시하고 데이터는 캐시하지 않음, 오프라인 얼굴 인식(REQ-FACE-008/DEC-005)과 무관함, 아이콘이 placeholder라는 점을 명문화. `docs/spec/index.md` 요약에 "설치(PWA)" 추가. `tests/acceptance/scenarios.json`에 ACC-UI-007 추가(네트워크 끊고 재실행 시 앱 셸은 뜨되 데이터 화면은 보장 안 함) — 다른 38개 시나리오가 실제 구현 여부와 무관하게 전부 `specified`로 남아있는 기존 관례를 따라 이 항목도 `specified`·`implementation`/`evidence` 빈 배열로 유지(별도 저장된 검증 증거 파일이 없어 이 항목만 `implemented`로 올리면 일관성이 깨짐). `docs/sources/README.md`에 SRC-PWA-DECISION 추가 | `npm run harness:check`(REQ 39·시나리오 40) 통과 |
| 2026-09-23 | `feature/5-admin-computer-home` 로컬 클론이 원래 `origin/main`(cd14269)을 기준으로 진행됐는데, 그 사이 harness 세션이 별도로 `git push --force`로 `main`/`develop` 히스토리를 교체해 두 히스토리가 공통 조상이 없어졌음을 발견. `web/app` + Tailwind v3.4.19 + TS 6.0.3(이 28개 커밋의 실제 작업물)과 `develop`의 `web/src/app` + Tailwind v4.3.3 + TS 5.9.3(플레이스홀더 골격)이 구조적으로 충돌 — cherry-pick/merge로 자동 결합 불가. `develop` 기준 새 브랜치를 만들고 이 작업물을 `web/src/app` 경로로 옮겨 재구성, 겹치는 문서(`docs/plans/implementation.md`, `docs/verification.md`, `.gitignore`)는 두 갈래 diff를 직접 대조해 수동으로 합쳤다. `docs/decisions.md`/`docs/spec/*`/`tests/acceptance/scenarios.json`/`docs/sources/README.md`는 develop이 건드리지 않아 그대로 적용 | `npm run harness:check`, `web/` `npm run check` 재검증 후 PR로 이어감. 자세한 재구성 내용은 해당 PR 본문 참고 |
| 2026-09-24 | 사용자가 Figma `관리자-핸드폰`(278:5) 링크를 주고 폰 반응형 구현을 요청 → 새 브랜치 `feature/admin-phone-responsive`(develop 기준). 화면 25개 프레임을 조회하고 이전/이후 노드를 비교해 하단 탭바에 5번째 "로그아웃 탭"이 추가된 것을 확인. 하네스 DEC-014(폰 5탭)와 같은 방향이라 REQ-UI-005에 "아이콘만" 표기를 추가하고 DEC-026 신설, DEC-012/020의 폰 로그아웃 임시안 대체, ACC-UI-005 문구 추가, SRC-FIGMA-ADMIN-PHONE 등록. **코드 구현은 아직 시작하지 않음** — 다음은 화면별(공통 셸→홈→QR→얼굴/전체화면→봉사자→다이얼로그) 폰 스타일 적용과 390×844 스크린샷 대조. 패드 링크는 아직 없음 | `npm run harness:check` 통과(문서 변경만, 앱 코드·테스트 실행 없음) |
| 2026-09-24 | 관리자-핸드폰(Figma 278:5) 폰 스타일을 `md`(768px) 미만 기본값으로 구현(DEC-026): 공통 셸(아이콘 전용 5탭·우상단 로그아웃 제거·폰 여백), 홈(3열 그리드·세그먼트 층 탭·62px 통계 카드), QR(180px·38px 시간), 얼굴 인식·전체화면(126px 최근 인식·전체화면 배치), 봉사자 관리/명단 편집/제외 확인, 호실 상세·수정 다이얼로그(310×386/394). 컴퓨터·패드 스타일은 md 이상에서 그대로 유지. 개발 중 서비스워커가 옛 CSS/JS를 붙들어 화면이 안 바뀌는 문제를 사용자 브라우저에서 확인해 서비스워커를 production 빌드에서만 등록하도록 변경 | 화면마다 Playwright로 390×794(상태바를 뺀 Figma 콘텐츠 높이) 좌표를 Figma 메타데이터와 대조해 일치 확인, 1920/1440/1024/768(컴퓨터·패드) 회귀 없음·430/390/360/320(폰) 가로 스크롤 없음 확인. `npm run check`·`harness:check` 통과. 미구현: 폰 얼굴 화면의 로딩(스켈레톤)·빈 상태·오류(+다시 시도) 프레임(사용자 결정으로 다음 순서), 관리자-패드 링크 미수령(레일 88px 임시값), 실기기 검증 안 함 |
| 2026-09-25 | 사용자 결정으로 REQ-UI-003 학생 홈 호실 표시를 "목록 방식 대체"에서 Figma 배치 그림(2열 카드·창문·출입문)으로 변경. 번호는 이름순 표시 순번(노트북 Figma 224:2와 동일), 분모는 DataGSM 배정 수, 침대 번호·정원 데이터는 계속 제외. 출처 SRC-FIGMA-USER 추가, SRC-CORRECTIONS·ACC-UI-003 갱신 | `npm run harness:check`로 문서 연결 확인. 화면 구현은 `feature/user-main`에서 이어서 진행 |
| 2026-09-25 | 사용자 결정("피그마랑 아예 똑같이, 쓸데없는거 빼고")으로 REQ-FACE-001의 얼굴 촬영 코너 가이드·`얼굴을 화면 안에 맞춰 주세요` 안내를 제거하고 Figma 03·얼굴 촬영 화면대로 되돌림. SRC-CORRECTIONS에 기록 | `npm run harness:check`, 화면은 `feature/user-face`(#23)에서 수정 |
| 2026-09-25 | 팀원의 Figma 사용자-노트북 수정에 맞춰 REQ-COM-005 변경: 노트북 읽지 않은 알림은 사이드바 벨의 빨간 점으로 표시하고, 알림 항목 배경 강조는 알림 화면에서만. ACC-COM-005·SRC-CORRECTIONS 갱신(#29) | `npm run harness:check`, 사이드바 코드는 `fix/user-sidebar-notification` |

현재 변경은 계획 문서뿐이며 제품 API·웹·AI·배포 구현은 수행하지 않았다.

웹은 관리자 컴퓨터 화면(홈·호실 상세/수정·QR·얼굴 인식·봉사자 관리/명단 편집)과 PWA 설치 셸이 mock 데이터로 구현돼 PR #6으로 develop에 머지됐다.
실제 서버 연동·인증·DB는 아직 없다. 제품 시나리오는 모두 specified(0/40 verified)다.

`01 · 로그인`(Figma 16:547) 화면은 지금 UI만 따로 mock으로 만들지 않는다 — 사용자 결정(2026-09-23)에 따라
DataGSM OAuth 연동(DEC-001) 작업과 같은 시점에 화면까지 함께 구현한다. 그 전까지는 `web/src/app/page.tsx`의
개발용 임시 진입 화면("관리자 홈으로 이동" 버튼)이 그 역할을 대신하며, 이슈 #5 체크리스트에 빠져 있는 것은
누락이 아니라 이 결정에 따른 의도된 범위다.
