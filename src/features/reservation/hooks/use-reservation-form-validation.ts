'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  PHONE_NUMBER_REGEX,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  CUSTOMER_NAME_MIN_LENGTH,
  CUSTOMER_NAME_MAX_LENGTH,
} from '@/features/reservation/constants';

// 예약 정보 입력 폼 검증 스키마
const reservationFormSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(CUSTOMER_NAME_MIN_LENGTH, `이름은 최소 ${CUSTOMER_NAME_MIN_LENGTH}자 이상이어야 합니다.`)
    .max(CUSTOMER_NAME_MAX_LENGTH, `이름은 최대 ${CUSTOMER_NAME_MAX_LENGTH}자까지 입력할 수 있습니다.`),
  phoneNumber: z
    .string()
    .regex(PHONE_NUMBER_REGEX, '휴대폰 번호 형식이 올바르지 않습니다. (010-XXXX-XXXX)'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`)
    .max(PASSWORD_MAX_LENGTH, `비밀번호는 최대 ${PASSWORD_MAX_LENGTH}자까지 입력할 수 있습니다.`),
});

export type ReservationFormData = z.infer<typeof reservationFormSchema>;

/**
 * 예약 정보 입력 폼 검증 훅
 * react-hook-form과 zod를 사용하여 폼 검증 관리
 */
export const useReservationFormValidation = () => {
  return useForm<ReservationFormData>({
    resolver: zodResolver(reservationFormSchema),
    mode: 'onChange',
    defaultValues: {
      customerName: '',
      phoneNumber: '',
      password: '',
    },
  });
};

