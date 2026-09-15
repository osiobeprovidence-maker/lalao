import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  PackageX,
  History,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { CheckoutModal } from './CheckoutModal';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartCount,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    setIsShoppingHistoryOpen,
  } = useLalao();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isCartOpen) return null;

  const subtotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const currencySymbol =
    cart[0]?.product.currency === 'NGN'
      ? 'NGN '
      : cart[0]?.product.currency || '₦';

  return (
    <>
      <div
        id="cart-drawer-overlay"
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
        onClick={() => setIsCartOpen(false)}
      >
        <div
          id="cart-drawer-container"
          className="bg-white w-full sm:max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#5E43F3]/10 flex items-center justify-center text-[#5E43F3]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900 leading-tight">
                  Shopping Cart
                </h2>
                <p className="text-xs text-neutral-400">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                id="btn-cart-view-history"
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  setIsShoppingHistoryOpen(true);
                }}
                className="p-1.5 rounded-full text-neutral-500 hover:text-[#5E43F3] hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Shopping History"
                aria-label="Shopping history"
              >
                <History className="w-5 h-5" />
              </button>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-neutral-400 hover:text-rose-500 font-medium px-2 py-1 rounded-md transition-colors cursor-pointer"
                  title="Clear all items"
                >
                  Clear
                </button>
              )}
              <button
                id="btn-close-cart-drawer"
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
                <PackageX className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-neutral-800">Your cart is empty</h3>
              <p className="text-xs text-neutral-500 max-w-xs mt-1">
                Explore local products and merchandise from verified creators and stores in Delta State.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="py-2.5 px-6 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsShoppingHistoryOpen(true);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <History className="w-4 h-4" />
                  <span>Shopping History</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-neutral-100">
              {cart.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex gap-3">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover bg-neutral-100 shrink-0 border border-neutral-200"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-neutral-400 hover:text-rose-500 p-0.5 cursor-pointer transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.storeName && (
                        <p className="text-[10px] text-neutral-400 truncate">
                          {item.storeName}
                        </p>
                      )}

                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(item.selectedOptions).map(([key, val]) => (
                            <span
                              key={key}
                              className="text-[9px] font-semibold bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded"
                            >
                              {key}: {val}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-black text-neutral-950">
                        {currencySymbol}
                        {(item.product.price * item.quantity).toLocaleString()}
                      </span>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-neutral-200 rounded-lg bg-neutral-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 cursor-pointer active:scale-95"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-neutral-900 select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 cursor-pointer active:scale-95"
                          title="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cart Footer */}
          {cart.length > 0 && (
            <footer className="p-4 border-t border-neutral-100 bg-neutral-50/70 space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>Subtotal ({cartCount} items)</span>
                <span className="text-base font-black text-neutral-900">
                  {currencySymbol}
                  {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Verified stores with buyer escrow security</span>
              </div>

              <button
                id="btn-cart-checkout"
                type="button"
                onClick={() => {
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#5E43F3]/25 transition-all"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </footer>
          )}
        </div>
      </div>

      {/* Checkout Modal when proceeding from Cart */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          directBuyItem={null}
          onOrderSuccess={() => {
            setIsCheckoutOpen(false);
            setIsCartOpen(false);
          }}
        />
      )}
    </>
  );
};
