import { describe, it, expect } from 'vitest';
import {
  checkAvailability,
  checkRequest,
  type Room,
  type Booking,
} from '@/booking';
import { ROOMS } from '@/fixtures';

function makeRoom(overrides: Partial<Room> = {}): Room {
  const defaultBookings: Booking[] = [{ start: 600, end: 660 }];
  return {
    id: 'A101',
    name: 'Room A101',
    blocked: false,
    bookings: defaultBookings.map((b) => ({ ...b })),
    ...overrides,
  };
}

function deepCopyBookings(bookings: Booking[]): Booking[] {
  return bookings.map((b) => ({ ...b }));
}

describe('checkAvailability', () => {
  it('T01: 660–720, no overlap, within max duration — available', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 660, 720);
    expect(result.status).toBe('available');
  });

  it('T02: 540–570, start equals CURRENT_TIME — unavailable (AC1)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 540, 570);
    expect(result.status).toBe('unavailable');
  });

  it('T03: 720–720, start equals end — unavailable (AC1)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 720, 720);
    expect(result.status).toBe('unavailable');
  });

  it('T04: 750–720, start after end — unavailable (AC1)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 750, 720);
    expect(result.status).toBe('unavailable');
  });

  it('T05: 1380–1441, end exceeds MINUTES_PER_DAY — unavailable (AC1)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 1380, 1441);
    expect(result.status).toBe('unavailable');
  });

  it('T06: 720–840, exactly 120 min duration — available (AC2)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 720, 840);
    expect(result.status).toBe('available');
  });

  it('T07: 720–841, duration 121 min exceeds max — unavailable (AC2)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 720, 841);
    expect(result.status).toBe('unavailable');
  });

  it('T08: 570–600, touching start of existing booking — available (AC4)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 570, 600);
    expect(result.status).toBe('available');
  });

  it('T09: 630–690, overlaps existing booking — unavailable (AC4)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 630, 690);
    expect(result.status).toBe('unavailable');
  });

  it('T10: 570–690, overlaps existing booking — unavailable (AC4)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 570, 690);
    expect(result.status).toBe('unavailable');
  });

  it('T11: 615–645, fully inside existing booking — unavailable (AC4)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 615, 645);
    expect(result.status).toBe('unavailable');
  });

  it('T12: 600–660, exactly matches existing booking — unavailable (AC4)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 600, 660);
    expect(result.status).toBe('unavailable');
  });

  it('T13: 660–720, blocked room — unavailable (AC3)', () => {
    const room = makeRoom({ blocked: true });
    const result = checkAvailability(room, 660, 720);
    expect(result.status).toBe('unavailable');
  });

  it('T14: 630–690, no bookings — available (AC4)', () => {
    const room = makeRoom({ bookings: [] });
    const result = checkAvailability(room, 630, 690);
    expect(result.status).toBe('available');
  });

  it('T15: sequential checks preserve booking data (AC5)', () => {
    const room = makeRoom();
    const savedBookings = deepCopyBookings(room.bookings);

    const result1 = checkAvailability(room, 660, 720);
    expect(result1.status).toBe('available');
    expect(room.bookings).toEqual(savedBookings);

    const result2 = checkAvailability(room, 630, 690);
    expect(result2.status).toBe('unavailable');
    expect(room.bookings).toEqual(savedBookings);
  });

  it('T16: 1380–1440, end at MINUTES_PER_DAY — available (AC1)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 1380, 1440);
    expect(result.status).toBe('available');
  });

  it('T17: 539–570, start before CURRENT_TIME — unavailable (AC1)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 539, 570);
    expect(result.status).toBe('unavailable');
  });

  it('T18: 810–870, overlaps second of multiple bookings — unavailable (AC4)', () => {
    const room = makeRoom({
      bookings: [
        { start: 600, end: 660 },
        { start: 780, end: 840 },
      ],
    });
    const result = checkAvailability(room, 810, 870);
    expect(result.status).toBe('unavailable');
  });

  it('T19: 541–542, start one minute after CURRENT_TIME — available (AC1)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 541, 542);
    expect(result.status).toBe('available');
  });

  it('T27: NaN start and end — unavailable (R1)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, NaN, NaN);
    expect(result.status).toBe('unavailable');
  });

  it('T28: Infinity end — unavailable (R1)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 600, Infinity);
    expect(result.status).toBe('unavailable');
  });

  it('T29: fractional minutes 700.5–760 — unavailable (R1)', () => {
    const room = makeRoom();
    const result = checkAvailability(room, 700.5, 760);
    expect(result.status).toBe('unavailable');
  });
});

describe('checkRequest (text input -> verdict)', () => {
  it('T20: malformed start text — unavailable with format message', () => {
    const result = checkRequest(makeRoom(), 'abc', '11:30');
    expect(result.status).toBe('unavailable');
    expect(result.message).toMatch(/HH:MM/);
  });

  it('T21: malformed end text — unavailable with format message', () => {
    const result = checkRequest(makeRoom(), '10:30', '25:00');
    expect(result.status).toBe('unavailable');
    expect(result.message).toMatch(/HH:MM/);
  });

  it('T22: valid text 10:30–11:30 on overlapping room — same verdict as numbers (AC4)', () => {
    const room = makeRoom();
    expect(checkRequest(room, '10:30', '11:30')).toEqual(
      checkAvailability(room, 630, 690)
    );
  });

  it('T23: end text 24:00 is accepted as end of day (AC1)', () => {
    const result = checkRequest(makeRoom(), '23:00', '24:00');
    expect(result.status).toBe('available');
  });

  it('T24: reversed text interval 12:00–11:00 — unavailable (AC1)', () => {
    expect(checkRequest(makeRoom(), '12:00', '11:00').status).toBe('unavailable');
  });
});

describe('fixtures', () => {
  it('T25: sample rooms are unchanged and not mutated by checks (AC5)', () => {
    const before = JSON.parse(JSON.stringify(ROOMS));
    checkRequest(ROOMS[0], '10:30', '11:30');
    checkRequest(ROOMS[1], '12:00', '13:00');
    expect(ROOMS).toEqual(before);
    expect(ROOMS[0].bookings).toEqual([{ start: 600, end: 660 }]);
    expect(ROOMS[1].blocked).toBe(true);
  });

  it('T26: B202 sample room is blocked (AC3)', () => {
    expect(checkRequest(ROOMS[1], '12:00', '13:00').status).toBe('unavailable');
  });
});
