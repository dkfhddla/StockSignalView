# 읽기 전용 시장 데이터 Provider 사양

## 목적 및 문제

StockSignalView의 초기 MVP는 외부 API 없이 수동 입력 또는 모의 데이터로 거래, 포트폴리오 계산, 상대수익률, Dashboard Schema 렌더링 흐름을 검증한다.

이 문서는 그 다음 확장으로, 개인 투자자가 사용하는 투자처 API를 읽기 전용 provider로 연결해 현재가, 보유 종목, KOSPI/KOSDAQ 지수, 데이터 출처와 갱신 시각을 같은 대시보드 흐름에 공급하는 행동 기준을 정의한다.

첫 검증 provider는 토스증권 API로 둔다. 단, 본 사양의 제품 경계는 토스증권 전용 앱이 아니라 여러 투자처 provider가 공통 내부 모델과 Dashboard Schema 흐름에 연결될 수 있는 읽기 전용 연동이다.

## 범위

본 사양은 다음 동작을 포함한다.

- 현재가 조회
- 당일 상대성과 계산에 필요한 당일 기준 종목 가격과 기준 시각 조회
- 보유 종목 목록 조회
- KOSPI 지수 조회
- KOSDAQ 지수 조회
- 당일 상대성과 계산에 필요한 당일 기준 KOSPI/KOSDAQ 지수와 기준 시각 조회
- provider명, 데이터 출처, 마지막 갱신 시각 표시
- provider 오류, 인증 실패, 데이터 지연 상태 표시
- 공통 내부 모델로 정규화한 뒤 상대성과 계산과 Dashboard Schema 렌더링에 전달

## 비목표

- 주문 실행
- dry-run 주문
- 자동매매
- 투자 추천 자동 실행
- 출처 없는 AI 투자 요약
- AI가 provider API를 직접 호출하거나 임의 쿼리/코드를 생성해 실행하는 방식
- 프론트엔드에 사용자 API 키 또는 인증 토큰을 노출하는 방식

## 요구사항

### RMP-001 Provider 등록 경계

시스템은 시장 데이터 접근을 provider adapter 경계 뒤에 둔다. 계산 서비스, Dashboard Schema 생성, 프론트엔드 렌더러는 특정 투자처 원본 응답 구조에 직접 의존하지 않아야 한다.

첫 provider는 토스증권 API로 검증할 수 있다. 이후 provider는 같은 읽기 전용 계약을 만족해야 한다.

### RMP-002 보유 종목 조회

provider는 사용자의 보유 종목 목록을 조회하고, 종목 코드, 종목명, 시장 구분, 보유 수량, 평균 매수가 또는 계산 가능한 원가 근거를 `docs/specs/stock-signal-view-data-model.md`의 `ProviderHoldingSnapshot`으로 정규화해야 한다.

정규화 결과는 provider 원본 응답을 화면이나 계산 서비스에 직접 넘기지 않고 `ProviderHoldingSnapshot`의 owner 용어를 사용해야 한다. 최소한 `provider`, `source`, `external_account_id`, `provider_account_name`, `raw_provider_symbol`, `raw_provider_name`, `raw_market`, `held_quantity`, `average_cost`, `cost_basis_source`, `captured_at`, `refreshed_at`를 보존하고, 내부 `Stock`으로 매핑된 경우에만 `stock_id`를 채운다. provider 원본 종목을 매핑할 수 없으면 provider-only 보유 현황으로 보존한다. 로컬 `Stock`이 없다는 이유만으로 보유 현황을 drop하거나 임의 종목으로 합치면 안 된다. 보유 조회의 인증 실패, 권한 없음, provider 오류, 데이터 지연 같은 상태는 `ProviderHoldingSnapshot` 필드로 위조하지 않고 반드시 `ProviderLookupResult.lookup_status`로 보유 현황 snapshot과 함께 전달한다.

보유 조회 자체의 상태는 `ProviderHoldingSnapshot`에 임의 필드로 넣지 않고 `ProviderLookupResult`의 `lookup_status`로 전달해야 한다. `PARTIAL`, `UNAUTHORIZED`, `FORBIDDEN`, `PROVIDER_ERROR`, `UNSUPPORTED`, `STALE`, `UNAVAILABLE`은 서로 구분되어야 하며, 대시보드 입력과 테스트는 이 상태를 보유 현황 snapshot과 함께 추적할 수 있어야 한다.

