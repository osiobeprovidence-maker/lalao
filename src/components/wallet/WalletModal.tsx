import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  ArrowLeft, ArrowUpRight, Copy, Plus, Check, Settings, 
  MoreHorizontal, Wallet, ChevronRight, X, Search, History, 
  Shield, Lock, CreditCard, Banknote, Building, AlertCircle, Receipt,
  Bitcoin, Smartphone, Wifi, Tv, ExternalLink, Unplug, Link2, Mail, KeyRound
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { usePaystackPayment } from 'react-paystack';
import { useWeb3Wallet, SUPPORTED_CHAINS, DEFAULT_CHAIN_ID } from '../../hooks/useWeb3Wallet';
import { NativeDataPlanSelector } from './NativeDataPlanSelector';

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
  | 'fund_pending'
  | 'fund_success'
  | 'fund_failed'
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
  const userRole = useQuery(api.admin.getMyRole);
  const isDevAdmin = userRole === 'super_admin' || userRole === 'admin';
  
  const performTransferCredits = useMutation(api.wallet.transferCredits);
  const performTransferCrypto = useMutation(api.wallet.transferCrypto);
  const performTopUp = useMutation(api.wallet.topUp);
  const performSetWalletPin = useMutation(api.wallet.setWalletPin);
  const performRequestPinResetOtp = useAction(api.wallet.requestPinResetOtp);
  const performResetWalletPinWithOtp = useMutation(api.wallet.resetWalletPinWithOtp);
  
  // Settings / PIN State
  const [oldWalletPinInput, setOldWalletPinInput] = useState('');
  const [newWalletPinInput, setNewWalletPinInput] = useState('');
  const [confirmWalletPinInput, setConfirmWalletPinInput] = useState('');
  const [pinChangeError, setPinChangeError] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [isForgotPinMode, setIsForgotPinMode] = useState(false);
  const [forgotPinOtp, setForgotPinOtp] = useState('');
  const [forgotPinNewPin, setForgotPinNewPin] = useState('');
  const [forgotPinConfirmPin, setForgotPinConfirmPin] = useState('');
  const [forgotPinEmailMasked, setForgotPinEmailMasked] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const performInitializeFunding = useAction(api.wallet.initializeFunding);
  const performVerifyFunding = useAction(api.wallet.verifyPaystackFunding);
  const performPurchaseService = useAction(api.market.purchaseService);
  const fetchVariations = useAction(api.market.getVariations);
  const fetchCablePackages = useAction(api.market.getCablePackages);
  const verifyElectricityMeter = useAction(api.market.verifyElectricityMeter);
  const verifyCableSmartcard = useAction(api.market.verifyCableSmartcard);
  const serviceSettings = useQuery(api.clubkonnect.getCustomerServiceSettings);

  // Crypto wallet — real Web3 connection
  const web3 = useWeb3Wallet();
  const dbCryptoWallets = useQuery(api.cryptoWallets.getCryptoWallets);
  const saveCryptoWallet = useMutation(api.cryptoWallets.saveCryptoWallet);
  const disconnectCryptoWallet = useMutation(api.cryptoWallets.disconnectCryptoWallet);
  const [addressCopied, setAddressCopied] = useState(false);

  const [currentView, setCurrentView] = useState<WalletView>('home');
  const [viewStack, setViewStack] = useState<WalletView[]>(['home']);
  
  // Dev override for testing — restricted to explicit test mode flag
  const [devBalance, setDevBalance] = useState<number | null>(null);
  const isTestModeEnabled = isDevAdmin && import.meta.env.DEV && import.meta.env.VITE_ENABLE_WALLET_TEST_MODE === 'true';
  const internalBalance = (isTestModeEnabled && devBalance !== null) ? devBalance : (wallet?.balance ?? 0);
  
  // Real crypto balance derived from hook
  const cryptoBalanceUSDC = web3.balance ? parseFloat(web3.balance) : 0;

  // Save wallet to DB when connected
  useEffect(() => {
    if (web3.status === 'connected' && web3.address && web3.provider) {
      saveCryptoWallet({
        walletAddress: web3.address,
        provider: web3.providerName ?? web3.providerId ?? 'injected',
        network: web3.chainName ?? undefined,
      }).catch(() => {});
    }
  }, [web3.status, web3.address, web3.provider, web3.providerId, web3.providerName, web3.chainName]);

  const handleCopyAddress = useCallback(() => {
    if (web3.address) {
      navigator.clipboard.writeText(web3.address).then(() => {
        setAddressCopied(true);
        setTimeout(() => setAddressCopied(false), 2000);
      });
    }
  }, [web3.address]);

  const handleCryptoConnect = useCallback(async (providerId?: string) => {
    await web3.connect(providerId);
  }, [web3]);

  const handleCryptoDisconnect = useCallback(async () => {
    if (web3.address) {
      await disconnectCryptoWallet({ walletAddress: web3.address }).catch(() => {});
    }
    web3.disconnect();
    goBack();
  }, [web3, disconnectCryptoWallet]);

  // Flow State
  const [flowAssetType, setFlowAssetType] = useState<'LALAO_CREDITS' | 'CRYPTO'>('LALAO_CREDITS');
  const [flowRecipient, setFlowRecipient] = useState<any | null>(null);
  const [flowAmount, setFlowAmount] = useState<string>('');
  const [flowMethod, setFlowMethod] = useState<string>('');
  const [pin, setPin] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [fundingError, setFundingError] = useState('');
  const [fundingStatusMessage, setFundingStatusMessage] = useState('');
  const [activePaymentRef, setActivePaymentRef] = useState<string>('');

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
  const [marketVariations, setMarketVariations] = useState<any[]>([]);
  const [isFetchingVariations, setIsFetchingVariations] = useState(false);
  const [meterType, setMeterType] = useState<'Prepaid' | 'Postpaid'>('Prepaid');
  const [verifiedCustomerName, setVerifiedCustomerName] = useState<string>('');
  const [isVerifyingCustomer, setIsVerifyingCustomer] = useState(false);
  const [returnedToken, setReturnedToken] = useState<string>('');
  const [cablePackagesList, setCablePackagesList] = useState<any[]>([]);
  const [isFetchingCablePackages, setIsFetchingCablePackages] = useState(false);

  // Generate a stable reference for the current flow
  const currentPaystackReference = useMemo(() => {
    return activePaymentRef || `LAL_FUND_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }, [activePaymentRef, currentView === 'fund_review']);

  const paystackConfig = {
    reference: currentPaystackReference, userId: currentUser?.id,
    email: currentUser?.email || 'user@lalao.app',
    amount: Math.round((parseFloat(flowAmount) || 0) * 100), // Paystack amount is in kobo (1 NGN = 100 kobo)
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_1e3e4134a6324bd82248c28828b24f8a835e9f0f',
  };

  const initializePayment = usePaystackPayment(paystackConfig as any);

  const handlePaystackSuccess = async (response: any) => {
    setIsProcessing(true);
    setFundingStatusMessage('Verifying payment with Paystack...');
    navigateTo('fund_pending');
    try {
      const verifiedRef = response?.reference || currentPaystackReference;
      const result = await performVerifyFunding({
        reference: verifiedRef
      });
      
      if (result.success) {
        navigateTo('fund_success');
      } else {
        setFundingError(result.message || 'Payment verification could not be confirmed. If you were debited, your wallet will credit automatically once the provider settles.');
        navigateTo('fund_failed');
      }
    } catch (e: any) {
      console.error("Error verifying payment:", e);
      setFundingError(e.message || 'Payment verification encountered a network error. Checking transactions...');
      navigateTo('fund_failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaystackClose = () => {
    setIsProcessing(false);
    setFundingStatusMessage('Payment window was closed before completion.');
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
      <div 
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 sm:p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div 
          className="w-full sm:max-w-md bg-theme-base sm:rounded-[32px] rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-[85vh] max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
        
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
                {web3.status === 'connected' && web3.address ? (
                  <div className="bg-theme-surface rounded-3xl p-6 border border-theme-divider-light shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-theme-primary">{web3.providerName ?? web3.providerId ?? 'Wallet'}</div>
                        <div className="text-xs font-semibold text-theme-secondary flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          {web3.shortAddress}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => navigateTo('crypto_wallet_view')} className="text-xs font-bold text-theme-primary px-4 py-2 bg-theme-base border border-theme-divider-light rounded-full hover:bg-theme-surface-active transition-colors">
                      View
                    </button>
                  </div>
                ) : (
                  <div className="bg-theme-surface rounded-3xl p-6 border border-theme-divider-light shadow-sm">
                    <p className="text-sm font-semibold text-theme-secondary mb-4">
                      Connect an external wallet to manage blockchain-based features.
                    </p>
                    {web3.error && (
                      <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 px-3 py-2 rounded-xl mb-4 border border-red-100">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{web3.error}</span>
                      </div>
                    )}
                    {web3.isUnsupportedNetwork && (
                      <div className="flex items-center gap-2 text-orange-600 text-xs font-bold bg-orange-50 px-3 py-2 rounded-xl mb-4 border border-orange-100">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Unsupported network. Please switch to Polygon or another supported chain.</span>
                      </div>
                    )}
                    {web3.availableProviders.length > 0 ? (
                      <div className="space-y-2 mb-3">
                        {web3.availableProviders.map((provider) => (
                          <button
                            key={provider.id}
                            type="button"
                            onClick={() => handleCryptoConnect(provider.id)}
                            disabled={web3.status === 'connecting'}
                            className="w-full flex items-center justify-between rounded-xl border border-theme-divider-light bg-theme-base px-4 py-3 text-left hover:border-[#5E43F3]/40 transition-colors disabled:opacity-60"
                          >
                            <span className="font-bold text-theme-primary">{provider.name}</span>
                            <ChevronRight className="w-4 h-4 text-theme-tertiary" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-theme-secondary mb-3">
                        No EIP-6963 wallet was detected. Install a compatible wallet and refresh this page.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCryptoConnect()}
                      disabled={web3.status === 'connecting' || web3.availableProviders.length === 0}
                      className="w-full py-3.5 rounded-xl bg-[#5E43F3] text-white font-bold text-sm hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {web3.status === 'connecting' ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Connecting…</>
                      ) : (
                        <><Link2 className="w-4 h-4" /> Connect Wallet</>
                      )}
                    </button>
                  </div>
                )}
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
                {web3.status === 'connected' ? (
                  <>
                    <button onClick={() => navigateTo('crypto_wallet_view')} className="w-full bg-theme-surface p-4 rounded-xl flex items-center justify-between border border-theme-divider-light hover:bg-theme-surface-hover transition-colors text-left">
                      <div className="font-bold text-theme-primary">Connected wallets</div>
                      <div className="text-sm font-semibold text-theme-secondary flex items-center gap-2">{web3.providerName ?? web3.providerId ?? 'Wallet'} <ChevronRight className="w-4 h-4" /></div>
                    </button>
                    <button onClick={() => navigateTo('crypto_disconnect')} className="w-full bg-theme-surface p-4 rounded-xl flex items-center justify-between border border-red-100 hover:bg-red-50 transition-colors text-left">
                      <div className="font-bold text-red-500">Disconnect wallet</div>
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleCryptoConnect()} disabled={web3.status === 'connecting'} className="w-full bg-theme-surface p-4 rounded-xl flex items-center justify-between border border-theme-divider-light hover:bg-theme-surface-hover transition-colors text-left">
                    <div className="font-bold text-theme-primary">Connect a wallet</div>
                    <ChevronRight className="w-4 h-4 text-theme-tertiary" />
                  </button>
                )}
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

          {/* WALLET SETTINGS - PIN & SECURITY */}
          {currentView === 'settings' && (
             <div className="p-4 space-y-6 pb-12">
               <div className="bg-theme-surface rounded-3xl p-6 border border-theme-divider-light shadow-sm">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
                     <Lock className="w-5 h-5" />
                   </div>
                   <div>
                     <h3 className="font-black text-theme-primary text-lg">Transaction PIN</h3>
                     <p className="text-xs font-semibold text-theme-secondary">
                       {(wallet as any)?.hasPin ? 'Your 4-digit security PIN is active' : 'Set a 4-digit security PIN to authorize transfers & market payments'}
                     </p>
                   </div>
                 </div>

                 {pinChangeSuccess && (
                   <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 dark:text-green-400 text-xs font-bold mb-4">
                     <Check className="w-4 h-4 shrink-0" />
                     <span>{pinChangeSuccess}</span>
                   </div>
                 )}

                 {pinChangeError && (
                   <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold mb-4">
                     <AlertCircle className="w-4 h-4 shrink-0" />
                     <span>{pinChangeError}</span>
                   </div>
                 )}

                 {/* CASE 1: PIN is already set, showing clean active status card with action buttons */}
                 {(wallet as any)?.hasPin && !isChangingPin && !isForgotPinMode && (
                   <div className="space-y-4 pt-1">
                     <div className="bg-theme-base/60 border border-theme-divider-light rounded-2xl p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                           <Shield className="w-5 h-5" />
                         </div>
                         <div>
                           <div className="flex items-center gap-1.5">
                             <span className="text-sm font-bold text-theme-primary">PIN Protection Enabled</span>
                             <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                               Saved
                             </span>
                           </div>
                           <p className="text-xs text-theme-secondary font-medium mt-0.5">Required for outgoing transfers & purchases</p>
                         </div>
                       </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3 pt-2">
                       <button
                         type="button"
                         onClick={() => {
                           setPinChangeError('');
                           setPinChangeSuccess('');
                           setIsChangingPin(true);
                           setIsForgotPinMode(false);
                         }}
                         className="w-full py-3 px-4 rounded-xl bg-[#5E43F3] text-white font-bold text-xs hover:bg-indigo-600 transition-colors shadow-sm flex items-center justify-center gap-2"
                       >
                         <KeyRound className="w-4 h-4" />
                         Change PIN
                       </button>

                       <button
                         type="button"
                         disabled={isRequestingOtp}
                         onClick={async () => {
                           setPinChangeError('');
                           setPinChangeSuccess('');
                           setIsRequestingOtp(true);
                           try {
                             const res = await performRequestPinResetOtp();
                             setForgotPinEmailMasked(res.email || '');
                             setIsForgotPinMode(true);
                             setIsChangingPin(false);
                             setPinChangeSuccess(`A 6-digit reset code has been sent to your email (${res.email || 'account email'}).`);
                           } catch (err: any) {
                             setPinChangeError(err.message || 'Failed to send reset code. Please try again.');
                           } finally {
                             setIsRequestingOtp(false);
                           }
                         }}
                         className="w-full py-3 px-4 rounded-xl bg-theme-base hover:bg-theme-surface-hover border border-theme-divider-light text-theme-primary font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                       >
                         <Mail className="w-4 h-4 text-[#5E43F3]" />
                         {isRequestingOtp ? 'Sending code...' : 'Forgot PIN?'}
                       </button>
                     </div>
                   </div>
                 )}

                 {/* CASE 2: Change PIN form (revealed when user clicks "Change PIN") */}
                 {(wallet as any)?.hasPin && isChangingPin && !isForgotPinMode && (
                   <div className="space-y-4 pt-2">
                     <div className="flex items-center justify-between pb-1">
                       <span className="text-xs font-black text-theme-primary uppercase tracking-wider">Change Security PIN</span>
                       <button
                         type="button"
                         onClick={() => {
                           setIsChangingPin(false);
                           setOldWalletPinInput('');
                           setNewWalletPinInput('');
                           setConfirmWalletPinInput('');
                           setPinChangeError('');
                         }}
                         className="text-xs text-theme-secondary hover:text-theme-primary font-bold underline"
                       >
                         Cancel
                       </button>
                     </div>

                     <div>
                       <label className="block text-xs font-bold text-theme-tertiary uppercase tracking-wider mb-2">Current PIN</label>
                       <input 
                         type="password"
                         maxLength={4}
                         placeholder="••••"
                         value={oldWalletPinInput}
                         onChange={(e) => setOldWalletPinInput(e.target.value.replace(/\D/g, ''))}
                         className="w-full bg-theme-base border border-theme-divider-light rounded-xl px-4 py-3 font-mono font-bold text-lg text-theme-primary focus:outline-none focus:border-[#5E43F3]"
                       />
                     </div>

                     <div>
                       <label className="block text-xs font-bold text-theme-tertiary uppercase tracking-wider mb-2">New 4-Digit PIN</label>
                       <input 
                         type="password"
                         maxLength={4}
                         placeholder="••••"
                         value={newWalletPinInput}
                         onChange={(e) => setNewWalletPinInput(e.target.value.replace(/\D/g, ''))}
                         className="w-full bg-theme-base border border-theme-divider-light rounded-xl px-4 py-3 font-mono font-bold text-lg text-theme-primary focus:outline-none focus:border-[#5E43F3]"
                       />
                     </div>

                     <div>
                       <label className="block text-xs font-bold text-theme-tertiary uppercase tracking-wider mb-2">Confirm New PIN</label>
                       <input 
                         type="password"
                         maxLength={4}
                         placeholder="••••"
                         value={confirmWalletPinInput}
                         onChange={(e) => setConfirmWalletPinInput(e.target.value.replace(/\D/g, ''))}
                         className="w-full bg-theme-base border border-theme-divider-light rounded-xl px-4 py-3 font-mono font-bold text-lg text-theme-primary focus:outline-none focus:border-[#5E43F3]"
                       />
                     </div>

                     <div className="pt-2 flex gap-3">
                       <button
                         type="button"
                         onClick={() => {
                           setIsChangingPin(false);
                           setOldWalletPinInput('');
                           setNewWalletPinInput('');
                           setConfirmWalletPinInput('');
                           setPinChangeError('');
                         }}
                         className="w-1/3 py-3.5 rounded-xl bg-theme-base hover:bg-theme-surface-hover border border-theme-divider-light text-theme-primary font-bold text-sm transition-colors"
                       >
                         Cancel
                       </button>

                       <button
                         type="button"
                         disabled={isProcessing || oldWalletPinInput.length !== 4 || newWalletPinInput.length !== 4 || confirmWalletPinInput.length !== 4}
                         onClick={async () => {
                           setPinChangeError('');
                           setPinChangeSuccess('');
                           if (newWalletPinInput !== confirmWalletPinInput) {
                             setPinChangeError("New PIN and Confirm PIN do not match.");
                             return;
                           }
                           setIsProcessing(true);
                           try {
                             const res = await performSetWalletPin({
                               pin: newWalletPinInput,
                               oldPin: oldWalletPinInput,
                             });
                             setPinChangeSuccess(res.message || "PIN updated successfully!");
                             setOldWalletPinInput('');
                             setNewWalletPinInput('');
                             setConfirmWalletPinInput('');
                             setIsChangingPin(false);
                           } catch (err: any) {
                             setPinChangeError(err.message || "Failed to update PIN.");
                           } finally {
                             setIsProcessing(false);
                           }
                         }}
                         className="w-2/3 py-3.5 rounded-xl bg-[#5E43F3] text-white font-bold text-sm hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                         {isProcessing ? 'Updating...' : 'Update PIN'}
                       </button>
                     </div>

                     <div className="text-center pt-2">
                       <button
                         type="button"
                         disabled={isRequestingOtp}
                         onClick={async () => {
                           setPinChangeError('');
                           setPinChangeSuccess('');
                           setIsRequestingOtp(true);
                           try {
                             const res = await performRequestPinResetOtp();
                             setForgotPinEmailMasked(res.email || '');
                             setIsForgotPinMode(true);
                             setIsChangingPin(false);
                             setPinChangeSuccess(`Reset code sent to ${res.email || 'your email'}.`);
                           } catch (err: any) {
                             setPinChangeError(err.message || 'Failed to send reset code.');
                           } finally {
                             setIsRequestingOtp(false);
                           }
                         }}
                         className="text-xs font-semibold text-[#5E43F3] hover:underline"
                       >
                         Forgot current PIN? Reset via email
                       </button>
                     </div>
                   </div>
                 )}

                 {/* CASE 3: Forgot PIN mode (email reset OTP code) */}
                 {isForgotPinMode && (
                   <div className="space-y-4 pt-2">
                     <div className="flex items-center justify-between pb-1">
                       <span className="text-xs font-black text-theme-primary uppercase tracking-wider">Reset PIN via Email</span>
                       <button
                         type="button"
                         onClick={() => {
                           setIsForgotPinMode(false);
                           setForgotPinOtp('');
                           setForgotPinNewPin('');
                           setForgotPinConfirmPin('');
                           setPinChangeError('');
                         }}
                         className="text-xs text-theme-secondary hover:text-theme-primary font-bold underline"
                       >
                         Cancel
                       </button>
                     </div>

                     <p className="text-xs text-theme-secondary font-medium">
                       Enter the 6-digit verification code sent to your email {forgotPinEmailMasked ? `(${forgotPinEmailMasked})` : ''} and choose a new 4-digit PIN.
                     </p>

                     <div>
                       <label className="block text-xs font-bold text-theme-tertiary uppercase tracking-wider mb-2">6-Digit Email Code</label>
                       <input 
                         type="text"
                         maxLength={6}
                         placeholder="123456"
                         value={forgotPinOtp}
                         onChange={(e) => setForgotPinOtp(e.target.value.replace(/\D/g, ''))}
                         className="w-full bg-theme-base border border-theme-divider-light rounded-xl px-4 py-3 font-mono font-bold text-lg text-theme-primary focus:outline-none focus:border-[#5E43F3] tracking-widest"
                       />
                     </div>

                     <div>
                       <label className="block text-xs font-bold text-theme-tertiary uppercase tracking-wider mb-2">New 4-Digit PIN</label>
                       <input 
                         type="password"
                         maxLength={4}
                         placeholder="••••"
                         value={forgotPinNewPin}
                         onChange={(e) => setForgotPinNewPin(e.target.value.replace(/\D/g, ''))}
                         className="w-full bg-theme-base border border-theme-divider-light rounded-xl px-4 py-3 font-mono font-bold text-lg text-theme-primary focus:outline-none focus:border-[#5E43F3]"
                       />
                     </div>

                     <div>
                       <label className="block text-xs font-bold text-theme-tertiary uppercase tracking-wider mb-2">Confirm New PIN</label>
                       <input 
                         type="password"
                         maxLength={4}
                         placeholder="••••"
                         value={forgotPinConfirmPin}
                         onChange={(e) => setForgotPinConfirmPin(e.target.value.replace(/\D/g, ''))}
                         className="w-full bg-theme-base border border-theme-divider-light rounded-xl px-4 py-3 font-mono font-bold text-lg text-theme-primary focus:outline-none focus:border-[#5E43F3]"
                       />
                     </div>

                     <div className="pt-2 flex gap-3">
                       <button
                         type="button"
                         onClick={() => {
                           setIsForgotPinMode(false);
                           setForgotPinOtp('');
                           setForgotPinNewPin('');
                           setForgotPinConfirmPin('');
                           setPinChangeError('');
                         }}
                         className="w-1/3 py-3.5 rounded-xl bg-theme-base hover:bg-theme-surface-hover border border-theme-divider-light text-theme-primary font-bold text-sm transition-colors"
                       >
                         Cancel
                       </button>

                       <button
                         type="button"
                         disabled={isProcessing || forgotPinOtp.length !== 6 || forgotPinNewPin.length !== 4 || forgotPinConfirmPin.length !== 4}
                         onClick={async () => {
                           setPinChangeError('');
                           setPinChangeSuccess('');
                           if (forgotPinNewPin !== forgotPinConfirmPin) {
                             setPinChangeError("New PIN and Confirm PIN do not match.");
                             return;
                           }
                           setIsProcessing(true);
                           try {
                             const res = await performResetWalletPinWithOtp({
                               otp: forgotPinOtp,
                               newPin: forgotPinNewPin,
                             });
                             setPinChangeSuccess(res.message || "Your PIN has been successfully reset!");
                             setForgotPinOtp('');
                             setForgotPinNewPin('');
                             setForgotPinConfirmPin('');
                             setIsForgotPinMode(false);
                           } catch (err: any) {
                             setPinChangeError(err.message || "Failed to reset PIN. Check the code and try again.");
                           } finally {
                             setIsProcessing(false);
                           }
                         }}
                         className="w-2/3 py-3.5 rounded-xl bg-[#5E43F3] text-white font-bold text-sm hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                         {isProcessing ? 'Resetting...' : 'Save New PIN'}
                       </button>
                     </div>

                     <div className="text-center pt-2">
                       <button
                         type="button"
                         disabled={isRequestingOtp}
                         onClick={async () => {
                           setPinChangeError('');
                           setPinChangeSuccess('');
                           setIsRequestingOtp(true);
                           try {
                             const res = await performRequestPinResetOtp();
                             setForgotPinEmailMasked(res.email || '');
                             setPinChangeSuccess(`New code sent to ${res.email || 'your email'}.`);
                           } catch (err: any) {
                             setPinChangeError(err.message || 'Failed to resend code.');
                           } finally {
                             setIsRequestingOtp(false);
                           }
                         }}
                         className="text-xs font-semibold text-[#5E43F3] hover:underline"
                       >
                         {isRequestingOtp ? 'Sending...' : 'Didn’t receive the code? Resend'}
                       </button>
                     </div>
                   </div>
                 )}

                 {/* CASE 4: Initial PIN setup when no PIN is yet configured */}
                 {!(wallet as any)?.hasPin && !isForgotPinMode && (
                   <div className="space-y-4 pt-2">
                     <div>
                       <label className="block text-xs font-bold text-theme-tertiary uppercase tracking-wider mb-2">Create 4-Digit PIN</label>
                       <input 
                         type="password"
                         maxLength={4}
                         placeholder="••••"
                         value={newWalletPinInput}
                         onChange={(e) => setNewWalletPinInput(e.target.value.replace(/\D/g, ''))}
                         className="w-full bg-theme-base border border-theme-divider-light rounded-xl px-4 py-3 font-mono font-bold text-lg text-theme-primary focus:outline-none focus:border-[#5E43F3]"
                       />
                     </div>

                     <div>
                       <label className="block text-xs font-bold text-theme-tertiary uppercase tracking-wider mb-2">Confirm PIN</label>
                       <input 
                         type="password"
                         maxLength={4}
                         placeholder="••••"
                         value={confirmWalletPinInput}
                         onChange={(e) => setConfirmWalletPinInput(e.target.value.replace(/\D/g, ''))}
                         className="w-full bg-theme-base border border-theme-divider-light rounded-xl px-4 py-3 font-mono font-bold text-lg text-theme-primary focus:outline-none focus:border-[#5E43F3]"
                       />
                     </div>

                     <button
                       disabled={isProcessing || newWalletPinInput.length !== 4 || confirmWalletPinInput.length !== 4}
                       onClick={async () => {
                         setPinChangeError('');
                         setPinChangeSuccess('');
                         if (newWalletPinInput !== confirmWalletPinInput) {
                           setPinChangeError("New PIN and Confirm PIN do not match.");
                           return;
                         }
                         setIsProcessing(true);
                         try {
                           const res = await performSetWalletPin({
                             pin: newWalletPinInput,
                           });
                           setPinChangeSuccess(res.message || "PIN saved successfully!");
                           setNewWalletPinInput('');
                           setConfirmWalletPinInput('');
                         } catch (err: any) {
                           setPinChangeError(err.message || "Failed to save PIN.");
                         } finally {
                           setIsProcessing(false);
                         }
                       }}
                       className="w-full py-3.5 rounded-xl bg-[#5E43F3] text-white font-bold text-sm hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                     >
                       {isProcessing ? 'Saving PIN...' : 'Save PIN'}
                     </button>
                   </div>
                 )}
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
                <div className="flex-1 flex flex-col items-center justify-center pt-4 pb-8 space-y-6">
                   <div className="text-center">
                     <h3 className="font-black text-theme-primary text-2xl mb-1">Fund Credits</h3>
                     <p className="text-xs text-theme-secondary font-medium">
                       Exchange rate: <span className="font-bold text-theme-primary">₦1 = 1 LC</span> • No deposit fees
                     </p>
                   </div>

                   {/* Primary Input in Nigerian Naira (₦) */}
                   <div className="flex flex-col items-center justify-center">
                     <span className="text-xs font-bold text-theme-tertiary uppercase tracking-widest mb-1">Enter Amount in Naira</span>
                     <div className="flex items-center text-theme-primary mb-2">
                       <span className="text-4xl font-black mr-1 text-theme-secondary">₦</span>
                       <input 
                         type="text"
                         inputMode="numeric"
                         value={flowAmount}
                         onChange={e => {
                           const val = e.target.value.replace(/[^0-9]/g, '');
                           setFlowAmount(val);
                           if (fundingError) setFundingError('');
                         }}
                         placeholder="1,000"
                         className="w-auto min-w-[120px] max-w-[260px] text-center bg-transparent text-5xl font-black focus:outline-none placeholder:text-theme-tertiary/30"
                         autoFocus
                       />
                     </div>

                     {/* Instant Credits (LC) Conversion Display */}
                     <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5E43F3]/10 border border-[#5E43F3]/20 text-[#5E43F3] text-sm font-bold">
                       <span>You will receive:</span>
                       <span className="font-black text-base">
                         {flowAmount && !isNaN(parseFloat(flowAmount)) ? parseFloat(flowAmount).toLocaleString() : '0'} LC
                       </span>
                     </div>
                   </div>

                   {/* Quick preset amount chips */}
                   <div className="flex flex-wrap items-center justify-center gap-2 max-w-[320px]">
                     {[500, 1000, 2000, 5000, 10000].map((preset) => (
                       <button
                         key={preset}
                         type="button"
                         onClick={() => {
                           setFlowAmount(preset.toString());
                           if (fundingError) setFundingError('');
                         }}
                         className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                           flowAmount === preset.toString()
                             ? 'bg-[#5E43F3] text-white shadow-sm'
                             : 'bg-theme-surface border border-theme-divider-light text-theme-primary hover:bg-theme-surface-hover'
                         }`}
                       >
                         +₦{preset.toLocaleString()}
                       </button>
                     ))}
                   </div>

                   {/* Validation / Limits message */}
                   <div className="text-center space-y-1">
                     <div className="text-xs font-semibold text-theme-secondary">
                       Current balance: <span className="font-bold text-theme-primary">{internalBalance.toLocaleString()} LC</span>
                     </div>
                     <div className="text-[11px] text-theme-tertiary font-medium">
                       Min: ₦100 • Max: ₦500,000 per transaction
                     </div>
                     {flowAmount && (parseFloat(flowAmount) < 100 || parseFloat(flowAmount) > 500000) && (
                       <div className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40">
                         {parseFloat(flowAmount) < 100 
                           ? 'Minimum funding amount is ₦100 (100 LC).' 
                           : 'Maximum funding amount is ₦500,000 (500,000 LC).'}
                       </div>
                     )}
                   </div>
                </div>

                <div className="shrink-0 pt-4 border-t border-theme-divider-light">
                   <button 
                     onClick={() => {
                       const num = parseFloat(flowAmount);
                       if (isNaN(num) || num < 100 || num > 500000) return;
                       navigateTo('fund_review');
                     }}
                     disabled={!flowAmount || parseFloat(flowAmount) < 100 || parseFloat(flowAmount) > 500000}
                     className="w-full py-4 rounded-xl bg-[#5E43F3] text-white font-bold text-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-[#5E43F3]/20"
                   >
                     Continue
                   </button>
                </div>
             </div>
          )}

          {currentView === 'fund_review' && (
             <div className="p-4 flex flex-col h-full">
                <h3 className="font-black text-theme-primary text-2xl mb-6">Review Funding</h3>
                <div className="flex-1 space-y-4">
                  <div className="bg-theme-surface rounded-2xl p-5 border border-theme-divider-light space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Amount to Pay</div>
                      <div className="font-black text-theme-primary text-xl">₦{parseFloat(flowAmount || '0').toLocaleString()}</div>
                    </div>
                    <div className="border-t border-theme-divider-light"></div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Credits to Receive</div>
                      <div className="font-black text-[#5E43F3] text-xl">{parseFloat(flowAmount || '0').toLocaleString()} LC</div>
                    </div>
                    <div className="border-t border-theme-divider-light"></div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Estimated Fee</div>
                      <div className="font-bold text-emerald-600">₦0.00 (Free)</div>
                    </div>
                    <div className="border-t border-theme-divider-light"></div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Payment Method</div>
                      <div className="font-bold text-theme-primary">Paystack (Card, Bank, USSD, Transfer)</div>
                    </div>
                    <div className="border-t border-theme-divider-light"></div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Payment Reference</div>
                      <div className="font-mono text-xs text-theme-secondary truncate max-w-[180px]">{currentPaystackReference}</div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pt-4 flex gap-3">
                   <button onClick={goBack} disabled={isProcessing} className="flex-1 py-4 rounded-xl bg-theme-surface-hover text-theme-primary font-bold hover:bg-theme-surface-active transition-colors">
                     Cancel
                   </button>
                   <button 
                     onClick={async () => {
                       setIsProcessing(true);
                       setFundingStatusMessage('Initializing payment with backend...');
                       try {
                         const initRes = await performInitializeFunding({
                           amount: parseFloat(flowAmount),
                           reference: currentPaystackReference, userId: currentUser?.id
                         });

                         if (initRes && initRes.reference) {
                           setActivePaymentRef(initRes.reference);
                         }

                         // Open Paystack checkout popup
                         initializePayment({ onSuccess: handlePaystackSuccess, onClose: handlePaystackClose } as any);
                       } catch (e: any) {
                         console.error("Failed to initialize funding:", e);
                         setFundingError(e.message || "Failed to initialize payment.");
                         navigateTo('fund_failed');
                       } finally {
                         setIsProcessing(false);
                       }
                     }}
                     disabled={isProcessing}
                     className="flex-[2] py-4 rounded-xl bg-[#0BA4DB] text-white font-bold hover:bg-[#098bbd] transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                     {isProcessing ? (
                       <>
                         <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                         Initializing...
                       </>
                     ) : (
                       'Pay with Paystack'
                     )}
                   </button>
                </div>
             </div>
          )}

          {/* FUND PENDING VERIFICATION */}
          {currentView === 'fund_pending' && (
             <div className="p-4 flex flex-col h-full text-center pb-12">
               <div className="flex-1 flex flex-col items-center justify-center pt-8">
                 <div className="w-20 h-20 bg-[#5E43F3]/10 rounded-full flex items-center justify-center mb-6">
                   <div className="w-10 h-10 border-4 border-[#5E43F3]/30 border-t-[#5E43F3] rounded-full animate-spin"></div>
                 </div>
                 <h3 className="font-black text-theme-primary text-2xl mb-2">Verifying Payment</h3>
                 <p className="text-theme-secondary font-medium text-sm max-w-[280px] mb-4 mx-auto">
                   {fundingStatusMessage || 'Please hold on while we verify your transaction with Paystack.'}
                 </p>
                 <div className="font-mono text-xs text-theme-tertiary bg-theme-surface px-3 py-1.5 rounded-full border border-theme-divider-light">
                   Ref: {currentPaystackReference}
                 </div>
               </div>
             </div>
          )}

          {/* FUND SUCCESS */}
          {currentView === 'fund_success' && (
             <div className="p-4 flex flex-col h-full text-center pb-12">
               <div className="flex-1 flex flex-col items-center justify-center pt-8">
                 <div className="w-24 h-24 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center mb-6 border border-green-200 dark:border-green-800">
                   <Check className="w-12 h-12 text-emerald-500" />
                 </div>
                 <h3 className="font-black text-theme-primary text-2xl mb-2">Funding Successful!</h3>
                 <div className="font-black text-4xl text-[#5E43F3] mb-4">+{parseFloat(flowAmount || '0').toLocaleString()} LC</div>
                 <p className="text-theme-secondary font-medium text-sm max-w-[280px] mb-4 mx-auto">
                   Your payment of ₦{parseFloat(flowAmount || '0').toLocaleString()} has been verified and added to your balance.
                 </p>
                 <div className="bg-theme-surface p-4 rounded-2xl border border-theme-divider-light w-full max-w-[320px] mb-8 text-left space-y-2">
                   <div className="flex justify-between text-xs">
                     <span className="text-theme-tertiary">New Balance</span>
                     <span className="font-black text-theme-primary">{(internalBalance).toLocaleString()} LC</span>
                   </div>
                   <div className="flex justify-between text-xs">
                     <span className="text-theme-tertiary">Reference</span>
                     <span className="font-mono text-theme-secondary truncate max-w-[160px]">{currentPaystackReference}</span>
                   </div>
                 </div>
                 
                 <div className="w-full">
                   <button onClick={handleClose} className="w-full py-4 rounded-xl bg-[#5E43F3] text-white font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-[#5E43F3]/20">
                     Done
                   </button>
                 </div>
               </div>
             </div>
          )}

          {/* FUND FAILED */}
          {currentView === 'fund_failed' && (
             <div className="p-4 flex flex-col h-full text-center pb-12">
               <div className="flex-1 flex flex-col items-center justify-center pt-8">
                 <div className="w-24 h-24 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mb-6 border border-red-200 dark:border-red-800">
                   <AlertCircle className="w-12 h-12 text-red-500" />
                 </div>
                 <h3 className="font-black text-theme-primary text-2xl mb-2">Payment Incomplete</h3>
                 <p className="text-theme-secondary font-medium text-sm max-w-[300px] mb-6 mx-auto">
                   {fundingError || 'Your payment was not confirmed or was cancelled. Your wallet was not credited.'}
                 </p>

                 <div className="w-full space-y-3">
                   <button 
                     onClick={() => navigateTo('fund_review')} 
                     className="w-full py-4 rounded-xl bg-[#5E43F3] text-white font-bold hover:bg-indigo-600 transition-colors shadow-lg"
                   >
                     Try Again
                   </button>
                   <button 
                     onClick={handleClose} 
                     className="w-full py-4 rounded-xl bg-theme-surface-hover text-theme-primary font-bold hover:bg-theme-surface-active transition-colors"
                   >
                     Close
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
                       
                       {(parseFloat(flowAmount) > 0 && parseFloat(flowAmount) < 500) && (
                         <div className="mt-4 flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 px-4 py-2 rounded-full">
                           <AlertCircle className="w-4 h-4" /> Minimum withdrawal is ₦500.
                         </div>
                       )}
                    </div>
                    <div className="shrink-0 pt-4 border-t border-theme-divider-light space-y-3">
                       <button 
                         onClick={() => navigateTo('withdraw_review')}
                         disabled={!flowAmount || parseFloat(flowAmount) < 500 || parseFloat(flowAmount) > internalBalance}
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
                   <div className="font-bold text-theme-primary">₦500</div>
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
               {web3.status === 'connected' && web3.address ? (
                 <div className="bg-theme-surface p-6 rounded-3xl border border-theme-divider-light text-center shadow-sm">
                   <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-8 h-8" />
                   </div>
                   <h3 className="font-black text-theme-primary text-2xl mb-1">{web3.providerName ?? web3.providerId ?? 'Wallet'}</h3>
                   <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-4 inline-block bg-green-50 px-2 py-1 rounded-full border border-green-100">Connected</div>

                   {/* Network Info */}
                   <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest mb-2 mt-2 text-left">Network</div>
                   <div className={`font-bold text-sm p-3 rounded-xl border mb-4 text-left flex items-center justify-between ${
                     web3.isUnsupportedNetwork
                       ? 'bg-orange-50 border-orange-200 text-orange-600'
                       : 'bg-theme-base border-theme-divider-light text-theme-primary'
                   }`}>
                     <span>{web3.chainName || 'Unknown'}</span>
                     {web3.isUnsupportedNetwork && (
                       <button
                         onClick={() => web3.switchNetwork(DEFAULT_CHAIN_ID)}
                         className="text-xs font-bold text-[#5E43F3] bg-white px-3 py-1 rounded-full border border-[#5E43F3]/30 hover:bg-[#5E43F3]/10 transition-colors"
                       >
                         Switch to Polygon
                       </button>
                     )}
                   </div>

                   {/* Balance */}
                   {web3.balance && !web3.isUnsupportedNetwork && (
                     <>
                       <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest mb-2 text-left">Balance</div>
                       <div className="font-mono font-bold text-theme-primary bg-theme-base p-3 rounded-xl border border-theme-divider-light text-left mb-4">
                         {web3.balance} {SUPPORTED_CHAINS[web3.chainId!]?.currency ?? 'ETH'}
                       </div>
                     </>
                   )}

                   {/* Wallet Address */}
                   <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest mb-2 text-left">Wallet address</div>
                   <div className="font-mono font-bold text-theme-primary bg-theme-base p-3 rounded-xl border border-theme-divider-light flex items-center justify-between mb-6">
                     <span className="truncate mr-2">{web3.shortAddress}</span>
                     <button onClick={handleCopyAddress} className="text-[#5E43F3] hover:text-indigo-600 font-bold text-sm flex items-center gap-1 transition-colors shrink-0">
                       {addressCopied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
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

                   <button
                     onClick={() => navigateTo('crypto_disconnect')}
                     className="w-full mt-4 py-3 rounded-xl border border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                   >
                     <Unplug className="w-4 h-4" /> Disconnect wallet
                   </button>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center">
                   <div className="w-20 h-20 rounded-full bg-theme-surface-hover flex items-center justify-center mb-6">
                     <Wallet className="w-10 h-10 text-theme-tertiary" />
                   </div>
                   <h3 className="font-black text-theme-primary text-xl mb-2">No wallet connected</h3>
                   <p className="text-sm font-semibold text-theme-secondary mb-6 max-w-[260px]">
                     Connect MetaMask or another EVM-compatible wallet to get started.
                   </p>
                   {web3.error && (
                     <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 px-4 py-2 rounded-xl mb-4 border border-red-100">
                       <AlertCircle className="w-4 h-4 shrink-0" /> {web3.error}
                     </div>
                   )}
                   <button
                     type="button"
                     onClick={() => handleCryptoConnect()}
                     disabled={web3.status === 'connecting'}
                     className="py-3.5 px-8 rounded-xl bg-[#5E43F3] text-white font-bold hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                   >
                     {web3.status === 'connecting' ? (
                       <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Connecting…</>
                     ) : (
                       <><Link2 className="w-4 h-4" /> Connect Wallet</>
                     )}
                   </button>
                   {!web3.isMetaMaskInstalled && (
                     <a
                       href="https://metamask.io/download/"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center justify-center gap-1.5 mt-4 text-xs font-bold text-[#5E43F3] hover:underline"
                     >
                       <ExternalLink className="w-3.5 h-3.5" /> Install MetaMask
                     </a>
                   )}
                 </div>
               )}
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
               {web3.status === 'connected' && web3.address ? (
                 <div className="flex-1 flex flex-col items-center justify-center pt-4">
                   <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest mb-2">Your wallet address</div>
                   <div className="font-mono font-bold text-theme-primary text-sm mb-2 bg-theme-surface py-3 px-4 rounded-2xl border border-theme-divider-light w-full break-all">
                     {web3.address}
                   </div>
                   <div className="font-mono font-black text-theme-primary text-xl mb-6">
                     {web3.shortAddress}
                   </div>
                   
                   <button onClick={handleCopyAddress} className="py-4 px-8 w-full rounded-xl bg-theme-surface-hover hover:bg-theme-surface-active font-bold text-theme-primary transition-colors flex items-center justify-center gap-2 mb-8">
                     {addressCopied ? <><Check className="w-5 h-5" /> Copied!</> : <><Copy className="w-5 h-5" /> Copy address</>}
                   </button>
                   
                   <div className="bg-theme-surface p-3 rounded-xl text-xs font-bold text-theme-secondary border border-theme-divider-light mb-4">
                     Network: {web3.chainName}
                   </div>
                   
                   <div className="bg-orange-50 text-orange-600 p-4 rounded-xl text-xs font-bold border border-orange-100 max-w-xs mx-auto">
                     Only send assets on the same network ({web3.chainName}) to this address.
                   </div>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center">
                   <Wallet className="w-12 h-12 text-theme-tertiary mb-4" />
                   <p className="text-theme-secondary font-semibold">Connect a wallet first to receive crypto.</p>
                 </div>
               )}
             </div>
          )}

          {/* CRYPTO DISCONNECT */}
          {currentView === 'crypto_disconnect' && (
             <div className="p-4 flex flex-col h-full text-center pb-12">
               <div className="flex-1 flex flex-col items-center justify-center pt-12">
                 <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
                   <Unplug className="w-12 h-12 text-red-500" />
                 </div>
                 <h3 className="font-black text-theme-primary text-2xl mb-4">Disconnect {web3.providerName ?? web3.providerId ?? 'wallet'}?</h3>
                 <p className="text-theme-secondary font-semibold text-sm max-w-[280px] mb-2 mx-auto">
                   You can reconnect this wallet at any time. No LaLao account data or creator earnings will be deleted.
                 </p>
                 {web3.shortAddress && (
                   <div className="font-mono text-sm text-theme-tertiary mb-8">{web3.shortAddress}</div>
                 )}
                 
                 <div className="w-full space-y-3">
                   <button onClick={handleCryptoDisconnect} className="w-full py-4 rounded-xl bg-red-500 text-white font-bold text-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
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
                <div className="flex-1 space-y-5 pt-3">
                  {/* Balance Indicator */}
                  <div className="flex justify-between items-center bg-theme-surface p-3.5 rounded-2xl border border-theme-divider-light">
                    <div className="text-[11px] font-bold text-theme-secondary uppercase tracking-widest">Available Balance</div>
                    <div className="font-mono font-black text-sm text-theme-primary">{internalBalance.toLocaleString()} LC</div>
                  </div>

                  <div className="space-y-4">
                    {/* 1. Network Selector Grid */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-1">
                        Select Network
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'MTN', label: 'MTN', badge: 'bg-[#FFCC00]/15 text-[#E5B800] border-[#FFCC00]/40' },
                          { id: 'Airtel', label: 'Airtel', badge: 'bg-[#E60000]/15 text-[#E60000] border-[#E60000]/40' },
                          { id: 'Glo', label: 'Glo', badge: 'bg-[#00A859]/15 text-[#00A859] border-[#00A859]/40' },
                          { id: '9mobile', label: '9mobile', badge: 'bg-[#006837]/15 text-[#008542] border-[#006837]/40' },
                        ].map((net) => {
                          const isSelected = marketProvider.toUpperCase() === net.id.toUpperCase();
                          return (
                            <button
                              key={net.id}
                              type="button"
                              id={`network-select-${net.id.toLowerCase()}`}
                              onClick={async () => {
                                setMarketProvider(net.id);
                                setMarketProduct(null);
                                setMarketAmount('');
                                setIsFetchingVariations(true);
                                try {
                                  const vars = await fetchVariations({ type: 'data', network: net.id });
                                  setMarketVariations(vars || []);
                                } catch (e) {
                                  setMarketVariations([]);
                                } finally {
                                  setIsFetchingVariations(false);
                                }
                              }}
                              className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                isSelected
                                  ? `${net.badge} font-black ring-2 ring-[#5E43F3]/30 shadow-xs scale-[1.02]`
                                  : 'bg-theme-surface border-theme-divider-light text-theme-secondary hover:text-theme-primary hover:border-theme-divider'
                              }`}
                            >
                              <span className="text-xs font-black tracking-tight">{net.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Custom Native Data Plan Selector */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">
                          Data Plan
                        </label>
                        {marketVariations.length > 0 && (
                          <span className="text-[11px] font-semibold text-[#5E43F3]">
                            {marketVariations.length} plans available
                          </span>
                        )}
                      </div>

                      <NativeDataPlanSelector
                        plans={marketVariations}
                        selectedPlan={marketProduct}
                        isLoading={isFetchingVariations}
                        disabled={!marketProvider}
                        networkName={marketProvider}
                        onSelectPlan={(plan) => {
                          setMarketProduct(plan);
                          setMarketAmount(plan.price.toString());
                        }}
                      />
                    </div>

                    {/* 3. Recipient Phone Number */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-1">
                        Recipient Phone Number
                      </label>
                      <div className="relative">
                        <input 
                          type="tel" 
                          id="input-market-data-phone"
                          value={marketCustomerIdentifier}
                          onChange={(e) => setMarketCustomerIdentifier(e.target.value)}
                          placeholder="e.g. 08012345678" 
                          maxLength={14}
                          className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-3.5 px-4 font-bold text-sm text-theme-primary placeholder:text-theme-tertiary focus:outline-none focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3] transition-all" 
                        />
                        {marketCustomerIdentifier && (
                          <button
                            type="button"
                            onClick={() => setMarketCustomerIdentifier('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-theme-tertiary hover:text-theme-primary rounded-full cursor-pointer"
                            title="Clear phone number"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 4. Purchase Summary Card */}
                    {marketProduct && (
                      <div id="data-plan-purchase-summary" className="p-3.5 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-theme-tertiary font-medium">Selected Package</span>
                          <span className="font-bold text-theme-primary">
                            {marketProduct.planName || marketProduct.dataAmount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-theme-tertiary font-medium">Network & Validity</span>
                          <span className="font-semibold text-theme-secondary">
                            {marketProvider} · {marketProduct.validity || '30 Days'}
                          </span>
                        </div>
                        <div className="border-t border-theme-divider-light/60 pt-2 flex items-center justify-between text-xs">
                          <span className="font-bold text-theme-primary">Price</span>
                          <span className="font-mono font-black text-sm text-[#5E43F3]">
                            ₦{parseFloat(marketAmount).toLocaleString()}
                          </span>
                        </div>
                        {parseFloat(marketAmount) > internalBalance && (
                          <p className="text-[11px] font-semibold text-amber-500 pt-1">
                            ⚠️ Insufficient wallet balance. Please fund your wallet to continue.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Continue Action */}
                <div className="shrink-0 pt-4">
                   <button 
                     disabled={!marketProvider || !marketCustomerIdentifier || !marketProduct || parseFloat(marketAmount) <= 0 || parseFloat(marketAmount) > internalBalance}
                     onClick={() => { setMarketServiceType('data'); navigateTo('market_review'); }}
                     className="w-full py-4 rounded-xl bg-[#5E43F3] text-white font-bold text-base hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50 cursor-pointer"
                   >
                     {parseFloat(marketAmount) > internalBalance ? 'Insufficient Balance' : 'Continue'}
                   </button>
                </div>
             </div>
          )}

          {/* MARKET BILLS */}
          {currentView === 'market_bills' && (
             <div className="p-4 flex flex-col h-full">
                <div className="flex-1 space-y-4 pt-4">
                  <h3 className="font-black text-theme-primary text-xl mb-4">Pay Bills</h3>
                  
                  <button 
                    onClick={() => {
                      setMarketServiceType('electricity');
                      setMarketProvider('01'); // EKEDC default
                      setMarketCustomerIdentifier('');
                      setMarketAmount('');
                      setVerifiedCustomerName('');
                      setMarketFee(serviceSettings?.electricity?.fee ?? 100);
                      navigateTo('market_electricity');
                    }} 
                    className="flex items-center justify-between p-4 rounded-2xl bg-theme-surface hover:bg-theme-surface-active transition-colors group cursor-pointer w-full text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <span className="font-bold text-yellow-600 text-lg">⚡</span>
                      </div>
                      <div>
                        <span className="font-bold text-theme-primary block">Electricity</span>
                        <span className="text-xs text-theme-tertiary">Buy prepaid tokens or pay postpaid bills</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-theme-tertiary" />
                  </button>
                  
                  <button 
                    onClick={() => {
                      setMarketServiceType('cable');
                      setMarketProvider('dstv');
                      setMarketCustomerIdentifier('');
                      setMarketAmount('');
                      setMarketProduct(null);
                      setVerifiedCustomerName('');
                      setMarketFee(serviceSettings?.cable?.fee ?? 100);
                      setIsFetchingCablePackages(true);
                      fetchCablePackages({ provider: 'dstv' })
                        .then(pkgs => setCablePackagesList(pkgs || []))
                        .finally(() => setIsFetchingCablePackages(false));
                      navigateTo('market_cable');
                    }} 
                    className="flex items-center justify-between p-4 rounded-2xl bg-theme-surface hover:bg-theme-surface-active transition-colors group cursor-pointer w-full text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="font-bold text-blue-600 text-lg">📺</span>
                      </div>
                      <div>
                        <span className="font-bold text-theme-primary block">Cable TV</span>
                        <span className="text-xs text-theme-tertiary">DStv, GOtv, and StarTimes renewals</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-theme-tertiary" />
                  </button>
                </div>
             </div>
          )}

          {/* MARKET ELECTRICITY */}
          {currentView === 'market_electricity' && (
            <div className="p-4 flex flex-col h-full">
              <div className="flex-1 space-y-4 pt-2">
                <div className="flex justify-between items-center bg-theme-surface p-3.5 rounded-2xl border border-theme-divider-light">
                  <div className="text-[11px] font-bold text-theme-secondary uppercase tracking-widest">Available Balance</div>
                  <div className="font-mono font-black text-sm text-theme-primary">{internalBalance.toLocaleString()} LC</div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-1">Select Disco</label>
                    <select
                      value={marketProvider}
                      onChange={(e) => {
                        setMarketProvider(e.target.value);
                        setVerifiedCustomerName('');
                      }}
                      className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-3 px-3 text-xs font-bold text-theme-primary focus:outline-none focus:border-[#5E43F3]"
                    >
                      <option value="01">Eko Electric (EKEDC)</option>
                      <option value="02">Ikeja Electric (IKEDC)</option>
                      <option value="03">Abuja Electric (AEDC)</option>
                      <option value="04">Kano Electric (KEDCO)</option>
                      <option value="05">Port Harcourt Electric (PHED)</option>
                      <option value="06">Jos Electric (JED)</option>
                      <option value="07">Kaduna Electric (KAEDCO)</option>
                      <option value="08">Enugu Electric (EEDC)</option>
                      <option value="09">Benin Electric (BEDC)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-1">Meter Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Prepaid', 'Postpaid'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setMeterType(t as any);
                            setVerifiedCustomerName('');
                          }}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            meterType === t
                              ? 'bg-[#5E43F3] text-white border-[#5E43F3]'
                              : 'bg-theme-surface border-theme-divider-light text-theme-secondary hover:text-theme-primary'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-1">Meter Number</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={marketCustomerIdentifier}
                        onChange={(e) => {
                          setMarketCustomerIdentifier(e.target.value);
                          setVerifiedCustomerName('');
                        }}
                        placeholder="Enter meter number"
                        className="flex-1 bg-theme-surface border border-theme-divider-light rounded-xl py-3 px-3.5 text-xs font-bold text-theme-primary focus:outline-none focus:border-[#5E43F3]"
                      />
                      <button
                        type="button"
                        disabled={!marketCustomerIdentifier || isVerifyingCustomer}
                        onClick={async () => {
                          setIsVerifyingCustomer(true);
                          try {
                            const res = await verifyElectricityMeter({
                              discoCode: marketProvider,
                              meterNumber: marketCustomerIdentifier,
                              meterType,
                            });
                            setVerifiedCustomerName(res.customerName);
                          } catch (err: any) {
                            alert(err.message || 'Could not verify meter number');
                          } finally {
                            setIsVerifyingCustomer(false);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-theme-surface-hover hover:bg-theme-surface-active text-xs font-bold text-theme-primary transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isVerifyingCustomer ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </div>

                  {verifiedCustomerName && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Verified: {verifiedCustomerName}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-1">Amount (₦)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={marketAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*$/.test(val)) setMarketAmount(val);
                      }}
                      placeholder="e.g. 2000"
                      className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-3 px-3.5 text-xs font-bold text-theme-primary focus:outline-none focus:border-[#5E43F3]"
                    />
                    <p className="text-[10px] text-theme-tertiary">Platform fee: ₦{marketFee}</p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 pt-4">
                <button
                  disabled={!marketCustomerIdentifier || !marketAmount || parseFloat(marketAmount) <= 0 || (parseFloat(marketAmount) + marketFee) > internalBalance}
                  onClick={() => navigateTo('market_review')}
                  className="w-full py-4 rounded-xl bg-[#5E43F3] text-white font-bold text-base hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {(parseFloat(marketAmount || '0') + marketFee) > internalBalance ? 'Insufficient Balance' : 'Continue to Confirmation'}
                </button>
              </div>
            </div>
          )}

          {/* MARKET CABLE TV */}
          {currentView === 'market_cable' && (
            <div className="p-4 flex flex-col h-full">
              <div className="flex-1 space-y-4 pt-2">
                <div className="flex justify-between items-center bg-theme-surface p-3.5 rounded-2xl border border-theme-divider-light">
                  <div className="text-[11px] font-bold text-theme-secondary uppercase tracking-widest">Available Balance</div>
                  <div className="font-mono font-black text-sm text-theme-primary">{internalBalance.toLocaleString()} LC</div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-1">Select Provider</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['dstv', 'gotv', 'startimes'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={async () => {
                            setMarketProvider(p);
                            setMarketProduct(null);
                            setMarketAmount('');
                            setVerifiedCustomerName('');
                            setIsFetchingCablePackages(true);
                            try {
                              const pkgs = await fetchCablePackages({ provider: p });
                              setCablePackagesList(pkgs || []);
                            } finally {
                              setIsFetchingCablePackages(false);
                            }
                          }}
                          className={`py-2.5 rounded-xl text-xs font-bold border uppercase transition-all cursor-pointer ${
                            marketProvider.toLowerCase() === p
                              ? 'bg-[#5E43F3] text-white border-[#5E43F3]'
                              : 'bg-theme-surface border-theme-divider-light text-theme-secondary hover:text-theme-primary'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-1">Choose Package</label>
                    {isFetchingCablePackages ? (
                      <p className="text-xs text-theme-tertiary">Loading live packages...</p>
                    ) : (
                      <select
                        value={marketProduct?.packageId || ''}
                        onChange={(e) => {
                          const chosen = cablePackagesList.find(pkg => pkg.packageId === e.target.value);
                          if (chosen) {
                            setMarketProduct({ planName: chosen.packageName, variationId: chosen.packageId });
                            setMarketAmount(chosen.price.toString());
                          }
                        }}
                        className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-3 px-3 text-xs font-bold text-theme-primary focus:outline-none focus:border-[#5E43F3]"
                      >
                        <option value="">Select a package</option>
                        {cablePackagesList.map((pkg) => (
                          <option key={pkg.packageId} value={pkg.packageId}>
                            {pkg.packageName} — ₦{pkg.price.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest px-1">Smartcard / IUC Number</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={marketCustomerIdentifier}
                        onChange={(e) => {
                          setMarketCustomerIdentifier(e.target.value);
                          setVerifiedCustomerName('');
                        }}
                        placeholder="Enter IUC / Smartcard number"
                        className="flex-1 bg-theme-surface border border-theme-divider-light rounded-xl py-3 px-3.5 text-xs font-bold text-theme-primary focus:outline-none focus:border-[#5E43F3]"
                      />
                      <button
                        type="button"
                        disabled={!marketCustomerIdentifier || isVerifyingCustomer}
                        onClick={async () => {
                          setIsVerifyingCustomer(true);
                          try {
                            const res = await verifyCableSmartcard({
                              cableProvider: marketProvider,
                              smartcardNumber: marketCustomerIdentifier,
                            });
                            setVerifiedCustomerName(res.customerName);
                          } catch (err: any) {
                            alert(err.message || 'Could not verify smartcard number');
                          } finally {
                            setIsVerifyingCustomer(false);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-theme-surface-hover hover:bg-theme-surface-active text-xs font-bold text-theme-primary transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isVerifyingCustomer ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </div>

                  {verifiedCustomerName && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Subscriber: {verifiedCustomerName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 pt-4">
                <button
                  disabled={!marketCustomerIdentifier || !marketAmount || parseFloat(marketAmount) <= 0 || (parseFloat(marketAmount) + marketFee) > internalBalance}
                  onClick={() => navigateTo('market_review')}
                  className="w-full py-4 rounded-xl bg-[#5E43F3] text-white font-bold text-base hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {(parseFloat(marketAmount || '0') + marketFee) > internalBalance ? 'Insufficient Balance' : 'Continue to Confirmation'}
                </button>
              </div>
            </div>
          )}

          {/* MARKET REVIEW */}
          {currentView === 'market_review' && (
             <div className="p-4 flex flex-col h-full">
                <h3 className="font-black text-theme-primary text-2xl mb-6">Confirm {marketServiceType === 'airtime' ? 'Airtime' : marketServiceType === 'data' ? 'Data' : marketServiceType === 'electricity' ? 'Electricity' : 'Cable TV'}</h3>
                
                <div className="flex-1 space-y-4">
                  <div className="bg-theme-surface rounded-2xl p-5 border border-theme-divider-light space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Provider / Biller</div>
                      <div className="font-bold text-theme-primary uppercase">{marketProvider}</div>
                    </div>
                    <div className="border-t border-theme-divider-light"></div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Recipient / Identifier</div>
                      <div className="font-bold text-theme-primary">{marketCustomerIdentifier}</div>
                    </div>
                    {verifiedCustomerName && (
                      <>
                        <div className="border-t border-theme-divider-light"></div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Account Name</div>
                          <div className="font-bold text-emerald-600">{verifiedCustomerName}</div>
                        </div>
                      </>
                    )}
                    {marketProduct && marketProduct.planName && (
                      <>
                        <div className="border-t border-theme-divider-light"></div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Package</div>
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
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Platform Fee</div>
                      <div className="font-bold text-theme-primary">₦{marketFee.toLocaleString()}</div>
                    </div>
                    <div className="border-t border-theme-divider-light"></div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">Total Payable</div>
                      <div className="font-black text-base text-[#5E43F3]">₦{(parseFloat(marketAmount) + marketFee).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center bg-theme-surface-hover p-4 rounded-xl border border-theme-divider-light">
                    <div className="text-xs font-bold text-theme-secondary uppercase tracking-widest">Balance after purchase</div>
                    <div className="font-black text-theme-primary">₦{(internalBalance - (parseFloat(marketAmount) + marketFee)).toLocaleString()}</div>
                  </div>
                </div>

                <div className="shrink-0 pt-6 flex gap-3">
                   <button onClick={goBack} className="flex-1 py-4 rounded-xl bg-theme-surface-hover text-theme-primary font-bold hover:bg-theme-surface-active transition-colors cursor-pointer">Cancel</button>
                   <button onClick={() => navigateTo('market_pin')} className="flex-[2] py-4 rounded-xl bg-[#5E43F3] text-white font-bold hover:bg-indigo-600 transition-colors shadow-lg cursor-pointer">Confirm purchase</button>
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
                     <button key={i} onClick={() => setPin(p => p.slice(0, -1))} className="h-14 flex items-center justify-center text-theme-primary font-bold hover:bg-theme-surface-hover rounded-full transition-colors cursor-pointer">
                       <ArrowLeft className="w-6 h-6" />
                     </button>
                   ) : (
                     <button key={i} onClick={() => setPin(p => (p.length < 4 ? p + num : p))} className="h-14 flex items-center justify-center text-2xl font-bold text-theme-primary hover:bg-theme-surface-hover rounded-full transition-colors cursor-pointer">
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
                       pin: pin,
                       meterType: marketServiceType === 'electricity' ? meterType : undefined,
                     });
                     
                     if (res.success) {
                       if (res.token) setReturnedToken(res.token);
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
                 className="w-full py-4 rounded-xl bg-[#5E43F3] text-white font-bold text-lg hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-50 cursor-pointer"
               >
                 {isProcessing ? 'Processing...' : 'Pay'}
               </button>
             </div>
          )}

          {/* MARKET SUCCESS */}
          {currentView === 'market_success' && (
             <div className="p-4 flex flex-col h-full text-center pb-12">
               <div className="flex-1 flex flex-col items-center justify-center pt-8">
                 <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-5 border border-emerald-500/20">
                   <Check className="w-10 h-10 text-emerald-600" />
                 </div>
                 <h3 className="font-black text-theme-primary text-2xl mb-2">Transaction Successful</h3>
                 <div className="font-black text-2xl text-[#5E43F3] mb-1">
                   ₦{(parseFloat(marketAmount) + marketFee).toLocaleString()}
                 </div>
                 <p className="text-xs text-theme-tertiary uppercase font-bold tracking-wider mb-2">
                   {marketProvider} {marketServiceType.toUpperCase()}
                 </p>
                 <p className="text-theme-secondary font-medium text-xs max-w-[280px] mb-6 mx-auto">
                   Delivered to {marketCustomerIdentifier}
                 </p>

                 {/* Token Display for Electricity */}
                 {returnedToken && (
                   <div className="w-full max-w-sm p-4 rounded-2xl bg-theme-surface border-2 border-emerald-500/30 text-center space-y-1 mb-6">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">Electricity Token</span>
                     <p className="text-base sm:text-lg font-mono font-black text-emerald-600 tracking-wider select-all">
                       {returnedToken}
                     </p>
                     <p className="text-[10px] text-theme-tertiary">Enter this token on your physical meter keypad</p>
                   </div>
                 )}
                 
                 <div className="w-full max-w-sm">
                   <button onClick={handleClose} className="w-full py-3.5 rounded-xl bg-[#5E43F3] text-white font-bold text-sm hover:bg-[#4E34E0] transition-colors cursor-pointer">
                     Done
                   </button>
                 </div>
               </div>
             </div>
          )}

        </div>
        </div>
      </div>
      
      {/* DEVELOPMENT / TESTING CONTROLS — Only visible when explicitly enabled in local dev test mode */}
      {isTestModeEnabled && (
        <div className="fixed bottom-4 left-4 bg-black/90 p-4 rounded-xl border border-theme-divider-light z-[100] max-w-[320px] text-white space-y-3 shadow-2xl">
          <div className="text-[10px] font-bold uppercase tracking-widest text-theme-tertiary">Admin Dev Controls (Test Mode)</div>
          
          <div className="space-y-1">
            <div className="text-xs font-semibold text-theme-secondary mb-1">Withdrawal Accounts</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setWithdrawalAccounts([])} className="text-[10px] px-2 py-1 bg-theme-surface rounded font-bold border border-theme-divider-light hover:bg-theme-surface-hover">A. No accounts</button>
              <button onClick={() => setWithdrawalAccounts([{id: 'dev1', accountName: 'John', bankName: 'First Bank', accountNumber: '11112222', status: 'pending', isDefault: true}])} className="text-[10px] px-2 py-1 bg-theme-surface rounded font-bold border border-theme-divider-light hover:bg-theme-surface-hover">B. 1 Pending</button>
              <button onClick={() => setWithdrawalAccounts([{id: 'dev1', accountName: 'John', bankName: 'First Bank', accountNumber: '11112222', status: 'verified', isDefault: true}])} className="text-[10px] px-2 py-1 bg-theme-surface rounded font-bold border border-theme-divider-light hover:bg-theme-surface-hover">C. 1 Verified</button>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs font-semibold text-theme-secondary mb-1">Mock Balance</div>
            <div className="flex gap-2">
              <button onClick={() => setDevBalance(3000)} className="text-[10px] px-2 py-1 bg-theme-surface rounded font-bold border border-theme-divider-light hover:bg-theme-surface-hover">3,000</button>
              <button onClick={() => setDevBalance(10000)} className="text-[10px] px-2 py-1 bg-theme-surface rounded font-bold border border-theme-divider-light hover:bg-theme-surface-hover">10,000</button>
              <button onClick={() => setDevBalance(null)} className="text-[10px] px-2 py-1 bg-theme-surface rounded font-bold border border-theme-divider-light hover:bg-theme-surface-hover text-red-400">Reset</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
