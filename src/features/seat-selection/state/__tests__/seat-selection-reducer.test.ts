import {
  seatSelectionReducer,
  seatSelectionInitialState,
} from '@/features/seat-selection/state/seat-selection-context';

describe('seatSelectionReducer', () => {
  it('adds and removes seat ids while enforcing limits', () => {
    const selected = seatSelectionReducer(seatSelectionInitialState, {
      type: 'SELECT_SEAT',
      payload: { seatId: 'A' },
    });

    expect(selected.selectedSeatIds).toEqual(['A']);

    const deselected = seatSelectionReducer(selected, {
      type: 'DESELECT_SEAT',
      payload: { seatId: 'A' },
    });

    expect(deselected.selectedSeatIds).toEqual([]);
  });

  it('marks seats unavailable then clears automatically', () => {
    const marked = seatSelectionReducer(seatSelectionInitialState, {
      type: 'MARK_UNAVAILABLE',
      payload: { seatIds: ['seat-1', 'seat-2'] },
    });

    expect(marked.unavailableSeatIds).toEqual(['seat-1', 'seat-2']);

    const cleared = seatSelectionReducer(marked, { type: 'CLEAR_UNAVAILABLE' });
    expect(cleared.unavailableSeatIds).toEqual([]);
  });
});
