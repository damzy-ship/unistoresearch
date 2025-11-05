import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type HostelModeContextValue = {
  hostelMode: boolean;
  setHostelMode: (on: boolean) => void;
  toggleHostelMode: () => void;
};

const HostelModeContext = createContext<HostelModeContextValue | undefined>(undefined);

export function HostelModeProvider({ children }: { children: React.ReactNode }) {
  const [hostelMode, setHostelModeState] = useState<boolean>(() => {
    const raw = localStorage.getItem('hostel_mode');
    return raw === 'true';
  });

  useEffect(() => {
    localStorage.setItem('hostel_mode', hostelMode ? 'true' : 'false');
  }, [hostelMode]);

  const setHostelMode = useCallback((on: boolean) => setHostelModeState(on), []);
  const toggleHostelMode = useCallback(() => setHostelModeState((s) => !s), []);

  const value = useMemo(() => ({ hostelMode, setHostelMode, toggleHostelMode }), [hostelMode, setHostelMode, toggleHostelMode]);

  return <HostelModeContext.Provider value={value}>{children}</HostelModeContext.Provider>;
}

export function useHostelMode() {
  const ctx = useContext(HostelModeContext);
  if (!ctx) throw new Error('useHostelMode must be used within HostelModeProvider');
  return ctx;
}


