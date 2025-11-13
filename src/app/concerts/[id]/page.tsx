'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useConcertDetailQuery } from '@/features/concert/hooks/useConcertDetailQuery';
import { ConcertHeroSection } from '@/features/concert/components/concert-hero-section';
import { ConcertInfo } from '@/features/concert/components/concert-info';
import { SeatTierList } from '@/features/concert/components/seat-tier-list';
import { ConcertAvailability } from '@/features/concert/components/concert-availability';
import { BookingButton } from '@/features/concert/components/booking-button';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConcertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const concertId = params.id as string;

  const { data, isLoading, error } = useConcertDetailQuery(concertId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <Skeleton className="h-64 md:h-96 w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              콘서트를 찾을 수 없습니다
            </h1>
            <p className="text-gray-600">
              요청하신 콘서트 정보를 찾을 수 없습니다.
              <br />
              콘서트 목록에서 다시 선택해주세요.
            </p>
            <div className="pt-4">
              <Button
                onClick={() => router.push('/')}
                className="w-full"
                size="lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                홈으로 돌아가기
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>목록으로</span>
          </Link>
        </div>

        <ConcertHeroSection
          thumbnailUrl={data.thumbnailUrl}
          title={data.title}
        />

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <ConcertInfo concertDate={data.concertDate} venue={data.venue} />

          <ConcertAvailability
            availableSeats={data.availableSeats}
            totalSeats={data.totalSeats}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <SeatTierList seatTiers={data.seatTiers} />
        </div>
      </div>

      <BookingButton concertId={data.id} availableSeats={data.availableSeats} />
    </div>
  );
}
