"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import {
  ReservationDetailResponseSchema,
  type ReservationDetailResponse,
} from "@/features/reservation/lib/dto";

const fetchReservationDetail = async (
  reservationId: string
): Promise<ReservationDetailResponse> => {
  const response = await apiClient.get<ReservationDetailResponse>(
    `/api/reservations/${reservationId}`
  );
  const parsed = ReservationDetailResponseSchema.safeParse(response.data);

  if (!parsed.success) {
    throw new Error("Invalid reservation detail response schema");
  }

  return parsed.data;
};

export const useReservationDetailQuery = (reservationId: string | null) => {
  return useQuery({
    queryKey: ["reservation", "detail", reservationId],
    queryFn: () => fetchReservationDetail(reservationId!),
    enabled: !!reservationId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useReservationDetail = (reservationId: string | null) => {
  const query = useReservationDetailQuery(reservationId);

  return {
    reservation: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? extractApiErrorMessage(query.error) : null,
    refetch: query.refetch,
  };
};
