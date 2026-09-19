import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Wallet,
  Flag,
  Bell,
  Settings,
  Layers,
  Tag,
  Repeat,
  ClipboardList,
  Activity,
  ChevronRight,
  Shield,
  LogOut,
  X,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export type AdminSection =
  | 'overview'
  | 'users'
  | 'pages'
  | 'subscriptions'
  | 'transactions'
  | 'platform-settings'
  | 'subscription-platforms'
  | 'audit-log';

interface AdminLayoutProps {
  section: AdminSection;
  onNavigate: (s: AdminSection) => void;
  children: React.ReactNode;
}

const mainNav: { id: AdminSection; label: string; icon: React.FC<any> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'pages', label: 'Pages & Businesses', icon: Building2 },
  { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
];

const platformNav: { id: AdminSection; label: string; icon: React.FC<any> }[] = [
  { id: 'platform-settings', label: 'Platform Settings', icon: Settings },
  { id: 'subscription-platforms', label: 'Subscription Platforms', icon: Layers },
];

const systemNav: { id: AdminSection; label: string; icon: React.FC<any> }[] = [
  { id: 'audit-log', label: 'Audit Log', icon: ClipboardList },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ section, onNavigate, children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavItem = ({ item }: { item: { id: AdminSection; label: string; icon: React.FC<any> } }) => {
    const Icon = item.icon;
    const active = section === item.id;
    return (
      <button
        type="button"
        onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
          active
            ? 'bg-[#5E43F3] text-white shadow-sm shadow-[#5E43F3]/20'
            : 'text-neutral-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="text-[13px] font-medium">{item.label}</span>
        {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
      </button>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#5E43F3] flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-black text-white tracking-wider uppercase">Lalao</div>
            <div className="text-[10px] text-neutral-500 font-bold">Admin Control Center</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-600">Admin</div>
          <div className="space-y-1">
            {mainNav.map((item) => <NavItem key={item.id} item={item} />)}
          </div>
        </div>

        {/* Platform */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-600">Platform</div>
          <div className="space-y-1">
            {platformNav.map((item) => <NavItem key={item.id} item={item} />)}
          </div>
        </div>

        {/* System */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-600">System</div>
          <div className="space-y-1">
            {systemNav.map((item) => <NavItem key={item.id} item={item} />)}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10 space-y-1">
        <button
          type="button"
          onClick={() => navigate('/app')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer text-left"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span className="text-[13px] font-medium">Back to Lalao</span>
        </button>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all cursor-pointer text-left"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[13px] font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[230px] shrink-0 bg-neutral-900 border-r border-white/10 h-screen sticky top-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <div className="relative w-[230px] bg-neutral-900 h-full flex flex-col">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-neutral-900 shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#5E43F3]" />
            <span className="text-sm font-bold text-white">Lalao Administration</span>
          </div>
          <div className="ml-auto">
            <span className="text-[10px] font-bold bg-[#5E43F3]/20 text-[#5E43F3] px-2 py-1 rounded-full uppercase tracking-wider">
              Super Admin
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
