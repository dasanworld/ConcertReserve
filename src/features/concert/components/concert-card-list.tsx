"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { ConcertCard } from "./concert-card";
import type { ConcertListItem } from "@/features/concert/lib/dto";

type ConcertCardListProps = {
  concerts: ConcertListItem[];
  isLoading: boolean;
  error: string | null;
};

export const ConcertCardList = ({
  concerts,
  isLoading,
  error,
}: ConcertCardListProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
        <p className="text-slate-300">콘서트 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-900/50 bg-red-950/30 py-20">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <div className="text-center">
          <p className="text-lg font-semibold text-red-300">
            콘서트 목록을 불러올 수 없습니다
          </p>
          <p className="mt-2 text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (concerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-700 bg-slate-900/60 py-20">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-300">
            예약 가능한 콘서트가 없습니다.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            곧 새로운 공연이 공개될 예정입니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {concerts.map((concert) => (
        <ConcertCard key={concert.id} concert={concert} />
      ))}
    </div>
  );
};