provider 보유 현황은 현재 보유 상태 입력이며, 개별 매수/매도 거래 원장인 `Trade`를 대체하지 않는다. provider가 체결 내역 없이 보유 수량과 평균 매수가만 제공하면 시스템은 이를 가짜 거래로 변환하지 않고, 거래 원장이 필요한 기능은 `UNAVAILABLE` 또는 `미산출` 상태로 둔다.

provider가 보유 종목 목록을 제공하지 못하면 시스템은 권한 없음, 인증 실패, provider 미지원, 일시 오류 중 하나로 구분 가능한 상태를 반환해야 한다.

보유 기간 상대성과를 계산하려면 현재 보유 기간의 첫 매수일, 첫 매수 기준가 또는 거래 원장에서 이를 재계산할 수 있는 입력, 그리고 같은 기준일의 시장 지수가 필요하다. provider 또는 내부 거래 원장이 이 기준 입력을 제공하지 못하면 보유 기간 상대성과는 임의로 추정하지 않고 `UNAVAILABLE` 또는 `미산출` 상태로 반환해야 한다.

### RMP-003 현재가 조회

provider는 보유 또는 관심 종목의 현재가를 조회할 수 있어야 한다.

현재가는 값만 전달하지 않고 `docs/specs/stock-signal-view-data-model.md`의 `PriceSnapshot`으로 정규화해야 한다. 스냅샷은 `provider`, `source`, `provider_source_id`, `provider_symbol`, `provider_market`, 가격 값, 가격 기준 시각인 `captured_at`, provider에서 가져온 마지막 갱신 시각인 `refreshed_at`, `data_status`, `snapshot_role`을 함께 보존해야 한다. 현재 평가에 쓰는 가격, 당일 기준 가격, 보유기간 기준 가격은 같은 숫자 필드로 섞지 않고 `snapshot_role`로 역할을 구분한다. 현재가가 없거나 지연되면 계산 서비스는 해당 상태를 `미산출`, `지연`, `오류` 중 이해 가능한 상태로 전달하고, 대시보드는 Dashboard Schema의 `provider_metadata`와 Widget Registry 표시 계약을 사용한다.

provider-only unmapped 보유 종목의 현재가는 내부 `Stock`이 없어도 `provider`, `provider_symbol`, `provider_market`으로 `ProviderHoldingSnapshot.raw_provider_symbol`, `raw_market`에 연결할 수 있어야 한다. 이 연결은 내부 종목 자동 생성이나 임의 병합을 의미하지 않는다.

가격 조회의 조회 성공은 `ProviderLookupResult.lookup_status=AVAILABLE`로, 인증 실패, 권한 없음, provider 오류, 미지원, 지연 상태는 `PriceSnapshot.data_status`만으로 접지 않고 `ProviderLookupResult.lookup_status`에 보존해야 한다. provider-only 가격 조회 결과는 `provider_market`과 `provider_symbol`을 함께 포함한 충돌 없는 `target_key`를 사용해야 한다. 가격 조회 결과는 같은 종목의 현재가와 기준가 실패를 구분하도록 해당 `snapshot_role`을 함께 보존한다. snapshot을 만들 수 없는 실패도 조회 결과 envelope로 전달한다.

당일 상대성과를 계산하려면 현재가뿐 아니라 당일 기준 종목 가격(예: 전일 종가 또는 당일 장 시작 기준가), 현재 시장 지수, 당일 기준 시장 지수, 각 값의 기준 시각이 필요하다. provider 또는 내부 가격 스냅샷이 이 기준 입력을 제공하지 못하면 당일 상대성과는 임의로 추정하지 않고 `UNAVAILABLE` 또는 `미산출` 상태로 반환해야 한다.

### RMP-004 KOSPI/KOSDAQ 지수 조회

provider 또는 시장 데이터 소스는 KOSPI와 KOSDAQ 지수 값을 조회할 수 있어야 한다.

