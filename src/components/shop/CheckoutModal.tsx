import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Truck,
  MapPin,
  CreditCard,
  Building2,
  Banknote,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  ArrowRight,
  Clock,
  Phone,
  History,
} from 'lucide-react';
import { ShopProduct, CartItem, Page, Order } from '../../types';
import { useLalao } from '../../context/LalaoContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  directBuyItem?: {
    product: ShopProduct;
    quantity: number;
    options?: Record<string, string>;
    store?: Page | null;
  } | null;
  onOrderSuccess?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  directBuyItem,
  onOrderSuccess,
}) => {
  const {
    cart,
    clearCart,
    triggerShareToast,
    openChatWithUser,
    location: userLocation,
    currentUser,
    pages,
    addOrder,
    setIsShoppingHistoryOpen,
  } = useLalao();

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'card' | 'cod'>('transfer');
  const [customerName, setCustomerName] = useState(currentUser.name || 'Alex Morgan');
  const [customerPhone, setCustomerPhone] = useState('+234 803 123 4567');
  const [deliveryAddress, setDeliveryAddress] = useState('14 Enerhen Road, Effurun, Delta State');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderId, setOrderId] = useState('');

  if (!isOpen) return null;

  // Determine items being purchased
  const items: {
    product: ShopProduct;
    quantity: number;
    options?: Record<string, string>;
    storeName?: string;
    storeId?: string;
  }[] = directBuyItem
    ? [
        {
          product: directBuyItem.product,
          quantity: directBuyItem.quantity,
          options: directBuyItem.options,
          storeName: directBuyItem.store?.name || 'Lazla Verified Store',
          storeId: directBuyItem.store?.id,
        },
      ]
    : cart.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        options: item.selectedOptions,
        storeName: item.storeName || 'Lazla Verified Store',
        storeId: item.storeId,
      }));

  const subtotal = items.reduce(
    (acc, curr) => acc + curr.product.price * curr.quantity,
    0
  );
  const deliveryFee = deliveryType === 'delivery' ? 2500 : 0;
  const grandTotal = subtotal + deliveryFee;

  const currencySymbol = items[0]?.product.currency === 'NGN' ? 'NGN ' : (items[0]?.product.currency || '₦');

  const handlePlaceOrder = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const generatedId = `LZ-${Math.floor(10000 + Math.random() * 90000)}`;
      setOrderId(generatedId);

      const now = new Date();
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      const formattedDate = `${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

      const newOrder: Order = {
        id: generatedId,
        userId: currentUser.id,
        storeId: primaryStoreId || 'page_lazla_shop',
        storeName: primaryStore?.name || items[0]?.storeName || 'Lazla Verified Shop',
        storeAvatar: primaryStore?.avatar,
        storeBadge: primaryStore?.badge || 'BIZ',
        storeLocation: primaryStore?.location || 'Delta State',
        items: items.map((item, idx) => ({
          id: `item_${Date.now()}_${idx}`,
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: item.product.price * item.quantity,
          options: item.options,
        })),
        subtotal,
        deliveryFee,
        discount: 0,
        totalAmount: grandTotal,
        currency: items[0]?.product.currency || 'NGN',
        createdAt: now.toISOString(),
        dateFormatted: formattedDate,
        paymentStatus: 'paid',
        paymentMethod,
        orderStatus: 'processing',
        deliveryType,
        deliveryAddress:
          deliveryType === 'delivery'
            ? deliveryAddress
            : primaryStore?.location || 'Store Pickup',
        customerPhone,
        customerName,
        notes: deliveryNotes,
      };

      addOrder(newOrder);

      setIsSubmitting(false);
      setOrderConfirmed(true);

      if (!directBuyItem) {
        clearCart();
      }
      triggerShareToast(`Order #${generatedId} placed successfully!`);
      if (onOrderSuccess) onOrderSuccess();
    }, 900);
  };

  const handleClose = () => {
    setOrderConfirmed(false);
    onClose();
  };

  const primaryStoreId = items[0]?.storeId;
  const primaryStore = pages.find((p) => p.id === primaryStoreId);

  return (
    <div
      id="checkout-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="checkout-modal-container"
        className="bg-theme-surface w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-theme-divider-light flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
      >
        {/* Modal Header */}
        <header className="px-5 py-4 border-b border-theme-divider-light flex items-center justify-between bg-theme-surface sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#5E43F3]/10 flex items-center justify-center text-[#5E43F3]">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-primary leading-tight">
                {orderConfirmed ? 'Order Confirmed' : 'Complete Purchase'}
              </h2>
              <p className="text-xs text-theme-tertiary">
                {orderConfirmed
                  ? `Receipt #${orderId}`
                  : directBuyItem
                  ? 'Direct Checkout'
                  : `${items.length} item(s) from cart`}
              </p>
            </div>
          </div>
          <button
            id="btn-close-checkout"
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-theme-tertiary hover:text-theme-secondary hover:bg-theme-surface-hover cursor-pointer transition-colors"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {orderConfirmed ? (
          /* Order Confirmation Screen */
          <div className="p-6 overflow-y-auto space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-theme-primary">Thank You For Your Order!</h3>
              <p className="text-sm text-theme-secondary max-w-sm mx-auto">
                Your order <span className="font-bold text-theme-primary">#{orderId}</span> has been received and sent to the merchant.
              </p>
            </div>

            {/* Order Summary Card */}
            <div className="bg-theme-base rounded-2xl p-4 border border-theme-divider-light text-left space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-theme-divider">
                <span className="text-theme-tertiary font-medium">Status</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Processing</span>
              </div>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-theme-primary line-clamp-1 flex-1 pr-2">
                      {it.quantity}x {it.product.name}
                      {it.options && Object.keys(it.options).length > 0 && (
                        <span className="text-theme-tertiary ml-1">
                          ({Object.values(it.options).join(', ')})
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-theme-primary shrink-0">
                      {currencySymbol}
                      {(it.product.price * it.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-theme-divider flex items-center justify-between text-sm font-black text-theme-primary">
                <span>Total Paid</span>
                <span className="text-[#5E43F3]">
                  {currencySymbol}
                  {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Fulfillment Note */}
            <div className="p-3.5 rounded-2xl bg-[#5E43F3]/5 border border-[#5E43F3]/15 flex items-start gap-3 text-left">
              <Clock className="w-4 h-4 text-[#5E43F3] shrink-0 mt-0.5" />
              <div className="text-xs text-theme-secondary">
                <p className="font-bold text-theme-primary">Estimated Fulfillment</p>
                <p className="text-theme-secondary mt-0.5">
                  {deliveryType === 'pickup'
                    ? 'Ready for pickup in 1-2 hours at store location.'
                    : 'Dispatched via courier today. Delivery within 24-48 hours in Delta State.'}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {primaryStore && (
                <button
                  type="button"
                  onClick={() => {
                    const storeUser = {
                      id: `user_${primaryStore.id}`,
                      name: primaryStore.name,
                      username: primaryStore.username,
                      avatar: primaryStore.avatar,
                      bio: primaryStore.description,
                      location: primaryStore.location,
                      badge: 'BIZ' as const,
                      followersCount: primaryStore.followersCount,
                      followingCount: 0,
                      postsCount: 12,
                      distanceMeters: 600,
                      interests: [primaryStore.category],
                    };
                    handleClose();
                    openChatWithUser(storeUser);
                    triggerShareToast(`Chat opened with ${primaryStore.name} regarding order #${orderId}`);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#5E43F3]/25 transition-all"
                >
                  <span>Chat with Merchant on Lazla</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  handleClose();
                  setIsShoppingHistoryOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-theme-inverse hover:bg-theme-inverse active:scale-98 text-theme-text-inverse font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <History className="w-4 h-4" />
                <span>View in Shopping History</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 px-4 rounded-xl bg-theme-surface-hover hover:bg-theme-surface-active text-theme-secondary font-bold text-xs cursor-pointer transition-colors"
              >
                Back to Shop
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Items Overview */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                Order Items ({items?.length || 0})
              </h4>
              <div className="divide-y divide-neutral-100 bg-theme-base/60 rounded-2xl border border-theme-divider-light p-2 sm:p-3">
                {(items || []).map((item, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover bg-theme-surface-active shrink-0 border border-theme-divider"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-theme-primary truncate">
                        {item.product.name}
                      </h5>
                      <p className="text-[11px] text-theme-tertiary truncate">
                        Qty: {item.quantity} · {item.storeName}
                      </p>
                      {item.options && Object.keys(item.options).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(item.options).map(([k, v]) => (
                            <span
                              key={k}
                              className="text-[10px] font-semibold bg-theme-surface px-1.5 py-0.5 rounded border border-theme-divider text-theme-secondary"
                            >
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-theme-primary shrink-0">
                      {currencySymbol}
                      {(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery / Pickup Choice */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                Fulfillment Method
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    deliveryType === 'delivery'
                      ? 'border-[#5E43F3] bg-[#5E43F3]/5 ring-1 ring-[#5E43F3]'
                      : 'border-theme-divider hover:border-theme-divider-strong bg-theme-surface'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Truck
                      className={`w-4 h-4 ${
                        deliveryType === 'delivery' ? 'text-[#5E43F3]' : 'text-theme-tertiary'
                      }`}
                    />
                    <span className="text-[11px] font-bold text-theme-secondary">₦2,500</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold text-theme-primary">Doorstep Delivery</p>
                    <p className="text-[10px] text-theme-tertiary mt-0.5">Courier to your door</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    deliveryType === 'pickup'
                      ? 'border-[#5E43F3] bg-[#5E43F3]/5 ring-1 ring-[#5E43F3]'
                      : 'border-theme-divider hover:border-theme-divider-strong bg-theme-surface'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <MapPin
                      className={`w-4 h-4 ${
                        deliveryType === 'pickup' ? 'text-[#5E43F3]' : 'text-theme-tertiary'
                      }`}
                    />
                    <span className="text-[11px] font-bold text-emerald-600">FREE</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold text-theme-primary">Local Pickup</p>
                    <p className="text-[10px] text-theme-tertiary mt-0.5">Direct at store counter</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                Contact & Address
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-theme-secondary block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-theme-base border border-theme-divider focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-theme-secondary block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-theme-base border border-theme-divider focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                    placeholder="+234..."
                  />
                </div>
              </div>

              {deliveryType === 'delivery' && (
                <div>
                  <label className="text-[11px] font-bold text-theme-secondary block mb-1">
                    Delivery Address (Delta State)
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-theme-base border border-theme-divider focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                    placeholder="Street, area, landmark"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-theme-secondary block mb-1">
                  Order Note / Specific Requests (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-theme-base border border-theme-divider focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                  placeholder="e.g., Leave package at reception or call before arrival"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                Payment Method
              </h4>
              <div className="space-y-2">
                {[
                  {
                    id: 'transfer' as const,
                    name: 'Bank Transfer / USSD',
                    desc: 'Direct transfer to Lazla Escrow account',
                    icon: Building2,
                  },
                  {
                    id: 'card' as const,
                    name: 'Debit / Credit Card',
                    desc: 'Instant secure payment via Paystack',
                    icon: CreditCard,
                  },
                  {
                    id: 'cod' as const,
                    name: 'Cash / POS on Delivery',
                    desc: 'Pay upon receiving and verifying item',
                    icon: Banknote,
                  },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-[#5E43F3] bg-[#5E43F3]/5 ring-1 ring-[#5E43F3]'
                          : 'border-theme-divider hover:border-theme-divider-strong bg-theme-surface'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#5E43F3] text-white'
                              : 'bg-theme-surface-hover text-theme-secondary'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-theme-primary">{m.name}</p>
                          <p className="text-[10px] text-theme-tertiary">{m.desc}</p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-[#5E43F3] bg-[#5E43F3]'
                            : 'border-theme-divider-strong bg-theme-surface'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-theme-surface" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-4 rounded-2xl bg-theme-base border border-theme-divider-light space-y-2">
              <div className="flex items-center justify-between text-xs text-theme-secondary">
                <span>Subtotal</span>
                <span>
                  {currencySymbol}
                  {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-theme-secondary">
                <span>Delivery & Logistics</span>
                <span>
                  {deliveryFee === 0 ? 'FREE' : `${currencySymbol}${deliveryFee.toLocaleString()}`}
                </span>
              </div>
              <div className="pt-2 border-t border-theme-divider flex items-center justify-between text-sm font-black text-theme-primary">
                <span>Total Amount</span>
                <span className="text-base text-[#5E43F3]">
                  {currencySymbol}
                  {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Buyer Protection Assurance */}
            <div className="flex items-center gap-2 text-theme-tertiary text-[11px] px-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Lazla Buyer Protection · 100% money-back guarantee</span>
            </div>
          </div>
        )}

        {/* Action Footer */}
        {!orderConfirmed && (
          <footer className="p-4 border-t border-theme-divider-light bg-theme-surface sticky bottom-0 z-10 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-theme-tertiary block">
                Total Due
              </span>
              <span className="text-lg font-black text-theme-primary truncate block">
                {currencySymbol}
                {grandTotal.toLocaleString()}
              </span>
            </div>

            <button
              id="btn-confirm-place-order"
              type="button"
              disabled={isSubmitting}
              onClick={handlePlaceOrder}
              className="py-3 px-6 rounded-2xl bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-98 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-[#5E43F3]/25 transition-all"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Place Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};
