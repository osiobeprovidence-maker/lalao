import React, { useState } from 'react';
import { X, Key, Shield, Activity, DollarSign, Database, Copy, RefreshCw, KeyRound, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

export const ApiPartnerDetailsModal: React.FC<{ partnerId: string, onClose: () => void }> = ({ partnerId, onClose }) => {
  const details = useQuery(api.apiPartners.getPartnerDetails, { partnerId: partnerId as any });
  const generateCredentials = useMutation(api.apiPartners.generateCredentials);

  const [generating, setGenerating] = useState(false);
  const [newCreds, setNewCreds] = useState<{ rawKey: string, env: string } | null>(null);
  
  if (!details) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-10 h-10 border-4 border-[#5E43F3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { partner, plan, credentials, permissions, eventsCount, activeEventsCount, usageCount } = details;

  const handleGenerate = async (env: 'test' | 'live') => {
    if (confirm(`Are you sure you want to rotate the ${env} key? The old key will immediately stop working.`)) {
      setGenerating(true);
      try {
        const res = await generateCredentials({ partnerId: partnerId as any, environment: env });
        setNewCreds({ rawKey: res.rawKey, env });
      } catch (e) {
        console.error(e);
      } finally {
        setGenerating(false);
      }
    }
  };

  const copyKey = () => {
    if (newCreds) {
      navigator.clipboard.writeText(newCreds.rawKey);
      alert('Copied to clipboard');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl flex flex-col h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 shrink-0">
          <div>
            <h2 className="font-black text-2xl text-neutral-900">{partner.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded capitalize">{partner.status}</span>
              <span className="text-xs text-neutral-500 font-mono">Slug: {partner.slug}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1 bg-neutral-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Overview Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2 text-neutral-500">
                    <Database className="w-5 h-5 text-[#5E43F3]" />
                    <h3 className="font-bold text-sm uppercase tracking-wide">API Usage</h3>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-neutral-900">{usageCount.toLocaleString()}</span>
                    <span className="text-sm font-bold text-neutral-400 mb-1">/ {plan?.requestLimit.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-[#5E43F3] h-full rounded-full" style={{ width: `${Math.min(100, (usageCount / (plan?.requestLimit || 1)) * 100)}%` }} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2 text-neutral-500">
                    <Activity className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold text-sm uppercase tracking-wide">Events</h3>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-neutral-900">{activeEventsCount.toLocaleString()}</span>
                    <span className="text-sm font-bold text-neutral-400 mb-1">/ {plan?.eventLimit.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${Math.min(100, (activeEventsCount / (plan?.eventLimit || 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>

              {/* Credentials */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                <h3 className="font-bold text-lg text-neutral-900 mb-4 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-neutral-500" /> API Credentials
                </h3>
                
                {newCreds && (
                  <div className="bg-orange-50 p-4 rounded-xl mb-6 border border-orange-200">
                    <div className="flex gap-2 text-orange-800 font-bold mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      New {newCreds.env.toUpperCase()} Key Generated!
                    </div>
                    <p className="text-sm text-orange-700 mb-3">Copy it now, it will not be shown again.</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white p-3 rounded-lg border border-orange-200 font-mono text-sm break-all">{newCreds.rawKey}</code>
                      <button onClick={copyKey} className="p-3 bg-white border border-orange-200 rounded-lg hover:bg-orange-100"><Copy className="w-5 h-5 text-orange-700" /></button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {['live', 'test'].map(env => {
                    const activeKey = credentials.find(c => c.environment === env && !c.revokedAt);
                    return (
                      <div key={env} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${env === 'live' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                            <span className="font-bold text-sm uppercase">{env} API</span>
                          </div>
                          {activeKey ? (
                            <code className="text-xs font-mono text-neutral-500">{activeKey.prefix}••••••••</code>
                          ) : (
                            <span className="text-xs text-neutral-400 italic">No active key</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            disabled={generating}
                            onClick={() => handleGenerate(env as 'test'|'live')}
                            className="px-3 py-1.5 text-xs font-bold bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50"
                          >
                            Rotate Key
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                <h3 className="font-bold text-sm text-neutral-400 uppercase tracking-wide mb-4">Plan Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-neutral-100 pb-2">
                    <span className="text-neutral-500">Plan</span>
                    <span className="font-bold text-neutral-900">{plan?.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100 pb-2">
                    <span className="text-neutral-500">Monthly Fee</span>
                    <span className="font-bold text-neutral-900">{plan?.currency} {plan?.monthlyPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100 pb-2">
                    <span className="text-neutral-500">Rate Limit</span>
                    <span className="font-bold text-neutral-900">{plan?.requestsPerMinute}/min</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                <h3 className="font-bold text-sm text-neutral-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Permissions
                </h3>
                <div className="space-y-2">
                  {permissions.map(p => (
                    <div key={p} className="flex items-center gap-2 text-sm text-neutral-700">
                      <div className="w-4 h-4 rounded bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="font-semibold">{p.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
