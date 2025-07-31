
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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

interface Tab {
  id: string;
  title: string;
  icon: React.ElementType;
}

// Define the shape of the context state
interface AppStateContextType {
  billState: BillFormValues;
  setBillState: (state: BillFormValues) => void;
  resetBillState: () => void;
  quotationState: QuotationFormValues;
  setQuotationState: (state: QuotationFormValues) => void;
  resetQuotationState: () => void;
  // Tab state
  openTabs: Tab[];
  activeTab: string | null;
  openTab: (tab: Tab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
}

// Create the context with a default undefined value
const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Create a provider component
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [billState, setBillState] = useState<BillFormValues>(defaultBillState);
  const [quotationState, setQuotationState] = useState<QuotationFormValues>(defaultQuotationState);

  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    // Open dashboard tab by default
    openTab({ id: '/dashboard', title: 'Dashboard', icon: () => null });
  }, []);

  const resetBillState = () => setBillState(defaultBillState);
  const resetQuotationState = () => setQuotationState(defaultQuotationState);

  const openTab = (tab: Tab) => {
    setOpenTabs(prevTabs => {
      if (prevTabs.find(t => t.id === tab.id)) {
        return prevTabs;
      }
      return [...prevTabs, tab];
    });
    setActiveTab(tab.id);
  };
  
  const closeTab = (tabId: string) => {
    setOpenTabs(prevTabs => {
      const tabIndex = prevTabs.findIndex(t => t.id === tabId);
      if (tabIndex === -1) return prevTabs;

      const newTabs = prevTabs.filter(t => t.id !== tabId);
      
      // If the closed tab was the active one, set a new active tab
      if (activeTab === tabId) {
        if (newTabs.length > 0) {
          // Set to the previous tab or the first one
          setActiveTab(newTabs[Math.max(0, tabIndex - 1)].id);
        } else {
          setActiveTab(null);
        }
      }
      return newTabs;
    });
  };

  const value = {
    billState,
    setBillState,
    resetBillState,
    quotationState,
    setQuotationState,
    resetQuotationState,
    openTabs,
    activeTab,
    openTab,
    closeTab,
    setActiveTab,
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
