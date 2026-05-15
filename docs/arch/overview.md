# StockSignalView 아키텍처 개요

## 초기 구조

StockSignalView는 로컬 PC 또는 NAS에서 시작하는 웹 애플리케이션으로 설계한다. 초기 구조는 React/Vite 프론트엔드, FastAPI 백엔드, SQLite 데이터베이스를 기준으로 한다.

```text
Frontend (React/Vite)
    ↓
Backend API (FastAPI)
    ↓
MVP Service Layer
 ├─ Portfolio
 ├─ Performance
 └─ Alerts
    ↓
Database (SQLite -> PostgreSQL)

Future Extension Services
 ├─ News
 ├─ Disclosures
 ├─ AI Views
 └─ Broker Adapter
```

## 계층별 책임

### Frontend

- 종목, 거래, 포트폴리오, 알림 화면을 제공한다.
- PC에서는 표 중심 화면을 우선한다.
- 모바일에서는 카드형 화면과 터치 조작을 우선한다.
- 후속 AI 동적 뷰에서는 검증된 View Schema를 받아 허용된 컴포넌트만 렌더링한다.

### Backend API

- 프론트엔드가 사용하는 HTTP API를 제공한다.
- 입력 검증과 오류 응답 형식을 책임진다.
- 서비스 계층에 계산과 도메인 처리를 위임한다.

### Service Layer

- `Portfolio`: 보유 수량, 평균 매수가, 평가금액, 손익을 계산한다.
- `Performance`: 종목 수익률, 시장 수익률, 상대수익률을 계산한다.
- `Alerts`: 목표 수익률, 손절, 상대수익률 조건을 평가한다.
- `News`: 후속 뉴스 수집과 저장 책임을 맡는다.
- `Disclosures`: 후속 공시 수집과 분류 책임을 맡는다.
- `AI Views`: 후속 자연어 요청을 View Schema로 변환하는 책임을 맡는다.
- `Broker Adapter`: 후속 증권사 연동을 어댑터 경계 뒤에 둔다.

### Database

- 초기에는 SQLite를 사용한다.
- 배포와 동시성 요구가 커지면 PostgreSQL로 전환할 수 있게 SQLAlchemy와 Alembic 사용을 전제로 한다.

## 핵심 데이터 책임

- `종목`: 프론트엔드가 입력 화면을 제공하고, Backend API가 요청을 검증하며, Service Layer가 등록/수정 규칙을 처리하고, Database가 영속화한다.
- `거래`: 프론트엔드가 매수/매도 입력 흐름을 제공하고, Backend API가 수량/가격/일시를 검증하며, Service Layer가 포트폴리오 계산에 사용할 거래 이벤트로 처리하고, Database가 원장 형태로 저장한다.
- `현재가`: 초기 MVP에서는 수동 입력 또는 모의 데이터로 제공하고, Backend API가 입력 형식을 검증하며, Service Layer가 평가금액과 수익률 계산에 사용한다. 외부 시세 연동 전까지 저장 여부는 단순한 구현으로 결정한다.
- `포트폴리오 계산 결과`: Service Layer가 거래와 현재가를 바탕으로 계산하고, Backend API가 조회 응답으로 제공하며, 프론트엔드가 대시보드에 표시한다. 초기 MVP에서는 필요할 때 계산하고 별도 저장은 후속 판단으로 남긴다.
- `시장 지수 기준값`: 초기 MVP에서는 수동 입력 또는 모의 데이터로 제공하고, Service Layer가 시장 수익률 계산에 사용한다. 후속 실시간/외부 API 연동 전까지 Database 저장 여부는 구현 단계에서 단순한 방식으로 결정한다.
- `알림 규칙`: 프론트엔드가 조건 입력 화면을 제공하고, Backend API가 기준값을 검증하며, `Alerts` 서비스가 조건 평가를 담당하고, Database가 규칙과 평가 로그를 저장한다.

## 데이터 흐름

```text
사용자 입력
-> Frontend
-> Backend API
-> Service Layer
-> Database
-> 계산/조회 결과
-> Frontend Dashboard
```

## 보안과 운영 제약

- API Key는 `.env`에서 관리하고 저장소에 커밋하지 않는다.
- 증권사 주문 기능은 기본값을 `dry_run=true`로 둔다.
- 실제 주문은 명시적 활성화 전까지 금지한다.
- 주문 시도, 알림 발송, 외부 데이터 수집은 로그 대상이다.
- AI 동적 뷰는 직접 코드 실행이 아니라 검증 가능한 View Schema 렌더링으로 제한한다.

## MVP와 후속 확장

MVP는 종목 관리, 거래 기록, 포트폴리오 계산, 상대수익률 계산, 기본 대시보드, 기본 알림에 집중한다. 뉴스, 공시, AI 동적 뷰, 실시간 시세, 브로커 연동은 같은 경계 안에서 후속 단계로 추가한다.
