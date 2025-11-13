"use client";

import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { ConcertListItem } from "@/features/concert/lib/dto";

type ConcertCardProps = {
  concert: ConcertListItem;
};

export const ConcertCard = ({ concert }: ConcertCardProps) => {
  const formattedDate = concert.concertDate
    ? format(new Date(concert.concertDate), "yyyy년 M월 d일 (E) HH:mm", {
        locale: ko,
      })
    : "일정 미정";

  return (
    <Link
      href={`/concerts/${concert.id}`}
      className="group block overflow-hidden rounded-xl border border-slate-700 bg-slate-900/60 transition hover:border-slate-500 hover:bg-slate-800/80"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-800">
        <img
          src={concert.thumbnailUrl}
          alt={concert.title}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="space-y-3 p-5">
        <h3 className="text-lg font-semibold text-slate-100 line-clamp-2">
          {concert.title}
        </h3>
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>{formattedDate}</span>
          </div>
          {concert.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="line-clamp-1">{concert.venue}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
