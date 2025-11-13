"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { useReservationDetail } from "@/features/reservation/hooks/use-reservation-detail-query";
import { SuccessMessage } from "@/features/reservation/components/success-message";
import { ReservationNumberDisplay } from "@/features/reservation/components/reservation-number-display";
import { ReservationDetails } from "@/features/reservation/components/reservation-details";
import { ActionButtons } from "@/features/reservation/components/action-buttons";

export default function ReservationCompletePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams.get("id");

  const { reservation, isLoading, error } = useReservationDetail(reservationId);

  useEffect(() => {
    if (!reservationId) {
      router.push("/");
    }
  }, [reservationId, router]);

  if (!reservationId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-4 py-8">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center space-y-4 py-8">
            <div className="rounded-full bg-red-100 p-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                예약 정보를 찾을 수 없습니다
              </h2>
              <p className="mt-2 text-gray-600">
                {error || "예약 정보를 불러오는 중 오류가 발생했습니다."}
              </p>
            </div>
            <Button
              variant="default"
              size="lg"
              onClick={() => router.push("/")}
              className="mt-4"
            >
              <Home className="mr-2 h-4 w-4" />
              홈으로 가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="space-y-8">
        <SuccessMessage />
        <ReservationNumberDisplay reservationNumber={reservation.reservationNumber} />
        <ReservationDetails reservation={reservation} />
        <ActionButtons />
      </div>
    </div>
  );
}
