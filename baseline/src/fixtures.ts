import type { Room } from '@/booking';

// Fictional sample data (one consistent shape: minutes since midnight).
export const ROOMS: Room[] = [
  {
    id: 'A101',
    name: 'Room A101',
    blocked: false,
    bookings: [{ start: 600, end: 660 }], // 10:00–11:00
  },
  {
    id: 'B202',
    name: 'Room B202',
    blocked: true,
    bookings: [{ start: 600, end: 660 }], // 10:00–11:00
  },
];
