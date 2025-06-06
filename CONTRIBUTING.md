# Continuous Integration for Smart Study React

This project uses robust unit, E2E, and accessibility tests. All new features and bugfixes should be validated in CI before merging.

## Running Tests Locally

- **Unit & Accessibility Tests:**
  ```sh
  npm test
  ```
- **E2E Tests (Playwright):**
  ```sh
  npx playwright test
  ```

## Accessibility Requirements

- All interactive components (modals, buttons, badge cards, etc.) must:
  - Have unique `data-testid` attributes for E2E and unit tests.
  - Use correct ARIA roles and attributes (e.g., `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`).
  - Be fully keyboard accessible (tab order, focus trap, Escape to close, etc.).
  - Pass `jest-axe` and Playwright accessibility checks in all states (normal, loading, error, empty).
  - Provide visually hidden labels for screen readers where needed (e.g., `.sr-only`).

## CI Workflow Example (GitHub Actions)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test -- --ci --coverage
      - run: npx playwright install --with-deps
      - run: npx playwright test
```

## Adding New Tests

- Use `@testing-library/react` for unit and accessibility tests.
- Use Playwright for E2E and accessibility snapshot tests.
- Always test error, loading, and empty states.
- Document any new `data-testid` conventions in this file.

## Example Test Selectors

- `data-testid="badge-earned-<badgeId>"` for earned badge cards
- `data-testid="analytics-btn-header"` for analytics modal open button
- `role="alert"` for error boundary fallback UI
- `role="dialog"` for modals

## Contributing

- All code must pass lint, unit, E2E, and accessibility tests before merging.
- See this file for test and accessibility conventions.
