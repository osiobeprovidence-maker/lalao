export type PlatformMenuKey = 'settings' | 'wallet' | 'orders' | 'pages';

export const PLATFORM_MENU_ITEMS = [
  { id: 'settings', label: 'Settings' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'orders', label: 'Order History' },
  { id: 'pages', label: 'Add Pages' },
] as const satisfies ReadonlyArray<{ id: PlatformMenuKey; label: string }>;
