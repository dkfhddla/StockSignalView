# StockSignalView 데이터 모델 초안

## 목적

이 문서는 StockSignalView MVP 구현 전에 합의해야 할 핵심 데이터 모델과 계산 경계를 정의한다.

MVP는 수동 입력 기반으로 동작하되, 향후 증권사 API, 시세 API, 지수 API를 입력 소스로 추가할 수 있게 내부 데이터 구조를 분리한다.

## 기본 원칙

- 거래 기록은 계산 결과만 저장하지 않고 개별 거래 원장으로 보존한다.
- MVP의 평균 매수가와 실현손익 계산은 이동평균법을 기본값으로 사용한다.
- FIFO, LIFO, 개별 지정법은 MVP 범위가 아니지만, 거래 원장을 기반으로 나중에 별도 계산 모듈을 추가할 수 있어야 한다.
- 현재가와 시장 지수는 MVP에서 수동 입력 또는 모의 데이터로 처리할 수 있다.
- 계산 결과는 원칙적으로 거래, 가격, 지수 입력값에서 재계산 가능한 파생값으로 취급한다.
- 외부 데이터가 없거나 기준값이 부족하면 계산값은 `미산출` 상태로 표시한다.

## 입력 책임 구분

이 문서의 필드는 내부 데이터 구조를 정의하기 위한 초안이며, 모든 필드를 사용자가 매번 직접 입력한다는 뜻이 아니다.

### 사용자 입력 필드

사용자가 화면에서 직접 입력하거나 선택하는 값이다.

- 종목 등록: 종목 코드 또는 종목명, 시장 구분, 관심 종목 여부, 종목 메모
- 거래 입력: 종목, 거래 유형, 수량, 체결가, 거래 일시, 매수/매도 사유, 거래 메모, 수수료, 세금
- 가격 입력: 종목, 가격, 가격 기준 시각
- 시장 지수 입력: 시장 구분, 지수 값, 지수 기준 시각
- provider 보유 현황 입력: 종목, 보유 수량, 평균 매수가 또는 provider가 제공한
  원가 근거, 기준 시각, provider명
- 알림 조건 입력: 종목, 알림 유형, 임계값, 활성 여부

MVP에서는 수수료와 세금을 선택 입력으로 둘 수 있으며, 입력하지 않으면 기본값 `0`으로 처리할 수 있다.

### 시스템 관리 필드

시스템이 자동으로 생성하거나 연결하는 값이다.

- 내부 식별자: `id`, `stock_id`, `alert_rule_id`
- 입력 출처: `source`
- 외부 연동 식별자: `external_id`
- 생성/수정 시각: `created_at`, `updated_at`
- 계산 결과: 평균 매수가, 보유 수량, 평가금액, 평가손익, 실현손익, 수익률, 상대수익률, 강/약세 상태
- 계산 상태: `CALCULATED`, `PARTIAL`, `UNAVAILABLE`

사용자는 계산 결과를 직접 입력하지 않는다. 계산 결과는 거래, 가격, 시장 지수 입력값에서 시스템이 산출한다.

### 공통 조회 상태

provider 또는 내부 입력 경로가 값을 조회하거나 정규화할 때의 성공/실패 상태다.

허용 상태:

- `AVAILABLE`: 값을 사용할 수 있음
- `PARTIAL`: 일부 대상 또는 일부 필드만 사용할 수 있음
- `STALE`: 값은 있으나 지연 또는 신선도 정책 확인이 필요함
- `UNAVAILABLE`: 값이 없어 계산에 사용할 수 없음
- `UNAUTHORIZED`: 인증 실패 또는 만료로 조회할 수 없음
- `FORBIDDEN`: 권한 없음 또는 계좌 접근 불가
- `PROVIDER_ERROR`: provider 오류 또는 일시 장애
- `UNSUPPORTED`: provider가 해당 조회를 지원하지 않음

규칙:

