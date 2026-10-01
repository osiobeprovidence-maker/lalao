import React from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  CreditCard, 
  Activity, 
  ShieldAlert,
  BellRing,
  Wallet,
  Settings2,
  ListPlus,
  ToggleLeft,
  FileText,
  ActivitySquare,
  BadgeDollarSign,
  Menu,
  LogOut as LogOutIcon,
  X,
  Star,
  Plug,
  BarChart3,
  MapPin
} from 'lucide-react';

import { AdminDashboard } from './AdminDashboard';
import { AdminUsers } from './AdminUsers';
import { AdminPages } from './AdminPages';
import { AdminSubscriptions } from './AdminSubscriptions';
import { AdminTransactions } from './AdminTransactions';
import { AdminAuditLog } from './AdminAuditLog';
import { AdminPlatformSettings } from './AdminPlatformSettings';
import { AdminSubPlatforms } from './AdminSubPlatforms';
import { AdminComingSoon } from './AdminComingSoon';
import { AdminReports } from './AdminReports';
import { AdminCommunitySuggestions } from './AdminCommunitySuggestions';
import { AdminCommunities } from './AdminCommunities';
import { AdminRecommendations } from './AdminRecommendations';
import { AdminApiPartners } from './AdminApiPartners';
import { AdminEventsDistribution } from './AdminEventsDistribution';
import { AdminLocationRules } from './AdminLocationRules';
import { useAuth } from '../../context/AuthContext';
import { useLalao } from '../../context/LalaoContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useNavigate } from 'react-router-dom';

export const AdminApp: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { platformSettings } = useLalao();
  const role = useQuery(api.admin.getMyRole);
  const destroyAdminSession = useMutation(api.admin.destroyAdminSession);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleExit = async () => {
    const token = sessionStorage.getItem('lalao_admin_token');
    if (token) {
      try {
        await destroyAdminSession({ token });
      } catch (e) {
        console.error("Failed to destroy admin session", e);
      }
      sessionStorage.removeItem('lalao_admin_token');
    }
    navigate('/app');
  };

  const navGroups = [
    {
      title: 'Overview',
      items: [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/pages', label: 'Pages & Businesses', icon: Building2 },
      ]
    },
    {
      title: 'Commerce',
      items: [
        { path: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
        { path: '/admin/transactions', label: 'Transactions', icon: Activity },
        { path: '/admin/wallet', label: 'Wallet Activity', icon: Wallet },
        { path: '/admin/monetization', label: 'Creator Monetization', icon: BadgeDollarSign },
      ]
    },
    {
      title: 'Operations',
      items: [
        { path: '/admin/recommendations', label: 'Recommendations', icon: Star },
        { path: '/admin/reports', label: 'Reports', icon: FileText },
        { path: '/admin/communities', label: 'Communities', icon: Users },
        { path: '/admin/community-suggestions', label: 'Community Suggestions', icon: Users },
        { path: '/admin/moderation', label: 'Moderation', icon: ShieldAlert },
        { path: '/admin/notifications', label: 'Notifications', icon: BellRing },
      ]
    },
    {
      title: 'System',
      items: [
        { path: '/admin/settings', label: 'Platform Settings', icon: Settings2 },
        { path: '/admin/platforms', label: 'Subscription Platforms', icon: ListPlus },
        { path: '/admin/features', label: 'Feature Flags', icon: ToggleLeft },
        { path: '/admin/audit', label: 'Audit Log', icon: ActivitySquare },
      ]
    },
    {
      title: 'API & Developers',
      items: [
        { path: '/admin/api-partners', label: 'API Partners', icon: Plug },
        { path: '/admin/events-distribution', label: 'Events Analytics', icon: BarChart3 },
        { path: '/admin/location-rules', label: 'Location Rules', icon: MapPin },
      ]
    }
  ];

  const AdminSidebarContent = () => (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-theme-divider/80 shrink-0">
        <button 
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 select-none"
        >
          {platformSettings?.wordmarkUrl ? (
            <img src={platformSettings.wordmarkUrl} alt="Lalao" className="h-8 object-contain" />
          ) : (
            <span className="lalao-wordmark text-[28px] text-theme-primary">lalao</span>
          )}
          <span className="text-sm font-semibold text-theme-tertiary uppercase tracking-wider mt-1">Admin</span>
        </button>
        {isMobileMenuOpen && (
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-theme-tertiary hover:text-theme-primary"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 no-scrollbar">
        <div className="space-y-8">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider mb-3 px-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.exact
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-theme-tertiary'}`} />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-theme-divider/80 shrink-0">
        <button
          onClick={handleExit}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
        >
          <LogOutIcon className="w-5 h-5 text-theme-tertiary" />
          Exit Admin
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-theme-base text-theme-primary font-sans selection:bg-indigo-500/30">
      <div className="flex h-screen overflow-hidden">
        
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-theme-base border-r border-theme-divider/80 shrink-0">
          <AdminSidebarContent />
        </aside>

        {/* Mobile Sidebar overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-theme-inverse/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <aside className="relative flex flex-col w-64 max-w-[80vw] h-full bg-theme-base shadow-2xl">
              <AdminSidebarContent />
            </aside>
          </div>
        )}
        <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden relative w-full max-w-full">
          <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-theme-surface/80 backdrop-blur-xl border-b border-theme-divider/80 shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-theme-secondary hover:bg-theme-surface-hover rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-base sm:text-lg font-bold text-theme-primary truncate">Platform Control Center</h1>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-theme-surface-hover border border-theme-divider">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                <span className="text-xs font-medium text-theme-secondary">System Online</span>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-theme-base p-4 md:p-8 z-10 no-scrollbar w-full">
            <div className="max-w-6xl mx-auto w-full">
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/users" element={<AdminUsers />} />
                <Route path="/pages" element={<AdminPages />} />
                <Route path="/subscriptions" element={<AdminSubscriptions />} />
                <Route path="/transactions" element={<AdminTransactions />} />
                <Route path="/wallet" element={<AdminComingSoon title="Wallet Activity" />} />
                <Route path="/monetization" element={<AdminComingSoon title="Creator Monetization" />} />
                <Route path="/reports" element={<AdminReports />} />
                <Route path="/communities" element={<AdminCommunities />} />
                <Route path="/community-suggestions" element={<AdminCommunitySuggestions />} />
                <Route path="/recommendations" element={<AdminRecommendations />} />
                <Route path="/moderation" element={<AdminComingSoon title="Moderation Queue" />} />
                <Route path="/notifications" element={<AdminComingSoon title="System Notifications" />} />
                <Route path="/settings" element={<AdminPlatformSettings />} />
                <Route path="/platforms" element={<AdminSubPlatforms />} />
                <Route path="/features" element={<AdminComingSoon title="Feature Flags" />} />
                <Route path="/audit" element={<AdminAuditLog />} />
                <Route path="/api-partners" element={<AdminApiPartners />} />
                <Route path="/events-distribution" element={<AdminEventsDistribution />} />
                <Route path="/location-rules" element={<AdminLocationRules />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
