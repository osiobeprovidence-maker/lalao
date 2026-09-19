import React from 'react';
import { ArrowLeft, Briefcase, Gift, Tag, Repeat, Users, BarChart } from 'lucide-react';
import { Page } from '../../types';

interface PageToolsModalProps {
  page: Page;
  isOpen: boolean;
  onClose: () => void;
}

export const PageToolsModal: React.FC<PageToolsModalProps> = ({
  page,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-white overflow-y-auto flex flex-col animate-in fade-in slide-in-from-right-4 duration-250">
      {/* Top Sticky App Bar */}
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
            <h3 className="text-base font-black text-neutral-950">Business Tools</h3>
            <p className="text-xs text-neutral-500 font-medium truncate max-w-[180px] sm:max-w-md">
              Extend your Lalao Page
            </p>
          </div>
        </div>
      </div>

      {/* Page Content Container */}
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 flex-1 flex flex-col">
        
        <div className="text-center mt-12 mb-16">
          <div className="w-16 h-16 bg-[#5E43F3]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-[#5E43F3]" />
          </div>
          <h2 className="text-2xl font-black text-neutral-900 mb-3">Power up your business</h2>
          <p className="text-neutral-500 text-sm max-w-md mx-auto leading-relaxed">
            Extend your Lalao Page with tools for running and managing your business. These powerful extensions are coming soon.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex flex-col gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 mb-1">Loyalty & Rewards</h4>
              <p className="text-xs text-neutral-500">Create loyalty programs, reward points, and allow customers to redeem gifts.</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex flex-col gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 mb-1">Coupons & Promotions</h4>
              <p className="text-xs text-neutral-500">Generate discount codes and run special promotions directly on your page.</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex flex-col gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 mb-1">Subscriptions</h4>
              <p className="text-xs text-neutral-500">Offer premium memberships and recurring subscriptions to your followers.</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex flex-col gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 mb-1">Customer Programs</h4>
              <p className="text-xs text-neutral-500">Manage VIP groups, segmented messaging, and tailored customer relations.</p>
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
};
