# Flow2API Architecture Migration Plan

Status: planned; implementation has not started.

This plan restructures Flow2API as a modular monolith in a monorepo. It avoids a full rewrite, preserves existing API contracts, and keeps these commands working throughout the migration:

```bash
uv run setup
uv run flow2api
```

## Goals

- Give each deployable application and extension a clear home.
- Replace oversized modules with feature-oriented boundaries.
- Remove module-level dependency injection and initialization-order coupling.
- Preserve existing HTTP, WebSocket, database, and extension behavior.
- Support both SQLite and PostgreSQL upgrades safely.
- Keep the local setup simple with uv and Bun.
- Add useful quality gates without introducing permanently failing CI.

## Non-goals

- Splitting the backend into microservices.
- Rewriting working features from scratch.
- Introducing abstractions for every module.
- Changing public API paths or payloads as part of structural moves.
- Adopting SQLAlchemy solely to obtain a migration framework.

## Safety rules

1. Work directly on `main`, as required by the repository instructions.
2. Begin every phase with a clean, pushed worktree.
3. Keep each phase independently runnable and verifiable.
4. Add characterization coverage before changing behavior at a seam.
5. Never commit real tokens, cookies, signed URLs, or CAPTCHA payloads.
6. Back up existing databases before migration tests.
7. Treat the Git history rewrite as a destructive operation requiring explicit confirmation immediately before execution.
8. Rewrite only `agmmnn/flow2api`; never push rewritten refs to the `upstream` or `original` remotes.

## Target repository layout

```text
flow2api/
├── apps/
│   ├── api/
│   │   ├── src/flow2api/
│   │   ├── tests/
│   │   └── pyproject.toml
│   ├── admin-web/
│   ├── captcha-extension/
│   ├── metadata-extension/
│   └── agent-gateway/
├── packages/
│   ├── api-contract/
│   └── extension-core/
├── infra/
│   ├── docker/
│   └── compose/
├── docs/
├── scripts/
├── package.json
├── pyproject.toml
├── uv.lock
└── README.md
```

The exact placement of Python packaging metadata will be validated during the layout migration. The target must retain a single straightforward uv workflow.

## Target backend boundaries

```text
flow2api/
├── bootstrap/
│   ├── app.py
│   ├── container.py
│   ├── lifespan.py
│   └── tasks.py
├── common/
│   ├── errors.py
│   ├── logging.py
│   └── monitoring.py
├── settings/
│   ├── static.py
│   └── operational.py
├── accounts/
├── projects/
├── generation/
├── workers/
│   ├── extension/
│   ├── browser/
│   └── personal/
├── media/cache/
├── providers/
│   ├── google_flow/
│   ├── runway/
│   ├── geminigen/
│   └── cliproxy/
├── persistence/
│   ├── sqlite/
│   ├── postgres/
│   └── migrations/
└── transport/
    ├── admin/
    ├── openai/
    ├── gemini/
    └── websocket/
```

HTTP ownership belongs only to `transport/`. Rich domain interfaces are reserved for accounts, generation, and workers, where multiple implementations justify them. Provider modules remain ordinary clients unless a concrete need emerges.

## Phase 1: Safety checkpoint

- [ ] Record the current commit, branches, tags, and remotes.
- [ ] Confirm `main` is clean and pushed.
- [ ] Check for active pull requests or collaborators relying on current commit hashes.
- [ ] Inventory the tracked `niches/` assets.
- [ ] Preserve those assets in an explicitly approved external location.
- [ ] Document recovery steps and the pre-rewrite commit ID.

Exit criteria:

- The current repository state can be recovered.
- The content assets have a verified copy outside the history being rewritten.
- The user has explicitly approved the destructive rewrite.

## Phase 2: History cleanup and repository hygiene

- [ ] Use a fresh clone containing only the `origin` remote.
- [ ] Remove `niches/` from all refs belonging to this fork with `git filter-repo`.
- [ ] Verify the rewritten tree, commit graph, clone size, and application startup.
- [ ] Force-push only the fork's intended refs.
- [ ] Re-clone or carefully replace the existing local checkout.
- [ ] Remove the `tests/*` ignore-and-whitelist trap.
- [ ] Consolidate runtime data, databases, profiles, cache, and logs under `.runtime/`.
- [ ] Keep generated frontend output and package metadata out of source control.

Exit criteria:

- A fresh clone does not contain `niches/` history.
- All intended tests can be tracked normally.
- Runtime files remain ignored and application behavior is unchanged.

## Phase 3: Narrow, green quality gates

- [ ] Run the current backend test suite in CI.
- [ ] Add Ruff with a deliberately narrow initial rule set.
- [ ] Add Pyright in basic mode, initially scoped to migrated packages.
- [ ] Add Bun lint, typecheck, test, and build jobs where supported.
- [ ] Add fixture secret scanning for JWTs, cookies, signed URLs, and known credential patterns.
- [ ] Preserve the existing Docker and storage-contract workflows.

Exit criteria:

- Every required CI check is green when introduced.
- CI failures are actionable and not accepted as permanent background noise.

## Phase 4: Atomic package and application layout migration

This is one migration phase but may use several reviewable commits.

