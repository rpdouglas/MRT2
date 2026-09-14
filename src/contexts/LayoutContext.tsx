/**
 * src/contexts/LayoutContext.tsx
 * GITHUB COMMENT:
 * [LayoutContext.tsx]
 * NEW: Added 'isOnline' state for Network Resilience.
 * FEATURES: Automatically detects offline/online status via window event listeners.
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';

interface LayoutContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSOSOpen: boolean;
  setIsSOSOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleSOS: () => void;
  isOnline: boolean; // NEW
  // PROJ-104 follow-up: true while a page's own VibrantHeader (and its SOS
  // button) is mounted, so AppShell's always-present fallback SOS button
  // (needed for the locked-vault / headerless-page cases) can hide itself
  // instead of duplicating an already-visible header SOS button.
  headerSOSMounted: boolean;
  setHeaderSOSMounted: (mounted: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useLayout() { const context = useContext(LayoutContext); if (context === undefined) { throw new Error('useLayout must be used within a LayoutProvider'); }
  return context;
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [headerSOSMounted, setHeaderSOSMounted] = useState(false);

  useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const toggleSOS = useCallback(() => setIsSOSOpen(prev => !prev), []);

  // PROJ-98 Phase 4: memoized so every useLayout() consumer doesn't re-render
  // whenever any one of sidebarOpen/isSOSOpen/isOnline changes independently.
  const value = useMemo(
    () => ({ sidebarOpen, setSidebarOpen, isSOSOpen, setIsSOSOpen, toggleSidebar, toggleSOS, isOnline, headerSOSMounted, setHeaderSOSMounted }),
    [sidebarOpen, isSOSOpen, toggleSidebar, toggleSOS, isOnline, headerSOSMounted]
  );

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}