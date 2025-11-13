"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import {
  ConcertListResponseSchema,
  type ConcertListResponse,
} from "@/features/concert/lib/dto";

const fetchConcertList = async (): Promise<ConcertListResponse> => {
  const response = await apiClient.get<ConcertListResponse>("/api/concerts");
  const parsed = ConcertListResponseSchema.safeParse(response.data);

  if (!parsed.success) {
    throw new Error("Invalid concert list response schema");
  }

  return parsed.data;
};

export const useConcertListQuery = () => {
  return useQuery({
    queryKey: ["concerts", "list"],
    queryFn: fetchConcertList,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useConcertList = () => {
  const query = useConcertListQuery();

  return {
    concerts: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? extractApiErrorMessage(query.error) : null,
    refetch: query.refetch,
  };
};
