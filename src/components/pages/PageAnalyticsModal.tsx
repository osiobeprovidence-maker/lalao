import React from 'react';
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Eye,
  Ticket,
  ShoppingBag,
  MessageSquare,
  Share2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  MapPin,
  Clock,
} from 'lucide-react';
import { Page } from '../../types';

interface PageAnalyticsModalProps {
  page: Page;
  isOpen: boolean;
  onClose: () => void;
}

export const PageAnalyticsModal: React.FC<PageAnalyticsModalProps> = ({
  page,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const analytics = page.analytics || {
    views30d: 4820,
    reach30d: 12400,
    engagementRate: 8.4,
    newFollowers30d: 142,
    ticketSalesRevenue: 185000,
    ticketsSold: 37,
    productSalesRevenue: 0,
  };

  return (
    <div className="absolute inset-0 z-50 bg-white overflow-y-auto flex flex-col animate-in fade-in slide-in-from-right-4 duration-250">
      {/* Top Sticky Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-800 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-base font-black text-neutral-950">Page Analytics & Insights</h3>
            <p className="text-xs text-neutral-500 font-medium truncate max-w-[180px] sm:max-w-md">
              @{page.username} · Last 30 days growth & engagement
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>

      {/* Page Content Container */}
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 flex-1 space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
            <div className="flex items-center justify-between text-neutral-400 mb-1.5">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">+18%</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-neutral-900">{analytics.views30d.toLocaleString()}</p>
            <p className="text-[11px] uppercase font-bold text-neutral-400 mt-0.5">Page Views</p>
          </div>

          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
            <div className="flex items-center justify-between text-neutral-400 mb-1.5">
              <TrendingUp className="w-4 h-4 text-[#5E43F3]" />
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">+31%</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-neutral-900">{analytics.reach30d.toLocaleString()}</p>
            <p className="text-[11px] uppercase font-bold text-neutral-400 mt-0.5">Total Reach</p>
          </div>

          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
            <div className="flex items-center justify-between text-neutral-400 mb-1.5">
              <Users className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">+{analytics.newFollowers30d}</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-neutral-900">{page.followersCount}</p>
            <p className="text-[11px] uppercase font-bold text-neutral-400 mt-0.5">Followers</p>
          </div>

          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
            <div className="flex items-center justify-between text-neutral-400 mb-1.5">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">High</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-neutral-900">{analytics.engagementRate}%</p>
            <p className="text-[11px] uppercase font-bold text-neutral-400 mt-0.5">Engagement</p>
          </div>
        </div>

        {/* Revenue Performance Banner */}
        <div className="bg-neutral-900 text-white rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
              Total Monetization Revenue (30 Days)
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
              Direct Verified
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-white">
            ₦{analytics.ticketSalesRevenue.toLocaleString()}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-800 text-xs">
            <div>
              <span className="text-neutral-400 text-[11px] block">Tickets Sold</span>
              <strong className="text-white font-bold">{analytics.ticketsSold} passes</strong>
            </div>
            <div>
              <span className="text-neutral-400 text-[11px] block">Avg Order Value</span>
              <strong className="text-white font-bold">₦5,000 / attendee</strong>
            </div>
            <div>
              <span className="text-neutral-400 text-[11px] block">Conversion Rate</span>
              <strong className="text-emerald-400 font-bold">14.2%</strong>
            </div>
          </div>
        </div>

        {/* Demographic & Geographic Signals */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500">
            Audience Geographic Concentration
          </h4>
          <div className="space-y-2.5">
            {[
              { location: 'Warri / Airport Road Corridor', percent: 64 },
              { location: 'Udu / Enerhen Axis', percent: 22 },
              { location: 'Asaba & Greater Delta State', percent: 14 },
            ].map((item, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100">
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-neutral-800">{item.location}</span>
                  <span className="text-[#5E43F3]">{item.percent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                  <div
                    className="h-full bg-[#5E43F3] rounded-full transition-all duration-500"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Engagement Posts */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500">
            Top Performing Content
          </h4>
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-3">
            <div className="flex items-start justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-neutral-900">
                  "Grand Opening & Invitational Tournament Announced!"
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">3.4k impressions · 420 likes · 88 tickets</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-violet-100 text-[#5E43F3] text-[10px] font-black shrink-0">
                #1 Post
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
