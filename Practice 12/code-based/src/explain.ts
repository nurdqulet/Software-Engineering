import { type Room, type Verdict } from '@/booking';

// ─── Explain availability (MOCK adapter) ────────────────────────────────────
// The explanation below is MOCK-GENERATED from the checker's own verdict.
// There is no AI model, no network call and no API key involved.
// The deterministic checker in src/booking.ts remains the single
// source of truth; this module only rephrases its result.

export type ReasonCode =
  | 'AVAILABLE'
  | 'OVERLAP'
  | 'BLOCKED'
  | 'INVALID'
  | 'PAST'
  | 'TOO_LONG'
  | 'OTHER';

export interface ExplainInput {
  roomLabel: string;
  start: string;
  end: string;
  isAvailable: boolean;
  reasonCode: ReasonCode;
}

export type ExplanationSource = 'generated' | 'fallback';

export interface ExplainOutput {
  explanation: string;
  source?: ExplanationSource;
}

const MAX_ROOM_LABEL_LENGTH = 40;
const MAX_EXPLANATION_LENGTH = 200;
const MAX_EXPLANATION_SENTENCES = 2;
const ADAPTER_TIMEOUT_MS = 3000;
const HHMM_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;

// Maps the deterministic checker's verdict to a reason code.
// Pure: reads only the verdict's status and message text.
export function toReasonCode(verdict: Verdict): ReasonCode {
  if (verdict.status === 'available') return 'AVAILABLE';
  const message = verdict.message;
  if (message.includes('valid times in HH:MM') || message.includes('interval is invalid')) {
    return 'INVALID';
  }
  if (message.includes('strictly after the current time')) return 'PAST';
  if (message.includes('exceeds the')) return 'TOO_LONG';
  if (message.includes('blocked')) return 'BLOCKED';
  if (message.includes('overlaps an existing booking')) return 'OVERLAP';
  return 'OTHER';
}

// Input validation: roomLabel non-empty, at most 40 characters;
// start/end must be HH:MM (end may be 24:00).
export function validateInput(input: ExplainInput): boolean {
  if (typeof input !== 'object' || input === null) return false;
  const { roomLabel, start, end } = input;
  if (typeof roomLabel !== 'string') return false;
  const trimmedLabel = roomLabel.trim();
  if (trimmedLabel.length === 0 || trimmedLabel.length > MAX_ROOM_LABEL_LENGTH) {
    return false;
  }
  if (typeof start !== 'string' || !HHMM_PATTERN.test(start.trim())) return false;
  if (typeof end !== 'string' || !HHMM_PATTERN.test(end.trim())) return false;
  return true;
}

// Output validation: must be { explanation: string }, non-empty,
// at most 200 characters and at most 2 sentences.
export function validateOutput(output: unknown): output is ExplainOutput {
  if (typeof output !== 'object' || output === null) return false;
  const { explanation } = output as { explanation?: unknown };
  if (typeof explanation !== 'string') return false;
  const trimmed = explanation.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_EXPLANATION_LENGTH) return false;
  const sentences = trimmed.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length > 0);
  return sentences.length <= MAX_EXPLANATION_SENTENCES;
}

// MOCK adapter: builds an explanation only from the given input.
// Deterministic, synchronous, and clearly not a real AI service.
export function mockExplain(input: ExplainInput): Promise<ExplainOutput> {
  const code = input.reasonCode;
  let explanation: string;
  switch (code) {
    case 'AVAILABLE':
      explanation = `${input.roomLabel} is free between ${input.start} and ${input.end}.`;
      break;
    case 'OVERLAP':
      explanation = `${input.roomLabel} already has a booking that overlaps ${input.start}–${input.end}. Pick a different time.`;
      break;
    case 'BLOCKED':
      explanation = `${input.roomLabel} is blocked, so no bookings are accepted.`;
      break;
    case 'INVALID':
      explanation = `The requested times ${input.start}–${input.end} are not a valid interval.`;
      break;
    case 'PAST':
      explanation = `The start time ${input.start} is not after the current time. Choose a later start.`;
      break;
    case 'TOO_LONG':
      explanation = `The interval ${input.start}–${input.end} is longer than the allowed maximum.`;
      break;
    default:
      explanation = `${input.roomLabel} is not available for ${input.start}–${input.end}. See the checker's message for details.`;
  }
  return Promise.resolve({ explanation, source: 'generated' });
}

// Deterministic fallback text built from the checker's own message.
function fallbackExplanation(verdict: Verdict): string {
  return `Explanation unavailable. The checker says: ${verdict.message}`;
}

// Orchestrates: validate input → adapter with 3s timeout → validate output.
// Any failure (timeout, adapter error, invalid output, rejected input)
// yields the deterministic fallback built from the checker's verdict.
export async function explainAvailability(
  room: Room,
  startText: string,
  endText: string,
  verdict: Verdict,
  adapter: (input: ExplainInput) => Promise<ExplainOutput> = mockExplain
): Promise<ExplainOutput> {
  const input: ExplainInput = {
    roomLabel: room.name,
    start: startText.trim(),
    end: endText.trim(),
    isAvailable: verdict.status === 'available',
    reasonCode: toReasonCode(verdict),
  };

  if (!validateInput(input)) {
    return { explanation: fallbackExplanation(verdict), source: 'fallback' };
  }

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('adapter timeout')), ADAPTER_TIMEOUT_MS);
  });

  try {
    const output = await Promise.race([adapter(input), timeout]);
    if (!validateOutput(output)) {
      return { explanation: fallbackExplanation(verdict), source: 'fallback' };
    }
    return { explanation: output.explanation.trim(), source: 'generated' };
  } catch {
    return { explanation: fallbackExplanation(verdict), source: 'fallback' };
  }
}
