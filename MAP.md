# StockSignalView 저장소 지도

이 문서는 저장소의 주요 경로와 책임을 설명한다. 새 파일을 추가할 때는 이 지도를 먼저 확인한다.

## 루트

- `AGENTS.md`: 에이전트와 엔지니어의 짧은 시작점 문서.
- `README.md`: 프로젝트 소개, 현재 범위, 주요 문서 링크를 제공하는 진입점.
- `MAP.md`: 저장소 경로별 책임을 설명하는 내비게이션 문서.
- `CONTRIBUTING.md`: 저장소 참여 규칙과 문서/코드 동시 갱신 기준을 설명하는 문서.
- `WORKFLOW.md`: 아이디어부터 리뷰까지의 실제 작업 순서를 설명하는 문서.

## 애플리케이션 경로

- `backend/`: FastAPI 백엔드 구현 위치. 기본 대시보드 API와 스키마 검증 슬라이스가 구현되어 있다.
- `backend/app/api/`: API 라우터 위치.
- `backend/app/core/`: 설정, 보안 기본값, 공통 유틸리티 위치.
- `backend/app/models/`: 데이터 모델 위치.
- `backend/app/schemas/`: 요청/응답 스키마 위치.
- `backend/app/services/`: 대시보드 프리셋·스키마 검증과 후속 포트폴리오, 성과, 알림 서비스 위치.
- `backend/app/jobs/`: 스케줄러와 백그라운드 작업 위치.
- `backend/tests/`: 백엔드 테스트 위치.
- `frontend/`: Dashboard Schema 렌더러를 포함한 React/Vite 프론트엔드 구현 위치.
- `frontend/public/`: 정적 자산 위치.
- `frontend/src/app/`: 앱 셸과 라우팅 위치.
- `frontend/src/components/`: 공통 UI 컴포넌트 위치.
- `frontend/src/features/`: 기능별 화면, 동적 대시보드 화면, 상태 위치.
- `frontend/src/lib/`: API 클라이언트와 공통 라이브러리 위치.
- `frontend/src/styles/`: 전역 스타일 위치.
- `.github/workflows/`: 후속 GitHub Actions 워크플로 위치.

## 문서 경로

- `docs/dashboard-schema-v1.md`: AI가 생성하고 렌더러가 소비하는 Dashboard JSON 계약을 기록한다.
- `docs/widget-registry.md`: Dashboard Schema에서 사용할 수 있는 위젯 타입, 입력 데이터, 표시 규칙을 기록한다.
- `docs/ai-dashboard-planner.md`: 자연어 요청을 Dashboard Schema로 변환하는 AI 플래너의 책임과 제한을 기록한다.
- `docs/dynamic-view-renderer.md`: 검증된 Dashboard Schema를 화면으로 렌더링하는 프론트엔드 책임과 금지 동작을 기록한다.
- `docs/product-requirements/`: 제품 의도, 사용자 문제, 성공 기준을 기록한다.
- `docs/specs/`: 구현 가능한 행동 요구사항과 완료 기준을 기록한다.
- `docs/specs/frontend-user-flow.md`: 프론트엔드 화면 진입점, 상태 전이, 반응형 흐름을 기록한다.
- `docs/specs/read-only-market-data-provider.md`: 토스증권을 첫 검증 대상으로 하는 읽기 전용 투자처 API provider 확장 범위와 동작 기준을 기록한다.
- `docs/ui/`: Dashboard Schema 계약을 보조하는 화면 구조, 컴포넌트 기준, 디자인 시스템, 반응형 규칙을 기록한다.
- `docs/arch/`: 시스템 구조, 계층 책임, 데이터 흐름, 운영 제약을 기록한다.
- `docs/arch/backend-architecture-slices.md`: FastAPI 백엔드의 API, 서비스, 모델, 작업 경계를 기록한다.
- `docs/adr/`: 되돌리기 어려운 기술 선택과 주요 설계 결정을 기록한다.
- `docs/guidelines/`: 저장소 규칙, 문서 정책, 리뷰 체크리스트를 기록한다.
- `docs/guidelines/mvp-verification-strategy.md`: MVP 기능별 검증 계층, 자동화 우선순위, 수동 검사 한계를 기록한다.
- `docs/guidelines/pr-guidelines.md`: PR 준비, 설명, 리뷰 대응, merge-ready 기준을 기록한다.

## 배치 기준

- 제품의 이유와 범위는 `docs/product-requirements/`에 둔다.
- AI 동적 대시보드 엔진의 핵심 계약은 `docs/` 루트의 `dashboard-schema-v1.md`, `widget-registry.md`, `ai-dashboard-planner.md`, `dynamic-view-renderer.md`에 둔다.
- 사용자가 경험해야 하는 동작과 수용 기준은 `docs/specs/`에 둔다.
- 화면 구성, 정보 위계, UI 컴포넌트, 반응형 보조 기준은 `docs/ui/`에 둔다.
- 서비스 경계, 데이터 흐름, 외부 연동 위치는 `docs/arch/`에 둔다.
- 기술 선택, 보안 기본값, 장기 유지보수에 영향을 주는 결정은 `docs/adr/`에 둔다.
- 문서 운영 규칙과 리뷰 기준은 `docs/guidelines/`에 둔다.
- 실행 코드는 `backend/`와 `frontend/` 아래에 두며, 미구현 MVP 슬라이스도 같은 경계를 따른다.
