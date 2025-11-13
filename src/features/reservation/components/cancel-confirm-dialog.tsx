'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CancelConfirmDialogProps {
  // 대화상자 열기 상태
  isOpen: boolean;
  // 확인 버튼 클릭 핸들러
  onConfirm: () => void;
  // 취소 버튼 클릭 핸들러
  onCancel: () => void;
  // 로딩 상태
  isLoading?: boolean;
}

/**
 * 예약 취소 확인 대화상자 컴포넌트
 * 사용자의 실수를 방지하기 위한 확인 대화상자
 */
export const CancelConfirmDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  isLoading = false,
}: CancelConfirmDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>예약을 취소하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            예약을 취소하면 선택하신 좌석이 해제됩니다. 이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel disabled={isLoading}>
            아니요, 취소하기
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? '취소 중...' : '예, 취소하겠습니다'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

