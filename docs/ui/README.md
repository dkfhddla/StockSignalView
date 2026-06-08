# StockSignalView UI 문서

이 디렉터리는 PR #12의 Dashboard Schema 기반 문서 체계를 보조하는 UI/UX 기준을 기록한다.

## 문서 역할

- 1차 화면 계약: `../dashboard-schema-v1.md`
- 허용 위젯과 옵션: `../widget-registry.md`
- 렌더링 책임과 금지 동작: `../dynamic-view-renderer.md`
- 사용자 흐름과 상태 전이: `../specs/frontend-user-flow.md`
- 시각 방향, 레이아웃, 반응형 보조 기준: 이 디렉터리의 문서

`docs/ui/` 문서는 구현자가 화면의 밀도, 위계, 모바일/PC 표시 방식을 일관되게 유지하도록 돕는다. 위젯 타입, 데이터 계약, 렌더링 가능 여부는 루트 계약 문서를 우선한다.
