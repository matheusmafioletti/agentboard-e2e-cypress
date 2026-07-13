# agentboard-e2e-cypress

[![E2E Tests — Cypress](https://github.com/your-org/agentboard-e2e-cypress/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/agentboard-e2e-cypress/actions/workflows/ci.yml)

Cypress E2E test suite for the [AgentBoard](https://github.com/your-org/agentboard) multi-tenant Kanban system.

---

## Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Cypress | 13.x | E2E runner + Component Testing |
| TypeScript | 5.4 | Strict typings for all test files |
| @testing-library/cypress | 10.x | Semantic queries (`findByRole`, `findByLabelText`) |
| eslint-plugin-cypress | 2.x | Enforce Cypress best practices |

---

## Setup local

### Prerequisites

- Node.js 20 LTS
- AgentBoard services running locally (frontend + auth-service + board-service)

### Install

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env
# Edit .env with your local URLs if they differ from defaults
```

Default endpoints:

| Service | URL |
|---------|-----|
| Frontend (React/Vite) | `http://localhost:5173` |
| auth-service | `http://localhost:8080` |
| board-service | `http://localhost:8081` |

---

## Running tests

```bash
# Open Cypress interactive runner
npm run test:open

# Run all E2E tests headlessly
npm run test:e2e

# Run component tests headlessly (see cypress/component/README.md)
npm run test:component

# Run all tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck
```

---

## Key patterns

### `cy.session()` — cached login

The `cy.login()` custom command uses `cy.session()` to cache the authenticated session across
tests. Cypress replays the session from cache on subsequent calls instead of re-executing the
full UI login flow, which significantly reduces test runtime.

```typescript
// In your test:
beforeEach(() => {
  cy.login('alice@test.com', 'secret123');
  cy.visit('/board');
});
```

Session is keyed by `[email, password]` — changing credentials busts the cache automatically.

### API setup via `testData` service

When a test needs authenticated state or seed data but the setup flow itself is not under test,
use the `testData` singleton from `cypress/api/services/TestDataService.ts`. This bypasses UI
forms for fast, deterministic `beforeEach` hooks.

```typescript
import { testData } from '../../api/services/TestDataService';
import { setAuthInLocalStorage } from '../../support/browser';
import { generateEmail, generateTenantName } from '../../support/generators';

const user = testData.createAuthenticatedUser(email, password, generateTenantName());
testData.createProject(user.jwt, user.tenantId, 'My Project');
setAuthInLocalStorage(user.jwt, { userId: user.userId, email, tenantId: user.tenantId, tenantName, role: user.role });
```

### Semantic queries with `@testing-library/cypress`

All selectors use `@testing-library/cypress` queries. This ties tests to accessibility semantics
rather than CSS classes or implementation-specific `data-cy` attributes.

```typescript
// Preferred
cy.findByLabelText(/email/i).type('alice@test.com');
cy.findByRole('button', { name: /entrar/i }).click();

// Avoid
cy.get('[data-cy="login-btn"]').click();   // too implementation-specific
cy.get('.btn-primary').click();            // breaks on style changes
```

### No `cy.wait(n)` hardcoded

Never use `cy.wait(milliseconds)`. Cypress automatically retries assertions until they pass or
the timeout is reached. Use assertions that naturally wait:

```typescript
// Correct — retries automatically
cy.findByText('Implement authentication').should('be.visible');
cy.url().should('include', '/board');

// Wrong — brittle and slow
cy.wait(2000);
cy.get('.work-item').first().should('be.visible');
```

---

## Architecture

### API Clients & Test Data Service (`cypress/api/`)

HTTP calls are organized into service-specific clients that read base URLs from `support/environment.ts`:

| Layer | Path | Responsibility |
|---|---|---|
| `BaseApiClient` | `api/clients/BaseApiClient.ts` | Shared `cy.request`, JSON headers, error handling |
| `AuthApiClient` | `api/clients/AuthApiClient.ts` | Register, login, tenants, invites |
| `BoardApiClient` | `api/clients/BoardApiClient.ts` | Projects, work-items |
| `TestDataService` | `api/services/TestDataService.ts` | High-level test setup workflows |

Domain types live in `api/types/` (`auth.types.ts`, `board.types.ts`). Generators and browser
helpers remain in `support/generators.ts` and `support/browser.ts`.

Custom commands in `support/commands.ts` are limited to UI interactions (`cy.login`, `cy.createWorkItem`).
All API setup goes through `testData` imports in spec files.

---

## Project structure

```
cypress/
├── api/
│   ├── clients/
│   │   ├── BaseApiClient.ts
│   │   ├── AuthApiClient.ts
│   │   └── BoardApiClient.ts
│   ├── services/
│   │   └── TestDataService.ts
│   └── types/
│       ├── auth.types.ts
│       └── board.types.ts
├── e2e/
│   ├── auth/
│   │   ├── login.cy.ts
│   │   ├── register.cy.ts
│   │   └── session.cy.ts
│   ├── board/
│   │   └── kanban-flow.cy.ts
│   ├── items/
│   ├── navigation/
│   ├── projects/
│   └── users/
├── component/
│   └── README.md             # components tested in agentboard-web repo
├── support/
│   ├── browser.ts            # setAuthInLocalStorage
│   ├── commands.ts           # cy.login, cy.createWorkItem (UI only)
│   ├── environment.ts        # local/staging URL resolution
│   ├── generators.ts         # generateEmail, generateTenantName
│   ├── e2e.ts                # e2e support entry (imports commands)
│   └── component.ts          # component testing support (mount)
├── fixtures/
│   ├── user.json
│   └── work-item.json
└── downloads/
    └── .gitkeep
```

### Component Testing

Cypress Component tests live alongside their components in `repos/agentboard-web`. See
[`cypress/component/README.md`](cypress/component/README.md) for details.

---

## CI

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and PR to `main`:

1. Install dependencies
2. Lint (`eslint`)
3. Type check (`tsc --noEmit`)
4. Run E2E tests with Chrome via `cypress-io/github-action@v6`
5. Upload screenshots (on failure) and videos (always) as artifacts

The workflow supports `workflow_dispatch` with an optional `spec` input to run a subset of specs:

```
spec: cypress/e2e/auth/**
```
