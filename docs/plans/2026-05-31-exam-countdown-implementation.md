# Exam Countdown Desktop App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local Electron desktop app with React, Nest.js, and TypeScript for exam countdown display, settings, file import/export, subject schedules, and audio bell rules.

**Architecture:** Electron owns the desktop window and native dialogs, starts the local Nest backend, and loads the React UI. React renders the restored blue countdown display and settings UI. Nest stores configuration, validates payloads, scans audio directories, and streams selected audio files.

**Tech Stack:** Electron, React, Vite, Nest.js, TypeScript, Vitest, Node.js file system APIs.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `apps/frontend/index.html`
- Create: `apps/frontend/tsconfig.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/electron/tsconfig.json`

**Steps:**

1. Add root npm scripts for `dev`, `build`, `test`, `start`, frontend build, backend build, and electron build.
2. Add dependencies for Electron, Vite, React, Nest, TypeScript, tsx, concurrently, cross-env, and Vitest.
3. Add TypeScript configs for each app.
4. Verify `npm install` succeeds.

### Task 2: Shared Types and Defaults

**Files:**
- Create: `shared/src/types.ts`
- Create: `shared/src/default-config.ts`
- Create: `shared/src/time.ts`
- Create: `shared/src/timer.ts`
- Create: `shared/src/timer.test.ts`

**Steps:**

1. Define config, subject, text, and bell rule types.
2. Define default text, subjects, schedule generation, selected subjects, and default bell rules.
3. Implement local datetime parsing, display formatting, schedule merging, status calculation, remaining text, and bell target calculation.
4. Write Vitest cases for before-start, during-exam, after-end, merged multi-subject schedule, and bell target offsets.
5. Run `npm test` and fix failures.

### Task 3: Nest Backend

**Files:**
- Create: `apps/backend/src/main.ts`
- Create: `apps/backend/src/app.module.ts`
- Create: `apps/backend/src/config/config.controller.ts`
- Create: `apps/backend/src/config/config.service.ts`
- Create: `apps/backend/src/config/config.validation.ts`
- Create: `apps/backend/src/audio/audio.controller.ts`
- Create: `apps/backend/src/audio/audio.service.ts`

**Steps:**

1. Start Nest on `127.0.0.1:3099` with CORS enabled.
2. Store runtime config in `data/config.json`, creating defaults on first run.
3. Add `GET /api/config`, `PUT /api/config`, and `POST /api/config/validate`.
4. Add `GET /api/audio/files?directory=...` and `GET /api/audio/file?directory=...&name=...`.
5. Restrict audio file listing to common audio extensions and block path traversal.
6. Run backend build.

### Task 4: Electron Main and Preload

**Files:**
- Create: `apps/electron/src/main.ts`
- Create: `apps/electron/src/preload.ts`
- Create: `apps/frontend/src/global.d.ts`

**Steps:**

1. Create a maximized BrowserWindow with preload script and autoplay enabled.
2. In development, spawn `npm run dev:backend` and wait for `http://127.0.0.1:3099/api/config`.
3. Load Vite dev server in development and `dist/frontend/index.html` in production.
4. Expose preload APIs for selecting audio directory, saving JSON config, and opening JSON config.
5. Kill the backend child process when Electron exits.

### Task 5: React API and App State

**Files:**
- Create: `apps/frontend/src/main.tsx`
- Create: `apps/frontend/src/api.ts`
- Create: `apps/frontend/src/App.tsx`

**Steps:**

1. Load config from Nest on startup.
2. Save config changes through Nest.
3. Use Electron preload APIs for folder selection and config import/export.
4. Keep a one-second ticking clock.
5. Reset ring trigger memory when schedules or bell rules change.

### Task 6: Countdown Display and Settings UI

**Files:**
- Create: `apps/frontend/src/styles.css`

**Steps:**

1. Implement the full-screen blue display matching the reference image: centered title, metadata rows, huge current time, remaining text, and footer.
2. Add `Esc` handling to open/close settings.
3. Add direct subject click multi-select panel.
4. Build settings sections for display text, subject schedules, selected subjects, audio directory, bell rules, and import/export.
5. Ensure text wraps cleanly and the layout remains stable across window sizes.

### Task 7: Audio Playback

**Files:**
- Modify: `apps/frontend/src/App.tsx`

**Steps:**

1. Trigger default rules at exam start, exam end, 15 minutes before start, and 5 minutes before start.
2. For rules with audio files, play via the Nest audio streaming endpoint.
3. For rules without audio files, play a generated bell tone with Web Audio.
4. Ensure each rule fires once for the current exam window.

### Task 8: Verification

**Commands:**
- `npm install`
- `npm test`
- `npm run build`
- `npm run dev`

**Expected Results:**

1. Dependencies install.
2. Timer tests pass.
3. Frontend, backend, and Electron TypeScript builds pass.
4. Electron window launches locally.
5. Main page displays the restored countdown UI.
6. `Esc` opens settings.
7. Config export/import works.
8. Audio folder selection lists playable audio files.
