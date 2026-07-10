# AI Dashboard Planner

## 목적

AI Dashboard Planner는 사용자의 자연어 질문을 Dashboard Schema v1 초안으로 변환한다. Planner의 산출물은 투자 판단을 대신하지 않고, 사용자가 보유 데이터와 메모를 더 잘 회고하도록 화면 구성을 제안한다.

## 입력

Planner는 다음 입력을 사용할 수 있다.

- 사용자 질문.
- 현재 사용자 컨텍스트(보유 종목, 관심 종목, 선택 종목).
- 계산된 `PortfolioPosition`.
- 거래 원장과 투자 메모.
- 알림 규칙과 알림 이벤트.
- 사용 가능한 위젯 레지스트리.

MVP에서는 실제 AI API 연결 전이라도 프리셋 또는 규칙 기반 생성기로 동일 출력 계약을 검증할 수 있어야 한다.

## 출력

Planner는 다음 둘 중 하나를 반환한다.

- 유효성 검증 대상인 Dashboard Schema v1 초안.
- 스키마를 만들 수 없는 이유와 사용자에게 필요한 추가 입력.

## 허용 동작

- 사용자 질문 의도 분류.
- 필요한 데이터 타입 식별.
- 허용 위젯 선택.
- 위젯 제목과 표시 옵션 제안.
- 여러 데이터 묶음이 필요한 위젯은 `data_keys`를 사용해 필요한 입력을 모두 선언.
- 데이터 부족 시 보완 안내 작성.

## 금지 동작

- 임의 코드, HTML, JavaScript, SQL 생성.
- 외부 API 호출 지시.
- 주문 실행 또는 자동매매 지시.
- 보장된 수익, 매수/매도 강제 추천, 투자 책임 전가 문구 생성.
- 위젯 레지스트리에 없는 위젯 타입 생성.
- Dashboard Schema v1에 없는 필드로 렌더러 동작을 우회.
- provider 데이터, 계산 결과, 투자 메모를 출처 없이 요약하거나 확인 불가능한
  투자 판단으로 단정.
- provider명, 데이터 출처, 가격/지수 기준 시각, 마지막 갱신 시각, 데이터 상태가
  있는 입력을 숨기거나 누락된 값을 그럴듯한 문장으로 보완. 단, 현재
  Dashboard Schema v1이 허용하지 않는 provider metadata 필드를 임의로 emit해서
  검증을 우회하면 안 된다.

## Planner 흐름

```text
사용자 질문
-> 의도 분류
-> 데이터 요구사항 선택
-> 위젯 후보 선택
-> Dashboard Schema 초안 생성
-> Schema Validator 검증
-> 렌더러 전달 또는 보완 질문 반환
```

## MVP 의도 분류

- `PORTFOLIO_OVERVIEW`: 전체 보유 상태를 보고 싶다.
- `RELATIVE_STRENGTH`: 시장 대비 강한/약한 종목을 보고 싶다.
- `DECISION_REVIEW`: 거래 사유와 성과를 함께 복기하고 싶다.
- `ALERT_MONITOR`: 알림 조건과 충족 상태를 보고 싶다.
- `DATA_GAP_CHECK`: 계산이 안 되는 이유를 알고 싶다.

## 실패 처리

Planner는 다음 경우 스키마 대신 보완 응답을 반환한다.

- 질문 의도가 투자 데이터 화면으로 해석되지 않는다.
- 필요한 데이터가 없고 대체 프리셋도 부적절하다.
- 위젯 레지스트리로 표현할 수 없는 화면을 요청했다.
- 자동 주문, 보장 수익, 과도한 투자 조언 등 금지 요청이다.
- 출처나 갱신 시각을 확인할 수 없는 provider 데이터로 투자 요약을 만들도록
  요청했다.

## 검증 기대치

- 같은 입력 질문은 구조적으로 유사한 Dashboard Schema를 생성해야 한다.
- 모든 출력은 `docs/dashboard-schema-v1.md` 검증 규칙을 통과해야 렌더링된다.
- 금지 요청은 화면 생성 대신 안전한 거절 또는 보완 질문으로 처리한다.
- provider 기반 지표의 출처와 갱신 시각 메타데이터 표시 요구는 Dashboard Schema와
  Widget Registry가 해당 필드를 허용하는 후속 확장 뒤 검증한다. 그 전까지 Planner는
  provider metadata 필드를 data requirement, widget option, column으로 emit하지 않으며,
  현재 Schema v1의 허용 필드로 표현할 수 없으면 보완 응답을 반환한다.
