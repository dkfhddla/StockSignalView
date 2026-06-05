# Contributing To StockSignalView

## Purpose

This document defines the repository contribution rules for StockSignalView.
It applies to both human contributors and coding agents, and it exists to keep
documentation, implementation, and review work aligned around the same source
of truth.

## Who This Applies To

This document applies to:

- human contributors making documentation or code changes
- coding agents working in the repository
- document-only changes
- implementation changes that also affect durable repository knowledge

If a change touches durable behavior, structure, routing, or policy, this
document applies even when the change looks small.

## Source Of Truth

Use the owning document before changing or adding durable documentation.

- `AGENTS.md` owns the repository starting path for agents and engineers.
- `MAP.md` owns repository navigation and answers "where is X?"
- `README.md` is a landing page, not a canonical source of truth.
- `docs/guidelines/documentation-standard.md` owns documentation placement and update policy.
- `docs/guidelines/documentation-checklists.md` owns fast review and gardening checks.
- `docs/guidelines/pr-guidelines.md` owns PR-specific operating guidance.
- `docs/product-requirements/` owns product intent, scope, and success criteria.
- `docs/specs/` owns intended behavior, rules, and acceptance criteria.
- `docs/arch/` owns current system structure and boundary descriptions.
- `docs/adr/` owns durable technical decisions and rationale.
- top-level `docs/*.md` dashboard engine docs own the schema, widget, planner, and renderer contracts.

When two documents appear to describe the same thing, resolve the ownership
conflict instead of adding a third explanation.

## Change Rules

- Treat StockSignalView as a documentation-first repository.
- Update the owning documentation in the same change as any durable behavior,
  structure, or policy change.
- Prefer links to owner documents over restating their content.
- Do not create a new document until you confirm that an owner document does
  not already exist.
- Keep root docs short, navigational, and easy to scan.
- Do not let implementation move ahead of durable documentation when the work
  changes scope, behavior, structure, or technical rationale.

## Branch And Commit Rules

- Use a focused branch per workstream.
- Name branches so the work type, project, and work area are obvious.
- Prefer branch prefixes by change type:
  - `doc/` for documentation work
  - `feat/` for new functionality
  - `fix/` for bug fixes
- Keep unrelated work off the same branch.
- Use normal follow-up commits when responding to review on an already shared branch.
- Do not rewrite reviewed history unless the user or repository workflow explicitly requires it.
- Keep commit scope aligned with the owning document or implementation area being changed.

## Documentation Update Triggers

Update the owning docs in the same change when you alter:

- product framing or scope
  - owner: `docs/product-requirements/`
- intended behavior, validation rules, acceptance criteria, or calculation rules
  - owner: `docs/specs/`
- current system shape, boundaries, runtime assumptions, or data flow
  - owner: `docs/arch/`
- durable technical decisions or rationale
  - owner: `docs/adr/`
- dashboard engine contract surfaces
  - owner: the relevant top-level `docs/*.md` contract doc
- canonical doc paths or major document areas
  - owner: `MAP.md`
- repository startup or navigation expectations
  - owner: `AGENTS.md`
- landing-page framing or top-level doc links
  - owner: `README.md`
- reusable documentation or contribution rules
  - owner: `docs/guidelines/`

## Verification Before Review

Before requesting review:

- confirm the owning document was updated where required
- check that no second source of truth was introduced
- check for contradictions between PRD, specs, architecture, ADRs, and dashboard engine contracts
- confirm new or moved canonical docs are reflected in `MAP.md`
- confirm startup guidance still points to the right docs in `AGENTS.md`
- confirm root links are still sensible in `README.md`
- run the most relevant local verification available for the changed surface

At the current repository stage, document consistency and ownership checks are
part of the minimum verification bar.

## Review Expectations

- Lead with blocking risks, contract drift, regressions, and missing coverage.
- Cite concrete files and lines when possible.
- Prefer owner-based feedback over broad stylistic commentary.
- Treat documentation conflicts as first-class review findings.
- State any residual risks or unverified assumptions after the main findings.

## Non-Goals

This document does not:

- replace `AGENTS.md` as the startup guide
- replace `MAP.md` as the navigation index
- describe the step-by-step execution order for work
- restate detailed product, spec, architecture, or ADR content

Execution order belongs in `WORKFLOW.md`.
