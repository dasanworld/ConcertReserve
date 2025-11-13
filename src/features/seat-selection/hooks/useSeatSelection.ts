'use client';

import { useCallback, useMemo, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useReservationSession } from '@/stores/useReservationSession';
import { useSeatsQuery } from './useSeatsQuery';
import { useSeatHoldMutation } from './useSeatHoldMutation';
import { SEAT_SELECTION_LIMITS } from '@/features/seat-selection/constants';
import type { SeatInfo, SeatTierInfo, SeatHoldResponse } from '@/features/seat-selection/lib/dto';
import type { SeatDetail } from '@/features/reservation/backend/schema';
import type { EnhancedSeat } from '@/features/seat-selection/types/enhanced-seat';
import type { SeatSelectionContextValue } from '@/features/seat-selection/state/seat-selection-context';
import {
  seatSelectionInitialState,
  seatSelectionReducer,
  type SeatSelectionState,
  type SeatSelectionAction,
} from '@/features/seat-selection/state/seat-selection-context';

/**
 * 좌석 선택 기능의 모든 로직을 캡슐화하는 Custom Hook
 *
 * 책임:
 * - useReducer를 통한 선택 상태 관리
 * - React Query를 통한 서버 상태 동기화
 * - 파생 상태 계산 (selectedSeats, totalAmount 등)
 * - 액션 함수 제공 (selectSeat, holdSeats 등)
 * - 에러 처리 및 UI 피드백 (토스트, 라우팅)
 * - 세션 상태 관리 (Zustand)
 */
