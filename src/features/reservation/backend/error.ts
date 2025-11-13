export const reservationErrorCodes = {
  notFound: 'RESERVATION_NOT_FOUND',
  dbError: 'RESERVATION_DB_ERROR',
} as const;

type ReservationErrorValue =
  (typeof reservationErrorCodes)[keyof typeof reservationErrorCodes];

export type ReservationServiceError = ReservationErrorValue;
