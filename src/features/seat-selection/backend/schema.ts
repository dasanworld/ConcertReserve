import { z } from 'zod';

// Seat status enum (matching DB enum: available, temporarily_held, reserved)
export const SeatStatusSchema = z.enum(['available', 'temporarily_held', 'reserved']);
export type SeatStatus = z.infer<typeof SeatStatusSchema>;

// DB Row Schemas
export const SeatTierRowSchema = z.object({
  id: z.string().uuid(),
  concert_id: z.string().uuid(),
  label: z.string(),
  price: z.string(), // numeric comes from DB as string
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});

export type SeatTierRow = z.infer<typeof SeatTierRowSchema>;

export const SeatRowSchema = z.object({
  id: z.string().uuid(),
  concert_id: z.string().uuid(),
  seat_tier_id: z.string().uuid(),
  label: z.string(),
  status: SeatStatusSchema,
  hold_expires_at: z.string().nullable(),
  section_label: z.string().nullable(),
  row_label: z.string().nullable(),
  row_number: z.number().int().nullable(),
  seat_number: z.number().int().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});

export type SeatRow = z.infer<typeof SeatRowSchema>;

// Response DTOs
export const SeatTierInfoSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  price: z.number(),
  availableCount: z.number(),
  heldCount: z.number(),
  reservedCount: z.number(),
  totalCount: z.number(),
});

export type SeatTierInfo = z.infer<typeof SeatTierInfoSchema>;

export const SeatInfoSchema = z.object({
  id: z.string().uuid(),
  seatTierId: z.string().uuid(),
  seatTierLabel: z.string(),
  label: z.string(),
  sectionLabel: z.string(),
  rowLabel: z.string(),
  rowNumber: z.number().int(),
  seatNumber: z.number().int(),
  status: SeatStatusSchema,
  price: z.number(),
  holdExpiresAt: z.string().nullable(),
});

export type SeatInfo = z.infer<typeof SeatInfoSchema>;

export const SeatsResponseSchema = z.object({
  concertId: z.string().uuid(),
  concertTitle: z.string(),
  tiers: z.array(SeatTierInfoSchema),
  seats: z.array(SeatInfoSchema),
});

export type SeatsResponse = z.infer<typeof SeatsResponseSchema>;

// Seat Hold Request/Response
export const SeatHoldRequestSchema = z.object({
  concertId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()).min(1).max(10), // 최대 10석 제한
});

export type SeatHoldRequest = z.infer<typeof SeatHoldRequestSchema>;

export const HeldSeatSummarySchema = z.object({
  seatId: z.string().uuid(),
  label: z.string(),
  seatTierLabel: z.string(),
  price: z.number(),
});

export type HeldSeatSummary = z.infer<typeof HeldSeatSummarySchema>;

export const SeatHoldResponseSchema = z.object({
  holdExpiresAt: z.string(),
  heldSeats: z.array(HeldSeatSummarySchema),
  totalAmount: z.number(),
});

export type SeatHoldResponse = z.infer<typeof SeatHoldResponseSchema>;
