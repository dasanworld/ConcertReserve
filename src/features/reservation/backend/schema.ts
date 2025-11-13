import { z } from 'zod';

// Seat Detail Schema (좌석 상세 정보)
export const SeatDetailSchema = z.object({
  seatId: z.string().uuid(),
  label: z.string(),
  tierLabel: z.string(),
  price: z.number(),
});

export type SeatDetail = z.infer<typeof SeatDetailSchema>;

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
