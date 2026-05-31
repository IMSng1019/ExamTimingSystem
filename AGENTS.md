# Repository Guidelines

## Project Structure & Module Organization

- `apps/frontend/` contains the React UI, styles, and browser-side API wrapper.
- `apps/backend/` contains the Nest.js API for config storage, validation, and audio file access.
- `apps/electron/` contains the Electron main process and preload bridge.
- `packages/shared/` contains shared types, date/time helpers, default config, and timer logic.
- `dist/` is the build output. `data/` stores runtime files such as `config.json` and `electron.log`.

## Build, Test, and Development Commands

- `npm test` runs Vitest across shared and backend tests.
- `npm run build` builds shared, backend, frontend, and Electron in sequence.
- `npm run dev` starts the Vite frontend, builds/runs the backend, and launches Electron locally.
- `npm run build:frontend`, `npm run build:backend`, `npm run build:electron` are available for targeted checks.

## Coding Style & Naming Conventions

- Use TypeScript throughout. Prefer explicit types for shared data and API payloads.
- Keep formatting simple and consistent: 2-space indentation, double quotes, and semicolons.
- Use `camelCase` for functions/variables, `PascalCase` for React components and types, and `kebab-case` only for file names when the platform expects it.
- Keep UI logic in `apps/frontend/src/App.tsx` and move reusable date/time behavior into `packages/shared/src/`.

## Testing Guidelines

- Vitest is the test runner.
- Put unit tests beside the code they cover, using `*.test.ts` naming.
- Focus tests on timer math, config validation, and other pure logic first.
- Run `npm test` before claiming a change is complete.

## Security & Configuration Tips

- Do not hardcode user paths. Read them from config or Electron dialogs.
- Treat imported JSON as untrusted input; validate before saving or applying it.
- Audio file access should stay inside the selected directory.

## Agent-Specific Instructions

- Preserve the current local desktop architecture: Electron owns the window, React renders the UI, Nest serves local APIs, and `packages/shared/` holds shared logic.
- Keep changes scoped. Avoid unrelated refactors unless they are needed to make the app build or run.
