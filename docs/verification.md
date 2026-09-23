# 검증 기준과 현재 상태

## 지금 실행 가능한 검사

Node.js 22 이상, 외부 패키지 설치 없이 실행한다.

```text
npm run harness:check
npm run harness:sync
```

첫 명령은 필수 파일, REQ 정의·수용 시나리오 연결, 로컬 Markdown 링크, Claude import,
스킬 frontmatter·원본/복사본 일치, JSON 설정을 검사한 뒤 검사기 자체 테스트를 실행한다.
두 번째는 명시적인 파일 생성 명령이며 `.agents/skills`의 SKILL.md를 `.claude/skills`로 동기화한다.
잘못된 이름·경로·심볼릭 링크는 거부하며 임의 파일을 삭제하지 않는다.

프로젝트 훅은 Claude Code와 Codex의 PreToolUse/PostToolUse에 연결된다. credential 형태의 문자열과
위험한 Git·Docker·데이터베이스 삭제 명령은 차단하고, 명세·스킬·하네스 변경 뒤에는 검사를 안내한다.
훅은 안전 보조장치일 뿐 최종 기준이 아니며, `npm run harness:check`와 CI를 반드시 실행한다.

이 검사기는 명세 문장의 의미 전체, 제품 구현, 실제 학교 API, 카메라 정확도를 자동 증명하지 않는다.
REQ 연결의 완전성은 파일 내 정의된 REQ를 기준으로 한다. 인터뷰 누락 여부는 출처와 별도 대조한다.

## 웹 검사 (web/)

`web/`에서 Node.js 22 이상으로 실행한다. CI는 [web.yml](../.github/workflows/web.yml)이 `web/` 변경 시 같은 명령을 돈다.

```text
npm ci
npm run lint
npm run typecheck
npm run format:check
npm run test    # Vitest + Testing Library
npm run build
npm run check   # 위 다섯을 한 번에
```

컴포넌트 테스트는 Vitest로 실행한다. 브라우저(E2E) 테스트 도구는 카메라·화면 동선 검증을 시작할 때 정해 등록한다.

2026-09-23 기준 관리자 컴퓨터 화면(이슈 #5, REQ-UI-001/002, REQ-ATT-003/004/006, REQ-FACE-004/007, REQ-COM-001/002)은
`npm run lint`/`typecheck`/`build` 통과 후 Playwright(Chromium) 헤드리스로 실제 렌더링을 검증했다:
관리자 홈 전개도를 Figma node 16:404와 픽셀 단위로 대조해 통계 카드·범례 스와치 라운드 불일치를 찾아 수정했고,
호실 상세 다이얼로그(node 540:1003)는 클릭→토글→저장까지 실제 상호작용을 실행해 호실 카드와 층 통계가
갱신되는 것을 확인했다(출석 76/미출석 5 → 저장 후 75/6).

QR 코드 생성 화면(`/admin/qr`)은 자습실/기숙사 탭 전환 시 새 QR과 15:00 리셋을 Playwright로 확인했다.
최초 구현은 Math.random 기반 세션을 초기 렌더에서 바로 만들어 hydration mismatch를 냈는데, 세션 발급을
마운트 이후로 옮기고 스켈레톤을 보여주도록 고친 뒤 재확인해 경고가 사라졌다.

호실 상세/수정 다이얼로그는 Figma가 렌더링한 스크린샷을 PNG 헤더 단위로 직접 비교해 재검증했다(33px
오차를 발견해 Actions 영역 높이와 line-height를 맞춰 최종 1px 이내로 수렴).

얼굴 인식 생성 화면(`/admin/face`)은 Playwright를 `--use-fake-device-for-media-stream`
`--use-fake-ui-for-media-stream` 플래그와 `permissions: ["camera"]`로 띄워 실제 `getUserMedia` 카메라
권한·스트림·LIVE 표시·전체화면 진입/종료까지 실행했다. 전체화면 전/후 스크린샷에서 가짜 카메라의 내장
타임스탬프 오버레이가 끊기지 않고 이어지는 것으로 전체화면 전환이 카메라 세션을 재시작하지 않음을 확인했다.
실제 얼굴 인식 결과는 AI/Spring 연동이 없어 검증 대상이 아니며 mock 데이터로만 화면을 채웠다.

봉사자 관리/추가 화면(REQ-COM-001/002)은 1920×1080(컴퓨터)·1024×768(패드)·390×844(폰) 3개 뷰포트에서
Playwright 스크린샷과 `main.scrollHeight===clientHeight`·`documentElement.scrollWidth===clientWidth`로
스크롤/오버플로 없음을 확인했다. 실제 카메라·조명 환경, 실기기 설치(PWA), Lighthouse 감사는 미실행이다.

## 제품 단계별 검사

| 영역 | 구현 시 필요한 검증 |
| --- | --- |
| 웹 | 타입/빌드, 등록·QR·호실 수정 동선, 관리자/학생 접근, 3종 화면 폭, 카메라 해제, 전체화면에서 세션 유지 |
| Spring | 역할 위조/다른 학생 접근 거부, OAuth state·콜백, purpose별 unique 출석, QR 세션 격리/만료, +1 중복 방지 |
| AI | 같은 사람/다른 사람·미등록·저조도·다수 얼굴 혼합, 점수 경계, unknown 오매칭, 트랙별 실패, 원본 폐기 |
| 시간·복구 | 가짜 clock으로 07:59:59→08:00, 서버 재시작, 동기화 지연, 수동 수정 이전 이벤트, 폐기된 기록 부활 방지 |
| 개인정보 | DB·캐시·로그·임시 파일·백업에 원본 잔존 없음; 벡터 대상 삭제 후 복원 시 재출현 없음 |
| 인프라 | Compose 검증, 서비스 health, 실제 HTTPS 카메라, secret 주입, 볼륨 영속, 복원·롤백, VM 만료 확인 |

서비스 생성 후 실제 명령·실행 디렉터리를 이 문서에 등록한다. 현재 없는 npm/Gradle/pytest 명령을 CI에 성공하는 빈 작업으로 추가하지 않는다.
실제 카메라 성능 목표·오인식 기준은 AI 담당자가 장비와 모델 실측 후 기록한다.

## 수용 시나리오 상태

[scenarios.json](../tests/acceptance/scenarios.json)의 상태:

- `specified`: 명세만 존재.
- `implemented`: 실제 구현 경로가 존재하지만 검증 증빙이 부족.
- `verified`: 구현과 테스트/실측 증빙 파일이 존재. 문서 경로를 형식상 채워 통과시키지 않는다.

증빙은 재현 명령·환경·결과가 있는 파일이어야 한다. 합성 데이터만 저장한다.
실측을 못 한 항목은 implemented 또는 specified 상태로 남긴다.

## 현재 실행 범위

하네스 파일·검사기와 수용 시나리오만 생성했다. 서비스 코드는 미구현이다.
현재 Codex 작업에 새 지침과 스킬 3개가 검색된 것을 확인했다.
Claude 실행·두 도구의 별도 새 세션 작업, GitHub Actions 원격 실행, DataGSM, 카메라, GSM SV 배포는 로컬 하네스 검사 대상이 아니다.
마지막 로컬 검사 결과는 [개발 계획](plans/implementation.md)에 남긴다.
