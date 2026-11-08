import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  discoverWalletProviders,
  type DiscoveredWalletProvider,
  type EIP6963ProviderDetail,
  type WalletProviderLike,
  type WalletProviderWindow,
} from '../lib/walletProviderDiscovery';

// ── Supported Networks ──────────────────────────────────────────────────────
export const SUPPORTED_CHAINS: Record<number, { name: string; currency: string; explorer: string }> = {
  137: { name: 'Polygon', currency: 'MATIC', explorer: 'https://polygonscan.com' },
  1: { name: 'Ethereum', currency: 'ETH', explorer: 'https://etherscan.io' },
  56: { name: 'BNB Chain', currency: 'BNB', explorer: 'https://bscscan.com' },
  42161: { name: 'Arbitrum One', currency: 'ETH', explorer: 'https://arbiscan.io' },
  10: { name: 'Optimism', currency: 'ETH', explorer: 'https://optimistic.etherscan.io' },
  8453: { name: 'Base', currency: 'ETH', explorer: 'https://basescan.org' },
};

// The primary recommended chain for LaLao
export const DEFAULT_CHAIN_ID = 137; // Polygon

export const STORAGE_LAST_CONNECTED_KEY = 'lalao_connected_provider_id';

export type WalletProvider = 'metamask' | 'injected' | 'other';
export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface Web3WalletState {
  status: WalletStatus;
  address: string | null;
  chainId: number | null;
  chainName: string | null;
  provider: WalletProvider | null;
  providerId: string | null;
  providerName: string | null;
  balance: string | null; // ETH balance in human-readable form
  error: string | null;
  isUnsupportedNetwork: boolean;
}

export interface UseWeb3WalletReturn extends Web3WalletState {
  connect: (provider?: DiscoveredWalletProvider | string) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  isMetaMaskInstalled: boolean;
  availableProviders: DiscoveredWalletProvider[];
  shortAddress: string | null;
  supportedChains: typeof SUPPORTED_CHAINS;
}

/**
 * Truncate an Ethereum address to 0xABCD…1234 form.
 */
function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Get the current provider registry window.
 */
function getWalletProviderWindow(): WalletProviderWindow | null {
  if (typeof window === 'undefined') return null;
  return window as unknown as WalletProviderWindow;
}

/**
 * useWeb3Wallet – production-ready hook for multiple EVM wallet providers.
 *
 * Features:
 * - Full EIP-6963 provider announcement and discovery
 * - Legacy window.ethereum and multi-provider (window.ethereum.providers) fallback
 * - Explicit provider selection
 * - Account-change, chain-change, and disconnect event synchronization
 * - Persistent auto-reconnection on refresh via eth_accounts
 * - Unsupported network warnings and dynamic network switching
 * - Non-crashing graceful error handling
 */
