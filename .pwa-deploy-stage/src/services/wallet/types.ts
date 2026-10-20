export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type TransactionType = 'send' | 'receive' | 'tip' | 'payment' | 'deposit';

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  timestamp: string;
  status: TransactionStatus;
  recipientId?: string;
  recipientName?: string;
  senderId?: string;
  senderName?: string;
  description?: string;
  referenceId?: string; // E.g., post ID for tips, order ID for payments
}

export interface WalletBalance {
  amount: number;
  currency: string;
}

export interface KlyroWalletData {
  address: string;
  isConnected: boolean;
  balance: WalletBalance;
  transactions: WalletTransaction[];
}
