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
- Put product behavior in `docs/specs/`, architecture in `docs/arch/`, decisions in `docs/adr/`, and reusable repo rules in `docs/guidelines/`.
- Keep dashboard engine contracts in the owning top-level docs unless a future reorganization gives them a clearer dedicated area.
