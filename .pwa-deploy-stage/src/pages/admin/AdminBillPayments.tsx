import React, { useState } from 'react';
import {
  Zap,
  Tv,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  Server,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Activity,
  Layers,
  HelpCircle,
  Search,
  ExternalLink
} from 'lucide-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export const AdminBillPayments: React.FC = () => {
  const settingsData = useQuery(api.clubkonnect.adminGetBillPaymentSettings);
  const updateSettings = useMutation(api.clubkonnect.adminUpdateBillPaymentSettings);
  const testConnection = useAction(api.clubkonnect.adminTestClubKonnectConnection);

  const [activeTab, setActiveTab] = useState<'connection' | 'services' | 'pricing'>('connection');
  const [testingConn, setTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const [servicesForm, setServicesForm] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync loaded settings into local editable form
  React.useEffect(() => {
    if (settingsData?.services && !servicesForm) {
      setServicesForm(settingsData.services);
    }
  }, [settingsData, servicesForm]);

  const handleTestConnection = async () => {
    setTestingConn(true);
    setTestResult(null);
    try {
      const res = await testConnection();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        status: 'NETWORK_ERROR',
        error: e.message || 'Connection test failed',
      });
    } finally {
      setTestingConn(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicesForm) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateSettings({ services: servicesForm });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleService = (key: string) => {
    setServicesForm((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key]?.enabled,
      },
    }));
  };

  const updateFee = (key: string, feeVal: number) => {
    setServicesForm((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        fee: Math.max(0, feeVal),
      },
    }));
  };

  const connectionState = testResult || settingsData?.connectionInfo?.lastStatus;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-theme-primary tracking-tight">
            Bill Payments & ClubKonnect
          </h1>
          <p className="text-xs sm:text-sm text-theme-tertiary mt-1">
            Configure ClubKonnect integration, service availability, customer platform fees, and live diagnostics.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-theme-divider">
        <button
          type="button"
          onClick={() => setActiveTab('connection')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'connection'
              ? 'border-[#5E43F3] text-[#5E43F3]'
              : 'border-transparent text-theme-tertiary hover:text-theme-primary'
          }`}
        >
          Provider Connection
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'services'
              ? 'border-[#5E43F3] text-[#5E43F3]'
              : 'border-transparent text-theme-tertiary hover:text-theme-primary'
          }`}
        >
          Services Availability
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'pricing'
              ? 'border-[#5E43F3] text-[#5E43F3]'
              : 'border-transparent text-theme-tertiary hover:text-theme-primary'
          }`}
        >
          Fees & Pricing Markup
        </button>
      </div>

      {/* TAB 1: CONNECTION DIAGNOSTICS */}
      {activeTab === 'connection' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider space-y-1">
              <span className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">
                Connection Status
              </span>
              <div className="flex items-center gap-2 pt-1">
                {connectionState?.status === 'CONNECTED' ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-base">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Connected</span>
                  </div>
                ) : connectionState?.status === 'CONFIGURATION_MISSING' ? (
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold text-base">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Config Missing</span>
                  </div>
                ) : connectionState?.status === 'AUTHENTICATION_FAILED' ? (
                  <div className="flex items-center gap-1.5 text-red-500 font-bold text-base">
                    <XCircle className="w-5 h-5" />
                    <span>Auth Failed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-theme-secondary font-bold text-base">
                    <Activity className="w-5 h-5 text-theme-tertiary" />
                    <span>{connectionState?.status || 'Not Tested'}</span>
                  </div>
                )}
              </div>
              <span className="text-[11px] text-theme-tertiary">Real server API check</span>
            </div>

            <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider space-y-1">
              <span className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">
                Provider Wallet Balance
              </span>
              <p className="text-xl sm:text-2xl font-black text-theme-primary">
                {connectionState?.balance ? `₦${parseFloat(connectionState.balance).toLocaleString()}` : '—'}
              </p>
              <span className="text-[11px] text-theme-tertiary">ClubKonnect float balance</span>
            </div>

            <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider space-y-1">
              <span className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">
                Secrets State
              </span>
              <div className="flex items-center gap-2 text-xs font-medium pt-1">
                <span className={settingsData?.connectionInfo?.hasUserId ? 'text-emerald-500 font-bold' : 'text-red-500'}>
                  {settingsData?.connectionInfo?.hasUserId ? '✓ UserID set' : '✗ UserID missing'}
                </span>
                <span>·</span>
                <span className={settingsData?.connectionInfo?.hasApiKey ? 'text-emerald-500 font-bold' : 'text-red-500'}>
                  {settingsData?.connectionInfo?.hasApiKey ? '✓ APIKey set' : '✗ APIKey missing'}
                </span>
              </div>
              <span className="text-[11px] text-theme-tertiary">Convex backend env</span>
            </div>
          </div>

          {/* Action Box */}
          <div className="p-5 rounded-2xl bg-theme-surface border border-theme-divider flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-theme-primary">Test Live ClubKonnect Connection</h3>
              <p className="text-xs text-theme-tertiary">
                Makes a real HTTPS call to ClubKonnect's wallet balance API using server credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConn}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-bold transition-all shadow-md shadow-[#5E43F3]/25 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${testingConn ? 'animate-spin' : ''}`} />
              <span>{testingConn ? 'Testing Endpoint...' : 'Run Connection Test'}</span>
            </button>
          </div>

          {connectionState?.error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Diagnostics: Provider Response</span>
              </div>
              <p className="font-mono text-[11px]">{connectionState.error}</p>
            </div>
          )}

          {/* Setup Guide */}
          <div className="p-5 rounded-2xl bg-theme-surface border border-theme-divider space-y-3">
            <h3 className="font-bold text-sm text-theme-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#5E43F3]" />
              <span>ClubKonnect Setup & Environment Variables</span>
            </h3>
            <p className="text-xs text-theme-tertiary leading-relaxed">
              To configure live bill payments, set the following environment variables in your Convex deployment dashboard under <strong>Settings &gt; Environment Variables</strong>:
            </p>
            <div className="p-3 rounded-xl bg-theme-base border border-theme-divider font-mono text-xs space-y-1 text-theme-primary">
              <div>CLUBKONNECT_USER_ID=your_user_id</div>
              <div>CLUBKONNECT_API_KEY=your_secret_api_key</div>
            </div>
            <p className="text-[11px] text-theme-tertiary">
              Note: ClubKonnect requires your server's outbound IP to be whitelisted on your ClubKonnect dashboard profile.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: SERVICES TOGGLES */}
      {activeTab === 'services' && servicesForm && (
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-theme-primary">Service Enablement</h3>
              <p className="text-xs text-theme-tertiary">
                Disabled services are rejected server-side and hidden from customer screens.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(servicesForm).map((key) => {
              const svc = servicesForm[key];
              return (
                <div
                  key={key}
                  className="p-4 rounded-2xl bg-theme-surface border border-theme-divider space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-theme-primary">{svc.label}</h4>
                      <p className="text-[11px] text-theme-tertiary uppercase tracking-wider font-semibold">
                        Category: {key}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleService(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        svc.enabled
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-neutral-500/10 text-neutral-500 border border-neutral-500/20'
                      }`}
                    >
                      {svc.enabled ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4" />}
                      <span>{svc.enabled ? 'Enabled' : 'Disabled'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-theme-tertiary pt-2 border-t border-theme-divider">
                    <span>Transaction Limits:</span>
                    <span className="font-bold text-theme-primary">
                      ₦{svc.minAmount?.toLocaleString()} – ₦{svc.maxAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </form>
      )}

      {/* TAB 3: FEES & PRICING MARKUP */}
      {activeTab === 'pricing' && servicesForm && (
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-theme-primary">Platform Fees Configuration</h3>
              <p className="text-xs text-theme-tertiary">
                Configure convenience platform fees charged per bill payment category in Naira (₦).
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Fees'}</span>
            </button>
          </div>

          <div className="bg-theme-surface rounded-2xl border border-theme-divider divide-y divide-theme-divider overflow-hidden">
            {Object.keys(servicesForm).map((key) => {
              const svc = servicesForm[key];
              return (
                <div key={key} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-theme-primary">{svc.label}</h4>
                    <p className="text-xs text-theme-tertiary">Platform convenience fee charged to customer</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-theme-primary">₦</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={svc.fee || 0}
                      onChange={(e) => updateFee(key, Number(e.target.value))}
                      className="w-24 px-3 py-1.5 rounded-xl bg-theme-base border border-theme-divider text-xs font-bold text-theme-primary focus:border-[#5E43F3] outline-hidden text-right"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </form>
      )}
    </div>
  );
};
