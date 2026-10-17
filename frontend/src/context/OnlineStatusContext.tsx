import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface OnlineStatusContextType {
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

const OnlineStatusContext = createContext<OnlineStatusContextType>({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setIsOnline: () => {},
});

export const OnlineStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

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

  return (
    <OnlineStatusContext.Provider value={{ isOnline, setIsOnline }}>
      {children}
    </OnlineStatusContext.Provider>
  );
};

export const useOnlineStatus = () => useContext(OnlineStatusContext);
