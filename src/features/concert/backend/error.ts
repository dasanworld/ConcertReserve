export const concertErrorCodes = {
  fetchFailed: 'CONCERT_FETCH_FAILED',
  validationError: 'CONCERT_VALIDATION_ERROR',
  notFound: 'CONCERT_NOT_FOUND',
} as const;

type ConcertErrorValue =
  (typeof concertErrorCodes)[keyof typeof concertErrorCodes];

export type ConcertServiceError = ConcertErrorValue;
