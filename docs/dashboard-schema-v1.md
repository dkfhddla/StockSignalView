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
  "widgets": [
    {
      "widget_id": "portfolio-summary",
      "type": "position_summary",
      "title": "포트폴리오 요약",
      "data_key": "positions",
      "layout": {
        "desktop_span": 12,
        "mobile_order": 1
      },
      "options": {
        "show_unavailable_count": true,
        "highlight_metric": "relative_return_rate"
      }
    }
  ]
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

## 데이터 메타데이터 계약

Dashboard Schema는 원본 투자 데이터를 담지 않지만, 후속 read-only provider 확장에서는 각 데이터 묶음이 화면에 노출해야 하는 메타데이터 요구사항을 표현할 수 있어야 한다.

현재 MVP 스키마 구현은 이 메타데이터 필드를 아직 허용하지 않는다. Provider 확장의 정확한 JSON 필드 구조는 Dashboard Schema와 백엔드·프런트엔드 validator를 함께 확장하는 변경에서 정의한다. 그 전에는 provider 메타데이터를 현재 스키마에 emit해서는 안 된다. 확장 계약은 각 데이터 묶음의 owner 모델에 존재하고 화면 표시에 필요한 값만 다음 owner 필드명으로 요구해야 하며, 아래 필드를 모든 데이터 묶음에 일괄 요구해서는 안 된다.

- `provider`: 해당 owner 데이터를 공급한 provider 이름.
- `provider_source_id`: `PriceSnapshot` 또는 `MarketIndexSnapshot`의 provider 내부 시세 또는 지수 소스 식별자.
- `source`: 해당 owner 모델에 정의된 수동, 모의, broker API, market API 같은 입력 출처.
- `captured_at`: 해당 owner 값의 기준 시각.
- `refreshed_at`: provider 또는 내부 입력에서 해당 owner 값을 마지막으로 갱신한 시각.
- `data_status`: `PriceSnapshot` 또는 `MarketIndexSnapshot` 값의 사용 가능 상태.
- `snapshot_role`: `PriceSnapshot`, `MarketIndexSnapshot` 또는 가격·지수 `ProviderLookupResult`의 계산 역할.
- `lookup_type`: `ProviderLookupResult`가 가리키는 보유, 가격 또는 시장 지수 조회 유형.
- `target_key`: 조회 상태를 계좌, 종목 또는 시장 대상에 연결하는 owner 식별자.
- `lookup_status`: `ProviderLookupResult`가 보존한 조회 성공 또는 실패 원인.
- `cost_basis_source`: `ProviderHoldingSnapshot` 평균 매수가 또는 원가의 근거.

예를 들어 `provider_source_id`는 가격 또는 지수 스냅샷 데이터 묶음에만 적용한다. `snapshot_role`은 가격·지수 스냅샷과 가격·지수 조회 결과에 적용하며, 기준 시각과 상태를 노출할 때 `CURRENT`, `DAY_BASELINE`, `HOLDING_PERIOD_BASELINE`을 구분한다. 보유 현황 데이터 묶음은 `ProviderHoldingSnapshot`의 `external_account_id`, `raw_provider_symbol`, `raw_market`, `cost_basis_source`처럼 해당 owner 모델에 정의된 필드를 사용한다.

`lookup_type`, `target_key`, `lookup_status`는 하나의 `ProviderLookupResult` 묶음으로 함께 보존하고 검증한다. 가격·지수 조회 결과에는 `snapshot_role`도 같은 묶음에 필수로 포함해 같은 대상의 현재값과 기준값 조회 상태를 구분한다. 보유 조회 결과에는 `snapshot_role`을 포함하지 않는다. 한 데이터 묶음에 여러 조회 결과가 연결되면 각 결과를 독립 레코드로 유지해야 하며, 상태와 대상 식별자를 서로 다른 병렬 배열이나 데이터 묶음 전체의 단일 상태로 축약해서는 안 된다. 조회 결과는 `HOLDINGS`에서 `(lookup_type, target_key)`, 가격·지수에서 `(lookup_type, target_key, snapshot_role)` 조합으로 고유해야 한다. `target_key`는 상태를 올바른 행이나 계산 입력에 연결하기 위한 값이며, 계좌 식별자처럼 사용자에게 직접 표시하면 안 되는 값은 안전한 대상 라벨로 변환한다.

Provider 확장 구현은 `docs/specs/stock-signal-view-data-model.md`가 소유한 `PriceSnapshot.data_status`, `MarketIndexSnapshot.data_status`, `ProviderLookupResult.lookup_status`의 허용 값과 의미를 그대로 참조해야 한다. Dashboard Schema는 이 owner 상태를 다른 이름이나 축약 상태로 재정의하지 않는다.

후속 provider 메타데이터 계약이 Dashboard Schema와 양쪽 validator에 도입되면 Schema는 `data_status`와 `lookup_status`를 별도 필드로 보존하고 검증한다. Widget Registry는 위젯의 상태 노출 조건을 소유하고, `docs/ui/components.md`는 각 상태의 표시 라벨과 배지 매핑을 소유한다.

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
- `data_requirements`와 `widgets`는 각각 하나 이상의 항목을 포함해야 한다.
- `data_requirements[*].key`는 대시보드 안에서 고유해야 한다.
- 후속 provider 메타데이터 요구 필드가 추가되면 허용된 메타데이터 필드만 포함해야 한다.
- 후속 provider 메타데이터 계약이 추가된 뒤 Dashboard Schema JSON에 포함된 메타데이터 필드가 필수 구조나 허용 상태 조합을 충족하지 않으면 스키마를 거부한다.
- `lookup_status`가 있으면 같은 조회 결과에 유효한 `lookup_type`과 `target_key`가 있어야 한다. 가격·지수 결과에는 유효한 `snapshot_role`이 있어야 하고, 보유 결과에는 없어야 하며, 여러 조회 결과의 대상·역할·상태가 서로 뒤섞이면 스키마를 거부한다.
- Schema 검증 뒤 Data Binder가 연결한 provider 응답의 값이나 메타데이터가 없거나 유효하지 않은 경우는 `INVALID_SCHEMA`로 분류하지 않는다. 런타임 데이터 상태 처리는 `docs/dynamic-view-renderer.md`가 소유한다.
- `widgets[*].widget_id`는 대시보드 안에서 고유해야 한다.
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
- `docs/specs/read-only-market-data-provider.md`
- `docs/specs/stock-signal-view-data-model.md`
- `docs/specs/stock-signal-view-calculation-rules.md`
