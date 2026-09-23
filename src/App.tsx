// @ts-nocheck
import React, { useRef, useEffect } from 'react';
import { LalaoProvider, useLalao } from './context/LalaoContext';
import { Header } from './components/navigation/Header';
import { BottomNav } from './components/navigation/BottomNav';
import { DesktopSidebar } from './components/navigation/DesktopSidebar';
import { HomeFeed } from './components/feed/HomeFeed';
import { DiscoverView } from './components/discover/DiscoverView';
import { MessagesView } from './components/messages/MessagesView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { CreatePageView } from './components/pages/CreatePageView';
import { ProfileView } from './components/profile/ProfileView';

// Modals, Sheets, and Full-Page Subviews
import { LocationRadiusModal } from './components/location/LocationRadiusModal';
import { PostComposer } from './components/create/PostComposer';
import { RallyComposerModal } from './components/create/RallyComposerModal';
import { CreateCycleModal } from './components/cycles/CreateCycleModal';
import { CycleStoryViewerModal } from './components/cycles/CycleStoryViewerModal';
import { CycleDetailModal } from './components/cycles/CycleDetailModal';
import { PageDetailModal } from './components/pages/PageDetailModal';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { SettingsPageView } from './components/profile/SettingsPageView';
import { CommentsModal } from './components/common/CommentsModal';
import { NotificationsModal } from './components/common/NotificationsModal';
import { AuthPromptModal } from './components/common/AuthPromptModal';
import { PermissionPromptModal } from './components/permissions/PermissionPromptModal';
import { DevicePermissionsModal } from './components/permissions/DevicePermissionsModal';
import { CartDrawer } from './components/shop/CartDrawer';
import { ShoppingHistoryScreen } from './components/shop/ShoppingHistoryScreen';
import { OrderDetailModal } from './components/shop/OrderDetailModal';
import { EventDetailModal } from './components/events/EventDetailModal';
import { TournamentRegisterModal } from './components/events/TournamentRegisterModal';
import { TicketPurchaseModal } from './components/tickets/TicketPurchaseModal';
import { DigitalTicketModal } from './components/tickets/DigitalTicketModal';
import { MyTicketsModal } from './components/tickets/MyTicketsModal';
import { WalletModal } from './components/wallet/WalletModal';
import { MySubscriptionsModal } from './components/subscriptions/MySubscriptionsModal';
import { Check, Plus } from 'lucide-react';

// Router
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

