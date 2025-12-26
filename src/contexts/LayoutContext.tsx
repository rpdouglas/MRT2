import { createContext, useContext, useState, type ReactNode } from 'react';

interface LayoutContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSOSOpen: boolean;
  setIsSOSOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleSOS: () => void;
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

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleSOS = () => setIsSOSOpen(prev => !prev);

  const value = {
    sidebarOpen,
    setSidebarOpen,
    isSOSOpen,
    setIsSOSOpen,
    toggleSidebar,
    toggleSOS
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}