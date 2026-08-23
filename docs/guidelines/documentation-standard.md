# StockSignalView Documentation Standard

**Status:** Adopted for this repository
**Applies to:** StockSignalView durable repository documentation
**Goal:** Keep project knowledge easy to discover, low-rot, and clear for both humans and agents while the product is still documentation-first.

## 1) Why this standard exists

StockSignalView is still in the contract-definition stage. That means our main project risk is not code drift yet, but documentation drift:

- product scope can diverge from MVP behavior
- dashboard engine contracts can diverge from architecture docs
- validation rules can diverge across specs
- future implementation can start from the wrong owning document

This standard gives the repository one consistent answer to:

- where a new document should live
- which document owns a given kind of truth
- which root docs must stay small and navigational
- which docs must be updated in the same change when behavior or structure moves

## 2) Core principles

1. Keep root docs small and navigational.
2. Keep one source of truth per concern.
3. Prefer links over duplicated prose.
4. Put durable repo knowledge in the repository, not in chat history or ephemeral notes.
5. Keep documentation grouped by responsibility, not by convenience.
6. Update the owning documentation in the same change as any durable behavior, structure, or policy change.

## 3) Canonical ownership

- `AGENTS.md`: canonical agent and engineer entry point.
- `MAP.md`: canonical navigation index and "where is X?" answer.
- `README.md`: landing page and project summary, not the canonical source of truth.
- `docs/product-requirements/`: product intent, users, scope, and success criteria.
- `docs/specs/`: intended behavior, rules, flows, acceptance criteria, and validation expectations.
- `docs/arch/`: current system shape, boundaries, data flow, and runtime structure.
- `docs/adr/`: durable technical decisions and their rationale.
- `docs/agents/`: 에이전트의 상세 운영 규칙과 공학 스킬 설정.
- `docs/guidelines/`: reusable repository rules and norms.
- Top-level `docs/*.md`: dashboard engine contracts that currently act as first-class owned surfaces in this repository.

## 4) Required repository docs

This repository must keep:

- `AGENTS.md`
- `MAP.md`
- `docs/arch/`
- `docs/specs/`
- `docs/adr/`
- `docs/agents/`
- `docs/guidelines/`

This repository should keep:

- `README.md`
- `docs/product-requirements/`
- top-level dashboard engine contract docs under `docs/`

The following are optional for future growth and should be added only when the project actually needs them:

- `contracts/`
- `docs/ipc/`
- `docs/roadmap/`
- `docs/tech-debt/`
- `docs/harness/`
- `docs/knowledge/`
- `docs/references/`

## 5) Document responsibilities

### 5.1 `AGENTS.md`

Purpose:
Give a fast, reliable starting point for a new agent or engineer.

Must include:

- short repo overview
- golden path
- top-level repo map
- pointers to the most-used docs
- minimal useful commands

Must not include:

- deep subsystem detail
- duplicate contract definitions
- long troubleshooting narratives
- temporary execution logs or task plans

### 5.2 `README.md`

Purpose:
Explain what StockSignalView is and what to open next.

May include:

- product summary
- current MVP scope
- short status statement
- links outward to canonical docs

Must not become:

- the canonical navigation index
- the architecture owner
- the full behavior spec

### 5.3 `MAP.md`

Purpose:
Answer "where do I find X?" reliably.

Rules:

- update `MAP.md` in the same change when durable docs move or when a new doc area becomes canonical
- keep path ownership descriptions short and concrete
- prefer one best destination per concern

### 5.4 `docs/product-requirements/`

Purpose:
Own product intent, scope, users, non-goals, and success criteria.

Use for:

- product framing
- required capabilities
- unresolved product questions
- expected downstream specs

Do not use for:

- implementation structure
- detailed runtime architecture
- low-level validation rules

### 5.5 `docs/specs/`

Purpose:
Own intended behavior and acceptance-ready rules.

Use for:

- user flows
- validation rules
- calculation rules
- MVP acceptance criteria
- data-model behavior and input expectations

Do not use for:

- architecture rationale
- broad product strategy
- temporary planning notes

### 5.6 `docs/arch/`

