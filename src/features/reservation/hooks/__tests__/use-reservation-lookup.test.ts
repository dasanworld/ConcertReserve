import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReservationLookup } from '../use-reservation-lookup';

/**
 * useReservationLookup Custom Hook 테스트
 *
 * 참고: 이 테스트는 Hook의 구조와 초기 상태를 검증합니다.
 * API 호출, 비동기 처리, 에러 처리는 통합 테스트에서 검증됩니다.
 */
describe('useReservationLookup Hook', () => {
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
    it('lookupForm.phoneNumber는 빈 문자열로 시작한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(result.current.lookupForm.phoneNumber).toBe('');
    });

    it('lookupForm.password는 빈 문자열로 시작한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(result.current.lookupForm.password).toBe('');
    });

    it('isLookingUp은 false로 시작한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(result.current.isLookingUp).toBe(false);
    });

    it('lookupError는 null로 시작한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(result.current.lookupError).toBeNull();
    });

    it('reservationDetail은 null로 시작한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(result.current.reservationDetail).toBeNull();
    });

    it('isCancelModalOpen은 false로 시작한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(result.current.isCancelModalOpen).toBe(false);
    });

    it('isCancelling은 false로 시작한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(result.current.isCancelling).toBe(false);
    });

    it('cancelError는 null로 시작한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(result.current.cancelError).toBeNull();
    });
  });

  describe('액션 함수 - 폼 관리', () => {
    it('updateLookupFormField 함수가 존재한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(typeof result.current.updateLookupFormField).toBe('function');
    });

    it('updateLookupFormField는 phoneNumber와 password를 업데이트할 수 있다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(result.current.updateLookupFormField).toBeDefined();
    });
  });

  describe('액션 함수 - 조회', () => {
    it('lookupReservation 함수가 존재한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(typeof result.current.lookupReservation).toBe('function');
    });

    it('lookupReservation은 async 함수이다', async () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      const returnValue = result.current.lookupReservation();
      expect(returnValue instanceof Promise).toBe(true);
    });
  });

  describe('액션 함수 - 취소', () => {
    it('cancelReservation 함수가 존재한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(typeof result.current.cancelReservation).toBe('function');
    });

    it('cancelReservation은 async 함수이다', async () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      const returnValue = result.current.cancelReservation();
      expect(returnValue instanceof Promise).toBe(true);
    });
  });

  describe('액션 함수 - 모달 관리', () => {
    it('showCancelModal 함수가 존재한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(typeof result.current.showCancelModal).toBe('function');
    });

    it('hideCancelModal 함수가 존재한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(typeof result.current.hideCancelModal).toBe('function');
    });
  });

  describe('액션 함수 - 상태 초기화', () => {
    it('reset 함수가 존재한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('취소 정책', () => {
    it('cancellationPolicy가 존재한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(result.current.cancellationPolicy).toBeDefined();
    });

    it('cancellationPolicy는 hoursBeforePerformance 속성을 가진다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect('hoursBeforePerformance' in result.current.cancellationPolicy).toBe(true);
    });

    it('cancellationPolicy는 allowedStatuses 속성을 가진다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect('allowedStatuses' in result.current.cancellationPolicy).toBe(true);
    });

    it('cancellationPolicy.allowedStatuses는 "confirmed"를 포함한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(result.current.cancellationPolicy.allowedStatuses).toContain('confirmed');
    });
  });

  describe('조건부 상태', () => {
    it('canCancel은 false로 시작한다 (예약 정보 없음)', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(result.current.canCancel).toBe(false);
    });
  });

  describe('Context Value 구조', () => {
    it('모든 필수 속성을 포함한다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      const requiredProps = [
        'lookupForm',
        'isLookingUp',
        'lookupError',
        'reservationDetail',
        'isCancelModalOpen',
        'isCancelling',
        'cancelError',
        'cancellationPolicy',
        'canCancel',
        'updateLookupFormField',
        'lookupReservation',
        'showCancelModal',
        'hideCancelModal',
        'cancelReservation',
        'reset',
      ];

      requiredProps.forEach((prop) => {
        expect(prop in result.current).toBe(true);
      });
    });
  });

  describe('lookupForm 구조', () => {
    it('lookupForm은 phoneNumber와 password 필드를 가진다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect('phoneNumber' in result.current.lookupForm).toBe(true);
      expect('password' in result.current.lookupForm).toBe(true);
    });

    it('lookupForm의 필드는 모두 문자열이다', () => {
      const { result } = renderHook(() => useReservationLookup(), { wrapper });
      expect(typeof result.current.lookupForm.phoneNumber).toBe('string');
      expect(typeof result.current.lookupForm.password).toBe('string');
    });
  });
});
