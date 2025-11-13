// Re-export backend schemas for frontend use
export {
  SeatStatusSchema,
  SeatTierInfoSchema,
  SeatInfoSchema,
  SeatsResponseSchema,
  SeatHoldRequestSchema,
  SeatHoldResponseSchema,
  type SeatStatus,
  type SeatTierInfo,
  type SeatInfo,
  type SeatsResponse,
  type SeatHoldRequest,
  type SeatHoldResponse,
} from '@/features/seat-selection/backend/schema';