export function useSeatSelection(concertId: string): SeatSelectionContextValue {
  const router = useRouter();
  const { toast } = useToast();
  const setReservationSession = useReservationSession((state) => state.setHeldInfo);

  // ========== Server State (React Query) ==========
  const seatQuery = useSeatsQuery(concertId);
  const holdMutation = useSeatHoldMutation();

  // ========== Client State (useReducer) ==========
  const [state, dispatch] = useReducer(
    seatSelectionReducer,
    seatSelectionInitialState,
  );

  // ========== Derived State (useMemo) ==========
  const seatLookup = useMemo(() => {
    const map = new Map<string, SeatInfo>();
    if (seatQuery.data?.seats) {
      seatQuery.data.seats.forEach((seat) => map.set(seat.id, seat));
    }
    return map;
  }, [seatQuery.data?.seats]);

  const unavailableSeatSet = useMemo(
    () => new Set(state.unavailableSeatIds),
    [state.unavailableSeatIds],
  );

  const enhancedSeatMap = useMemo<EnhancedSeat[]>(() => {
    if (!seatQuery.data?.seats) {
      return [];
    }
    return seatQuery.data.seats.map((seat) => ({
      ...seat,
      ephemeralStatus: unavailableSeatSet.has(seat.id)
        ? 'unavailable_on_hold'
        : undefined,
    }));
  }, [seatQuery.data?.seats, unavailableSeatSet]);

  const selectedSeatIdSet = useMemo(
    () => new Set(state.selectedSeatIds),
    [state.selectedSeatIds],
  );

  const selectedSeats = useMemo(() => {
    return enhancedSeatMap.filter((seat) => selectedSeatIdSet.has(seat.id));
  }, [enhancedSeatMap, selectedSeatIdSet]);

  const totalAmount = useMemo(
    () => selectedSeats.reduce((sum, seat) => sum + seat.price, 0),
    [selectedSeats],
  );

  const remainingSelectable = SEAT_SELECTION_LIMITS.MAX - state.selectedSeatIds.length;
  const canSubmitHold =
    state.selectedSeatIds.length >= SEAT_SELECTION_LIMITS.MIN &&
    remainingSelectable >= 0 &&
    !holdMutation.isPending;

  // ========== Action Functions (useCallback) ==========
  const selectSeat = useCallback(
    (seatId: string) => {
      if (selectedSeatIdSet.has(seatId)) {
        return;
      }
      if (state.selectedSeatIds.length >= SEAT_SELECTION_LIMITS.MAX) {
        dispatch({
          type: 'SET_SELECTION_ERROR',
          payload: { message: `좌석은 최대 ${SEAT_SELECTION_LIMITS.MAX}석까지 선택 가능합니다.` },
        });
        return;
      }
      dispatch({ type: 'SELECT_SEAT', payload: { seatId } });
    },
    [selectedSeatIdSet, state.selectedSeatIds.length],
  );

  const deselectSeat = useCallback((seatId: string) => {
    if (!selectedSeatIdSet.has(seatId)) {
      return;
    }
    dispatch({ type: 'DESELECT_SEAT', payload: { seatId } });
  }, [selectedSeatIdSet]);

  const toggleSeat = useCallback(
    (seatId: string) => {
      const seat = seatLookup.get(seatId);
      if (!seat) {
        return;
      }
      if (!selectedSeatIdSet.has(seatId) && seat.status !== 'available') {
        return;
      }
      if (selectedSeatIdSet.has(seatId)) {
        deselectSeat(seatId);
      } else {
        selectSeat(seatId);
      }
    },
    [deselectSeat, selectSeat, selectedSeatIdSet, seatLookup],
  );

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const mapHoldResponseToSeatDetail = useCallback(
    (response: SeatHoldResponse): SeatDetail[] =>
      response.heldSeats.map((seat) => ({
        seatId: seat.seatId,
        label: seat.label,
        tierLabel: seat.seatTierLabel,
        price: seat.price,
      })),
    [],
  );

  // ========== Async Action with Side Effects ==========
  const holdSeats = useCallback(async () => {
    if (!seatQuery.data) {
      return;
    }
    if (state.selectedSeatIds.length < SEAT_SELECTION_LIMITS.MIN) {
      dispatch({
        type: 'SET_SELECTION_ERROR',
        payload: { message: '최소 1석 이상 선택해주세요.' },
      });
      return;
    }

    try {
      const response = await holdMutation.mutateAsync({
        concertId,
        seatIds: state.selectedSeatIds,
      });

      const seatDetails = mapHoldResponseToSeatDetail(response);

      setReservationSession({
        concertId: seatQuery.data.concertId,
        concertTitle: seatQuery.data.concertTitle,
        holdExpiresAt: response.holdExpiresAt,
        heldSeats: seatDetails,
        totalAmount: response.totalAmount,
      });

      dispatch({ type: 'CLEAR_SELECTION' });
      toast({
        title: '좌석 선점 완료',
        description: '5분 내에 예약 정보를 입력해주세요.',
      });
      router.push('/book');
    } catch (error) {
      let message = '좌석 선점에 실패했습니다. 다시 시도해주세요.';
      let unavailableSeats: string[] = [];

      if (isAxiosError(error)) {
        const apiMessage = error.response?.data?.error?.message;
        if (apiMessage) {
          message = apiMessage;
        }
        unavailableSeats =
          error.response?.data?.error?.details?.unavailableSeats ?? [];
      } else if (error instanceof Error) {
        message = error.message;
      }

      if (unavailableSeats.length > 0) {
        const availableSeatIds = state.selectedSeatIds.filter(
          (id) => !unavailableSeats.includes(id),
        );
        if (availableSeatIds.length > 0) {
          dispatch({ type: 'CLEAR_SELECTION' });
          availableSeatIds.forEach((id) => {
            dispatch({ type: 'SELECT_SEAT', payload: { seatId: id } });
          });
          message = `선택 불가능한 좌석 ${unavailableSeats.length}개가 제거되었습니다. 다시 시도해주세요.`;
        }
      }

      dispatch({ type: 'SET_SELECTION_ERROR', payload: { message } });
      toast({
        title: '선점 실패',
        description: message,
        variant: 'destructive',
      });
      if (unavailableSeats.length > 0) {
        dispatch({ type: 'MARK_UNAVAILABLE', payload: { seatIds: unavailableSeats } });
        window.setTimeout(() => {
          dispatch({ type: 'CLEAR_UNAVAILABLE' });
        }, 3000);
      }
    }
  }, [
    concertId,
    holdMutation,
    mapHoldResponseToSeatDetail,
    router,
    seatQuery.data,
    setReservationSession,
    state.selectedSeatIds,
    toast,
  ]);

  const markUnavailable = useCallback((seatIds: string[]) => {
    if (seatIds.length === 0) {
      return;
    }
    dispatch({ type: 'MARK_UNAVAILABLE', payload: { seatIds } });
    window.setTimeout(() => {
      dispatch({ type: 'CLEAR_UNAVAILABLE' });
    }, 3000);
  }, []);

  // ========== Error Handling ==========
  const seatMapError = useMemo(() => {
    if (!seatQuery.error) {
      return null;
    }
    if (seatQuery.error instanceof Error) {
      return seatQuery.error;
    }
    return new Error('좌석 정보를 불러오지 못했습니다.');
  }, [seatQuery.error]);

  // ========== Return Context Value ==========
  return useMemo(
    () => ({
      concertTitle: seatQuery.data?.concertTitle ?? '',
      seatTiers: seatQuery.data?.tiers ?? [],
      enhancedSeatMap,
      selectedSeatIds: state.selectedSeatIds,
      selectedSeatIdSet,
      selectedSeats,
      selectionError: state.selectionError,
      seatMapError,
      isSeatMapLoading: seatQuery.isLoading || seatQuery.isFetching,
      isHolding: holdMutation.isPending,
      holdErrorMessage: holdMutation.error
        ? (holdMutation.error as Error).message
        : null,
      totalAmount,
      selectionLimit: SEAT_SELECTION_LIMITS.MAX,
      remainingSelectable: Math.max(0, remainingSelectable),
      canSubmitHold,
      toggleSeat,
      selectSeat,
      deselectSeat,
      clearSelection,
      holdSeats,
      markUnavailable,
      refetchSeatMap: seatQuery.refetch,
    }),
    [
      canSubmitHold,
      clearSelection,
      deselectSeat,
      enhancedSeatMap,
      holdMutation.error,
      holdMutation.isPending,
      holdSeats,
      markUnavailable,
      remainingSelectable,
      seatMapError,
      seatQuery.data?.concertTitle,
      seatQuery.data?.tiers,
      seatQuery.isFetching,
      seatQuery.isLoading,
      seatQuery.refetch,
      selectSeat,
      selectedSeatIdSet,
      selectedSeats,
      state.selectionError,
      totalAmount,
      toggleSeat,
      state.selectedSeatIds,
    ],
  );
}
