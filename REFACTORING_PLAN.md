# 상태 관리 아키텍처 리팩토링 계획

**문서 작성일**: 2025-11-13
**목표**: state-management.md 설계 100% 구현
**현재 설계 준수율**: 50% → **목표 95%**

---

## 1. 실행 계획 개요

### 1.1 3단계 마이그레이션 로드맵

| Phase | 작업명 | 파일 | 예상시간 | 우선도 | 설계 준수 개선 |
|-------|--------|------|---------|--------|----------------|
| **Phase 1** | SeatSelection Custom Hook 분리 | useSeatSelection.ts | 2-3h | 🔴 1순위 | 40% → 90% |
| **Phase 2** | ReservationProcess Custom Hook 생성 | use-reservation-process.ts (신규) | 2-3h | 🔴 1순위 | 35% → 90% |
| **Phase 3** | ReservationLookup Custom Hook 분리 (선택) | use-reservation-lookup.ts (신규) | 1h | 🟡 2순위 | 75% → 95% |
| **Phase 4** | 테스트 작성 및 검증 | __tests__/ | 2-3h | 🟢 3순위 | - |

**총 예상 시간**: 7-10시간
**권장 실행**: Phase 1 → Phase 2 → Phase 3 → Phase 4 순서

---

## 2. Phase 1: SeatSelection Custom Hook 분리

### 2.1 목표
- `useSeatSelection.ts`를 단순 alias (1줄)에서 **완전한 Custom Hook**으로 구현
- `SeatSelectionProvider`를 240줄 비대화에서 **50줄 얇은 래퍼**로 축소
- 설계 준수율: 40% → 90%

### 2.2 구현 전 상태 분석

**현재 SeatSelectionProvider 구조** (src/features/seat-selection/state/seat-selection-context.tsx):
```typescript
export const SeatSelectionProvider = ({ concertId, children }) => {
  // 240줄의 복잡한 로직
  const router = useRouter();
  const { toast } = useToast();
  const setReservationSession = useReservationSession(...);

  const seatQuery = useSeatsQuery(concertId);  // React Query
  const holdMutation = useSeatHoldMutation();  // React Query

  const [state, dispatch] = useReducer(...);   // Reducer

  // 7개의 useMemo (파생 상태)
  const seatLookup = useMemo(...);
  const enhancedSeatMap = useMemo(...);
  const selectedSeatIdSet = useMemo(...);
  const selectedSeats = useMemo(...);
  const totalAmount = useMemo(...);
  const remainingSelectable = ...;
  const canSubmitHold = ...;

  // 5개의 useCallback (액션 함수)
  const selectSeat = useCallback(...);
  const deselectSeat = useCallback(...);
  const toggleSeat = useCallback(...);
  const clearSelection = useCallback(...);
  const holdSeats = useCallback(async () => {
    // 40줄 복잡한 비동기 로직
    const response = await holdMutation.mutateAsync(...);
    setReservationSession({...});
    router.push('/book');
    toast(...);
  });

  const markUnavailable = useCallback(...);

  // Context Value 생성
  const value = useMemo(() => ({...}), [...]);

  return <SeatSelectionContext.Provider value={value} />;
};
```

### 2.3 리팩토링 전략

#### 2.3.1 새로운 파일 생성 & 기존 파일 수정

**신규 생성**: 파일명 변경 없음, 기존 `useSeatSelection.ts` 확장
**위치**: `src/features/seat-selection/hooks/useSeatSelection.ts`

#### 2.3.2 코드 이동 (이동할 내용)

Provider에서 다음을 **useSeatSelection.ts로 이동**:

| 항목 | 줄 수 | 이동 대상 |
|------|-------|---------|
| useReducer 초기화 | 3줄 | Custom Hook 내부 |
| 7개의 useMemo (파생 상태 계산) | 50줄 | Custom Hook 내부 |
| 5개의 useCallback (액션 함수) | 80줄 | Custom Hook 내부 |
| React Query 훅 호출 | 2줄 | Custom Hook 내부 |
| 에러 처리 로직 | 30줄 | Custom Hook 내부 |
| Context Value 조립 | 15줄 | Custom Hook 반환 |

**남을 것** (Provider 내에 유지):
- Context 정의 (3줄)
- Provider 구조 (5줄)
- return 문 (2줄)

### 2.4 구현 상세 (코드 레벨)

#### 2.4.1 신규 useSeatSelection.ts 전체 구조

