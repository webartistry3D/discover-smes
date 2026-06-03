import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../lib/shared';
import { setAuthTokens, clearAuthTokens } from '../lib/api';

interface AuthState {
  user: (User & { vendorId?: string }) | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User & { vendorId?: string }, tokens: { accessToken: string; refreshToken: string }) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user, tokens) => {
        setAuthTokens(tokens.accessToken, tokens.refreshToken);
        set({ user, accessToken: tokens.accessToken, isAuthenticated: true, isLoading: false });
      },

      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },

      logout: () => {
        clearAuthTokens();
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'df-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          // Re-set the token in axios when rehydrating from storage
          import('../lib/api').then(({ setAuthTokens }) => {
            const refresh = localStorage.getItem('df_refresh') ?? '';
            if (state.accessToken) setAuthTokens(state.accessToken, refresh);
          });
        }
      },
    },
  ),
);
