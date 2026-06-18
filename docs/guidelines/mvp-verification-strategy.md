# MVP 검증 전략 가이드라인

## 목적

이 문서는 StockSignalView MVP 구현자가 기능별 검증 위치, 자동화 우선순위,
수동 검사의 한계를 일관되게 선택하도록 돕는 저장소 규범이다.

제품 동작과 수용 기준은 `docs/specs/`가 소유하고, 백엔드 계층 경계는
`docs/arch/backend-architecture-slices.md`가 소유한다. Dashboard Schema,
Widget Registry, Dynamic View Renderer 계약은 각각의 최상위 `docs/*.md`
문서가 소유한다. 이 가이드라인은 기존 계약을 재정의하지 않고 검증 계층과
증거의 배치만 분류한다.

## 범위

- MVP 표면별 권장 검증 계층과 최소 자동화 증거
- 백엔드 단위, 서비스, API 통합, 프론트엔드 렌더링 검사의 책임과 비책임
- 공유 계약 fixture가 필요한 보조 범위
- 초기 자동화 대상과 수동 검사 허용 범위
- 구현 변경 완료 시 남겨야 할 검증 증거

## 비범위

- 테스트 코드 작성
- 특정 테스트 프레임워크 선택
- CI 작업 또는 실행 순서 구성
- 커버리지 수치 설정
- 성능 벤치마크 정책
- 실제 fixture 저장 경로 고정
- 기존 제품 동작, 계산식, API, 렌더러 계약 변경

## 원칙

1. 가장 낮고 빠른 계층에서 결정적 규칙을 검증한다.
2. 상위 계층은 같은 계산 조합을 반복하지 않고 경계 연결과 관찰 가능한 결과를
   검증한다.
3. 계산, 유효성, 계약, 안전 금지 동작, 핵심 화면 상태는 초기부터 자동화한다.
4. 수동 검사는 반응형 시각 품질과 탐색적 사용성의 보조 증거로만 허용한다.
5. 소유 문서가 불명확한 규칙은 이 문서에서 새로 만들지 않는다.
6. 구현 도구, CI, fixture 경로는 구현 단계에서 결정하되 제품 계약으로 고정하지
   않는다.

## 계층별 책임

### 백엔드 단위 검사

책임:

- 외부 HTTP, 실제 저장소, 프론트엔드 없이 결정적으로 검증 가능한 계산과
  유효성 규칙을 검증한다.
- 이동평균법, 부분 매도, 전량 매도, 수수료와 세금 반영, 0 분모, 결측값 상태,
  시장 지수 선택, 거래 수량·가격 경계를 검증한다.
- Dashboard Schema의 순수 검증 규칙처럼 입출력이 고정된 계약 검사를 포함할 수
  있다.

반복하지 않을 것:

- HTTP 상태 코드와 직렬화 형식
- 실제 화면 렌더링
- 서비스 간 저장·재계산 흐름 전체

### 서비스 검사

책임:

- 여러 모델, 저장소, 계산기, 검증기를 조합하는 응용 흐름을 검증한다.
- 종목과 거래 CRUD가 파생 포트폴리오를 일관되게 갱신하는지 확인한다.
- 거래 생성·수정·삭제 후 포트폴리오와 성과가 재계산되는지 확인한다.
- Dashboard Schema 생성 결과가 검증을 통과한 뒤에만 응답 후보가 되는 순서를
  검증한다.

반복하지 않을 것:

- 계산식의 모든 수치 조합
- HTTP 요청·응답 포맷
- 컴포넌트별 DOM 표현

### API 통합 검사

책임:

- 실제 애플리케이션 진입점을 통해 요청 검증, 응답 형식, 상태 코드, 서비스 위임,
  영속성 경계를 검증한다.
- 정상 CRUD와 대표 실패 계약을 검증한다.
- 미존재 리소스, 중복 종목, 매도 수량 초과, 누락·잘못된 입력처럼 소유 계약에
  정의된 실패를 관찰 가능한 API 실패로 확인한다.

반복하지 않을 것:

- 단위 계층에서 충분히 검증한 계산 조합 전체
- 프론트엔드 레이아웃과 반응형 표시
- Dashboard Schema 내부 규칙의 전수 조합

### 프론트엔드 렌더링 검사

책임:

- 사용자가 관찰하는 DOM, 메시지, 상태 전이, 핵심 상호작용을 검증한다.
- Loading, Empty, Partial, Error, 정상 상태를 구분한다.
- PC 표와 모바일 카드가 같은 핵심 의미를 보존하는지 확인한다.
- 검증된 Dashboard Schema만 렌더링되고, 미등록 위젯과 잘못된 데이터 바인딩은
  안전한 오류 상태로 이어지는지 확인한다.
