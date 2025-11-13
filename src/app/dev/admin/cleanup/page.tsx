'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, Play } from 'lucide-react';
import { apiClient } from '@/lib/remote/api-client';

interface CleanupResult {
  ok: boolean;
  data?: {
    message: string;
    clearedCount: number;
    expiredSeats: Array<{
      id: string;
      label: string;
      concertId: string;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

export default function AdminCleanupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executedAt, setExecutedAt] = useState<Date | null>(null);

  const handleCleanup = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient.post('/api/jobs/cleanup-expired-holds', {});
      setResult(response.data);
      setExecutedAt(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : '작업 실행 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">관리 대시보드</h1>
          <p className="text-gray-600">선점된 좌석 자동 정리 시스템 관리</p>
        </div>

        {/* Main Card */}
        <Card className="bg-white border border-gray-200 p-8 mb-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <p className="text-gray-800 text-sm leading-relaxed font-medium">
                이 페이지에서는 만료된 선점 좌석을 수동으로 정리할 수 있습니다.
                <br />
                <span className="text-gray-700">정기적으로 Vercel Cron Job에 의해 1분마다 자동 실행됩니다.</span>
              </p>
            </div>

            {/* Action Button */}
            <div className="flex gap-4">
              <Button
                onClick={handleCleanup}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <Play className="w-4 h-4" />
                {isLoading ? '실행 중...' : '정리 작업 실행'}
              </Button>
            </div>

            {/* Last Executed */}
            {executedAt && (
              <div className="text-xs text-gray-600 text-center bg-gray-50 py-2 rounded">
                마지막 실행: {executedAt.toLocaleString('ko-KR')}
              </div>
            )}
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-50 border border-red-200 p-4 mb-6 shadow-sm">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-900 font-semibold mb-1">오류 발생</h3>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Success Result */}
        {result?.ok && result.data && (
          <Card className="bg-white border border-gray-200 p-6 mb-6 shadow-md">
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">작업 완료</h3>
                  <p className="text-gray-800 text-sm mt-1">{result.data.message}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-700 text-xs uppercase tracking-wide mb-1 font-semibold">정리된 좌석</p>
                    <p className="text-3xl font-bold text-green-600">{result.data.clearedCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-700 text-xs uppercase tracking-wide mb-1 font-semibold">실행 시간</p>
                    <p className="text-sm text-gray-800 font-mono">{executedAt?.toLocaleTimeString('ko-KR')}</p>
                  </div>
                </div>
              </div>

              {/* Expired Seats List */}
              {result.data.expiredSeats && result.data.expiredSeats.length > 0 && (
                <div>
                  <h4 className="text-gray-900 font-semibold mb-3 text-sm">정리된 좌석 목록</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.data.expiredSeats.map((seat) => (
                      <div
                        key={seat.id}
                        className="flex items-center justify-between bg-green-50 rounded p-3 border border-green-200 hover:bg-green-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm text-gray-900 truncate font-medium">{seat.label}</p>
                          <p className="text-xs text-gray-600 truncate">{seat.concertId}</p>
                        </div>
                        <div className="ml-4 px-3 py-1 bg-green-100 border border-green-300 rounded text-xs text-green-700 font-semibold whitespace-nowrap">
                          ✓ 정리됨
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* No Result */}
        {result?.ok && result.data && result.data.clearedCount === 0 && (
          <Card className="bg-white border border-gray-200 p-6 shadow-md">
            <div className="flex gap-3 items-start">
              <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-amber-900">작업 완료</h3>
                <p className="text-gray-800 text-sm mt-1">만료된 선점 좌석이 없습니다.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-gray-300">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <p className="text-gray-600 text-xs uppercase tracking-wide mb-1 font-semibold">자동 실행</p>
              <p className="text-gray-900 font-bold">1분마다</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
              <p className="text-gray-600 text-xs uppercase tracking-wide mb-1 font-semibold">마지막 상태</p>
              <p className="text-gray-900 font-bold">
                {result?.ok ? '성공' : result ? '실패' : '-'}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <p className="text-gray-600 text-xs uppercase tracking-wide mb-1 font-semibold">정리 대상</p>
              <p className="text-gray-900 font-bold text-xs leading-snug">
                temporarily_held
                <br />
                (만료됨)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
