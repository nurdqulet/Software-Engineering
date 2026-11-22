# Smart Campus Room Availability Checker

A small web app that checks whether a campus room can be booked for a requested time interval.
All data is fictional. There is no backend, login or database.

## Run
```bash
npm ci            # install pinned dependencies
npm run dev       # start the dev server
```

## Checks
```bash
npm test          # Vitest unit tests (29 tests)
npm run typecheck # tsc --noEmit
npm run lint      # ESLint
npm run build     # production build into dist/
```

## Structure
- `src/booking.ts` - pure rules: `checkAvailability(room, start, end)` and `checkRequest(room, startText, endText)`
- `src/fixtures.ts` - two sample rooms: A101 (bookable) and B202 (blocked)
- `src/App.tsx` - UI only
- `src/booking.test.ts` - tests
- `AGENTS.md` - rules for AI coding agents
- `REVIEW_CHECKLIST.md` - read-only review checklist for a background agent

## Acceptance criteria (must stay true after any change)
- AC1: reject start >= end, past requests (start must be after 09:00), and times outside 00:00-24:00 (including NaN and fractional values)
- AC2: reject durations longer than 120 minutes (exactly 120 is allowed)
- AC3: reject a blocked room (B202)
- AC4: reject overlaps with an existing booking; touching endpoints are allowed
- AC5: never mutate booking data
- AC6: clear Available / Unavailable feedback on desktop and mobile

## Known limitations
- `CURRENT_TIME` is a fixed value (09:00) in `src/booking.ts`
- No CI, no formatter, no automated UI tests
