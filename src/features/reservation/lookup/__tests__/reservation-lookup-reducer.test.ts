import {
  reservationLookupReducer,
  initialLookupState,
} from '@/features/reservation/lookup/reservation-lookup-provider';

const mockReservation = {
  reservationId: '11111111-1111-1111-1111-111111111111',
  reservationNumber: 'RES000',
  customerName: 'Tester',
  phoneNumber: '010-1234-5678',
  status: 'confirmed' as const,
  concertId: '22222222-2222-2222-2222-222222222222',
  concertTitle: '테스트 콘서트',
  concertDate: null,
  concertVenue: null,
  seats: [],
  totalAmount: 0,
  seatCount: 0,
  createdAt: new Date().toISOString(),
};

describe('reservationLookupReducer', () => {
  it('updates lookup form fields', () => {
    const next = reservationLookupReducer(initialLookupState, {
      type: 'UPDATE_LOOKUP_FORM',
      payload: { field: 'phoneNumber', value: '010-0000-0000' },
    });

    expect(next.lookupForm.phoneNumber).toBe('010-0000-0000');
  });

  it('stores reservation detail on lookup success', () => {
    const next = reservationLookupReducer(initialLookupState, {
      type: 'LOOKUP_SUCCESS',
      payload: mockReservation,
    });

    expect(next.reservationDetail?.reservationId).toBe(mockReservation.reservationId);
  });

  it('marks reservation as cancelled on cancel success', () => {
    const loadedState = {
      ...initialLookupState,
      reservationDetail: mockReservation,
    };

    const next = reservationLookupReducer(loadedState, { type: 'CANCEL_SUCCESS' });

    expect(next.reservationDetail?.status).toBe('cancelled');
  });
});
