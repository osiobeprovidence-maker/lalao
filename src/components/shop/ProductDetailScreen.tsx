import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  Heart,
  Star,
  Plus,
  Minus,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Package,
  History,
} from 'lucide-react';
import { ShopProduct, Page } from '../../types';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { CheckoutModal } from './CheckoutModal';

interface ProductDetailScreenProps {
  product: ShopProduct;
  store?: Page | null;
  onClose: () => void;
  onSelectProduct?: (product: ShopProduct) => void;
  moreProducts?: ShopProduct[];
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product,
  store,
  onClose,
  onSelectProduct,
  moreProducts = [],
}) => {
  const {
    addToCart,
    isProductSaved,
    toggleSaveProduct,
    triggerShareToast,
    openChatWithUser,
    setIsCartOpen,
    setIsShoppingHistoryOpen,
    cartCount,
  } = useLalao();

  // Multi-image list
  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({});
  const [quantity, setQuantity] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Android hardware / gesture back button support
  useEffect(() => {
    window.history.pushState({ lazlaProductDetail: true }, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onClose]);

  const handleBack = () => {
    if (window.history.state?.lazlaProductDetail) {
      window.history.back();
    } else {
      onClose();
    }
  };

  // Initialize selected variants
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (product.variants) {
      product.variants.forEach((v) => {
        if (v.options && v.options.length > 0) {
          initial[v.name] = v.options[0];
        }
      });
    }
    return initial;
  });

  // Reset states when product changes
  useEffect(() => {
    setActiveImageIndex(0);
    setQuantity(1);
    const initial: Record<string, string> = {};
    if (product.variants) {
      product.variants.forEach((v) => {
        if (v.options && v.options.length > 0) {
          initial[v.name] = v.options[0];
        }
      });
    }
    setSelectedVariants(initial);
  }, [product.id]);

  const isSaved = isProductSaved(product.id);

  // Image swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 40 && activeImageIndex < images.length - 1) {
      // Swipe left -> next
      setActiveImageIndex((prev) => prev + 1);
    } else if (diff < -40 && activeImageIndex > 0) {
      // Swipe right -> prev
      setActiveImageIndex((prev) => prev - 1);
    }
    setTouchStartX(null);
  };

  const handleNextImage = () => {
    if (activeImageIndex < images.length - 1) {
      setActiveImageIndex((prev) => prev + 1);
    } else {
      setActiveImageIndex(0);
    }
  };

  const handlePrevImage = () => {
    if (activeImageIndex > 0) {
      setActiveImageIndex((prev) => prev - 1);
    } else {
      setActiveImageIndex(images.length - 1);
    }
  };

  const handleShare = async () => {
    const currencyStr =
      product.currency === 'NGN' ? 'NGN ' : product.currency || '₦';
    const formattedPrice = `${currencyStr}${product.price.toLocaleString()}`;
    const shareText = `Check out "${product.name}" (${formattedPrice}) on Lazla Shop!`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: window.location.href,
        });
        triggerShareToast('Product shared successfully!');
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText} - ${window.location.href}`);
      triggerShareToast('Product link copied to clipboard!');
    } else {
      triggerShareToast('Product link copied!');
    }
  };

  const handleAddToCart = () => {
    addToCart(
      product,
      quantity,
      Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined,
      store ? { id: store.id, name: store.name } : undefined
    );
  };

  const handleBuyNow = () => {
    setIsCheckoutOpen(true);
  };

  const handleVariantSelect = (variantName: string, optionValue: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [variantName]: optionValue,
    }));
  };

  const currencyLabel =
    product.currency === 'NGN' ? 'NGN ' : product.currency || '₦';
  const ratingScore = product.rating || 5.0;
  const reviewsCount = product.reviewsCount ?? 2;

  return (
    <div
      id="product-detail-page-screen"
      className="fixed inset-0 z-40 bg-white overflow-y-auto flex flex-col min-h-full animate-in fade-in duration-200"
    >
      {/* 1. TOP APP BAR */}
      <header
        id="product-page-header"
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center justify-between transition-all"
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            id="btn-back-to-shop"
            type="button"
            onClick={handleBack}
            className="p-2 rounded-full text-neutral-800 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer -ml-1.5 shrink-0"
            title="Back to Shop"
            aria-label="Back to Shop"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-neutral-900 truncate">
              {product.name}
            </h2>
            <p className="text-[11px] text-neutral-400 truncate">
              {store?.name || 'Lazla Shop'} · Delta State
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Shopping History Icon */}
          <button
            id="btn-product-view-history"
            type="button"
            onClick={() => setIsShoppingHistoryOpen(true)}
            className="p-2 rounded-full text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-colors cursor-pointer"
            title="Shopping History"
            aria-label="Shopping history"
          >
            <History className="w-5 h-5" />
          </button>

          {/* Cart Icon with badge */}
          <button
            id="btn-product-view-cart"
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-full text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-colors cursor-pointer"
            title="View Cart"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#5E43F3] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* Favorite / Wishlist */}
          <button
            id="btn-save-product"
            type="button"
            onClick={() => toggleSaveProduct(product.id)}
            className={`p-2 rounded-full active:scale-95 transition-colors cursor-pointer ${
              isSaved
                ? 'text-rose-500 hover:bg-rose-50'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
            title={isSaved ? 'Saved to Wishlist' : 'Save to Wishlist'}
            aria-label="Save product"
          >
            <Heart
              className={`w-5 h-5 ${
                isSaved ? 'fill-rose-500 text-rose-500' : 'stroke-[2]'
              }`}
            />
          </button>

          {/* Share */}
          <button
            id="btn-share-product"
            type="button"
            onClick={handleShare}
            className="p-2 rounded-full text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-colors cursor-pointer"
            title="Share product"
            aria-label="Share product"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN SCROLLABLE CONTENT */}
      <main className="flex-1 pb-32 max-w-4xl mx-auto w-full">
        {/* 1. PRODUCT IMAGE AREA */}
        <section
          id="product-image-carousel"
          className="relative w-full bg-neutral-100 overflow-hidden select-none"
        >
          {/* Main Display Image */}
          <div
            className="relative aspect-square sm:aspect-4/3 w-full bg-neutral-50 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {imageErrorMap[activeImageIndex] ? (
              <div className="flex flex-col items-center justify-center text-neutral-400 p-8 text-center">
                <Package className="w-16 h-16 stroke-[1.5] mb-2" />
                <p className="text-xs font-semibold text-neutral-500">Image unavailable</p>
              </div>
            ) : (
              <img
                src={images[activeImageIndex]}
                alt={`${product.name} - image ${activeImageIndex + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover sm:object-contain transition-all duration-300"
                onError={() => {
                  setImageErrorMap((prev) => ({ ...prev, [activeImageIndex]: true }));
                }}
              />
            )}

            {/* In-Stock / Out-of-Stock Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-md ${
                  product.inStock !== false
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-800 text-neutral-200'
                }`}
              >
                {product.inStock !== false ? 'In Stock' : 'Out of Stock'}
              </span>

              {product.category && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white shadow-md">
                  {product.category}
                </span>
              )}
            </div>

            {/* Image Counter Badge */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold shadow-md">
                {activeImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Navigation Arrows for desktop/click */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-neutral-800 flex items-center justify-center shadow-md cursor-pointer transition-all active:scale-95"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-neutral-800 flex items-center justify-center shadow-md cursor-pointer transition-all active:scale-95"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </>
            )}
          </div>

          {/* Multiple Image Thumbnails / Dot Indicators */}
          {images.length > 1 && (
            <div className="px-4 py-3 bg-white border-b border-neutral-100 flex items-center justify-center gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-[#5E43F3] ring-2 ring-[#5E43F3]/20 scale-105 shadow-sm'
                      : 'border-neutral-200 opacity-60 hover:opacity-100'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 2. PRODUCT INFORMATION */}
        <section className="p-4 sm:p-6 space-y-6">
          {/* Header Block: Title, Rating, Price */}
          <div className="space-y-3 border-b border-neutral-100 pb-5">
            {/* Product Title */}
            <h1
              id="product-title"
              className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight leading-tight"
            >
              {product.name}
            </h1>

            {/* Star Rating & Reviews */}
            <div id="product-rating-row" className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(ratingScore)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-neutral-200 text-neutral-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-neutral-600">
                {reviewsCount} {reviewsCount === 1 ? 'rating' : 'ratings'}
              </span>
            </div>

            {/* Product Price */}
            <div id="product-price-row" className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
                {currencyLabel}
                {product.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                VAT & taxes included
              </span>
            </div>
          </div>

          {/* Product Description */}
          <div id="product-description-section" className="space-y-2 border-b border-neutral-100 pb-5">
            <h3 className="text-base font-bold text-neutral-950">Description</h3>
            <div className="prose prose-sm text-neutral-700 leading-relaxed bg-neutral-50/70 p-4 rounded-2xl border border-neutral-100">
              <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed">
                {product.description ||
                  `The ${product.name} is a verified offering crafted for premium utility and style. Sourced and provided by ${store?.name || 'Lazla Verified Merchants'}. Order directly with doorstep courier delivery or instant local pickup in Delta State.`}
              </p>
            </div>
          </div>

          {/* 3. PRODUCT OPTIONS (Variants) */}
          {product.variants && product.variants.length > 0 && (
            <div id="product-variants-section" className="space-y-4 border-b border-neutral-100 pb-5">
              {product.variants.map((variant) => (
                <div key={variant.name} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-800">
                      Select {variant.name}:
                    </span>
                    <span className="font-semibold text-[#5E43F3]">
                      {selectedVariants[variant.name] || variant.options[0]}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((opt) => {
                      const isSelected = selectedVariants[variant.name] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleVariantSelect(variant.name, opt)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#5E43F3] text-white shadow-sm ring-2 ring-[#5E43F3]/25 scale-102'
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200/60'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 4. QUANTITY SELECTOR */}
          <div id="product-quantity-section" className="space-y-2 border-b border-neutral-100 pb-5">
            <span className="text-xs font-bold text-neutral-800 block">Quantity</span>
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center rounded-2xl border border-neutral-200 bg-neutral-50/80 p-1">
                <button
                  id="btn-decrease-qty"
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="w-10 h-10 rounded-xl bg-white hover:bg-neutral-100 active:scale-95 disabled:opacity-40 disabled:hover:bg-white text-neutral-800 flex items-center justify-center cursor-pointer shadow-xs transition-all"
                  title="Decrease quantity"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4 stroke-[2.5]" />
                </button>
                <span
                  id="quantity-display"
                  className="w-12 text-center text-sm font-black text-neutral-900 select-none"
                >
                  {quantity}
                </span>
                <button
                  id="btn-increase-qty"
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="w-10 h-10 rounded-xl bg-white hover:bg-neutral-100 active:scale-95 text-neutral-800 flex items-center justify-center cursor-pointer shadow-xs transition-all"
                  title="Increase quantity"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              <div className="text-xs text-neutral-500">
                Subtotal:{' '}
                <span className="font-bold text-neutral-900">
                  {currencyLabel}
                  {(product.price * quantity).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 5. ADD TO CART & BUY NOW BUTTONS (Inline for larger screens / normal flow) */}
          <div id="product-action-buttons" className="space-y-2.5 pt-1">
            {/* Primary Add to Cart Button */}
            <button
              id="btn-add-to-cart-primary"
              type="button"
              disabled={product.inStock === false}
              onClick={handleAddToCart}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-98 disabled:opacity-50 text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#5E43F3]/25 transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Add to cart</span>
            </button>

            {/* Secondary Buy Now Button */}
            <button
              id="btn-buy-now-secondary"
              type="button"
              disabled={product.inStock === false}
              onClick={handleBuyNow}
              className="w-full py-3.5 px-6 rounded-2xl bg-neutral-900 hover:bg-black active:scale-98 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Buy now</span>
            </button>
          </div>

          {/* 7. HIGHLIGHTS & PRODUCT DETAILS */}
          {product.details && product.details.length > 0 && (
            <div id="product-highlights-section" className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Specifications & Details
              </h3>
              <ul className="space-y-2">
                {product.details.map((detail, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-neutral-700"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#5E43F3] shrink-0 mt-1.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 8. STORE / SELLER PROFILE CARD */}
          {store && (
            <div
              id="product-store-profile-card"
              className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={store.avatar}
                    alt={store.name}
                    size="md"
                    className="ring-2 ring-white shadow-xs shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-neutral-900 truncate">
                        {store.name}
                      </span>
                      <Badge type={store.badge} size="sm" />
                    </div>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
                      {store.location} · {store.followersCount.toLocaleString()} followers
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-bold text-[#5E43F3] hover:underline shrink-0"
                >
                  View Store
                </button>
              </div>

              {/* Chat with merchant button */}
              <button
                type="button"
                onClick={() => {
                  const storeUser = {
                    id: `user_${store.id}`,
                    name: store.name,
                    username: store.username,
                    avatar: store.avatar,
                    bio: store.description,
                    location: store.location,
                    badge: 'BIZ' as const,
                    followersCount: store.followersCount,
                    followingCount: 0,
                    postsCount: 15,
                    distanceMeters: 750,
                    interests: [store.category],
                  };
                  openChatWithUser(storeUser);
                  triggerShareToast(
                    `Chat opened with ${store.name} regarding "${product.name}"`
                  );
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#5E43F3]" />
                <span>Message Seller about this Product</span>
              </button>
            </div>
          )}

          {/* 9. FULFILLMENT & ASSURANCE BADGES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-[#5E43F3] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-neutral-900">Doorstep Delivery</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Courier delivery across Delta State
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#5E43F3] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-neutral-900">Local Pickup</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Available in {store?.location || 'Delta State'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-neutral-900">Buyer Protection</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  100% authentic guarantee & returns
                </p>
              </div>
            </div>
          </div>

          {/* 10. REVIEWS BREAKDOWN */}
          <div id="product-reviews-card" className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Customer Ratings & Feedback
              </h3>
              <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {ratingScore.toFixed(1)} / 5.0
              </span>
            </div>

            <div className="space-y-2.5 bg-neutral-50/70 p-4 rounded-2xl border border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  KO
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-neutral-900">Kome O.</p>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    "Super soft and huge! Perfect for beach days at Abraka turf and picnics. The material is very durable."
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200/60 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#5E43F3] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  TM
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-neutral-900">Tega M.</p>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    "Quality is top notch, thick cotton with great stitching. Arrived fast via local dispatch."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 11. MORE FROM THIS STORE */}
          {moreProducts.length > 0 && onSelectProduct && (
            <div id="more-from-store-section" className="space-y-3 pt-4 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  More From {store?.name || 'This Store'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-bold text-[#5E43F3] hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {moreProducts
                  .filter((p) => p.id !== product.id)
                  .slice(0, 4)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectProduct(item);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group bg-white rounded-2xl border border-neutral-100 overflow-hidden cursor-pointer hover:shadow-md hover:border-neutral-200 transition-all flex flex-col"
                    >
                      <div className="aspect-square w-full bg-neutral-100 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <h5 className="text-xs font-bold text-neutral-900 line-clamp-1 group-hover:text-[#5E43F3] transition-colors">
                          {item.name}
                        </h5>
                        <p className="text-xs font-black text-neutral-950 mt-1">
                          {item.currency === 'NGN' ? 'NGN ' : item.currency || '₦'}
                          {item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* 12. STICKY BOTTOM QUICK ACTION BAR */}
      <footer
        id="product-sticky-bottom-bar"
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3 px-4 flex items-center gap-2 shadow-xl max-w-4xl mx-auto"
      >
        <div className="min-w-0 shrink-0 pr-1">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">
            Total
          </span>
          <span className="text-sm sm:text-base font-black text-neutral-950 truncate block">
            {currencyLabel}
            {(product.price * quantity).toLocaleString()}
          </span>
        </div>

        <button
          id="btn-sticky-add-to-cart"
          type="button"
          disabled={product.inStock === false}
          onClick={handleAddToCart}
          className="flex-1 py-3 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add to cart</span>
        </button>

        <button
          id="btn-sticky-buy-now"
          type="button"
          disabled={product.inStock === false}
          onClick={handleBuyNow}
          className="flex-1 py-3 px-3 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-95 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#5E43F3]/25"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span>Buy now</span>
        </button>
      </footer>

      {/* Direct Buy Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          directBuyItem={{
            product,
            quantity,
            options: Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined,
            store,
          }}
          onOrderSuccess={() => {
            setIsCheckoutOpen(false);
          }}
        />
      )}
    </div>
  );
};
