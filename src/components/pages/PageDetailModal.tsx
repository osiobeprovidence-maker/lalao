import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  MapPin,
  Phone,
  Globe,
  Clock,
  Share2,
  Plus,
  Check,
  ShoppingBag,
  MessageSquare,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Star,
  History,
  Ticket,
  Trophy,
  Sparkles,
  Calendar,
  Gamepad2,
  Users,
  Award,
  Shield,
  MoreVertical,
  Edit3,
  BarChart3,
  Coins,
  Settings,
  PlusSquare,
  QrCode,
  Trash2,
  ExternalLink,
  Mail,
  UserCheck,
  Flag,
  BellOff,
  Copy,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { PostItem } from '../feed/PostItem';
import { OrgEvent, ShopProduct } from '../../types';
import { ProductDetailScreen } from '../shop/ProductDetailScreen';
import { EventCard } from '../events/EventCard';
import { HOK_MEDIA_GALLERY, HOK_ORGANIZATION_PAGE } from '../../data/honorOfKingsData';
import { isPageTicketingEligible } from '../../utils/pageCapabilities';
import { EditPageModal } from './EditPageModal';
import { PageMonetizationModal } from './PageMonetizationModal';
import { PageAnalyticsModal } from './PageAnalyticsModal';
import { PageSettingsModal } from './PageSettingsModal';
import { PageEventModal } from './PageEventModal';
import { EventAttendeesModal } from './EventAttendeesModal';
import { PageManageProductsModal } from './PageManageProductsModal';
import { PagePostComposerModal } from './PagePostComposerModal';
import { PageToolsModal } from './PageToolsModal';

type PageTab = 'posts' | 'shop' | 'media' | 'events' | 'about';