- HTML 또는 스크립트처럼 보이는 문자열이 실행되지 않고 평문 또는 거부 상태로
  처리되는지 확인한다.

반복하지 않을 것:

- 백엔드 계산식
- API 실패 조합 전체
- 스키마 생성기의 내부 결정 방식

### 공유 계약 fixture

Dashboard Schema 생성기, 검증기, 렌더러가 같은 유효·무효 예제를 공유해야 할 때
공유 계약 fixture를 둔다. 이 범주는 보조 범주이며, 실제 저장 경로와 파일 형식은
구현 단계에서 결정한다.

fixture가 증명해야 할 최소 범위:

- 등록 위젯과 허용 데이터 타입을 사용하는 유효 스키마
- 미등록 위젯 또는 누락된 데이터 바인딩을 가진 무효 스키마
- 생성된 스키마가 검증을 통과한 뒤에만 렌더러 소비자에게 전달되는 순서
- HTML, 스크립트, 코드 조각처럼 보이는 문자열의 비실행 안전 계약

## MVP 검증 매트릭스

| MVP 표면 | 소유 계약 | 주 검증 계층 | 최소 자동화 증거 | 허용 수동 검사 |
| --- | --- | --- | --- | --- |
| 종목 CRUD, 관심 종목, 종목 메모 | [mvp-foundation.md](../specs/mvp-foundation.md), [stock-signal-view-data-model.md](../specs/stock-signal-view-data-model.md), [backend-architecture-slices.md](../arch/backend-architecture-slices.md) | 서비스, API 통합 | 등록·조회·수정·삭제가 서비스 상태를 일관되게 바꾸고, 중복 종목과 미존재 종목 요청이 API 실패 계약으로 관찰된다. | 화면 문구와 목록 밀도 확인 |
| 거래 CRUD와 입력 유효성 | [mvp-foundation.md](../specs/mvp-foundation.md), [stock-signal-view-data-model.md](../specs/stock-signal-view-data-model.md) | 백엔드 단위, 서비스, API 통합 | 수량·가격 0 이하, 수수료·세금 음수, 누락 입력, 보유 수량 초과 매도를 거부한다. 거래 생성·수정·삭제 API는 미존재 거래와 소유 계약에 정의된 입력 실패를 구분한다. | 입력 폼 사용성 탐색 |
| 거래 변경 후 재계산 | [mvp-foundation.md](../specs/mvp-foundation.md), [backend-architecture-slices.md](../arch/backend-architecture-slices.md) | 서비스 | 거래 생성·수정·삭제 후 보유 수량, 평균 매수가, 평가손익, 실현손익, 상대수익률 파생값이 다시 산출된다. | 없음 |
| 이동평균법 기반 보유 수량, 평단가, 실현손익 | [stock-signal-view-calculation-rules.md](../specs/stock-signal-view-calculation-rules.md), [stock-signal-view-data-model.md](../specs/stock-signal-view-data-model.md) | 백엔드 단위 | 추가 매수, 부분 매도, 전량 매도, 전량 매도 후 재매수 사례가 평균 매수가와 실현손익 규칙을 만족한다. | 없음 |
| 평가금액, 평가손익, 포트폴리오 비중 | [stock-signal-view-calculation-rules.md](../specs/stock-signal-view-calculation-rules.md), [mvp-foundation.md](../specs/mvp-foundation.md) | 백엔드 단위, 서비스 | 현재가 결측, 보유 수량 0, 소유 계산 규칙에서 정의한 산출 불가 상태가 0으로 위장되지 않고 계산 상태로 분류된다. | 없음 |
| 종목 수익률, 시장 수익률, 상대수익률, 강·약세 | [stock-signal-view-calculation-rules.md](../specs/stock-signal-view-calculation-rules.md), [mvp-foundation.md](../specs/mvp-foundation.md) | 백엔드 단위 | 기준일 종목 기준가 0, 기준일 시장 지수 0, 현재가 결측, 시장 지수 결측, KOSPI/KOSDAQ 매핑, 상대수익률 강·약세 분류를 검증한다. | 없음 |
| 결측 상태와 계산·화면 상태 | [stock-signal-view-data-model.md](../specs/stock-signal-view-data-model.md), [frontend-user-flow.md](../specs/frontend-user-flow.md), [widget-registry.md](../widget-registry.md) | 백엔드 단위, 프론트엔드 렌더링 | 계산 상태 `CALCULATED`, `PARTIAL`, `UNAVAILABLE`와 화면·렌더러 상태 `EMPTY`가 구분되고, 데이터 부족을 성공 상태처럼 숨기지 않는다. | 문구 이해 가능성 점검 |
| Dashboard Schema 생성과 검증 순서 | [dashboard-schema-v1.md](../dashboard-schema-v1.md), [backend-architecture-slices.md](../arch/backend-architecture-slices.md), [frontend-user-flow.md](../specs/frontend-user-flow.md) | 서비스, 공유 계약 fixture | 생성 결과가 스키마 버전, 위젯 타입, 데이터 요구사항, 옵션 검증을 통과한 뒤에만 렌더러 소비자에게 전달된다. 검증 실패는 렌더링 가능한 결과로 가장하지 않는다. | 없음 |
| 위젯 레지스트리와 데이터 바인딩 | [widget-registry.md](../widget-registry.md), [dashboard-schema-v1.md](../dashboard-schema-v1.md), [dynamic-view-renderer.md](../dynamic-view-renderer.md) | 백엔드 단위, 프론트엔드 렌더링, 공유 계약 fixture | 등록 위젯만 허용하고, `data_key` 또는 `data_keys`가 요구 데이터와 맞지 않으면 거부한다. `alert_status_list`처럼 복수 데이터가 필요한 위젯은 필수 묶음 누락을 실패로 처리한다. | 복잡한 위젯 조합 탐색 |
| 렌더러 안전 금지 동작 | [dynamic-view-renderer.md](../dynamic-view-renderer.md), [dashboard-schema-v1.md](../dashboard-schema-v1.md), [frontend-user-flow.md](../specs/frontend-user-flow.md) | 프론트엔드 렌더링, 공유 계약 fixture | HTML, 스크립트, 외부 URL, 코드 조각처럼 보이는 문자열이 실행되지 않는다. 미등록 위젯과 검증 실패 스키마는 부분 렌더링 없이 안전한 오류 상태가 된다. | 없음 |
| 프론트엔드 주요 화면 상태 | [frontend-user-flow.md](../specs/frontend-user-flow.md), [dynamic-view-renderer.md](../dynamic-view-renderer.md), [widget-registry.md](../widget-registry.md) | 프론트엔드 렌더링 | Loading, Empty, Partial, Error, 정상 상태가 사용자에게 구분되어 보이고 주요 복귀 흐름이 끊기지 않는다. | 탐색적 사용성 |
| PC 표와 모바일 카드 의미 보존 | [mvp-foundation.md](../specs/mvp-foundation.md), [frontend-user-flow.md](../specs/frontend-user-flow.md), [widget-registry.md](../widget-registry.md) | 프론트엔드 렌더링 | PC `position_table`과 모바일 `position_cards`가 보유 상태, 손익, 상대수익률, 강·약세의 핵심 의미를 동일하게 전달한다. | 반응형 시각 품질, 정보 밀도, 줄바꿈 |
| 기본 알림 상태 | [mvp-foundation.md](../specs/mvp-foundation.md), [stock-signal-view-data-model.md](../specs/stock-signal-view-data-model.md), [frontend-user-flow.md](../specs/frontend-user-flow.md) | 백엔드 단위, 서비스, 프론트엔드 렌더링 | 목표 수익률, 손절, 상대수익률 조건이 `TRIGGERED`, `NOT_TRIGGERED`, `UNAVAILABLE`로 분류되고 화면에서 구분된다. | 알림 목록 탐색 |

