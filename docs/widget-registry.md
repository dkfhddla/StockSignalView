# Widget Registry

## 목적

Widget Registry는 Dashboard Schema v1에서 사용할 수 있는 위젯 타입과 옵션을 정의한다. AI Dashboard Planner는 이 문서에 등록된 위젯만 사용할 수 있고, Dynamic View Renderer는 등록되지 않은 위젯을 렌더링하지 않는다.

## 기본 원칙

- 위젯은 투자 데이터를 표시하거나 사용자의 회고를 돕는 역할로 제한한다.
- 위젯은 주문 실행, 자동매매, 외부 API 호출을 직접 수행하지 않는다.
- 위젯은 전달받은 데이터와 옵션만 사용한다.
- 데이터가 부족하면 임의 값을 만들지 않고 `미산출` 또는 `데이터 부족` 상태를 표시한다.

## MVP 위젯

### `position_summary`

보유 종목 전체의 핵심 지표를 요약한다.

데이터 타입:

- `portfolio_positions`

표시 항목:

- 전체 평가금액
- 전체 평가손익
- 평균 상대수익률
- 강세/약세 종목 수
- 계산 상태 요약

옵션:

- `show_unavailable_count`: 계산 불가 종목 수 표시 여부.
- `highlight_metric`: 강조 지표. `unrealized_profit_loss`, `relative_return_rate` 중 하나.

### `position_table`

종목별 보유 상태를 표로 표시한다.

데이터 타입:

- `portfolio_positions`

허용 컬럼:

- `stock_name`
- `market`
- `held_quantity`
- `average_cost`
- `market_value`
- `unrealized_profit_loss`
- `realized_profit_loss`
- `position_weight`
- `stock_return_rate`
- `market_return_rate`
- `relative_return_rate`
- `strength_status`
- `calculation_status`

옵션:

- `columns`: 허용 컬럼 배열.
- `sort.field`: 허용 컬럼 중 정렬 필드.
- `sort.direction`: `asc`, `desc`.
- `limit`: 표시 행 수.

### `position_cards`

모바일 또는 좁은 화면에서 종목별 상태를 카드로 표시한다.

데이터 타입:

- `portfolio_positions`

옵션:

- `primary_metric`: `unrealized_profit_loss`, `relative_return_rate`, `stock_return_rate` 중 하나.
- `show_memo_badge`: 관련 거래 메모 존재 여부 표시.
- `filter_strength`: `STRONG`, `WEAK`, `ALL` 중 하나.

### `relative_return_chart`

종목 수익률, 시장 수익률, 상대수익률을 비교 표시한다.

데이터 타입:

- `portfolio_positions`

옵션:

- `chart_type`: `bar`, `ranked_bar` 중 하나.
- `limit`: 표시 종목 수.
- `baseline`: 기본값 `market_return_rate`.

### `decision_timeline`

거래와 판단 사유 메모를 시간축으로 표시한다.

데이터 타입:

- `trades`

옵션:

- `stock_id`: 특정 종목 필터.
- `trade_types`: `BUY`, `SELL` 배열.
- `show_profit_context`: 거래 이후 성과 맥락 표시 여부.

### `alert_status_list`

알림 규칙과 평가 상태를 목록으로 표시한다.

데이터 타입:

- `alert_rules`
- `alert_events`

바인딩 규칙:

- 이 위젯은 각 규칙의 최신 평가 상태를 함께 표시해야 하므로 `alert_rules`와 `alert_events`를 함께 바인딩해야 한다.
- Dashboard Schema v1에서는 이 위젯이 `data_keys`를 사용해 두 데이터 묶음을 동시에 참조한다.

옵션:

- `status_filter`: `TRIGGERED`, `NOT_TRIGGERED`, `UNAVAILABLE`, `ALL` 중 하나.
- `group_by_stock`: 종목별 그룹 표시 여부.

## 공통 상태

모든 위젯은 다음 상태를 처리해야 한다.

- `READY`: 렌더링 가능.
- `PARTIAL`: 일부 데이터 부족.
- `EMPTY`: 표시할 데이터 없음.
- `UNAVAILABLE`: 핵심 데이터 부족.
- `INVALID_SCHEMA`: 스키마 검증 실패.

## 추가 기준

새 위젯을 추가하려면 다음 항목을 함께 정의한다.

- 위젯 타입 이름.
- 허용 데이터 타입.
- 필수 옵션과 선택 옵션.
- 데이터 부족 상태 처리.
- PC/모바일 표시 방식.
- 테스트 기대치.
