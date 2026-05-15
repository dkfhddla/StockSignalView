# StockSignalView 저장소 지도

이 문서는 저장소의 주요 경로와 책임을 설명한다. 새 파일을 추가할 때는 이 지도를 먼저 확인한다.

## 루트

- `README.md`: 프로젝트 소개, 현재 범위, 주요 문서 링크를 제공하는 진입점.
- `MAP.md`: 저장소 경로별 책임을 설명하는 내비게이션 문서.

## 애플리케이션 경로

- `backend/`: 후속 FastAPI 백엔드 구현 위치.
- `backend/app/api/`: API 라우터 위치.
- `backend/app/core/`: 설정, 보안 기본값, 공통 유틸리티 위치.
- `backend/app/models/`: 데이터 모델 위치.
- `backend/app/schemas/`: 요청/응답 스키마 위치.
- `backend/app/services/`: 포트폴리오, 성과, 알림 서비스 위치.
- `backend/app/jobs/`: 스케줄러와 백그라운드 작업 위치.
- `backend/tests/`: 백엔드 테스트 위치.
- `frontend/`: 후속 React/Vite 프론트엔드 구현 위치.
- `frontend/public/`: 정적 자산 위치.
- `frontend/src/app/`: 앱 셸과 라우팅 위치.
- `frontend/src/components/`: 공통 UI 컴포넌트 위치.
- `frontend/src/features/`: 기능별 화면과 상태 위치.
- `frontend/src/lib/`: API 클라이언트와 공통 라이브러리 위치.
- `frontend/src/styles/`: 전역 스타일 위치.
- `.github/workflows/`: 후속 GitHub Actions 워크플로 위치.

## 문서 경로

- `docs/product-requirements/`: 제품 의도, 사용자 문제, 성공 기준을 기록한다.
- `docs/specs/`: 구현 가능한 행동 요구사항과 완료 기준을 기록한다.
- `docs/arch/`: 시스템 구조, 계층 책임, 데이터 흐름, 운영 제약을 기록한다.
- `docs/adr/`: 되돌리기 어려운 기술 선택과 주요 설계 결정을 기록한다.

## 배치 기준

- 제품의 이유와 범위는 `docs/product-requirements/`에 둔다.
- 사용자가 경험해야 하는 동작과 수용 기준은 `docs/specs/`에 둔다.
- 서비스 경계, 데이터 흐름, 외부 연동 위치는 `docs/arch/`에 둔다.
- 기술 선택, 보안 기본값, 장기 유지보수에 영향을 주는 결정은 `docs/adr/`에 둔다.
- 실행 코드는 후속 구현에서 `backend/`와 `frontend/` 아래에 둔다.
