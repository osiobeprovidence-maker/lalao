import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { invokeSupabaseFunction, isSupabaseDataBackendEnabled } from '../lib/supabase';

export const WALLET_DATA_UPDATED_EVENT = 'lalao:wallet-data-updated';

export function notifyWalletDataUpdated(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(WALLET_DATA_UPDATED_EVENT));
}

/** Wallet balance and ledger read path for the configured Supabase data backend. */
export function useWalletBackendData() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const enabled = isSupabaseDataBackendEnabled();
  const [wallet, setWallet] = useState<any | null | undefined>(undefined);
  const [transactions, setTransactions] = useState<any[] | null | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (authLoading) {
      setWallet(undefined);
      setTransactions(undefined);
      return;
    }
    if (!isAuthenticated) {
      setWallet(null);
      setTransactions(null);
      return;
    }
    let active = true;
    setWallet(undefined);
    setTransactions(undefined);
    Promise.all([
      invokeSupabaseFunction<any | null>('app-wallet', { operation: 'getWallet' }),
      invokeSupabaseFunction<any[]>('app-wallet', { operation: 'getTransactions' }),
    ]).then(([nextWallet, nextTransactions]) => {
      if (active) {
        setWallet(nextWallet);
        setTransactions(Array.isArray(nextTransactions) ? nextTransactions : []);
      }
    }).catch(() => {
      if (active) {
        setWallet(null);
        setTransactions(null);
      }
    });
    return () => { active = false; };
  }, [enabled, isAuthenticated, authLoading, attempt]);

  useEffect(() => {
    const refresh = () => setAttempt((value) => value + 1);
    window.addEventListener(WALLET_DATA_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(WALLET_DATA_UPDATED_EVENT, refresh);
  }, []);

  return { wallet, transactions };
}

/** Typed Supabase-backed wallet operation caller.
 *
 * Routes through `app-wallet` when Supabase is configured and selected.
 * Every call resolves the
 * authenticated user inside the Edge Function (never client-supplied IDs).
 */
export function useWalletBackend() {
  const enabled = isSupabaseDataBackendEnabled();

  const invoke = useCallback(async (
    operation: string,
    payload: Record<string, unknown> = {},
  ): Promise<any> => {
    if (!enabled) throw new Error('Supabase wallet backend is not enabled.');
    return invokeSupabaseFunction<any>('app-wallet', { operation, payload });
  }, [enabled]);

  const getWallet = useCallback(async (): Promise<any | null> => invoke('getWallet'), [invoke]);
  const getTransactions = useCallback(async (): Promise<any[]> => invoke('getTransactions'), [invoke]);

  /** Create a 4-digit wallet transaction PIN (when none exists yet). */
  const createWalletPin = useCallback(async (pin: string): Promise<any> => invoke('createWalletPin', { pin }), [invoke]);

  /** Change the wallet PIN after verifying the current PIN. */
  const changeWalletPin = useCallback(async (args: { oldPin: string; newPin: string }): Promise<any> =>
    invoke('changeWalletPin', { oldPin: args.oldPin, newPin: args.newPin }), [invoke]);

  /** Verify a 4-digit wallet PIN (returns { verified: true } or throws). */
  const verifyWalletPin = useCallback(async (pin: string): Promise<any> => invoke('verifyWalletPin', { pin }), [invoke]);

  /** Request a 6-digit PIN-reset OTP by email (stored hashed server-side). */
  const requestPinResetOtp = useCallback(async (): Promise<any> => invoke('requestPinResetOtp', {}), [invoke]);

  /** Reset the wallet PIN using a single-use, expired-checked OTP. */
  const resetPinWithOtp = useCallback(async (args: { otp: string; newPin: string }): Promise<any> =>
    invoke('resetPinWithOtp', { otp: args.otp, newPin: args.newPin }), [invoke]);

  /** Transfer LaLao Credits to a business page (PIN verified server-side). */
  const transferCredits = useCallback(async (args: { amount: number; recipientPageId: string; pin: string }): Promise<any> =>
    invoke('transferCredits', { amount: args.amount, recipientPageId: args.recipientPageId, pin: args.pin }), [invoke]);

  /** Wallet-funded market purchase (PIN verified server-side). */
  const marketPurchase = useCallback(async (args: {
    serviceCategory: string; provider: string; customerIdentifier: string;
    product?: string; variationId?: string; amount: number; fee?: number;
    pin: string; network?: string; meterType?: string;
  }): Promise<any> => invoke('marketPurchase', {
    serviceCategory: args.serviceCategory, provider: args.provider,
    customerIdentifier: args.customerIdentifier, product: args.product,
    variationId: args.variationId, amount: args.amount, fee: args.fee ?? 0,
    pin: args.pin, network: args.network, meterType: args.meterType,
  }), [invoke]);

  /** Initialize Batch wallet funding (existing Bachs flow). */
  const initializeFunding = useCallback(async (args: { amount: number; reference: string; userId?: string }): Promise<any> =>
    invoke('initializeFunding', { amount: args.amount, reference: args.reference, userId: args.userId }), [invoke]);

  /** Verify a settled Batch wallet funding payment. */
  const verifyFunding = useCallback(async (args: { reference: string; sessionId?: string }): Promise<any> => {
    const result = await invoke('verifyFunding', { reference: args.reference, sessionId: args.sessionId });
    if (result?.success) notifyWalletDataUpdated();
    return result;
  }, [invoke]);

  return {
    enabled,
    getWallet,
    getTransactions,
    createWalletPin,
    changeWalletPin,
    verifyWalletPin,
    requestPinResetOtp,
    resetPinWithOtp,
    transferCredits,
    marketPurchase,
    initializeFunding,
    verifyFunding,
  };
}
