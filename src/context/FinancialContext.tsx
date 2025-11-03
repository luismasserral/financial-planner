import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { FinancialData } from '../types';
import { loadData, saveData } from '../lib/storage';

interface FinancialContextType {
  data: FinancialData;
  updateData: (newData: FinancialData) => void;
  replaceData: (newData: FinancialData) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FinancialData>(loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const updateData = (newData: FinancialData) => {
    setData(newData);
  };

  const replaceData = (newData: FinancialData) => {
    setData(newData);
  };

  return (
    <FinancialContext.Provider value={{ data, updateData, replaceData }}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
}
