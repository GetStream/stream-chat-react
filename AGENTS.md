Guidance for AI coding agents (Copilot, Cursor, Aider, Claude, etc.) working in this repository. Human readers are welcome, but this file is written for tools.

### Repository purpose

This repo hosts Stream’s React Chat SDK. It provides UI component.

Agents should prioritize backwards compatibility, API stability, and high test coverage when changing code.

### Tech & toolchain

- Language: React (Typescript)
- Primary runtime: Node (use the version in .nvmrc via nvm use)
- Testing: Unit/integration: Jest (+ React Testing Library).
- CI: GitHub Actions (assume PR validation on build + tests + lint)
- Lint/format: ESLint + Prettier (configs in repo root)
- Styles: Import Stream styles and override via CSS layers as described in README (don’t edit compiled CSS)
- Release discipline: Conventional Commits + automated release tooling (see commitlint/semantic-release configs).

### Project layout (high level)

- src/ — Components, hooks, contexts, styles, and utilities (library source).
- scripts/ - Scripts run during the build process
- e2e/ — Playwright specs.
- examples/ — Example apps/snippets.
- developers/ — Dev notes & scripts.

Use the closest folder’s patterns and conventions when editing.

### Configurations

Root configs:

- .babelrc.js
- .gitignore
- .lintstagedrc.fix.json
- .lintstagedrc.json
- .nvmrc
- .prettierignore
- .prettierrc
- .releaserc.json
- babel.config.js
- codecov.yml
- commitlint.config.mjs
- eslint.config.mjs,
- i18next.config.ts
- jest.config.js
- jest.config.js
- playwright.config.ts
- tsconfig.json

Respect any repo-specific rules. Do not suppress rules broadly; justify and scope exceptions.

### Runbook (commands)

1. Install dependencies: yarn install
2. Build: yarn build
3. Typecheck: yarn types
4. Lint: yarn lint
5. Fix lint issues: yarn lint-fix
6. Unit tests: yarn test

### General rules

#### Linting & formatting

- Make sure the eslint and prettier configurations are followed. Run before committing:

```
yarn lint-fix
```

#### Commit / PR conventions

- Never commit directly to main, always create a feature branch.
- Keep PRs small and focused; include tests.
- Follow the project’s “zero warnings” policy—fix new warnings and avoid introducing any.
- For UI changes, attach comparison screenshots (before/after) where feasible.
- Ensure public API changes include docs.
- Follow the @.github/pull_request_template.md when opening PRs.

#### Testing policy

Add/extend tests in the matching module’s `__tests__`/ folder.

Cover:

- React components
- React hooks
- Utility functions
- Use fakes/mocks from the test helpers provided by the repo when possible.

#### Docs & samples

- When altering public API, update inline docs and any affected guide pages in the docs site where this repo is the source of truth.
- Keep sample/snippet code compilable.

#### Security & credentials

- Never commit API keys or customer data.
- Example code must use obvious placeholders (e.g., YOUR_STREAM_KEY).
- If you add scripts, ensure they fail closed on missing env vars.

#### When in doubt

- Mirror existing patterns in the nearest module.
- Prefer additive changes; avoid breaking public APIs.
- Ask maintainers (CODEOWNERS) through PR mentions for modules you touch.

---

Quick agent checklist (per commit)

- Build the src
- Run all tests and ensure green
- Run lint commands
- Update docs if public API changed
- Add/adjust tests
- No new warnings

End of machine guidance. Edit this file to refine agent behavior over time; keep human-facing details in README.md and docs.
