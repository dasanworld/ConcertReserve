'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useReservationProcess } from '@/features/reservation/hooks/use-reservation-process';
import type { ReservationProcessContextValue } from '@/features/reservation/hooks/use-reservation-process';

const ReservationProcessContext = createContext<ReservationProcessContextValue | null>(
  null,
);

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
