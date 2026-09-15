import React, { useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  CreditCard,
  Building2,
  ShieldCheck,
  MessageSquare,
  Package,
  ChevronRight,
  ExternalLink,
  Copy,
  Receipt,
  Store,
  Phone,
} from 'lucide-react';
import { Order, Page } from '../../types';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
}) => {
  const {
    openChatWithUser,
    triggerShareToast,
    pages,
    setSelectedShopProduct,
    setSelectedProductStore,
    setActivePageId,
  } = useLalao();

  // Android back button / popstate handling
  useEffect(() => {
    if (!order) return;

    window.history.pushState({ modal: 'order_detail', orderId: order.id }, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [order, onClose]);

  const handleBack = () => {
    if (window.history.state?.modal === 'order_detail') {
      window.history.back();
    } else {
      onClose();
    }
  };

  if (!order) return null;

  const matchedStore: Page | undefined = pages.find(
    (p) => p.id === order.storeId || p.name.toLowerCase() === order.storeName.toLowerCase()
  );

  const currencySymbol =
    order.currency === 'NGN' ? 'NGN ' : order.currency ? `${order.currency} ` : '₦';

  // Status mapping
  const paymentBadgeStyles: Record<string, { bg: string; text: string; label: string }> = {
    paid: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', text: 'text-emerald-700', label: 'PAID' },
    pending: { bg: 'bg-amber-50 border-amber-200 text-amber-700', text: 'text-amber-700', label: 'PAYMENT PENDING' },
    failed: { bg: 'bg-rose-50 border-rose-200 text-rose-700', text: 'text-rose-700', label: 'PAYMENT FAILED' },
    refunded: { bg: 'bg-neutral-100 border-neutral-300 text-neutral-700', text: 'text-neutral-700', label: 'REFUNDED' },
  };

  const currentPaymentBadge =
    paymentBadgeStyles[order.paymentStatus] || paymentBadgeStyles.paid;

  const orderStatusLabels: Record<string, { label: string; color: string }> = {
    delivered: { label: 'Delivered', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    completed: { label: 'Completed', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    shipped: { label: 'In Transit / Shipped', color: 'text-sky-600 bg-sky-50 border-sky-200' },
    out_for_delivery: { label: 'Out for Delivery', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    processing: { label: 'Processing', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    confirmed: { label: 'Confirmed', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    cancelled: { label: 'Cancelled', color: 'text-rose-600 bg-rose-50 border-rose-200' },
    refunded: { label: 'Refunded', color: 'text-neutral-600 bg-neutral-100 border-neutral-200' },
  };

  const currentStatus = orderStatusLabels[order.orderStatus] || {
    label: order.orderStatus,
    color: 'text-neutral-700 bg-neutral-100 border-neutral-200',
  };

  const handleCopyOrderId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(order.id);
      triggerShareToast(`Order ID #${order.id} copied to clipboard`);
    }
  };

  const handleShareReceipt = () => {
    const text = `Lazla Order #${order.id} from ${order.storeName} - Total: ${currencySymbol}${order.totalAmount.toLocaleString()} (${order.orderStatus})`;
    if (navigator.share) {
      navigator.share({
        title: `Lazla Order #${order.id}`,
        text,
        url: window.location.href,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      triggerShareToast('Order summary copied to clipboard');
    }
  };

  const handleContactStore = () => {
    const storeUser = {
      id: matchedStore ? `user_${matchedStore.id}` : `user_${order.storeName.replace(/\s+/g, '_')}`,
      name: order.storeName,
      username: matchedStore?.username || order.storeName.toLowerCase().replace(/\s+/g, ''),
      avatar: order.storeAvatar || matchedStore?.avatar || 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&auto=format&fit=crop&q=80',
      bio: matchedStore?.description || `Merchant on Lazla · Order #${order.id}`,
      location: order.storeLocation || 'Delta State',
      badge: 'BIZ' as const,
      followersCount: matchedStore?.followersCount || 1200,
      followingCount: 0,
      postsCount: 15,
      distanceMeters: 600,
      interests: ['Retail', 'Shop'],
    };
    openChatWithUser(storeUser);
    triggerShareToast(`Opened message thread with ${order.storeName}`);
  };

  return (
    <div
      id="order-detail-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="order-detail-container"
        className="bg-white w-full sm:max-w-md md:max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 relative z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-4 py-3.5 border-b border-neutral-100 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <button
              id="btn-back-order-detail"
              type="button"
              onClick={handleBack}
              className="p-2 rounded-full text-neutral-800 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer -ml-1.5 shrink-0"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-neutral-900 truncate">
                Order Details
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono truncate">
                #{order.id} · {order.dateFormatted}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleCopyOrderId}
              className="p-2 rounded-full text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-colors cursor-pointer"
              title="Copy Order ID"
              aria-label="Copy Order ID"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleShareReceipt}
              className="p-2 rounded-full text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-colors cursor-pointer"
              title="Share Receipt"
              aria-label="Share Receipt"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Shop Card */}
          <div
            id="order-shop-card"
            className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                src={order.storeAvatar || matchedStore?.avatar}
                alt={order.storeName}
                size="md"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-neutral-900 truncate">
                    {order.storeName}
                  </h3>
                  <Badge type={order.storeBadge || 'BIZ'} size="sm" />
                </div>
                <p className="text-xs text-neutral-500 truncate">
                  {order.storeLocation || matchedStore?.location || 'Delta State'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleContactStore}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 active:scale-95 border border-neutral-200 text-neutral-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                title="Message Shop"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#5E43F3]" />
                <span className="hidden sm:inline">Message</span>
              </button>
              {matchedStore && (
                <button
                  type="button"
                  onClick={() => {
                    handleBack();
                    setActivePageId(matchedStore.id);
                  }}
                  className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 active:scale-95 border border-neutral-200 text-neutral-700 cursor-pointer shadow-xs transition-all"
                  title="Visit Shop Page"
                >
                  <Store className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Status Row */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Payment Status Card */}
            <div className={`p-3.5 rounded-2xl border ${currentPaymentBadge.bg} flex flex-col justify-between`}>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                Payment Status
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {order.paymentStatus === 'paid' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span className="text-xs font-black tracking-tight">
                  {order.paymentStatus === 'paid'
                    ? '✓ PAID'
                    : currentPaymentBadge.label}
                </span>
              </div>
              <span className="text-[11px] opacity-75 mt-0.5">
                via {order.paymentMethod === 'transfer' ? 'Bank Transfer' : order.paymentMethod === 'card' ? 'Debit/Credit Card' : 'Pay on Delivery'}
              </span>
            </div>

            {/* Order / Delivery Status Card */}
            <div className={`p-3.5 rounded-2xl border ${currentStatus.color} flex flex-col justify-between`}>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                Fulfillment Status
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Truck className="w-4 h-4 shrink-0" />
                <span className="text-xs font-black tracking-tight truncate">
                  {currentStatus.label}
                </span>
              </div>
              <span className="text-[11px] opacity-75 mt-0.5">
                {order.deliveryType === 'delivery' ? 'Doorstep Delivery' : 'In-Store Pickup'}
              </span>
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Items Purchased ({order.items?.length || 0})
              </h4>
              <span className="text-xs text-neutral-500 font-medium">
                {order.items?.reduce((acc, it) => acc + (it.quantity || 0), 0) || 0} total units
              </span>
            </div>

            <div className="space-y-2.5">
              {(order.items || []).map((item, index) => (
                <div
                  key={item.id || index}
                  className="p-3 rounded-2xl border border-neutral-100 bg-white flex items-center gap-3 shadow-xs hover:border-neutral-200 transition-all"
                >
                  <div className="w-16 h-16 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-100">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-1">
                      {item.product.name}
                    </h5>

                    {item.options && Object.keys(item.options).length > 0 && (
                      <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                        {Object.entries(item.options)
                          .map(([key, val]) => `${key}: ${val}`)
                          .join(' · ')}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-neutral-500 font-medium">
                        Qty: <strong className="text-neutral-800">{item.quantity}</strong>
                      </span>
                      <span className="font-bold text-neutral-900">
                        {currencySymbol}
                        {item.totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Payment Summary
            </h4>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-medium text-neutral-900">
                  {currencySymbol}
                  {order.subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-600">
                <span>Delivery Fee</span>
                <span className="font-medium text-neutral-900">
                  {order.deliveryFee > 0
                    ? `${currencySymbol}${order.deliveryFee.toLocaleString()}`
                    : 'FREE'}
                </span>
              </div>

              {order.discount > 0 && (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>Discount Applied</span>
                  <span className="font-bold">
                    -{currencySymbol}
                    {order.discount.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-200 flex items-baseline justify-between">
                <span className="text-sm font-bold text-neutral-900">Total Paid</span>
                <span className="text-lg font-black text-neutral-950">
                  {currencySymbol}
                  {order.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery & Contact Information */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Fulfillment & Contact
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-neutral-900 block">
                    {order.deliveryType === 'delivery' ? 'Delivery Address' : 'Pickup Location'}
                  </span>
                  <p className="text-neutral-600 mt-0.5 leading-relaxed">
                    {order.deliveryAddress || 'Delta State, Nigeria'}
                  </p>
                </div>
              </div>

              {order.customerPhone && (
                <div className="flex items-center gap-2.5 pt-1 border-t border-neutral-200/60">
                  <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span className="text-neutral-700">
                    Recipient Phone: <strong className="text-neutral-900">{order.customerPhone}</strong>
                  </span>
                </div>
              )}

              {order.notes && (
                <div className="pt-1 border-t border-neutral-200/60 text-neutral-600">
                  <span className="font-semibold text-neutral-800">Delivery Notes: </span>
                  {order.notes}
                </div>
              )}
            </div>
          </div>

          {/* Buyer Protection Guarantee */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs text-emerald-900 leading-snug">
              <span className="font-bold block">Lazla Buyer Protected</span>
              <span>All purchases are covered under verified merchant protection and safe escrow.</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="p-4 border-t border-neutral-100 bg-white sticky bottom-0 z-20 space-y-2">
          <button
            type="button"
            onClick={handleContactStore}
            className="w-full py-3 px-4 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#5E43F3]/25 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Contact Merchant ({order.storeName})</span>
          </button>

          <button
            type="button"
            onClick={handleBack}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs cursor-pointer transition-colors"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};
