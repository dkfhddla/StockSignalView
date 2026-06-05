# StockSignalView 백엔드 아키텍처 슬라이스

## 목적

이 문서는 StockSignalView 백엔드가 FastAPI 기준으로 어떤 레이어와 슬라이스로
구성되어야 하는지 정의한다.

`docs/arch/overview.md`가 전체 시스템 구조를 설명한다면, 본 문서는
`backend/app/` 아래에서 실제 구현이 어떤 책임 경계로 나뉘어야 하는지를
설명한다.

## 범위

- `backend/app/api/`
- `backend/app/core/`
- `backend/app/models/`
- `backend/app/schemas/`
- `backend/app/services/`
- `backend/app/jobs/`

## 비범위

- 프론트엔드 렌더링 방식
- Dashboard Schema JSON 상세 계약
- 외부 뉴스/공시/브로커 후속 구현 세부
- 데이터베이스 마이그레이션 스크립트 상세

## 레이어 구조

```text
API Routers
-> Request/Response Schemas
-> Application Services
-> Domain Calculators / Evaluators
-> Persistence Models
-> Database
```

```text
AI Dashboard Request
-> API Router
-> Planner Or Preset Service
-> Dashboard Schema Validator
-> Response Schema
```

## 디렉터리별 책임

### `backend/app/api/`

- HTTP 라우터와 엔드포인트를 둔다.
- 인증이 생기기 전에도 요청 진입점과 응답 형식을 일관되게 유지한다.
- 요청을 직접 계산하지 않고 서비스 계층으로 위임한다.
- 에러를 HTTP 상태 코드와 저장소 표준 응답 형식으로 변환한다.

예상 하위 슬라이스:

- `stocks`
- `trades`
- `portfolio`
- `alerts`
- `dashboards`

### `backend/app/core/`

- 설정 로딩, 환경 변수, 공통 예외, 공통 로깅 규칙을 둔다.
- `.env` 기반 설정과 보안 기본값을 소유한다.
- 다른 레이어가 반복 구현하면 안 되는 공통 유틸리티만 둔다.

### `backend/app/models/`

- 영속화 모델과 내부 도메인 모델을 둔다.
- `Trade`, `Stock`, `PriceSnapshot`, `MarketIndexSnapshot`, `AlertRule`,
  `AlertEvent` 같은 핵심 엔티티를 표현한다.
- 계산 결과를 위한 파생 구조가 필요하더라도 원장 데이터 소유권은 유지한다.

### `backend/app/schemas/`

- API 요청/응답 스키마를 둔다.
- 입력 유효성 규칙과 직렬화 형식을 소유한다.
- 프론트엔드가 기대하는 응답 형태와 백엔드 내부 모델을 바로 결합하지 않도록
  경계를 둔다.

### `backend/app/services/`

- 제품 규칙과 계산 규칙의 실제 실행 책임을 둔다.
- API 라우터는 이 계층을 호출하고, 이 계층이 모델과 저장소를 조합한다.
- 포트폴리오 계산, 상대수익률 계산, 알림 평가, Dashboard Schema 생성/검증
  같은 동작이 여기에 들어간다.

### `backend/app/jobs/`

- 예약 평가, 후속 동기화, 알림 재평가 같은 백그라운드 작업을 둔다.
- MVP에서는 비어 있을 수 있지만, 알림 재평가나 외부 입력 동기화의 확장 지점으로
  남긴다.

## 서비스 슬라이스

### SVC-001 Stocks

- 종목 등록, 수정, 조회, 관심 종목 여부 변경을 처리한다.
- 동일 종목 중복 등록 정책과 시장 구분 유효성 확인을 수행한다.

### SVC-002 Trades

- 거래 원장 생성, 수정, 삭제를 처리한다.
- 매수/매도 유효성, 수량/가격/세금/수수료 규칙을 적용한다.
- 거래 변경 후 어떤 계산을 다시 수행해야 하는지 결정한다.

### SVC-003 Portfolio

- 보유 수량, 평균 매수가, 평가금액, 평가손익, 실현손익, 비중을 계산한다.
- 원가 기준은 MVP에서 이동평균법으로 고정한다.
- 계산 결과는 조회용 파생 값이며 원장 데이터를 대체하지 않는다.

### SVC-004 Performance

- 종목 수익률, 시장 수익률, 상대수익률을 계산한다.
- 기준일, 기준가, 시장 지수 매핑 규칙을 적용한다.
- 입력이 부족하면 `PARTIAL` 또는 `UNAVAILABLE` 상태를 돌려준다.

### SVC-005 Alerts

- 목표 수익률, 손절, 상대수익률 규칙을 평가한다.
- 평가 결과를 `TRIGGERED`, `NOT_TRIGGERED`, `UNAVAILABLE` 상태로 만든다.
- 앱 내부 표시용 이벤트 로그 생성을 담당한다.

### SVC-006 Dashboards

- 기본 프리셋 Dashboard Schema를 제공한다.
- 사용자 질문이 없을 때도 기본 대시보드를 같은 경로로 구성할 수 있게 한다.
- 위젯 데이터 요구사항과 실제 조회 데이터를 연결한다.

