# Sanitized test fixtures

Only deterministic, synthetic fixtures belong here. Never copy production HTTP
captures, browser storage, Google cookies, session tokens, API keys, CAPTCHA
payloads, or signed media URLs into this directory.

Use obvious placeholders for identifiers and redact authentication fields before
committing a fixture. The test suite scans this directory and
`apps/api/tests/contracts/`
for common credential patterns.
