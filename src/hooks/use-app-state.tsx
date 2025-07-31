
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { BillFormValues } from '@/app/dashboard/bills/create/page';
import type { QuotationFormValues } from '@/app/dashboard/quotations/create/page';
import { Home, FileText } from 'lucide-react';

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
  props: Record<string, any>;
}

// Define the shape of the context state
interface AppStateContextType {
  billState: { form: BillFormValues };
  setBillState: (state: { form: BillFormValues }) => void;
  resetBillState: () => { form: BillFormValues };
  quotationState: { form: QuotationFormValues };
  setQuotationState: (state: { form: QuotationFormValues }) => void;
  resetQuotationState: () => { form: QuotationFormValues };
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
  const [billState, setBillState] = useState({ form: defaultBillState });
  const [quotationState, setQuotationState] = useState({ form: defaultQuotationState });

  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const openTab = useCallback((tab: Tab) => {
    setOpenTabs(prevTabs => {
      const existingTab = prevTabs.find(t => t.id === tab.id);
      if (existingTab) {
        // If tab exists, update its props
        return prevTabs.map(t => t.id === tab.id ? { ...t, ...tab } : t);
      }
      return [...prevTabs, tab];
    });
    setActiveTab(tab.id);
  }, []);

  useEffect(() => {
    // Open dashboard tab by default if no tabs are open
    if (openTabs.length === 0) {
        openTab({ id: '/dashboard', title: 'Dashboard', icon: Home, props: {} });
    }
  }, [openTabs.length, openTab]);

  const resetBillState = useCallback(() => {
    setBillState({ form: defaultBillState });
    return { form: defaultBillState };
  }, []);

  const resetQuotationState = useCallback(() => {
    setQuotationState({ form: defaultQuotationState });
    return { form: defaultQuotationState };
  }, []);

  const closeTab = (tabId: string) => {
    // Reset state if it's a creation tab
    if (tabId === '/dashboard/bills/create') {
        resetBillState();
    }
    if (tabId === '/dashboard/quotations/create') {
        resetQuotationState();
    }
    
    setOpenTabs(prevTabs => {
      const tabIndex = prevTabs.findIndex(t => t.id === tabId);
      if (tabIndex === -1) return prevTabs;

      const newTabs = prevTabs.filter(t => t.id !== tabId);
      
      if (activeTab === tabId) {
        if (newTabs.length > 0) {
          setActiveTab(newTabs[Math.max(0, tabIndex - 1)].id);
        } else {
          setActiveTab(null);
           // If all tabs are closed, open the dashboard
           openTab({ id: '/dashboard', title: 'Dashboard', icon: Home, props: {} });
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
