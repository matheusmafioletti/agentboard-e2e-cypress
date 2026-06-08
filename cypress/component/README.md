# Component Tests

Component tests for AgentBoard live in the **`agentboard-web`** repository alongside the source
components, not here.

## Why?

Cypress Component Testing requires the component source, Vite config, and Tailwind CSS setup to be
co-located. Moving test files here would require duplicating the entire build configuration.

## Where to find them

```
repos/agentboard-web/src/components/
├── board/
│   ├── WorkItemBoard.cy.tsx
│   ├── WorkItemCard.cy.tsx
│   ├── WorkItemColumn.cy.tsx
│   └── CreateWorkItemModal.cy.tsx
└── auth/
    ├── LoginPage.cy.tsx
    └── RegisterPage.cy.tsx
```

## Running component tests from agentboard-web

```bash
cd repos/agentboard-web
npx cypress open --component
# or
npx cypress run --component
```