지수 값은 `docs/specs/stock-signal-view-data-model.md`의 `MarketIndexSnapshot`으로 정규화해야 한다. 스냅샷은 `provider`, `source`, `provider_source_id`, 지수 식별자, 지수 값, 지수 기준 시각인 `captured_at`, provider에서 가져온 마지막 갱신 시각인 `refreshed_at`, `data_status`, `snapshot_role`을 함께 보존해야 한다. 현재 시장 지수, 당일 기준 시장 지수, 보유기간 기준 시장 지수는 `snapshot_role`로 역할을 구분하고 서로 덮어쓰지 않는다.

KOSPI 종목은 KOSPI 지수, KOSDAQ 종목은 KOSDAQ 지수를 기본 비교 기준으로 사용한다. 기준 지수 또는 현재 지수가 없으면 시장 수익률과 상대성과는 계산하지 않는다.

지수 조회의 조회 성공은 `ProviderLookupResult.lookup_status=AVAILABLE`로, 인증 실패, 권한 없음, provider 오류, 미지원, 지연 상태는 `MarketIndexSnapshot.data_status`만으로 접지 않고 `ProviderLookupResult.lookup_status`에 보존해야 한다. 지수 조회 결과는 같은 시장의 현재 지수와 기준 지수 실패를 구분하도록 해당 `snapshot_role`을 함께 보존한다. snapshot을 만들 수 없는 실패도 조회 결과 envelope로 전달한다.

### RMP-005 상대성과 계산 연결

정규화된 provider 데이터는 `docs/specs/stock-signal-view-calculation-rules.md`의 계산 규칙을 따른다.

평균단가 기준 현재 수익률은 `average_cost_current_return_rate`로 표현하며, provider 보유 현황의 `average_cost`와 현재 역할의 `PriceSnapshot`을 사용한다. 이 값은 당일 상대성과나 보유기간 상대성과를 대체하지 않는다.

평균단가 기준 현재 수익률은 양수 보유 수량, 양수 `average_cost`, 현재 역할의 사용 가능한 현재가가 있을 때만 계산한다. `average_cost`가 없거나 0 이하이면 0으로 대체하거나 무한대 수익률을 만들지 않고 `UNAVAILABLE` 또는 `미산출` 상태를 전달한다.

당일 상대성과는 `daily_stock_return_rate`, `daily_market_return_rate`, `daily_relative_return_rate` triplet으로 표현한다. `daily_relative_return_rate`는 종목 당일 수익률에서 같은 시장의 당일 지수 수익률을 뺀 값이다.

보유기간 상대성과는 `holding_period_stock_return_rate`, `holding_period_market_return_rate`, `holding_period_relative_return_rate` triplet으로 표현한다. `holding_period_relative_return_rate`는 보유기간 종목 수익률에서 같은 기간의 시장 수익률을 뺀 값이다. 기존 Dashboard Schema 호환 필드인 `stock_return_rate`, `market_return_rate`, `relative_return_rate`의 기본 의미는 보유기간 triplet과 같다.

당일 상대성과는 당일 기준 종목 가격과 당일 기준 시장 지수를 확보한 경우에만 계산한다. 기준 입력은 같은 기준 시각 정책을 사용해야 하며, provider가 서로 다른 기준 시각의 값을 섞어 반환하면 계산 서비스는 해당 지표를 `UNAVAILABLE` 또는 `미산출`로 처리한다.

보유 기간 상대성과는 현재 보유 기간의 첫 매수일/기준가와 해당 기준일 시장 지수를 확보한 경우에만 계산한다. 기준 입력이 없으면 계산 서비스는 provider 현재가만으로 기간 기준값을 만들지 않고 `UNAVAILABLE` 또는 `미산출` 상태를 전달한다.

계산 서비스는 `average_cost_current_return_rate`, `daily_*` triplet, `holding_period_*` triplet을 서로 다른 계산 기준으로 보존해야 한다. 한 기준의 결과가 다른 기준의 필드를 overwrite하면 안 된다.

### RMP-006 Dashboard Schema 및 렌더링 경계

provider 데이터는 검증 가능한 Dashboard Schema와 허용된 위젯을 통해서만 화면에 표시되어야 한다.

인증 실패, 권한 없음, provider 오류, 데이터 지연의 원인은 `ProviderLookupResult.lookup_status`로 계산 결과와 대시보드 입력까지 보존한다. Dashboard Schema는 데이터 요구사항의 `provider_metadata.status.lookup_results[*].lookup_status`로 이 값을 대상·역할별로 전달하고, Widget Registry는 연결된 위젯 가까이에 별도 상태 배지로 표시한다.

