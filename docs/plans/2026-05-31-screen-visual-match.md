# Exam Screen Visual Match Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tune the main exam countdown screen so its typography and spacing more closely match the supplied reference photo.

**Architecture:** Keep the existing React component and runtime configuration unchanged. Add a focused CSS regression test for the calibrated selectors, then adjust only `apps/frontend/src/styles.css`.

**Tech Stack:** React, Vite, TypeScript, Vitest, CSS.

---

### Task 1: Lock Main Screen CSS Calibration

**Files:**
- Create: `apps/frontend/src/styles.test.ts`
- Modify: `apps/frontend/src/styles.css`

**Step 1: Write the failing test**

Add a Vitest test that reads `styles.css` and verifies the main screen selectors contain the calibrated font families, positions, sizes, and information-line spacing.

**Step 2: Run test to verify it fails**

Run: `npm test -- apps/frontend/src/styles.test.ts`

Expected: FAIL because the current CSS still uses the previous title, meta, subject, and clock calibration.

**Step 3: Write minimal implementation**

Adjust only `.display h1`, `.meta`, `.meta span`, `.subject-line`, `.subject-line strong`, `.subject-line em`, `.clock`, and related divider positions in `styles.css`.

**Step 4: Run tests and build**

Run:

```bash
npm test -- apps/frontend/src/styles.test.ts
npm test
npm run build
```

Expected: all commands exit 0.
