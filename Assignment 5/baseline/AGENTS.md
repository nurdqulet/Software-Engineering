# AGENTS.md

## Project
Smart Campus room availability checker; one room is checked at a time, fictional data.
Stack: Vite + React + TypeScript + Tailwind. Path alias `@/` = `src/`.
Structure: `src/booking.ts` (pure rules), `src/fixtures.ts` (sample rooms), `src/App.tsx` (UI only), `src/booking.test.ts` (Vitest).

## Constraints
Preserve AC1–AC6:
- AC1: reject start >= end, past requests (start must be strictly after 09:00), times outside 00:00–24:00.
- AC2: reject durations longer than 120 minutes (exactly 120 is OK).
- AC3: reject a blocked room.
- AC4: reject overlaps; bookings touching only at endpoints are allowed.
- AC5: never mutate booking data.
- AC6: keep clear desktop/mobile UI feedback.
No backend, login, database or saved booking creation. Do not remove the existing UI.

## Engineering rules
Prefer pure functions and minimal changes; use at most 2 justified patterns (or none).
No Singleton, Factory or class hierarchies without a concrete need.
Do not mutate booking fixtures. Do not install new packages.
Do not weaken or delete existing test assertions.

## Verification
Commands: `npm test` (Vitest), `npm run typecheck`, `npm run lint`, `npm run build`.
Run existing tests first, then add focused regression tests.
Report: changed files, rationale (problem -> pattern -> benefit), and test evidence (command + pass/fail counts).