import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Copy, History, Plus, RefreshCw, Send, Check } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useKlyroWallet } from '../../services/wallet/KlyroWalletContext';
import { WalletTransaction } from '../../services/wallet/types';

export const WalletModal: React.FC = () => {
  const { isWalletModalOpen, setIsWalletModalOpen, triggerShareToast } = useLalao();
  const {
    isConnected,
    address,
    balance,
    transactions,
    connectWallet,
    disconnectWallet,
    sendFunds,
    resetMockData,
  } = useKlyroWallet();

  const [activeTab, setActiveTab] = useState<'activity' | 'send' | 'receive'>('activity');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Send form states
  const [sendAmount, setSendAmount] = useState('');
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendDesc, setSendDesc] = useState('');
  const [isSending, setIsSending] = useState(false);

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

  const handleBack = () => {
    if (window.history.state?.modal === 'wallet') {
      window.history.back();
    } else {
      setIsWalletModalOpen(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    await connectWallet();
    setIsConnecting(false);
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard?.writeText(address);
      setCopiedAddress(true);
      triggerShareToast('Wallet address copied');
      setTimeout(() => setCopiedAddress(false), 2500);
    }
  };

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendAmount || !sendRecipient) return;
    setIsSending(true);
    try {
      await sendFunds(Number(sendAmount), sendRecipient, sendDesc);
      triggerShareToast('Sent successfully');
      setSendAmount('');
      setSendRecipient('');
      setSendDesc('');
      setActiveTab('activity');
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to send');
    } finally {
      setIsSending(false);
    }
  };

  if (!isWalletModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-theme-base sm:rounded-[32px] rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] min-h-[70vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-theme-surface shrink-0 sticky top-0 z-10 border-b border-theme-divider-light">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-theme-surface-hover hover:bg-theme-surface-active transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-theme-primary" />
            </button>
            <h2 className="text-xl font-black text-theme-primary tracking-tight">Wallet</h2>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2">
              <button
                onClick={resetMockData}
                className="flex items-center justify-center w-10 h-10 bg-theme-surface-hover rounded-full hover:bg-theme-surface-active"
                title="Reset Mock Data"
              >
                <RefreshCw className="w-4 h-4 text-theme-secondary" />
              </button>
              <button
                onClick={disconnectWallet}
                className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                <ArrowUpRight className="w-10 h-10 text-[#5E43F3]" />
              </div>
              <h3 className="text-2xl font-black text-theme-primary mb-2">Klyro Wallet</h3>
              <p className="text-theme-tertiary text-sm mb-8 max-w-[260px] mx-auto">
                Connect your wallet to send, receive, and tip inside Lalao.
              </p>
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full py-4 rounded-full bg-[#5E43F3] text-white font-bold text-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
              <p className="text-[10px] text-theme-tertiary mt-6 max-w-[260px] mx-auto">
                NOTE: Klyro Wallet integration will replace MockWalletProvider when the Klyro API is available.
              </p>
            </div>
          ) : (
            <div>
              {/* Balance Card */}
              <div className="p-6 bg-theme-surface border-b border-theme-divider-light">
                <div className="flex flex-col items-center justify-center py-6">
                  <span className="text-sm font-bold text-theme-tertiary uppercase tracking-widest mb-2">Total Balance</span>
                  <div className="text-5xl font-black text-theme-primary tracking-tighter">
                    {balance.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xl text-[#5E43F3] ml-1">{balance.currency}</span>
                  </div>
                  
                  <button 
                    onClick={handleCopyAddress}
                    className="mt-6 flex items-center gap-2 px-4 py-2 bg-theme-surface-hover hover:bg-theme-surface-active rounded-full transition-colors text-sm font-semibold text-theme-secondary"
                  >
                    <span>{address.substring(0,6)}...{address.substring(address.length - 4)}</span>
                    {copiedAddress ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => setActiveTab('send')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-colors ${
                      activeTab === 'send' ? 'bg-[#5E43F3] text-white' : 'bg-theme-surface-hover text-theme-primary hover:bg-theme-surface-active'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                    Send
                  </button>
                  <button
                    onClick={() => setActiveTab('receive')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-colors ${
                      activeTab === 'receive' ? 'bg-[#5E43F3] text-white' : 'bg-theme-surface-hover text-theme-primary hover:bg-theme-surface-active'
                    }`}
                  >
                    <ArrowDownLeft className="w-5 h-5" />
                    Receive
                  </button>
                </div>
              </div>

              {/* Tabs Content */}
              <div className="p-4">
                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    <h3 className="font-black text-theme-primary px-2 flex items-center gap-2">
                      <History className="w-4 h-4 text-theme-tertiary" />
                      Recent Activity
                    </h3>
                    {transactions.length === 0 ? (
                      <div className="text-center py-12 text-theme-tertiary font-medium text-sm">
                        No transactions yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transactions.map((tx: WalletTransaction) => (
                          <div key={tx.id} className="bg-theme-surface p-4 rounded-2xl flex items-center justify-between border border-theme-divider-light shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                tx.type === 'receive' ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-[#5E43F3]'
                              }`}>
                                {tx.type === 'receive' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                              </div>
                              <div>
                                <h4 className="font-bold text-theme-primary capitalize">{tx.type}</h4>
                                <p className="text-xs text-theme-tertiary">
                                  {new Date(tx.timestamp).toLocaleDateString()} • {tx.status}
                                </p>
                              </div>
                            </div>
                            <div className={`font-black tracking-tight ${tx.type === 'receive' ? 'text-green-600' : 'text-theme-primary'}`}>
                              {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.currency}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'send' && (
                  <div className="bg-theme-surface p-5 rounded-3xl shadow-sm border border-theme-divider-light animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="font-black text-theme-primary mb-4">Send Funds</h3>
                    <form onSubmit={handleSendSubmit} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest mb-2 block">Recipient ID / Address</label>
                        <input
                          type="text"
                          value={sendRecipient}
                          onChange={(e) => setSendRecipient(e.target.value)}
                          placeholder="User ID or Wallet Address"
                          className="w-full bg-theme-surface-hover rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/20"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest mb-2 block">Amount (KLY)</label>
                        <input
                          type="number"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                          placeholder="0.00"
                          min="0.1"
                          step="any"
                          className="w-full bg-theme-surface-hover rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/20"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-theme-tertiary uppercase tracking-widest mb-2 block">Note (Optional)</label>
                        <input
                          type="text"
                          value={sendDesc}
                          onChange={(e) => setSendDesc(e.target.value)}
                          placeholder="What's this for?"
                          className="w-full bg-theme-surface-hover rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/20"
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isSending || !sendAmount || !sendRecipient}
                        className="w-full mt-2 bg-[#5E43F3] text-white font-bold py-4 rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50"
                      >
                        {isSending ? 'Sending...' : 'Send Now'}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'receive' && (
                  <div className="bg-theme-surface p-8 rounded-3xl shadow-sm border border-theme-divider-light text-center animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="font-black text-theme-primary mb-2">Receive Funds</h3>
                    <p className="text-sm text-theme-tertiary mb-8">Share your wallet address to receive KLY tokens.</p>
                    
                    <div className="w-48 h-48 bg-theme-surface-hover mx-auto rounded-2xl flex items-center justify-center mb-8 border border-theme-divider border-dashed">
                      <span className="text-theme-tertiary font-bold">QR Code Area</span>
                    </div>

                    <div className="bg-theme-base rounded-xl p-4 flex items-center justify-between border border-theme-divider-light">
                      <span className="text-sm font-bold text-theme-secondary truncate mr-4">{address}</span>
                      <button 
                        onClick={handleCopyAddress}
                        className="p-2 bg-theme-surface rounded-lg shadow-sm border border-theme-divider text-theme-primary hover:bg-theme-base"
                      >
                        {copiedAddress ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
