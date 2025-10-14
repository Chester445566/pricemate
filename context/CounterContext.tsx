import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

const COUNTER_STORAGE_KEY = 'priceMateItemCount';

interface CounterContextType {
  count: number;
  incrementCount: () => void;
}

const CounterContext = createContext<CounterContextType | undefined>(undefined);

export const CounterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [count, setCount] = useState<number>(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedCount = window.localStorage.getItem(COUNTER_STORAGE_KEY);
        // Ensure stored value is a valid number, otherwise default to 0
        const parsedCount = parseInt(storedCount || '0', 10);
        return isNaN(parsedCount) ? 0 : parsedCount;
      }
    } catch (e) {
      console.error("Failed to read count from localStorage", e);
    }
    return 0;
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(COUNTER_STORAGE_KEY, count.toString());
      }
    } catch (e) {
      console.error("Failed to save count to localStorage", e);
    }
  }, [count]);

  const incrementCount = () => {
    setCount(prevCount => prevCount + 1);
  };

  return (
    <CounterContext.Provider value={{ count, incrementCount }}>
      {children}
    </CounterContext.Provider>
  );
};

export const useCounter = () => {
  const context = useContext(CounterContext);
  if (context === undefined) {
    throw new Error('useCounter must be used within a CounterProvider');
  }
  return context;
};