```typescript
// src/features/seat-selection/hooks/useSeatSelection.ts

import { useCallback, useMemo, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useReservationSession } from '@/stores/useReservationSession';
import { useSeatsQuery } from './useSeatsQuery';
import { useSeatHoldMutation } from './useSeatHoldMutation';
import { SEAT_SELECTION_LIMITS } from '@/features/seat-selection/constants';
import type { SeatSelectionContextValue } from '@/features/seat-selection/state/seat-selection-context';
// ... 기타 import

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
  // [모든 7개의 useMemo를 여기로 이동]
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
```

#### 2.4.2 리팩토링된 SeatSelectionProvider (얇은 래퍼)

```typescript
// src/features/seat-selection/state/seat-selection-context.tsx

'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useSeatSelection } from '@/features/seat-selection/hooks/useSeatSelection';
import type { SeatSelectionContextValue } from './seat-selection-context'; // 기존 타입 유지

const SeatSelectionContext = createContext<SeatSelectionContextValue | null>(null);

/**
 * 얇은 래퍼 Provider: useSeatSelection Custom Hook의 반환값을 하위 컴포넌트에 주입
 */
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
```

### 2.5 변경 요약

| 항목 | 변경 전 | 변경 후 | 감소량 |
|------|--------|--------|--------|
| SeatSelectionProvider | 417줄 | 30줄 | 387줄 (93%) ↓ |
| useSeatSelection.ts | 1줄 (alias) | 250줄 (완전 구현) | +249줄 |
| 코드 위치 개선 | Provider 혼재 | Hook 캡슐화 | 관심사 분리 ✓ |
| 테스트 가능성 | 불가능 | 가능 | Hook 단위 테스트 ✓ |

### 2.6 검증 체크리스트

- [ ] useSeatSelection.ts가 모든 로직을 포함하는가?
- [ ] SeatSelectionProvider가 50줄 이하인가?
- [ ] 모든 useCallback 의존성이 올바른가?
- [ ] SeatSelectionContext 타입이 유지되었는가?
- [ ] 컴포넌트 사용법이 변경되지 않았는가? (useSeatSelectionContext 호출)
- [ ] 테스트 작성 가능한 구조인가?

---

## 3. Phase 2: ReservationProcess Custom Hook 생성

### 3.1 목표
- 새로운 파일 `use-reservation-process.ts` 생성
- `ReservationProcessProvider`를 259줄 비대화에서 **40줄 얇은 래퍼**로 축소
- 설계 준수율: 35% → 90%

### 3.2 구현 전 상태 분석

**현재 ReservationProcessProvider 구조**:
```typescript
export const ReservationProcessProvider = ({ children }) => {
  const router = useRouter();
  const { toast } = useToast();

  const [state, dispatch] = useReducer(...);           // Reducer
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);  // Local state

  const consumeHeldInfo = useReservationSession(...);   // Zustand
  const clearHeldInfo = useReservationSession(...);     // Zustand
  const form = useReservationFormValidation();          // Custom Hook
  const createReservationMutation = useCreateReservationMutation();  // React Query

  // useEffect #1: 초기화 (15줄)
  useEffect(() => {
    if (state.isInitialized || isProcessingRedirect) return;
    const heldInfo = consumeHeldInfo();
    if (!heldInfo) {
      setIsProcessingRedirect(true);
      router.replace('/');
      return;
    }
    dispatch({ type: 'INITIALIZE_WITH_HELD_INFO', payload: heldInfo });
  }, [...]);

  // useEffect #2: 카운트다운 (10줄)
  useEffect(() => {
    if (!state.isInitialized || !state.holdExpiresAt || state.hasExpired) return;
    const interval = window.setInterval(() => {
      dispatch({ type: 'TICK_COUNTDOWN' });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [...]);

  // useEffect #3: 만료 처리 (22줄)
  useEffect(() => {
    if (!state.isInitialized || !state.hasExpired || isProcessingRedirect) return;
    toast({...});
    if (state.concertId) {
      router.replace(`/concerts/${state.concertId}`);
    } else {
      router.replace('/');
    }
  }, [...]);

  // useCallback: submitReservation (37줄)
  const submitReservation = useCallback(async (data: ReservationFormData) => {
    // ... 복잡한 비동기 로직
  }, [...]);

  // useMemo: Context Value
  const value: ReservationProcessContextValue = useMemo(() => ({...}), [...]);

  return <ReservationProcessContext.Provider value={value} />;
};
```

### 3.3 리팩토링 전략

**신규 생성**: `src/features/reservation/hooks/use-reservation-process.ts`

#### 이동할 내용

| 항목 | 줄 수 | 이동 대상 |
|------|-------|---------|
| useReducer 초기화 | 3줄 | Custom Hook |
| 3개의 useEffect | 45줄 | Custom Hook |
| useCallback (submitReservation) | 37줄 | Custom Hook |
| 파생 상태 계산 | 10줄 | Custom Hook |
| Context Value 조립 | 20줄 | Custom Hook 반환 |