- [ ] Move files without behavioral changes.
- [ ] Rename the Python import package from `src` to `flow2api`.
- [ ] Introduce the `apps/`, `packages/`, and `infra/` layout.
- [ ] Add a root Bun workspace for the web application and extensions.
- [ ] Rewrite Python and TypeScript imports.
- [ ] Update all Dockerfiles, Compose files, CI workflows, scripts, and documentation.
- [ ] Keep `uv run setup` and `uv run flow2api` unchanged from the user's perspective.

Exit criteria:

- Fresh setup and startup succeed.
- Existing tests pass.
- Docker build contexts resolve correctly.
- No feature behavior changes are included.

## Phase 5: Characterization coverage

- [ ] Freeze representative OpenAI-compatible HTTP contracts.
- [ ] Cover streaming and non-streaming generation responses.
- [ ] Cover token import, refresh, project selection, and cache behavior.
- [ ] Capture SQLite and PostgreSQL state transitions at repository seams.
- [ ] Model extension worker registration, routing, reconnect, CAPTCHA, refresh, and generation as sanitized event transcripts.
- [ ] Add a sanitizer test that rejects sensitive fixture content.

Exit criteria:

- The seams modified in later phases have deterministic contract coverage.
- Fixtures contain no real account or authentication data.

## Phase 6: Split HTTP transport

- [ ] Divide the admin router into auth, tokens, projects, API keys, workers, cache, settings, logs, Runway, and GeminiGen routers.
- [ ] Divide public routes into OpenAI, Gemini, projects, media/cache, extensions, and provider-specific routers.
- [ ] Keep paths, methods, status codes, headers, streaming format, and payloads unchanged.
- [ ] Compare OpenAPI output before and after the move.

Exit criteria:

- Contract tests and OpenAPI compatibility checks pass.
- Route modules depend on application services rather than implementing core behavior.

## Phase 7: Explicit application composition

- [ ] Add an `AppContainer` containing application dependencies.
- [ ] Expose dependencies through small FastAPI dependency functions.
- [ ] Move startup and shutdown orchestration into bootstrap modules.
- [ ] Manage recurring background work through a task registry.
- [ ] Remove module globals and `set_dependencies()`-style initialization.
- [ ] Avoid introducing new service-locator singletons.

Exit criteria:

- Tests can construct isolated application containers.
- Initialization order is explicit.
- Startup, shutdown, and worker reconnect tests pass.

## Phase 8: Persistence and migration baseline

- [ ] Extract repositories for accounts, projects, API keys, cache, request logs, and workers.
- [ ] Define and test behavioral parity between SQLite and PostgreSQL implementations.
- [ ] Add ordered SQL migrations for both database engines.
- [ ] Add a shared `schema_migrations` table and migration runner.
- [ ] Define an existing-schema validator.
- [ ] Stamp validated existing databases at the baseline without recreating tables.
- [ ] Apply the full baseline normally for new databases.
- [ ] Document backup, failure recovery, and rollback expectations.

Exit criteria:

- A fresh database initializes correctly on both engines.
- A copy of a pre-migration database upgrades correctly.
- Partial or incompatible schemas fail with a clear diagnostic.

## Phase 9: Core decomposition

- [ ] Split extension worker WebSocket handling, registry, routing, CAPTCHA jobs, refresh jobs, and generation jobs.
- [ ] Split personal/browser worker pools, sessions, tabs, policies, CAPTCHA, and refresh behavior.
- [ ] Split `FlowClient` into shared transport plus auth, projects, images, videos, and model resources.
- [ ] Split `generation_handler` into an orchestrator and explicit generation pipelines.
- [ ] Separate static deployment settings from mutable database-backed operational settings.
- [ ] Introduce abstractions only where multiple implementations or test seams justify them.

Exit criteria:

- Characterization tests continue to pass.
- No replacement god module is introduced.
- Worker mode behavior remains compatible with the current extension.

## Phase 10: Frontend and extension modernization

- [ ] Organize the admin frontend by feature.
- [ ] Generate TypeScript API contracts from the backend OpenAPI document.
- [ ] Add frontend query and component tests around high-risk workflows.
- [ ] Convert the CAPTCHA extension from JavaScript to TypeScript incrementally.
- [ ] Separate extension storage, API, WebSocket, account-sync, and worker-mode state machines.
- [ ] Share only stable API, WebSocket, and storage primitives through `extension-core`.

Exit criteria:

- Frontend and extension builds are reproducible through Bun.
- Worker modes and account import/refresh flows have automated coverage.
- Backend and frontend contract types are generated from one source.

## Phase 11: Final verification and release preparation

- [ ] Run all unit, integration, characterization, typecheck, lint, and build jobs.
- [ ] Test a completely fresh local installation.
- [ ] Test an upgrade using a copy of a pre-refactor database.
- [ ] Manually verify image/video generation, project selection, cache delivery, account import, token refresh, and all extension worker modes.
- [ ] Verify standard and headed Docker builds.
- [ ] Update README and operational runbooks.
- [ ] Produce a compatibility, migration, and rollback report.

Exit criteria:

- All supported workflows pass.
- Existing users have clear upgrade instructions.
- The migration has a documented rollback boundary.

## Implementation policy

Implementation will proceed one phase at a time. At the end of each phase:

1. Run the phase-specific verification suite.
2. Review the diff for unrelated changes.
3. Confirm `uv run setup` and `uv run flow2api` still work when applicable.
4. Commit and push the completed phase to `main` only after verification.
5. Update this document's checklist and record any deviations from the plan.