이번 metadata 계약은 기존 허용 위젯과 계산 컬럼을 바꾸지 않는다. `average_cost_current_return_rate`, `daily_*`, `holding_period_*`, `snapshot_role`을 새 위젯 column이나 option으로 표시하려면 Dashboard Schema, Widget Registry, 백엔드·프런트엔드 validator를 별도로 함께 확장해야 한다.

provider명, 데이터 출처, 가격 기준 시각, 마지막 갱신 시각, 데이터 상태, `ProviderLookupResult.lookup_status`를 Dashboard Schema와 Widget Registry에 노출하는 정확한 계약은 `docs/dashboard-schema-v1.md`와 `docs/widget-registry.md`가 소유한다. 본 사양은 해당 메타데이터와 조회 실패 원인이 계산 결과와 대시보드 입력까지 보존되어야 한다는 요구를 소유한다.

Provider metadata는 `data_requirements[*].provider_metadata`로만 전달한다. provider-derived fields, `average_cost_current_return_rate`, `daily_*`, `holding_period_*`, `snapshot_role`을 검증되지 않은 widget column, option 또는 data requirement 필드로 emit해서는 안 된다.

### RMP-007 출처 없는 AI 요약 금지

AI는 provider 데이터나 계산 결과를 바탕으로 Dashboard Schema를 제안할 수 있지만, 출처 없는 투자 요약이나 확인 불가능한 판단을 생성해서는 안 된다.

AI 출력은 허용된 Dashboard Schema와 위젯 레지스트리 계약을 통과해야 하며, 데이터 출처와 갱신 시각을 숨기면 안 된다.

## 동작 시나리오

### S-RMP-001 현재가 기반 보유 종목 확인

사용자가 대시보드를 연다. 시스템은 등록된 읽기 전용 provider에서 보유 종목과 현재가를 조회하고, 평균 매수가 대비 현재 수익률을 계산한 뒤 대시보드에 표시한다.

데이터 출처와 마지막 갱신 시각은 화면에서 확인 가능해야 한다.

### S-RMP-002 시장 대비 당일 상대성과 확인

시스템은 보유 종목의 시장 구분에 따라 KOSPI 또는 KOSDAQ 지수를 조회한다. 종목 당일 수익률과 시장 당일 수익률을 같은 기준으로 비교해 당일 상대성과를 표시한다.

지수 데이터가 없으면 상대성과는 `미산출` 상태가 되어야 하며 0으로 대체하지 않는다.

### S-RMP-003 provider 인증 실패

provider 인증이 실패하면 시스템은 사용자 API 자격 증명이나 내부 토큰을 노출하지 않고 `ProviderLookupResult.lookup_status`로 오류 상태를 반환한다.

대시보드는 마지막 성공 갱신 시각이 있으면 상태와 함께 표시하고, 현재 데이터가 최신이 아님을 사용자가 이해할 수 있게 보여준다.

## 계약 기준

- `docs/product-requirements/stock-signal-view.md`: 읽기 전용 투자처 API 연동의 제품 의도
- `docs/specs/mvp-foundation.md`: 외부 API 없는 MVP 범위와 기존 상대수익률/대시보드 기준
- `docs/specs/stock-signal-view-calculation-rules.md`: 수익률과 상대수익률 계산 규칙
- `docs/dashboard-schema-v1.md`: 동적 대시보드 JSON 계약
- `docs/widget-registry.md`: 허용 위젯과 입력 데이터 계약
- `docs/dynamic-view-renderer.md`: 검증 렌더러 책임과 금지 동작
- `docs/arch/backend-architecture-slices.md`: provider adapter와 백엔드 서비스 경계

## 수용 기준

