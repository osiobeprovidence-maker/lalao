import React, { useRef, useEffect } from 'react';
import { LalaoProvider, useLalao } from './context/LalaoContext';
import { Header } from './components/navigation/Header';
import { BottomNav } from './components/navigation/BottomNav';
import { DesktopSidebar } from './components/navigation/DesktopSidebar';
import { HomeFeed } from './components/feed/HomeFeed';
import { DiscoverView } from './components/discover/DiscoverView';
import { MessagesView } from './components/messages/MessagesView';
import { ProfileView } from './components/profile/ProfileView';

// Modals, Sheets, and Full-Page Subviews
import { LocationRadiusModal } from './components/location/LocationRadiusModal';
import { CreateBottomSheet } from './components/create/CreateBottomSheet';
import { PostComposerModal } from './components/create/PostComposerModal';
import { RallyComposerModal } from './components/create/RallyComposerModal';
import { CreatePageView } from './components/pages/CreatePageView';
import { CreateCycleModal } from './components/cycles/CreateCycleModal';
import { CycleStoryViewerModal } from './components/cycles/CycleStoryViewerModal';
import { CycleDetailModal } from './components/cycles/CycleDetailModal';
import { PageDetailModal } from './components/pages/PageDetailModal';
import { ChatModal } from './components/messages/ChatModal';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { SettingsPageView } from './components/profile/SettingsPageView';
import { CommentsModal } from './components/common/CommentsModal';
import { NotificationsModal } from './components/common/NotificationsModal';
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
import { Check, Plus } from 'lucide-react';

// Router
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';

/**
 * ProtectedRoute — redirects to /onboarding/welcome when the user is not
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
  } = useLalao();
  const mainRef = useRef<HTMLElement>(null);

  // Always scroll to top when tab changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-neutral-100/60 text-neutral-900 flex justify-center selection:bg-[#5E43F3]/20 selection:text-[#5E43F3]">
      <div className="w-full max-w-7xl min-h-screen flex flex-col lg:flex-row relative bg-white border-x border-neutral-200/70 shadow-xs">
        {/* Desktop Left Sidebar (Fixed / persistent navigation on lg screens and up) */}
        <DesktopSidebar />

        {/* Flexible Main Content Area */}
        <div className="flex-1 min-w-0 bg-white min-h-screen flex flex-col relative">
          {/* Mobile Top Header (lg:hidden) */}
          {activeTab === 'home' && (
            <div className="lg:hidden">
              <Header />
            </div>
          )}

          {/* Tab View Router */}
          <main ref={mainRef} className="flex-1 overflow-y-auto relative pb-16 lg:pb-0">
            {activeTab === 'home' && (
              <div key="tab-home" className="animate-in fade-in duration-200 max-w-2xl xl:max-w-3xl mx-auto w-full">
                <HomeFeed />
              </div>
            )}
            {activeTab === 'discover' && (
              <div key="tab-discover" className="animate-in fade-in duration-200 max-w-3xl mx-auto w-full">
                <DiscoverView />
              </div>
            )}
            {activeTab === 'messages' && (
              <div key="tab-messages" className="animate-in fade-in duration-200 max-w-3xl mx-auto w-full">
                <MessagesView />
              </div>
            )}
            {activeTab === 'profile' && (
              <div key="tab-profile" className="animate-in fade-in duration-200 max-w-3xl mx-auto w-full">
                <ProfileView />
              </div>
            )}
          </main>

          {/* Mobile Bottom Navigation (lg:hidden) */}
          <div className="lg:hidden">
            <BottomNav />
          </div>

          {/* Full-Page Subviews (Not Popups) */}
          <CreatePageView />
          <SettingsPageView />
          <LocationRadiusModal />
          <PostComposerModal />
          <RallyComposerModal />
          <CreateCycleModal isOpen={isCreateCycleOpen} onClose={() => setIsCreateCycleOpen(false)} />
          <CycleDetailModal />
          <PageDetailModal />
          <ChatModal />
          <UserProfileModal />
          <CommentsModal />
          <NotificationsModal />

          {/* Action Sheets & Overlays */}
          <CreateBottomSheet />
          <CycleStoryViewerModal />
          <PermissionPromptModal />
          <DevicePermissionsModal />
          <CartDrawer />
          <ShoppingHistoryScreen
            isOpen={isShoppingHistoryOpen}
            onClose={() => setIsShoppingHistoryOpen(false)}
            onSelectOrder={(order) => setSelectedOrderForDetail(order)}
          />
          <OrderDetailModal
            order={selectedOrderForDetail}
            onClose={() => setSelectedOrderForDetail(null)}
          />

          {/* Event, Ticket & Wallet Modals */}
          <EventDetailModal />
          <TournamentRegisterModal />
          <TicketPurchaseModal />
          <DigitalTicketModal />
          <MyTicketsModal />
          <WalletModal />

          {/* Floating Action Button (FAB) on Laptop / Desktop */}
          <button
            id="btn-desktop-floating-create"
            type="button"
            onClick={() => setIsCreateSheetOpen(true)}
            className="hidden lg:flex fixed bottom-8 right-8 z-40 items-center gap-2.5 px-5 py-3.5 rounded-full bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm shadow-xl shadow-[#5E43F3]/35 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-white/90 select-none group"
            title="Create Post, Rally, or Page"
            aria-label="Create Post, Rally, or Page"
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-200">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <span>Create</span>
          </button>

          {/* Floating Toast Notification */}
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
      </div>
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
      {/* Root → welcome */}
      <Route path="/" element={<Navigate to="/onboarding/welcome" replace />} />

      {/* Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/verify" element={<OTPVerifyPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Onboarding routes */}
      <Route path="/onboarding/welcome" element={<WelcomePage />} />
      <Route path="/onboarding/name" element={<NameSetupPage />} />
      <Route path="/onboarding/profile" element={<ProfileSetupPage />} />
      <Route path="/onboarding/pronouns" element={<PronounsPage />} />
      <Route path="/onboarding/location" element={<LocationSetupPage />} />
      <Route path="/onboarding/interests" element={<InterestsPage />} />
      <Route path="/onboarding/complete" element={<CompletePage />} />

      {/* Main app (existing SPA) — protected: must be authenticated */}
      <Route path="/app" element={<ProtectedRoute><LalaoApp /></ProtectedRoute>} />
      <Route path="/app/*" element={<ProtectedRoute><LalaoApp /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/onboarding/welcome" replace />} />
    </Routes>
  );
}
