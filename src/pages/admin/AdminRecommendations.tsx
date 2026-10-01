import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Plus, Trash2, Search, Star, Zap } from 'lucide-react';
import { Avatar } from '../../components/common/Avatar';

export const AdminRecommendations: React.FC = () => {
  const recommendations = useQuery(api.recommendations.getAllRecommendations) || [];
  const addSeed = useMutation(api.recommendations.addRecommendationSeed);
  const removeSeed = useMutation(api.recommendations.removeRecommendationSeed);

  const [isAdding, setIsAdding] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [targetType, setTargetType] = useState<'user' | 'page' | 'community'>('user');
  const [category, setCategory] = useState('seed');
  const [priority, setPriority] = useState(10);
  
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;
    try {
      await addSeed({
        targetId,
        targetType,
        category,
        priority: Number(priority),
      });
      setIsAdding(false);
      setTargetId('');
    } catch (err) {
      console.error(err);
      alert('Failed to add recommendation.');
    }
  };

  const handleRemove = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this recommendation?')) {
      await removeSeed({ targetId: id });
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-theme-primary flex items-center gap-2">
            <Star className="w-6 h-6 text-indigo-500" />
            Recommendations & Feed Seeding
          </h1>
          <p className="text-sm text-theme-tertiary mt-1">
            Manage the "seed" accounts that populate the For You feed for new users.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          {isAdding ? 'Cancel' : <><Plus className="w-4 h-4" /> Add Seed Account</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-theme-surface p-6 rounded-2xl border border-theme-divider/80 shadow-sm">
          <h2 className="text-lg font-bold text-theme-primary mb-4">Add Recommendation</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Target ID (User/Page ID)</label>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-theme-divider-strong rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="e.g. jh78qw..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Target Type</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="w-full px-4 py-2 border border-theme-divider-strong rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="user">User</option>
                <option value="page">Page</option>
                <option value="community">Community</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-4 py-2 border border-theme-divider-strong rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Priority (Higher = better)</label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                required
                className="w-full px-4 py-2 border border-theme-divider-strong rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                className="px-6 py-2 bg-theme-inverse text-theme-text-inverse rounded-xl font-bold hover:bg-theme-inverse transition-colors"
              >
                Save Recommendation
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-theme-surface rounded-2xl border border-theme-divider/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-theme-base/50 border-b border-theme-divider/80">
              <tr>
                <th className="px-6 py-4 font-semibold text-theme-secondary">Target</th>
                <th className="px-6 py-4 font-semibold text-theme-secondary">Type</th>
                <th className="px-6 py-4 font-semibold text-theme-secondary">Category</th>
                <th className="px-6 py-4 font-semibold text-theme-secondary">Priority</th>
                <th className="px-6 py-4 font-semibold text-theme-secondary">Status</th>
                <th className="px-6 py-4 font-semibold text-theme-secondary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {recommendations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-theme-tertiary">
                    No recommendations found. Add one above.
                  </td>
                </tr>
              ) : (
                recommendations.map((rec) => (
                  <tr key={rec._id} className="hover:bg-theme-base transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-theme-primary flex items-center gap-1.5">
                            {rec.targetName}
                          </span>
                          <span className="text-xs text-theme-tertiary">@{rec.targetHandle}</span>
                          <span className="text-[10px] text-theme-tertiary font-mono mt-1">{rec.targetId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-theme-secondary bg-theme-surface-hover px-2.5 py-1 rounded-md text-xs font-medium">
                        {rec.targetType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-theme-secondary">{rec.category}</td>
                    <td className="px-6 py-4 text-theme-secondary font-medium">{rec.priority}</td>
                    <td className="px-6 py-4">
                      {rec.active ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-100">
                          Active
                        </span>
                      ) : (
                        <span className="text-theme-tertiary bg-theme-surface-hover px-2.5 py-1 rounded-md text-xs font-medium border border-theme-divider">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {rec.active && (
                        <button
                          onClick={() => handleRemove(rec.targetId)}
                          className="p-2 text-theme-tertiary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Deactivate"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
};
