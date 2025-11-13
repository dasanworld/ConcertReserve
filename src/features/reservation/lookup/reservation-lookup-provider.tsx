'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useReservationLookup } from '@/features/reservation/hooks/use-reservation-lookup';
import type { ReservationLookupContextValue } from '@/features/reservation/hooks/use-reservation-lookup';

const ReservationLookupContext = createContext<ReservationLookupContextValue | null>(
  null,
);

/**
 * 얇은 래퍼 Provider: useReservationLookup Custom Hook의 반환값을 하위 컴포넌트에 주입
 */
export const ReservationLookupProvider = ({ children }: { children: ReactNode }) => {
  const value = useReservationLookup();

  return (
    <ReservationLookupContext.Provider value={value}>
      {children}
    </ReservationLookupContext.Provider>
  );
};

export const useReservationLookupContext = () => {
  const context = useContext(ReservationLookupContext);
  if (!context) {
    throw new Error('ReservationLookupContext가 초기화되지 않았습니다.');
  }
  return context;
};

// Re-export types and constants from hook for backward compatibility
export { type CancellationPolicy } from '@/features/reservation/hooks/use-reservation-lookup';