/**
 * ProtectedRoute � redirects to /onboarding/welcome when the user is not
 * authenticated. Shows a spinner while the auth state is being resolved.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1877F2]">
        <div className="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/onboarding/welcome" replace />;
  return <>{children}</>;
};

/**
 * AdminRoute — redirects to /app when the user is not a super_admin.
 * Shows a spinner while checking.
 */
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const role = useQuery(api.admin.getMyRole);
  
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('lalao_admin_token') : null;
  const isSessionValid = useQuery(api.admin.verifyAdminSession, token ? { token } : "skip");

  if (isAuthLoading || role === undefined || (token && isSessionValid === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <div className="w-8 h-8 rounded-full border-4 border-white/30 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  const isAdminAccount = role === 'super_admin' || role === 'admin' || role === 'editor';

  if (!isAuthenticated || !isAdminAccount || !token || !isSessionValid) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { OTPVerifyPage } from './pages/auth/OTPVerifyPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Onboarding pages
import { WelcomePage } from './pages/onboarding/WelcomePage';
import { NameSetupPage } from './pages/onboarding/NameSetupPage';
import { ProfileSetupPage } from './pages/onboarding/ProfileSetupPage';
import { PronounsPage } from './pages/onboarding/PronounsPage';
import { LocationSetupPage } from './pages/onboarding/LocationSetupPage';
import { InterestsPage } from './pages/onboarding/InterestsPage';
import { CompletePage } from './pages/onboarding/CompletePage';

// Admin page
import { AdminApp } from './pages/admin/AdminApp';

const LalaoAppContent: React.FC = () => {
  const {
    activeTab,
    shareToast,
    isCreateCycleOpen,
    setIsCreateCycleOpen,
    isShoppingHistoryOpen,
    setIsShoppingHistoryOpen,
    selectedOrderForDetail,
    setSelectedOrderForDetail,
    setIsCreateSheetOpen,
    posts,
    pages,
    currentUser,
    activePageId,
    setActivePageId,
  } = useLalao();
  const mainRef = useRef<HTMLElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname.startsWith('/app/page/')) {
      const pageId = location.pathname.split('/app/page/')[1];
      if (pageId && activePageId !== pageId) {
        setActivePageId(pageId);
      }
    } else if (activePageId) {
      setActivePageId(null);
    }
  }, [location.pathname]);

  const platformSettings = useQuery(api.platformSettings.getBrandingSettings);

  useEffect(() => {
    if (platformSettings?.faviconUrl) {
      const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/png';
      link.rel = 'icon';
      link.href = platformSettings.faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [platformSettings?.faviconUrl]);

  useEffect(() => {
    if (activePageId && !location.pathname.startsWith(`/app/page/${activePageId}`)) {
      navigate(`/app/page/${activePageId}`);
    } else if (!activePageId && location.pathname.startsWith('/app/page/')) {
      navigate('/app');
    }
  }, [activePageId]);

  const followingPosts = posts.filter(
    (post) => post.author.isFollowing || post.author.id === currentUser.id || (post.pageRefId && pages.some((page) => page.id === post.pageRefId && page.isFollowing))
  );
  const savedPosts = posts.filter((post) => post.isReposted || post.isLiked);
  const likedPosts = posts.filter((post) => post.isLiked);

  const renderListPage = (title: string, subtitle: string, items: Array<{ id: string; title: string; meta: string; accent?: string }>, emptyText: string) => (
    <div className="mx-auto w-full max-w-[680px] px-4 py-6">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-neutral-200/80 pb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5E43F3]">Lalao</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-neutral-950">{title}</h1>
        </div>
        <div className="rounded-full bg-[#5E43F3]/10 px-2.5 py-1 text-[10px] font-bold text-[#5E43F3]">
          {items.length}
        </div>
      </div>

      <p className="mb-5 text-sm text-neutral-600">{subtitle}</p>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 border-b border-neutral-200/80 pb-3 last:border-b-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-neutral-900">{item.title}</p>
                <p className="mt-1 text-[11px] text-neutral-500">{item.meta}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${item.accent ?? 'bg-neutral-900 text-white'}`}>
                {item.title.split(' ')[0] || 'Lalao'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 text-sm text-neutral-600">
          <p className="leading-relaxed">{emptyText}</p>
        </div>
      )}
    </div>
  );

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-neutral-900 flex justify-center selection:bg-[#5E43F3]/20 selection:text-[#5E43F3]">
      <div className="w-full max-w-[1480px] min-h-screen lg:grid lg:grid-cols-[220px_minmax(0,1fr)_260px] bg-[#f6f3ee]">
        <DesktopSidebar />

        <div className="relative min-w-0 flex min-h-screen flex-col bg-[#f6f3ee] lg:min-h-screen">
          {activeTab === 'home' && (
            <div className="lg:hidden">
              <Header />
            </div>
          )}

          <main
            ref={mainRef}
            className="relative flex-1 overflow-y-auto bg-[#f6f3ee] pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:min-h-0"
          >
            {!activePageId ? (
              <>
            {activeTab === 'create-post' && (
              <div key="tab-create-post" className="animate-in fade-in duration-200 min-h-full w-full bg-[#f6f3ee]">
                <PostComposer embedded />
              </div>
            )}
            {activeTab === 'home' && (
              <div key="tab-home" className="animate-in fade-in duration-200 mx-auto w-full max-w-[680px] bg-transparent min-h-full">
                <HomeFeed />
              </div>
            )}
            {activeTab === 'discover' && (
              <div key="tab-discover" className="animate-in fade-in duration-200 max-w-3xl mx-auto w-full bg-transparent">
                <DiscoverView />
              </div>
            )}
            {activeTab === 'create-page' && (
              <div key="tab-create-page" className="animate-in fade-in duration-200 max-w-2xl mx-auto w-full bg-transparent pb-24">
                <CreatePageView />
              </div>
            )}
            {activeTab === 'messages' && (
              <div key="tab-messages" className="animate-in fade-in duration-200 max-w-3xl mx-auto w-full bg-transparent">
                <MessagesView />
              </div>
            )}
            {activeTab === 'notifications' && (
              <div key="tab-notifications" className="animate-in fade-in duration-200 max-w-3xl mx-auto w-full bg-transparent">
                <NotificationsView />
              </div>
            )}
            {activeTab === 'profile' && (
              <div key="tab-profile" className="animate-in fade-in duration-200 max-w-3xl mx-auto w-full bg-transparent">
                <ProfileView />
              </div>
            )}
            {activeTab === 'following' && (
              <div key="tab-following" className="animate-in fade-in duration-200 mx-auto w-full max-w-[680px] bg-transparent min-h-full">
                {/* @ts-ignore */}
                <HomeFeed 
                  hideTabs 
                  forceTab="following" 
                  headerTitle="Following" 
                  headerSubtitle="People, Pages and communities you keep up with in your local Lalao feed." 
                />
              </div>
            )}
            {activeTab === 'saved' && (
              <div key="tab-saved" className="animate-in fade-in duration-200">
                {renderListPage(
                  'Saved',
                  'Your saved posts, moments, and things you want to revisit later.',
                  savedPosts.slice(0, 6).map((post) => ({
                    id: post.id,
                    title: post.text || 'Saved post',
                    meta: `${post.location} · ${post.commentsCount} comments`,
                    accent: 'bg-amber-100 text-amber-700',
                  })),
                  'Nothing saved yet. Save posts and pages you want to keep close by.'
                )}
              </div>
            )}
            {activeTab === 'liked' && (
              <div key="tab-liked" className="animate-in fade-in duration-200">
                {renderListPage(
                  'Liked',
                  'Everything you have liked across the Lalao community.',
                  likedPosts.slice(0, 6).map((post) => ({
                    id: post.id,
                    title: post.text || 'Liked post',
                    meta: `${post.location} · ${post.likesCount} likes`,
                    accent: 'bg-rose-100 text-rose-700',
                  })),
                  'You have not liked anything yet. Tap the heart on posts you love.'
                )}
              </div>
            )}
              </>
            ) : (
              <div key="tab-page-detail" className="animate-in fade-in duration-200 max-w-3xl mx-auto w-full bg-transparent min-h-full">
                <PageDetailModal />
              </div>
            )}
          </main>

          <div className="lg:hidden">
            <BottomNav />
          </div>
        </div>

        <aside className="hidden lg:flex flex-col bg-[#f6f3ee]" aria-label="Secondary content rail" />
      </div>

      <SettingsPageView />
      <LocationRadiusModal />
      <RallyComposerModal />
      <CreateCycleModal isOpen={isCreateCycleOpen} onClose={() => setIsCreateCycleOpen(false)} />
      <CycleDetailModal />
      <UserProfileModal />
      <CommentsModal />
      <NotificationsModal />

      {!['create-post'].includes(activeTab) && <CycleStoryViewerModal />}
      {!['create-post'].includes(activeTab) && <PermissionPromptModal />}
      {!['create-post'].includes(activeTab) && <DevicePermissionsModal />}
      {!['create-post'].includes(activeTab) && <CartDrawer />}
      {!['create-post'].includes(activeTab) && (
        <ShoppingHistoryScreen
          isOpen={isShoppingHistoryOpen}
          onClose={() => setIsShoppingHistoryOpen(false)}
          onSelectOrder={(order) => setSelectedOrderForDetail(order)}
        />
      )}
      {!['create-post'].includes(activeTab) && (
        <OrderDetailModal
          order={selectedOrderForDetail}
          onClose={() => setSelectedOrderForDetail(null)}
        />
      )}

      {!['create-post'].includes(activeTab) && <EventDetailModal />}
      {!['create-post'].includes(activeTab) && <TournamentRegisterModal />}
      {!['create-post'].includes(activeTab) && <TicketPurchaseModal />}
      {!['create-post'].includes(activeTab) && <DigitalTicketModal />}
      {!['create-post'].includes(activeTab) && <MyTicketsModal />}
      {!['create-post'].includes(activeTab) && <WalletModal />}
      {!['create-post'].includes(activeTab) && <MySubscriptionsModal />}
      <AuthPromptModal />


      {shareToast && (
        <div
          id="lalao-toast-toast"
          className="fixed bottom-20 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <Check className="w-4 h-4 text-[#5E43F3]" />
          <span>{shareToast}</span>
        </div>
      )}
    </div>
  );
};

const LalaoApp: React.FC = () => (
  <LalaoProvider>
    <LalaoAppContent />
  </LalaoProvider>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/verify" element={<OTPVerifyPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/onboarding/welcome" element={<WelcomePage />} />
      <Route path="/onboarding/name" element={<NameSetupPage />} />
      <Route path="/onboarding/profile" element={<ProfileSetupPage />} />
      <Route path="/onboarding/pronouns" element={<PronounsPage />} />
      <Route path="/onboarding/location" element={<LocationSetupPage />} />
      <Route path="/onboarding/interests" element={<InterestsPage />} />
      <Route path="/onboarding/complete" element={<CompletePage />} />

      <Route path="/app" element={<LalaoApp />} />
      <Route path="/app/*" element={<LalaoApp />} />

      <Route path="/admin/*" element={
        <AdminRoute>
          <LalaoProvider>
            <AdminApp />
          </LalaoProvider>
        </AdminRoute>
      } />

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
