'use client';

import { create } from 'zustand';
import type { SeatDetail } from '@/features/reservation/backend/schema';

export interface ReservationHeldInfo {
  concertId: string;
  concertTitle: string;
  holdExpiresAt: string;
  heldSeats: SeatDetail[];
  totalAmount: number;
}

interface ReservationSessionState {
  heldInfo: ReservationHeldInfo | null;
  setHeldInfo: (info: ReservationHeldInfo) => void;
  clearHeldInfo: () => void;
  consumeHeldInfo: () => ReservationHeldInfo | null;
}

export const useReservationSession = create<ReservationSessionState>((set, get) => ({
  heldInfo: null,
  setHeldInfo: (info) => set({ heldInfo: info }),
  clearHeldInfo: () => set({ heldInfo: null }),
  consumeHeldInfo: () => {
    const current = get().heldInfo;
    if (current) {
      set({ heldInfo: null });
    }
    return current;
  },
}));
