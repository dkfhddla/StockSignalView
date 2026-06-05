# StockSignalView Workflow

## Purpose

This document defines the normal work sequence for StockSignalView. It explains
how contributors move from an idea, issue, or inconsistency to a review-ready
change while preserving the repository's documentation-first operating model.

`CONTRIBUTING.md` defines the rules. `WORKFLOW.md` defines the execution flow.

## Entry Points

Work in this repository usually starts from one of these situations:

- a new idea or feature direction
- a change to an existing document
- a review finding or branch-review result
- an implementation task that reveals missing or conflicting docs
- a repository cleanup or structure change

Start by classifying which kind of work you are doing before changing files.

## Standard Flow

Use this default flow unless a narrower owner workflow applies:

```text
idea or issue
-> read AGENTS.md and MAP.md
-> inspect the owning docs
-> update docs first when scope, behavior, structure, or rationale changed
-> create or switch to the working branch
-> implement or revise
-> verify
-> request review
-> resolve findings
-> confirm documentation completion
```

## Documentation-First Flow

StockSignalView is documentation-first. That means some work must update docs
before implementation begins.

Update docs first when the work changes:

- product scope or product framing
  - update `docs/product-requirements/`
- intended behavior, validation rules, calculation rules, or acceptance criteria
  - update `docs/specs/`
- current architecture, layer boundaries, or system flow
  - update `docs/arch/`
- durable technical rationale or chosen design direction
  - update `docs/adr/`
- dashboard engine contract surfaces
  - update the owning top-level `docs/*.md` contract doc

If the implementation reveals that the durable docs are wrong, fix the docs in
the same change instead of leaving the mismatch behind.

## Branch Workflow

- Confirm the owner docs first.
- Create or move to a focused branch for the workstream.
- Keep document redesign, implementation work, and review follow-up scoped to the same topic.
- When a review is already in progress on a shared branch, respond with follow-up commits instead of rewriting reviewed history by default.
- Keep worktree changes grouped so a reviewer can understand the owning doc and implementation area together.

## Verification Flow

Before review, verify in this order:

1. Owner check
2. Document consistency check
3. Root navigation check
4. Surface-specific verification

Owner check means confirming the correct durable doc was updated.

Document consistency check means comparing the changed surface against related
owners such as PRD, specs, architecture docs, ADRs, and contract docs.

Root navigation check means confirming that `AGENTS.md`, `MAP.md`, and `README.md`
still make sense when their responsibilities are affected.

Surface-specific verification means running the best available local check for
the changed implementation or document surface.

## Review Flow

- Run a self-check before asking for review.
- Read `docs/guidelines/pr-guidelines.md` before opening or updating a PR.
- Use branch review when the change needs local diff review.
- Fix blocking findings first.
- Resolve document ownership or contract conflicts before polishing wording.
- Keep remaining nits visible instead of mixing them into blocker discussion.

## Documentation Completion Rules

Before considering work complete, confirm:

- new canonical docs are registered in `MAP.md`
- startup guidance is still accurate in `AGENTS.md`
- root landing links are still accurate in `README.md` when applicable
- behavior changes are reflected in `docs/specs/`
- structure changes are reflected in `docs/arch/`
- rationale changes are reflected in `docs/adr/`
- dashboard engine contract changes are reflected in the right top-level `docs/*.md` file

## Stop And Escalate Cases

Stop and clarify before continuing when:

- the owning document is unclear
- two owner documents disagree about the same rule
- the work looks like a durable technical decision but no ADR coverage exists
- the requested change crosses product scope, behavior, and architecture at once without a clear primary owner
- a new document seems necessary, but an existing owner might already cover the topic
- review feedback implies a broader contract change than the current branch scope can safely absorb

When this happens, pause the implementation path, identify the owner conflict,
and resolve that conflict before continuing.
