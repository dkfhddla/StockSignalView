# Widget Registry

## 목적

Widget Registry는 Dashboard Schema v1에서 사용할 수 있는 위젯 타입과 옵션을 정의한다. AI Dashboard Planner는 이 문서에 등록된 위젯만 사용할 수 있고, Dynamic View Renderer는 등록되지 않은 위젯을 렌더링하지 않는다.

## 기본 원칙

- 위젯은 투자 데이터를 표시하거나 사용자의 회고를 돕는 역할로 제한한다.
- 위젯은 주문 실행, 자동매매, 외부 API 호출을 직접 수행하지 않는다.
- 위젯은 전달받은 데이터와 옵션만 사용한다.
- 데이터가 부족하면 임의 값을 만들지 않고 `미산출` 또는 `데이터 부족` 상태를 표시한다.
- provider 데이터가 연결된 위젯은 각 보유·가격·지수 계산 입력이 보존한 provider명, 데이터 출처, 기준 시각, 마지막 갱신 시각, 데이터 상태와 조회 상태를 숨기지 않는다. 정규화 경계는 이 표시 계약을 충족하도록 각 owner의 `source`를 보존해야 한다.

## MVP 위젯

구현 상태:

- 현재 프론트엔드 렌더러 구현: `position_summary`, `position_table`, `position_cards`.
- 현재 백엔드 스키마 검증 대상: 아래 MVP 위젯 전체.
- `relative_return_chart`, `decision_timeline`, `alert_status_list`는 Dashboard Schema v1에는 등록되어 있지만 시각 렌더링은 후속 구현 범위다.

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

## 데이터 상태 표시

`provider_metadata`가 있는 데이터 요구사항에 연결된 위젯은 provider명, 데이터 출처, 값의 기준 시각, 마지막 갱신 시각과 상태를 별도 메타데이터 영역에 표시한다. 단일 데이터 위젯은 `data_key`, 다중 데이터 위젯은 각 `data_keys[*]`로 해당 요구사항을 찾는다.

Provider 메타데이터가 없는 기존 로컬 `PRESET`과 `USER_SAVED`의 수동·모의 데이터에는 메타데이터 표시를 필수로 요구하지 않고 기존 위젯 상태 계약만 적용한다.

앞 절의 공통 상태는 위젯 렌더링 상태이고, `lookup_results[*].lookup_status`는 provider 조회 상태다. 두 위치에 같은 `PARTIAL` 또는 `UNAVAILABLE` 이름이 있어도 서로 대체해서는 안 된다.

메타데이터 영역은 위젯 옵션이나 투자 데이터 컬럼으로 합치지 않는다. 스냅샷의 `data_status`와 각 `lookup_results[*].lookup_status`를 각각 표시한다.

허용 상태 값과 의미는 `docs/specs/stock-signal-view-data-model.md`의 `PriceSnapshot.data_status`, `MarketIndexSnapshot.data_status`, `ProviderLookupResult.lookup_status`가 소유한다. Widget Registry는 위젯이 owner 상태를 노출해야 하는 조건을 소유하며 상태 자체를 재정의하지 않는다. 표시 라벨과 배지 매핑은 `docs/ui/components.md`를 따른다.

표시 기준:

- `data_status`와 `lookup_results[*].lookup_status`를 하나의 상태로 접어 표시하지 않는다.
- `STALE`, `PARTIAL`, `UNAVAILABLE`, `UNAUTHORIZED`, `FORBIDDEN`, `PROVIDER_ERROR`, `UNSUPPORTED`는 정상 계산값과 같은 시각 위계로 표시하지 않는다.
- 일부 행이나 지표만 사용할 수 없고 나머지를 안전하게 표시할 수 있으면 위젯 렌더링 상태를 `PARTIAL`로, 핵심 데이터를 모두 사용할 수 없으면 `UNAVAILABLE`로 표시한다.
- 각 `lookup_results[*].lookup_status`는 보유 조회에서 같은 레코드의 `lookup_type`과 `target_key`, 가격·지수 조회에서 여기에 `snapshot_role`까지 포함한 조합으로 해당 행이나 계산 입력에 연결한다. 메타데이터 영역에는 내부 `target_key` 대신 안전한 `target_label` 또는 조회 유형 라벨과 필요한 역할 라벨을 표시한다.
- 가격 또는 지수 값의 기준 시각과 시스템의 마지막 갱신 시각을 서로 대체해서 표시하지 않는다.
- 가격·지수 스냅샷 전용 데이터 요구사항이 추가되면 `captured_at`과 `data_status`를 해당 `snapshot_role`의 UI 라벨과 같은 묶음으로 표시한다.
- `ProviderHoldingSnapshot.captured_at`은 가격·지수 기준 시각과 구분하고 provider 기반 보유 수량과 평균 매수가 가까이에 표시한다.
- `data_status`는 `PriceSnapshot`과 `MarketIndexSnapshot`에만 적용한다. 보유 현황은 해당 `ProviderLookupResult.lookup_status`로 조회 가능 여부를 판단한다.
- Provider 기반 평균 매수가는 `cost_basis_source`를 함께 표시하고 라벨은 `docs/ui/components.md`를 따른다.
- 마지막 성공 갱신 시각이 있으면 상태 근처에 함께 표시한다.
- provider 오류 상태의 자격 증명 처리는 `docs/specs/read-only-market-data-provider.md`의 비노출 경계를 따른다.
- AI Dashboard Planner는 provider 기반 산출물에 필요한 출처와 갱신 상태를 제공하거나 보완 응답을 반환한다. 구조 유효성은 `docs/dashboard-schema-v1.md`의 검증 규칙과 백엔드·프런트엔드 validator가 판정하며, 렌더러는 `INVALID_SCHEMA`가 반환되면 위젯을 렌더링하지 않는다.
- AI 요약이나 위젯 제목은 유효한 데이터 출처와 갱신 상태를 가리면 안 된다.

## 추가 기준

새 위젯을 추가하려면 다음 항목을 함께 정의한다.

- 위젯 타입 이름.
- 허용 데이터 타입.
- 필수 옵션과 선택 옵션.
- 데이터 부족 상태 처리.
- provider 메타데이터와 데이터 상태 표시 여부.
- PC/모바일 표시 방식.
- 테스트 기대치.
