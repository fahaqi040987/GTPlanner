---
name: dev-run
description: Build, run, and verify the GTPlanner app locally (Docker or native), run tests, and smoke-test recent changes end-to-end. Use when the user asks to "run the app", "start the project", "build and check", or verify that recent development works.
---

# Dev Run — Build, Run & Verify GTPlanner

Project-specific runbook. Two supported paths: **Docker** (full stack) or
**native** (backend + Vite dev server directly). After starting, run the
verification checklist.

## 1. Environment prerequisites

- Docker path: Docker running, `.env.dev` present (`make setup-dev` checks it).
- Native path: `uv` installed; `web_simple/node_modules` installed
  (`cd web_simple && npm install` — required after `mermaid` was added);
  backend env vars (`.env` with `LLM_API_KEY`/`OPENAI_API_KEY`, `SECRET_KEY`).

## 2. Start

### Docker (full stack)

```bash
make dev            # backend :11211, frontend :8080, db :5432
make dev-build      # use this instead if backend/frontend images changed
make dev-logs       # watch for startup errors
```

### Native (faster for frontend iteration)

```bash
# Terminal 1 — backend (port 11211)
uv run uvicorn gtplanner_backend_simple.main:app --host 0.0.0.0 --port 11211 --reload

# Terminal 2 — frontend (port 5173)
cd web_simple && npm run dev
```

## 3. Tests (before or after starting)

```bash
uv run pytest tests/ -q                     # backend suite (incl. steps 1–4 tests)
cd web_simple && npm test -- --run          # frontend suite
cd web_simple && npm run build              # production build must succeed
cd web_simple && npm run lint               # lint
```

## 4. Health & API verification

```bash
curl -s http://localhost:11211/health       # {"status":"healthy",...}
curl -s http://localhost:11211/             # API info
# API docs: http://localhost:11211/docs
```

## 5. Smoke-test checklist (verifies MVP steps 1–5)

Walk this in order in the browser (`http://localhost:8080` Docker /
`http://localhost:5173` native):

1. **Register** the first account → this user is **admin**
   (PRD v2.2.0). Check the sidebar shows **LLM Presets**.
2. Open **LLM Presets** (`/admin/llm`) → add a preset
   (name, OpenAI-compatible base URL, API key, model) → **Test before
   saving** must report success → **Create** → it becomes **Active**.
3. **Register** a second account → sidebar must NOT show LLM Presets.
4. As the second user, open **New PRD** → enter an idea → pick a preset
   (or *Default*) → **Start workflow** → clarifying questions appear
   (step 2).
5. Answer the questions → **Generate section drafts** → Review step shows
   the 5 section tabs + **Diagrams** tab with 4 rendered mermaid diagrams
   (PRD v2.3.0).
6. Edit one section, regenerate another with feedback, regenerate one
   diagram with feedback → all reflect the change.
7. **Finalize PRD** → lands on the document page: markdown renders,
   diagrams render inline next to their sections, mermaid blocks survive
   **Export Markdown**.
8. **Resume check:** start another workflow, close the tab mid-way,
   reopen `/prd/new` → the workflow resumes at the exact step.
9. Second user → **Settings → Personal LLM** → save own endpoint/key →
   start a workflow choosing **My personal LLM** → drafts generate via it.
10. `GET /health` still healthy after all of the above; no errors in
    `make dev-logs`.

## 6. When something fails

- Backend won't start → check `.env`/`.env.dev` for required keys
  (`OPENAI_API_KEY`, `SECRET_KEY`); check `make dev-logs-backend`.
- Frontend blank → `npm install` in `web_simple` (mermaid is new), check
  browser console and `make dev-logs-frontend`.
- 401 loops → clear `access_token` in localStorage, log in again.
- Test failures → run the failing test with `-x -v` and read the assert;
  prefer fixing root cause over adjusting the test.
- Deep-dive debugging: use the `diagnosing-bugs` skill; live browser QA:
  use the `scoutqa-test` skill.
