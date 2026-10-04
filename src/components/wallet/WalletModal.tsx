import React, { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  ArrowLeft, ArrowUpRight, Copy, Plus, Check, Settings, 
  MoreHorizontal, Wallet, ChevronRight, X, Search, History, 
  Shield, Lock, CreditCard, Banknote, Building, AlertCircle, Receipt,
  Bitcoin, Smartphone, Wifi, Tv
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { usePaystackPayment } from 'react-paystack';

export interface WithdrawalAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  status: 'pending' | 'verified' | 'failed' | 'disabled';
  isDefault: boolean;
}

type WalletView = 
  | 'home' 
  | 'settings'
  | 'pay_select_wallet'
  | 'pay_select_recipient'
  | 'pay_enter_amount'
  | 'pay_method'
  | 'pay_review'
  | 'pay_pin'
  | 'pay_success'
  | 'fund_amount'
  | 'fund_method'
  | 'fund_review'
  | 'fund_success'
  | 'withdraw_amount'
  | 'withdraw_review'
  | 'withdraw_pin'
  | 'withdraw_success'
  | 'transactions'
  | 'receipt'
  | 'creator_earnings'
  | 'withdrawal_settings'
  | 'crypto_wallet_view'
  | 'crypto_send'
  | 'crypto_receive'
  | 'crypto_disconnect'
  | 'withdrawal_add_account'
  | 'withdrawal_edit_account'
  | 'market_home'
  | 'market_airtime'
  | 'market_data'
  | 'market_bills'
  | 'market_electricity'
  | 'market_cable'
  | 'market_review'
  | 'market_pin'
  | 'market_success';