- [ ] 토스증권 API는 첫 read-only provider 검증 대상으로 문서화되어 있다.
- [ ] provider adapter는 보유 종목을 `ProviderHoldingSnapshot`, 현재가와 종목 기준가를 `PriceSnapshot`, KOSPI/KOSDAQ 지수를 `MarketIndexSnapshot` owner 용어로 정규화한다.
- [ ] provider 조회 상태는 `ProviderLookupResult.lookup_status`로 보존하며 `AVAILABLE`, `PARTIAL`, `UNAUTHORIZED`, `FORBIDDEN`, `PROVIDER_ERROR`, `UNSUPPORTED`, `STALE`, `UNAVAILABLE`을 구분한다.
- [ ] provider 가격/지수 결과는 provider명, provider source id 또는 원본 출처, 기준 시각(`captured_at`), 마지막 갱신 시각(`refreshed_at`), 데이터 상태(`data_status`), 스냅샷 역할(`snapshot_role`)을 필수 메타데이터로 포함하고, 실패 원인은 같은 `target_key`의 역할별 결과를 구분할 수 있도록 `snapshot_role`을 포함한 `ProviderLookupResult`에 보존한다.
- [ ] provider 보유 조회 결과는 provider명, 계좌 식별자, 원본 종목 정보, 기준 시각(`captured_at`), 마지막 갱신 시각(`refreshed_at`), `ProviderLookupResult.lookup_status`와 계산 결과의 계산 가능 여부를 보존하되 `ProviderHoldingSnapshot`에 없는 필드를 임의로 추가하지 않는다.
- [ ] provider 보유 종목의 원본 심볼/종목명/시장 구분은 내부 `Stock`으로 매핑되거나, 매핑 불가 시 provider-only unmapped 상태로 보존되며 임의 drop 또는 자동 병합되지 않는다.
- [ ] provider-only unmapped 보유 종목의 가격은 내부 `Stock` 없이도 `provider`, `provider_symbol`, `provider_market`으로 원본 보유 종목에 연결될 수 있으며, 이 연결은 자동 upsert나 병합을 의미하지 않는다.
- [ ] 인증 실패, 권한 없음, provider 오류, 데이터 지연 상태가 `ProviderLookupResult.lookup_status`로 계산 결과와 대시보드 입력에 구분되어 보존되며, Dashboard Schema와 Widget Registry 계약에 따라 표시된다.
- [ ] 평균단가 기준 현재 수익률(`average_cost_current_return_rate`), 당일 triplet(`daily_stock_return_rate`, `daily_market_return_rate`, `daily_relative_return_rate`), 보유기간 triplet(`holding_period_stock_return_rate`, `holding_period_market_return_rate`, `holding_period_relative_return_rate`)은 서로 다른 계산 기준으로 보존된다.
- [ ] 평균단가 기준 현재 수익률은 양수 보유 수량, 양수 평균단가 또는 보유 원가, 현재가가 있을 때만 계산되며 평균단가가 없거나 0 이하이면 `UNAVAILABLE` 또는 `미산출` 상태가 된다.
- [ ] 당일 상대성과 기준 입력(당일 기준 종목 가격, 당일 기준 시장 지수, 현재가, 현재 시장 지수, 각 기준 시각)이 없으면 해당 지표는 계산되지 않고 `UNAVAILABLE` 또는 `미산출` 상태가 된다.
- [ ] 보유 기간 상대성과 기준 입력(첫 매수일, 첫 매수 기준가 또는 거래 원장, 기준일 시장 지수)이 없으면 해당 지표는 계산되지 않고 `UNAVAILABLE` 또는 `미산출` 상태가 된다.
- [ ] 당일 상대성과와 보유 기간 상대성과는 `docs/specs/stock-signal-view-calculation-rules.md`의 산식을 따른다.
- [ ] 대시보드 입력 데이터는 출처와 갱신 시각 메타데이터를 잃지 않으며 `data_requirements[*].provider_metadata`로 전달된다.
- [ ] provider-derived fields는 schema validation을 우회하거나 허용되지 않은 widget column, option, data requirement 필드로 emit되지 않는다.
- [ ] 주문 실행, dry-run 주문, 자동매매는 구현되지 않는다.
- [ ] 출처 없는 AI 요약은 생성 또는 렌더링되지 않는다.

## 검증 기대치

