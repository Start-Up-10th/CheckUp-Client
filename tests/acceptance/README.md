# 수용 시나리오

[scenarios.json](scenarios.json)은 REQ별 Given/When/Then과 구현/검증 증빙을 담는다.
대부분의 상태는 specified다. 웹 관리자 화면이 담당하는 시나리오는 implemented이며 단위·화면 테스트 경로를 증빙으로 적었다. 실제 서버와 연결해 확인한 것이 아니라 verified는 없다. 이것은 실행 테스트 suite가 아니다.

구현 시 implementation에는 저장소 상대 파일 경로를, evidence에는 실제 테스트 또는 재현 기록 파일 경로를 추가한다.
implemented는 구현 경로, verified는 구현·증빙 경로 둘 다 필요하다. 검사는 파일 존재를 확인할 뿐 실제 통과 여부를 대신 판정하지 않는다.
제품 테스트는 각 서비스 도구에 맞춰 작성하며 이 시나리오 ID를 연결한다.
