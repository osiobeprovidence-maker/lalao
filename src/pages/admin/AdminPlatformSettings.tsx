import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Save } from 'lucide-react';

export const AdminPlatformSettings: React.FC = () => {
  const settingsMap = useQuery(api.admin.getPlatformSettings);
  const updateSetting = useMutation(api.admin.updatePlatformSetting);
  
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleSave = async (key: string, value: string) => {
    try {
      await updateSetting({ key, value });
      setEditing((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (e: any) {
      alert(`Error saving setting: ${e.message}`);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    try {
      await updateSetting({ key: newKey.trim(), value: newValue.trim() });
      setNewKey('');
      setNewValue('');
    } catch (e: any) {
      alert(`Error adding setting: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Platform Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Global feature flags and configuration key-values</p>
      </div>

      <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 p-6">
        <h2 className="text-sm font-bold text-white mb-4">Add New Setting</h2>
        <form onSubmit={handleAdd} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Key</label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="e.g. enable_new_checkout"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Value (JSON/String)</label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="e.g. true"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!newKey.trim() || !newValue.trim()}
            className="h-[38px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Add
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/40 bg-slate-800/30">
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 w-1/3">Key</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Value</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {settingsMap === undefined ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">Loading settings...</td>
              </tr>
            ) : Object.keys(settingsMap).length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500 text-sm">No settings configured</td>
              </tr>
            ) : (
              Object.entries(settingsMap).map(([key, value]) => (
                <tr key={key} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-300">
                    {key}
                  </td>
                  <td className="px-4 py-3">
                    {editing[key] !== undefined ? (
                      <input
                        autoFocus
                        value={editing[key]}
                        onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                        className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                      />
                    ) : (
                      <span className="font-mono text-xs text-slate-300 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50 break-all">
                        {value}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editing[key] !== undefined ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSave(key, editing[key])}
                          className="text-emerald-400 hover:text-emerald-300 text-xs font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            const next = { ...editing };
                            delete next[key];
                            setEditing(next);
                          }}
                          className="text-slate-500 hover:text-slate-300 text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditing({ ...editing, [key]: value })}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-bold"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
