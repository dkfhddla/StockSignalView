# Dynamic View Renderer

## 목적

Dynamic View Renderer는 검증된 Dashboard Schema v1을 실제 화면으로 표시하는 프론트엔드 책임을 정의한다. 렌더러는 AI가 만든 화면 코드를 실행하지 않고, 등록된 위젯 컴포넌트와 안전한 옵션만 사용한다.

## 렌더링 원칙

- 입력은 검증된 Dashboard Schema v1이어야 한다.
- 위젯 타입은 Widget Registry에 등록된 컴포넌트와 1:1로 연결한다.
- 문자열은 평문으로 렌더링하며 HTML로 해석하지 않는다.
- 스키마에 없는 동작은 실행하지 않는다.
- 데이터 부족 상태를 화면에서 명확하게 표시한다.

## 렌더링 흐름

```text
Dashboard Schema 수신
-> 스키마 버전 확인
-> 위젯 타입 검증
-> 데이터 요구사항 연결
-> 위젯별 상태 계산
-> 반응형 레이아웃 배치
-> 화면 표시
```

## 책임

### Schema Adapter

- 백엔드 또는 프리셋에서 받은 Dashboard Schema를 프론트엔드 내부 타입으로 변환한다.
- 지원하지 않는 버전이나 필드를 발견하면 렌더링을 중단한다.

### Widget Resolver

- `type` 값을 등록된 위젯 컴포넌트로 매핑한다.
- 미등록 위젯은 `INVALID_SCHEMA` 상태로 처리한다.

### Data Binder

- `data_key` 또는 `data_keys`를 실제 API 응답 또는 캐시된 계산 결과와 연결한다.
- 여러 데이터 묶음을 쓰는 위젯은 각 `data_keys[*]`를 병합하지 않고, 위젯이 구분 가능한 입력으로 전달한다.
- 데이터가 없으면 위젯에 `EMPTY` 또는 `UNAVAILABLE` 상태를 전달한다.

### Layout Engine

- PC에서는 표와 차트를 한 화면에서 비교하기 쉽게 배치한다.
- 모바일에서는 카드와 단일 컬럼 흐름을 우선한다.
- 위젯 순서는 Schema의 `layout` 힌트를 따르되, 화면 크기에 맞게 안전하게 조정한다.

## 금지 동작

- `eval`, 동적 스크립트 삽입, 임의 HTML 렌더링.
- 스키마에 포함된 URL로 직접 네트워크 요청.
- 스키마에 포함된 코드 문자열 실행.
- 검증 실패 스키마의 부분 렌더링.
- 위젯 옵션을 이용한 주문 실행 또는 외부 시스템 변경.

## MVP 렌더링 대상

- `position_summary`
- `position_table`
- `position_cards`

현재 MVP 화면에서 위 세 위젯은 실제 시각 렌더링을 제공한다.

다음 위젯은 Dashboard Schema v1에 등록되어 있고 검증 대상에는 포함되지만,
현재 MVP 화면 조각에서는 placeholder로만 표시된다.

- `relative_return_chart`
- `decision_timeline`
- `alert_status_list`

## 오류 상태

- `INVALID_SCHEMA`: 스키마가 검증을 통과하지 못함.
- `UNAVAILABLE`: 필요한 핵심 데이터 없음.
- `PARTIAL`: 일부 지표만 계산 가능.
- `EMPTY`: 필터 결과가 없거나 표시할 데이터 없음.

## 검증 기대치

- 유효한 프리셋 Dashboard Schema가 PC/모바일에서 모두 렌더링된다.
- 미등록 위젯 타입은 화면 표시 전에 거부된다.
- HTML 또는 스크립트처럼 보이는 문자열은 실행되지 않고 평문 또는 거부 상태로 처리된다.
- 데이터 부족 상태가 사용자에게 이해 가능한 메시지로 표시된다.

검증 계층 선택, 공유 계약 fixture 범위, 자동화 우선순위와 수동 검사 한계는
`docs/guidelines/mvp-verification-strategy.md`를 따른다.
