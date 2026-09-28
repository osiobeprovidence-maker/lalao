import React, { useState } from 'react';
import { X, Save, Key, Copy, Check } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

export const AddApiPartnerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const createPartner = useMutation(api.apiPartners.createPartner);
  const generateCredentials = useMutation(api.apiPartners.generateCredentials);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  
  const [credentials, setCredentials] = useState<{ rawKey: string, prefix: string } | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contactName: '',
    contactEmail: '',
    company: '',
    type: 'event_platform',
    planName: 'Growth',
    monthlyPrice: 150000,
    currency: 'NGN',
    eventLimit: 5000,
    requestLimit: 100000,
    requestsPerMinute: 60,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const id = await createPartner({
        ...formData,
        permissions: ['create_events', 'update_events', 'cancel_events', 'read_events', 'analytics', 'webhooks']
      });
      setPartnerId(id);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert('Failed to create partner');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (environment: 'test' | 'live') => {
    if (!partnerId) return;
    setLoading(true);
    try {
      const creds = await generateCredentials({ partnerId: partnerId as any, environment });
      setCredentials(creds);
      setStep(3);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (credentials?.rawKey) {
      navigator.clipboard.writeText(credentials.rawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <h2 className="font-black text-lg text-neutral-900">
            {step === 1 && "Add API Partner"}
            {step === 2 && "Partner Created"}
            {step === 3 && "API Credentials"}
          </h2>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          {step === 1 && (
            <form id="add-partner" onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Platform Name</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })} className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5E43F3]" placeholder="e.g. My Events" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Partner Slug</label>
                  <input required value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5E43F3]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Company / Org</label>
                  <input value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5E43F3]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Partner Type</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5E43F3]">
                    <option value="event_platform">Event Platform</option>
                    <option value="ticketing_platform">Ticketing Platform</option>
                    <option value="marketplace">Marketplace</option>
                    <option value="media_platform">Media Platform</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Contact Name</label>
                  <input required value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5E43F3]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Contact Email</label>
                  <input type="email" required value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5E43F3]" />
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-100">
                <h3 className="font-bold text-sm text-neutral-900 mb-4">API Plan & Limits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Plan Name</label>
                    <input required value={formData.planName} onChange={e => setFormData({ ...formData, planName: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5E43F3]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Monthly Fee (NGN)</label>
                    <input type="number" required value={formData.monthlyPrice} onChange={e => setFormData({ ...formData, monthlyPrice: parseInt(e.target.value) || 0 })} className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5E43F3]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Event Limit / mo</label>
                    <input type="number" required value={formData.eventLimit} onChange={e => setFormData({ ...formData, eventLimit: parseInt(e.target.value) || 0 })} className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5E43F3]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">API Request Limit / mo</label>
                    <input type="number" required value={formData.requestLimit} onChange={e => setFormData({ ...formData, requestLimit: parseInt(e.target.value) || 0 })} className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5E43F3]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Rate Limit (req/min)</label>
                    <input type="number" required value={formData.requestsPerMinute} onChange={e => setFormData({ ...formData, requestsPerMinute: parseInt(e.target.value) || 0 })} className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#5E43F3]" />
                  </div>
                </div>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-neutral-900 mb-2">Partner Created Successfully</h3>
              <p className="text-sm text-neutral-500 mb-8">
                Generate API credentials so the partner can start integrating.
              </p>
              
              <div className="flex justify-center gap-4">
                <button disabled={loading} onClick={() => handleGenerate('test')} className="px-6 py-3 bg-neutral-100 text-neutral-900 font-bold rounded-xl hover:bg-neutral-200 transition-colors">
                  Generate Test Keys
                </button>
                <button disabled={loading} onClick={() => handleGenerate('live')} className="px-6 py-3 bg-[#5E43F3] text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors">
                  Generate Live Keys
                </button>
              </div>
            </div>
          )}

          {step === 3 && credentials && (
            <div className="py-4">
              <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl mb-6 flex gap-3 text-sm">
                <Key className="w-5 h-5 shrink-0" />
                <div>
                  <strong>Save these credentials securely!</strong>
                  <p>The secret API key will not be shown again. If lost, you must generate a new key.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-2 uppercase tracking-wider">API Key</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-neutral-100 p-4 rounded-xl text-sm font-mono break-all text-neutral-900 border border-neutral-200">
                      {credentials.rawKey}
                    </code>
                    <button onClick={handleCopy} className="p-4 bg-neutral-100 hover:bg-neutral-200 rounded-xl border border-neutral-200 transition-colors">
                      {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-neutral-600" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
          {step === 1 && (
            <>
              <button onClick={onClose} className="px-5 py-2.5 font-bold text-sm text-neutral-600 hover:bg-neutral-200 rounded-xl">Cancel</button>
              <button disabled={loading} form="add-partner" type="submit" className="px-5 py-2.5 bg-[#5E43F3] text-white font-bold text-sm rounded-xl flex items-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" /> Save Partner
              </button>
            </>
          )}
          {(step === 2 || step === 3) && (
            <button onClick={onClose} className="px-5 py-2.5 bg-neutral-900 text-white font-bold text-sm rounded-xl">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
