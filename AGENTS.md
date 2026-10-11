# Repository Guidelines

## Project Structure & Module Organization

This repository is currently a scaffold for a TypeScript to-do application backed by SQLite and rendered with HTMX. As code is added, keep application logic under `src/`, grouped by responsibility: `src/routes/` for HTTP endpoints, `src/services/` for business rules, `src/db/` for schema and persistence, and `src/views/` for HTML templates. Put browser assets in `public/`. Mirror source modules in `tests/` (for example, `src/services/todos.ts` should be covered by `tests/services/todos.test.ts`). Keep migrations in `migrations/`; never commit generated databases.

## Build, Test, and Development Commands

Use the Node version declared in `.nvmrc`:

- `nvm use` selects the repository's Node.js version.
- `npm install` installs dependencies once `package.json` is introduced.
- `npm run dev` should start the local server with TypeScript watch/reload support.
- `npm run build` should type-check and compile production output to `dist/`.
- `npm test` should run the complete automated test suite.
- `npm run lint` should run formatting and static-analysis checks.

There are no package scripts yet. When adding tooling, expose it through these conventional script names and document any environment setup in `README.md`.

## Coding Style & Naming Conventions

Use TypeScript in strict mode, two-space indentation, semicolons, and single quotes unless the chosen formatter says otherwise. Prefer small modules and explicit types at API and database boundaries. Name files with lowercase kebab-case (`todo-service.ts`), variables and functions with `camelCase`, and types/classes with `PascalCase`. Use `SCREAMING_SNAKE_CASE` only for true constants. Add Prettier and ESLint configuration with the first implementation; do not mix formatting-only changes with functional work.

## Testing Guidelines

Choose one TypeScript-aware runner (Vitest is preferred) and name tests `*.test.ts`. Cover success, validation, not-found, and database-failure paths for every REST operation. Use isolated temporary SQLite databases so tests never depend on or modify developer data. Every bug fix should include a regression test.

## Commit & Pull Request Guidelines

The repository has no commit history yet. Use imperative Conventional Commits such as `feat: add todo creation endpoint` or `fix: validate planned date order`. Keep commits focused. Pull requests should describe behavior changes, list verification commands, link relevant issues, and include screenshots for HTMX/UI changes. Call out schema migrations or configuration changes prominently.

## Security & Configuration

Keep secrets and local database files out of version control. Provide safe defaults in `.env.example`, validate all request input, use parameterized SQLite queries, and avoid returning internal errors or stack traces to clients.