- `PARTIAL`, `STALE`, `UNAUTHORIZED`, `FORBIDDEN`, `PROVIDER_ERROR`, `UNSUPPORTED`를 단순 `UNAVAILABLE`로 접어 저장하면 안 된다.
- 대시보드와 테스트가 사용자 조치가 필요한 인증/권한 문제와 일시적 provider 오류를 구분할 수 있어야 한다.
- `PriceSnapshot.data_status`와 `MarketIndexSnapshot.data_status`는 스냅샷 값의 사용 가능 상태를 나타낸다. 조회 자체의 실패 원인과 대상별 상태 묶음은 `ProviderLookupResult`로 전달한다.

## 데이터 모델

### Stock

사용자가 관찰하거나 거래하는 종목이다.

필드 초안:

- `id`: 내부 식별자
- `code`: 종목 코드
- `name`: 종목명
- `market`: 시장 구분 (`KOSPI`, `KOSDAQ`)
- `is_watchlisted`: 관심 종목 여부
- `note`: 종목 메모
- `created_at`: 등록 시각
- `updated_at`: 수정 시각

규칙:

- `code`와 `market` 조합은 중복 등록을 허용하지 않는다.
- 시장 구분은 허용된 값만 저장한다.
- 관심 종목 여부는 대시보드 기본 노출 필터에 사용할 수 있다.

### Trade

사용자가 입력한 매수/매도 거래 원장이다.

필드 초안:

- `id`: 내부 식별자
- `stock_id`: 종목 식별자
- `trade_type`: 거래 유형 (`BUY`, `SELL`)
- `quantity`: 수량
- `price`: 체결가
- `fee`: 수수료
- `tax`: 세금
- `traded_at`: 거래 일시
- `reason`: 매수/매도 판단 사유
- `memo`: 거래 메모
- `source`: 입력 출처 (`MANUAL`, `BROKER_API`, `IMPORT`)
- `external_id`: 외부 연동 식별자
- `created_at`: 등록 시각
- `updated_at`: 수정 시각

규칙:

- MVP의 `source` 기본값은 `MANUAL`이다.
- `BROKER_API`, `IMPORT`는 향후 확장을 위한 예약 값이다.
- 수량과 체결가는 0보다 커야 하며, 수수료와 세금은 0 이상이어야 한다.
- 매도 수량은 계산 가능한 현재 보유 수량을 초과할 수 없다.
- 거래 수정/삭제 후 해당 종목의 포트폴리오 산출값은 재계산되어야 한다.

### PriceSnapshot

종목의 특정 시점 가격 입력값이다.

필드 초안:

- `id`: 내부 식별자
- `stock_id`: 종목 식별자. provider-only unmapped 가격이면 비울 수 있다.
- `provider_symbol`: provider가 반환한 원본 종목 코드 또는 심볼
- `provider_market`: provider가 반환한 원본 시장 구분
- `price`: 가격
- `provider`: 가격을 제공한 provider 또는 내부 입력 주체
- `provider_source_id`: provider 내부의 시세 소스 또는 연동 식별자
- `captured_at`: 가격 값의 기준 시각(value basis timestamp)
- `refreshed_at`: provider 또는 내부 입력에서 스냅샷을 마지막으로 갱신한 시각
- `data_status`: 데이터 상태 (`AVAILABLE`, `STALE`, `UNAVAILABLE`)
- `snapshot_role`: 스냅샷 역할 (`CURRENT`, `DAY_BASELINE`, `HOLDING_PERIOD_BASELINE`)
- `source`: 입력 출처 (`MANUAL`, `MARKET_API`, `MOCK`)
- `created_at`: 등록 시각

규칙:

