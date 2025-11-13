import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock use-toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock Zustand store
vi.mock('@/stores/useReservationSession', () => {
  const mockState = {
    heldInfo: null,
    setHeldInfo: vi.fn(),
    clearHeldInfo: vi.fn(),
    consumeHeldInfo: vi.fn(() => null),
  };

  return {
    useReservationSession: vi.fn((selector) => {
      if (typeof selector === 'function') {
        return selector(mockState);
      }
      return mockState;
    }),
  };
});
