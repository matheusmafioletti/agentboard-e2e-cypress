# AgentBoard — E2E Tests (Cypress)

Cypress E2E tests for AgentBoard with `@cypress/grep` tag filtering.

## Prerequisites

- Node.js 20 LTS
- Docker Compose v2 (for `@local` / `ENVIRONMENT=e2e`)
- GHCR read access

## Setup

```bash
npm ci
```

## Running Tests

| Command | Description |
|---------|-------------|
| `npm test` | All specs |
| `npm run test:local` | `@local` specs via compose (`ENVIRONMENT=e2e`) |
| `npm run test:staging` | `@staging` smoke against demo |
| `npm run test:open` | Cypress interactive mode |

### Full stack

```bash
# from workspace root
./scripts/run-e2e-local.sh cypress [--reset]
```

## Environment presets

| `ENVIRONMENT` | Base URL |
|---------------|----------|
| `local` | `http://localhost:5173` |
| `e2e` | `http://localhost:8080` |
| `staging` | Demo URL via `BASE_URL` |

Tags: `{ tags: '@local' }` on each `it()`. Filter via `TEST_TAGS` / `grepTags`.

## CI

Same orchestration as Playwright — see [Playwright README](../agentboard-e2e-playwright/README.md#ci).

## Secrets

`GHCR_READ_TOKEN`, `E2E_STAGING_USER_*`, `vars.BASE_URL`.
