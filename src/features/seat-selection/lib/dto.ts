// Re-export backend schemas for frontend use
export {
  SeatStatusSchema,
  SeatTierInfoSchema,
  SeatInfoSchema,
  SeatsResponseSchema,
  SeatHoldRequestSchema,
  SeatHoldResponseSchema,
  HeldSeatSummarySchema,
  type SeatStatus,
  type SeatTierInfo,
  type SeatInfo,
  type SeatsResponse,
  type SeatHoldRequest,
  type SeatHoldResponse,
  type HeldSeatSummary,
} from '@/features/seat-selection/backend/schema';
