'use client';

import { Controller } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { LookupFormData } from '@/features/reservation/hooks/use-lookup-form-validation';
import type { UseFormReturn } from 'react-hook-form';

interface LookupFormProps {
  // react-hook-form의 form 객체
  form: UseFormReturn<LookupFormData>;
}

/**
 * 예약 조회 입력 폼 컴포넌트
 * 휴대폰 번호와 비밀번호 입력 필드 제공
 */
export const LookupForm = ({ form }: LookupFormProps) => {
  return (
    <Form {...form}>
      <form className="space-y-6">
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
                  placeholder="비밀번호를 입력해주세요"
                  autoComplete="current-password"
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

