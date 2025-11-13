"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReservationNumberDisplayProps {
  reservationNumber: string;
}

export const ReservationNumberDisplay = ({
  reservationNumber,
}: ReservationNumberDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reservationNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("복사 실패:", error);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-6">
      <div className="text-sm font-medium text-gray-600">예약 번호</div>
      <div className="flex items-center space-x-3">
        <div className="text-3xl font-bold text-blue-600">
          {reservationNumber}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className="h-10 w-10"
          aria-label="예약 번호 복사"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      {copied && (
        <div className="text-sm text-green-600">
          복사되었습니다!
        </div>
      )}
    </div>
  );
};
