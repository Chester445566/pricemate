import React, { createContext, useState, useContext, ReactNode } from 'react';
import { EstimateFormData } from '../types';

interface EstimateContextType {
  imageBase64: string | null;
  setImageBase64: (image: string | null) => void;
  formData: EstimateFormData | null;
  setFormData: (data: EstimateFormData | null) => void;
  clearState: () => void;
}

const EstimateContext = createContext<EstimateContextType | undefined>(undefined);

export const EstimateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [formData, setFormData] = useState<EstimateFormData | null>(null);

  const clearState = () => {
    setImageBase64(null);
    setFormData(null);
  };

  return (
    <EstimateContext.Provider value={{ imageBase64, setImageBase64, formData, setFormData, clearState }}>
      {children}
    </EstimateContext.Provider>
  );
};

export const useEstimate = () => {
  const context = useContext(EstimateContext);
  if (context === undefined) {
    throw new Error('useEstimate must be used within an EstimateProvider');
  }
  return context;
};
