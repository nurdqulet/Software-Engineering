import { useState, useMemo } from 'react';
import {
  Clock,
  DoorClosed,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Ban,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  CURRENT_TIME,
  MAX_INTERVAL,
  minutesToHHMM,
  hhmmToMinutes,
  parseDuration,
  checkDurationRequest,
  durationVerdictToVerdict,
  type Room,
  type DurationVerdict,
} from '@/booking';
import { explainAvailability } from '@/explain';
import { ROOMS } from '@/fixtures';

function App() {
  const [selectedRoomId, setSelectedRoomId] = useState(ROOMS[0].id);
  const [startTime, setStartTime] = useState('10:30');
  const [duration, setDuration] = useState('60');
  const [verdict, setVerdict] = useState<DurationVerdict | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationSource, setExplanationSource] = useState<
    'generated' | 'fallback'
  >('fallback');
  const [explaining, setExplaining] = useState(false);

  const selectedRoom = useMemo(
    () => ROOMS.find((r) => r.id === selectedRoomId)!,
    [selectedRoomId]
  );

  const handleCheck = () => {
    setVerdict(checkDurationRequest(selectedRoom, startTime, duration));
    setExplanation(null);
  };

  const handleExplain = async (room: Room, verdict: DurationVerdict) => {
    setExplaining(true);
    try {
      const startMin = hhmmToMinutes(startTime);
      const dur = parseDuration(duration);
      const endText =
        startMin !== null && dur !== null
          ? minutesToHHMM(startMin + dur)
          : '';
      const result = await explainAvailability(
        room,
        startTime,
        endText,
        durationVerdictToVerdict(verdict)
      );
      setExplanation(result.explanation);
      setExplanationSource(result.source ?? 'fallback');
    } finally {
      setExplaining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center justify-center rounded-2xl bg-blue-600 p-3 shadow-lg shadow-blue-600/20">
            <DoorClosed className="h-7 w-7 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Smart Campus Room Availability
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Check whether a room is available for your desired time slot.
          </p>
        </header>

        {/* Current time banner */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <Clock className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <p className="text-sm text-slate-700">
            Current time:{' '}
            <span className="font-semibold text-blue-700">
              {minutesToHHMM(CURRENT_TIME)}
            </span>{' '}
            <span className="text-slate-400">(fixed sample value)</span>
          </p>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {/* Room selection */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Select a room
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ROOMS.map((room) => {
                const isSelected = room.id === selectedRoomId;
                return (
                  <button
                    key={room.id}
                    onClick={() => {
                      setSelectedRoomId(room.id);
                      setVerdict(null);
                      setExplanation(null);
                    }}
                    className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <DoorClosed
                        className={`h-5 w-5 ${
                          isSelected ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                      <span className="font-semibold text-slate-800">
                        {room.name}
                      </span>
                    </span>
                    {room.blocked ? (
                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                        <Ban className="h-3 w-3" />
                        Blocked
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                        Not blocked
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time inputs */}
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="start-time"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Start time
              </label>
              <input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setVerdict(null);
                  setExplanation(null);
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label
                htmlFor="duration"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Duration (minutes)
              </label>
              <input
                id="duration"
                type="number"
                min={1}
                max={MAX_INTERVAL}
                step={1}
                placeholder="e.g. 60"
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  setVerdict(null);
                  setExplanation(null);
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="mt-1 text-xs text-slate-400">
                Whole minutes, 1–{MAX_INTERVAL}.
              </p>
            </div>
          </div>

          {/* Existing bookings */}
          <div className="mb-6 rounded-xl bg-slate-50 px-4 py-4">
            <div className="mb-2 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-700">
                Existing bookings — {selectedRoom.name}
              </h3>
            </div>
            {selectedRoom.blocked && (
              <p className="mb-2 flex items-center gap-1.5 text-xs text-red-600">
                <Ban className="h-3.5 w-3.5" />
                This room is blocked and unavailable for all bookings.
              </p>
            )}
            {selectedRoom.bookings.length === 0 ? (
              <p className="text-sm text-slate-500">No existing bookings.</p>
            ) : (
              <ul className="space-y-1.5">
                {selectedRoom.bookings.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-slate-600"
                  >
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    {minutesToHHMM(b.start)} – {minutesToHHMM(b.end)}
                    <span className="text-slate-400">
                      ({b.end - b.start} min)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Check button */}
          <button
            onClick={handleCheck}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98]"
          >
            Check Availability
          </button>

          {/* Result */}
          {verdict && (
            <div
              className={`mt-5 flex items-start gap-3 rounded-xl border p-4 transition-all ${
                verdict.available
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              {verdict.available ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              )}
              <div>
                <p
                  className={`font-bold ${
                    verdict.available ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {verdict.available ? 'Available' : 'Unavailable'}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      verdict.available
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {verdict.reasonCode}
                  </span>
                </p>
                <p
                  className={`mt-0.5 text-sm ${
                    verdict.available ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {verdict.message}
                </p>
              </div>
            </div>
          )}

          {/* Explain availability (MOCK, non-authoritative) */}
          {verdict && (
            <div className="mt-4">
              {!explanation && (
                <button
                  onClick={() => handleExplain(selectedRoom, verdict)}
                  disabled={explaining}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" />
                  {explaining ? 'Explaining…' : 'Explain availability'}
                </button>
              )}
              {explanation && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 flex-shrink-0 text-amber-600" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      {explanationSource === 'generated'
                        ? 'AI-generated explanation (not a booking confirmation)'
                        : 'Automatic fallback text (not AI-generated, not a booking confirmation)'}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700">
                    {explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info footer */}
        <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-500">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
          <p>
            Bookings are limited to {MAX_INTERVAL} minutes. The start time must
            be after {minutesToHHMM(CURRENT_TIME)}. Touching endpoints (e.g.
            ending at the start of an existing booking) are allowed. This tool
            only checks availability — it does not create or save bookings.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
