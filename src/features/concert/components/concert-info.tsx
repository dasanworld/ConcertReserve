'use client';

import { Calendar, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ConcertInfoProps {
  concertDate: string | null;
  venue: string | null;
}

export const ConcertInfo = ({ concertDate, venue }: ConcertInfoProps) => {
  const formattedDate = concertDate
    ? format(parseISO(concertDate), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })
    : null;

  return (
    <div className="space-y-3">
      {formattedDate && (
        <div className="flex items-center gap-3 text-gray-700">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="text-lg">{formattedDate}</span>
        </div>
      )}
      {venue && (
        <div className="flex items-center gap-3 text-gray-700">
          <MapPin className="w-5 h-5 text-blue-600" />
          <span className="text-lg">{venue}</span>
        </div>
      )}
    </div>
  );
};
