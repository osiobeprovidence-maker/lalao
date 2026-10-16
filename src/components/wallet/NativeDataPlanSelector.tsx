import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Search,
  X,
  Check,
  Wifi,
  Sparkles,
  Zap,
} from 'lucide-react';

export interface DataPlanItem {
  id?: string;
  variationId: string;
  planName: string;
  dataAmount?: string;
  validity?: string;
  price: number;
  network?: string;
  category?: string;
}

interface NativeDataPlanSelectorProps {
  plans: DataPlanItem[];
  selectedPlan: DataPlanItem | null;
  onSelectPlan: (plan: DataPlanItem) => void;
  isLoading?: boolean;
  disabled?: boolean;
  networkName?: string;
}

/**
 * Normalizes data allowance string (e.g. "500MB" -> "500 MB", "1.5GB" -> "1.5 GB")
 */
function parseDataAllowance(plan: DataPlanItem): string {
  const source = plan.dataAmount || plan.planName;
  const match = source.match(/(\d+(?:\.\d+)?)\s*(MB|GB|TB)/i);
  if (match) {
    return `${match[1]} ${match[2].toUpperCase()}`;
  }
  return plan.dataAmount || plan.planName.split('-')[0].trim();
}

/**
 * Extracts validity period (e.g. "Daily", "Weekly", "Monthly", "30 Days")
 */
function parseValidity(plan: DataPlanItem): string {
  if (plan.validity && plan.validity.trim().length > 0 && !plan.validity.includes('-')) {
    return plan.validity;
  }
  const name = plan.planName.toLowerCase();
  if (name.includes('daily') || name.includes('1 day') || name.includes('24 hour') || name.includes('24hr')) {
    return 'Daily';
  }
  if (name.includes('weekly') || name.includes('7 day')) {
    return 'Weekly';
  }
  if (name.includes('monthly') || name.includes('30 day')) {
    return 'Monthly';
  }
  if (name.includes('2 day') || name.includes('3 day') || name.includes('14 day')) {
    const dMatch = name.match(/(\d+\s*days?)/i);
    if (dMatch) return dMatch[1];
  }
  return '30 Days';
}

/**
 * Extracts package category (e.g. "SME", "Corporate", "Awoof Data", "Special")
 */
function parseCategory(plan: DataPlanItem): string {
  if (plan.category) return plan.category;
  const name = plan.planName;
  if (/sme/i.test(name)) return 'SME';
  if (/corporate|corp/i.test(name)) return 'Corporate';
  if (/awoof/i.test(name)) return 'Awoof Data';
  if (/gifting|gift/i.test(name)) return 'Gifting';
  if (/special/i.test(name)) return 'Special';
  if (/direct/i.test(name)) return 'Direct';
  return 'Standard';
}

type ValidityFilter = 'all' | 'daily' | 'weekly' | 'monthly';