export function useWeb3Wallet(): UseWeb3WalletReturn {
  const [state, setState] = useState<Web3WalletState>({
    status: 'disconnected',
    address: null,
    chainId: null,
    chainName: null,
    provider: null,
    providerId: null,
    providerName: null,
    balance: null,
    error: null,
    isUnsupportedNetwork: false,
  });
  const [availableProviders, setAvailableProviders] = useState<DiscoveredWalletProvider[]>([]);
  const eip6963ProvidersRef = useRef<Map<string, EIP6963ProviderDetail>>(new Map());
  const activeProviderRef = useRef<WalletProviderLike | null>(null);
  const mountedRef = useRef(true);
  const autoConnectAttemptedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refreshProviders = useCallback(() => {
    const eventProviders = Array.from(eip6963ProvidersRef.current.values());
    const providers = discoverWalletProviders(getWalletProviderWindow() ?? undefined, eventProviders);
    if (mountedRef.current) {
      setAvailableProviders(providers);
    }
    return providers;
  }, []);

  // Listen for EIP-6963 standard announcements and request providers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleEIP6963Announce = (event: Event) => {
      const customEvent = event as CustomEvent<EIP6963ProviderDetail>;
      if (customEvent.detail && customEvent.detail.info && customEvent.detail.provider) {
        const key = customEvent.detail.info.rdns || customEvent.detail.info.uuid;
        eip6963ProvidersRef.current.set(key, customEvent.detail);
        refreshProviders();
      }
    };

    // Standard EIP-6963 event is "eip6963:announceProvider"
    window.addEventListener('eip6963:announceProvider', handleEIP6963Announce);
    // Legacy / backward-compatible event alias
    window.addEventListener('eip6963:announce', handleEIP6963Announce);

    // Prompt existing extensions to announce themselves
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // Initial discovery
    refreshProviders();

    return () => {
      window.removeEventListener('eip6963:announceProvider', handleEIP6963Announce);
      window.removeEventListener('eip6963:announce', handleEIP6963Announce);
    };
  }, [refreshProviders]);

  const isMetaMaskInstalled = useMemo(
    () => availableProviders.some((entry) => entry.isMetaMask),
    [availableProviders],
  );

  // ── Helper: update chain info ──────────────────────────────────────
  const updateChainInfo = useCallback((chainIdHex: string) => {
    const chainId = parseInt(chainIdHex, 16);
    const chainInfo = SUPPORTED_CHAINS[chainId];
    if (mountedRef.current) {
      setState(prev => ({
        ...prev,
        chainId,
        chainName: chainInfo?.name ?? `Unknown (${chainId})`,
        isUnsupportedNetwork: !chainInfo,
      }));
    }
  }, []);

  // ── Helper: fetch balance ──────────────────────────────────────────
  const fetchBalance = useCallback(async (address: string) => {
    try {
      const eth = activeProviderRef.current;
      if (!eth) return;
      const balanceHex = await eth.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }) as string;
      // Convert from wei to ether (18 decimals)
      const balanceWei = BigInt(balanceHex);
      const ether = Number(balanceWei) / 1e18;
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          balance: ether.toFixed(6),
        }));
      }
    } catch (e) {
      // Non-critical, ignore
    }
  }, []);

  // ── Connect ────────────────────────────────────────────────────────
  const connect = useCallback(async (providerSelection?: DiscoveredWalletProvider | string, isSilent = false) => {
    // Refresh the list to catch any recently injected providers
    const currentList = availableProviders.length > 0
      ? availableProviders
      : discoverWalletProviders(getWalletProviderWindow() ?? undefined, Array.from(eip6963ProvidersRef.current.values()));

    const selected = typeof providerSelection === "string"
      ? currentList.find((entry) => entry.id === providerSelection || entry.name.toLowerCase().replace(/\s+/g, "-") === providerSelection)
      : providerSelection;
    const discovered = selected ?? currentList.find((entry) => entry.isMetaMask) ?? currentList[0];
    const eth = discovered?.provider;

    if (!eth) {
      if (!isSilent) {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: 'No supported wallet was detected. Install a compatible wallet to continue.',
        }));
      }
      return;
    }

    activeProviderRef.current = eth;
    if (!isSilent) {
      setState(prev => ({
        ...prev,
        status: 'connecting',
        error: null,
        providerId: discovered.id,
        providerName: discovered.name,
      }));
    }

    try {
      // Use eth_accounts for silent auto-reconnect to avoid popping up an approval dialog unnecessarily
      const accounts = await eth.request<string[]>({
        method: isSilent ? 'eth_accounts' : 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        if (!isSilent) {
          setState(prev => ({
            ...prev,
            status: 'error',
            error: 'No accounts found. Please unlock your wallet.',
          }));
        }
        return;
      }

      const address = accounts[0];

      // Get chain ID
      const chainIdHex = await eth.request<string>({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);
      const chainInfo = SUPPORTED_CHAINS[chainId];

      // Persist chosen provider id for refresh restoration
      try {
        localStorage.setItem(STORAGE_LAST_CONNECTED_KEY, discovered.id);
      } catch {
        // Ignore localStorage errors
      }

      if (mountedRef.current) {
        setState({
          status: 'connected',
          address,
          chainId,
          chainName: chainInfo?.name ?? `Unknown (${chainId})`,
          provider: discovered.isMetaMask ? 'metamask' : 'other',
          providerId: discovered.id,
          providerName: discovered.name,
          balance: null,
          error: null,
          isUnsupportedNetwork: !chainInfo,
        });
      }

      // Fetch balance in background
      fetchBalance(address);

    } catch (err: any) {
      if (isSilent) return;

      if (mountedRef.current) {
        // EIP-1193 error codes
        if (err.code === 4001) {
          // User rejected
          setState(prev => ({
            ...prev,
            status: 'disconnected',
            error: null, // Don't show error for user-initiated rejection
          }));
        } else if (err.code === -32002) {
          // Already pending
          setState(prev => ({
            ...prev,
            status: 'error',
            error: 'A connection request is already pending. Please check your wallet and try again.',
          }));
        } else {
          setState(prev => ({
            ...prev,
            status: 'error',
            error: err.message || 'Failed to connect wallet. Please try again.',
          }));
        }
      }
    }
  }, [availableProviders, fetchBalance]);

  // ── Auto-Reconnect on refresh ──────────────────────────────────────
  useEffect(() => {
    if (autoConnectAttemptedRef.current || typeof window === 'undefined') return;

    let savedProviderId: string | null = null;
    try {
      savedProviderId = localStorage.getItem(STORAGE_LAST_CONNECTED_KEY);
    } catch {
      // Ignore
    }

    if (!savedProviderId) return;

    autoConnectAttemptedRef.current = true;

    // Small delay to allow extensions and EIP-6963 announcements to settle
    const timer = setTimeout(() => {
      if (mountedRef.current && state.status === 'disconnected') {
        void connect(savedProviderId ?? undefined, true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [connect, state.status]);

  // ── Disconnect ─────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    activeProviderRef.current = null;
    try {
      localStorage.removeItem(STORAGE_LAST_CONNECTED_KEY);
    } catch {
      // Ignore
    }
    setState({
      status: 'disconnected',
      address: null,
      chainId: null,
      chainName: null,
      provider: null,
      providerId: null,
      providerName: null,
      balance: null,
      error: null,
      isUnsupportedNetwork: false,
    });
  }, []);

  // ── Switch Network ─────────────────────────────────────────────────
  const switchNetwork = useCallback(async (targetChainId: number) => {
    const eth = activeProviderRef.current;
    if (!eth) return;

    const chainIdHex = `0x${targetChainId.toString(16)}`;

    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (err: any) {
      // Chain not added to wallet
      if (err.code === 4902) {
        const chainInfo = SUPPORTED_CHAINS[targetChainId];
        if (!chainInfo) return;

        // Auto-add known chains
        const chainParams: Record<number, any> = {
          137: {
            chainId: chainIdHex,
            chainName: 'Polygon Mainnet',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            rpcUrls: ['https://polygon-rpc.com'],
            blockExplorerUrls: ['https://polygonscan.com'],
          },
          56: {
            chainId: chainIdHex,
            chainName: 'BNB Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed.binance.org'],
            blockExplorerUrls: ['https://bscscan.com'],
          },
          42161: {
            chainId: chainIdHex,
            chainName: 'Arbitrum One',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://arb1.arbitrum.io/rpc'],
            blockExplorerUrls: ['https://arbiscan.io'],
          },
          8453: {
            chainId: chainIdHex,
            chainName: 'Base',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org'],
          },
        };

        if (chainParams[targetChainId]) {
          try {
            await eth.request({
              method: 'wallet_addEthereumChain',
              params: [chainParams[targetChainId]],
            });
          } catch {
            // User rejected adding chain
          }
        }
      }
    }
  }, []);

  // ── Listen for account/chain changes ───────────────────────────────
  useEffect(() => {
    if (!activeProviderRef.current) return;
    const eth = activeProviderRef.current;

    const handleAccountsChanged = (accounts: string[]) => {
      if (!mountedRef.current) return;
      if (accounts.length === 0) {
        disconnect();
      } else {
        const newAddress = accounts[0];
        setState(prev => ({
          ...prev,
          address: newAddress,
          balance: null,
          status: 'connected',
        }));
        void fetchBalance(newAddress);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      if (!mountedRef.current) return;
      updateChainInfo(chainIdHex);
      if (state.address) void fetchBalance(state.address);
    };

    const handleDisconnect = () => {
      if (!mountedRef.current) return;
      disconnect();
    };

    eth.on?.('accountsChanged', handleAccountsChanged);
    eth.on?.('chainChanged', handleChainChanged);
    eth.on?.('disconnect', handleDisconnect);

    return () => {
      eth.removeListener?.('accountsChanged', handleAccountsChanged);
      eth.removeListener?.('chainChanged', handleChainChanged);
      eth.removeListener?.('disconnect', handleDisconnect);
    };
  }, [state.address, disconnect, fetchBalance, updateChainInfo]);

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    isMetaMaskInstalled,
    availableProviders,
    shortAddress: state.address ? truncateAddress(state.address) : null,
    supportedChains: SUPPORTED_CHAINS,
  };
}