- MVP는 사용자가 현재가를 직접 입력하거나 모의 가격을 사용할 수 있다.
- 수동 입력과 모의 가격은 명시 값이 없으면 기본적으로 `snapshot_role`을 `CURRENT`, `data_status`를 `AVAILABLE`로 저장한다.
- 한 종목에 여러 가격 스냅샷을 저장할 수 있다.
- provider-only unmapped 가격은 `stock_id` 없이 `provider`, `provider_symbol`, `provider_market` 조합으로 `ProviderHoldingSnapshot.raw_provider_symbol`, `raw_market`과 연결할 수 있다.
- provider-only 가격 연결은 내부 `Stock` upsert나 자동 병합을 의미하지 않는다. 내부 종목 조인이 필요한 기능은 계속 `UNAVAILABLE` 또는 `미산출`로 둘 수 있다.
- 대시보드는 기본적으로 `snapshot_role`이 `CURRENT`이고 `data_status`가 `AVAILABLE`인 가장 최근 가격 스냅샷을 평가금액 계산에 사용한다.
- `DAY_BASELINE`은 특정 영업일 기준가, `HOLDING_PERIOD_BASELINE`은 보유 기간 시작 기준가처럼 수익률 기준값을 분리해 보존한다.
- provider 연동 가격은 값을 산출한 기준 시각(`captured_at`)과 시스템이 값을 가져온 시각(`refreshed_at`)을 구분해 저장한다.
- `data_status`가 `STALE`인 가격은 화면에 지연 상태로 표시한다. 계산 서비스는 사용자나 정책이 허용한 지연 허용 범위 안에서만 이를 사용할 수 있으며, 허용 범위를 벗어나면 해당 지표를 `UNAVAILABLE` 또는 `미산출`로 처리한다.
- 가격이 없거나 `data_status`가 `UNAVAILABLE`이면 평가금액, 평가손익, 종목 수익률은 `미산출` 상태가 될 수 있다.

### MarketIndexSnapshot

KOSPI/KOSDAQ 같은 시장 지수의 특정 시점 입력값이다.

필드 초안:

- `id`: 내부 식별자
- `market`: 시장 구분 (`KOSPI`, `KOSDAQ`)
- `index_value`: 지수 값
- `provider`: 지수를 제공한 provider 또는 내부 입력 주체
- `provider_source_id`: provider 내부의 지수 소스 또는 연동 식별자
- `captured_at`: 지수 값의 기준 시각(value basis timestamp)
- `refreshed_at`: provider 또는 내부 입력에서 스냅샷을 마지막으로 갱신한 시각
- `data_status`: 데이터 상태 (`AVAILABLE`, `STALE`, `UNAVAILABLE`)
- `snapshot_role`: 스냅샷 역할 (`CURRENT`, `DAY_BASELINE`, `HOLDING_PERIOD_BASELINE`)
- `source`: 입력 출처 (`MANUAL`, `MARKET_API`, `MOCK`)
- `created_at`: 등록 시각

규칙:

- KOSPI 종목은 KOSPI 지수, KOSDAQ 종목은 KOSDAQ 지수를 기본 비교 대상으로 사용한다.
- 수동 입력과 모의 지수는 명시 값이 없으면 기본적으로 `snapshot_role`을 `CURRENT`, `data_status`를 `AVAILABLE`로 저장한다.
- 시장 수익률 계산은 `CURRENT` 지수와 기준 역할(`DAY_BASELINE` 또는 `HOLDING_PERIOD_BASELINE`) 지수를 명시적으로 구분해 사용한다.
- `data_status`가 `STALE`인 지수는 화면에 지연 상태로 표시한다. 계산 서비스는 사용자나 정책이 허용한 지연 허용 범위 안에서만 이를 사용할 수 있으며, 허용 범위를 벗어나면 시장 수익률과 상대수익률을 `UNAVAILABLE` 또는 `미산출`로 처리한다.
- 기준일 지수 또는 현재 지수가 없거나 `data_status`가 `UNAVAILABLE`이면 시장 수익률과 상대수익률은 `미산출` 상태로 표시한다.
- provider 연동 지수는 값을 산출한 기준 시각(`captured_at`)과 시스템이 값을 가져온 시각(`refreshed_at`)을 구분해 저장한다.
- MVP에서는 실시간 지수를 필수로 자동 조회하지 않는다.

### ProviderHoldingSnapshot

읽기 전용 provider가 특정 시점에 알려준 사용자의 보유 종목 상태다.