export const WalletModal: React.FC = () => {
  const { isWalletModalOpen, setIsWalletModalOpen } = useLalao();
  
  const wallet = useQuery(api.wallet.getWallet);
  const dbTransactions = useQuery(api.wallet.getTransactions);
  const currentUser = useQuery(api.users.getCurrentUser);
  
  const performTransferCredits = useMutation(api.wallet.transferCredits);
  const performTransferCrypto = useMutation(api.wallet.transferCrypto);
  const performTopUp = useMutation(api.wallet.topUp);
  const performInitializeFunding = useMutation(api.wallet.initializeFunding);
  const performVerifyFunding = useAction(api.wallet.verifyPaystackFunding);
  const performPurchaseService = useMutation(api.market.purchaseService);
  const fetchVariations = useAction(api.market.getVariations);

  const [currentView, setCurrentView] = useState<WalletView>('home');
  const [viewStack, setViewStack] = useState<WalletView[]>(['home']);
  
  // Dev override for balance testing
  const [devBalance, setDevBalance] = useState<number | null>(null);
  const internalBalance = devBalance !== null ? devBalance : (wallet?.balance ?? 0);
  
  // Crypto Mock State
  const cryptoBalanceETH = 0.042;
  const cryptoBalanceUSDC = 125;
  const isMetaMaskConnected = true;

  // Flow State
  const [flowAssetType, setFlowAssetType] = useState<'LALAO_CREDITS' | 'CRYPTO'>('LALAO_CREDITS');
  const [flowRecipient, setFlowRecipient] = useState<any | null>(null);
  const [flowAmount, setFlowAmount] = useState<string>('');
  const [flowMethod, setFlowMethod] = useState<string>('');
  const [pin, setPin] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Withdrawal Mock State
  const [withdrawalAccounts, setWithdrawalAccounts] = useState<WithdrawalAccount[]>([
    {
      id: 'mock1',
      accountName: 'John Doe',
      bankName: 'First Bank',
      accountNumber: '0123456789',
      status: 'verified',
      isDefault: true
    }
  ]);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [isRefreshingAccounts, setIsRefreshingAccounts] = useState(false);
  const [accountForm, setAccountForm] = useState({ name: '', bank: '', number: '' });
  const [marketServiceType, setMarketServiceType] = useState<string>('');
  const [marketProvider, setMarketProvider] = useState<string>('');
  const [marketCustomerIdentifier, setMarketCustomerIdentifier] = useState<string>('');
  const [marketProduct, setMarketProduct] = useState<any>(null);
  const [marketAmount, setMarketAmount] = useState<string>('');
  const [marketFee, setMarketFee] = useState<number>(0);
  const [marketTxRef, setMarketTxRef] = useState<string>('');
  const [marketProviderRef, setMarketProviderRef] = useState<string>('');
  const [marketVariations, setMarketVariations] = useState<any[]>([]);
  const [isFetchingVariations, setIsFetchingVariations] = useState(false);

  // Generate a stable reference for the current flow
  const currentPaystackReference = useMemo(() => {
    return `LALAO_FUND_${new Date().getTime()}_${Math.random().toString(36).substring(7)}`;
  }, [currentView === 'fund_review']); // Regenerate only when entering review step

  const paystackConfig = {
    reference: currentPaystackReference,
    email: currentUser?.email || 'user@lalao.app',
    amount: (parseFloat(flowAmount) || 0) * 100, // Paystack amount is in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_1e3e4134a6324bd82248c28828b24f8a835e9f0f',
  };

  const initializePayment = usePaystackPayment(paystackConfig as any);

  const handlePaystackSuccess = async (response: any) => {
    setIsProcessing(true);
    try {
      const result = await performVerifyFunding({
        reference: response.reference || currentPaystackReference
      });
      
      if (result.success) {
        navigateTo('fund_success');
      } else {
        // Payment failed verification
        console.error("Verification failed:", result);
      }
    } catch (e) {
      console.error("Error verifying payment:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaystackClose = () => {
    // Modal closed
  };

  const navigateTo = (view: WalletView) => {
    setViewStack(prev => [...prev, view]);
    setCurrentView(view);
  };
  
  const goBack = () => {
    if (viewStack.length > 1) {
      const newStack = [...viewStack];
      newStack.pop();
      setViewStack(newStack);
      setCurrentView(newStack[newStack.length - 1]);
    } else {
      handleClose();
    }
  };
  
  const handleClose = () => {
    setIsWalletModalOpen(false);
    setTimeout(() => {
      setCurrentView('home');
      setViewStack(['home']);
      resetFlows();
    }, 300);
  };
  
  const resetFlows = () => {
    setFlowAssetType('LALAO_CREDITS');
    setFlowRecipient(null);
    setFlowAmount('');
    setFlowMethod('');
    setPin('');
    setSearchQuery('');
    setSelectedTx(null);
    setIsProcessing(false);
    setAccountForm({ name: '', bank: '', number: '' });
    setWithdrawError('');
  };

  const handleRefreshAccounts = () => {
    setIsRefreshingAccounts(true);
    setTimeout(() => {
      setIsRefreshingAccounts(false);
    }, 1000);
  };

  const handleSetDefaultAccount = (id: string) => {
    setWithdrawalAccounts(prev => prev.map(acc => ({
      ...acc,
      isDefault: acc.id === id
    })));
  };

  const handleRemoveAccount = (id: string) => {
    setWithdrawalAccounts(prev => {
      const remaining = prev.filter(acc => acc.id !== id);
      if (remaining.length > 0 && !remaining.some(a => a.isDefault)) {
        remaining[0].isDefault = true;
      }
      return remaining;
    });
  };

  const handleSaveAccount = () => {
    if (!accountForm.name || !accountForm.bank || !accountForm.number) return;
    
    if (editingAccountId) {
      setWithdrawalAccounts(prev => prev.map(acc => 
        acc.id === editingAccountId 
          ? { ...acc, accountName: accountForm.name, bankName: accountForm.bank, accountNumber: accountForm.number }
          : acc
      ));
    } else {
      setWithdrawalAccounts(prev => [
        ...prev,
        {
          id: `mock_${Date.now()}`,
          accountName: accountForm.name,
          bankName: accountForm.bank,
          accountNumber: accountForm.number,
          status: 'pending',
          isDefault: prev.length === 0
        }
      ]);
    }
    goBack();
  };

  useEffect(() => {
    if (!isWalletModalOpen) return;
    window.history.pushState({ modal: 'wallet' }, '');
    const handlePopState = () => setIsWalletModalOpen(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsWalletModalOpen(false);
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isWalletModalOpen, setIsWalletModalOpen]);

  const searchResults = useQuery(api.search.globalSearch, { 
    query: searchQuery, 
    filter: flowAssetType === 'LALAO_CREDITS' ? 'shop' : 'people' 
  });
  
  const filteredUsers = useMemo(() => {
    if (!searchQuery || !searchResults) return [];
    return flowAssetType === 'LALAO_CREDITS' ? searchResults.pages : searchResults.people;
  }, [searchQuery, searchResults, flowAssetType]);

  const handlePayConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const amt = parseFloat(flowAmount);
    try {
      if (flowAssetType === 'LALAO_CREDITS') {
        const result = await performTransferCredits({
          amount: amt,
          recipientPageId: flowRecipient?.id as any,
          pin: pin
        });
        if (result.success) {
          setSelectedTx({
            ...result.transaction,
            previousBalance: internalBalance,
            newBalance: internalBalance - amt
          });
          navigateTo('pay_success');
        }
      } else {
        // Crypto Flow
        const txHash = `0x${Math.random().toString(16).substr(2, 40)}`;
        const result = await performTransferCrypto({
          amount: amt,
          recipientId: flowRecipient?.id as any,
          cryptoSymbol: 'USDC',
          blockchainNetwork: 'Polygon',
          txHash: txHash
        });
        if (result.success) {
          setSelectedTx({
            ...result.transaction,
            previousBalance: cryptoBalanceUSDC,
            newBalance: cryptoBalanceUSDC - amt
          });
          navigateTo('pay_success');
        }
      }
    } catch (e) {
      console.error(e);
      setPin('');
    } finally {
      setIsProcessing(false);
    }
  };

  const openReceipt = (tx: any) => {
    setSelectedTx(tx);
    navigateTo('receipt');
  };

  if (!isWalletModalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-theme-base sm:rounded-[32px] rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] min-h-[70vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-theme-surface shrink-0 sticky top-0 z-10 border-b border-theme-divider-light">
          <div className="flex items-center gap-3">
            <button
              onClick={viewStack.length === 1 ? handleClose : goBack}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-theme-surface-hover hover:bg-theme-surface-active transition-colors"
            >
              {viewStack.length === 1 ? <X className="w-5 h-5 text-theme-primary" /> : <ArrowLeft className="w-5 h-5 text-theme-primary" />}
            </button>
            <h2 className="text-xl font-black text-theme-primary tracking-tight">
              {currentView === 'home' && 'Wallet'}
              {currentView === 'settings' && 'Wallet Settings'}
              {currentView === 'transactions' && 'Transaction History'}
              {currentView === 'receipt' && 'Transaction Receipt'}
              {currentView === 'pay_select_wallet' && 'Select Payment Source'}
              {currentView.startsWith('pay_') && currentView !== 'pay_select_wallet' && 'Pay'}
              {currentView.startsWith('fund_') && 'Fund Credits'}
              {currentView.startsWith('withdraw_') && 'Withdraw'}
              {currentView === 'creator_earnings' && 'Creator earnings'}
              {currentView === 'withdrawal_settings' && 'Withdrawal settings'}
              {currentView === 'crypto_wallet_view' && 'Wallet details'}
              {currentView === 'crypto_send' && 'Send crypto'}
              {currentView === 'crypto_receive' && 'Receive crypto'}
              {currentView === 'crypto_disconnect' && 'Disconnect wallet'}
              {currentView === 'market_home' && 'LaLao Market'}
              {currentView === 'market_airtime' && 'Buy Airtime'}
              {currentView === 'market_data' && 'Buy Data'}
              {currentView === 'market_bills' && 'Pay Bills'}
              {currentView === 'market_electricity' && 'Electricity'}
              {currentView === 'market_cable' && 'Cable TV'}
              {currentView === 'market_review' && 'Review Purchase'}
              {currentView === 'market_pin' && 'Confirm Purchase'}
              {currentView === 'market_success' && 'Transaction Successful'}
            </h2>
          </div>
          {currentView === 'home' && (
            <button onClick={() => navigateTo('settings')} className="w-10 h-10 flex items-center justify-center rounded-full bg-theme-surface-hover hover:bg-theme-surface-active transition-colors">
              <Settings className="w-5 h-5 text-theme-primary" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto relative bg-theme-base">
          
          {/* HOME */}
          {currentView === 'home' && (
            <div className="p-4 space-y-8 pb-12">
              
              {/* LALAO CREDITS */}
              <div>
                <h3 className="font-black text-theme-primary px-2 text-xl mb-3">LaLao Credits</h3>
                <div className="bg-theme-surface rounded-3xl p-6 border border-[#5E43F3]/30 shadow-sm flex flex-col items-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5E43F3] to-[#8A74F7]"></div>
                  
                  <div className="text-4xl font-black text-theme-primary tracking-tighter mb-2">
                    {internalBalance.toLocaleString()} LC
                  </div>
                  <p className="text-xs text-theme-secondary text-center mb-6 max-w-[220px]">
                    Used for: Subscriptions & LaLao Partner Businesses
                  </p>
                  
                  <div className="flex items-center justify-center gap-6 w-full">
                    <button onClick={() => navigateTo('fund_amount')} className="flex flex-col items-center gap-2 group">
                      <div className="w-12 h-12 rounded-full bg-theme-surface-hover text-theme-primary flex items-center justify-center group-hover:bg-theme-surface-active transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-theme-primary">Fund</span>
                    </button>
                    <button onClick={() => { setFlowAssetType('LALAO_CREDITS'); navigateTo('pay_select_recipient'); }} className="flex flex-col items-center gap-2 group">
                      <div className="w-12 h-12 rounded-full bg-[#5E43F3] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-theme-primary">Use</span>
                    </button>
                    <button onClick={() => navigateTo('withdraw_amount')} className="flex flex-col items-center gap-2 group">
                      <div className="w-12 h-12 rounded-full bg-theme-surface-hover text-theme-primary flex items-center justify-center group-hover:bg-theme-surface-active transition-colors">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-theme-primary">Withdraw</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* LALAO MARKET */}
              <div>
                <h3 className="font-black text-theme-primary px-2 text-xl mb-3">LaLao Market</h3>
                <div className="bg-theme-surface rounded-3xl p-6 border border-theme-divider-light shadow-sm flex flex-col gap-4">
                  <p className="text-xs font-semibold text-theme-secondary mb-2">
                    Everyday services, powered by your LaLao balance.
                  </p>
                  <button onClick={() => navigateTo('market_airtime')} className="flex items-center justify-between p-4 rounded-2xl bg-theme-base border border-theme-divider-light hover:border-[#5E43F3]/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-theme-surface-hover flex items-center justify-center group-hover:bg-[#5E43F3]/10">
                        <Smartphone className="w-5 h-5 text-theme-primary group-hover:text-[#5E43F3]" />
                      </div>
                      <span className="font-bold text-theme-primary">Buy Airtime</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-theme-tertiary" />
                  </button>
                  
                  <button onClick={() => navigateTo('market_data')} className="flex items-center justify-between p-4 rounded-2xl bg-theme-base border border-theme-divider-light hover:border-[#5E43F3]/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-theme-surface-hover flex items-center justify-center group-hover:bg-[#5E43F3]/10">
                        <Wifi className="w-5 h-5 text-theme-primary group-hover:text-[#5E43F3]" />
                      </div>
                      <span className="font-bold text-theme-primary">Buy Data</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-theme-tertiary" />
                  </button>
                  
                  <button onClick={() => navigateTo('market_bills')} className="flex items-center justify-between p-4 rounded-2xl bg-theme-base border border-theme-divider-light hover:border-[#5E43F3]/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-theme-surface-hover flex items-center justify-center group-hover:bg-[#5E43F3]/10">
                        <Tv className="w-5 h-5 text-theme-primary group-hover:text-[#5E43F3]" />
                      </div>
                      <span className="font-bold text-theme-primary">Pay Bills</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-theme-tertiary" />
                  </button>
                </div>
              </div>

              {/* CRYPTO WALLET */}
              <div>
                <h3 className="font-black text-theme-primary px-2 text-xl mb-3">Crypto Wallet</h3>
                <div className="bg-theme-surface rounded-3xl p-6 border border-theme-divider-light shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-theme-primary">MetaMask</div>
                      <div className="text-xs font-semibold text-theme-secondary flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Connected
                      </div>
                    </div>
                  </div>
                  <button onClick={() => navigateTo('crypto_wallet_view')} className="text-xs font-bold text-theme-primary px-4 py-2 bg-theme-base border border-theme-divider-light rounded-full hover:bg-theme-surface-active transition-colors">
                    View
                  </button>
                </div>
              </div>

              {/* Transactions link */}
              <button onClick={() => navigateTo('transactions')} className="w-full bg-theme-surface p-4 rounded-2xl flex items-center justify-between border border-theme-divider-light shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-theme-surface-hover flex items-center justify-center">
                    <History className="w-5 h-5 text-theme-primary" />
                  </div>
                  <span className="font-bold text-theme-primary">Transaction History</span>
                </div>
                <ChevronRight className="w-5 h-5 text-theme-tertiary" />
              </button>

            </div>
          )}

          {/* SETTINGS */}
          {currentView === 'settings' && (
            <div className="p-4 space-y-6">
              <div className="space-y-2">
                <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-2">LaLao Credits</div>
                <button onClick={() => navigateTo('creator_earnings')} className="w-full bg-theme-surface p-4 rounded-xl flex items-center justify-between border border-theme-divider-light hover:bg-theme-surface-hover transition-colors text-left">
                  <div className="font-bold text-theme-primary">Creator earnings</div>
                  <ChevronRight className="w-4 h-4 text-theme-tertiary" />
                </button>
                <button onClick={() => navigateTo('withdrawal_settings')} className="w-full bg-theme-surface p-4 rounded-xl flex items-center justify-between border border-theme-divider-light hover:bg-theme-surface-hover transition-colors text-left">
                  <div className="font-bold text-theme-primary">Withdrawal settings</div>
                  <ChevronRight className="w-4 h-4 text-theme-tertiary" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-2">Crypto Wallet</div>
                <button onClick={() => navigateTo('crypto_wallet_view')} className="w-full bg-theme-surface p-4 rounded-xl flex items-center justify-between border border-theme-divider-light hover:bg-theme-surface-hover transition-colors text-left">
                  <div className="font-bold text-theme-primary">Connected wallets</div>
                  <div className="text-sm font-semibold text-theme-secondary flex items-center gap-2">MetaMask <ChevronRight className="w-4 h-4" /></div>
                </button>
                <button onClick={() => navigateTo('crypto_disconnect')} className="w-full bg-theme-surface p-4 rounded-xl flex items-center justify-between border border-red-100 hover:bg-red-50 transition-colors text-left">
                  <div className="font-bold text-red-500">Disconnect wallet</div>
                </button>
              </div>
            </div>
          )}
          
          {/* TRANSACTIONS */}
          {currentView === 'transactions' && (
            <div className="p-4">
               {(!dbTransactions || dbTransactions.length === 0) ? (
                 <div className="text-center py-12 text-theme-tertiary font-semibold">No transactions yet.</div>
               ) : (
                 <div className="space-y-3">
                   {dbTransactions.map((tx: any) => (
                     <button 
                       key={tx._id} 
                       onClick={() => openReceipt(tx)}
                       className="w-full bg-theme-surface p-4 rounded-2xl flex items-center justify-between border border-theme-divider-light hover:border-[#5E43F3]/50 transition-colors text-left"
                     >
                       <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                           (tx.type === 'transfer_in' || tx.type === 'deposit') ? 'bg-green-100 text-green-600' : 'bg-theme-surface-hover text-theme-primary'
                         }`}>
                           {(tx.type === 'transfer_in' || tx.type === 'deposit') ? <Plus className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                         </div>
                         <div>
                           <h4 className="font-bold text-theme-primary max-w-[180px] truncate">
                             {tx.description}
                           </h4>
                           <div className="text-[10px] font-bold text-theme-tertiary mt-1 uppercase tracking-wider flex items-center gap-1">
                             {tx.assetType === 'CRYPTO' ? <Bitcoin className="w-3 h-3" /> : null}
                             {tx.assetType === 'CRYPTO' ? 'Crypto' : 'LaLao Credits'} • {new Date(tx.createdAt).toLocaleDateString()}
                           </div>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className={`font-black tracking-tight ${
                           (tx.type === 'transfer_in' || tx.type === 'deposit') ? 'text-green-600' : 'text-theme-primary'
                         }`}>
                           {(tx.type === 'transfer_in' || tx.type === 'deposit') ? '+' : '-'}{tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})} {tx.currency || 'LC'}
                         </div>
                         <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
                           tx.status === 'completed' ? 'text-green-500' : tx.status === 'pending' ? 'text-orange-500' : 'text-red-500'
                         }`}>
                           {tx.status}
                         </div>
                       </div>
                     </button>
                   ))}
                 </div>
               )}
            </div>
          )}

          {/* RECEIPT VIEW */}
          {currentView === 'receipt' && selectedTx && (
            <div className="p-6 flex flex-col h-full bg-theme-surface relative">
               <div className="text-center mb-8 border-b border-theme-divider-light pb-8 border-dashed">
                 <h3 className="font-black text-theme-primary text-xl mb-4 tracking-widest uppercase">
                   {selectedTx.assetType === 'CRYPTO' ? 'Crypto Payment' : 'LaLao'}
                 </h3>
                 <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest mb-2">Payment Receipt</div>
                 
                 {selectedTx.status === 'completed' && (
                    <div className="flex items-center justify-center gap-1 text-green-500 font-bold mb-4 text-sm">
                      <Check className="w-4 h-4" /> Payment successful
                    </div>
                 )}
                 
                 <div className="font-black text-4xl text-theme-primary mb-4">
                   {selectedTx.amount.toLocaleString(undefined, {minimumFractionDigits:2})} {selectedTx.currency || 'LC'}
                 </div>
                 
                 {selectedTx.type === 'transfer_out' && (
                   <div className="text-theme-secondary font-semibold">
                     Sent to <br/>
                     <span className="font-bold text-theme-primary text-lg block mt-1">{selectedTx.relatedUserName}</span>
                     {selectedTx.relatedUserUsername && <span className="text-sm">@{selectedTx.relatedUserUsername}</span>}
                   </div>
                 )}
                 {selectedTx.type === 'transfer_in' && (
                   <div className="text-theme-secondary font-semibold">
                     Received from <br/>
                     <span className="font-bold text-theme-primary text-lg block mt-1">{selectedTx.relatedUserName}</span>
                     {selectedTx.relatedUserUsername && <span className="text-sm">@{selectedTx.relatedUserUsername}</span>}
                   </div>
                 )}
               </div>

               <div className="space-y-4 text-sm">
                 <h4 className="font-bold text-theme-primary mb-4 border-b border-theme-divider-light pb-2">Transaction Details</h4>
                 <div className="flex justify-between">
                   <span className="text-theme-tertiary font-bold">Transaction ID</span>
                   <span className="font-mono text-theme-secondary font-semibold">{selectedTx.reference || selectedTx._id}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-theme-tertiary font-bold">Date</span>
                   <span className="text-theme-secondary font-semibold">{new Date(selectedTx.createdAt).toLocaleDateString()}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-theme-tertiary font-bold">Time</span>
                   <span className="text-theme-secondary font-semibold">{new Date(selectedTx.createdAt).toLocaleTimeString()}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-theme-tertiary font-bold">Asset</span>
                   <span className="font-bold text-theme-primary">{selectedTx.assetType === 'CRYPTO' ? selectedTx.currency : 'LaLao Credits'}</span>
                 </div>
                 {selectedTx.assetType === 'CRYPTO' && (
                   <div className="flex justify-between">
                     <span className="text-theme-tertiary font-bold">Network</span>
                     <span className="font-bold text-theme-primary">{selectedTx.blockchainNetwork || 'Polygon'}</span>
                   </div>
                 )}
                 {selectedTx.assetType === 'CRYPTO' && (
                   <div className="flex justify-between">
                     <span className="text-theme-tertiary font-bold">Tx Hash</span>
                     <span className="font-mono text-theme-secondary font-semibold truncate max-w-[150px]">{selectedTx.transactionHash}</span>
                   </div>
                 )}
                 <div className="flex justify-between mt-4 pt-4 border-t border-theme-divider-light">
                   <span className="text-theme-tertiary font-bold">Amount</span>
                   <span className="font-bold text-theme-primary">{selectedTx.amount.toLocaleString(undefined, {minimumFractionDigits:2})} {selectedTx.currency || 'LC'}</span>
                 </div>
                 <div className="flex justify-between mt-4 pt-4 border-t border-theme-divider-light border-dashed">
                   <span className="text-theme-primary font-black">Total</span>
                   <span className="font-black text-theme-primary">{selectedTx.amount.toLocaleString(undefined, {minimumFractionDigits:2})} {selectedTx.currency || 'LC'}</span>
                 </div>
                 <div className="flex justify-between pt-2">
                   <span className="text-theme-tertiary font-bold">Status</span>
                   <span className="font-bold text-theme-primary capitalize">{selectedTx.status}</span>
                 </div>
               </div>
               
               <div className="mt-8">
                 <button onClick={handleClose} className="w-full py-4 rounded-xl bg-theme-surface-hover text-theme-primary font-bold hover:bg-theme-surface-active transition-colors">
                    Done
                 </button>
               </div>
            </div>
          )}

          {/* PAY SELECT WALLET */}
          {currentView === 'pay_select_wallet' && (
             <div className="p-4 space-y-4">
               <h3 className="font-black text-theme-primary text-xl mb-6">Pay From</h3>
               
               <button 
                  onClick={() => { setFlowAssetType('LALAO_CREDITS'); navigateTo('pay_select_recipient'); }} 
                  className="w-full bg-theme-base rounded-2xl p-4 flex items-center justify-between border-2 border-transparent hover:border-[#5E43F3]/30 shadow-sm text-left transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#5E43F3]/10 flex items-center justify-center shrink-0 group-hover:bg-[#5E43F3] group-hover:text-white transition-colors">
                      <Wallet className="w-6 h-6 text-[#5E43F3] group-hover:text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-theme-primary text-lg">LaLao Credits</h4>
                      <p className="text-sm font-semibold text-theme-secondary mt-0.5">{internalBalance.toLocaleString()} LC</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-theme-tertiary" />
                </button>

                <button 
                  onClick={() => { setFlowAssetType('CRYPTO'); navigateTo('pay_select_recipient'); }} 
                  className="w-full bg-theme-base rounded-2xl p-4 flex items-center justify-between border-2 border-transparent hover:border-blue-500/30 shadow-sm text-left transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-theme-primary text-lg">Crypto Wallet</h4>
                      <p className="text-sm font-semibold text-theme-secondary mt-0.5">{cryptoBalanceUSDC} USDC</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-theme-tertiary" />
                </button>
             </div>
          )}

          {/* PAY FLOW - RECIPIENT */}
          {currentView === 'pay_select_recipient' && (
             <div className="p-4 h-full flex flex-col">
                <div className="bg-theme-surface rounded-xl p-4 mb-6 flex items-center justify-between border border-theme-divider-light shadow-sm">
                   <div>
                     <div className="text-[10px] font-bold text-theme-tertiary uppercase tracking-widest mb-1">Pay from</div>
                     <div className="font-black text-theme-primary text-sm flex items-center gap-2">
                       {flowAssetType === 'LALAO_CREDITS' ? 'LaLao Credits' : 'Crypto Wallet'}
                       <span className="text-theme-secondary font-semibold bg-theme-base px-2 py-0.5 rounded-full border border-theme-divider-light text-xs">
                         {flowAssetType === 'LALAO_CREDITS' ? `${internalBalance.toLocaleString()} LC` : `${cryptoBalanceUSDC} USDC`}
                       </span>
                     </div>
                   </div>
                   <button onClick={() => navigateTo('pay_select_wallet')} className="text-xs font-bold text-theme-primary px-4 py-2 bg-theme-base border border-theme-divider rounded-full hover:bg-theme-surface-active transition-colors">Change</button>
                </div>
                
                <h3 className="font-black text-theme-primary text-2xl mb-2">Who are you paying?</h3>
                <p className="text-sm font-semibold text-theme-secondary mb-6">
                  {flowAssetType === 'LALAO_CREDITS' 
                    ? 'Search LaLao partner businesses' 
                    : 'Search users or enter a wallet address'}
                </p>
                
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-tertiary" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={flowAssetType === 'LALAO_CREDITS' ? "Search businesses..." : "Search name or username"}
                    className="w-full bg-theme-surface border border-theme-divider-light rounded-2xl py-4 pl-12 pr-4 font-semibold text-theme-primary focus:outline-none focus:border-[#5E43F3]"
                  />
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2">
                  {filteredUsers.map((user: any) => (
                    <button 
                      key={user.id}
                      onClick={() => { setFlowRecipient(user); navigateTo('pay_enter_amount'); }}
                      className="w-full flex items-center gap-3 p-3 bg-theme-surface rounded-2xl hover:bg-theme-surface-hover transition-colors text-left"
                    >
                      <Avatar src={user.avatar} alt={user.name} className="!w-12 !h-12" />
                      <div className="flex-1">
                        <div className="font-bold text-theme-primary">{user.name}</div>
                        <div className="text-sm font-semibold text-theme-secondary">@{user.username}</div>
                      </div>
                      {flowAssetType === 'LALAO_CREDITS' && (
                        <div className="shrink-0 bg-green-50 text-green-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-green-100">Accepts LC</div>
                      )}
                    </button>
                  ))}
                  {!searchQuery && (
                    <div className="text-center py-8 text-theme-tertiary font-semibold">
                      {flowAssetType === 'LALAO_CREDITS' 
                        ? 'Search for an eligible partner business to pay.' 
                        : 'Search for someone to pay'}
                    </div>
                  )}
                  {searchQuery && filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-theme-tertiary font-semibold">
                      {flowAssetType === 'LALAO_CREDITS' 
                        ? 'No LaLao Credit businesses found' 
                        : 'No users found'}
                    </div>
                  )}
                </div>
             </div>
          )}
          
          {/* PAY FLOW - AMOUNT */}
          {currentView === 'pay_enter_amount' && (
             <div className="p-4 flex flex-col h-full">
                <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-12">
                   <h3 className="font-black text-theme-primary text-2xl mb-8">Amount</h3>
                   <div className="flex items-center text-theme-primary mb-4">
                     <input 
                       type="text"
                       inputMode="decimal"
                       value={flowAmount}
                       onChange={e => {
                         const val = e.target.value;
                         if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) setFlowAmount(val);
                       }}
                       placeholder="0"
                       className="w-auto min-w-[80px] max-w-[200px] text-center bg-transparent text-6xl font-black focus:outline-none placeholder:text-theme-tertiary/30"
                       autoFocus
                     />
                     <span className="text-3xl font-black ml-2 text-theme-secondary">{flowAssetType === 'LALAO_CREDITS' ? 'LC' : 'USDC'}</span>
                   </div>
                   <div className="text-sm font-semibold text-theme-secondary bg-theme-surface px-4 py-2 rounded-full border border-theme-divider-light">
                     Available balance: {flowAssetType === 'LALAO_CREDITS' ? internalBalance.toLocaleString() + ' LC' : cryptoBalanceUSDC + ' USDC'}
                   </div>
                   {parseFloat(flowAmount) > (flowAssetType === 'LALAO_CREDITS' ? internalBalance : cryptoBalanceUSDC) && (
                     <div className="mt-4 flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 px-4 py-2 rounded-full">
                       <AlertCircle className="w-4 h-4" /> Insufficient balance
                     </div>
                   )}
                </div>
                <div className="shrink-0 pt-4 border-t border-theme-divider-light">
                   <button 
                     onClick={() => navigateTo('pay_review')}
                     disabled={!flowAmount || parseFloat(flowAmount) <= 0 || parseFloat(flowAmount) > (flowAssetType === 'LALAO_CREDITS' ? internalBalance : cryptoBalanceUSDC)}
                     className="w-full py-4 rounded-xl bg-[#5E43F3] text-white font-bold text-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                   >
                     Continue
                   </button>
                </div>
             </div>
          )}

          {/* PAY FLOW - REVIEW */}
          {currentView === 'pay_review' && (
             <div className="p-4 flex flex-col h-full">
                <h3 className="font-black text-theme-primary text-2xl mb-6">Review Payment</h3>
                
                <div className="flex-1 space-y-4">
                  <div className="bg-theme-surface rounded-2xl p-5 border border-theme-divider-light space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Pay with</div>
                      <div className="font-bold text-theme-primary flex items-center gap-2">
                        {flowAssetType === 'LALAO_CREDITS' ? 'LaLao Credits' : 'Crypto Wallet'}
                      </div>
                    </div>
                    <div className="border-t border-theme-divider-light"></div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Recipient</div>
                      <div className="text-right">
                        <div className="font-bold text-theme-primary">{flowRecipient?.name}</div>
                        <div className="text-xs font-semibold text-theme-secondary">@{flowRecipient?.username}</div>
                      </div>
                    </div>
                    <div className="border-t border-theme-divider-light"></div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Amount</div>
                      <div className="font-black text-theme-primary text-xl">
                        {parseFloat(flowAmount).toLocaleString(undefined, {minimumFractionDigits: 0})} {flowAssetType === 'LALAO_CREDITS' ? 'LC' : 'USDC'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pt-4 flex gap-3">
                   <button 
                     onClick={handleClose}
                     className="w-1/3 py-4 rounded-xl bg-theme-surface-hover text-theme-primary font-bold hover:bg-theme-surface-active transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={() => navigateTo('pay_pin')}
                     className="w-2/3 py-4 rounded-xl bg-[#5E43F3] text-white font-bold text-lg hover:bg-indigo-600 transition-colors shadow-lg"
                   >
                     Confirm
                   </button>
                </div>
             </div>
          )}

          {/* PAY FLOW - PIN */}
          {currentView === 'pay_pin' && (
             <div className="p-4 flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-[#5E43F3]/10 rounded-full flex items-center justify-center mb-6">
                  <Shield className="w-8 h-8 text-[#5E43F3]" />
                </div>
                <h3 className="font-black text-theme-primary text-2xl mb-2">Enter payment PIN</h3>
                <p className="text-theme-secondary font-semibold text-sm mb-8 text-center max-w-[250px]">
                  Confirm your payment of {parseFloat(flowAmount).toLocaleString()} {flowAssetType === 'LALAO_CREDITS' ? 'LC' : 'USDC'} to {flowRecipient?.name}
                </p>
                <input 
                  type="password"
                  value={pin}
                  onChange={e => {
                     setPin(e.target.value);
                     if (e.target.value.length === 4) {
                        setTimeout(handlePayConfirm, 300);
                     }
                  }}
                  disabled={isProcessing}
                  maxLength={4}
                  placeholder="••••"
                  className="w-32 text-center tracking-[1em] bg-theme-surface border border-theme-divider-light rounded-xl py-3 font-black text-2xl text-theme-primary focus:outline-none focus:border-[#5E43F3] disabled:opacity-50"
                  autoFocus
                />
             </div>
          )}

          {/* PAY FLOW - SUCCESS */}
          {currentView === 'pay_success' && selectedTx && (
             <div className="p-4 flex flex-col h-full text-center items-center justify-center">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/20 mb-6">
                  <Check className="w-12 h-12 text-white" />
                </div>
                <h3 className="font-black text-theme-primary text-2xl mb-2">Payment successful</h3>
                <div className="font-black text-4xl text-theme-primary mb-4">
                  {selectedTx.amount.toLocaleString()} {selectedTx.currency || 'LC'}
                </div>
                <div className="text-theme-secondary font-semibold mb-8">
                  sent to <span className="font-bold text-theme-primary">{selectedTx.relatedUserName}</span> <span className="text-sm">@{selectedTx.relatedUserUsername}</span>
                </div>
                
                <div className="w-full bg-theme-surface rounded-2xl p-4 text-left border border-theme-divider-light mb-8">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-theme-tertiary font-bold">From</span>
                    <span className="font-bold text-theme-primary">{selectedTx.assetType === 'CRYPTO' ? 'Crypto Wallet' : 'LaLao Credits'}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-theme-tertiary font-bold">Transaction ID</span>
                    <span className="font-mono text-theme-secondary truncate max-w-[150px]">{selectedTx.reference || selectedTx._id}</span>
                  </div>
                  <div className="border-t border-theme-divider-light my-3"></div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-theme-tertiary font-bold">Previous balance</span>
                    <span className="font-semibold text-theme-secondary">{selectedTx.previousBalance?.toLocaleString()} {selectedTx.currency || 'LC'}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1 text-red-500">
                    <span className="font-bold">Payment</span>
                    <span className="font-bold">-{selectedTx.amount.toLocaleString()} {selectedTx.currency || 'LC'}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-3 pt-3 border-t border-theme-divider-light">
                    <span className="font-bold text-theme-primary">New balance</span>
                    <span className="font-black text-theme-primary">{selectedTx.newBalance?.toLocaleString()} {selectedTx.currency || 'LC'}</span>
                  </div>
                </div>

                <div className="flex gap-3 w-full mt-auto">
                   <button onClick={() => navigateTo('receipt')} className="flex-1 py-4 rounded-xl bg-theme-surface-hover text-theme-primary font-bold hover:bg-theme-surface-active transition-colors flex items-center justify-center gap-2">
                     <Receipt className="w-5 h-5" /> View receipt
                   </button>
                   <button onClick={handleClose} className="flex-1 py-4 rounded-xl bg-[#5E43F3] text-white font-bold hover:bg-indigo-600 transition-colors shadow-lg">
                     Done
                   </button>
                </div>
             </div>
          )}

          {/* FUND FLOW */}
          {currentView === 'fund_amount' && (
             <div className="p-4 flex flex-col h-full">
                <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-12">
                   <h3 className="font-black text-theme-primary text-2xl mb-8">Fund Credits</h3>
                   <div className="flex items-center text-theme-primary mb-4">
                     <input 
                       type="text"
                       inputMode="decimal"
                       value={flowAmount}
                       onChange={e => {
                         const val = e.target.value;
                         if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) setFlowAmount(val);
                       }}
                       placeholder="0"
                       className="w-auto min-w-[80px] max-w-[200px] text-center bg-transparent text-6xl font-black focus:outline-none placeholder:text-theme-tertiary/30"
                       autoFocus
                     />
                     <span className="text-3xl font-black ml-2 text-theme-secondary">LC</span>
                   </div>
                   <div className="text-sm font-semibold text-theme-secondary">
                     Current balance: {internalBalance.toLocaleString()} LC
                   </div>
                </div>
                <div className="shrink-0 pt-4 border-t border-theme-divider-light">
                   <button 
                     onClick={() => navigateTo('fund_review')}
                     disabled={!flowAmount || parseFloat(flowAmount) <= 0}
                     className="w-full py-4 rounded-xl bg-[#5E43F3] text-white font-bold text-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                   >
                     Continue
                   </button>
                </div>
             </div>
          )}

          {currentView === 'fund_review' && (
             <div className="p-4 flex flex-col h-full">
                <h3 className="font-black text-theme-primary text-2xl mb-6">Review funding</h3>
                <div className="flex-1 space-y-4">
                  <div className="bg-theme-surface rounded-2xl p-5 border border-theme-divider-light space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Amount</div>
                      <div className="font-black text-theme-primary text-xl">{parseFloat(flowAmount).toLocaleString()} LC</div>
                    </div>
                    <div className="border-t border-theme-divider-light"></div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Payment method</div>
                      <div className="font-bold text-theme-primary">Paystack (Card/Bank)</div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pt-4 flex gap-3">
                   <button onClick={goBack} className="flex-1 py-4 rounded-xl bg-theme-surface-hover text-theme-primary font-bold hover:bg-theme-surface-active transition-colors">Cancel</button>
                   <button 
                     onClick={async () => {
                       setIsProcessing(true);
                       try {
                         await performInitializeFunding({
                           amount: parseFloat(flowAmount),
                           reference: currentPaystackReference
                         });
                         initializePayment({ onSuccess: handlePaystackSuccess, onClose: handlePaystackClose } as any);
                       } catch (e) {
                         console.error("Failed to initialize funding:", e);
                       } finally {
                         setIsProcessing(false);
                       }
                     }}
                     disabled={isProcessing}
                     className="flex-[2] py-4 rounded-xl bg-[#0BA4DB] text-white font-bold hover:bg-[#098bbd] transition-colors shadow-lg disabled:opacity-50"
                   >
                     {isProcessing ? 'Processing...' : 'Pay with Paystack'}
                   </button>
                </div>
             </div>
          )}

          {currentView === 'fund_success' && (
             <div className="p-4 flex flex-col h-full text-center pb-12">
               <div className="flex-1 flex flex-col items-center justify-center pt-12">
                 <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 border border-green-100">
                   <Check className="w-12 h-12 text-green-500" />
                 </div>
                 <h3 className="font-black text-theme-primary text-2xl mb-4">Funding successful</h3>
                 <div className="font-black text-4xl text-theme-primary mb-6">{parseFloat(flowAmount).toLocaleString()} LC</div>
                 <p className="text-theme-secondary font-semibold text-sm max-w-[280px] mb-8 mx-auto">
                   Your wallet has been credited successfully.
                 </p>
                 
                 <div className="w-full">
                   <button onClick={handleClose} className="w-full py-4 rounded-xl bg-theme-surface-hover text-theme-primary font-bold hover:bg-theme-surface-active transition-colors">
                     Done
                   </button>
                 </div>
               </div>
             </div>
          )}

          {/* WITHDRAW FLOW */}
          {currentView === 'withdraw_amount' && (
             <div className="p-4 flex flex-col h-full">
                {withdrawalAccounts.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="bg-theme-surface rounded-2xl p-8 border border-theme-divider-light">
                      <h3 className="font-bold text-theme-primary mb-2">No withdrawal account</h3>
                      <p className="text-sm font-semibold text-theme-secondary mb-6">
                        Add a withdrawal account before withdrawing your earnings.
                      </p>
                      <button onClick={() => { setEditingAccountId(null); setAccountForm({name:'', bank:'', number:''}); navigateTo('withdrawal_add_account'); }} className="py-3 px-6 rounded-xl bg-[#5E43F3] font-bold text-white shadow-lg hover:bg-indigo-600 transition-colors">
                        Add withdrawal account
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-12">
                       <h3 className="font-black text-theme-primary text-2xl mb-2">Withdraw earnings</h3>
                       
                       <div className="flex items-center gap-2 mb-8 bg-theme-surface px-4 py-2 rounded-full border border-theme-divider-light">
                         <Building className="w-4 h-4 text-theme-tertiary" />
                         <span className="text-sm font-bold text-theme-primary">
                           {withdrawalAccounts.find(a => a.isDefault)?.bankName || withdrawalAccounts[0]?.bankName} •••• {(withdrawalAccounts.find(a => a.isDefault)?.accountNumber || withdrawalAccounts[0]?.accountNumber).slice(-4)}
                         </span>
                       </div>
                       
                       <div className="flex items-center text-theme-primary mb-4">
                         <span className="text-3xl font-black mr-2 text-theme-secondary">₦</span>
                         <input 
                           type="text"
                           inputMode="decimal"
                           value={flowAmount}
                           onChange={e => {
                             const val = e.target.value;
                             if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) setFlowAmount(val);
                           }}
                           placeholder="0"
                           className="w-auto min-w-[80px] max-w-[200px] text-center bg-transparent text-6xl font-black focus:outline-none placeholder:text-theme-tertiary/30"
                           autoFocus
                         />
                       </div>
                       
                       <div className="text-sm font-semibold text-theme-secondary bg-theme-surface px-4 py-2 rounded-full border border-theme-divider-light">
                         Available balance: ₦{internalBalance.toLocaleString()}
                       </div>
                       
                       {parseFloat(flowAmount) > internalBalance && (
                         <div className="mt-4 flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 px-4 py-2 rounded-full">
                           <AlertCircle className="w-4 h-4" /> Insufficient balance
                         </div>
                       )}
                       
                       {(parseFloat(flowAmount) > 0 && parseFloat(flowAmount) < minWithdrawal) && (
                         <div className="mt-4 flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 px-4 py-2 rounded-full">
                           <AlertCircle className="w-4 h-4" /> Minimum withdrawal is ₦{minWithdrawal.toLocaleString()}.
                         </div>
                       )}
                    </div>
                    <div className="shrink-0 pt-4 border-t border-theme-divider-light space-y-3">
                       <button 
                         onClick={() => navigateTo('withdraw_review')}
                         disabled={!flowAmount || parseFloat(flowAmount) < minWithdrawal || parseFloat(flowAmount) > internalBalance}
                         className="w-full py-4 rounded-xl bg-[#5E43F3] text-white font-bold text-lg hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50 disabled:shadow-none"
                       >
                         Continue
                       </button>
                    </div>
                  </>
                )}
             </div>
          )}

          {currentView === 'withdraw_review' && (
             <div className="p-4 flex flex-col h-full">
                <h3 className="font-black text-theme-primary text-2xl mb-6">Confirm withdrawal</h3>
                <div className="flex-1 space-y-4">
                  <div className="bg-theme-surface rounded-2xl p-5 border border-theme-divider-light space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Amount</div>
                      <div className="font-black text-theme-primary text-xl">₦{parseFloat(flowAmount).toLocaleString()}</div>
                    </div>
                    <div className="border-t border-theme-divider-light"></div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">To</div>
                      <div className="font-bold text-theme-primary flex items-center gap-2">
                        <Building className="w-4 h-4 text-theme-tertiary" />
                        {withdrawalAccounts.find(a => a.isDefault)?.bankName || withdrawalAccounts[0]?.bankName} •••• {(withdrawalAccounts.find(a => a.isDefault)?.accountNumber || withdrawalAccounts[0]?.accountNumber).slice(-4)}
                      </div>
                    </div>
                    <div className="border-t border-theme-divider-light"></div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Processing time</div>
                      <div className="font-bold text-theme-primary">1-2 business days</div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pt-6 flex gap-3">
                   <button onClick={goBack} className="flex-1 py-4 rounded-xl bg-theme-surface-hover text-theme-primary font-bold hover:bg-theme-surface-active transition-colors">
                     Cancel
                   </button>
                   <button 
                     onClick={() => navigateTo('withdraw_success')}
                     className="flex-[2] py-4 rounded-xl bg-[#5E43F3] text-white font-bold text-lg hover:bg-indigo-600 transition-colors shadow-lg"
                   >
                     Confirm withdrawal
                   </button>
                </div>
             </div>
          )}

          {currentView === 'withdraw_success' && (
             <div className="p-4 flex flex-col h-full text-center pb-12">
               <div className="flex-1 flex flex-col items-center justify-center pt-12">
                 <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 border border-green-100">
                   <Check className="w-12 h-12 text-green-500" />
                 </div>
                 <h3 className="font-black text-theme-primary text-2xl mb-4">Withdrawal initiated</h3>
                 <div className="font-black text-4xl text-theme-primary mb-6">₦{parseFloat(flowAmount).toLocaleString()}</div>
                 <p className="text-theme-secondary font-semibold text-sm max-w-[280px] mb-8 mx-auto">
                   Your withdrawal has been queued and is pending processing. This typically takes 1-2 business days.
                 </p>
                 
                 <div className="w-full">
                   <button onClick={handleClose} className="w-full py-4 rounded-xl bg-theme-surface-hover text-theme-primary font-bold hover:bg-theme-surface-active transition-colors">
                     Done
                   </button>
                 </div>
               </div>
             </div>
          )}

          {/* CREATOR EARNINGS */}
          {currentView === 'creator_earnings' && (
             <div className="p-4 flex flex-col h-full space-y-6 pb-12">
               <div className="bg-theme-surface p-6 rounded-3xl border border-[#5E43F3]/30 shadow-sm text-center">
                 <div className="text-4xl font-black text-theme-primary mb-2">₦0.00</div>
                 <div className="text-xs font-bold text-theme-secondary uppercase tracking-widest mb-6">Available to withdraw</div>
                 <div className="flex justify-between items-center text-sm border-t border-theme-divider-light pt-4 mt-4">
                   <div className="text-theme-tertiary font-bold">Pending</div>
                   <div className="font-bold text-theme-primary">₦0.00</div>
                 </div>
                 <div className="flex justify-between items-center text-sm mt-3">
                   <div className="text-theme-tertiary font-bold">Total earned</div>
                   <div className="font-bold text-theme-primary">₦0.00</div>
                 </div>
                 <div className="flex justify-between items-center text-sm mt-3">
                   <div className="text-theme-tertiary font-bold">Total withdrawn</div>
                   <div className="font-bold text-theme-primary">₦0.00</div>
                 </div>
               </div>
               
               <div>
                 <h4 className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-2 mb-3">Earnings History</h4>
                 <div className="bg-theme-surface rounded-2xl p-8 text-center border border-theme-divider-light">
                   <div className="font-bold text-theme-primary mb-2">No creator earnings yet.</div>
                   <div className="text-sm font-semibold text-theme-secondary">Start creating and engaging on Laula to begin earning.</div>
                 </div>
               </div>
             </div>
          )}

          {/* WITHDRAWAL SETTINGS */}
          {currentView === 'withdrawal_settings' && (
             <div className="p-4 flex flex-col h-full space-y-6 pb-12">
               <div className="text-sm font-semibold text-theme-secondary px-2">
                 Your withdrawal details are securely stored. Configure where Laula creator earnings will be withdrawn.
               </div>
               
               <div className="flex items-center justify-between px-2 mb-1">
                 <h4 className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Withdrawal method</h4>
                 <button onClick={handleRefreshAccounts} disabled={isRefreshingAccounts} className="text-xs font-bold text-theme-primary bg-theme-surface-hover hover:bg-theme-surface-active px-3 py-1 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50">
                   {isRefreshingAccounts ? 'Refreshing...' : 'Refresh'}
                 </button>
               </div>
               
               {withdrawalAccounts.length === 0 ? (
                 <div className="bg-theme-surface rounded-2xl p-8 text-center border border-theme-divider-light">
                   <div className="font-bold text-theme-primary mb-2">No withdrawal account added</div>
                   <div className="text-sm font-semibold text-theme-secondary mb-6">Add a bank account to receive your Laula creator earnings.</div>
                   <button onClick={() => { setEditingAccountId(null); setAccountForm({name:'', bank:'', number:''}); navigateTo('withdrawal_add_account'); }} className="py-3 px-6 rounded-xl bg-theme-surface-hover font-bold text-theme-primary text-sm hover:bg-theme-surface-active transition-colors inline-block">
                     + Add withdrawal account
                   </button>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {withdrawalAccounts.map(acc => (
                     <div key={acc.id} className={`bg-theme-surface rounded-2xl p-4 border transition-colors ${acc.isDefault ? 'border-[#5E43F3]' : 'border-theme-divider-light'}`}>
                       <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-theme-surface-hover flex items-center justify-center shrink-0">
                             <Building className="w-5 h-5 text-theme-primary" />
                           </div>
                           <div>
                             <div className="font-bold text-theme-primary">{acc.bankName}</div>
                             <div className="text-xs font-semibold text-theme-secondary">•••• {acc.accountNumber.slice(-4)}</div>
                             {acc.isDefault && <div className="text-[10px] font-bold text-[#5E43F3] uppercase tracking-wider mt-1">Default Account</div>}
                           </div>
                         </div>
                         <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
                           acc.status === 'verified' ? 'text-green-500 bg-green-50 border-green-100' : 
                           acc.status === 'pending' ? 'text-orange-500 bg-orange-50 border-orange-100' : 
                           'text-red-500 bg-red-50 border-red-100'
                         }`}>
                           {acc.status === 'verified' ? 'Verified (Demo)' : acc.status === 'pending' ? 'Pending verification' : 'Verification failed'}
                         </span>
                       </div>
                       
                       <div className="flex gap-2 pt-4 border-t border-theme-divider-light">
                         <button onClick={() => { setEditingAccountId(acc.id); setAccountForm({name: acc.accountName, bank: acc.bankName, number: acc.accountNumber}); navigateTo('withdrawal_edit_account'); }} className="flex-1 py-2 rounded-xl bg-theme-surface-hover font-bold text-theme-primary text-sm hover:bg-theme-surface-active transition-colors">Edit</button>
                         <button onClick={() => { if(confirm('Are you sure you want to remove this withdrawal account?')) handleRemoveAccount(acc.id); }} className="flex-1 py-2 rounded-xl bg-red-50 font-bold text-red-500 text-sm hover:bg-red-100 transition-colors">Remove</button>
                         {!acc.isDefault && (
                           <button onClick={() => handleSetDefaultAccount(acc.id)} className="flex-1 py-2 rounded-xl bg-theme-surface-hover font-bold text-theme-primary text-sm hover:bg-theme-surface-active transition-colors">Set default</button>
                         )}
                       </div>
                     </div>
                   ))}
                   
                   <button onClick={() => { setEditingAccountId(null); setAccountForm({name:'', bank:'', number:''}); navigateTo('withdrawal_add_account'); }} className="w-full py-4 rounded-xl border border-dashed border-theme-divider-light font-bold text-theme-primary hover:bg-theme-surface transition-colors flex items-center justify-center gap-2">
                     <Plus className="w-5 h-5" /> Add withdrawal account
                   </button>
                 </div>
               )}
               
               <div className="bg-theme-surface p-4 rounded-2xl border border-theme-divider-light space-y-3">
                 <div className="flex justify-between items-center text-sm">
                   <div className="text-theme-tertiary font-bold">Minimum withdrawal</div>
                   <div className="font-bold text-theme-primary">₦{minWithdrawal.toLocaleString()}</div>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <div className="text-theme-tertiary font-bold">Processing time</div>
                   <div className="font-bold text-theme-primary">1-2 business days</div>
                 </div>
               </div>
             </div>
          )}

          {/* ADD / EDIT ACCOUNT */}
          {(currentView === 'withdrawal_add_account' || currentView === 'withdrawal_edit_account') && (
             <div className="p-4 flex flex-col h-full">
                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-2">Account name</label>
                    <input 
                      type="text" 
                      placeholder="Enter account name" 
                      value={accountForm.name}
                      onChange={e => setAccountForm({...accountForm, name: e.target.value})}
                      className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-4 px-4 font-semibold text-theme-primary focus:outline-none focus:border-[#5E43F3]" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-2">Bank</label>
                    <select 
                      value={accountForm.bank}
                      onChange={e => setAccountForm({...accountForm, bank: e.target.value})}
                      className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-4 px-4 font-semibold text-theme-primary focus:outline-none focus:border-[#5E43F3] appearance-none"
                    >
                      <option value="" disabled>Select bank</option>
                      <option value="First Bank">First Bank</option>
                      <option value="GTBank">GTBank</option>
                      <option value="Zenith Bank">Zenith Bank</option>
                      <option value="Access Bank">Access Bank</option>
                      <option value="UBA">UBA</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-2">Account number</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="Enter account number" 
                      value={accountForm.number}
                      onChange={e => setAccountForm({...accountForm, number: e.target.value})}
                      className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-4 px-4 font-semibold text-theme-primary focus:outline-none focus:border-[#5E43F3] font-mono" 
                    />
                  </div>
                </div>
                
                <div className="shrink-0 pt-6 flex gap-3">
                   <button onClick={goBack} className="flex-1 py-4 rounded-xl bg-theme-surface-hover text-theme-primary font-bold hover:bg-theme-surface-active transition-colors">
                     Cancel
                   </button>
                   <button 
                     onClick={handleSaveAccount} 
                     disabled={!accountForm.name || !accountForm.bank || !accountForm.number}
                     className="flex-[2] py-4 rounded-xl bg-[#5E43F3] text-white font-bold hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50 disabled:shadow-none"
                   >
                     {currentView === 'withdrawal_edit_account' ? 'Save changes' : 'Add account'}
                   </button>
                </div>
             </div>
          )}

          {/* CRYPTO WALLET VIEW */}
          {currentView === 'crypto_wallet_view' && (
             <div className="p-4 flex flex-col h-full space-y-6 pb-12">
               <div className="bg-theme-surface p-6 rounded-3xl border border-theme-divider-light text-center shadow-sm">
                 <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                   <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-8 h-8" />
                 </div>
                 <h3 className="font-black text-theme-primary text-2xl mb-1">MetaMask</h3>
                 <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-6 inline-block bg-green-50 px-2 py-1 rounded-full border border-green-100">Connected</div>
                 
                 <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest mb-2 mt-4 text-left">Wallet address</div>
                 <div className="font-mono font-bold text-theme-primary bg-theme-base p-3 rounded-xl border border-theme-divider-light flex items-center justify-between mb-8">
                   <span>0x1234...89AB</span>
                   <button className="text-[#5E43F3] hover:text-indigo-600 font-bold text-sm flex items-center gap-1 transition-colors">
                     <Copy className="w-4 h-4" /> Copy
                   </button>
                 </div>
                 
                 <div className="flex gap-3">
                   <button onClick={() => navigateTo('crypto_send')} className="flex-1 py-4 bg-theme-surface-hover hover:bg-theme-surface-active rounded-xl font-bold text-theme-primary transition-colors flex items-center justify-center gap-2">
                     <ArrowUpRight className="w-5 h-5" /> Send
                   </button>
                   <button onClick={() => navigateTo('crypto_receive')} className="flex-1 py-4 bg-theme-surface-hover hover:bg-theme-surface-active rounded-xl font-bold text-theme-primary transition-colors flex items-center justify-center gap-2">
                     <ArrowLeft className="w-5 h-5 rotate-45" /> Receive
                   </button>
                 </div>
               </div>
             </div>
          )}

          {/* CRYPTO SEND */}
          {currentView === 'crypto_send' && (
             <div className="p-4 flex flex-col h-full">
                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-2">Select asset</label>
                    <div className="w-full bg-theme-surface p-4 rounded-xl flex items-center justify-between border border-theme-divider-light cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="font-bold text-blue-600">ETH</span>
                        </div>
                        <span className="font-bold text-theme-primary">Ethereum</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-theme-tertiary" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-2">Recipient address</label>
                    <input type="text" placeholder="Enter wallet address" className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-4 px-4 font-semibold text-theme-primary focus:outline-none focus:border-[#5E43F3] font-mono" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-2">Amount</label>
                    <div className="relative">
                      <input type="text" inputMode="decimal" placeholder="0.00" className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-4 px-4 font-bold text-theme-primary focus:outline-none focus:border-[#5E43F3]" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-theme-secondary">ETH</span>
                    </div>
                  </div>
                  
                  <div className="bg-theme-surface p-4 rounded-xl border border-theme-divider-light space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="text-theme-tertiary font-bold">Network</div>
                      <div className="font-bold text-theme-primary">Ethereum Mainnet</div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="text-theme-tertiary font-bold">Estimated fee</div>
                      <div className="font-bold text-theme-primary">~0.001 ETH</div>
                    </div>
                  </div>
                </div>
                
                <div className="shrink-0 pt-6">
                   <button className="w-full py-4 rounded-xl bg-[#5E43F3] text-white font-bold text-lg hover:bg-indigo-600 transition-colors shadow-lg">
                     Confirm transaction
                   </button>
                   <p className="text-center text-[10px] font-bold text-theme-tertiary mt-4">Transaction will be signed via MetaMask</p>
                </div>
             </div>
          )}

          {/* CRYPTO RECEIVE */}
          {currentView === 'crypto_receive' && (
             <div className="p-4 flex flex-col h-full text-center pb-12">
               <div className="flex-1 flex flex-col items-center justify-center pt-4">
                 <div className="bg-white p-4 rounded-3xl mb-8 border border-theme-divider-light">
                   <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                     <span className="text-gray-400 font-bold">QR CODE</span>
                   </div>
                 </div>
                 
                 <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest mb-2">Your wallet address</div>
                 <div className="font-mono font-black text-theme-primary text-xl mb-6 bg-theme-surface py-3 px-6 rounded-2xl border border-theme-divider-light">
                   0x1234...89AB
                 </div>
                 
                 <button className="py-4 px-8 w-full rounded-xl bg-theme-surface-hover hover:bg-theme-surface-active font-bold text-theme-primary transition-colors flex items-center justify-center gap-2 mb-8">
                   <Copy className="w-5 h-5" /> Copy address
                 </button>
                 
                 <div className="bg-orange-50 text-orange-600 p-4 rounded-xl text-xs font-bold border border-orange-100 max-w-xs mx-auto">
                   Only send assets using a network supported by this wallet.
                 </div>
               </div>
             </div>
          )}

          {/* CRYPTO DISCONNECT */}
          {currentView === 'crypto_disconnect' && (
             <div className="p-4 flex flex-col h-full text-center pb-12">
               <div className="flex-1 flex flex-col items-center justify-center pt-12">
                 <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
                   <AlertCircle className="w-12 h-12 text-red-500" />
                 </div>
                 <h3 className="font-black text-theme-primary text-2xl mb-4">Disconnect MetaMask?</h3>
                 <p className="text-theme-secondary font-semibold text-sm max-w-[280px] mb-8 mx-auto">
                   You can reconnect this wallet at any time. No Laula account data or creator earnings will be deleted.
                 </p>
                 
                 <div className="w-full space-y-3">
                   <button onClick={handleClose} className="w-full py-4 rounded-xl bg-red-500 text-white font-bold text-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
                     Disconnect
                   </button>
                   <button onClick={goBack} className="w-full py-4 rounded-xl bg-theme-surface-hover text-theme-primary font-bold hover:bg-theme-surface-active transition-colors">
                     Cancel
                   </button>
                 </div>
               </div>
             </div>
          )}

          {/* MARKET AIRTIME */}
          {currentView === 'market_airtime' && (
             <div className="p-4 flex flex-col h-full">
                <div className="flex-1 space-y-6 pt-4">
                  <div className="flex justify-between items-center bg-theme-surface p-4 rounded-xl border border-theme-divider-light">
                    <div className="text-xs font-bold text-theme-secondary uppercase tracking-widest">Available balance</div>
                    <div className="font-black text-theme-primary">{internalBalance.toLocaleString()} LC</div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-2">Network</label>
                      <select 
                        value={marketProvider} 
                        onChange={(e) => setMarketProvider(e.target.value)}
                        className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-4 px-4 font-bold text-theme-primary focus:outline-none focus:border-[#5E43F3]"
                      >
                        <option value="">Select Network</option>
                        <option value="MTN">MTN</option>
                        <option value="Airtel">Airtel</option>
                        <option value="Glo">Glo</option>
                        <option value="9mobile">9mobile</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-2">Phone Number</label>
                      <input 
                        type="tel" 
                        value={marketCustomerIdentifier}
                        onChange={(e) => setMarketCustomerIdentifier(e.target.value)}
                        placeholder="e.g. 08012345678" 
                        className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-4 px-4 font-bold text-theme-primary focus:outline-none focus:border-[#5E43F3]" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-2">Amount (₦)</label>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={marketAmount}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) setMarketAmount(val);
                        }}
                        placeholder="0" 
                        className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-4 px-4 font-bold text-theme-primary focus:outline-none focus:border-[#5E43F3]" 
                      />
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pt-6">
                   <button 
                     disabled={!marketProvider || !marketCustomerIdentifier || !marketAmount || parseFloat(marketAmount) <= 0 || parseFloat(marketAmount) > internalBalance}
                     onClick={() => { setMarketServiceType('airtime'); navigateTo('market_review'); }}
                     className="w-full py-4 rounded-xl bg-[#5E43F3] text-white font-bold text-lg hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50"
                   >
                     Continue
                   </button>
                </div>
             </div>
          )}

          {/* MARKET DATA */}
          {currentView === 'market_data' && (
             <div className="p-4 flex flex-col h-full">
                <div className="flex-1 space-y-6 pt-4">
                  <div className="flex justify-between items-center bg-theme-surface p-4 rounded-xl border border-theme-divider-light">
                    <div className="text-xs font-bold text-theme-secondary uppercase tracking-widest">Available balance</div>
                    <div className="font-black text-theme-primary">{internalBalance.toLocaleString()} LC</div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-2">Network</label>
                      <select 
                        value={marketProvider} 
                        onChange={async (e) => {
                          const val = e.target.value;
                          setMarketProvider(val);
                          setMarketProduct(null);
                          setMarketAmount('');
                          if (val) {
                            setIsFetchingVariations(true);
                            try {
                              const vars = await fetchVariations({ type: 'data', network: val });
                              setMarketVariations(vars || []);
                            } catch(e) {
                              setMarketVariations([]);
                            } finally {
                              setIsFetchingVariations(false);
                            }
                          } else {
                            setMarketVariations([]);
                          }
                        }}
                        className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-4 px-4 font-bold text-theme-primary focus:outline-none focus:border-[#5E43F3]"
                      >
                        <option value="">Select Network</option>
                        <option value="MTN">MTN</option>
                        <option value="Airtel">Airtel</option>
                        <option value="Glo">Glo</option>
                        <option value="9mobile">9mobile</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-2">Data Plan</label>
                      {isFetchingVariations ? (
                        <div className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-4 px-4 font-bold text-theme-tertiary text-center">Loading plans...</div>
                      ) : (
                        <select 
                          value={marketProduct ? marketProduct.variationId : ''} 
                          onChange={(e) => {
                            const variationId = e.target.value;
                            const plan = marketVariations.find(v => v.variationId === variationId);
                            setMarketProduct(plan);
                            setMarketAmount(plan ? plan.price.toString() : '');
                          }}
                          disabled={!marketProvider || marketVariations.length === 0}
                          className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-4 px-4 font-bold text-theme-primary focus:outline-none focus:border-[#5E43F3] disabled:opacity-50"
                        >
                          <option value="">Select Plan</option>
                          {marketVariations.map(plan => (
                            <option key={plan.variationId} value={plan.variationId}>
                              {plan.planName} - ₦{plan.price} ({plan.validity})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-2">Phone Number</label>
                      <input 
                        type="tel" 
                        value={marketCustomerIdentifier}
                        onChange={(e) => setMarketCustomerIdentifier(e.target.value)}
                        placeholder="e.g. 08012345678" 
                        className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-4 px-4 font-bold text-theme-primary focus:outline-none focus:border-[#5E43F3]" 
                      />
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pt-6">
                   <button 
                     disabled={!marketProvider || !marketCustomerIdentifier || !marketProduct || parseFloat(marketAmount) <= 0 || parseFloat(marketAmount) > internalBalance}
                     onClick={() => { setMarketServiceType('data'); navigateTo('market_review'); }}
                     className="w-full py-4 rounded-xl bg-[#5E43F3] text-white font-bold text-lg hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50"
                   >
                     Continue
                   </button>
                </div>
             </div>
          )}

          {/* MARKET BILLS */}
          {currentView === 'market_bills' && (
             <div className="p-4 flex flex-col h-full">
                <div className="flex-1 space-y-4 pt-4">
                  <h3 className="font-black text-theme-primary text-xl mb-4">Pay Bills</h3>
                  
                  <button onClick={() => navigateTo('market_electricity')} className="flex items-center justify-between p-4 rounded-2xl bg-theme-surface hover:bg-theme-surface-active transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <span className="font-bold text-yellow-600 text-lg">⚡</span>
                      </div>
                      <span className="font-bold text-theme-primary">Electricity</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-theme-tertiary" />
                  </button>
                  
                  <button onClick={() => navigateTo('market_cable')} className="flex items-center justify-between p-4 rounded-2xl bg-theme-surface hover:bg-theme-surface-active transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="font-bold text-blue-600 text-lg">📺</span>
                      </div>
                      <span className="font-bold text-theme-primary">Cable TV</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-theme-tertiary" />
                  </button>
                </div>
             </div>
          )}

          {/* MARKET REVIEW */}
          {currentView === 'market_review' && (
             <div className="p-4 flex flex-col h-full">
                <h3 className="font-black text-theme-primary text-2xl mb-6">Confirm {marketServiceType === 'airtime' ? 'Airtime' : marketServiceType === 'data' ? 'Data' : 'Payment'}</h3>
                
                <div className="flex-1 space-y-4">
                  <div className="bg-theme-surface rounded-2xl p-5 border border-theme-divider-light space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Network/Provider</div>
                      <div className="font-bold text-theme-primary">{marketProvider}</div>
                    </div>
                    <div className="border-t border-theme-divider-light"></div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Recipient</div>
                      <div className="font-bold text-theme-primary">{marketCustomerIdentifier}</div>
                    </div>
                    {marketProduct && marketProduct.planName && (
                      <>
                        <div className="border-t border-theme-divider-light"></div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Plan</div>
                          <div className="font-bold text-theme-primary">{marketProduct.planName}</div>
                        </div>
                      </>
                    )}
                    <div className="border-t border-theme-divider-light"></div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Amount</div>
                      <div className="font-black text-theme-primary">₦{parseFloat(marketAmount).toLocaleString()}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Fee</div>
                      <div className="font-bold text-theme-primary">₦{marketFee.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center bg-theme-surface-hover p-4 rounded-xl border border-theme-divider-light">
                    <div className="text-xs font-bold text-theme-secondary uppercase tracking-widest">Balance after purchase</div>
                    <div className="font-black text-theme-primary">₦{(internalBalance - (parseFloat(marketAmount) + marketFee)).toLocaleString()}</div>
                  </div>
                </div>

                <div className="shrink-0 pt-6 flex gap-3">
                   <button onClick={goBack} className="flex-1 py-4 rounded-xl bg-theme-surface-hover text-theme-primary font-bold hover:bg-theme-surface-active transition-colors">Cancel</button>
                   <button onClick={() => navigateTo('market_pin')} className="flex-[2] py-4 rounded-xl bg-[#5E43F3] text-white font-bold hover:bg-indigo-600 transition-colors shadow-lg">Confirm purchase</button>
                </div>
             </div>
          )}

          {/* MARKET PIN */}
          {currentView === 'market_pin' && (
             <div className="p-4 flex flex-col h-full items-center justify-center text-center">
               <h3 className="font-black text-theme-primary text-2xl mb-2">Enter Wallet PIN</h3>
               <p className="text-theme-secondary font-semibold text-sm mb-8">Confirm your purchase.</p>
               
               <div className="flex items-center gap-4 mb-8">
                 {[...Array(4)].map((_, i) => (
                   <div key={i} className={`w-6 h-6 rounded-full border-2 ${pin.length > i ? 'bg-[#5E43F3] border-[#5E43F3]' : 'bg-transparent border-theme-divider-light'}`}></div>
                 ))}
               </div>

               {withdrawError && (
                 <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-semibold mb-6 animate-in slide-in-from-bottom-2">
                   {withdrawError}
                 </div>
               )}

               <div className="grid grid-cols-3 gap-4 w-full max-w-[240px] mb-8">
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'empty', 0, 'del'].map((num, i) => (
                   num === 'empty' ? <div key={i} /> :
                   num === 'del' ? (
                     <button key={i} onClick={() => setPin(p => p.slice(0, -1))} className="h-14 flex items-center justify-center text-theme-primary font-bold hover:bg-theme-surface-hover rounded-full transition-colors">
                       <ArrowLeft className="w-6 h-6" />
                     </button>
                   ) : (
                     <button key={i} onClick={() => setPin(p => (p.length < 4 ? p + num : p))} className="h-14 flex items-center justify-center text-2xl font-bold text-theme-primary hover:bg-theme-surface-hover rounded-full transition-colors">
                       {num}
                     </button>
                   )
                 ))}
               </div>
               
               <button 
                 disabled={pin.length < 4 || isProcessing}
                 onClick={async () => {
                   setIsProcessing(true);
                   try {
                     const res = await performPurchaseService({
                       serviceCategory: marketServiceType,
                       provider: marketProvider,
                       customerIdentifier: marketCustomerIdentifier,
                       product: marketProduct ? marketProduct.planName : undefined,
                       variationId: marketProduct ? marketProduct.variationId : undefined,
                       amount: parseFloat(marketAmount),
                       fee: marketFee,
                       pin: pin
                     });
                     
                     if (res.success) {
                       navigateTo('market_success');
                     } else {
                       setWithdrawError(res.message || 'Transaction failed or is pending.');
                     }
                   } catch (e: any) {
                     setWithdrawError(e.message || 'Transaction failed.');
                   } finally {
                     setIsProcessing(false);
                     setPin('');
                   }
                 }}
                 className="w-full py-4 rounded-xl bg-[#5E43F3] text-white font-bold text-lg hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50"
               >
                 {isProcessing ? 'Processing...' : 'Pay'}
               </button>
             </div>
          )}

          {/* MARKET SUCCESS */}
          {currentView === 'market_success' && (
             <div className="p-4 flex flex-col h-full text-center pb-12">
               <div className="flex-1 flex flex-col items-center justify-center pt-12">
                 <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 border border-green-100">
                   <Check className="w-12 h-12 text-green-500" />
                 </div>
                 <h3 className="font-black text-theme-primary text-2xl mb-4">Transaction successful ✓</h3>
                 <div className="font-black text-2xl text-theme-primary mb-2">₦{parseFloat(marketAmount).toLocaleString()} {marketProvider} {marketServiceType}</div>
                 <p className="text-theme-secondary font-semibold text-sm max-w-[280px] mb-8 mx-auto">
                   Sent to {marketCustomerIdentifier}
                 </p>
                 
                 <div className="w-full">
                   <button onClick={handleClose} className="w-full py-4 rounded-xl bg-theme-surface-hover text-theme-primary font-bold hover:bg-theme-surface-active transition-colors">
                     Done
                   </button>
                 </div>
               </div>
             </div>
          )}

        </div>
        </div>
      </div>
      
      {/* DEVELOPMENT / DEMO CONTROLS (Only visible in dev) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 left-4 bg-black/90 p-4 rounded-xl border border-theme-divider-light z-[100] max-w-[320px] text-white space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-theme-tertiary">Dev Testing Controls</div>
          
          <div className="space-y-1">
            <div className="text-xs font-semibold text-theme-secondary mb-1">State Configs</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setWithdrawalAccounts([])} className="text-[10px] px-2 py-1 bg-theme-surface rounded font-bold border border-theme-divider-light hover:bg-theme-surface-hover">A. No accounts</button>
              <button onClick={() => setWithdrawalAccounts([{id: 'dev1', accountName: 'John', bankName: 'First Bank', accountNumber: '11112222', status: 'pending', isDefault: true}])} className="text-[10px] px-2 py-1 bg-theme-surface rounded font-bold border border-theme-divider-light hover:bg-theme-surface-hover">B. 1 Pending</button>
              <button onClick={() => setWithdrawalAccounts([{id: 'dev1', accountName: 'John', bankName: 'First Bank', accountNumber: '11112222', status: 'verified', isDefault: true}])} className="text-[10px] px-2 py-1 bg-theme-surface rounded font-bold border border-theme-divider-light hover:bg-theme-surface-hover">C. 1 Verified</button>
              <button onClick={() => setWithdrawalAccounts([
                {id: 'dev1', accountName: 'John', bankName: 'First Bank', accountNumber: '11112222', status: 'verified', isDefault: true},
                {id: 'dev2', accountName: 'Jane', bankName: 'GTBank', accountNumber: '55556666', status: 'pending', isDefault: false}
              ])} className="text-[10px] px-2 py-1 bg-theme-surface rounded font-bold border border-theme-divider-light hover:bg-theme-surface-hover">D. Multiple</button>
              <button onClick={() => setWithdrawalAccounts([{id: 'dev1', accountName: 'John', bankName: 'First Bank', accountNumber: '11112222', status: 'failed', isDefault: true}])} className="text-[10px] px-2 py-1 bg-theme-surface rounded font-bold border border-theme-divider-light hover:bg-theme-surface-hover">E. Failed</button>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs font-semibold text-theme-secondary mb-1">Mock Balance</div>
            <div className="flex gap-2">
              <button onClick={() => setDevBalance(3000)} className="text-[10px] px-2 py-1 bg-theme-surface rounded font-bold border border-theme-divider-light hover:bg-theme-surface-hover">3,000 (Low)</button>
              <button onClick={() => setDevBalance(10000)} className="text-[10px] px-2 py-1 bg-theme-surface rounded font-bold border border-theme-divider-light hover:bg-theme-surface-hover">10,000 (Ok)</button>
              <button onClick={() => setDevBalance(null)} className="text-[10px] px-2 py-1 bg-theme-surface rounded font-bold border border-theme-divider-light hover:bg-theme-surface-hover text-red-400">Reset</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
