import { create } from 'zustand';

interface SheetState {
  isRideSheetOpen: boolean;
  rideFocusId?: string;
  setRideSheet(open: boolean, rideId?: string): void;
}

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface ToastState {
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

type UIState = SheetState & ToastState;

export const useUIStore = create<UIState>((set) => ({
  isRideSheetOpen: false,
  rideFocusId: undefined,
  setRideSheet: (open, rideId) =>
    set(() => ({
      isRideSheetOpen: open,
      rideFocusId: rideId,
    })),
  toasts: [],
  pushToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
      ],
    })),
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

