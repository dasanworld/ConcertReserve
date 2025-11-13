'use client';
import { SeatTierList } from '@/features/concert/components/seat-tier-list';
import { useConcertListQuery } from '@/features/concert/hooks/useConcertListQuery';
import { useConcertDetailQuery } from '@/features/concert/hooks/useConcertDetailQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const EXPECTED_TIER_TOTALS: Record<string, number> = {
  Special: 48,
  Premium: 64,
  Advanced: 128,
  Regular: 80,
};

const StatusBadge = ({ ok }: { ok: boolean }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
      }`}
    >
      {ok ? 'OK' : 'Mismatch'}
    </span>
  );
};

const ConcertAuditCard = ({ concertId, title }: { concertId: string; title: string }) => {
  const { data, isLoading, error } = useConcertDetailQuery(concertId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            좌석 정보를 불러오는 데 실패했습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const tierAudit = data.seatTiers.map((tier) => {
    const expectedSeatTotal = EXPECTED_TIER_TOTALS[tier.label];
    const matchesExpected =
      typeof expectedSeatTotal === 'number'
        ? tier.totalSeats === expectedSeatTotal
        : true;
    const rowsPresent = tier.layoutSummary.rows.length > 0;
    const sectionsPresent = tier.layoutSummary.sections.length > 0;

    return {
      id: tier.id,
      label: tier.label,
      matchesExpected,
      rowsPresent,
      sectionsPresent,
      seatsPerRow: tier.layoutSummary.seatsPerRow,
      expectedSeatTotal,
      totalSeats: tier.totalSeats,
    };
  });

  const aggregateStatus = tierAudit.every(
    (tier) => tier.matchesExpected && tier.rowsPresent && tier.sectionsPresent,
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <p className="text-sm text-gray-500">
            좌석 등급 배치와 시드 데이터 정합성 검증
          </p>
        </div>
        <StatusBadge ok={aggregateStatus} />
      </CardHeader>
      <CardContent className="space-y-4">
        <SeatTierList seatTiers={data.seatTiers} />
        <div className="space-y-2">
          {tierAudit.map((tier) => (
            <div
              key={tier.id}
              className="flex flex-wrap items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div className="font-semibold">{tier.label}</div>
              <div className="flex flex-wrap gap-3 text-gray-600">
                <span>
                  총 {tier.totalSeats}석
                  {typeof tier.expectedSeatTotal === 'number' &&
                    ` / 기대 ${tier.expectedSeatTotal}석`}
                </span>
                <span>구역 {tier.sectionsPresent ? '정상' : '누락'}</span>
                <span>행 {tier.rowsPresent ? '정상' : '누락'}</span>
                <span>행당 {tier.seatsPerRow}석</span>
              </div>
              <StatusBadge ok={tier.matchesExpected && tier.rowsPresent && tier.sectionsPresent} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default function SeatAuditPage() {
  const { data, isLoading, error } = useConcertListQuery();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">좌석 등급 시각 검증</h1>
        <p className="mt-2 text-gray-600">
          샘플 콘서트의 좌석 등급 시드 데이터와 UI 구성을 한 곳에서 확인합니다.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          콘서트 목록을 불러오지 못했습니다.
        </div>
      )}

      <div className="space-y-6">
        {(data ?? []).map((concert) => (
          <ConcertAuditCard
            key={concert.id}
            concertId={concert.id}
            title={concert.title}
          />
        ))}
      </div>
    </div>
  );
}