## 자동화 우선순위

초기 구현부터 자동화해야 하는 범위:

- 계산식과 상태 분류: 이동평균법, 부분·전량 매도, 0 분모, 결측값, 강·약세
  분류
- 유효성: 종목 중복, 허용 시장, 거래 수량·가격·수수료·세금 경계, 보유 수량
  초과 매도
- API 실패 계약: 미존재 리소스, 중복 생성, 누락·잘못된 입력처럼 소유 계약에
  정의된 실패
- 서비스 흐름: 거래 변경 후 재계산, Dashboard Schema 생성 후 검증 순서
- 대시보드 계약: 유효·무효 Schema, 미등록 위젯, 데이터 바인딩 실패
- 안전 금지 동작: 코드, HTML, 스크립트, 외부 URL 문자열 비실행
- 핵심 화면 상태: Loading, Empty, Partial, Error, 정상 상태와 PC·모바일 의미 보존

자동화는 특정 프레임워크, 실행 명령, CI 작업명, 커버리지 수치에 의존해 정의하지
않는다. 구현자는 현재 저장소 구조와 도구 선택에 맞춰 같은 증거를 재현 가능하게
남긴다.

## 수동 검사

수동 검사는 다음 범위로 제한한다.

- 다양한 화면 폭에서의 시각적 균형, 정보 밀도, 줄바꿈, 차트 가독성
- 예상하지 못한 위젯 조합이나 사용 흐름을 확인하는 탐색적 사용성
- 자동화가 이미 보장한 핵심 상태 위에 더하는 보조 스크린샷 또는 메모

