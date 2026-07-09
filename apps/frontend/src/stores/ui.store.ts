import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  locationPermission: 'unknown' | 'granted' | 'denied';
  userLocation: { lat: number; lng: number } | null;
  isDarkMode: boolean;
  dropdownCloseTrigger: number;

  openSearch: () => void;
  closeSearch: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  setLocationPermission: (status: 'granted' | 'denied') => void;
  setUserLocation: (location: { lat: number; lng: number }) => void;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
  closeAllDropdowns: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSearchOpen: false,
      isMobileMenuOpen: false,
      isAuthModalOpen: false,
      authModalMode: 'login',
      locationPermission: 'unknown',
      userLocation: null,
      isDarkMode: false,
      dropdownCloseTrigger: 0,

      openSearch: () => set({ isSearchOpen: true }),
      closeSearch: () => set({ isSearchOpen: false }),
      toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
      closeMobileMenu: () => set({ isMobileMenuOpen: false }),
      openAuthModal: (mode = 'login') => set({ isAuthModalOpen: true, authModalMode: mode }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      setLocationPermission: (locationPermission) => set({ locationPermission }),
      setUserLocation: (userLocation) => set({ userLocation }),
      toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
      setDarkMode: (isDark) => set({ isDarkMode: isDark }),
      closeAllDropdowns: () => set((s) => ({ dropdownCloseTrigger: s.dropdownCloseTrigger + 1 })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ isDarkMode: state.isDarkMode }),
    }
  )
);
