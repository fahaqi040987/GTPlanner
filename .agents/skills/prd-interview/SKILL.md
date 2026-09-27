---
name: prd-interview
description: Interview the user to gather product requirements, then update docs/PRD.md. Use when the user describes a new want, feature, or product direction for GTPlanner ("I want...", "add feature", "update the PRD", "gather my requirements"), or when scope is unclear before planning implementation work.
---

# PRD Interview — Gather Requirements & Update docs/PRD.md

Turn the user's raw wants into a confirmed, structured update of `docs/PRD.md` — the single source of truth for GTPlanner product scope. Never create parallel PRD files.

## Process

### Step 1 — Extract what is already answered

Read the user's message and silently fill in the Question Bank below. **Never re-ask anything the user already stated.** Also read the current `docs/PRD.md` first so you know existing decisions (MVP scope, non-goals, phases) and only ask about deltas.

### Step 2 — Interview the gaps

- Ask only unanswered items from the Question Bank.
- Batch at most **3 questions per turn**; prefer multiple-choice or yes/no.
- Stop early if the user says "you decide" / "assume" — mark the answer as `(assumed)` and record it in Open Questions.
- Do not start editing until MVP-critical items (workflow shape, access model, MVP cut) are answered or explicitly deferred.

### Step 3 — Confirm before writing

Present a compact summary and ask for confirmation:

```
Here's what I'll write into docs/PRD.md:
- Problem/Change: ...
- Users affected: ...
- Workflow/steps: ...
- MVP in-scope: ...
- Moved out / deferred: ...
- Assumptions: ...
OK to update the PRD?
```

### Step 4 — Update docs/PRD.md

Apply edits preserving the file's canonical format:

1. **Frontmatter:** bump `updated:` to today; bump `version:` (patch for clarifications, minor for scope changes).
2. **Section mapping:** route answers into the matching sections — Summary & non-goals, Target Users, Requirements (grouped, with status markers), MVP Scope, User Stories, Implementation Plan, Success Metrics, Risks, Open Questions.
3. **Status markers (be honest — verify against code when claiming ✅):**
   - `✅` shipped and working in the codebase
   - `🚧` partially implemented (say what's missing)
   - `📋` planned, MVP
   - `💤` planned, later
4. **Changelog:** append a dated entry at `## Changelog` (one line: version + what changed and why).
5. Keep unrelated content untouched; do not delete existing requirements unless the user said to.

## Question Bank

Ask only what's unresolved:

1. **Problem & value** — What pain does this remove? How do we know it's solved?
2. **Users** — Which persona(s) does this serve? New persona?
3. **Workflow** — What steps, in what order? Which are required vs skippable? Must it be resumable across sessions?
4. **Access & permissions** — Who can see/edit what? Single-owner only, or roles/sharing?
5. **LLM configuration** — Which providers? Per-user keys or admin-set? Encryption expectations? Fallback when user has no config? (Current direction: per-user, encrypted at rest, OpenAI-compatible base URL + key + model, configured in the website — never in `.env`.)
6. **MVP cut** — What is the smallest lovable version? What can wait?
7. **Success criteria** — Observable metric for this feature?
8. **Non-goals** — What should we explicitly NOT do?

## Rules

- `docs/PRD.md` is the only PRD. Product decisions land there, not in chat memory.
- MVP is a strict cut: when in doubt, move the item to `💤` later.
- Never mark `✅` without verifying the code actually does it.
- Unconfirmed guesses go in the PRD as `(assumed)` + an Open Question.
- After updating the PRD, offer the natural next step (e.g., update Implementation Plan tasks or open implementation).
