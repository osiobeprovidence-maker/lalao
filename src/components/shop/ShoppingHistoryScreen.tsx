import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  ShoppingBag,
  History,
  ChevronRight,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Store,
  Filter,
  Package,
  X,
} from 'lucide-react';
import { Order } from '../../types';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

interface ShoppingHistoryScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: Order) => void;
}

type StatusFilter = 'all' | 'delivered' | 'processing' | 'shipped';

export const ShoppingHistoryScreen: React.FC<ShoppingHistoryScreenProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
}) => {
  const {
    userOrders,
    currentUser,
    setActivePageId,
    pages,
    setIsCartOpen,
    cartCount,
  } = useLalao();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Android back button / popstate handling
  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ modal: 'shopping_history' }, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  const handleBack = () => {
    if (window.history.state?.modal === 'shopping_history') {
      window.history.back();
    } else {
      onClose();
    }
  };

  // Filtered orders (strict user isolation: userOrders already filters by currentUser.id)
  const filteredOrders = useMemo(() => {
    return userOrders.filter((order) => {
      // Status filter
      if (activeFilter !== 'all') {
        if (activeFilter === 'delivered' && order.orderStatus !== 'delivered' && order.orderStatus !== 'completed') {
          return false;
        }
        if (activeFilter === 'processing' && order.orderStatus !== 'processing' && order.orderStatus !== 'confirmed') {
          return false;
        }
        if (activeFilter === 'shipped' && order.orderStatus !== 'shipped' && order.orderStatus !== 'out_for_delivery') {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesStore = order.storeName.toLowerCase().includes(q);
        const matchesProduct = order.items.some((item) =>
          item.product.name.toLowerCase().includes(q)
        );
        return matchesId || matchesStore || matchesProduct;
      }

      return true;
    });
  }, [userOrders, activeFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      id="shopping-history-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="shopping-history-container"
        className="bg-white w-full sm:max-w-md md:max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 relative z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-4 sm:px-5 py-4 border-b border-neutral-100 bg-white sticky top-0 z-20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                id="btn-back-shopping-history"
                type="button"
                onClick={handleBack}
                className="p-1.5 -ml-1 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
                title="Back"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <div>
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2 leading-tight">
                  <span>Shopping History</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                    {userOrders.length}
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Your past orders & verified receipts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                id="btn-history-view-cart"
                type="button"
                onClick={() => {
                  onClose();
                  setIsCartOpen(true);
                }}
                className="relative p-1.5 rounded-full text-neutral-500 hover:text-[#5E43F3] hover:bg-neutral-100 transition-colors cursor-pointer"
                title="View Shopping Cart"
                aria-label="View Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#5E43F3] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                id="btn-close-shopping-history"
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-3 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-history"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID, item name, or shop..."
              className="w-full pl-9.5 pr-4 py-2 bg-neutral-100 rounded-xl text-xs text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#5E43F3]/20 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {(
              [
                { id: 'all', label: 'All Orders' },
                { id: 'delivered', label: 'Delivered' },
                { id: 'processing', label: 'Processing' },
                { id: 'shipped', label: 'In Transit' },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveFilter(chip.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === chip.id
                    ? 'bg-[#5E43F3] text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </header>

        {/* Orders List / Empty State */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#5E43F3] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-neutral-500">Loading shopping history...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div
              id="empty-shopping-history"
              className="py-16 px-6 text-center flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-1">
                <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">
                {searchQuery || activeFilter !== 'all'
                  ? 'No matching orders found'
                  : 'No orders placed yet'}
              </h3>
              <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                {searchQuery || activeFilter !== 'all'
                  ? 'Try adjusting your search terms or filter criteria.'
                  : 'When you make purchases from verified shops on LAO LINE, your orders and receipts will appear here.'}
              </p>

              {searchQuery || activeFilter !== 'all' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Reset Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    // If a verified shop exists in pages, open it
                    const bizPage = pages.find((p) => p.isBusiness || p.badge === 'BIZ');
                    if (bizPage) {
                      setActivePageId(bizPage.id);
                    }
                  }}
                  className="mt-3 px-5 py-2.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-98 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-[#5E43F3]/25 transition-all"
                >
                  <Store className="w-4 h-4" />
                  <span>Explore Verified Shops</span>
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map((order) => {
              const currency =
                order.currency === 'NGN' ? 'NGN ' : order.currency ? `${order.currency} ` : '₦';

              const isDelivered =
                order.orderStatus === 'delivered' || order.orderStatus === 'completed';
              const isProcessing =
                order.orderStatus === 'processing' || order.orderStatus === 'confirmed';

              return (
                <div
                  key={order.id}
                  id={`order-card-${order.id}`}
                  onClick={() => onSelectOrder(order)}
                  className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-[#5E43F3]/50 hover:shadow-md transition-all cursor-pointer space-y-3 group"
                >
                  {/* Shop & Date Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        src={order.storeAvatar}
                        alt={order.storeName}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-neutral-900 truncate">
                            {order.storeName}
                          </h4>
                          <Badge type={order.storeBadge || 'BIZ'} size="sm" />
                        </div>
                        <p className="text-[10px] text-neutral-400 font-mono">
                          {order.dateFormatted} · #{order.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-neutral-400 group-hover:text-[#5E43F3] transition-colors">
                      <span className="text-[11px] font-semibold hidden sm:inline">Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="flex items-center gap-3 pt-1">
                    {/* First product image */}
                    <div className="w-14 h-14 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-100">
                      <img
                        src={order.items[0]?.product.image}
                        alt={order.items[0]?.product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-neutral-900 line-clamp-1">
                        {order.items?.[0]?.product?.name || 'Order Item'}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {(order.items?.length || 0) === 1
                          ? `Qty: ${order.items?.[0]?.quantity || 1}`
                          : `+${(order.items?.length || 0) - 1} other item${(order.items?.length || 0) > 2 ? 's' : ''} (Total: ${order.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0} units)`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-neutral-950">
                          {currency}
                          {order.totalAmount.toLocaleString()}
                        </span>
                        {order.deliveryType === 'pickup' && (
                          <span className="text-[10px] text-neutral-400 font-medium">
                            · Store Pickup
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Status Indicators */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {order.paymentStatus === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid</span>
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold">
                          Payment Pending
                        </span>
                      )}
                      <span className="text-neutral-300">·</span>
                      <span
                        className={`font-semibold capitalize ${
                          isDelivered
                            ? 'text-emerald-600'
                            : isProcessing
                            ? 'text-amber-600'
                            : 'text-sky-600'
                        }`}
                      >
                        {order.orderStatus === 'shipped' ? 'In Transit' : order.orderStatus}
                      </span>
                    </div>

                    <span className="text-[10px] text-neutral-400 group-hover:text-[#5E43F3] font-medium transition-colors">
                      View Receipt →
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
