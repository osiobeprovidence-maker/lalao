import assert from "node:assert/strict";
import test from "node:test";

import {
  discoverWalletProviders,
  getWalletProviderName,
  type WalletProviderLike,
} from "../src/lib/walletProviderDiscovery.ts";

const makeProvider = (name: string, id = name.toLowerCase()): WalletProviderLike => ({
  isMetaMask: id === "metamask",
  isCoinbaseWallet: id === "coinbasewallet",
  isPhantom: id === "phantom",
  isWalletConnect: id === "walletconnect",
  isBraveWallet: id === "bravewallet",
  isSafeWallet: id === "safe",
  isEIP6963: true,
  request: async <T = unknown>() => [] as T,
  on: () => undefined,
  removeListener: () => undefined,
});

test("discovers providers from the EIP-6963 provider registry", () => {
  const metamask = makeProvider("MetaMask", "metamask");
  const coinbase = makeProvider("Coinbase Wallet", "coinbasewallet");
  const providers = discoverWalletProviders({
    ethereum: metamask,
    "eip6963:providers": new Map([
      ["metamask", metamask],
      ["coinbasewallet", coinbase],
    ]),
  });

  assert.deepEqual(
    providers.map((provider) => provider.name),
    ["MetaMask", "Coinbase Wallet"],
  );
  assert.equal(getWalletProviderName(metamask), "MetaMask");
});

test("keeps the legacy window.ethereum provider when no registry is exposed", () => {
  const provider = makeProvider("MetaMask", "metamask");
  const discovered = discoverWalletProviders({ ethereum: provider });

  assert.equal(discovered.length, 1);
  assert.equal(discovered[0].provider, provider);
  assert.equal(discovered[0].id, "metamask");
});

test("deduplicates providers that appear in both discovery paths", () => {
  const provider = makeProvider("MetaMask", "metamask");
  const discovered = discoverWalletProviders({
    ethereum: provider,
    "eip6963:providers": new Map([["metamask", provider]]),
  });

  assert.equal(discovered.length, 1);
});