필드 초안:

- `id`: 내부 식별자
- `provider`: provider명
- `external_account_id`: provider 계좌 또는 계정 식별자
- `provider_account_name`: provider가 반환한 계좌 또는 계정 표시명
- `raw_provider_symbol`: provider가 반환한 원본 종목 코드 또는 심볼
- `raw_provider_name`: provider가 반환한 원본 종목명
- `raw_market`: provider가 반환한 원본 시장 구분
- `stock_id`: 매핑된 내부 종목 식별자. 매핑되지 않은 provider-only 보유 현황이면 비울 수 있다.
- `held_quantity`: provider가 반환한 보유 수량
- `average_cost`: provider가 반환한 평균 매수가
- `cost_basis_source`: 평균 매수가 또는 원가 근거의 출처 (`PROVIDER_REPORTED`, `TRADE_LEDGER_DERIVED`, `UNKNOWN`)
- `captured_at`: 보유 현황 기준 시각
- `refreshed_at`: provider에서 데이터를 가져온 마지막 갱신 시각
- `source`: 입력 출처 (`BROKER_API`, `IMPORT`, `MOCK`)
- `created_at`: 등록 시각

규칙:

- `ProviderHoldingSnapshot`은 provider가 알려준 현재 보유 상태이며, 개별 매수/매도 거래 원장을 대체하지 않는다.
- provider가 체결 내역을 제공하지 않고 보유 수량과 평균 매수가만 제공하면 시스템은 이를 `Trade`로 변환해 저장하지 않는다.
- adapter는 정책상 허용될 때 `raw_provider_symbol`, `raw_provider_name`, `raw_market`을 사용해 `Stock`을 매핑하거나 upsert할 수 있다.
- adapter가 `Stock`을 매핑하거나 upsert할 수 없으면 `stock_id`를 비워 provider-only 보유 현황을 unmapped 상태로 보존한다.
- 로컬 `Stock`이 없다는 이유만으로 provider-only 보유 현황을 drop하지 않는다.
- unmapped 보유 현황은 내부 `Stock` 조인이 필요한 계산과 대시보드 표시에는 사용할 수 없으며 해당 값은 `UNAVAILABLE` 또는 `미산출` 상태로 표시한다. 단, provider 원본 식별자와 provider-only 가격 연결만으로 산출 가능한 `position_key`, 보유 수량, 평균단가 기준 현재 수익률 같은 provider-only 행 표시는 허용한다.
- 거래별 판단 사유, 수수료, 세금, 체결 시각이 필요한 기능은 `Trade` 원장이 있을 때만 계산하거나 표시한다.
- `PortfolioPosition`은 내부 `Trade` 원장과 provider 보유 현황을 같은 화면에 사용할 수 있지만, 어떤 입력에서 계산되었는지와 계산 상태를 구분해야 한다.
- provider 보유 현황과 내부 거래 원장이 같은 종목에 대해 충돌하면 자동 병합하지 않고 후속 동기화 정책 또는 사용자 확인 대상으로 둔다.

### ProviderLookupResult

provider 조회 또는 내부 provider-normalization 단계의 상태 envelope다. `ProviderHoldingSnapshot`, `PriceSnapshot`, `MarketIndexSnapshot` 같은 owner 모델에 없는 실패 원인이나 대상별 조회 상태를 보존한다.

필드 초안:

