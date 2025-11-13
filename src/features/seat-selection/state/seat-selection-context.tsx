'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useSeatSelection } from '@/features/seat-selection/hooks/useSeatSelection';
import type { SeatInfo, SeatTierInfo } from '@/features/seat-selection/lib/dto';
import type { EnhancedSeat } from '@/features/seat-selection/types/enhanced-seat';

// ========== State & Action Types (보내내기 위해 export) ==========
interface SeatSelectionState {
  selectedSeatIds: string[];
  selectionError: string | null;
  unavailableSeatIds: string[];
}

type SeatSelectionAction =
  | { type: 'SELECT_SEAT'; payload: { seatId: string } }
  | { type: 'DESELECT_SEAT'; payload: { seatId: string } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_SELECTION_ERROR'; payload: { message: string | null } }
  | { type: 'MARK_UNAVAILABLE'; payload: { seatIds: string[] } }
  | { type: 'CLEAR_UNAVAILABLE' };

export const seatSelectionInitialState: SeatSelectionState = {
  selectedSeatIds: [],
  selectionError: null,
  unavailableSeatIds: [],
};

const seatSelectionReducer = (
  state: SeatSelectionState,
  action: SeatSelectionAction,
): SeatSelectionState => {
  switch (action.type) {
    case 'SELECT_SEAT': {
      if (state.selectedSeatIds.includes(action.payload.seatId)) {
        return state;
      }
      return {
        ...state,
        selectionError: null,
        selectedSeatIds: [...state.selectedSeatIds, action.payload.seatId],
      };
    }
    case 'DESELECT_SEAT':
      return {
        ...state,
        selectionError: null,
        selectedSeatIds: state.selectedSeatIds.filter(
          (id) => id !== action.payload.seatId,
        ),
      };
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectionError: null,
        selectedSeatIds: [],
      };
    case 'SET_SELECTION_ERROR':
      return {
        ...state,
        selectionError: action.payload.message,
      };
    case 'MARK_UNAVAILABLE': {
      const next = new Set(state.unavailableSeatIds);
      action.payload.seatIds.forEach((id) => next.add(id));
      return {
        ...state,
        unavailableSeatIds: Array.from(next),
      };
    }
    case 'CLEAR_UNAVAILABLE':
      return {
        ...state,
        unavailableSeatIds: [],
      };
    default:
      return state;
  }
};

export { seatSelectionReducer };

export interface SeatSelectionContextValue {
  concertTitle: string;
  seatTiers: SeatTierInfo[];
  enhancedSeatMap: EnhancedSeat[];
  selectedSeatIds: string[];
  selectedSeatIdSet: Set<string>;
  selectedSeats: SeatInfo[];
  selectionError: string | null;
  seatMapError: Error | null;
  isSeatMapLoading: boolean;
  isHolding: boolean;
  holdErrorMessage: string | null;
  totalAmount: number;
  selectionLimit: number;
  remainingSelectable: number;
  canSubmitHold: boolean;
  toggleSeat: (seatId: string) => void;
  selectSeat: (seatId: string) => void;
  deselectSeat: (seatId: string) => void;
  clearSelection: () => void;
  holdSeats: () => Promise<void>;
  markUnavailable: (seatIds: string[]) => void;
  refetchSeatMap: () => void;
}

const SeatSelectionContext = createContext<SeatSelectionContextValue | null>(null);

export const SeatSelectionProvider = ({
  concertId,
  children,
}: {
  concertId: string;
  children: ReactNode;
}) => {
  const value = useSeatSelection(concertId);

  return (
    <SeatSelectionContext.Provider value={value}>
      {children}
    </SeatSelectionContext.Provider>
  );
};

export const useSeatSelectionContext = () => {
  const context = useContext(SeatSelectionContext);
  if (!context) {
    throw new Error('SeatSelectionContext가 초기화되지 않았습니다.');
  }
  return context;
};
