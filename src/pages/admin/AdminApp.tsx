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
  BadgeDollarSign
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
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useNavigate } from 'react-router-dom';

export const AdminApp: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const role = useQuery(api.admin.getMyRole);
  const destroyAdminSession = useMutation(api.admin.destroyAdminSession);

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
        { path: '/admin/reports', label: 'Reports', icon: FileText },
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
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans selection:bg-indigo-500/30">
      <div className="flex h-screen overflow-hidden">
        
        {/* Admin Sidebar */}
        <aside className="w-64 bg-slate-900/50 border-r border-slate-800/60 flex flex-col shrink-0">
          <div className="h-16 flex items-center px-6 border-b border-slate-800/60 shrink-0">
            <span className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-500">lalao</span> Admin
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
            {navGroups.map((group) => (
              <div key={group.title}>
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
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
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-200' : 'text-slate-500'}`} />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-800/60 shrink-0">
            <button
              onClick={handleExit}
              className="flex items-center justify-center w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition-colors cursor-pointer"
            >
              Exit to Lalao
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 z-10">
            <div className="max-w-6xl mx-auto">
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/users" element={<AdminUsers />} />
                <Route path="/pages" element={<AdminPages />} />
                <Route path="/subscriptions" element={<AdminSubscriptions />} />
                <Route path="/transactions" element={<AdminTransactions />} />
                <Route path="/wallet" element={<AdminComingSoon title="Wallet Activity" />} />
                <Route path="/monetization" element={<AdminComingSoon title="Creator Monetization" />} />
                <Route path="/reports" element={<AdminComingSoon title="Reports" />} />
                <Route path="/moderation" element={<AdminComingSoon title="Moderation Queue" />} />
                <Route path="/notifications" element={<AdminComingSoon title="System Notifications" />} />
                <Route path="/settings" element={<AdminPlatformSettings />} />
                <Route path="/platforms" element={<AdminSubPlatforms />} />
                <Route path="/features" element={<AdminComingSoon title="Feature Flags" />} />
                <Route path="/audit" element={<AdminAuditLog />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
