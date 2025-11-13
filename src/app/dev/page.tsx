'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowRight, Database, Settings, ClipboardList } from 'lucide-react';

export default function DevPage() {
  const devTools = [
    {
      title: '좌석 감시 (Seat Audit)',
      description: '콘서트별 좌석 상태 확인 및 검증',
      href: '/dev/seat-audit',
      icon: Database,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: '선점 정리 관리',
      description: '만료된 선점 좌석 수동 정리 및 모니터링',
      href: '/dev/admin/cleanup',
      icon: Settings,
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">개발 도구</h1>
          <p className="text-gray-600">시스템 상태 모니터링 및 관리 도구</p>
        </div>

        {/* Tools Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {devTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href}>
                <Card className="h-full hover:shadow-lg transition-all cursor-pointer bg-white border border-gray-200 overflow-hidden group">
                  <div className={`h-1 bg-gradient-to-r ${tool.color}`} />
                  
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${tool.color} text-white`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">
                        {tool.title}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex gap-3">
            <ClipboardList className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">개발 환경 안내</h3>
              <p className="text-sm text-blue-800">
                이 페이지는 개발 및 테스트 목적으로만 사용됩니다. 
                프로덕션 환경에서는 접근이 제한됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
