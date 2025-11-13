'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { UseFormReturn } from 'react-hook-form';
import type { SeatDetail } from '@/features/reservation/backend/schema';
import { useReservationFormValidation } from '@/features/reservation/hooks/use-reservation-form-validation';
import { useCreateReservationMutation } from '@/features/reservation/hooks/use-create-reservation-mutation';
import type { ReservationFormData } from '@/features/reservation/hooks/use-reservation-form-validation';
import { useReservationSession } from '@/stores/useReservationSession';
import type { ReservationHeldInfo } from '@/stores/useReservationSession';
import { useToast } from '@/hooks/use-toast';

interface ReservationProcessState {
  isInitialized: boolean;
  concertId: string | null;
  concertTitle: string;
  heldSeats: SeatDetail[];
  holdExpiresAt: string | null;
  countdownSeconds: number;
  hasExpired: boolean;
  totalAmount: number;
  submissionError: string | null;
}

type ReservationProcessAction =
  | { type: 'INITIALIZE_WITH_HELD_INFO'; payload: ReservationHeldInfo }
  | { type: 'TICK_COUNTDOWN' }
  | { type: 'SET_SUBMISSION_ERROR'; payload: string | null }
  | { type: 'MARK_EXPIRED' };

const initialReservationState: ReservationProcessState = {
  isInitialized: false,
  concertId: null,
  concertTitle: '',
  heldSeats: [],
  holdExpiresAt: null,
  countdownSeconds: 0,
  hasExpired: false,
  totalAmount: 0,
  submissionError: null,
};

const computeRemainingSeconds = (expiresAt: string | null) => {
  if (!expiresAt) {
    return 0;
  }
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 1000));
};

const reservationProcessReducer = (
  state: ReservationProcessState,
  action: ReservationProcessAction,
): ReservationProcessState => {
  switch (action.type) {
    case 'INITIALIZE_WITH_HELD_INFO': {
      const { concertId, concertTitle, heldSeats, holdExpiresAt, totalAmount } =
        action.payload;
      return {
        isInitialized: true,
        concertId,
        concertTitle,
        heldSeats,
        holdExpiresAt,
        countdownSeconds: computeRemainingSeconds(holdExpiresAt),
        hasExpired: false,
        totalAmount,
        submissionError: null,
      };
    }
    case 'TICK_COUNTDOWN': {
      const nextSeconds = computeRemainingSeconds(state.holdExpiresAt);
      return {
        ...state,
        countdownSeconds: nextSeconds,
        hasExpired: nextSeconds <= 0,
      };
    }
    case 'SET_SUBMISSION_ERROR':
      return { ...state, submissionError: action.payload ?? null };
    case 'MARK_EXPIRED':
      return { ...state, hasExpired: true, countdownSeconds: 0 };
    default:
      return state;
  }
};

interface ReservationProcessContextValue {
  isReady: boolean;
  concertTitle: string;
  heldSeats: SeatDetail[];
  totalAmount: number;
  holdExpiresAt: string | null;
  countdownSeconds: number;
  isHoldExpired: boolean;
  form: UseFormReturn<ReservationFormData>;
  isSubmitting: boolean;
  submissionError: string | null;
  submitReservation: (data: ReservationFormData) => Promise<void>;
}

const ReservationProcessContext = createContext<ReservationProcessContextValue | null>(
  null,
);

export const ReservationProcessProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [state, dispatch] = useReducer(
    reservationProcessReducer,
    initialReservationState,
  );
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
  const consumeHeldInfo = useReservationSession((session) => session.consumeHeldInfo);
  const clearHeldInfo = useReservationSession((session) => session.clearHeldInfo);
  const form = useReservationFormValidation();
  const createReservationMutation = useCreateReservationMutation();

  useEffect(() => {
    if (state.isInitialized || isProcessingRedirect) {
      return;
    }
    const heldInfo = consumeHeldInfo();

    if (!heldInfo) {
      setIsProcessingRedirect(true);
      router.replace('/');
      return;
    }

    dispatch({ type: 'INITIALIZE_WITH_HELD_INFO', payload: heldInfo });
  }, [consumeHeldInfo, isProcessingRedirect, router, state.isInitialized]);

  useEffect(() => {
    if (!state.isInitialized || !state.holdExpiresAt || state.hasExpired) {
      return;
    }
    const interval = window.setInterval(() => {
      dispatch({ type: 'TICK_COUNTDOWN' });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [state.holdExpiresAt, state.hasExpired, state.isInitialized]);

  useEffect(() => {
    if (!state.isInitialized || !state.hasExpired || isProcessingRedirect) {
      return;
    }
    toast({
      title: '선점 만료',
      description: '좌석 선점 시간이 만료되었습니다. 다시 선택해주세요.',
      variant: 'destructive',
    });
    if (state.concertId) {
      router.replace(`/concerts/${state.concertId}/seats`);
    } else {
      router.replace('/');
    }
  }, [
    isProcessingRedirect,
    router,
    state.concertId,
    state.hasExpired,
    state.isInitialized,
    toast,
  ]);

  const submitReservation = useCallback(
    async (data: ReservationFormData) => {
      if (!state.isInitialized || state.hasExpired || state.heldSeats.length === 0) {
        dispatch({
          type: 'SET_SUBMISSION_ERROR',
          payload: '선점 정보가 유효하지 않습니다. 좌석을 다시 선택해주세요.',
        });
        return;
      }
      dispatch({ type: 'SET_SUBMISSION_ERROR', payload: null });
      try {
        await createReservationMutation.mutateAsync({
          seatIds: state.heldSeats.map((seat) => seat.seatId),
          customerName: data.customerName,
          phoneNumber: data.phoneNumber,
          password: data.password,
        });
        clearHeldInfo();
      } catch (error) {
        let message = '예약 생성 중 오류가 발생했습니다.';
        if (error instanceof Error) {
          message = error.message;
        }
        dispatch({
          type: 'SET_SUBMISSION_ERROR',
          payload: message,
        });
      }
    },
    [
      clearHeldInfo,
      createReservationMutation,
      state.hasExpired,
      state.heldSeats,
      state.isInitialized,
    ],
  );

  const contextValue: ReservationProcessContextValue = useMemo(
    () => ({
      isReady: state.isInitialized && !isProcessingRedirect,
      concertTitle: state.concertTitle,
      heldSeats: state.heldSeats,
      totalAmount: state.totalAmount,
      holdExpiresAt: state.holdExpiresAt,
      countdownSeconds: state.countdownSeconds,
      isHoldExpired: state.hasExpired,
      form,
      isSubmitting: createReservationMutation.isPending,
      submissionError: state.submissionError,
      submitReservation,
    }),
    [
      createReservationMutation.isPending,
      form,
      isProcessingRedirect,
      state.concertTitle,
      state.countdownSeconds,
      state.hasExpired,
      state.heldSeats,
      state.holdExpiresAt,
      state.isInitialized,
      state.submissionError,
      state.totalAmount,
      submitReservation,
    ],
  );

  return (
    <ReservationProcessContext.Provider value={contextValue}>
      {children}
    </ReservationProcessContext.Provider>
  );
};

export const useReservationProcessContext = () => {
  const context = useContext(ReservationProcessContext);
  if (!context) {
    throw new Error('ReservationProcessContext가 초기화되지 않았습니다.');
  }
  return context;
};
