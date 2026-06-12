# Dashboard Schema v1

## 목적

Dashboard Schema v1은 StockSignalView의 동적 투자 대시보드를 표현하는 JSON 계약이다. AI Dashboard Planner와 기본 프리셋은 이 스키마를 생성하고, Dynamic View Renderer는 검증된 스키마만 화면에 표시한다.

AI는 화면 코드를 생성하지 않는다. AI는 사용자의 질문과 투자 데이터를 바탕으로 허용된 위젯 조합을 제안하고, 렌더러는 이 계약을 해석한다.

## 기본 원칙

- 스키마는 화면 구성 계약이며 원본 투자 데이터를 대체하지 않는다.
- 위젯 타입은 `docs/widget-registry.md`에 등록된 값만 허용한다.
- 데이터 요구사항은 기존 도메인 모델(`Stock`, `Trade`, `PortfolioPosition`, `AlertRule`)을 참조한다.
- 스키마에 임의 코드, HTML, 스크립트, 외부 URL 호출 정의를 넣을 수 없다.
- 검증 실패 시 렌더러는 대시보드를 표시하지 않고 안전한 오류 상태를 표시한다.

## 최상위 구조

```json
{
  "schema_version": "1.0",
  "dashboard_id": "portfolio-overview",
  "title": "시장 대비 보유 종목 점검",
  "description": "보유 종목의 손익과 상대수익률을 함께 확인한다.",
  "source": "PRESET",
  "layout": {
    "type": "responsive_grid",
    "columns": {
      "desktop": 12,
      "mobile": 1
    }
  },
  "data_requirements": [
    {
      "key": "positions",
      "type": "portfolio_positions",
      "filters": {
        "holding_status": "HELD_OR_WATCHLISTED"
      }
    }
  ],
  "widgets": []
}
```

## 필드

- `schema_version`: 현재는 `1.0`만 허용한다.
- `dashboard_id`: 대시보드 식별자다. 사용자 저장 대시보드 또는 프리셋 식별에 사용한다.
- `title`: 사용자에게 표시할 제목이다.
- `description`: 선택 필드다. 화면 설명 또는 AI 생성 근거 요약에 사용한다.
- `source`: `PRESET`, `AI_PLANNER`, `USER_SAVED` 중 하나다.
- `layout`: 전체 화면 배치 규칙이다.
- `data_requirements`: 위젯이 사용할 데이터 묶음의 요구사항이다.
- `widgets`: 화면에 표시할 위젯 배열이다.

## Widget 구조

```json
{
  "widget_id": "relative-return-table",
  "type": "position_table",
  "title": "상대수익률 순위",
  "data_key": "positions",
  "layout": {
    "desktop_span": 8,
    "mobile_order": 2
  },
  "options": {
    "columns": ["stock_name", "unrealized_profit_loss", "relative_return_rate", "strength_status"],
    "sort": {
      "field": "relative_return_rate",
      "direction": "desc"
    }
  }
}
```

필수 필드:

- `widget_id`: 대시보드 내부 고유 식별자.
- `type`: 위젯 레지스트리에 등록된 타입.
- `title`: 사용자 표시 제목.
- `layout`: 반응형 배치 힌트.
- `options`: 위젯별 표시 옵션.

데이터 연결 필드:

- `data_key`: 단일 데이터 묶음을 쓰는 위젯이 `data_requirements`의 `key` 하나와 연결할 때 사용한다.
- `data_keys`: 여러 데이터 묶음을 함께 써야 하는 위젯이 `data_requirements`의 `key` 배열과 연결할 때 사용한다.
- 위젯은 `data_key` 또는 `data_keys` 중 하나 이상을 가져야 한다.
- 단일 데이터셋만 필요한 위젯은 `data_key`를 기본값으로 사용한다.

## 허용 데이터 타입

- `stocks`: 등록 종목 목록.
- `trades`: 거래 원장.
- `portfolio_positions`: 계산된 포트폴리오 포지션.
- `alert_rules`: 알림 규칙.
- `alert_events`: 알림 평가 이벤트.

## 검증 규칙

- `schema_version`이 지원 버전이 아니면 거부한다.
- `widgets[*].type`이 위젯 레지스트리에 없으면 거부한다.
- `widgets[*]`는 `data_key` 또는 `data_keys` 중 하나 이상을 가져야 한다.
- `widgets[*].data_key`가 있으면 그 값이 `data_requirements[*].key`에 있어야 한다.
- `widgets[*].data_keys[*]`가 있으면 모든 값이 `data_requirements[*].key`에 있어야 한다.
- `widgets[*].data_key`가 가리키는 `data_requirements[*].type`이 해당 위젯 타입의 허용 데이터 타입과 다르면 거부한다.
- `widgets[*].data_keys[*]`가 가리키는 모든 `data_requirements[*].type`이 해당 위젯 타입의 허용 데이터 타입 안에 있어야 한다.
- 위젯 레지스트리가 특정 위젯 타입에 필수 데이터 묶음 전체를 요구하면, `widgets[*].data_keys[*]`는 그 필수 집합을 빠짐없이 포함해야 한다.
- 위젯 옵션에 레지스트리가 허용하지 않은 필드가 있으면 거부한다.
- 문자열은 화면 표시 목적의 평문으로 취급하며 HTML로 해석하지 않는다.
- 외부 URL, 스크립트, 함수 본문, SQL, Python/JavaScript 코드 조각은 허용하지 않는다.

MVP 필터 계약:

- `filters`는 `portfolio_positions` 데이터 요구사항에서만 사용할 수 있다.
- 허용 필터는 `holding_status: "HELD_OR_WATCHLISTED"` 하나다.
- 다른 필터 키, 다른 값, URL, 쿼리, 코드 형태의 필터 정의는 거부한다.

## MVP 기본 프리셋

MVP는 AI API 연결 전에도 다음 프리셋을 Dashboard Schema로 제공해야 한다.

- `portfolio-overview`: 보유 종목 손익, 비중, 상대수익률 요약.
- `relative-strength-review`: 시장 대비 강세/약세 종목 점검.
- `decision-review`: 거래 사유 메모와 성과를 함께 보는 회고 화면.
- `alert-monitor`: 목표 수익률, 손절, 상대수익률 알림 상태 확인.

## 관련 문서

- `docs/widget-registry.md`
- `docs/ai-dashboard-planner.md`
- `docs/dynamic-view-renderer.md`
- `docs/specs/stock-signal-view-data-model.md`
- `docs/specs/stock-signal-view-calculation-rules.md`
