# StockSignalView 에이전트 안내

## 개요

StockSignalView는 거래 기록, 투자 노트, 시장 대비 성과를 AI가 생성하는 동적
대시보드로 전환하는 투자 운영 시스템을 문서 우선으로 설계하는 프로젝트입니다.
저장소에는 React/Vite Dashboard Schema 렌더러와 FastAPI 기본 대시보드
백엔드 슬라이스가 구현되어 있으며, 나머지 MVP 서비스는 계획 단계입니다.

## 언어 사용 원칙

대화와 설명 본문은 한국어를 우선하되, 기계 인식과 의미 보존에 필요한 영어는
허용합니다. 자세한 허용 범위와 리뷰 예외는
`docs/agents/communication-language.md`를 따릅니다.

## 핵심 흐름

의도한 전체 제품 흐름은 다음과 같습니다.

```text
거래 기록
-> 투자 노트
-> 성과 및 상대수익률 계산
-> AI 질문 또는 프리셋 선택
-> Dashboard Schema 생성
-> 검증된 동적 대시보드 렌더링
-> 알림 및 이후 외부 연동
```

## 시작 문서

- 프로젝트 의도와 현재 범위는 `README.md`에서 확인합니다.
- 주제별 소유 경로는 `MAP.md`에서 찾습니다.
- 영속 문서를 추가하거나 이동하기 전에
  `docs/guidelines/documentation-standard.md`를 읽습니다.
- 저장소 기여 규칙은 `CONTRIBUTING.md`를 따릅니다.
- 표준 실행 흐름은 `WORKFLOW.md`를 따릅니다.
- 제품 범위는 `docs/product-requirements/stock-signal-view.md`에서 확인합니다.
- MVP 동작과 수용 기준은 `docs/specs/mvp-foundation.md`에서 확인합니다.
- 시스템 구조와 경계는 `docs/arch/overview.md`에서 확인합니다.

## 저장소 지도

- `README.md`: 프로젝트 소개 진입점입니다.
- `MAP.md`: 저장소의 기준 탐색 색인입니다.
- `CONTRIBUTING.md`: 저장소 기여 규칙입니다.
- `WORKFLOW.md`: 저장소 실행 흐름입니다.
- `docs/product-requirements/`: 제품 의도와 성공 기준입니다.
- `docs/specs/`: 동작 명세와 계산 규칙입니다.
- `docs/arch/`: 현재 아키텍처와 런타임 경계입니다.
- `docs/adr/`: 영속적인 기술 결정과 근거입니다.
- `docs/agents/`: 에이전트의 상세 운영 규칙과 공학 스킬 설정입니다.
- `docs/guidelines/`: 문서 정책을 포함한 저장소 규칙입니다.
- `docs/*.md`: 스키마, 위젯 레지스트리, 플래너, 렌더러 등 대시보드 엔진의
  최상위 계약입니다.

## 명령어

현재 구현 단계에서 유용한 명령어는 다음과 같습니다.

- `rg --files`
- `rg "<term>" docs README.md MAP.md AGENTS.md`
- `git diff --stat`
- `cd frontend && pnpm build`
- `cd backend && python -m pytest -q`
- `cd backend && python -m uvicorn app.main:app`

## 문서 규칙

- 루트 문서는 짧은 탐색 문서로 유지합니다.
- 영속 문서의 위치를 옮기면 같은 변경에서 `MAP.md`를 갱신합니다.
- 제품 동작은 `docs/specs/`, 아키텍처는 `docs/arch/`, 결정은 `docs/adr/`,
  재사용 가능한 저장소 규칙은 `docs/guidelines/`, 에이전트 상세 운영 규칙은
  `docs/agents/`에 둡니다.
- 대시보드 엔진 계약은 더 명확한 전용 영역이 생기기 전까지 각 계약을 소유한
  최상위 문서에 유지합니다.

## 문서 분류 원칙

`AGENTS.md`에는 모든 에이전트가 즉시 알아야 할 요약과 상세 문서 링크만
유지합니다. 상세 규칙은 주제별로 `docs/agents/<topic>.md`에 분리합니다.

- 새 규칙이 기존 주제에 속하면 해당 `docs/agents/` 문서를 수정합니다.
- 독립된 주제라면 소문자 kebab-case 이름으로 새 문서를 만들고,
  `AGENTS.md`에 한 줄 요약과 링크를 추가합니다.
- 같은 상세 규칙을 `AGENTS.md`와 주제 문서에 중복해서 기록하지 않습니다.
- `AGENTS.md`는 라우팅 인덱스로 유지하고, 상세 규칙의 단일 기준은 주제
  문서로 삼습니다.

## Agent skills

### Git workflow

커밋, 브랜치, Merge Request 작성 및 이슈 연계 규칙은
`docs/agents/contribution-conventions.md`를 따른다.

### Issue tracker

이 저장소의 이슈와 PRD는 GitHub Issues에서 관리하며, 외부 PR은 트리아지 요청
표면에 포함하지 않는다. 자세한 내용은 `docs/agents/issue-tracker.md`를 참고한다.

### Triage labels

트리아지는 `needs-triage`, `question`, `ready-for-agent`, `ready-for-human`,
`wontfix` 라벨 매핑을 사용한다. 자세한 내용은
`docs/agents/triage-labels.md`를 참고한다.

### Domain docs

도메인 문서는 단일 컨텍스트 레이아웃을 사용한다. 자세한 내용은
`docs/agents/domain.md`를 참고한다.