- `id`: 내부 식별자 또는 요청 단위 식별자
- `provider`: provider명
- `lookup_type`: 조회 유형 (`HOLDINGS`, `PRICE`, `MARKET_INDEX`)
- `lookup_status`: 공통 조회 상태 (`AVAILABLE`, `PARTIAL`, `STALE`, `UNAVAILABLE`, `UNAUTHORIZED`, `FORBIDDEN`, `PROVIDER_ERROR`, `UNSUPPORTED`)
- `target_key`: 조회 대상 키. 보유 조회는 계좌 식별자, 가격 조회는 `provider_symbol` 또는 `stock_id`, 지수 조회는 시장 구분을 사용한다.
- `target_label`: 원본 대상 식별자를 노출하지 않고 조회 대상을 설명하는 안전한 표시명. 보유 조회에서는 snapshot이 없는 실패에도 계좌를 식별할 수 있도록 필수다.
- `snapshot_role`: 가격 또는 지수 조회의 계산 역할 (`CURRENT`, `DAY_BASELINE`, `HOLDING_PERIOD_BASELINE`). `lookup_type`이 `PRICE` 또는 `MARKET_INDEX`이면 필수이고, `HOLDINGS`이면 포함하지 않는다.
- `error_code`: provider 또는 시스템이 분류한 오류 코드
- `message`: 사용자에게 표시 가능한 상태 메시지
- `captured_at`: provider 값의 기준 시각. 값이 없으면 비울 수 있다.
- `refreshed_at`: 조회 또는 갱신 시각
- `source`: 입력 출처 (`BROKER_API`, `MARKET_API`, `IMPORT`, `MOCK`)
- `created_at`: 등록 시각

규칙:

- 보유 목록, 가격, 지수 조회가 실패해 owner snapshot을 만들 수 없어도 `ProviderLookupResult`는 실패 원인을 보존해야 한다.
- `lookup_status=AVAILABLE`은 provider 조회가 성공했음을 뜻한다. 이 값은 가격·지수 owner snapshot의 `data_status`를 대체하지 않으며, 성공한 조회의 snapshot도 `STALE` 또는 `UNAVAILABLE`일 수 있다.
- 보유 조회의 `UNAUTHORIZED`, `FORBIDDEN`, `PROVIDER_ERROR`, `UNSUPPORTED`, `PARTIAL`, `STALE`, `UNAVAILABLE` 상태는 `ProviderHoldingSnapshot`에 임의 필드를 추가하지 않고 반드시 `ProviderLookupResult.lookup_status`로 전달한다. `PortfolioPosition.calculation_status`는 계산 가능 여부만 나타내며 provider 실패 원인의 저장 위치가 아니다.
- 보유 조회가 실패해 `ProviderHoldingSnapshot`을 만들 수 없더라도 `target_label`에는 연결 설정 또는 등록된 provider 계정에서 해석한 안전한 계좌 표시명을 보존한다. 원본 계좌 식별자와 `target_key`는 화면에 노출하지 않는다.
- 가격/지수 조회의 인증 실패와 provider 오류는 `PriceSnapshot.data_status` 또는 `MarketIndexSnapshot.data_status`만으로 표현하지 않고 `ProviderLookupResult.lookup_status`에 보존한다. 가격·지수 조회 결과는 동일 `target_key`의 역할별 기준값을 구분하도록 `snapshot_role`을 반드시 함께 보존한다.
- snapshot이 생성된 경우에도 stale 또는 partial 상태가 있으면 snapshot의 `data_status`와 조회 envelope의 `lookup_status`를 함께 전달할 수 있다.
- 조회 결과의 대상 식별자는 `HOLDINGS`에서는 `(provider, lookup_type, target_key)`, `PRICE`와 `MARKET_INDEX`에서는 `(provider, lookup_type, target_key, snapshot_role)`로 고유해야 한다.

### AlertRule

사용자가 종목별로 설정하는 기본 알림 조건이다.

필드 초안:

- `id`: 내부 식별자
- `stock_id`: 종목 식별자
- `rule_type`: 알림 유형 (`TARGET_RETURN`, `STOP_LOSS`, `RELATIVE_RETURN`)
- `threshold_value`: 임계값
- `is_enabled`: 활성 여부
- `created_at`: 등록 시각
- `updated_at`: 수정 시각

규칙:

- MVP는 목표 수익률, 손절 기준, 상대수익률 기준의 3개 유형을 지원한다.
- 조건 충족 여부는 앱 내부 표시 또는 이벤트 로그로 확인 가능해야 한다.
- 계산에 필요한 값이 부족하면 알림 상태는 `미산출` 또는 `판단 불가`로 표시한다.

