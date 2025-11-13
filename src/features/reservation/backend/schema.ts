import { z } from 'zod';
import {
  PHONE_NUMBER_REGEX,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  MIN_SEAT_COUNT,
  MAX_SEAT_COUNT,
  CUSTOMER_NAME_MIN_LENGTH,
  CUSTOMER_NAME_MAX_LENGTH,
} from '@/features/reservation/constants';

// 휴대폰 번호를 010-XXXX-XXXX 형식으로 정규화
const normalizePhoneNumber = (phone: string): string => {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length === 11) {
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`;
  }
  return phone;
};

// Seat Detail Schema (좌석 상세 정보)
export const SeatDetailSchema = z.object({
  seatId: z.string().uuid(),
  label: z.string(),
  tierLabel: z.string(),
  price: z.number(),
});

export type SeatDetail = z.infer<typeof SeatDetailSchema>;

// Create Reservation Request Schema (예약 생성 요청)
export const CreateReservationRequestSchema = z.object({
  seatIds: z
    .array(z.string().uuid())
    .min(MIN_SEAT_COUNT, `최소 ${MIN_SEAT_COUNT}석을 선택해야 합니다.`)
    .max(MAX_SEAT_COUNT, `최대 ${MAX_SEAT_COUNT}석까지 선택할 수 있습니다.`),
  customerName: z
    .string()
    .trim()
    .min(CUSTOMER_NAME_MIN_LENGTH, `이름은 최소 ${CUSTOMER_NAME_MIN_LENGTH}자 이상이어야 합니다.`)
    .max(CUSTOMER_NAME_MAX_LENGTH, `이름은 최대 ${CUSTOMER_NAME_MAX_LENGTH}자까지 입력할 수 있습니다.`),
  phoneNumber: z
    .string()
    .transform(normalizePhoneNumber)
    .regex(PHONE_NUMBER_REGEX, '휴대폰 번호 형식이 올바르지 않습니다. (010-XXXX-XXXX 또는 01000000000)'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`)
    .max(PASSWORD_MAX_LENGTH, `비밀번호는 최대 ${PASSWORD_MAX_LENGTH}자까지 입력할 수 있습니다.`),
});

export type CreateReservationRequest = z.infer<typeof CreateReservationRequestSchema>;

// Create Reservation Response Schema (예약 생성 성공 응답)
export const CreateReservationResponseSchema = z.object({
  reservationId: z.string().uuid(),
  reservationNumber: z.string(),
  customerName: z.string(),
  phoneNumber: z.string(),
  concertId: z.string().uuid(),
  concertTitle: z.string(),
  seats: z.array(SeatDetailSchema),
  totalAmount: z.number(),
  seatCount: z.number(),
  createdAt: z.string(),
});

export type CreateReservationResponse = z.infer<typeof CreateReservationResponseSchema>;

// Reservation Detail Response Schema (예약 상세 조회 응답)
export const ReservationDetailResponseSchema = z.object({
  reservationId: z.string().uuid(),
  reservationNumber: z.string(),
  customerName: z.string(),
  phoneNumber: z.string(),
  status: z.enum(['confirmed', 'cancelled']),
  concertId: z.string().uuid(),
  concertTitle: z.string(),
  concertDate: z.string().nullable(),
  concertVenue: z.string().nullable(),
  seats: z.array(SeatDetailSchema),
  totalAmount: z.number(),
  seatCount: z.number(),
  createdAt: z.string(),
});

export type ReservationDetailResponse = z.infer<typeof ReservationDetailResponseSchema>;

// Reservation Lookup Request Schema (예약 조회 요청)
export const ReservationLookupRequestSchema = z.object({
  phoneNumber: z
    .string()
    .transform(normalizePhoneNumber)
    .regex(PHONE_NUMBER_REGEX, '휴대폰 번호 형식이 올바르지 않습니다. (010-XXXX-XXXX 또는 01000000000)'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`)
    .max(PASSWORD_MAX_LENGTH, `비밀번호는 최대 ${PASSWORD_MAX_LENGTH}자까지 입력할 수 있습니다.`),
});

export type ReservationLookupRequest = z.infer<typeof ReservationLookupRequestSchema>;

// Reservation Lookup Response Schema (예약 조회 응답)
export const ReservationLookupResponseSchema = z.object({
  reservationId: z.string().uuid(),
  redirectUrl: z.string(),
});

export type ReservationLookupResponse = z.infer<typeof ReservationLookupResponseSchema>;
