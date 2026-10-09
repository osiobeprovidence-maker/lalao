export interface WalletProviderLike {
  request: <T = unknown>(args: { method: string; params?: unknown[] }) => Promise<T>;
  on?: (event: string, listener: (...args: any[]) => void) => void;
  removeListener?: (event: string, listener: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isPhantom?: boolean;
  isWalletConnect?: boolean;
  isBraveWallet?: boolean;
  isSafeWallet?: boolean;
  isEIP6963?: boolean;
  [key: string]: unknown;
}

export interface DiscoveredWalletProvider {
  id: string;
  name: string;
  provider: WalletProviderLike;
  isMetaMask: boolean;
  isEIP6963: boolean;
}

export interface WalletProviderWindow {
  ethereum?: WalletProviderLike;
  "eip6963:providers"?: Map<string, WalletProviderLike> | readonly [string, WalletProviderLike][];
  addEventListener?: (type: string, listener: (...args: any[]) => void) => void;
  removeEventListener?: (type: string, listener: (...args: any[]) => void) => void;
  [key: string]: unknown;
}

const PROVIDER_NAMES: Record<string, string> = {
  metamask: "MetaMask",
  coinbasewallet: "Coinbase Wallet",
  phantom: "Phantom",
  walletconnect: "WalletConnect",
  bravewallet: "Brave Wallet",
  safewallet: "Safe Wallet",
};

function providerId(provider: WalletProviderLike, fallback: string): string {
  if (provider.isMetaMask) return "metamask";
  if (provider.isCoinbaseWallet) return "coinbase-wallet";
  if (provider.isPhantom) return "phantom";
  if (provider.isWalletConnect) return "wallet-connect";
  if (provider.isBraveWallet) return "brave-wallet";
  if (provider.isSafeWallet) return "safe-wallet";
  return fallback;
}

export function getWalletProviderName(provider: WalletProviderLike): string {
  if (provider.isMetaMask) return "MetaMask";
  if (provider.isCoinbaseWallet) return "Coinbase Wallet";
  if (provider.isPhantom) return "Phantom";
  if (provider.isWalletConnect) return "WalletConnect";
  if (provider.isBraveWallet) return "Brave Wallet";
  if (provider.isSafeWallet) return "Safe Wallet";
  return "Other Wallet";
}

export function discoverWalletProviders(windowLike: WalletProviderWindow | null | undefined): DiscoveredWalletProvider[] {
  if (!windowLike) return [];

  const discovered: DiscoveredWalletProvider[] = [];
  const seen = new Set<WalletProviderLike>();
  const registry = windowLike["eip6963:providers"];
  const registryEntries = registry instanceof Map ? Array.from(registry.entries()) : Array.isArray(registry) ? registry : [];

  for (const [id, provider] of registryEntries) {
    if (!provider || seen.has(provider)) continue;
    seen.add(provider);
    discovered.push({
      id,
      name: getWalletProviderName(provider),
      provider,
      isMetaMask: Boolean(provider.isMetaMask),
      isEIP6963: Boolean(provider.isEIP6963 || provider.isMetaMask),
    });
  }

  const legacy = windowLike.ethereum;
  if (legacy && !seen.has(legacy)) {
    const id = providerId(legacy, "window-ethereum");
    discovered.push({
      id,
      name: getWalletProviderName(legacy),
      provider: legacy,
      isMetaMask: Boolean(legacy.isMetaMask),
      isEIP6963: Boolean(legacy.isEIP6963),
    });
  }

  return discovered;
}
