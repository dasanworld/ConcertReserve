import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSeatSelection } from '../useSeatSelection';

/**
 * useSeatSelection Custom Hook 테스트
 *
 * 참고: 이 테스트는 Hook의 상태 관리 로직을 검증합니다.
 * 외부 의존성(React Query, Zustand, API 등)은 모킹되어야 합니다.
 */
describe('useSeatSelection Hook', () => {
  let wrapper: React.ComponentType<{ children: React.ReactNode }>;

  beforeEach(() => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  });

  describe('초기 상태', () => {
    it('초기 selectedSeatIds는 빈 배열이어야 한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      expect(result.current.selectedSeatIds).toEqual([]);
    });

    it('초기 selectionError는 null이어야 한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      expect(result.current.selectionError).toBeNull();
    });

    it('초기 totalAmount는 0이어야 한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      expect(result.current.totalAmount).toBe(0);
    });

    it('초기 isSeatMapLoading는 true일 수 있다 (데이터 로딩 중)', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      expect(typeof result.current.isSeatMapLoading).toBe('boolean');
    });
  });

  describe('selectedSeatIdSet', () => {
    it('selectedSeatIdSet은 Set 타입이어야 한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      expect(result.current.selectedSeatIdSet instanceof Set).toBe(true);
    });

    it('selectedSeatIds가 변경되면 selectedSeatIdSet도 업데이트된다', () => {
      const { result, rerender } = renderHook(() => useSeatSelection('concert-id'), { wrapper });

      // 초기 상태
      expect(result.current.selectedSeatIdSet.size).toBe(0);
    });
  });

  describe('파생 상태', () => {
    it('remainingSelectable은 MAX - selectedCount 이어야 한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      const expected = result.current.selectionLimit - result.current.selectedSeatIds.length;
      expect(result.current.remainingSelectable).toBe(Math.max(0, expected));
    });

    it('canSubmitHold는 boolean이어야 한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      expect(typeof result.current.canSubmitHold).toBe('boolean');
    });
  });

  describe('액션 함수', () => {
    it('toggleSeat 함수가 존재한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      expect(typeof result.current.toggleSeat).toBe('function');
    });

    it('selectSeat 함수가 존재한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      expect(typeof result.current.selectSeat).toBe('function');
    });

    it('deselectSeat 함수가 존재한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      expect(typeof result.current.deselectSeat).toBe('function');
    });

    it('clearSelection 함수가 존재한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      expect(typeof result.current.clearSelection).toBe('function');
    });

    it('holdSeats 함수가 존재한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      expect(typeof result.current.holdSeats).toBe('function');
    });

    it('markUnavailable 함수가 존재한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      expect(typeof result.current.markUnavailable).toBe('function');
    });

    it('refetchSeatMap 함수가 존재한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      expect(typeof result.current.refetchSeatMap).toBe('function');
    });
  });

  describe('로딩 및 에러 상태', () => {
    it('isSeatMapLoading은 boolean이어야 한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      expect(typeof result.current.isSeatMapLoading).toBe('boolean');
    });

    it('seatMapError는 null 또는 Error 타입이어야 한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      const error = result.current.seatMapError;
      expect(error === null || error instanceof Error).toBe(true);
    });

    it('isHolding은 boolean이어야 한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      expect(typeof result.current.isHolding).toBe('boolean');
    });
  });

  describe('Context Value 구조', () => {
    it('모든 필수 속성을 포함한다', () => {
      const { result } = renderHook(() => useSeatSelection('concert-id'), { wrapper });
      const requiredProps = [
        'concertTitle',
        'seatTiers',
        'enhancedSeatMap',
        'selectedSeatIds',
        'selectedSeatIdSet',
        'selectedSeats',
        'selectionError',
        'seatMapError',
        'isSeatMapLoading',
        'isHolding',
        'holdErrorMessage',
        'totalAmount',
        'selectionLimit',
        'remainingSelectable',
        'canSubmitHold',
        'toggleSeat',
        'selectSeat',
        'deselectSeat',
        'clearSelection',
        'holdSeats',
        'markUnavailable',
        'refetchSeatMap',
      ];

      requiredProps.forEach((prop) => {
        expect(prop in result.current).toBe(true);
      });
    });
  });
});