### 3.4 구현 상세

#### 3.4.1 신규 use-reservation-process.ts

```typescript
// src/features/reservation/hooks/use-reservation-process.ts

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
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
import type { ReservationProcessContextValue } from '@/features/reservation/process/reservation-process-provider';

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
```

#### 3.4.2 리팩토링된 ReservationProcessProvider

```typescript
// src/features/reservation/process/reservation-process-provider.tsx

'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useReservationProcess } from '@/features/reservation/hooks/use-reservation-process';
import type { ReservationProcessContextValue } from './reservation-process-provider';

const ReservationProcessContext = createContext<ReservationProcessContextValue | null>(null);

/**
 * 얇은 래퍼 Provider: useReservationProcess Custom Hook의 반환값을 하위 컴포넌트에 주입
 */
export const ReservationProcessProvider = ({ children }: { children: ReactNode }) => {
  const value = useReservationProcess();

  return (
    <ReservationProcessContext.Provider value={value}>
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
```

### 3.5 변경 요약

| 항목 | 변경 전 | 변경 후 | 감소량 |
|------|--------|--------|--------|
| ReservationProcessProvider | 259줄 | 30줄 | 229줄 (88%) ↓ |
| use-reservation-process.ts | 없음 | 200줄 (신규) | +200줄 |
| 코드 위치 개선 | Provider 혼재 | Hook 캡슐화 | 관심사 분리 ✓ |
| useEffect 관리 | Provider 내 3개 | Hook 내 3개 | 테스트 가능 ✓ |

---

## 4. Phase 3: ReservationLookup Custom Hook 분리 (선택사항)

### 4.1 목표
- `use-reservation-lookup.ts` Custom Hook 생성 (선택사항)
- `ReservationLookupProvider`에서 로직 추출
- 설계 준수율: 75% → 95%

### 4.2 구현 현황
**ReservationLookupProvider**는 이미 부분적으로 올바른 구조를 가짐:
- useEffect 없음 ✓
- 모든 액션이 useCallback으로 정의 ✓
- Context Value가 useMemo로 안정화 ✓

### 4.3 선택사항 판단

| 상황 | 권장 |
|------|------|
| 코드 재사용성 필요한 경우 | Custom Hook 분리 권장 |
| Provider만으로 충분한 경우 | 현재 구조 유지 가능 |
| 테스트 작성 계획 있는 경우 | Custom Hook 분리 권장 |

**현재 권장**: **낮은 우선도 (2순위)** - Phase 1, 2 완료 후 검토

---

## 5. Phase 4: 테스트 작성 및 검증

### 5.1 작성할 테스트

#### 5.1.1 useSeatSelection Hook 테스트
**파일**: `src/features/seat-selection/hooks/__tests__/useSeatSelection.test.ts`

```typescript
describe('useSeatSelection', () => {
  describe('선택 기능', () => {
    test('selectSeat: 좌석을 선택할 수 있다', () => {});
    test('deselectSeat: 좌석을 선택 해제할 수 있다', () => {});
    test('toggleSeat: 좌석을 토글할 수 있다', () => {});
    test('clearSelection: 모든 선택을 초기화할 수 있다', () => {});
  });

  describe('제한 사항', () => {
    test('MAX 좌석 이상 선택 불가', () => {});
    test('MIN 좌석 미만이면 holdSeats 비활성화', () => {});
  });

  describe('holdSeats 비동기 처리', () => {
    test('성공 시 Zustand 상태 업데이트', () => {});
    test('성공 시 라우팅 수행', () => {});
    test('실패 시 에러 메시지 표시', () => {});
    test('일부 실패 시 자동 재선택', () => {});
  });

  describe('파생 상태', () => {
    test('totalAmount 계산 정확성', () => {});
    test('remainingSelectable 계산', () => {});
    test('canSubmitHold 조건 확인', () => {});
  });
});
```

#### 5.1.2 useReservationProcess Hook 테스트
**파일**: `src/features/reservation/hooks/__tests__/use-reservation-process.test.ts`

```typescript
describe('useReservationProcess', () => {
  describe('초기화', () => {
    test('Zustand에서 heldInfo를 consume한다', () => {});
    test('heldInfo 없으면 홈으로 리다이렉트', () => {});
  });

  describe('카운트다운', () => {
    test('초 단위로 countdownSeconds 감소', () => {});
    test('0초 도달 시 hasExpired = true', () => {});
  });

  describe('만료 처리', () => {
    test('만료 시 토스트 표시', () => {});
    test('만료 시 콘서트 상세 페이지로 리다이렉트', () => {});
  });

  describe('submitReservation', () => {
    test('API 호출 성공 시 예약 완료', () => {});
    test('API 호출 실패 시 에러 메시지 표시', () => {});
    test('완료 후 Zustand clearHeldInfo 호출', () => {});
  });
});
```

