import type { SeatInfo } from '@/features/seat-selection/lib/dto';

export type EnhancedSeat = SeatInfo & {
  ephemeralStatus?: 'unavailable_on_hold';
};