수동 검사로 대체할 수 없는 범위:

- 계산 정확성
- 입력 유효성
- API 오류 계약
- Dashboard Schema 거부 계약
- 문자열 비실행과 같은 안전 금지 동작
- Loading, Empty, Partial, Error, 정상 상태의 핵심 회귀
- PC와 모바일이 같은 의미를 보존하는지에 대한 최소 렌더링 증거

## 완료 증거

구현 변경은 다음 증거를 남겨야 한다.

- 변경한 MVP 표면과 소유 계약 문서
- 적용한 검증 계층
- 자동화된 검증 결과 또는 허용된 수동 검사 기록
- 핵심 회귀를 수동 검사로 대체하지 않았다는 설명
- 새 규칙이 필요할 경우, 이 문서가 아니라 해당 소유 문서를 먼저 갱신했다는
  근거

문서 변경만 수행하는 경우에는 다음을 확인한다.

- 모든 상대 링크가 실제 저장소 경로를 가리킨다.
- 기존 소유 문서의 계산식, 상태명, 금지 동작을 재정의하지 않는다.
- 특정 테스트 프레임워크, CI 작업, 커버리지 수치, 성능 벤치마크, 실제 fixture
  경로를 고정하지 않는다.
- 미정 소유권이나 임의 규칙을 새로 만들지 않는다.

## 요구사항 추적

| 요구사항 | 대응 위치 |
| --- | --- |
| GitHub #9: 종목·거래 CRUD 검증 방식 | `MVP 검증 매트릭스`의 종목 CRUD, 거래 CRUD 행 |
| GitHub #9: 포트폴리오 및 성과 계산 검증 방식 | `MVP 검증 매트릭스`의 거래 변경 후 재계산, 이동평균법, 평가금액, 상대수익률 행 |
| GitHub #9: 대시보드 스키마 생성·검증과 프론트엔드 렌더링 | `MVP 검증 매트릭스`의 Dashboard Schema 생성과 검증 순서, 위젯 레지스트리와 데이터 바인딩, 렌더러 안전 금지 동작, 프론트엔드 주요 화면 상태 행 |
| GitHub #9: 백엔드 단위, API 통합, 프론트엔드 렌더링 구분 | `계층별 책임` |
| GitHub #9: 수동 검사와 한계 | `수동 검사` |
| R1: 주요 MVP 표면 전체 포함 | `MVP 검증 매트릭스` |
| R2: 백엔드 단위, 서비스, API 통합, 프론트엔드 렌더링 책임 구분 | `계층별 책임` |
| R3: 계산·계약·안전·핵심 상태 회귀 자동화 | `자동화 우선순위` |
| R4: 수동 검사 제한과 한계 | `수동 검사` |
| R5: 기존 소유 문서 링크와 검증 분류 | `목적`, `MVP 검증 매트릭스`, `관련 소유 문서` |
| R7: CI, 프레임워크, 커버리지, 성능 벤치마크 제외 | `비범위`, `자동화 우선순위`, `완료 증거` |

백엔드 검증 참여자와 증거는 백엔드 단위, 서비스, API 통합 검사 행에서 다룬다.
프론트엔드 검증 참여자와 증거는 프론트엔드 렌더링 검사와 공유 계약 fixture
행에서 다룬다. 이 추적 설명은 새 제품 동작이나 계층 이름을 만들지 않는다.

## 관련 소유 문서

- [문서 표준](documentation-standard.md)
- [문서 체크리스트](documentation-checklists.md)
- [MVP 기반 사양](../specs/mvp-foundation.md)
- [데이터 모델](../specs/stock-signal-view-data-model.md)
- [계산 규칙](../specs/stock-signal-view-calculation-rules.md)
- [백엔드 아키텍처 슬라이스](../arch/backend-architecture-slices.md)
- [프론트엔드 사용자 흐름](../specs/frontend-user-flow.md)
- [Dashboard Schema v1](../dashboard-schema-v1.md)
- [Widget Registry](../widget-registry.md)
- [Dynamic View Renderer](../dynamic-view-renderer.md)