### AlertEvent

알림 조건이 충족되었거나 상태 확인이 필요한 시점을 기록하는 이벤트다.

필드 초안:

- `id`: 내부 식별자
- `alert_rule_id`: 알림 조건 식별자
- `stock_id`: 종목 식별자
- `status`: 이벤트 상태 (`TRIGGERED`, `NOT_TRIGGERED`, `UNAVAILABLE`)
- `message`: 사용자 표시 메시지
- `evaluated_at`: 평가 시각
- `created_at`: 등록 시각

규칙:

- MVP에서는 푸시 알림보다 앱 내부 로그 또는 목록 표시를 우선한다.
- 같은 조건이 반복 충족될 때 이벤트 중복 생성 정책은 후속 알림 스펙에서 정의한다.

## 파생 모델

### PortfolioPosition

종목별 보유 상태를 나타내는 계산 결과다.

필드 초안:

- `stock_id`: 종목 식별자
- `position_key`: 화면 행, 계산 결과, provider-only 가격 연결에 사용할 포지션 식별자. 내부 종목이면 `stock_id`를 기준으로 만들고, provider-only unmapped 보유 현황이면 provider 계좌와 원본 심볼/시장 조합으로 만든다.
- `provider`: provider-only 보유 현황에서 온 경우의 provider명
- `external_account_id`: provider-only 보유 현황에서 온 경우의 계좌 식별자
- `raw_provider_symbol`: provider-only 보유 현황에서 온 경우의 원본 종목 코드 또는 심볼
- `raw_provider_name`: provider-only 보유 현황에서 온 경우의 원본 종목명
- `raw_market`: provider-only 보유 현황에서 온 경우의 원본 시장 구분
- `stock_name`: 종목명
- `market`: 시장 구분
- `held_quantity`: 보유 수량
- `average_cost`: 평균 매수가
- `market_value`: 평가금액
- `unrealized_profit_loss`: 평가손익
- `realized_profit_loss`: 실현손익
- `position_weight`: 포트폴리오 비중
- `average_cost_current_return_rate`: 평균단가 기준 현재 수익률
- `daily_stock_return_rate`: 당일 종목 수익률
- `daily_market_return_rate`: 당일 시장 수익률
- `daily_relative_return_rate`: 당일 상대수익률
- `holding_period_stock_return_rate`: 보유기간 종목 수익률
- `holding_period_market_return_rate`: 보유기간 시장 수익률
- `holding_period_relative_return_rate`: 보유기간 상대수익률
- `stock_return_rate`: 보유기간 종목 수익률. 기존 Dashboard Schema 호환 필드이며 기본 의미는 `holding_period_stock_return_rate`와 같다.
- `market_return_rate`: 보유기간 시장 수익률. 기존 Dashboard Schema 호환 필드이며 기본 의미는 `holding_period_market_return_rate`와 같다.
- `relative_return_rate`: 보유기간 상대수익률. 기존 Dashboard Schema 호환 필드이며 기본 의미는 `holding_period_relative_return_rate`와 같다.
- `strength_status`: 강/약세 상태
- `calculation_status`: 계산 상태 (`CALCULATED`, `PARTIAL`, `UNAVAILABLE`)

규칙:

- `PortfolioPosition`은 저장 원장이 아니라 거래, 가격, 지수 입력에서 재계산되는 파생 결과로 본다.
- provider 보유 현황만 있는 종목의 `PortfolioPosition`은 `ProviderHoldingSnapshot`,
  `PriceSnapshot`, `MarketIndexSnapshot`, `ProviderLookupResult`에서 산출될 수 있다. 이 경우 실현손익,
  거래 타임라인, 거래 메모 기반 판단 회고처럼 거래 원장이 필요한 값은
  `UNAVAILABLE` 또는 `미산출`로 둔다.
