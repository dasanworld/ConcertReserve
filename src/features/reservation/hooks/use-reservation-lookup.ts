'use client';

import { useCallback, useMemo, useReducer } from 'react';
import { z } from 'zod';
import { apiClient } from '@/lib/remote/api-client';
import { useToast } from '@/hooks/use-toast';
import {
  ReservationDetailResponseSchema,
  ReservationLookupResponseSchema,
  type ReservationDetailResponse,
} from '@/features/reservation/lib/dto';

export interface CancellationPolicy {
  hoursBeforePerformance: number;
  allowedStatuses: ReadonlyArray<'confirmed'>;
}

interface ReservationLookupState {
  lookupForm: {
    phoneNumber: string;
    password: string;
  };
  isLookingUp: boolean;
  lookupError: string | null;
  reservationDetail: ReservationDetailResponse | null;
  isCancelModalOpen: boolean;
  isCancelling: boolean;
  cancelError: string | null;
}

type ReservationLookupAction =
  | {
      type: 'UPDATE_LOOKUP_FORM';
      payload: { field: keyof ReservationLookupState['lookupForm']; value: string };
    }
  | { type: 'LOOKUP_START' }
  | { type: 'LOOKUP_SUCCESS'; payload: ReservationDetailResponse }
  | { type: 'LOOKUP_FAILURE'; payload: string }
  | { type: 'RESET_STATE' }
  | { type: 'OPEN_CANCEL_MODAL' }
  | { type: 'CLOSE_CANCEL_MODAL' }
  | { type: 'CANCEL_START' }
  | { type: 'CANCEL_SUCCESS' }
  | { type: 'CANCEL_FAILURE'; payload: string };

export interface ReservationLookupContextValue {
  lookupForm: ReservationLookupState['lookupForm'];
  isLookingUp: boolean;
  lookupError: string | null;
  reservationDetail: ReservationDetailResponse | null;
  isCancelModalOpen: boolean;
  isCancelling: boolean;
  cancelError: string | null;
  cancellationPolicy: CancellationPolicy;
  canCancel: boolean;
  updateLookupFormField: (
    field: keyof ReservationLookupState['lookupForm'],
    value: string,
  ) => void;
  lookupReservation: () => Promise<void>;
  showCancelModal: () => void;
  hideCancelModal: () => void;
  cancelReservation: () => Promise<void>;
  reset: () => void;
}

export const initialLookupState: ReservationLookupState = {
  lookupForm: {
    phoneNumber: '',
    password: '',
  },
  isLookingUp: false,
  lookupError: null,
  reservationDetail: null,
  isCancelModalOpen: false,
  isCancelling: false,
  cancelError: null,
};

const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = {
  hoursBeforePerformance: 24,
  allowedStatuses: ['confirmed'],
};

const CancelReservationResponseSchema = z.object({
  reservationId: z.string().uuid(),
  reservationNumber: z.string(),
  message: z.string(),
  cancelledAt: z.string(),
  releasedSeats: z.number(),
});

export const reservationLookupReducer = (
  state: ReservationLookupState,
  action: ReservationLookupAction,
): ReservationLookupState => {
  switch (action.type) {
    case 'UPDATE_LOOKUP_FORM':
      return {
        ...state,
        lookupForm: {
          ...state.lookupForm,
          [action.payload.field]: action.payload.value,
        },
      };
    case 'LOOKUP_START':
      return {
        ...state,
        isLookingUp: true,
        lookupError: null,
      };
    case 'LOOKUP_SUCCESS':
      return {
        ...state,
        isLookingUp: false,
        lookupError: null,
        reservationDetail: action.payload,
        cancelError: null,
        isCancelModalOpen: false,
      };
    case 'LOOKUP_FAILURE':
      return {
        ...state,
        isLookingUp: false,
        lookupError: action.payload,
      };
    case 'RESET_STATE':
      return initialLookupState;
    case 'OPEN_CANCEL_MODAL':
      return { ...state, isCancelModalOpen: true };
    case 'CLOSE_CANCEL_MODAL':
      return { ...state, isCancelModalOpen: false };
    case 'CANCEL_START':
      return { ...state, isCancelling: true, cancelError: null };
    case 'CANCEL_SUCCESS':
      return {
        ...state,
        isCancelling: false,
        isCancelModalOpen: false,
        cancelError: null,
        reservationDetail: state.reservationDetail
          ? { ...state.reservationDetail, status: 'cancelled' }
          : null,
      };
    case 'CANCEL_FAILURE':
      return { ...state, isCancelling: false, cancelError: action.payload };
    default:
      return state;
  }
};

