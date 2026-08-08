# Contract fixtures

These sanitized fixtures freeze behavior at seams that later architecture phases will move.

- `openapi.json` is the complete deterministic FastAPI schema. Regenerate it only for an intentional public API change with `uv run python scripts/update_contract_snapshots.py`.
- `storage-state.json` is shared by the SQLite and PostgreSQL repository contract tests.
- `extension-worker-registration.json` and `extension-worker-jobs.json` describe the extension WebSocket protocol without real credentials or account data.

`test_fixture_safety.py` scans this directory for credential-shaped content. Keep all examples synthetic.