### 5.2 검증 체크리스트

- [ ] Phase 1 구현 완료 및 테스트 통과
- [ ] Phase 2 구현 완료 및 테스트 통과
- [ ] Provider가 모두 50줄 이하로 축소되었는가?
- [ ] 모든 Custom Hook이 캡슐화되었는가?
- [ ] Context 사용법이 변경되지 않았는가? (하위 호환성)
- [ ] 배포 전 수동 테스트 완료
- [ ] 성능 측정 (리렌더 횟수)

---

## 6. 예상 일정 및 산출물

### 6.1 일정 계획

| Phase | 작업 | 기간 | 상태 |
|-------|------|------|------|
| Phase 1 | useSeatSelection Hook 구현 | 2-3h | 📋 예정 |
| Phase 1 | 테스트 작성 | 1h | 📋 예정 |
| Phase 2 | useReservationProcess Hook 생성 | 2-3h | 📋 예정 |
| Phase 2 | 테스트 작성 | 1h | 📋 예정 |
| Phase 3 | ReservationLookup Hook (선택) | 1h | 📋 선택사항 |
| 통합 | 수동 테스트 & QA | 1-2h | 📋 예정 |

**총 예상 시간**: 8-10시간

### 6.2 산출물

```
새로 생성/수정될 파일:
├── src/features/seat-selection/hooks/useSeatSelection.ts (기존 alias → 250줄로 확장)
│   ├── useSeatSelection() Custom Hook 정의
│   ├── seatSelectionReducer 이동
│   └── seatSelectionInitialState 이동
│
├── src/features/seat-selection/state/seat-selection-context.tsx (240줄 → 30줄 축소)
│   └── Provider를 얇은 래퍼로 변경
│
├── src/features/reservation/hooks/use-reservation-process.ts (신규 생성, 200줄)
│   ├── useReservationProcess() Custom Hook 정의
│   ├── reservationProcessReducer 이동
│   └── 3개 useEffect 캡슐화
│
├── src/features/reservation/process/reservation-process-provider.tsx (259줄 → 30줄 축소)
│   └── Provider를 얇은 래퍼로 변경
│
├── src/features/seat-selection/hooks/__tests__/useSeatSelection.test.ts (신규, 테스트)
├── src/features/reservation/hooks/__tests__/use-reservation-process.test.ts (신규, 테스트)
│
└── REFACTORING_PLAN.md (본 문서)
```

---

## 7. 리스크 및 대응책

### 7.1 잠재적 리스크

| 리스크 | 영향 | 대응책 |
|--------|------|--------|
| 하위 호환성 파괴 | 높음 | 컴포넌트 사용법 동일 유지 (useSeatSelectionContext 그대로) |
| 성능 저하 | 중간 | useMemo/useCallback 의존성 최적화 |
| 테스트 미흡 | 높음 | Phase 4에서 충분한 테스트 작성 |
| 병합 충돌 | 낮음 | 독립적 파일 수정이므로 충돌 최소 |

### 7.2 롤백 계획

각 Phase 완료 후 `git commit`하여 필요 시 이전 상태로 복구 가능

---

## 8. 설계 준수율 개선 예상

### Before (현황)
```
├── Server State (React Query):           95% ✓
├── Session State (Zustand):              100% ✓
├── Client State - Reducer:               95% ✓
├── Client State - Custom Hook:           25% ❌ (분리 부재)
├── Client State - Provider:              30% ❌ (비대화)
└── 종합:                                 50% ⚠️
```

### After (예상)
```
├── Server State (React Query):           95% ✓
├── Session State (Zustand):              100% ✓
├── Client State - Reducer:               95% ✓
├── Client State - Custom Hook:           95% ✓ (분리 완료)
├── Client State - Provider:              95% ✓ (얇은 래퍼)
└── 종합:                                 95% ✓
```

**개선도**: 50% → 95% (**+45%p**)

---

## 9. 참고 문서

- `/docs/state-management.md`: 설계 문서
- `CLAUDE.md`: 프로젝트 가이드라인
- 본 문서 (`REFACTORING_PLAN.md`)

---

**작성**: 2025-11-13
**상태**: 📋 실행 준비 완료
**우선도**: 🔴 높음 (구현 필요)