- `backend/tests`: fake provider로 보유 종목이 `ProviderHoldingSnapshot`, 현재가와 종목 기준가가 `PriceSnapshot`, KOSPI/KOSDAQ 지수가 `MarketIndexSnapshot` owner 용어로 정규화되는지 테스트를 추가한다.
- `backend/tests`: provider metadata, `captured_at`, `refreshed_at`, 가격/지수의 `data_status`와 `snapshot_role`, `ProviderLookupResult.lookup_status`, provider 원본 종목의 `Stock` 매핑/미매핑 보존 동작이 정규화 결과에 포함되는지 검증한다.
- `backend/tests`: 인증 실패, 권한 없음, 데이터 지연, provider 오류 상태가 서로 구분 가능한 `ProviderLookupResult`로 안전하게 전파되는지 검증한다.
- `backend/tests`: provider-only unmapped 보유 종목이 `provider`, `provider_symbol`, `provider_market`으로 가격 snapshot에 연결되고 내부 `Stock` 자동 upsert 없이 보존되는지 검증한다.
- `backend/tests`: 평균단가가 없거나 0 이하인 provider-only 보유 현황은 평균단가 기준 현재 수익률을 계산하지 않고 `UNAVAILABLE` 또는 `미산출` 상태를 반환하는지 검증한다.
- `backend/tests`: provider 데이터와 거래 원장 또는 기준 입력으로 평균단가 기준 현재 수익률, 당일 triplet, 보유기간 triplet이 계산 규칙과 일치하며 서로 overwrite되지 않는지 검증한다.
- `backend/tests`: 당일 상대성과 기준 입력이 없거나 기준 시각 정책이 맞지 않을 때 provider 현재가만으로 값을 추정하지 않고 `UNAVAILABLE` 또는 `미산출` 상태를 반환하는지 검증한다.
- `backend/tests`: 보유 기간 상대성과 기준 입력이 없을 때 provider 현재가만으로 값을 추정하지 않고 `UNAVAILABLE` 또는 `미산출` 상태를 반환하는지 검증한다.
- `backend/tests` 또는 계약 테스트: 허용되지 않은 provider-derived fields가 schema validation을 우회하거나 widget column, option, data requirement 필드로 emit되지 않는지 검증한다.
- `frontend`: provider명, 기준 시각, 마지막 갱신 시각, `data_status`의 `STALE`/`UNAVAILABLE`과 `lookup_status`의 `PARTIAL`/`STALE`/`UNAVAILABLE`/`UNAUTHORIZED`/`FORBIDDEN`/`PROVIDER_ERROR`/`UNSUPPORTED` 상태가 독립적으로 표시되고 복합 상태에서 서로를 숨기지 않는지 검증한다.
- `frontend`: 유효하지 않은 Dashboard Schema 또는 출처 없는 AI 요약이 렌더링되지 않는지 검증한다.
- 문서 리뷰: 기존 외부 API 없는 MVP 범위와 read-only provider 확장 범위가 충돌하지 않는지 확인한다.

## 근거 포인터

- `docs/product-requirements/stock-signal-view.md`: REQ-SSV-003, REQ-SSV-004, REQ-SSV-005, REQ-SSV-010 - accepted
- `docs/specs/mvp-foundation.md`: 외부 API 없는 MVP와 상대수익률 계산 기준 - accepted
- `docs/specs/stock-signal-view-calculation-rules.md`: 계산 산식과 `미산출` 상태 기준 - accepted
- GitHub Issues `#19`-`#24`: read-only provider 확장 이슈 분해 - proposed

## 에이전트 컨텍스트

- 이 사양은 기존 MVP를 대체하지 않고, 외부 API 없는 MVP 이후의 read-only provider 확장 범위를 소유한다.
- 토스증권 API의 공식 사용 가능 여부, 인증 방식, 약관, 호출 제한은 구현 전에 확인해야 한다.
- provider 자격 증명은 서버 측 보안 경계에서만 다루며 프론트엔드에 노출하지 않는다.
- 계산 결과가 불완전하면 임의 기본값으로 채우지 말고 상태를 표시한다.
- Dashboard Schema와 위젯 레지스트리의 검증 경계를 우회하지 않는다.
- provider 표시 필드는 Dashboard Schema의 `provider_metadata`와 Widget Registry 계약 안에서만 사용한다.

## 미결정 사항

- 사용자별 provider 자격 증명을 로컬 파일, OS 보안 저장소, 서버 저장소 중 어디에 둘 것인가?
- 토스증권 API에서 보유 종목 목록과 지수 조회를 어떤 공식 경로로 안정적으로 제공받을 수 있는가?
- 실시간 또는 준실시간의 허용 갱신 지연 기준을 몇 분으로 정의할 것인가?
