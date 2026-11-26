export const CURRENT_TIME = 540; // 09:00 in minutes
export const MAX_INTERVAL = 120; // maximum allowed booking length in minutes
export const MINUTES_PER_DAY = 1440;

export interface Booking {
  start: number;
  end: number;
}

export interface Room {
  id: string;
  name: string;
  blocked: boolean;
  bookings: Booking[];
}

export type Verdict =
  | { status: 'available'; message: string }
  | { status: 'unavailable'; message: string };

export function minutesToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function hhmmToMinutes(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function endTimeToMinutes(hhmm: string): number | null {
  if (hhmm.trim() === '24:00') return MINUTES_PER_DAY;
  return hhmmToMinutes(hhmm);
}

export function intervalsOverlap(a: Booking, b: Booking): boolean {
  // Touching endpoints are allowed, so strict inequality
  return a.start < b.end && b.start < a.end;
}

export function checkAvailability(
  room: Room,
  start: number,
  end: number
): Verdict {
  // R1: reject non-integer or non-finite inputs before any comparison
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    return {
      status: 'unavailable',
      message: 'The interval is invalid. Start must be earlier than end, and both must be within 00:00–24:00.',
    };
  }
  // AC1: 0 ≤ start < end ≤ 1440, start strictly after current time
  if (start < 0 || end > MINUTES_PER_DAY || start >= end) {
    return {
      status: 'unavailable',
      message: 'The interval is invalid. Start must be earlier than end, and both must be within 00:00–24:00.',
    };
  }
  if (start <= CURRENT_TIME) {
    return {
      status: 'unavailable',
      message: `Start time must be strictly after the current time (${minutesToHHMM(CURRENT_TIME)}).`,
    };
  }

  // AC2: Reject intervals longer than 120 minutes (exactly 120 is OK)
  const duration = end - start;
  if (duration > MAX_INTERVAL) {
    return {
      status: 'unavailable',
      message: `The interval is ${duration} minutes, which exceeds the ${MAX_INTERVAL}-minute maximum.`,
    };
  }

  // AC3: Reject if room is blocked
  if (room.blocked) {
    return {
      status: 'unavailable',
      message: `${room.name} is currently blocked and cannot be booked.`,
    };
  }

  // AC4: Reject overlapping bookings (touching endpoints allowed)
  const candidate: Booking = { start, end };
  const overlap = room.bookings.find((b) => intervalsOverlap(b, candidate));
  if (overlap) {
    return {
      status: 'unavailable',
      message: `The requested time overlaps an existing booking (${minutesToHHMM(overlap.start)}–${minutesToHHMM(overlap.end)}).`,
    };
  }

  return {
    status: 'available',
    message: `${room.name} is available from ${minutesToHHMM(start)} to ${minutesToHHMM(end)} (${duration} min).`,
  };
}

// Parses the two text fields from the form and runs the availability rule.
// Pure: no React, no state. Keeps UI free of validation logic.
export function checkRequest(
  room: Room,
  startText: string,
  endText: string
): Verdict {
  const start = hhmmToMinutes(startText);
  const end = endTimeToMinutes(endText);

  if (start === null || end === null) {
    return {
      status: 'unavailable',
      message: 'Please enter valid times in HH:MM format (e.g. 10:30).',
    };
  }
  return checkAvailability(room, start, end);
}

// ─── Duration-based contract ────────────────────────────────────────────────
// The UI collects a start time + duration (minutes) instead of an end time.
// end = start + duration. Duration validation happens before the core
// availability rules so INVALID_DURATION / DURATION_TOO_LONG are distinct.

export type DurationReasonCode =
  | 'AVAILABLE'
  | 'OVERLAP'
  | 'BLOCKED'
  | 'INVALID_DURATION'
  | 'DURATION_TOO_LONG'
  | 'PAST_START'
  | 'INVALID_INPUT';

export interface DurationVerdict {
  available: boolean;
  reasonCode: DurationReasonCode;
  message: string;
}

// Parses a duration string into a whole, positive number of minutes.
// Returns null for empty, non-numeric, fractional, zero, or negative values.
export function parseDuration(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num <= 0) return null;
  return num;
}

// Converts a DurationVerdict back to the core Verdict shape so the
// explain adapter (which expects Verdict) keeps working unchanged.
export function durationVerdictToVerdict(dv: DurationVerdict): Verdict {
  return dv.available
    ? { status: 'available', message: dv.message }
    : { status: 'unavailable', message: dv.message };
}

// Maps the core checker's verdict message to the contract reason code.
function mapReasonCode(verdict: Verdict): DurationReasonCode {
  if (verdict.status === 'available') return 'AVAILABLE';
  const message = verdict.message;
  if (message.includes('strictly after the current time')) return 'PAST_START';
  if (message.includes('blocked')) return 'BLOCKED';
  if (message.includes('overlaps an existing booking')) return 'OVERLAP';
  return 'INVALID_INPUT';
}

// Validates start + duration, computes end, delegates to checkAvailability.
// Pure: no React, no state.
export function checkDurationRequest(
  room: Room,
  startText: string,
  durationText: string
): DurationVerdict {
  const start = hhmmToMinutes(startText);
  if (start === null) {
    return {
      available: false,
      reasonCode: 'INVALID_INPUT',
      message: 'Please enter a valid start time in HH:MM format (e.g. 12:00).',
    };
  }

  const duration = parseDuration(durationText);
  if (duration === null) {
    return {
      available: false,
      reasonCode: 'INVALID_DURATION',
      message: 'Duration must be a whole number of minutes greater than 0.',
    };
  }

  if (duration > MAX_INTERVAL) {
    return {
      available: false,
      reasonCode: 'DURATION_TOO_LONG',
      message: `Duration is ${duration} minutes, which exceeds the ${MAX_INTERVAL}-minute maximum.`,
    };
  }

  const end = start + duration;
  const verdict = checkAvailability(room, start, end);
  return {
    available: verdict.status === 'available',
    reasonCode: mapReasonCode(verdict),
    message: verdict.message,
  };
}
