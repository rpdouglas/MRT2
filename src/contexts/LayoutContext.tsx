/**
 * src/contexts/LayoutContext.tsx
 * GITHUB COMMENT:
 * [LayoutContext.tsx]
 * NEW: Added 'isOnline' state for Network Resilience.
 * FEATURES: Automatically detects offline/online status via window event listeners.
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface LayoutContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSOSOpen: boolean;
  setIsSOSOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleSOS: () => void;
  isOnline: boolean; // NEW
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleSOS = () => setIsSOSOpen(prev => !prev);

  const value = {
    sidebarOpen,
    setSidebarOpen,
    isSOSOpen,
    setIsSOSOpen,
    toggleSidebar,
    toggleSOS,
    isOnline
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}