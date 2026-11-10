import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Sparkles,
  ShieldCheck,
  Settings,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Smartphone,
  Wifi,
  Search,
  Filter,
  DollarSign,
  Award,
} from 'lucide-react';

export const AdminEggRewardsSection: React.FC = () => {
  const eggAdmin = useQuery((api as any).egg.getEggAdminOverview);
  const updateEggConfig = useMutation((api as any).egg.updateEggConfigAdmin);
  const adjustEggPoints = useMutation((api as any).egg.adjustUserEggPointsAdmin);

  const [searchUser, setSearchUser] = useState('');
  const [selectedConfigKey, setSelectedConfigKey] = useState<string | null>(null);
  const [configValueInput, setConfigValueInput] = useState('');
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveConfig = async (key: string, val: string) => {
    setIsUpdating(true);
    setMessage(null);
    try {
      await updateEggConfig({ key, value: val });
      setMessage({ type: 'success', text: `Saved configuration for ${key}` });
      setSelectedConfigKey(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update config' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustUserId.trim() || !adjustPoints || !adjustReason.trim()) return;

    setIsUpdating(true);
    setMessage(null);
    try {
      await adjustEggPoints({
        userId: adjustUserId.trim() as any,
        pointsDelta: parseInt(adjustPoints, 10),
        reason: adjustReason.trim(),
      });
      setMessage({ type: 'success', text: `Adjusted points for user successfully` });
      setAdjustPoints('');
      setAdjustReason('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to adjust points' });
    } finally {
      setIsUpdating(false);
    }
  };

  const overview = eggAdmin;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0E131F] via-[#161B26] to-[#251A4D] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>LaLao Egg</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#5E43F3]/30 text-cyan-300 border border-cyan-400/30">
                Chatroom Rewards Control
              </span>
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Configure room earning rates, daily ceilings (₦1,000 max), anti-fraud rules, and review redemptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">Daily Max Ceiling</span>
            <span className="text-lg font-black text-cyan-300">₦1,000 / day</span>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-theme-surface border border-theme-divider shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Egg Participants</span>
          <div className="text-2xl font-black text-theme-primary">{overview?.totalUsers ?? 0}</div>
          <p className="text-[11px] text-theme-tertiary">Active room earners</p>
        </div>

        <div className="p-5 rounded-2xl bg-theme-surface border border-theme-divider shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Points in Circulation</span>
          <div className="text-2xl font-black text-cyan-600">{(overview?.totalPointsInCirculation ?? 0).toLocaleString()}</div>
          <p className="text-[11px] text-theme-tertiary">≈ ₦{Math.floor((overview?.totalPointsInCirculation ?? 0) / 10).toLocaleString()}</p>
        </div>

        <div className="p-5 rounded-2xl bg-theme-surface border border-theme-divider shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Total Redeemed</span>
          <div className="text-2xl font-black text-emerald-600">₦{(overview?.totalNairaRedeemed ?? 0).toLocaleString()}</div>
          <p className="text-[11px] text-theme-tertiary">Airtime & data rewards paid</p>
        </div>

        <div className="p-5 rounded-2xl bg-theme-surface border border-theme-divider shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Flagged Accounts</span>
          <div className="text-2xl font-black text-rose-600">{overview?.flaggedCount ?? 0}</div>
          <p className="text-[11px] text-theme-tertiary">Suspicious farming alerts</p>
        </div>
      </div>

      {/* Reward Parameters Configuration Form */}
      <div className="p-6 rounded-3xl bg-theme-surface border border-theme-divider shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-theme-primary">Reward Rules & Anti-Fraud Parameters</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {overview?.configurations?.map((cfg: any) => (
            <div key={cfg.key} className="p-4 rounded-2xl bg-theme-base border border-theme-divider-light space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-theme-primary font-mono">{cfg.key}</span>
              </div>
              <p className="text-[11px] text-theme-tertiary">{cfg.description}</p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  defaultValue={cfg.value}
                  id={`input-cfg-${cfg.key}`}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-theme-surface border border-theme-divider text-xs text-theme-primary font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(`input-cfg-${cfg.key}`) as HTMLInputElement;
                    if (el) handleSaveConfig(cfg.key, el.value.trim());
                  }}
                  disabled={isUpdating}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Points Adjustment Tool */}
      <div className="p-6 rounded-3xl bg-theme-surface border border-theme-divider shadow-sm space-y-4">
        <h3 className="text-base font-bold text-theme-primary flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-indigo-600" />
          <span>Manual User Points Adjustment</span>
        </h3>
        <form onSubmit={handleAdjustPoints} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <input
            type="text"
            value={adjustUserId}
            onChange={(e) => setAdjustUserId(e.target.value)}
            placeholder="User ID (e.g. k57...)"
            className="px-3.5 py-2.5 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary font-mono"
            required
          />
          <input
            type="number"
            value={adjustPoints}
            onChange={(e) => setAdjustPoints(e.target.value)}
            placeholder="Points Delta (e.g. 500 or -200)"
            className="px-3.5 py-2.5 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary font-mono"
            required
          />
          <input
            type="text"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="Audit Reason"
            className="px-3.5 py-2.5 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary"
            required
          />
          <button
            type="submit"
            disabled={isUpdating}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer transition-colors"
          >
            Apply Adjustment
          </button>
        </form>
      </div>

      {/* Recent Egg Redemptions Table */}
      <div className="p-6 rounded-3xl bg-theme-surface border border-theme-divider shadow-sm space-y-4">
        <h3 className="text-base font-bold text-theme-primary flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-indigo-600" />
          <span>Recent Room Egg Redemptions</span>
        </h3>

        {(!overview?.recentRedemptions || overview.recentRedemptions.length === 0) ? (
          <p className="text-xs text-theme-tertiary">No redemptions requested yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-theme-divider text-theme-tertiary uppercase text-[10px] font-bold">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5">Network & Phone</th>
                  <th className="py-2.5">Plan / Value</th>
                  <th className="py-2.5">Points</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-divider-light">
                {overview.recentRedemptions.map((r: any) => (
                  <tr key={r._id} className="hover:bg-theme-surface-hover">
                    <td className="py-3 font-mono text-theme-tertiary">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-bold uppercase text-theme-primary">{r.category}</td>
                    <td className="py-3 font-mono">{r.network} - {r.phoneNumber}</td>
                    <td className="py-3 font-bold text-emerald-600">₦{r.amountNaira}</td>
                    <td className="py-3 font-mono text-theme-secondary">{r.pointsCost.toLocaleString()} pts</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
