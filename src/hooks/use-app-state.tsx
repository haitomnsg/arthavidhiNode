
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { BillFormValues } from '@/app/dashboard/bills/create/page';
import type { QuotationFormValues } from '@/app/dashboard/quotations/create/page';

// Define default state structures
const defaultBillState: BillFormValues = {
  clientName: "",
  clientAddress: "",
  clientPhone: "",
  panNumber: "",
  vatNumber: "",
  billDate: new Date(),
  dueDate: new Date(),
  items: [{ description: "", quantity: 1, unit: "Pcs", rate: 0 }],
  discountType: 'amount',
  discountAmount: 0,
  discountPercentage: 0,
  remarks: "",
};

const defaultQuotationState: QuotationFormValues = {
  clientName: "",
  clientAddress: "",
  clientPhone: "",
  panNumber: "",
  vatNumber: "",
  quotationDate: new Date(),
  items: [{ description: "", quantity: 1, unit: "Pcs", rate: 0 }],
  remarks: "",
};

// Define the shape of the context state
interface AppStateContextType {
  billState: BillFormValues;
  setBillState: (state: BillFormValues) => void;
  resetBillState: () => void;
  quotationState: QuotationFormValues;
  setQuotationState: (state: QuotationFormValues) => void;
  resetQuotationState: () => void;
}

// Create the context with a default undefined value
const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Create a provider component
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [billState, setBillState] = useState<BillFormValues>(defaultBillState);
  const [quotationState, setQuotationState] = useState<QuotationFormValues>(defaultQuotationState);

  const resetBillState = () => setBillState(defaultBillState);
  const resetQuotationState = () => setQuotationState(defaultQuotationState);

  const value = {
    billState,
    setBillState,
    resetBillState,
    quotationState,
    setQuotationState,
    resetQuotationState,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

// Create a custom hook for using the context
export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
