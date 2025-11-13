'use client';

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { ReservationFormData } from '@/features/reservation/hooks/use-reservation-form-validation';
import type { UseFormReturn } from 'react-hook-form';

interface ReservationFormProps {
  // react-hook-form의 form 객체
  form: UseFormReturn<ReservationFormData>;
}

/**
 * 예약 정보 입력 폼 컴포넌트
 * 예약자 이름, 휴대폰 번호, 비밀번호 입력 필드 제공
 */
export const ReservationForm = ({ form }: ReservationFormProps) => {
  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* 예약자 이름 필드 */}
        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>예약자 이름</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="홍길동"
                  autoComplete="name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 휴대폰 번호 필드 */}
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>휴대폰 번호</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  placeholder="010-1234-5678"
                  autoComplete="tel"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 비밀번호 필드 */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="8~20자 비밀번호"
                  autoComplete="new-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