export const PageDetailModal: React.FC = () => {
  const {
    pages,
    currentPage,
    activePageId,
    setActivePageId,
    pageProducts,
    toggleFollowPage,
    posts,
    triggerShareToast,
    openChatWithUser,
    cartCount,
    setIsCartOpen,
    setIsShoppingHistoryOpen,
    events,
    setIsMyTicketsOpen,
    activeTicketsCount,
    updatePage,
  } = useLalao();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<PageTab>('posts');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [eventFilter, setEventFilter] = useState<'all' | 'tournaments' | 'community' | 'completed'>('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Management modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMonetizationOpen, setIsMonetizationOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isManageProductsOpen, setIsManageProductsOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<OrgEvent | null>(null);
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState<OrgEvent | null>(null);
  const [isPostComposerOpen, setIsPostComposerOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close 3-dot dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (activePageId) {
      containerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
      setActiveTab('posts');
      setSelectedCategory('All');
      setSelectedProduct(null);
      setIsMenuOpen(false);
    }
  }, [activePageId]);

  if (!activePageId) return null;

  // Use the definitive currentPage from Convex. If it's undefined, it's loading.
  if (currentPage === undefined && activePageId !== 'page_honorofkings') {
    return (
      <div className="flex w-full h-full min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#5E43F3]/30 border-t-[#5E43F3] animate-spin" />
      </div>
    );
  }

  const page =
    activePageId === 'page_honorofkings' ? HOK_ORGANIZATION_PAGE : currentPage;
    
  if (!page) {
    return (
      <div className="flex w-full h-full min-h-[50vh] flex-col items-center justify-center bg-[#f6f3ee]">
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Page Not Found</h2>
        <p className="text-neutral-500 mb-6">This page may have been deleted or doesn't exist.</p>
        <button
          onClick={() => navigate('/app')}
          className="px-6 py-2.5 bg-neutral-900 text-white rounded-full font-bold hover:bg-black transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Use Convex's authoritative isOwner flag for management mode
  const isManager = Boolean(page.isOwner);

  // Check if page has BIZ tag
  const isBizPage = page.badge === 'BIZ' || page.type === 'business';
  // Check if page is eligible for ticketing (Community, Club, Esports Org, etc.)
  const isTicketingEligible = isPageTicketingEligible(page);

  const products: ShopProduct[] = pageProducts || [];

  const categories = [
    'All',
    ...Array.from(
      new Set(products.map((p) => p.category).filter(Boolean) as string[])
    ),
  ];

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const hasEvents = Boolean(
    (Array.isArray(page.events) && page.events.length > 0) ||
      (events || []).some((e) => e?.pageId === page.id) ||
      page.id === 'page_honorofkings' ||
      page.type === 'organization' ||
      page.type === 'community' ||
      page.type === 'club'
  );

  let tabs: { id: PageTab; label: string }[] = [];
  if (isBizPage && hasEvents) {
    tabs = [
      { id: 'posts', label: 'Posts' },
      { id: 'shop', label: 'Shop' },
      { id: 'events', label: 'Events' },
      { id: 'media', label: 'Media' },
      { id: 'about', label: 'About' },
    ];
  } else if (hasEvents) {
    tabs = [
      { id: 'posts', label: 'Posts' },
      { id: 'media', label: 'Media' },
      { id: 'events', label: 'Events' },
      { id: 'about', label: 'About' },
    ];
  } else if (isBizPage) {
    tabs = [
      { id: 'posts', label: 'Posts' },
      { id: 'shop', label: 'Shop' },
      { id: 'media', label: 'Media' },
      { id: 'about', label: 'About' },
    ];
  } else {
    tabs = [
      { id: 'posts', label: 'Posts' },
      { id: 'media', label: 'Media' },
      { id: 'about', label: 'About' },
    ];
  }

  // Filter posts belonging to this page
  // Instead of guessing by name/username, use pageRefId or exact author id
  const pagePosts = (posts || []).filter(
    (p) =>
      p?.author?.id === page.id ||
      p?.pageRefId === page.id ||
      p?.author?.username === page.username
  );
  const pageMediaPosts = pagePosts.filter((p) => Boolean(p?.mediaUrl));

  // If a product is selected, render the dedicated full Product Detail Page
  if (selectedProduct) {
    return (
      <ProductDetailScreen
        product={selectedProduct}
        store={page}
        onClose={() => setSelectedProduct(null)}
        onSelectProduct={(p) => setSelectedProduct(p)}
        moreProducts={products}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      id="page-detail-screen"
      className="w-full bg-transparent animate-in fade-in duration-200"
    >
      <div className="w-full min-h-full flex flex-col bg-[#f6f3ee] pb-24">
        {/* Cover Photo Area with Back Button & Action Controls */}
        <div className={`relative h-44 sm:h-56 w-full shrink-0 ${page.coverImage ? 'bg-neutral-900' : 'bg-gradient-to-tr from-[#5E43F3]/10 to-[#f6f3ee]'}`}>
          {page.coverImage && (
            <>
              <img
                src={page.coverImage}
                alt={page.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/30 pointer-events-none" />
            </>
          )}

          {/* Top Bar with Back, Badges, Cart and Share/More Menu */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <button
              id="btn-back-page-detail"
              type="button"
              onClick={() => {
                setActivePageId(null);
                navigate('/app');
              }}
              className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 active:scale-95 transition-all cursor-pointer shadow-md"
              title="Go back"
              aria-label="Go back"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="flex items-center gap-2">
              {isBizPage && (
                <>
                  <button
                    id="btn-biz-page-history-open"
                    type="button"
                    onClick={() => setIsShoppingHistoryOpen(true)}
                    className="relative p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 active:scale-95 transition-all cursor-pointer shadow-md"
                    title="Shopping History"
                    aria-label="Shopping history"
                  >
                    <History className="w-4 h-4 stroke-[2]" />
                  </button>

                  <button
                    id="btn-biz-page-cart-open"
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 active:scale-95 transition-all cursor-pointer shadow-md"
                    title="View Shopping Cart"
                    aria-label="View Shopping Cart"
                  >
                    <ShoppingBag className="w-4 h-4 stroke-[2]" />
                    {cartCount > 0 && (
                      <span
                        id="badge-biz-page-cart-count"
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#5E43F3] text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white"
                      >
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </button>
                </>
              )}

              <Badge type={page.badge} size="md" />
            </div>
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="px-4 sm:px-6 pb-3">
          {/* Avatar */}
          <div className="relative shrink-0 w-max -mt-10 sm:-mt-12 mb-3.5 z-10">
            <Avatar
              src={page?.avatar}
              alt={page?.name || 'Page'}
              size="xl"
              className="ring-4 ring-[#f6f3ee] shadow-md bg-white"
            />
          </div>

          {/* Title & Metadata */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-neutral-950 tracking-tight">{page.name}</h2>
              <Badge type={page.badge} />

              {/* Manager Perspective Indicator */}
              {isManager && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-violet-100 text-[#5E43F3] border border-violet-200">
                  Manager View
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 font-medium">
              @{page.username}
            </p>

            {/* Category Label Row */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-neutral-900 text-white shadow-xs">
                {page.id === 'page_honorofkings' || page.category === 'ESPORTS / GAMING'
                  ? 'ESPORTS'
                  : page.type === 'business' || page.badge === 'BIZ'
                  ? 'BUSINESS'
                  : page.category || page.type.toUpperCase()}
              </span>
              {page.location && (
                <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{page.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Page Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2 relative" ref={menuRef}>
            {isManager ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-neutral-900 text-white hover:bg-black text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Page</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMonetizationOpen(true)}
                  className="px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Coins className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Monetize</span>
                </button>
              </>
            ) : (
              <>
                <button
                  id={`btn-follow-page-detail-${page.id}`}
                  onClick={() => toggleFollowPage(page.id)}
                  className={`px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    page.isFollowing
                      ? 'border border-neutral-300 text-neutral-800 hover:bg-neutral-100 bg-white'
                      : 'bg-[#5E43F3] text-white hover:bg-[#4E34E0] shadow-sm shadow-[#5E43F3]/25'
                  }`}
                >
                  {page.isFollowing ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      Following
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      Follow
                    </>
                  )}
                </button>
                {page.aboutInfo?.phone && (
                  <button
                    type="button"
                    onClick={() => triggerShareToast(`Connecting to ${page.name}...`)}
                    className="p-2 rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-100 bg-white transition-colors cursor-pointer"
                    title="Direct inquiry"
                  >
                    <MessageSquare className="w-4 h-4 text-[#5E43F3]" />
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => triggerShareToast('Page link copied to clipboard')}
              className="p-2 rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-100 bg-white transition-colors cursor-pointer"
              title="Share page"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* 3-Dot Menu Dropdown */}
            <div>
              <button
                type="button"
                id="btn-page-header-more"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 rounded-full border border-neutral-200 transition-all cursor-pointer shadow-sm ${
                  isMenuOpen
                    ? 'bg-neutral-100 text-neutral-950'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
                title="More actions"
                aria-label="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 top-12 w-56 bg-white rounded-2xl shadow-2xl border border-neutral-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {isManager ? (
                    /* MANAGER ACTIONS MENU */
                    <div className="divide-y divide-neutral-100">
                      <div className="px-3.5 py-2 bg-neutral-50/70">
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#5E43F3]">
                          Page Manager Tools
                        </p>
                        <p className="text-[11px] text-neutral-500 font-medium truncate">
                          Managing @{page.username}
                        </p>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsEditModalOpen(true);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4 text-[#5E43F3]" />
                          <span>Edit Page Profile</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsPostComposerOpen(true);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <PlusSquare className="w-4 h-4 text-[#5E43F3]" />
                          <span>Create New Post</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setEventToEdit(null);
                            setIsEventModalOpen(true);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Calendar className="w-4 h-4 text-[#5E43F3]" />
                          <span>Create / Manage Events</span>
                        </button>

                        {(isBizPage || page.monetization?.sellProducts) && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsManageProductsOpen(true);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-2.5 cursor-pointer"
                          >
                            <ShoppingBag className="w-4 h-4 text-[#5E43F3]" />
                            <span>Manage Products / Shop</span>
                          </button>
                        )}
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMonetizationOpen(true);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Coins className="w-4 h-4 text-emerald-600" />
                          <span>Monetize Page & Payouts</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsAnalyticsOpen(true);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <BarChart3 className="w-4 h-4 text-blue-600" />
                          <span>Page Analytics</span>
                        </button>
                      </div>

                      <div className="py-1">
                        <div className="px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-400">Tools</div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsToolsModalOpen(true);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Briefcase className="w-4 h-4 text-[#5E43F3]" />
                          <span>Business Tools</span>
                        </button>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsSettingsOpen(true);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-neutral-600" />
                          <span>Page Settings</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* PUBLIC VISITOR ACTIONS MENU */
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          triggerShareToast('Page link copied to clipboard!');
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Copy className="w-4 h-4 text-neutral-500" />
                        <span>Copy Page Link</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          triggerShareToast('Page notifications muted');
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <BellOff className="w-4 h-4 text-neutral-500" />
                        <span>Mute Updates</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          triggerShareToast('Report submitted for moderation review');
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Flag className="w-4 h-4 text-red-500" />
                        <span>Report Page</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-neutral-700 mt-4 leading-relaxed">
            {page.description}
          </p>

          {/* Location & Follower Count */}
          <div className="flex items-center gap-3 text-xs text-neutral-500 mt-3 pt-2.5 border-t border-neutral-100">
            <span className="font-semibold text-neutral-800">
              {page.id === 'page_honorofkings'
                ? '125K'
                : page.followersCount.toLocaleString()}{' '}
              followers
            </span>
            {page.location && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#5E43F3]" />
                  {page.location}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Sub-Tabs: Posts | Shop (if BIZ) | Events | Media | About */}
        <div
          id="page-subtabs-bar"
          className="sticky top-0 bg-[#f6f3ee]/95 backdrop-blur-md border-b border-neutral-200/80 flex items-center justify-around px-2 z-10 mb-6"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`btn-page-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-center text-xs font-bold transition-all relative flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === tab.id ? 'text-neutral-950' : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              {tab.id === 'shop' && <ShoppingBag className="w-3.5 h-3.5 text-[#5E43F3]" />}
              {tab.id === 'events' && <Calendar className="w-3.5 h-3.5 text-[#5E43F3]" />}
              <span>{tab.label}</span>
              {tab.id === 'shop' && products.length > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.2 bg-[#5E43F3]/10 text-[#5E43F3] rounded-full">
                  {products.length}
                </span>
              )}
              {tab.id === 'events' && (
                <span className="text-[10px] font-black px-1.5 py-0.2 bg-[#5E43F3]/10 text-[#5E43F3] rounded-full">
                  {(events || []).filter((e) => e?.pageId === page.id || page.id === 'page_honorofkings').length}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#5E43F3] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Views */}
        <div>
          {/* TAB: POSTS */}
          {activeTab === 'posts' && (
            <div>
              {/* If manager, show quick composer banner */}
              {isManager && (
                <div className="p-3.5 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between gap-3">
                  <div
                    onClick={() => setIsPostComposerOpen(true)}
                    className="flex-1 bg-white border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-400 hover:text-neutral-600 hover:border-neutral-300 transition-all cursor-pointer"
                  >
                    Post an announcement or update as {page.name}...
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPostComposerOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Create Post</span>
                  </button>
                </div>
              )}

              <div className="divide-y divide-neutral-100">
                {pagePosts.length > 0 ? (
                  pagePosts.map((post) => <PostItem key={post.id} post={post} />)
                ) : (
                  <div className="p-10 text-center space-y-3">
                    <p className="text-xs text-neutral-400">
                      No posts from this page yet.
                    </p>
                    {isManager && (
                      <button
                        type="button"
                        onClick={() => setIsPostComposerOpen(true)}
                        className="px-4 py-2 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Publish First Post</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: SHOP */}
          {activeTab === 'shop' && (
            <div id="page-shop-section" className="p-3 sm:p-4 space-y-4">
              {/* Storefront Overview Card */}
              <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">
                      {page.name} Storefront
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Official shop catalog · Local pickup & delivery in {page.location}
                    </p>
                  </div>
                </div>

                {isManager ? (
                  <button
                    type="button"
                    onClick={() => setIsManageProductsOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Manage Shop</span>
                  </button>
                ) : (
                  <Badge type="BIZ" size="sm" />
                )}
              </div>

              {/* Category Filter Chips */}
              {categories.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-neutral-950 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Products Grid */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {filteredProducts.map((prod) => (
                    <div
                      key={prod.id}
                      id={`product-card-${prod.id}`}
                      onClick={() => setSelectedProduct(prod)}
                      className="group bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-md transition-all flex flex-col cursor-pointer active:scale-[0.99]"
                    >
                      <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                              prod.inStock !== false
                                ? 'bg-emerald-600 text-white'
                                : 'bg-neutral-800/80 text-white backdrop-blur-xs'
                            }`}
                          >
                            {prod.inStock !== false ? 'In Stock' : 'Sold Out'}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                        <div>
                          {prod.category && (
                            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                              {prod.category}
                            </span>
                          )}
                          <h5 className="text-xs font-bold text-neutral-900 line-clamp-2 leading-snug">
                            {prod.name}
                          </h5>

                          {prod.rating && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{prod.rating.toFixed(1)}</span>
                              {prod.reviewsCount !== undefined && (
                                <span className="text-neutral-400 font-normal">
                                  ({prod.reviewsCount})
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-neutral-50">
                          <span className="text-xs sm:text-sm font-black text-neutral-950">
                            {prod.currency === 'NGN' ? 'NGN ' : prod.currency || '₦'}
                            {prod.price.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(prod);
                            }}
                            className="p-1.5 rounded-full bg-neutral-100 text-neutral-700 hover:bg-[#5E43F3] hover:text-white transition-colors cursor-pointer"
                            title="View product details"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-neutral-400" />
                  </div>
                  {isManager ? (
                    <>
                      <h4 className="text-sm font-bold text-neutral-900">Your shop is empty</h4>
                      <p className="text-xs text-neutral-500 max-w-[200px]">Add your first product to start selling from your Page.</p>
                      <button 
                        onClick={() => setIsManageProductsOpen(true)}
                        className="mt-2 px-4 py-2 bg-[#5E43F3] text-white text-xs font-bold rounded-xl"
                      >
                        Add Product
                      </button>
                    </>
                  ) : (
                    <>
                      <h4 className="text-sm font-bold text-neutral-900">No products yet</h4>
                      <p className="text-xs text-neutral-500 max-w-[200px]">This Page hasn't listed any products yet.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-neutral-400 text-xs">
                  No products in this category yet.
                </div>
              )}
            </div>
          )}

          {/* TAB: EVENTS */}
          {activeTab === 'events' && (
            <div id="page-events-section" className="p-3 sm:p-4 space-y-4">
              {/* Feature Banner */}
              <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-[#5E43F3]/30 rounded-2xl p-4 text-white border border-neutral-800 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
                      <Trophy className="w-3 h-3" />
                      <span>
                        {page.type === 'club'
                          ? 'Club Matches & Cups'
                          : page.type === 'community'
                          ? 'Community Gathering'
                          : 'Official Events'}
                      </span>
                    </div>
                    <h3 className="text-base font-black tracking-tight text-white">
                      {page.name} Events & Showcases
                    </h3>
                    <p className="text-xs text-neutral-300 mt-1 max-w-md">
                      Participate in meetups, tournaments, purchase ticket passes, and verify attendance via QR check-in.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {isManager ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEventToEdit(null);
                          setIsEventModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5E43F3] text-white text-xs font-black hover:bg-[#4E34E0] active:scale-95 transition-all cursor-pointer shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Create Event</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsMyTicketsOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-neutral-900 text-xs font-black hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer shadow-md"
                      >
                        <Ticket className="w-3.5 h-3.5 text-[#5E43F3]" />
                        <span>My Passes ({activeTicketsCount})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Event Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {(
                  [
                    { id: 'all', label: 'All Events' },
                    { id: 'tournaments', label: 'Tournaments' },
                    { id: 'community', label: 'Community' },
                    { id: 'completed', label: 'Completed' },
                  ] as const
                ).map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setEventFilter(filter.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      eventFilter === filter.id
                        ? 'bg-neutral-950 text-white shadow-sm'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Events List */}
              {(() => {
                const pageEvents = (events || []).filter(
                  (ev) => ev?.pageId === page.id || page.id === 'page_honorofkings'
                );
                const filtered = pageEvents.filter((ev) => {
                  if (eventFilter === 'tournaments')
                    return ev.type === 'tournament' && ev.registrationStatus !== 'completed';
                  if (eventFilter === 'community')
                    return (
                      (ev.type === 'community' || ev.type === 'live') &&
                      ev.registrationStatus !== 'completed'
                    );
                  if (eventFilter === 'completed')
                    return ev.registrationStatus === 'completed';
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-100 text-neutral-500 text-xs space-y-2">
                      <Calendar className="w-8 h-8 text-neutral-300 mx-auto" />
                      <p className="font-bold text-neutral-700">No events found</p>
                      <p className="text-[11px] text-neutral-400">
                        No events match the selected category.
                      </p>
                      {isManager && (
                        <button
                          type="button"
                          onClick={() => {
                            setEventToEdit(null);
                            setIsEventModalOpen(true);
                          }}
                          className="mt-2 px-4 py-2 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Publish First Event</span>
                        </button>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                    {filtered.map((event, idx) => {
                      const isFeatured = idx === 0 && (event.isTournament || filtered.length > 2);
                      return (
                        <div key={event.id} className="space-y-2">
                          <EventCard event={event} featured={isFeatured} />
                          {/* Manager Quick Controls for this Event */}
                          {isManager && (
                            <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between text-xs">
                              <span className="text-[11px] font-bold text-neutral-500">
                                Event Manager:
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedEventForAttendees(event)}
                                  className="px-2.5 py-1 rounded-lg bg-violet-100 hover:bg-violet-200 text-[#5E43F3] text-[11px] font-bold cursor-pointer flex items-center gap-1"
                                >
                                  <Users className="w-3 h-3" />
                                  <span>Attendees</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEventToEdit(event);
                                    setIsEventModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-[11px] font-bold cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deletePageEvent(event.id)}
                                  className="p-1 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                  title="Cancel / delete event"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: MEDIA */}
          {activeTab === 'media' && (
            <div className="p-3 sm:p-4 space-y-4">
              {page.id === 'page_honorofkings' && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500">
                      Official Highlights & Gallery
                    </h4>
                    <span className="text-[11px] font-semibold text-[#5E43F3]">
                      {HOK_MEDIA_GALLERY.length} Media
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {HOK_MEDIA_GALLERY.map((item) => (
                      <div
                        key={item.id}
                        className="group relative aspect-4/3 rounded-xl overflow-hidden bg-neutral-900 shadow-sm border border-neutral-100"
                      >
                        <img
                          src={item.url}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                        <div className="absolute bottom-2 left-2 right-2 text-white pointer-events-none">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#5E43F3] text-white mb-0.5">
                            {item.category}
                          </span>
                          <p className="text-[11px] font-bold truncate leading-tight">
                            {item.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pageMediaPosts.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 mb-2.5">
                    Feed Posts Media
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {pageMediaPosts.map((post) => (
                      <div
                        key={post.id}
                        className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 border border-neutral-100"
                      >
                        <img
                          src={post.mediaUrl}
                          alt="Page media"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {page.id !== 'page_honorofkings' && pageMediaPosts.length === 0 && (
                <div className="p-8 text-center text-neutral-400 text-xs">
                  No media uploaded yet.
                </div>
              )}
            </div>
          )}

          {/* TAB: ABOUT */}
          {activeTab === 'about' && (
            <div className="p-4 sm:p-5 space-y-4 text-xs">
              {/* Organization Description */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-extrabold text-neutral-900 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#5E43F3]" />
                    About the Organization
                  </h4>
                  {isManager && (
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="text-xs font-bold text-[#5E43F3] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
                <p className="text-neutral-700 leading-relaxed text-xs sm:text-[13px]">
                  {page.description}
                </p>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 text-center">
                  <p className="text-base sm:text-lg font-black text-neutral-900">
                    {page.followersCount || 1}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-neutral-400 mt-0.5">Followers</p>
                </div>
                <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 text-center">
                  <p className="text-base sm:text-lg font-black text-[#5E43F3]">
                    {(events || []).filter((e) => e?.pageId === page.id || page.id === 'page_honorofkings').length}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-neutral-400 mt-0.5">Events</p>
                </div>
                {page.aboutInfo?.founded && (
                  <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 text-center">
                    <p className="text-base sm:text-lg font-black text-amber-600">
                      {page.aboutInfo.founded}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-neutral-400 mt-0.5">Est. Year</p>
                  </div>
                )}
                <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 text-center">
                  <p className="text-base sm:text-lg font-black text-emerald-600">
                    Verified
                  </p>
                  <p className="text-[10px] uppercase font-bold text-neutral-400 mt-0.5">Status</p>
                </div>
              </div>

              {/* Location & Details */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 space-y-3">
                <h4 className="font-extrabold text-neutral-900 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#5E43F3]" />
                  Location & Operating Hours
                </h4>
                {page.aboutInfo?.address && (
                  <div>
                    <p className="font-bold text-neutral-900 text-xs">Physical Address / Venue</p>
                    <p className="text-neutral-600 mt-0.5">{page.aboutInfo.address}</p>
                  </div>
                )}
                {page.aboutInfo?.hours && (
                  <div>
                    <p className="font-bold text-neutral-900 text-xs">Operating Hours</p>
                    <p className="text-neutral-600 mt-0.5">{page.aboutInfo.hours}</p>
                  </div>
                )}
              </div>

              {/* Contact & Social Links */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 space-y-2.5">
                <h4 className="font-extrabold text-neutral-900 text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#5E43F3]" />
                  Official Contact & Channels
                </h4>
                {page.aboutInfo?.website && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Website</span>
                    <a
                      href={`https://${page.aboutInfo.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#5E43F3] font-bold hover:underline flex items-center gap-1"
                    >
                      <span>{page.aboutInfo.website}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {page.aboutInfo?.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Email</span>
                    <span className="text-neutral-900 font-bold">{page.aboutInfo.email}</span>
                  </div>
                )}
                {page.aboutInfo?.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Phone Desk</span>
                    <span className="text-neutral-900 font-bold">{page.aboutInfo.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Lao Line Handle</span>
                  <span className="text-neutral-900 font-bold">@{page.username}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {isEditModalOpen && (
        <EditPageModal
          page={page}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {isMonetizationOpen && (
        <PageMonetizationModal
          page={page}
          isOpen={isMonetizationOpen}
          onClose={() => setIsMonetizationOpen(false)}
          onOpenManageProducts={() => setIsManageProductsOpen(true)}
          onOpenCreateEvent={() => {
            setEventToEdit(null);
            setIsEventModalOpen(true);
          }}
        />
      )}

      {isAnalyticsOpen && (
        <PageAnalyticsModal
          page={page}
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <PageSettingsModal
          page={page}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isEventModalOpen && (
        <PageEventModal
          page={page}
          eventToEdit={eventToEdit}
          isOpen={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false);
            setEventToEdit(null);
          }}
        />
      )}

      {selectedEventForAttendees && (
        <EventAttendeesModal
          event={selectedEventForAttendees}
          isOpen={Boolean(selectedEventForAttendees)}
          onClose={() => setSelectedEventForAttendees(null)}
        />
      )}

      {isManageProductsOpen && (
        <PageManageProductsModal
          page={page}
          isOpen={isManageProductsOpen}
          onClose={() => setIsManageProductsOpen(false)}
        />
      )}

      {isPostComposerOpen && (
        <PagePostComposerModal
          page={page}
          isOpen={isPostComposerOpen}
          onClose={() => setIsPostComposerOpen(false)}
        />
      )}

      {isToolsModalOpen && (
        <PageToolsModal
          page={page}
          isOpen={isToolsModalOpen}
          onClose={() => setIsToolsModalOpen(false)}
        />
      )}
    </div>
  );
};
