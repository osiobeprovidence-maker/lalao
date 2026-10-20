import React, { useState } from 'react';
import { ArrowLeft, Repeat, Plus, Users, Wallet, CreditCard } from 'lucide-react';
import { Page } from '../../types';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { CreateSubscriptionWizard } from './CreateSubscriptionWizard';

interface SubscriptionCRMModalProps {
  page: Page;
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionCRMModal: React.FC<SubscriptionCRMModalProps> = ({ page, isOpen, onClose }) => {
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);

  const crmData = useQuery(api.subscriptions.getCRMData, { pageId: page.id as any });

  if (!isOpen) return null;

  if (isCreateWizardOpen) {
    return (
      <CreateSubscriptionWizard
        page={page}
        isOpen={isCreateWizardOpen}
        onClose={() => setIsCreateWizardOpen(false)}
        onSuccess={() => setIsCreateWizardOpen(false)}
      />
    );
  }

  return (
    <div className="absolute inset-0 z-50 bg-theme-base overflow-y-auto flex flex-col animate-in fade-in slide-in-from-right-4 duration-250">
      <div className="sticky top-0 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={selectedListing ? () => setSelectedListing(null) : onClose} className="p-2 -ml-2 rounded-full hover:bg-theme-surface-hover cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-bold text-theme-primary">{selectedListing ? selectedListing.name : 'Subscription CRM'}</h3>
            <p className="text-xs text-theme-tertiary font-medium">Manage members and revenue</p>
          </div>
        </div>
        {!selectedListing && (
          <button
            onClick={() => setIsCreateWizardOpen(true)}
            className="flex items-center gap-1 px-4 py-1.5 bg-[#5E43F3] text-white text-sm font-bold rounded-full hover:bg-opacity-90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Subscription
          </button>
        )}
      </div>

      <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
        {crmData === undefined ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#5E43F3]/20 border-t-[#5E43F3]" />
          </div>
        ) : selectedListing ? (
          <ListingDetailView listing={selectedListing} />
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Active Subscriptions" value={crmData.summary.totalSubscriptions} icon={<Repeat />} color="blue" />
              <StatCard title="Active Members" value={crmData.summary.totalActiveMembers} icon={<Users />} color="emerald" />
              <StatCard title="Available Slots" value={crmData.summary.totalAvailableSlots} icon={<CreditCard />} color="amber" />
              <StatCard title="Monthly Revenue" value={`₦${crmData.summary.monthlyRevenue.toLocaleString()}`} icon={<Wallet />} color="purple" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-theme-primary mb-4">Your Subscriptions</h3>
              {crmData.listings.length === 0 ? (
                <div className="bg-theme-surface rounded-2xl border border-theme-divider p-8 text-center">
                  <div className="w-16 h-16 bg-[#5E43F3]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#5E43F3]">
                    <Repeat className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-theme-primary">No subscriptions yet</h4>
                  <p className="text-sm text-theme-tertiary max-w-sm mx-auto mt-2 mb-6">
                    Create your first subscription to start offering slots to members.
                  </p>
                  <button onClick={() => setIsCreateWizardOpen(true)} className="px-6 py-2.5 bg-theme-inverse text-theme-text-inverse font-bold rounded-full">
                    Create Subscription
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {crmData.listings.map((listing: any) => (
                    <button
                      key={listing._id}
                      onClick={() => setSelectedListing(listing)}
                      className="bg-theme-surface border border-theme-divider rounded-2xl p-5 text-left hover:border-theme-divider-strong transition-colors cursor-pointer flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3">
                          {listing.platformLogo ? (
                            <img src={listing.platformLogo} alt="Logo" className="w-10 h-10 object-contain rounded-lg bg-theme-base" />
                          ) : (
                            <div className="w-10 h-10 bg-theme-surface-hover rounded-lg flex items-center justify-center"><Repeat className="w-5 h-5 text-theme-tertiary" /></div>
                          )}
                          <div>
                            <h4 className="font-bold text-theme-primary">{listing.name}</h4>
                            <p className="text-xs text-theme-tertiary">₦{listing.defaultSlotPrice.toLocaleString()}/member/{listing.billingCycle}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-theme-primary">{listing.stats.occupied}/{listing.stats.totalCapacity}</span>
                          <p className="text-xs text-theme-tertiary">Occupied</p>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-theme-divider-light flex justify-between items-center text-sm">
                        <span className="text-theme-tertiary">Revenue</span>
                        <span className="font-bold text-emerald-600">₦{listing.stats.currentRevenue.toLocaleString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-[#5E43F3]/10 text-[#5E43F3]',
  };

  return (
    <div className="bg-theme-surface p-5 rounded-2xl border border-theme-divider flex flex-col">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {React.cloneElement(icon, { className: 'w-4 h-4' })}
      </div>
      <h4 className="text-xs font-bold text-theme-tertiary mb-1">{title}</h4>
      <div className="text-xl font-black text-theme-primary">{value}</div>
    </div>
  );
};

const ListingDetailView = ({ listing }: { listing: any }) => {
  return (
    <div className="space-y-6">
      <div className="bg-theme-surface rounded-2xl border border-theme-divider p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-theme-primary mb-1">{listing.name}</h2>
          <p className="text-sm text-theme-tertiary">Total Capacity: {listing.stats.totalCapacity} • Account Cost: ₦{listing.totalAccountCost.toLocaleString()}</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-theme-tertiary font-bold uppercase">Monthly Revenue</p>
            <p className="text-lg font-black text-emerald-600">₦{listing.stats.currentRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-theme-primary mb-4">Membership Slots</h3>
        <div className="bg-theme-surface border border-theme-divider rounded-2xl overflow-hidden">
          {listing.slots.map((slot: any, idx: number) => (
            <div key={slot._id} className={`p-4 flex items-center justify-between ${idx !== 0 ? 'border-t border-theme-divider-light' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-theme-surface-hover flex items-center justify-center font-bold text-theme-tertiary">
                  {slot.slotNumber}
                </div>
                {slot.status === 'occupied' && slot.member ? (
                  <div>
                    <p className="font-bold text-theme-primary">{slot.member.name || slot.member.username}</p>
                    <p className="text-xs text-theme-tertiary">{slot.role || 'Member'} • Joined {new Date(slot.membership?.startedAt).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-theme-tertiary">Available Slot</p>
                    <p className="text-xs text-theme-tertiary">Waiting for member</p>
                  </div>
                )}
              </div>
              <div className="text-right">
                {slot.status === 'occupied' && slot.membership ? (
                  <>
                    <p className="font-bold text-emerald-600">Active</p>
                    <p className="text-xs text-theme-tertiary">Renews {new Date(slot.membership.currentPeriodEnd).toLocaleDateString()}</p>
                  </>
                ) : (
                  <span className="px-3 py-1 bg-theme-surface-hover text-theme-tertiary text-xs font-bold rounded-full">Empty</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
