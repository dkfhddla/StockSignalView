# StockSignalView PR Guidelines

## Purpose

This document defines how pull requests should be prepared, reviewed, updated,
and considered merge-ready in StockSignalView.

`CONTRIBUTING.md`는 저장소 전체 기여 규칙을 소유하고, `WORKFLOW.md`는 단계별
실행 흐름을 소유한다. 이 문서는 PR 준비, 리뷰, 업데이트, 병합 준비 기준을
소유한다. 정확한 커밋, 브랜치, Merge Request, 이슈 연계 형식은
`docs/agents/contribution-conventions.md`가 소유한다.

## When To Open A PR

Open a PR when:

- the branch represents one focused workstream
- the owning docs have been updated where required
- the branch has reached a reviewable checkpoint
- the remaining risk is small enough for review to be useful

Do not wait for perfect polish if the branch is already coherent and ready for
 meaningful feedback.

## Before Opening A PR

Before opening a PR, confirm:

- the branch name clearly reflects the work type and scope
- the branch does not contain unrelated work
- the owning product, spec, architecture, ADR, or guideline docs were updated in the same change when required
- `MAP.md` was updated if canonical paths or major document areas changed
- `AGENTS.md` was updated if startup or navigation expectations changed
- `README.md` was updated if root framing or top-level links changed
- the most relevant local verification for the changed surface was completed
- known residual risks or unverified assumptions are identified

## PR Description Rules

정확한 제목, 본문 섹션, 줄 길이 제한, 검증 기록, 이슈 연계 형식은
`docs/agents/contribution-conventions.md`를 따른다. 이 문서에는 해당 템플릿을
중복해서 기록하지 않는다.

## Review Expectations

문장과 제목을 리뷰할 때는 `docs/agents/communication-language.md`를 적용한다.
이 문서에 정의된 고정 기술 제목은 `hard violation`이 아닌 허용 예외다.

Review should focus on:

- behavioral regressions
- contract drift
- documentation inconsistencies
- missing owner-doc updates
- missing verification
- changes that are broader than the stated scope

Review comments should prefer concrete file references and owner-based guidance
over broad stylistic preference.

## Responding To Review

- verify the comment against the current branch before changing files
- fix blocking issues before polishing nits
- keep review-response commits focused
- use follow-up commits on an already shared or reviewed branch by default
- do not rewrite reviewed history unless the workflow or user explicitly requires it
- update the owning docs in the same follow-up when the review reveals durable doc drift

## Merge-Ready Criteria

A PR is merge-ready when:

- its scope is coherent
- blocking review findings are resolved
- owner docs match the actual branch behavior and structure
- verification appropriate to the changed surface has been completed
- remaining risks are understood and acceptable

## Non-Goals

This document does not:

- replace `WORKFLOW.md` as the end-to-end execution flow
- replace `CONTRIBUTING.md` as the repository rules document
- define GitHub automation or CI policy that does not yet exist in this repository
