import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SafeToSpendService } from '../services/SafeToSpendService';
import { Account, AccountSummary } from '../types';

interface SafeToSpendContextType {
  service: SafeToSpendService;
  currentAccount: Account | null;
  accountSummary: AccountSummary | null;
  refreshData: () => void;
  createNewAccount: () => Account;
}

const SafeToSpendContext = createContext<SafeToSpendContextType | undefined>(undefined);

export const useSafeToSpend = () => {
  const context = useContext(SafeToSpendContext);
  if (!context) {
    throw new Error('useSafeToSpend must be used within SafeToSpendProvider');
  }
  return context;
};

interface SafeToSpendProviderProps {
  children: ReactNode;
}

export const SafeToSpendProvider: React.FC<SafeToSpendProviderProps> = ({ children }) => {
  const [service] = useState(() => {
    const svc = new SafeToSpendService();
    svc.loadFromStorage();
    return svc;
  });
  
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);

  const refreshData = () => {
    if (currentAccount) {
      const summary = service.getAccountSummary(currentAccount.id);
      setAccountSummary(summary);
      if (summary) {
        setCurrentAccount(summary.account);
      }
    }
  };

  const createNewAccount = () => {
    const account = service.createAccount();
    setCurrentAccount(account);
    refreshData();
    return account;
  };

  useEffect(() => {
    // Try to load existing account or create a new one
    const storedAccountId = localStorage.getItem('current_account_id');
    if (storedAccountId) {
      const account = service.getAccount(storedAccountId);
      if (account) {
        setCurrentAccount(account);
      } else {
        // Account not found, create new one
        createNewAccount();
      }
    } else {
      // No stored account, create new one
      createNewAccount();
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [currentAccount]);

  useEffect(() => {
    if (currentAccount) {
      localStorage.setItem('current_account_id', currentAccount.id);
    }
  }, [currentAccount]);

  const value: SafeToSpendContextType = {
    service,
    currentAccount,
    accountSummary,
    refreshData,
    createNewAccount
  };

  return (
    <SafeToSpendContext.Provider value={value}>
      {children}
    </SafeToSpendContext.Provider>
  );
};