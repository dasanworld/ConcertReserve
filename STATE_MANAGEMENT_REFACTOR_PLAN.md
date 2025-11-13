# 상태 관리 리팩터링 계획 (Phase 1)

목표: `docs/state-management.md`에서 요구한 좌석 선택/예약 절차 흐름을 실제 코드에 녹여 **단일한 상태 공급원**, **세션 전파**, **React Query + Reducer 결합** 구조를 마련한다.

## 1. 좌석 선택 상태 (SeatSelection)
- `SeatSelectionProvider` + `useSeatSelectionContext` 구현
  - 내부에서 `useSeatsQuery`, `useSeatHoldMutation`을 캡슐화.
  - Reducer(`selectedSeatIds`, `selectionError`, `unavailableSeatIds`)와 파생 상태(`enhancedSeatMap`, `selectedSeats`, `totalAmount`, `remainingSelectable`)를 관리.
  - Context Value는 `useMemo`/`useCallback`으로 고정하고, UI는 provider 외부에서 더 이상 React Query를 직접 호출하지 않는다.
- `SeatMapViewer`, `SelectedSeatsPanel`, `SeatHoldButton` 등은 Context 값을 소비하게 리팩터링.
- 실패 좌석 강조(`markUnavailable`)와 선택 한도 검증을 Reducer 액션으로 통일.

## 2. 좌석 선점 세션 & Hold API 개선
- `src/stores/useReservationSession.ts` (Zustand) 추가로 Hold → Book 페이지 간 데이터를 전달.
  - `setHeldInfo`, `consumeHeldInfo`, `clearHeldInfo` 구현.
- Hold API 응답을 `heldSeats[] + totalAmount + holdExpiresAt` 형태로 확장하여 예약 단계에 필요한 데이터 손실 없이 전달.
- SeatSelection Provider가 선점 성공 시 세션에 `concertId/title`, `heldSeats`, `totalAmount`, `holdExpiresAt`를 저장하고 `/book`으로 이동하도록 변경.

## 3. 예약 절차 상태 (ReservationProcess)
- `/book` 경로 추가, `ReservationProcessProvider`로 래핑.
  - Provider는 세션에서 hold 정보를 읽어 초기화하고, 없으면 홈으로 리다이렉트.
  - Reducer/Ticker로 `countdownSeconds`, `isHoldExpired`를 추적.
  - `useReservationFormValidation` + `useCreateReservationMutation`을 내부에서 사용하여 Context를 통해 `form`, `submitReservation`, `isSubmitting`, `submissionError` 등을 노출.
- 기존 `/reservations/form` 로직을 `/book` 흐름에 통합하고, UI 컴포넌트는 새 Context 값을 사용하도록 조정.

> Phase 2(예약 조회/취소 Context 통합)는 좌석/예약 핵심 흐름 안정화 이후에 진행한다.
