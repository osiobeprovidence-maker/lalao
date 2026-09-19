import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Crown,
  Trash2,
  Check,
  Tag,
  DollarSign,
} from 'lucide-react';
import { Page } from '../../types';
import { useLalao } from '../../context/LalaoContext';

interface PageManageSubscriptionsModalProps {
  page: Page;
  isOpen: boolean;
  onClose: () => void;
}

export const PageManageSubscriptionsModal: React.FC<PageManageSubscriptionsModalProps> = ({
  page,
  isOpen,
  onClose,
}) => {
  const { pageSubscriptionPlans, createSubscriptionPlan, updateSubscriptionPlan, triggerShareToast } = useLalao();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(3000);
  const [currency, setCurrency] = useState('NGN');
  const [billingInterval, setBillingInterval] = useState<'monthly'|'yearly'>('monthly');
  const [description, setDescription] = useState('');
  const [benefits, setBenefits] = useState<string[]>(['']);

  if (!isOpen) return null;

  const handleAddBenefit = () => {
    setBenefits([...benefits, '']);
  };

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...benefits];
    newBenefits[index] = value;
    setBenefits(newBenefits);
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      
      const cleanBenefits = benefits.filter(b => b.trim() !== '');
      
      await createSubscriptionPlan({
        pageId: page.id,
        name,
        description,
        price,
        currency,
        billingInterval,
        benefits: cleanBenefits,
        active: true
      });

      setIsAddingNew(false);
      setName('');
      setDescription('');
      setPrice(3000);
      setBenefits(['']);
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePlanActive = async (plan: any) => {
    try {
      await updateSubscriptionPlan(plan._id, { active: !plan.active });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-neutral-100 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (isAddingNew) setIsAddingNew(false);
              else onClose();
            }}
            className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div className="flex-1">
            <h2 className="text-base font-black text-neutral-900">
              {isAddingNew ? 'Create Subscription Plan' : 'Manage Subscriptions'}
            </h2>
            <p className="text-xs text-neutral-500 font-medium">{page.name}</p>
          </div>
          {!isAddingNew && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="p-2 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] hover:bg-[#5E43F3]/20 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-50">
          {isAddingNew ? (
            <form onSubmit={handleSavePlan} className="space-y-5">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                
                {/* Plan Name */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                    Plan Name
                  </label>
                  <div className="relative">
                    <Crown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Premium Monthly"
                      className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3] transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe who this plan is for..."
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3] transition-all min-h-[80px]"
                    required
                  />
                </div>

                {/* Price & Billing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                      Price (NGN)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3] transition-all"
                        required
                        min={0}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                      Billing Cycle
                    </label>
                    <select
                      value={billingInterval}
                      onChange={(e) => setBillingInterval(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3] transition-all appearance-none"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wide">
                    Benefits Included
                  </label>
                  <div className="space-y-2">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
                          <input
                            type="text"
                            value={benefit}
                            onChange={(e) => handleBenefitChange(index, e.target.value)}
                            placeholder="e.g. Priority Support"
                            className="w-full pl-8 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3]"
                            required
                          />
                        </div>
                        {benefits.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBenefit(index)}
                            className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddBenefit}
                      className="text-xs font-bold text-[#5E43F3] hover:text-[#4E34E0] mt-2 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Benefit
                    </button>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="flex-1 py-3 bg-white border border-neutral-200 text-neutral-700 rounded-xl font-bold text-sm hover:bg-neutral-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#5E43F3] text-white rounded-xl font-black text-sm hover:bg-[#4E34E0] transition-colors shadow-lg shadow-[#5E43F3]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {pageSubscriptionPlans.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white rounded-2xl border border-neutral-200">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-base font-black text-neutral-900 mb-1">No subscription plans yet</h3>
                  <p className="text-sm text-neutral-500 mb-6">Create your first subscription plan to start generating recurring revenue.</p>
                  <button
                    onClick={() => setIsAddingNew(true)}
                    className="px-6 py-2.5 bg-[#5E43F3] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#4E34E0] transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Subscription Plan
                  </button>
                </div>
              ) : (
                pageSubscriptionPlans.map((plan) => (
                  <div key={plan._id} className={`bg-white rounded-2xl border ${plan.active ? 'border-[#5E43F3]/30 shadow-sm' : 'border-neutral-200 opacity-75'} p-4 transition-all relative overflow-hidden`}>
                    {!plan.active && (
                      <div className="absolute top-0 right-0 bg-neutral-100 text-neutral-500 text-[10px] font-black px-2 py-1 rounded-bl-lg">
                        DISABLED
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-base font-black text-neutral-900">{plan.name}</h3>
                        <p className="text-sm text-[#5E43F3] font-bold">
                          {plan.currency === 'NGN' ? '₦' : plan.currency}{(plan.price).toLocaleString()} <span className="text-xs text-neutral-500 font-medium">/ {plan.billingInterval}</span>
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-neutral-600 mb-4">{plan.description}</p>
                    
                    <div className="space-y-2 mb-5">
                      {plan.benefits.map((benefit: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-neutral-700">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 border-t border-neutral-100 pt-3">
                      <button 
                        onClick={() => togglePlanActive(plan)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${plan.active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                      >
                        {plan.active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
