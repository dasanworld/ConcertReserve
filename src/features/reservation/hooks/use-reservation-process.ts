'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import type { UseFormReturn } from 'react-hook-form';
import { useReservationSession } from '@/stores/useReservationSession';
import { useCreateReservationMutation } from './use-create-reservation-mutation';
import { useReservationFormValidation } from './use-reservation-form-validation';
import { useToast } from '@/hooks/use-toast';
import type { SeatDetail } from '@/features/reservation/backend/schema';
import type { ReservationFormData } from './use-reservation-form-validation';
import type { ReservationHeldInfo } from '@/stores/useReservationSession';

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

export interface ReservationProcessContextValue {
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

/**
 * 예약 절차의 모든 로직을 캡슐화하는 Custom Hook
 *
 * 책임:
 * - 선점된 좌석 정보 초기화 (Zustand에서 consume)
 * - 카운트다운 타이머 관리 (5분 선점 유효 기간)
 * - 예약 폼 관리 (react-hook-form)
 * - 예약 생성 API 호출 (React Query mutation)
 * - 만료 처리 (자동 리다이렉트)
 * - 에러 처리 및 UI 피드백
 */
export function useReservationProcess(): ReservationProcessContextValue {
  const router = useRouter();
  const { toast } = useToast();

  // ========== State Management ==========
  const [state, dispatch] = useReducer(
    reservationProcessReducer,
    initialReservationState,
  );
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);

  // ========== Zustand & Form & React Query ==========
  const consumeHeldInfo = useReservationSession((session) => session.consumeHeldInfo);
  const clearHeldInfo = useReservationSession((session) => session.clearHeldInfo);
  const form = useReservationFormValidation();
  const createReservationMutation = useCreateReservationMutation();

  // ========== Effect #1: 초기화 ==========
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

  // ========== Effect #2: 카운트다운 타이머 ==========
  useEffect(() => {
    if (!state.isInitialized || !state.holdExpiresAt || state.hasExpired) {
      return;
    }
    const interval = window.setInterval(() => {
      dispatch({ type: 'TICK_COUNTDOWN' });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [state.holdExpiresAt, state.hasExpired, state.isInitialized]);

  // ========== Effect #3: 만료 처리 ==========
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
      router.replace(`/concerts/${state.concertId}`);
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

  // ========== Action: 예약 제출 ==========
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

  // ========== Derived State ==========
  const isReady = state.isInitialized && !isProcessingRedirect;
  const isHoldExpired = state.hasExpired;

  // ========== Return Context Value ==========
  return useMemo(
    () => ({
      isReady,
      concertTitle: state.concertTitle,
      heldSeats: state.heldSeats,
      totalAmount: state.totalAmount,
      holdExpiresAt: state.holdExpiresAt,
      countdownSeconds: state.countdownSeconds,
      isHoldExpired,
      form,
      isSubmitting: createReservationMutation.isPending,
      submissionError: state.submissionError,
      submitReservation,
    }),
    [
      createReservationMutation.isPending,
      form,
      isReady,
      isHoldExpired,
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
}