- provider-only unmapped `PortfolioPosition`은 `stock_id`가 비어 있어도 `position_key`, `provider`, `external_account_id`, `raw_provider_symbol`, `raw_market`으로 행 식별과 provider-only `PriceSnapshot` 연결을 유지해야 한다. 구현체가 이 식별자를 보존할 수 없으면 provider-only 보유 현황에서 `PortfolioPosition`을 만들지 않고 `ProviderLookupResult`의 상태만 전달한다.
- provider-only unmapped `PortfolioPosition`의 `stock_name`과 `market`은 화면 표시를 위해 `raw_provider_name`, `raw_market`에서 가져올 수 있지만, 이는 내부 `Stock` 매핑이나 upsert를 의미하지 않는다.
- provider-only 보유 현황에 양수 `average_cost`, 양수 보유 수량, 현재가가 있으면 `average_cost_current_return_rate`는 표시할 수 있다. 그러나 첫 매수일, 보유기간 기준 종목 가격, 보유기간 기준 시장 지수 중 필요한 기준값이 없으면 `holding_period_relative_return_rate`와 호환 필드 `relative_return_rate`는 `UNAVAILABLE` 또는 `미산출` 상태로 둔다.
- `daily_stock_return_rate`, `daily_market_return_rate`, `daily_relative_return_rate`는 당일 기준 가격과 당일 기준 시장 지수로 계산하는 당일 triplet이다. `holding_period_stock_return_rate`, `holding_period_market_return_rate`, `holding_period_relative_return_rate`는 현재 보유 기간 시작 기준값으로 계산하는 보유기간 triplet이다.
- 당일 상대수익률과 보유기간 상대수익률은 서로 다른 필드에 보존한다. `daily_relative_return_rate`가 `holding_period_relative_return_rate` 또는 `relative_return_rate`를 overwrite해서는 안 되며, 보유기간 상대수익률도 당일 상대수익률을 overwrite해서는 안 된다.
- provider spec은 평균단가 기준 현재 수익률을 `average_cost_current_return_rate`, 당일 상대수익률을 `daily_relative_return_rate`, 보유기간 상대수익률을 `holding_period_relative_return_rate` 또는 기존 호환 필드 `relative_return_rate`로 참조해야 한다.
- `daily_*`, `holding_period_*`, `average_cost_current_return_rate`는 데이터 모델과 후속 provider 확장 계약의 내부 계산 필드다. 이를 Dashboard Schema나 Widget Registry에 표시 필드로 노출하려면 해당 계약과 백엔드/프론트엔드 validator를 별도로 확장해야 한다.
- 테이블/카드 위젯이 별도 종목 조인 없이 표시 가능하도록 종목명과 시장 구분을 포함할 수 있다.
- 성능 문제 또는 화면 응답성을 위해 캐시할 수는 있지만, 원본 데이터의 소유자는 `Trade`, `ProviderHoldingSnapshot`, `PriceSnapshot`, `MarketIndexSnapshot`이다.
- 계산 상태가 `PARTIAL` 또는 `UNAVAILABLE`이면 대시보드에는 누락된 입력을 사용자가 이해할 수 있게 표시해야 한다.

## 계산 기준

### 이동평균법

- 매수 시 기존 보유 원가와 신규 매수 원가를 합산해 평균 매수가를 재계산한다.
- 매도 시 매도 체결가와 매도 시점 평균 매수가의 차이로 실현손익을 계산한다.
- 매도 후 남은 수량의 평균 매수가는 유지한다.
- 전량 매도 후 보유 수량이 0이 되면 평균 매수가는 표시하지 않거나 `미보유` 상태로 표시한다.

### 수수료와 세금

초기 결정 필요 항목:

- 매수 수수료를 평균 매수가에 포함할지
- 매도 수수료와 세금을 실현손익에서 차감할지
- 평가손익 계산 시 예상 매도 수수료/세금을 반영할지

MVP 기본안:

- 수수료와 세금은 거래 필드로 저장한다.
- 매수 수수료는 평균 매수가 계산을 위한 신규 매수 원가에 포함한다.
- 실현손익에는 매도 수수료와 세금을 차감한다.
- 평가손익 계산 시 예상 매도 수수료/세금 반영 여부는 MVP 기본 범위에서 제외한다.

