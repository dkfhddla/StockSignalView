# StockSignalView Documentation Checklists

## PR Review Checklist

- Does the change update the owning doc for the behavior, boundary, or policy it changes?
- If a canonical doc moved or a new canonical doc was added, was `MAP.md` updated?
- If root navigation changed, was `AGENTS.md` updated?
- If top-level project framing changed, does `README.md` still match?
- Do any two docs now describe the same rule differently?
- If validation or calculation rules changed, do related specs still agree?
- If architecture scope changed, do `docs/arch/` and `docs/adr/` still agree?
- If dashboard engine contracts changed, do the related top-level contract docs still agree?

## Gardening Checklist

- Is any root doc carrying detail that should move to a lower-level owner?
- Is any doc acting as a duplicate source of truth for another doc?
- Is there a better owning folder for a new durable note?
- Is stale wording left behind after a scope or architecture change?
- Is a newly added document named by durable responsibility rather than process history?
