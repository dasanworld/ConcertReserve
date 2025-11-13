"use client";

import { useConcertList } from "@/features/concert/hooks/useConcertListQuery";
import { ConcertCardList } from "@/features/concert/components/concert-card-list";

export default function Home() {
  const { concerts, isLoading: isConcertsLoading, error } = useConcertList();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <header className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
            예약 가능한 콘서트
          </h1>
          <p className="max-w-3xl text-base text-gray-600 md:text-lg">
            원하는 공연을 선택하고 좌석을 예약하세요.
          </p>
        </header>

        <section>
          <ConcertCardList
            concerts={concerts}
            isLoading={isConcertsLoading}
            error={error}
          />
        </section>
      </div>
    </main>
  );
}
