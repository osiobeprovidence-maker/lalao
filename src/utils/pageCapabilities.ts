import { Page, OrgEvent } from '../types';

/**
 * Page capabilities interface defining permissions for each organization / page type.
 * Reusable capability system for LAO LINE organization pages.
 */
export interface PageCapabilities {
  /** Whether the page type is eligible for ticketing features */
  ticketingEnabled: boolean;
  /** Whether the page can create ticketed events */
  canCreateTicketedEvents: boolean;
  /** Whether the page can sell tickets to users */
  canSellTickets: boolean;
  /** Whether the ticket icon/button appears in the page header controls */
  showTicketIcon: boolean;
  /** Whether the page supports storefront e-commerce catalog */
  hasShopStorefront: boolean;
}

/**
 * Standard capability matrix by organization type
 */
export const PAGE_TYPE_CAPABILITIES: Record<string, PageCapabilities> = {
  community: {
    ticketingEnabled: true,
    canCreateTicketedEvents: true,
    canSellTickets: true,
    showTicketIcon: true,
    hasShopStorefront: false,
  },
  club: {
    ticketingEnabled: true,
    canCreateTicketedEvents: true,
    canSellTickets: true,
    showTicketIcon: true,
    hasShopStorefront: false,
  },
  organization: {
    ticketingEnabled: true,
    canCreateTicketedEvents: true,
    canSellTickets: true,
    showTicketIcon: true,
    hasShopStorefront: false,
  },
  business: {
    ticketingEnabled: false,
    canCreateTicketedEvents: false,
    canSellTickets: false,
    showTicketIcon: false,
    hasShopStorefront: true,
  },
};

/**
 * Determines whether a page / organization is eligible for ticket functionality.
 *
 * Rules:
 * - Community -> Eligible (true)
 * - Club -> Eligible (true)
 * - Esports / Gaming Organization -> Eligible (true)
 * - Other Organizations (NGOs, Sports Orgs) -> Eligible (true)
 * - Business -> NOT Eligible (false)
 */
export function isPageTicketingEligible(
  page?: Partial<Page> | string | null
): boolean {
  if (!page) return false;

  // If a string identifier or type is passed
  if (typeof page === 'string') {
    const lower = page.toLowerCase().trim();
    if (lower === 'business' || lower === 'biz') return false;
    if (
      lower === 'community' ||
      lower === 'club' ||
      lower === 'organization' ||
      lower === 'org' ||
      lower === 'esports'
    ) {
      return true;
    }
    return false;
  }

  // Explicit override if specified on the page record
  if (typeof page.ticketingEnabled === 'boolean') {
    return page.ticketingEnabled;
  }

  // Business pages are strictly not eligible for ticketing
  if (page.type === 'business' || page.badge === 'BIZ') {
    return false;
  }

  // Community, Club, and Organization (including Esports Orgs) are eligible
  if (
    page.type === 'community' ||
    page.type === 'club' ||
    page.type === 'organization' ||
    page.badge === 'COMMUNITY' ||
    page.badge === 'CLUB' ||
    page.badge === 'ORG'
  ) {
    return true;
  }

  // Check category heuristics for esports / gaming / clubs / communities
  if (page.category) {
    const catLower = page.category.toLowerCase();
    if (catLower.includes('esports') || catLower.includes('gaming')) {
      return true;
    }
    if (catLower.includes('club') || catLower.includes('community')) {
      return true;
    }
    if (catLower.includes('business') || catLower.includes('retail') || catLower.includes('shop')) {
      return false;
    }
  }

  return false;
}

/**
 * Returns full capabilities object for a given page.
 */
export function getPageCapabilities(
  page?: Partial<Page> | null
): PageCapabilities {
  if (!page) {
    return PAGE_TYPE_CAPABILITIES.business;
  }

  const isEligible = isPageTicketingEligible(page);
  const typeKey = page.type || (page.badge === 'BIZ' ? 'business' : 'organization');
  const baseCaps = PAGE_TYPE_CAPABILITIES[typeKey] || (isEligible ? PAGE_TYPE_CAPABILITIES.organization : PAGE_TYPE_CAPABILITIES.business);

  return {
    ...baseCaps,
    ticketingEnabled: isEligible,
    canCreateTicketedEvents: isEligible,
    canSellTickets: isEligible,
    showTicketIcon: isEligible,
    hasShopStorefront: page.type === 'business' || page.badge === 'BIZ' || (page.products && page.products.length > 0) || false,
  };
}

/**
 * Determines whether an event is eligible for ticket sales / ticket button.
 *
 * Rules:
 * 1. The hosting page must be eligible for ticketing (Community, Club, Esports Org - NOT Business).
 * 2. The event must be configured as a ticketed event (`isTicketed === true`).
 */
export function isEventTicketingEligible(
  event?: OrgEvent | null,
  hostPage?: Partial<Page> | null
): boolean {
  if (!event) return false;

  // Event must be marked as ticketed
  if (!event.isTicketed) return false;

  // If host page is provided, verify page eligibility
  if (hostPage) {
    return isPageTicketingEligible(hostPage);
  }

  // If organization badge is BIZ, strictly not eligible
  if (event.organizationBadge === 'BIZ') {
    return false;
  }

  // ORG, CLUB, COMMUNITY are eligible
  if (
    event.organizationBadge === 'ORG' ||
    event.organizationBadge === 'CLUB' ||
    event.organizationBadge === 'COMMUNITY'
  ) {
    return true;
  }

  return true;
}
