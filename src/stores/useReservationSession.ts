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
  recentReservationId: string | null;
  setHeldInfo: (info: ReservationHeldInfo) => void;
  clearHeldInfo: () => void;
  consumeHeldInfo: () => ReservationHeldInfo | null;
  setRecentReservationId: (id: string | null) => void;
  consumeRecentReservationId: () => string | null;
}

export const useReservationSession = create<ReservationSessionState>((set, get) => ({
  heldInfo: null,
  recentReservationId: null,
  setHeldInfo: (info) => set({ heldInfo: info }),
  clearHeldInfo: () => set({ heldInfo: null }),
  consumeHeldInfo: () => {
    const current = get().heldInfo;
    if (current) {
      set({ heldInfo: null });
    }
    return current;
  },
  setRecentReservationId: (id) => set({ recentReservationId: id }),
  consumeRecentReservationId: () => {
    const current = get().recentReservationId;
    if (current) {
      set({ recentReservationId: null });
    }
    return current;
  },
}));