### SVC-007 AI Planner

- 자연어 질문을 Dashboard Schema 초안으로 변환한다.
- 실제 LLM 연결 전에는 프리셋 또는 규칙 기반 생성기로도 같은 출력 계약을
  검증할 수 있어야 한다.
- 허용되지 않은 위젯이나 필드는 생성하지 않아야 한다.

### SVC-008 Schema Validation

- Dashboard Schema가 `docs/dashboard-schema-v1.md`와
  `docs/widget-registry.md` 계약을 만족하는지 검증한다.
- 검증 실패 시 렌더링 가능한 결과로 가장하지 않고 명시적 실패를 돌려준다.

## 권장 호출 규칙

- `api`는 `services`를 호출할 수 있다.
- `services`는 `models`, `schemas`, `core`를 사용할 수 있다.
- `services`는 다른 서비스 호출이 가능하지만 순환 의존은 만들지 않는다.
- `models`는 `api`를 알면 안 된다.
- `schemas`는 HTTP 입출력 계약을 소유하지만 계산 로직을 포함하면 안 된다.
- `jobs`는 `services`를 호출할 수 있지만, 반대로 `services`가 `jobs`를 직접
  호출하면 안 된다.

## 금지 규칙

- API 라우터에서 포트폴리오 계산 수식을 직접 구현
- 스키마 검증 없이 Dashboard Schema를 응답으로 반환
- 프론트엔드 전용 표시 문자열을 모델 계층에 고정
- 거래 원장 수정 없이 계산 결과만 덮어써 상태를 맞추는 방식
- 서비스 간 순환 호출

## MVP 엔드포인트 대응

### 종목

- `POST /stocks`
- `GET /stocks`
- `PATCH /stocks/{stock_id}`
- `DELETE /stocks/{stock_id}`

주요 경로:

`api/stocks` -> `services/stocks` -> `models/stock`

### 거래

- `POST /trades`
- `PATCH /trades/{trade_id}`
- `DELETE /trades/{trade_id}`

주요 경로:

`api/trades` -> `services/trades` -> `services/portfolio`

### 포트폴리오 / 성과

- `GET /portfolio/positions`
- `GET /portfolio/relative-returns`

주요 경로:

`api/portfolio` -> `services/portfolio` -> `services/performance`

### 알림

- `POST /alerts/rules`
- `GET /alerts/rules`
- `GET /alerts/events`

주요 경로:

`api/alerts` -> `services/alerts`

### 대시보드

- `GET /dashboards/default`
- `POST /dashboards/plan`

주요 경로:

`api/dashboards` -> `services/dashboards` / `services/ai_planner`
-> `services/schema_validation`

## 프론트엔드 연결 기준

- 프론트엔드는 `frontend/src/lib/`에서 API 클라이언트를 통해서만 백엔드와
  통신한다.
- 프론트엔드는 계산 규칙을 복제하지 않고, 백엔드가 반환한 상태 값과 오류
  상태를 화면 규칙에 맞게 표시한다.
- Dashboard Schema는 백엔드가 생성 또는 검증한 뒤 전달하는 것을 기본 경로로
  한다.

## 확장 경계

- 뉴스/공시 입력은 별도 서비스 슬라이스로 추가하되 `Trades`, `Portfolio`,
  `Dashboards`의 핵심 경로를 직접 오염시키지 않는다.
- 브로커 연동은 별도 어댑터 경계 뒤에 둔다.
- PostgreSQL 전환 시에도 `api -> services -> models` 경계는 유지한다.

## 계약 기준

- `docs/arch/overview.md`: 전체 시스템 구조와 상위 데이터 흐름
- `docs/specs/mvp-foundation.md`: MVP 계산, 렌더링, 알림 요구사항
- `docs/specs/stock-signal-view-data-model.md`: 핵심 엔티티와 입력 경계
- `docs/specs/stock-signal-view-calculation-rules.md`: 계산 세부 규칙
- `docs/specs/frontend-user-flow.md`: 화면 흐름과 API 소비 맥락
- `docs/dashboard-schema-v1.md`: 동적 대시보드 JSON 계약
- `docs/widget-registry.md`: 허용 위젯과 데이터 요구사항
- `docs/ai-dashboard-planner.md`: 질문 입력과 Planner 출력 제한

## 수용 기준

- [ ] 각 API 엔드포인트가 직접 계산 로직을 소유하지 않는다.
- [ ] 거래 변경과 포트폴리오/성과 재계산 책임이 서비스 계층에 모인다.
- [ ] Dashboard Schema 생성과 검증이 별도 서비스 책임으로 분리된다.
- [ ] 프론트엔드가 기대하는 상태 값(`PARTIAL`, `UNAVAILABLE`, `TRIGGERED`)이
      백엔드 슬라이스에서 일관되게 생산된다.
- [ ] 후속 확장(뉴스/공시/브로커)이 MVP 계산 경계를 깨지 않고 추가 가능하다.
