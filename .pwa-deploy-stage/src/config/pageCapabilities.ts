/**
 * pageCapabilities.ts
 *
 * Single source of truth for Page business types and capability/tool definitions.
 * Import from here — never hard-code business types or tool keys in components.
 */

// ─────────────────────────────────────────────────────────────
// BUSINESS TYPES
// ─────────────────────────────────────────────────────────────

export const BUSINESS_TYPES = [
  'commerce',
  'services',
  'community',
  'creator',
  'hybrid',
] as const;

export type BusinessType = typeof BUSINESS_TYPES[number];

/** Legacy value mapping: old 'subscription' → 'community' for display purposes */
export function normalizeBizType(raw: string | undefined): BusinessType {
  if (!raw) return 'commerce';
  if (raw === 'subscription') return 'community'; // legacy migration
  if ((BUSINESS_TYPES as readonly string[]).includes(raw)) return raw as BusinessType;
  return 'commerce';
}

export const BUSINESS_TYPE_META: Record<
  BusinessType,
  {
    label: string;
    emoji: string;
    tagline: string;
    description: string;
    color: string;
    bgColor: string;
  }
> = {
  commerce: {
    label: 'Commerce',
    emoji: '🛍️',
    tagline: 'Sell products',
    description: 'Sell products, manage a shop, receive orders and manage customers.',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  services: {
    label: 'Services',
    emoji: '🔧',
    tagline: 'Offer services',
    description: 'Offer services, bookings, appointments or professional services.',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
  },
  community: {
    label: 'Community',
    emoji: '👥',
    tagline: 'Build a community',
    description: 'Build a community, membership, audience or organization.',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
  },
  creator: {
    label: 'Creator',
    emoji: '🎨',
    tagline: 'Grow an audience',
    description: 'Publish content, grow an audience and monetize your content.',
    color: 'text-violet-700',
    bgColor: 'bg-violet-50 border-violet-200',
  },
  hybrid: {
    label: 'Hybrid',
    emoji: '⚡',
    tagline: 'Multiple models',
    description: 'Combine multiple business models on one Lalao Page.',
    color: 'text-[#5E43F3]',
    bgColor: 'bg-[#5E43F3]/5 border-[#5E43F3]/30',
  },
};

// ─────────────────────────────────────────────────────────────
// TOOL DEFINITIONS
// ─────────────────────────────────────────────────────────────

export type ToolKey =
  | 'shop'
  | 'orders'
  | 'subscriptions'
  | 'loyalty'
  | 'coupons'
  | 'customer_programs'
  | 'events';

export type ToolGroup = 'Sales' | 'Recurring Revenue' | 'Customer Engagement' | 'Community & Events';

export interface ToolDef {
  key: ToolKey;
  label: string;
  description: string;
  group: ToolGroup;
  /** Which business types include this tool by default */
  defaultFor: BusinessType[];
  /** Whether the backend for this tool is fully implemented */
  implemented: boolean;
}

export const PAGE_TOOLS: ToolDef[] = [
  {
    key: 'shop',
    label: 'Shop',
    description: 'Manage your storefront and product listings.',
    group: 'Sales',
    defaultFor: ['commerce', 'hybrid'],
    implemented: true,
  },
  {
    key: 'orders',
    label: 'Orders',
    description: 'Process and fulfil customer orders.',
    group: 'Sales',
    defaultFor: ['commerce', 'hybrid'],
    implemented: true,
  },
  {
    key: 'subscriptions',
    label: 'Subscriptions',
    description: 'Sell recurring memberships, platform subscriptions and manage slots.',
    group: 'Recurring Revenue',
    defaultFor: ['creator', 'hybrid'],
    implemented: true,
  },
  {
    key: 'loyalty',
    label: 'Loyalty & Rewards',
    description: 'Create loyalty programs, reward points and allow customers to redeem gifts.',
    group: 'Customer Engagement',
    defaultFor: ['commerce', 'services', 'hybrid'],
    implemented: true,
  },
  {
    key: 'coupons',
    label: 'Coupons & Promotions',
    description: 'Generate discount codes and run special promotions.',
    group: 'Customer Engagement',
    defaultFor: ['commerce', 'services', 'hybrid'],
    implemented: true,
  },
  {
    key: 'customer_programs',
    label: 'Customer Programs',
    description: 'Manage VIP groups, segmented messaging and tailored customer relations.',
    group: 'Customer Engagement',
    defaultFor: ['services', 'commerce', 'hybrid'],
    implemented: true,
  },
  {
    key: 'events',
    label: 'Events',
    description: 'Create ticketed events, tournaments and community gatherings.',
    group: 'Community & Events',
    defaultFor: ['community', 'creator', 'hybrid'],
    implemented: true,
  },
];

/** Group tools by their group label */
export const TOOL_GROUPS: ToolGroup[] = [
  'Sales',
  'Recurring Revenue',
  'Customer Engagement',
  'Community & Events',
];

/** Get the default active tools for a given business type */
export function getDefaultTools(type: BusinessType): ToolKey[] {
  return PAGE_TOOLS.filter((t) => t.defaultFor.includes(type)).map((t) => t.key);
}

/**
 * Determine which tools are "relevant" for a given business type.
 * For Hybrid this is everything; for others it's the defaultFor set.
 */
export function getRelevantTools(type: BusinessType): ToolDef[] {
  if (type === 'hybrid') return PAGE_TOOLS;
  return PAGE_TOOLS.filter((t) => t.defaultFor.includes(type));
}

/** Whether a given tool key is active, given the page's activeTools array */
export function isToolActive(key: ToolKey, activeTools: string[] | undefined): boolean {
  return (activeTools ?? []).includes(key);
}