### 상대수익률

```text
평균단가 기준 현재 수익률 = (현재가 - 평균 매수가) / 평균 매수가 * 100
보유기간 종목 수익률 = (현재가 - 기준일 종목 기준가) / 기준일 종목 기준가 * 100
보유기간 시장 수익률 = (현재 시장 지수 - 기준일 시장 지수) / 기준일 시장 지수 * 100
보유기간 상대수익률 = 보유기간 종목 수익률 - 보유기간 시장 수익률
당일 종목 수익률 = (현재가 - 당일 기준 종목 가격) / 당일 기준 종목 가격 * 100
당일 시장 수익률 = (현재 시장 지수 - 당일 기준 시장 지수) / 당일 기준 시장 지수 * 100
당일 상대수익률 = 당일 종목 수익률 - 당일 시장 수익률
```

기본값:

- 평가 시작일은 현재 보유 기간의 첫 매수일이다.
- 기준일 종목 기준가는 현재 보유 기간의 첫 매수 체결가다.
- 기준일 시장 지수는 현재 보유 기간의 첫 매수일에 대응하는 시장 지수다.
- 기존 `stock_return_rate`, `market_return_rate`, `relative_return_rate`의 기본 의미는 각각 보유기간 종목 수익률, 보유기간 시장 수익률, 보유기간 상대수익률이다.
- 평균단가 기준 현재 수익률, 당일 triplet, 보유기간 triplet은 서로 다른 계산 기준을 가진다. 계산 서비스와 provider adapter는 한 기준의 결과로 다른 기준의 필드를 덮어쓰지 않는다.

## Dashboard Schema 입력 경계

Dashboard Schema는 원본 데이터를 저장하는 모델이 아니라 화면 구성을 표현하는 파생 계약이다. 다음 모델은 동적 대시보드의 데이터 입력으로 사용될 수 있다.

- `Stock`: 종목 선택, 필터, 카드/표 제목.
- `Trade`: 거래 타임라인, 판단 사유 회고.
- `PriceSnapshot`: 평가금액과 수익률 계산 입력.
- `MarketIndexSnapshot`: 시장 수익률과 상대수익률 계산 입력.
- `AlertRule`, `AlertEvent`: 알림 상태 위젯 입력.
- `PortfolioPosition`: 대시보드 위젯의 주요 계산 결과.

Dashboard Schema v1과 Widget Registry가 아직 허용하지 않는 `PortfolioPosition` 내부 필드는 Planner가 곧바로 위젯 column이나 option으로 emit하면 안 된다. 해당 필드를 화면에 노출하려면 `docs/dashboard-schema-v1.md`, `docs/widget-registry.md`, 백엔드/프론트엔드 validator를 같은 계약으로 확장한 뒤 사용한다.

AI Dashboard Planner는 이 데이터를 직접 변경하지 않는다. Planner는 데이터 요구사항과 위젯 구성을 제안하고, 렌더러는 검증된 Dashboard Schema만 표시한다.

## API 확장 경계

향후 외부 API는 기존 모델을 대체하지 않고 입력 소스로만 추가한다.

- 증권사 체결 내역 API: `Trade` 생성 또는 갱신
- 읽기 전용 보유 종목 API: `ProviderHoldingSnapshot` 생성 또는 갱신
- 시세 API: `PriceSnapshot` 생성
- 시장 지수 API: `MarketIndexSnapshot` 생성
- provider 조회 상태 API: `ProviderLookupResult` 생성 또는 갱신
- 뉴스/공시 API: MVP 이후 별도 도메인 모델로 분리
- AI API: 거래 메모와 성과 데이터를 읽고 Dashboard Schema 초안을 생성하는 플래너 경계로 분리

## 미결정 사항

- 수량 소수점 허용 여부
- 알림 이벤트 중복 생성 방지 정책
- 가격 스냅샷 수동 입력 UI의 최소 필드