export const NativeDataPlanSelector: React.FC<NativeDataPlanSelectorProps> = ({
  plans,
  selectedPlan,
  onSelectPlan,
  isLoading = false,
  disabled = false,
  networkName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [validityFilter, setValidityFilter] = useState<ValidityFilter>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      setValidityFilter('all');
    }
  }, [isOpen]);

  // Pre-process plans with parsed allowance, validity, and category
  const enrichedPlans = useMemo(() => {
    return plans.map((p) => ({
      ...p,
      parsedAllowance: parseDataAllowance(p),
      parsedValidity: parseValidity(p),
      parsedCategory: parseCategory(p),
    }));
  }, [plans]);

  // Compute available validity filters from actual plans
  const availableFilterChips = useMemo(() => {
    const hasDaily = enrichedPlans.some((p) => {
      const v = p.parsedValidity.toLowerCase();
      return v.includes('daily') || (v.includes('day') && !v.includes('30'));
    });
    const hasWeekly = enrichedPlans.some((p) => p.parsedValidity.toLowerCase().includes('week') || p.parsedValidity.toLowerCase().includes('7'));
    const hasMonthly = enrichedPlans.some((p) => p.parsedValidity.toLowerCase().includes('month') || p.parsedValidity.toLowerCase().includes('30'));

    const chips: { id: ValidityFilter; label: string }[] = [{ id: 'all', label: 'All Plans' }];
    if (hasDaily) chips.push({ id: 'daily', label: 'Daily' });
    if (hasWeekly) chips.push({ id: 'weekly', label: 'Weekly' });
    if (hasMonthly) chips.push({ id: 'monthly', label: 'Monthly' });
    return chips;
  }, [enrichedPlans]);

  // Filter plans based on search query and validity filter
  const filteredPlans = useMemo(() => {
    let list = enrichedPlans;

    // Validity filter
    if (validityFilter !== 'all') {
      list = list.filter((p) => {
        const val = p.parsedValidity.toLowerCase();
        if (validityFilter === 'daily') return val.includes('daily') || (val.includes('day') && !val.includes('30'));
        if (validityFilter === 'weekly') return val.includes('week') || val.includes('7');
        if (validityFilter === 'monthly') return val.includes('month') || val.includes('30');
        return true;
      });
    }

    // Search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const numQuery = q.replace(/[^0-9]/g, '');

      list = list.filter((p) => {
        const allowanceMatch = p.parsedAllowance.toLowerCase().includes(q);
        const nameMatch = p.planName.toLowerCase().includes(q);
        const validityMatch = p.parsedValidity.toLowerCase().includes(q);
        const categoryMatch = p.parsedCategory.toLowerCase().includes(q);
        const priceMatch = p.price.toString().includes(numQuery && numQuery.length > 0 ? numQuery : q);

        return allowanceMatch || nameMatch || validityMatch || categoryMatch || priceMatch;
      });
    }

    return list;
  }, [enrichedPlans, validityFilter, searchQuery]);

  const handleSelect = (plan: DataPlanItem) => {
    onSelectPlan(plan);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* TRIGGER BUTTON (Matches Lala Native Input Aesthetics) */}
      <div
        id="btn-open-data-plan-selector"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled && !isLoading) {
            setIsOpen((prev) => !prev);
          }
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isLoading) {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full bg-theme-surface border rounded-xl py-3 px-4 flex items-center justify-between gap-3 cursor-pointer transition-all ${
          isOpen
            ? 'border-[#5E43F3] ring-2 ring-[#5E43F3]/20'
            : 'border-theme-divider-light hover:border-[#5E43F3]/50'
        } ${disabled || isLoading ? 'opacity-50 cursor-not-allowed bg-theme-surface/50' : ''}`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2.5 text-xs font-semibold text-theme-tertiary py-1">
            <div className="w-4 h-4 border-2 border-[#5E43F3] border-t-transparent rounded-full animate-spin" />
            <span>Loading {networkName ? `${networkName} ` : ''}plans...</span>
          </div>
        ) : selectedPlan ? (
          <div className="flex items-center justify-between w-full min-w-0 pr-1">
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-theme-primary tracking-tight">
                  {parseDataAllowance(selectedPlan)}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#5E43F3]/10 text-[#5E43F3]">
                  {parseCategory(selectedPlan)}
                </span>
              </div>
              <div className="text-[11px] font-medium text-theme-secondary mt-0.5 truncate">
                {parseValidity(selectedPlan)}
              </div>
            </div>

            <div className="font-mono font-black text-sm text-[#5E43F3] shrink-0">
              ₦{selectedPlan.price.toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-theme-tertiary py-1">
            <Wifi className="w-4 h-4 text-theme-tertiary" />
            <span className="text-sm font-medium">
              {networkName ? `Select a ${networkName} data plan` : 'Select a data plan'}
            </span>
          </div>
        )}

        <div className="shrink-0 text-theme-tertiary flex items-center gap-1.5">
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#5E43F3]' : ''
            }`}
          />
        </div>
      </div>

      {/* EXPANDED CUSTOM DROPDOWN PANEL */}
      {isOpen && (
        <div
          id="custom-data-plan-dropdown"
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-theme-surface border border-theme-divider-light rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[340px]"
        >
          {/* Search Box Header */}
          <div className="p-2.5 border-b border-theme-divider-light/60 bg-theme-base/60 shrink-0">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-3.5 h-3.5 text-theme-tertiary" />
              <input
                ref={searchInputRef}
                type="text"
                id="input-search-data-plans"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search size (e.g. 1GB, 500MB), price, or plan..."
                className="w-full pl-8 pr-8 py-2 rounded-xl bg-theme-surface border border-theme-divider-light text-xs text-theme-primary placeholder:text-theme-tertiary focus:outline-none focus:border-[#5E43F3] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-0.5 text-theme-tertiary hover:text-theme-primary rounded-full cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Validity Filter Chips */}
            {availableFilterChips.length > 2 && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-2">
                {availableFilterChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setValidityFilter(chip.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      validityFilter === chip.id
                        ? 'bg-[#5E43F3] text-white shadow-2xs'
                        : 'bg-theme-surface hover:bg-theme-surface-hover text-theme-secondary hover:text-theme-primary border border-theme-divider-light/60'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scrollable Plan List */}
          <div
            id="data-plans-scroll-list"
            className="flex-1 overflow-y-auto divide-y divide-theme-divider-light/40 py-1"
          >
            {filteredPlans.length > 0 ? (
              filteredPlans.map((plan) => {
                const isSelected = selectedPlan?.variationId === plan.variationId;

                return (
                  <div
                    key={plan.variationId}
                    id={`data-plan-option-${plan.variationId}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(plan)}
                    className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#5E43F3]/10 border-l-4 border-[#5E43F3]'
                        : 'hover:bg-theme-base/60'
                    }`}
                  >
                    {/* Left details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-theme-primary tracking-tight">
                          {plan.parsedAllowance}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-theme-base text-theme-tertiary">
                          {plan.parsedCategory}
                        </span>
                      </div>
                      <div className="text-[11px] font-medium text-theme-secondary mt-0.5">
                        {plan.parsedValidity} · {plan.network || networkName || 'Data'}
                      </div>
                    </div>

                    {/* Right price & checkmark */}
                    <div className="flex items-center gap-2.5 shrink-0 text-right">
                      <span className="font-mono font-bold text-sm text-[#5E43F3]">
                        ₦{plan.price.toLocaleString()}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#5E43F3] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 px-4 space-y-2">
                <p className="text-xs font-semibold text-theme-tertiary">
                  No data plans found matching &quot;{searchQuery}&quot;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setValidityFilter('all');
                  }}
                  className="text-xs font-bold text-[#5E43F3] hover:underline cursor-pointer"
                >
                  Clear search filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
