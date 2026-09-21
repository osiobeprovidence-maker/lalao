import React, { useState } from 'react';
import { ArrowLeft, Check, ChevronRight, MonitorPlay, Users, Wallet, FileText, BarChart3, AlertCircle } from 'lucide-react';
import { Page, SubscriptionListing } from '../../types';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { subscriptionPlatforms } from '../../data/subscriptionPlatforms';

interface CreateSubscriptionWizardProps {
  page: Page;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (listingId: string) => void;
}

type Step = 1 | 2 | 3 | 4 | 5;

export const CreateSubscriptionWizard: React.FC<CreateSubscriptionWizardProps> = ({ page, isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createListing = useMutation(api.subscriptions.createListing);

  // Form State
  const [platformId, setPlatformId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('Other');
  const [totalAccountCost, setTotalAccountCost] = useState<number>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const [totalCapacity, setTotalCapacity] = useState<number>(1);
  const [defaultSlotPrice, setDefaultSlotPrice] = useState<number>(0);

  const [accountEmail, setAccountEmail] = useState<string>('');
  const [privateNotes, setPrivateNotes] = useState<string>('');

  const [memberInstructions, setMemberInstructions] = useState<string>('');
  const [benefits, setBenefits] = useState<string[]>(['']);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNext = () => setStep(s => Math.min(s + 1, 5) as Step);
  const handlePrev = () => setStep(s => Math.max(s - 1, 1) as Step);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const platform = subscriptionPlatforms.find(p => p.id === platformId);
      const listingId = await createListing({
        pageId: page.id as any,
        platformId: platformId ? (platformId as any) : undefined,
        platformName: platform?.name,
        platformLogo: platform?.logo,
        name: name || platform?.name || 'Custom Subscription',
        category: category || platform?.category || 'Other',
        totalAccountCost,
        currency: 'NGN',
        billingCycle,
        totalCapacity,
        defaultSlotPrice,
        allowDifferentSlotPrices: false, // keep it simple for now
        accountEmail,
        privateNotes,
        memberInstructions,
        benefits: benefits.filter(b => b.trim() !== ''),
      });
      onSuccess(listingId);
    } catch (e: any) {
      console.error('Subscription creation backend error:', e);
      // Convex errors thrown with ConvexError store the message in the `data` property.
      const errorText = typeof e.data === 'string' ? e.data : (e.data?.message || e.message);
      setErrorMsg(errorText || 'Unable to create this subscription. Please check the required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRevenue = totalCapacity * defaultSlotPrice;
  const grossMargin = currentRevenue - totalAccountCost;

  return (
    <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-250">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="font-bold text-neutral-900">Add Subscription</h3>
        </div>
        <div className="text-sm font-semibold text-neutral-400">Step {step} of 5</div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-b border-red-100 p-3 text-red-600 text-sm font-semibold text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
        <div className="max-w-xl mx-auto">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><MonitorPlay className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Listing Information</h2>
                  <p className="text-sm text-neutral-500">What service are you sharing?</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Platform / Service</label>
                <select 
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3] transition-all"
                  value={platformId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPlatformId(val);
                    const plat = subscriptionPlatforms.find(p => p.id === val);
                    if (plat) {
                      setName(plat.name);
                      setCategory(plat.category);
                    }
                  }}
                >
                  <option value="">Select Platform...</option>
                  {subscriptionPlatforms.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Subscription Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Spotify Family"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3]" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Total Account Cost (NGN) *</label>
                <p className="text-xs text-neutral-500 mb-2">How much does the underlying account cost your business?</p>
                <input 
                  type="number" 
                  value={totalAccountCost || ''} 
                  onChange={e => setTotalAccountCost(Number(e.target.value))}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3]" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Billing Cycle *</label>
                <div className="flex gap-3">
                  {['monthly', 'quarterly', 'yearly'].map(cycle => (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle as any)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize border transition-colors ${billingCycle === cycle ? 'bg-[#5E43F3] text-white border-[#5E43F3]' : 'border-neutral-200 hover:border-neutral-300 bg-white'}`}
                    >
                      {cycle}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600"><Users className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Membership Slots</h2>
                  <p className="text-sm text-neutral-500">Configure how many people can join</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Total Capacity *</label>
                <p className="text-xs text-neutral-500 mb-2">How many slots are available in this subscription?</p>
                <input 
                  type="number" 
                  min="1"
                  value={totalCapacity || ''} 
                  onChange={e => setTotalCapacity(Number(e.target.value))}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3]" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Price per Slot (NGN) *</label>
                <p className="text-xs text-neutral-500 mb-2">How much does each member pay you per cycle?</p>
                <input 
                  type="number" 
                  value={defaultSlotPrice || ''} 
                  onChange={e => setDefaultSlotPrice(Number(e.target.value))}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3]" 
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Wallet className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Private Account Info</h2>
                  <p className="text-sm text-neutral-500">This information is never public</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Account Email</label>
                <input 
                  type="email" 
                  value={accountEmail} 
                  onChange={e => setAccountEmail(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3]" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Private Notes</label>
                <textarea 
                  value={privateNotes} 
                  onChange={e => setPrivateNotes(e.target.value)}
                  rows={4}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3]" 
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600"><FileText className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Member Instructions</h2>
                  <p className="text-sm text-neutral-500">What do members need to know?</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Instructions</label>
                <textarea 
                  value={memberInstructions} 
                  onChange={e => setMemberInstructions(e.target.value)}
                  placeholder="e.g. Please use your registered email to accept the invite link."
                  rows={4}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3]" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Benefits</label>
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      value={benefit} 
                      onChange={e => {
                        const newB = [...benefits];
                        newB[i] = e.target.value;
                        setBenefits(newB);
                      }}
                      className="flex-1 border border-neutral-200 rounded-xl px-4 py-3 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3]" 
                    />
                  </div>
                ))}
                <button onClick={() => setBenefits([...benefits, ''])} className="text-[#5E43F3] text-sm font-bold mt-2 hover:underline">
                  + Add Benefit
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#5E43F3]/10 rounded-xl flex items-center justify-center text-[#5E43F3]"><BarChart3 className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Review & Create</h2>
                  <p className="text-sm text-neutral-500">Confirm your subscription economics</p>
                </div>
              </div>

              <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-200 pb-4">
                  <span className="text-neutral-500 font-medium">Subscription</span>
                  <span className="font-bold text-neutral-900">{name} ({totalCapacity} Members)</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 font-medium">Total Subscription Cost</span>
                  <span className="font-bold text-rose-600">₦{totalAccountCost.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 font-medium">Member Price</span>
                  <span className="font-bold text-emerald-600">₦{defaultSlotPrice.toLocaleString()} / slot</span>
                </div>

                <div className="flex justify-between items-center border-t border-neutral-200 pt-4">
                  <span className="text-neutral-500 font-medium">Potential Monthly Revenue</span>
                  <span className="font-bold text-neutral-900">₦{currentRevenue.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center bg-[#5E43F3]/5 p-4 rounded-xl">
                  <span className="text-[#5E43F3] font-bold">Potential Gross Margin</span>
                  <span className="font-black text-[#5E43F3]">₦{grossMargin.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-sm">
                <strong>Note:</strong> Potential revenue and margin are business calculations based on 100% capacity. Empty slots do not generate revenue.
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer / Controls */}
      <div className="sticky bottom-0 bg-white border-t border-neutral-100 p-4 shrink-0 flex justify-between">
        {step > 1 ? (
          <button onClick={handlePrev} className="px-6 py-3 font-bold text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors">
            Back
          </button>
        ) : <div />}

        {step < 5 ? (
          <button 
            onClick={handleNext} 
            disabled={step === 1 && (!name || !totalAccountCost)}
            className="px-8 py-3 bg-[#5E43F3] text-white font-bold rounded-full hover:bg-opacity-90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            Next <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="px-8 py-3 bg-neutral-900 text-white font-bold rounded-full hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isSubmitting ? 'Creating...' : 'Create Subscription'}
          </button>
        )}
      </div>
    </div>
  );
};
