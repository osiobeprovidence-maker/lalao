import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Key, Activity, RefreshCw, Plus, CheckCircle2, Copy, Users, DollarSign, Database, Calendar } from 'lucide-react';
import { AddApiPartnerModal } from '../../components/admin/apiPartners/AddApiPartnerModal';
import { ApiPartnerDetailsModal } from '../../components/admin/apiPartners/ApiPartnerDetailsModal';

export const AdminApiPartners: React.FC = () => {
  const partners = useQuery(api.apiPartners.listPartners) || [];
  const stats = useQuery(api.apiPartners.getDashboardStats);
  
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-theme-primary">API Partners</h1>
          <p className="text-sm text-theme-tertiary mt-1">Manage external event platforms connected to Lalao.</p>
        </div>
        <button onClick={() => setShowAddPartner(true)} className="flex items-center gap-2 px-4 py-2 bg-[#5E43F3] text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Partner</span>
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-theme-surface p-5 rounded-2xl border border-theme-divider shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-theme-tertiary">
            <Users className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wide">Active Partners</h3>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-theme-primary">{stats?.activePartners || 0}</span>
        </div>
        <div className="bg-theme-surface p-5 rounded-2xl border border-theme-divider shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-theme-tertiary">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-sm uppercase tracking-wide">Monthly Revenue</h3>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-theme-primary">₦{(stats?.mrr || 0).toLocaleString()}</span>
        </div>
        <div className="bg-theme-surface p-5 rounded-2xl border border-theme-divider shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-theme-tertiary">
            <Database className="w-5 h-5 text-[#5E43F3]" />
            <h3 className="font-bold text-sm uppercase tracking-wide">API Requests</h3>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-theme-primary">{(stats?.totalRequests || 0).toLocaleString()}</span>
        </div>
        <div className="bg-theme-surface p-5 rounded-2xl border border-theme-divider shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-theme-tertiary">
            <Calendar className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-sm uppercase tracking-wide">Active Events</h3>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-theme-primary">{(stats?.activeEvents || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Partner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map((partner) => (
          <div key={partner._id} onClick={() => setSelectedPartnerId(partner._id)} className="bg-theme-surface p-6 rounded-2xl border border-theme-divider shadow-sm cursor-pointer hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-theme-primary">{partner.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-2 h-2 rounded-full ${partner.status === 'active' ? 'bg-green-500' : partner.status === 'pending' ? 'bg-orange-500' : 'bg-red-500'}`} />
                  <span className="text-xs font-semibold text-theme-tertiary capitalize">{partner.status}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 text-[#5E43F3] text-xs font-bold rounded-full">{partner.plan?.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-[10px] font-bold text-theme-tertiary uppercase tracking-wider block mb-1">Active Events</span>
                <span className="font-black text-xl text-theme-primary">{partner.activeEventsCount.toLocaleString()} <span className="text-sm text-theme-tertiary font-bold">/ {partner.plan?.eventLimit.toLocaleString()}</span></span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-theme-tertiary uppercase tracking-wider block mb-1">API Requests</span>
                <span className="font-black text-xl text-theme-primary">0 <span className="text-sm text-theme-tertiary font-bold">/ {partner.plan?.requestLimit.toLocaleString()}</span></span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-theme-divider-light flex items-center justify-between text-xs font-semibold text-theme-tertiary">
              <span>Added: {new Date(partner.createdAt).toLocaleDateString()}</span>
              <span className="text-[#5E43F3]">View Details →</span>
            </div>
          </div>
        ))}
        {partners.length === 0 && (
          <div className="col-span-full py-12 text-center text-theme-tertiary bg-theme-base rounded-2xl border border-theme-divider border-dashed">
            No API partners found. Add your first partner to get started.
          </div>
        )}
      </div>
      
      <div className="bg-theme-surface p-6 rounded-2xl border border-theme-divider shadow-sm mt-8">
        <h3 className="font-bold text-lg text-theme-primary mb-4">Partner Billing</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-theme-base text-theme-tertiary font-semibold">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Partner</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Monthly Fee</th>
                <th className="px-4 py-3">Events Limit</th>
                <th className="px-4 py-3 rounded-r-lg">API Requests Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium">
              {partners.map((p) => (
                <tr key={p._id}>
                  <td className="px-4 py-4 text-theme-primary">{p.name}</td>
                  <td className="px-4 py-4"><span className="px-2 py-1 bg-indigo-50 text-[#5E43F3] text-xs font-bold rounded-full">{p.plan?.name}</span></td>
                  <td className="px-4 py-4 text-theme-secondary">{p.plan?.currency} {p.plan?.monthlyPrice.toLocaleString()}</td>
                  <td className="px-4 py-4 text-theme-secondary">{p.activeEventsCount} / {p.plan?.eventLimit.toLocaleString()}</td>
                  <td className="px-4 py-4 text-theme-secondary">0 / {p.plan?.requestLimit.toLocaleString()}</td>
                </tr>
              ))}
              {partners.length === 0 && (
                <tr><td colSpan={5} className="text-center py-4 text-theme-tertiary">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddPartner && <AddApiPartnerModal onClose={() => setShowAddPartner(false)} />}
      {selectedPartnerId && <ApiPartnerDetailsModal partnerId={selectedPartnerId} onClose={() => setSelectedPartnerId(null)} />}
    </div>
  );
};
