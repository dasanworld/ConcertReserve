'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useReservationLookupContext } from '@/features/reservation/lookup/reservation-lookup-provider';

export const LookupForm = () => {
  const { lookupForm, updateLookupFormField, lookupError } =
    useReservationLookupContext();

  return (
    <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
      <div className="space-y-2">
        <Label htmlFor="lookup-phone">휴대폰 번호</Label>
        <Input
          id="lookup-phone"
          type="tel"
          placeholder="010-1234-5678"
          autoComplete="tel"
          value={lookupForm.phoneNumber}
          onChange={(event) =>
            updateLookupFormField('phoneNumber', event.target.value)
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lookup-password">비밀번호</Label>
        <Input
          id="lookup-password"
          type="password"
          placeholder="비밀번호를 입력해주세요"
          autoComplete="current-password"
          value={lookupForm.password}
          onChange={(event) =>
            updateLookupFormField('password', event.target.value)
          }
        />
      </div>

      {lookupError && (
        <p className="text-sm text-red-600">{lookupError}</p>
      )}
    </form>
  );
};