/**
 * 예약 조회 및 취소 기능의 모든 로직을 캡슐화하는 Custom Hook
 *
 * 책임:
 * - 조회 폼 상태 관리 (useReducer)
 * - 예약 조회 API 호출
 * - 예약 상세 정보 로드
 * - 예약 취소 API 호출
 * - 취소 모달 상태 관리
 * - 에러 처리 및 UI 피드백
 */
export function useReservationLookup(): ReservationLookupContextValue {
  const [state, dispatch] = useReducer(
    reservationLookupReducer,
    initialLookupState,
  );
  const { toast } = useToast();

  // ========== Action Functions ==========
  const updateLookupFormField = useCallback(
    (field: keyof ReservationLookupState['lookupForm'], value: string) => {
      dispatch({ type: 'UPDATE_LOOKUP_FORM', payload: { field, value } });
    },
    [],
  );

  const lookupReservation = useCallback(async () => {
    if (!state.lookupForm.phoneNumber || !state.lookupForm.password) {
      dispatch({
        type: 'LOOKUP_FAILURE',
        payload: '휴대폰 번호와 비밀번호가 일치하지 않습니다.',
      });
      return;
    }

    dispatch({ type: 'LOOKUP_START' });

    try {
      const lookupResponse = await apiClient.post(
        '/api/reservations/lookup',
        state.lookupForm,
      );

      const parsedLookup = ReservationLookupResponseSchema.parse(
        lookupResponse.data,
      );

      const detailResponse = await apiClient.get(
        `/api/reservations/${parsedLookup.reservationId}`,
      );
      const parsedDetail = ReservationDetailResponseSchema.parse(
        detailResponse.data,
      );

      dispatch({ type: 'LOOKUP_SUCCESS', payload: parsedDetail });
      toast({
        title: '예약을 찾았습니다',
        description: '예약 상세 정보를 확인하세요.',
      });
    } catch (error) {
      const message =
        (error as any)?.response?.data?.error?.message ??
        (error as Error)?.message ??
        '예약 조회 중 오류가 발생했습니다.';
      dispatch({ type: 'LOOKUP_FAILURE', payload: message });
    }
  }, [state.lookupForm, toast]);

  const cancelReservation = useCallback(async () => {
    if (!state.reservationDetail) {
      return;
    }
    dispatch({ type: 'CANCEL_START' });

    try {
      const response = await apiClient.delete(
        `/api/reservations/${state.reservationDetail.reservationId}`,
      );
      CancelReservationResponseSchema.parse(response.data);
      dispatch({ type: 'CANCEL_SUCCESS' });
      toast({
        title: '예약이 취소되었습니다',
        description: '선택된 좌석이 해제되었습니다.',
      });
    } catch (error) {
      const message =
        (error as any)?.response?.data?.error?.message ??
        (error as Error)?.message ??
        '예약 취소에 실패했습니다.';
      dispatch({ type: 'CANCEL_FAILURE', payload: message });
      toast({
        title: '취소 실패',
        description: message,
        variant: 'destructive',
      });
    }
  }, [state.reservationDetail, toast]);

  const showCancelModal = useCallback(() => {
    dispatch({ type: 'OPEN_CANCEL_MODAL' });
  }, []);

  const hideCancelModal = useCallback(() => {
    dispatch({ type: 'CLOSE_CANCEL_MODAL' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // ========== Return Context Value ==========
  return useMemo(
    () => ({
      lookupForm: state.lookupForm,
      isLookingUp: state.isLookingUp,
      lookupError: state.lookupError,
      reservationDetail: state.reservationDetail,
      isCancelModalOpen: state.isCancelModalOpen,
      isCancelling: state.isCancelling,
      cancelError: state.cancelError,
      canCancel: state.reservationDetail?.status === 'confirmed' ?? false,
      cancellationPolicy: DEFAULT_CANCELLATION_POLICY,
      updateLookupFormField,
      lookupReservation,
      showCancelModal,
      hideCancelModal,
      cancelReservation,
      reset,
    }),
    [
      hideCancelModal,
      lookupReservation,
      cancelReservation,
      reset,
      showCancelModal,
      state.isCancelModalOpen,
      state.isCancelling,
      state.cancelError,
      state.isLookingUp,
      state.lookupError,
      state.lookupForm,
      state.reservationDetail,
      updateLookupFormField,
    ],
  );
}
