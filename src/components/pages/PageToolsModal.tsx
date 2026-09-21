import React, { useState, useEffect } from 'react';
import { ArrowLeft, Briefcase, Gift, Tag, Repeat, Users, BarChart, Settings, Check } from 'lucide-react';
import { Page } from '../../types';
import { useLalao } from '../../context/LalaoContext';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

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
  const { setIsManageSubscriptionsOpen } = useLalao();
  const updateSettings = useMutation(api.pages.updatePageBusinessSettings);

  const [businessType, setBusinessType] = useState<'commerce' | 'subscription' | 'hybrid'>(page.businessType || 'commerce');
  const [activeTools, setActiveTools] = useState<string[]>(page.activeTools || ['shop', 'products', 'orders']);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBusinessType(page.businessType || 'commerce');
      setActiveTools(page.activeTools || ['shop', 'products', 'orders']);
      setIsEditingSettings(false);
    }
  }, [isOpen, page]);

  if (!isOpen) return null;

  const toggleTool = (toolId: string) => {
    setActiveTools(prev => 
      prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
    );
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        pageId: page.id as any,
        businessType,
        activeTools,
      });
      setIsEditingSettings(false);
    } catch (e) {
      console.error('Failed to update business settings', e);
    } finally {
      setIsSaving(false);
    }
  };

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
              Configure & Extend your Page
            </p>
          </div>
        </div>
        <button
          onClick={() => isEditingSettings ? handleSaveSettings() : setIsEditingSettings(true)}
          disabled={isSaving}
          className="px-4 py-1.5 bg-neutral-900 text-white text-sm font-semibold rounded-full hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : (isEditingSettings ? 'Save Configuration' : 'Configure')}
        </button>
      </div>

      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 flex-1 flex flex-col">
        {isEditingSettings ? (
          <div className="mb-8">
            <h4 className="text-lg font-bold text-neutral-900 mb-4">Select Business Type</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {[
                { id: 'commerce', label: 'Commerce', desc: 'Shop & Products' },
                { id: 'subscription', label: 'Subscription', desc: 'Memberships & Slots' },
                { id: 'hybrid', label: 'Hybrid', desc: 'Products + Subscriptions' },
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setBusinessType(type.id as any)}
                  className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                    businessType === type.id ? 'border-[#5E43F3] bg-[#5E43F3]/5' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-bold ${businessType === type.id ? 'text-[#5E43F3]' : 'text-neutral-900'}`}>{type.label}</span>
                    {businessType === type.id && <Check className="w-4 h-4 text-[#5E43F3]" />}
                  </div>
                  <span className="text-xs text-neutral-500">{type.desc}</span>
                </button>
              ))}
            </div>
            
            <h4 className="text-lg font-bold text-neutral-900 mb-4">Toggle Active Tools</h4>
          </div>
        ) : (
          <div className="text-center mt-6 mb-12">
            <div className="w-16 h-16 bg-[#5E43F3]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-[#5E43F3]" />
            </div>
            <h2 className="text-2xl font-black text-neutral-900 mb-3">Power up your business</h2>
            <p className="text-neutral-500 text-sm max-w-md mx-auto leading-relaxed">
              Your page is configured as a <span className="font-bold uppercase">{businessType}</span> business.
            </p>
          </div>
        )}

        <div className="space-y-8">
          
          {/* COMMERCE SECTION */}
          {(businessType === 'commerce' || businessType === 'hybrid' || isEditingSettings) && (
            <div>
              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">Commerce Tools</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ToolCard
                  title="Shop"
                  desc="Manage your storefront and products."
                  icon={<Briefcase />}
                  color="blue"
                  isActive={activeTools.includes('shop')}
                  isEditing={isEditingSettings}
                  onToggle={() => toggleTool('shop')}
                />
                <ToolCard
                  title="Orders"
                  desc="Process and fulfill customer orders."
                  icon={<BarChart />}
                  color="blue"
                  isActive={activeTools.includes('orders')}
                  isEditing={isEditingSettings}
                  onToggle={() => toggleTool('orders')}
                />
              </div>
            </div>
          )}

          {/* SUBSCRIPTION SECTION */}
          {(businessType === 'subscription' || businessType === 'hybrid' || isEditingSettings) && (
            <div>
              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">Subscription Tools</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (isEditingSettings) {
                      toggleTool('subscriptions');
                    } else if (activeTools.includes('subscriptions')) {
                      setIsManageSubscriptionsOpen(true);
                      onClose();
                    }
                  }}
                  className={`p-5 rounded-2xl border flex flex-col gap-3 text-left transition-colors ${
                    !activeTools.includes('subscriptions') && !isEditingSettings ? 'opacity-50 pointer-events-none' : ''
                  } ${isEditingSettings ? 'cursor-pointer hover:bg-neutral-50' : 'cursor-pointer hover:bg-[#5E43F3]/5 border-[#5E43F3]/20 shadow-sm'}`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="w-10 h-10 bg-[#5E43F3]/10 rounded-xl flex items-center justify-center text-[#5E43F3]">
                      <Repeat className="w-5 h-5" />
                    </div>
                    {isEditingSettings && (
                      <div className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${activeTools.includes('subscriptions') ? 'bg-[#5E43F3]' : 'bg-neutral-200'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${activeTools.includes('subscriptions') ? 'translate-x-6' : ''}`} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 mb-1">Subscription CRM</h4>
                    <p className="text-xs text-neutral-500">Manage premium memberships, slots, and recurring revenue.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* CUSTOMER ENGAGEMENT SECTION - Temporarily hidden as backend schema is not implemented
          <div>
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">Customer Engagement</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ToolCard
                title="Loyalty & Rewards"
                desc="Create loyalty programs, reward points, and allow customers to redeem gifts."
                icon={<Gift />}
                color="rose"
                isActive={activeTools.includes('loyalty')}
                isEditing={isEditingSettings}
                onToggle={() => toggleTool('loyalty')}
              />
              <ToolCard
                title="Coupons & Promotions"
                desc="Generate discount codes and run special promotions directly on your page."
                icon={<Tag />}
                color="emerald"
                isActive={activeTools.includes('coupons')}
                isEditing={isEditingSettings}
                onToggle={() => toggleTool('coupons')}
              />
              <ToolCard
                title="Customer Programs"
                desc="Manage VIP groups, segmented messaging, and tailored relations."
                icon={<Users />}
                color="amber"
                isActive={activeTools.includes('customer_programs')}
                isEditing={isEditingSettings}
                onToggle={() => toggleTool('customer_programs')}
              />
            </div>
          </div>
          */}
          
        </div>
      </div>
    </div>
  );
};

const ToolCard = ({ title, desc, icon, color, isActive, isEditing, onToggle }: any) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    rose: 'bg-rose-100 text-rose-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <button
      onClick={() => isEditing && onToggle()}
      className={`p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex flex-col gap-3 text-left transition-colors ${
        !isActive && !isEditing ? 'opacity-50' : ''
      } ${isEditing ? 'cursor-pointer hover:bg-neutral-100' : 'cursor-default'}`}
    >
      <div className="flex justify-between items-start w-full">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          {React.cloneElement(icon, { className: 'w-5 h-5' })}
        </div>
        {isEditing && (
          <div className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${isActive ? 'bg-[#5E43F3]' : 'bg-neutral-200'}`}>
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : ''}`} />
          </div>
        )}
      </div>
      <div>
        <h4 className="font-bold text-neutral-900 mb-1">{title}</h4>
        <p className="text-xs text-neutral-500">{desc}</p>
      </div>
    </button>
  );
};
