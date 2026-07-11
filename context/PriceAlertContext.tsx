import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { PriceAlert } from '../types';

const STORAGE_KEY = 'pricemate_alerts';

interface PriceAlertContextType {
  alerts: PriceAlert[];
  addAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
}

const PriceAlertContext = createContext<PriceAlertContextType | undefined>(undefined);

export const PriceAlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  const addAlert = (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newAlert: PriceAlert = {
      ...alert,
      id,
      createdAt: new Date().toISOString(),
      triggered: alert.currentEstimate <= alert.targetPrice,
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  return (
    <PriceAlertContext.Provider value={{ alerts, addAlert, removeAlert, clearAlerts }}>
      {children}
    </PriceAlertContext.Provider>
  );
};

export const usePriceAlerts = () => {
  const context = useContext(PriceAlertContext);
  if (context === undefined) {
    throw new Error('usePriceAlerts must be used within a PriceAlertProvider');
  }
  return context;
};