Purpose:
Own current cross-module structure and boundaries.

Use for:

- system topology
- service boundaries
- ownership splits
- data flow between layers
- runtime or deployment assumptions

Do not use for:

- product scope decisions
- low-level field definitions already owned by specs

### 5.7 `docs/adr/`

Purpose:
Preserve durable "why" for important technical choices.

Use for:

- architecture decisions
- adopted technical boundaries
- important tradeoffs
- decisions that future implementation must inherit

Do not use for:

- brainstorming with no decision
- temporary task notes
- live status tracking

### 5.8 `docs/guidelines/`

Purpose:
Store reusable repository rules that are too detailed for `AGENTS.md`.

Use for:

- documentation policy
- review checklists
- engineering conventions
- testing or verification norms

### 5.9 `docs/agents/`

목적:
코딩 에이전트가 따라야 할 상세 운영 규칙과 저장소별 설정을 보관한다.

용도:

- 커밋, 브랜치, 리뷰 요청 형식 규칙
- 이슈 트래커와 트리아지 라벨 매핑
- 도메인 문서 사용 규칙
- 저장소 범위의 언어 사용 규칙과 리뷰 예외
- `AGENTS.md`에서 연결하는 주제별 상세 지침

`AGENTS.md`와 주제별 상세 문서 사이의 분류·명명·중복 방지 규칙은
`docs/agents/document-classification.md`를 따른다.

## 6) StockSignalView-specific routing rules

Use this routing table when adding or editing docs:

- "What is this project?" -> `README.md`
- "How should an agent start here?" -> `AGENTS.md`
- "Where is the owning file for X?" -> `MAP.md`
- "What problem are we solving and what is in scope?" -> `docs/product-requirements/`
- "What should the system do?" -> `docs/specs/`
- "How is the current system shaped?" -> `docs/arch/`
- "Why did we choose this technical direction?" -> `docs/adr/`
- "에이전트가 따라야 할 상세 운영 규칙이나 스킬 설정은 어디에 있는가?" -> `docs/agents/`
- "What are the reusable repository rules?" -> `docs/guidelines/`
- "What is the Dashboard Schema / Widget Registry / Planner / Renderer contract?" -> the owning top-level `docs/*.md` contract file

## 7) Same-change update rules

A change must update documentation in the same change when it alters:

- MVP behavior or acceptance criteria
- validation rules
- calculation rules
- dashboard engine contracts
- major file paths or directory layout
- architecture boundaries
- durable repository workflow or policy

At minimum:

- moving docs or adding a new canonical doc area requires a `MAP.md` update
- changing root navigation expectations requires an `AGENTS.md` update
- changing project framing or top-level scope may require a `README.md` update
- changing architecture decisions may require an ADR update or a new ADR
- 에이전트 상세 운영 규칙을 변경하면 해당 `docs/agents/` 문서와
  `AGENTS.md`의 요약 링크를 함께 갱신한다.

## 8) Writing rules

1. Keep root docs short and link outward.
2. Prefer one owner over repeated summaries.
3. Use lowercase `kebab-case` for normal docs.
4. Use stable names that describe responsibility, not temporary process.
5. Prefer durable conclusions over transient planning chatter.
6. If two docs disagree about a rule, fix both in the same change or remove the duplicate rule.

## 9) Naming rules

Use fixed root names for special entry docs:

- `AGENTS.md`
- `MAP.md`
- `README.md`

Use lowercase `kebab-case` for normal documentation files:

- `documentation-standard.md`
- `stock-signal-view-data-model.md`
- `widget-registry.md`

Avoid names like:

- `final.md`
- `notes-v2.md`
- `temp.md`
- `new-plan.md`

## 10) Lightweight gardening policy

StockSignalView should maintain docs incrementally as normal work happens.

Expected gardening work:

- keep `AGENTS.md` short and useful
- keep `MAP.md` aligned with actual file layout
- remove contradictory wording when a spec or ADR evolves
- add new doc areas only when the repository actually needs them
- avoid creating generic dumping-ground folders

## 11) Review checklist pointer

Use `docs/guidelines/documentation-checklists.md` as the fast review companion for this standard.
