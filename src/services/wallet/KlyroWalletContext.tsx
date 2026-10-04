import React, { createContext, useContext, useState, useEffect } from 'react';
import { KlyroWalletData, WalletTransaction, TransactionType, TransactionStatus } from './types';
import { useAuth } from '../../context/AuthContext';

interface KlyroWalletContextType extends KlyroWalletData {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  sendFunds: (amount: number, recipientId: string, description?: string) => Promise<boolean>;
  resetMockData: () => void;
}

const KlyroWalletContext = createContext<KlyroWalletContextType | null>(null);

const DEFAULT_MOCK_BALANCE = 0;
const STORAGE_KEY = 'lalao_Klyro_wallet_mock';

export const KlyroWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // NOTE: Klyro Wallet integration will replace MockWalletProvider when the Klyro API is available.
  // The state below acts as a mock for MVP testing.
  
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState({ amount: 0, currency: 'KLY' });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  // Load from local storage
  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.uid}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setIsConnected(parsed.isConnected);
        setAddress(parsed.address || `0xKLY${user.uid.substring(0,8)}...`);
        setBalance(parsed.balance || { amount: DEFAULT_MOCK_BALANCE, currency: 'KLY' });
        setTransactions(parsed.transactions || []);
      }
    } catch {
      // Ignore
    }
  }, [user]);

  // Save to local storage
  const saveState = (newState: any) => {
    if (!user) return;
    try {
      localStorage.setItem(`${STORAGE_KEY}_${user.uid}`, JSON.stringify(newState));
    } catch {}
  };

  const connectWallet = async () => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    const newAddress = `0xKLY${user?.uid?.substring(0,8) || '12345678'}...`;
    
    setIsConnected(true);
    setAddress(newAddress);
    
    if (balance.amount === 0) {
      setBalance({ amount: 0, currency: 'KLY' });
    }

    saveState({
      isConnected: true,
      address: newAddress,
      balance: balance,
      transactions,
    });
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    saveState({
      isConnected: false,
      address,
      balance,
      transactions,
    });
  };

  const sendFunds = async (amount: number, recipientId: string, description?: string) => {
    if (!isConnected) throw new Error("Wallet not connected");
    if (balance.amount < amount) throw new Error("Insufficient balance");
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      type: 'send',
      amount,
      currency: 'KLY',
      timestamp: new Date().toISOString(),
      status: 'completed',
      recipientId,
      recipientName: 'User ' + recipientId.substring(0,4), // mock
      description,
    };

    const newBalance = { ...balance, amount: balance.amount - amount };
    const newTransactions = [newTx, ...transactions];

    setBalance(newBalance);
    setTransactions(newTransactions);

    saveState({
      isConnected,
      address,
      balance: newBalance,
      transactions: newTransactions,
    });

    return true;
  };

  const resetMockData = () => {
    if (!user) return;
    const initialBalance = { amount: DEFAULT_MOCK_BALANCE, currency: 'KLY' };
    setBalance(initialBalance);
    setTransactions([]);
    saveState({
      isConnected,
      address,
      balance: initialBalance,
      transactions: [],
    });
  };

  return (
    <KlyroWalletContext.Provider
      value={{
        isConnected,
        address,
        balance,
        transactions,
        connectWallet,
        disconnectWallet,
        sendFunds,
        resetMockData,
      }}
    >
      {children}
    </KlyroWalletContext.Provider>
  );
};

export const useKlyroWallet = () => {
  const context = useContext(KlyroWalletContext);
  if (!context) {
    throw new Error('useKlyroWallet must be used within a KlyroWalletProvider');
  }
  return context;
};
