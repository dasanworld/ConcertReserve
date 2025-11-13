'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, XCircle } from 'lucide-react';

interface CancelResultDialogProps {
  // 대화상자 열기 상태
  isOpen: boolean;
  // 성공/실패 여부
  isSuccess: boolean;
  // 메시지
  message: string;
  // 닫기 핸들러
  onClose: () => void;
}

/**
 * 예약 취소 결과 다이얼로그 컴포넌트
 * 성공/실패 결과를 사용자에게 알림
 */
export const CancelResultDialog = ({
  isOpen,
  isSuccess,
  message,
  onClose,
}: CancelResultDialogProps) => {
  const icon = isSuccess ? (
    <CheckCircle2 className="h-6 w-6 text-green-600" />
  ) : (
    <XCircle className="h-6 w-6 text-red-600" />
  );

  const title = isSuccess ? '예약 취소 성공' : '예약 취소 실패';
  const titleClassName = isSuccess ? 'text-green-700' : 'text-red-700';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {icon}
            <AlertDialogTitle className={titleClassName}>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end">
          <AlertDialogAction onClick={onClose}>
            확인
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
