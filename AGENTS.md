# StockSignalView Agent Guide

## Overview

StockSignalView is a documentation-first project for an investment operations system that turns trade records, investment notes, and market-relative performance into AI-generated dynamic dashboards. The repository includes a React/Vite Dashboard Schema renderer and a FastAPI default-dashboard backend slice; the remaining MVP services are still planned.

## Golden Path

The intended end-to-end product flow is:

```text
Trade record
-> investment note
-> performance and relative-return calculation
-> AI question or preset selection
-> Dashboard Schema generation
-> validated dynamic dashboard rendering
-> alerts and later external integrations
```

## Where To Start

- Read `README.md` for project intent and current scope.
- Read `MAP.md` to find the owning path for any topic.
- Read `docs/guidelines/documentation-standard.md` before adding or moving durable docs.
- Read `CONTRIBUTING.md` for repository contribution rules.
- Read `WORKFLOW.md` for the standard execution flow.
- Read `docs/product-requirements/stock-signal-view.md` for product scope.
- Read `docs/specs/mvp-foundation.md` for MVP behavior and acceptance criteria.
- Read `docs/arch/overview.md` for system shape and boundaries.

## Repo Map

- `README.md`: project landing page.
- `MAP.md`: canonical repository navigation index.
- `CONTRIBUTING.md`: repository contribution rules.
- `WORKFLOW.md`: repository execution flow.
- `docs/product-requirements/`: product intent and success criteria.
- `docs/specs/`: behavior specs and calculation rules.
- `docs/arch/`: current architecture and runtime boundaries.
- `docs/adr/`: durable technical decisions and rationale.
- `docs/agents/`: detailed operating conventions and engineering-skill configuration for agents.
- `docs/guidelines/`: repository rules, including documentation policy.
- `docs/*.md`: top-level dashboard engine contracts such as schema, widget registry, planner, and renderer.

## Commands

Useful commands for the current implementation stage:

- `rg --files`
- `rg "<term>" docs README.md MAP.md AGENTS.md`
- `git diff --stat`
- `cd frontend && pnpm build`
- `cd backend && python -m pytest -q`
- `cd backend && python -m uvicorn app.main:app`

## Documentation Rules

- Keep root docs short and navigational.
- Update `MAP.md` in the same change whenever durable doc locations move.
- Put product behavior in `docs/specs/`, architecture in `docs/arch/`, decisions in `docs/adr/`, reusable repo rules in `docs/guidelines/`, and detailed agent operating conventions in `docs/agents/`.
- Keep dashboard engine contracts in the owning top-level docs unless a future reorganization gives them a clearer dedicated area.

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

### Contribution conventions

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
