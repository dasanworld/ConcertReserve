import { z } from 'zod';

// DB Row Schema
export const ConcertTableRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  thumbnail_url: z.string().nullable(),
  concert_date: z.string().nullable(),
  venue: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});

export type ConcertRow = z.infer<typeof ConcertTableRowSchema>;

// Response Schema
export const ConcertListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  thumbnailUrl: z.string(),
  concertDate: z.string().nullable(),
  venue: z.string().nullable(),
});

export type ConcertListItem = z.infer<typeof ConcertListItemSchema>;

export const ConcertListResponseSchema = z.array(ConcertListItemSchema);

export type ConcertListResponse = z.infer<typeof ConcertListResponseSchema>;

// Seat Tier Schema
export const SeatTierSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  price: z.number(),
  totalSeats: z.number(),
  availableSeats: z.number(),
  temporarilyHeldSeats: z.number(),
  reservedSeats: z.number(),
});

export type SeatTier = z.infer<typeof SeatTierSchema>;

// Concert Detail Response Schema
export const ConcertDetailResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  thumbnailUrl: z.string(),
  concertDate: z.string().nullable(),
  venue: z.string().nullable(),
  seatTiers: z.array(SeatTierSchema),
  totalSeats: z.number(),
  availableSeats: z.number(),
  temporarilyHeldSeats: z.number(),
  reservedSeats: z.number(),
});

export type ConcertDetailResponse = z.infer<typeof ConcertDetailResponseSchema>;
