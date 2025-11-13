export const seatSelectionErrorCodes = {
  concertNotFound: 'CONCERT_NOT_FOUND',
  fetchFailed: 'FETCH_FAILED',
  validationError: 'VALIDATION_ERROR',
  seatsNotAvailable: 'SEATS_NOT_AVAILABLE',
  seatAlreadyHeld: 'SEAT_ALREADY_HELD',
  seatAlreadyReserved: 'SEAT_ALREADY_RESERVED',
  holdFailed: 'HOLD_FAILED',
  invalidSeatIds: 'INVALID_SEAT_IDS',
  exceededMaxSeats: 'EXCEEDED_MAX_SEATS',
} as const;

export type SeatSelectionServiceError =
  (typeof seatSelectionErrorCodes)[keyof typeof seatSelectionErrorCodes];
