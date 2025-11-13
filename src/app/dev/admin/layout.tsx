'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-8 py-4 flex items-center gap-4">
          <Link
            href="/dev"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">개발 페이지로</span>
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
