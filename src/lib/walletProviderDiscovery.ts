export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: WalletProviderLike;
}

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
  icon?: string;
  rdns?: string;
}

export interface WalletProviderWindow {
  ethereum?: WalletProviderLike & { providers?: WalletProviderLike[] };
  "eip6963:providers"?: Map<string, WalletProviderLike | EIP6963ProviderDetail> | readonly [string, WalletProviderLike | EIP6963ProviderDetail][];
  addEventListener?: (type: string, listener: (...args: any[]) => void) => void;
  removeEventListener?: (type: string, listener: (...args: any[]) => void) => void;
  dispatchEvent?: (event: any) => boolean;
  [key: string]: unknown;
}

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

export function discoverWalletProviders(
  windowLike: WalletProviderWindow | null | undefined,
  eip6963EventProviders?: EIP6963ProviderDetail[]
): DiscoveredWalletProvider[] {
  if (!windowLike && (!eip6963EventProviders || eip6963EventProviders.length === 0)) return [];

  const discovered: DiscoveredWalletProvider[] = [];
  const seen = new Set<WalletProviderLike>();

  // 1. Process providers announced via standard EIP-6963 events
  if (eip6963EventProviders && Array.isArray(eip6963EventProviders)) {
    for (const detail of eip6963EventProviders) {
      if (!detail || !detail.provider || seen.has(detail.provider)) continue;
      seen.add(detail.provider);
      const isMetaMask = Boolean(
        detail.provider.isMetaMask ||
        detail.info?.rdns?.toLowerCase().includes("metamask") ||
        detail.info?.name?.toLowerCase().includes("metamask")
      );
      discovered.push({
        id: detail.info?.rdns || detail.info?.uuid || providerId(detail.provider, "eip6963-provider"),
        name: detail.info?.name || getWalletProviderName(detail.provider),
        provider: detail.provider,
        isMetaMask,
        isEIP6963: true,
        icon: detail.info?.icon,
        rdns: detail.info?.rdns,
      });
    }
  }

  // 2. Process registry map if present (custom registry or testing)
  const registry = windowLike?.["eip6963:providers"];
  const registryEntries = registry instanceof Map ? Array.from(registry.entries()) : Array.isArray(registry) ? registry : [];

  for (const [id, item] of registryEntries) {
    if (!item) continue;
    const provider = ("provider" in item && (item as EIP6963ProviderDetail).provider)
      ? (item as EIP6963ProviderDetail).provider
      : (item as WalletProviderLike);
    const info = ("info" in item && (item as EIP6963ProviderDetail).info)
      ? (item as EIP6963ProviderDetail).info
      : undefined;

    if (!provider || seen.has(provider)) continue;
    seen.add(provider);
    discovered.push({
      id: info?.rdns || id,
      name: info?.name || getWalletProviderName(provider),
      provider,
      isMetaMask: Boolean(provider.isMetaMask),
      isEIP6963: true,
      icon: info?.icon,
      rdns: info?.rdns,
    });
  }

  // 3. Process multiple injected providers via window.ethereum.providers if multiple extensions are active
  const legacy = windowLike?.ethereum;
  if (legacy?.providers && Array.isArray(legacy.providers)) {
    seen.add(legacy);
    for (let i = 0; i < legacy.providers.length; i++) {
      const subProvider = legacy.providers[i];
      if (!subProvider || seen.has(subProvider)) continue;
      seen.add(subProvider);
      const id = providerId(subProvider, `injected-provider-${i}`);
      discovered.push({
        id,
        name: getWalletProviderName(subProvider),
        provider: subProvider,
        isMetaMask: Boolean(subProvider.isMetaMask),
        isEIP6963: Boolean(subProvider.isEIP6963),
      });
    }
  }

  // 4. Process single legacy window.ethereum
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
