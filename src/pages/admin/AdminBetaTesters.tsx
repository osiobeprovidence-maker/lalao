import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { 
  Users, 
  Bug, 
  Smartphone,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  MoreVertical,
  Activity,
  AlertTriangle
} from 'lucide-react';

export const AdminBetaTesters: React.FC = () => {
  const stats = useQuery(api.beta.getAdminDashboardStats);
  const testers = useQuery(api.beta.getTesters);
  const feedbackList = useQuery(api.beta.getFeedback);
  const releases = useQuery(api.beta.getReleases);
  const settings = useQuery(api.beta.getBetaSettings);

  const createRelease = useMutation(api.beta.createRelease);
  const updateFeedbackStatus = useMutation(api.beta.updateFeedbackStatus);
  const updateSettings = useMutation(api.beta.updateSettings);

  const [activeTab, setActiveTab] = useState<'testers' | 'feedback' | 'releases' | 'settings'>('testers');

  // Release Form
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseForm, setReleaseForm] = useState({
    version: '',
    apkUrl: '',
    fileSize: '',
    minAndroidVersion: 'Android 8.0+',
    releaseNotes: '',
    isCurrent: true,
  });

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRelease(releaseForm);
      setShowReleaseModal(false);
      setReleaseForm({
        version: '',
        apkUrl: '',
        fileSize: '',
        minAndroidVersion: 'Android 8.0+',
        releaseNotes: '',
        isCurrent: true,
      });
    } catch (error) {
      console.error(error);
      alert('Failed to create release');
    }
  };

  const handleStatusChange = async (feedbackId: any, status: 'open' | 'in_review' | 'resolved' | 'closed') => {
    try {
      await updateFeedbackStatus({ feedbackId, status });
    } catch (error) {
      console.error(error);
      alert('Failed to update status');
    }
  };

  if (!stats || !testers || !feedbackList || !releases || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-theme-divider border-t-[#5E43F3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-theme-primary">Beta Testing Management</h1>
          <p className="text-sm text-theme-secondary mt-1">Manage beta testers, feedback, and releases</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'releases' && (
            <button 
              onClick={() => setShowReleaseModal(true)}
              className="px-4 py-2 bg-[#5E43F3] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#4E34E0]"
            >
              <Plus className="w-4 h-4" />
              New Release
            </button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-theme-surface border border-theme-divider flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              +{stats.newTesters} new
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-theme-primary">{stats.totalTesters}</div>
            <div className="text-xs text-theme-secondary font-medium">Total Testers</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-theme-surface border border-theme-divider flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Bug className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
              {stats.openBugs} open
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-theme-primary">{stats.totalFeedback}</div>
            <div className="text-xs text-theme-secondary font-medium">Total Feedback</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-theme-surface border border-theme-divider flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-theme-primary">{stats.resolvedBugs}</div>
            <div className="text-xs text-theme-secondary font-medium">Resolved Bugs</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#5E43F3]/5 border border-[#5E43F3]/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#5E43F3]/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-[#5E43F3]" />
            </div>
            <span className="text-xs font-bold text-[#5E43F3] bg-[#5E43F3]/10 px-2.5 py-1 rounded-full">
              Current
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-[#5E43F3]">{stats.currentVersion}</div>
            <div className="text-xs text-[#5E43F3]/80 font-medium">Active Release</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-1 p-1 bg-theme-surface border border-theme-divider rounded-xl w-max">
        {(['testers', 'feedback', 'releases', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-bold rounded-lg capitalize transition-colors ${
              activeTab === tab 
                ? 'bg-theme-base text-theme-primary shadow-sm border border-theme-divider/50' 
                : 'text-theme-secondary hover:text-theme-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-theme-surface border border-theme-divider rounded-2xl p-6">
        {activeTab === 'testers' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-theme-primary mb-4">Registered Testers ({testers.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-theme-divider text-xs font-bold text-theme-tertiary uppercase tracking-wider">
                    <th className="py-3 px-4">Tester</th>
                    <th className="py-3 px-4">Device</th>
                    <th className="py-3 px-4">Android Version</th>
                    <th className="py-3 px-4">Joined</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-divider">
                  {testers.map(tester => (
                    <tr key={tester._id} className="hover:bg-theme-surface-hover/50">
                      <td className="py-3 px-4">
                        <div className="text-sm font-bold text-theme-primary">{tester.name}</div>
                        <div className="text-xs text-theme-secondary">{tester.email}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-theme-secondary">{tester.device}</td>
                      <td className="py-3 px-4 text-sm text-theme-secondary">{tester.androidVersion}</td>
                      <td className="py-3 px-4 text-sm text-theme-secondary">
                        {new Date(tester.registrationDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          tester.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-theme-divider/50 text-theme-secondary'
                        }`}>
                          {tester.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-theme-primary mb-4">Feedback & Bug Reports</h2>
            <div className="grid grid-cols-1 gap-4">
              {feedbackList.map(item => (
                <div key={item._id} className="p-4 border border-theme-divider rounded-xl hover:border-theme-primary/20 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        item.type === 'bug' ? 'bg-amber-500/10 text-amber-500' : 
                        item.type === 'suggestion' ? 'bg-blue-500/10 text-blue-500' : 
                        'bg-theme-divider text-theme-secondary'
                      }`}>
                        {item.type}
                      </span>
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-theme-surface-hover text-theme-primary">
                        {item.feature}
                      </span>
                    </div>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item._id, e.target.value as any)}
                      className={`text-xs font-bold rounded-lg px-2 py-1 border ${
                        item.status === 'open' ? 'border-amber-500/30 text-amber-600 bg-amber-500/10' :
                        item.status === 'in_review' ? 'border-blue-500/30 text-blue-600 bg-blue-500/10' :
                        'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                      }`}
                    >
                      <option value="open">Open</option>
                      <option value="in_review">In Review</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <p className="text-sm text-theme-primary my-2 font-medium">{item.description}</p>
                  <div className="flex items-center justify-between mt-3 text-xs text-theme-tertiary">
                    <div className="flex gap-4">
                      <span>By: {item.testerName} ({item.testerEmail})</span>
                      <span>Device: {item.device}</span>
                    </div>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'releases' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-theme-primary mb-4">APK Releases</h2>
            <div className="grid grid-cols-1 gap-4">
              {releases.map(release => (
                <div key={release._id} className={`p-5 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  release.isCurrent ? 'border-[#5E43F3] bg-[#5E43F3]/5' : 'border-theme-divider'
                }`}>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-base font-black text-theme-primary">v{release.version}</span>
                      {release.isCurrent && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#5E43F3] text-white uppercase tracking-wider">
                          Active Release
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-theme-secondary flex gap-4 mt-2">
                      <span>Size: {release.fileSize}</span>
                      <span>Req: {release.minAndroidVersion}</span>
                      <span>Date: {new Date(release.releaseDate).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-theme-primary mt-3 bg-theme-base p-3 rounded-lg border border-theme-divider/50">
                      <span className="font-bold">Release Notes:</span><br/>
                      {release.releaseNotes}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a 
                      href={release.apkUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-4 py-2 rounded-lg bg-theme-base border border-theme-divider text-xs font-bold text-theme-primary hover:bg-theme-surface-hover"
                    >
                      Download APK
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <h2 className="text-lg font-bold text-theme-primary mb-6">Beta Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-theme-tertiary uppercase tracking-wider">Open LaLao URL</label>
                <input 
                  type="text"
                  defaultValue={settings.openLalaoUrl}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-theme-divider bg-theme-base text-sm font-medium focus:border-[#5E43F3] outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-theme-tertiary uppercase tracking-wider">Beta Community URL (e.g. Telegram/Discord)</label>
                <input 
                  type="text"
                  defaultValue={settings.betaCommunityUrl}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-theme-divider bg-theme-base text-sm font-medium focus:border-[#5E43F3] outline-none"
                />
              </div>
              <button className="px-4 py-2 bg-[#5E43F3] text-white rounded-lg text-sm font-bold hover:bg-[#4E34E0]">
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Release Modal */}
      {showReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-theme-surface w-full max-w-lg rounded-3xl p-6 shadow-xl border border-theme-divider">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-theme-primary">Create New Release</h2>
              <button onClick={() => setShowReleaseModal(false)} className="text-theme-tertiary hover:text-theme-primary">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateRelease} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-theme-tertiary uppercase">Version</label>
                  <input
                    required
                    value={releaseForm.version}
                    onChange={e => setReleaseForm({...releaseForm, version: e.target.value})}
                    placeholder="e.g. 1.0.0-beta.1"
                    className="w-full mt-1.5 px-3 py-2 rounded-xl border border-theme-divider bg-theme-base text-sm focus:border-[#5E43F3] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-theme-tertiary uppercase">File Size</label>
                  <input
                    required
                    value={releaseForm.fileSize}
                    onChange={e => setReleaseForm({...releaseForm, fileSize: e.target.value})}
                    placeholder="e.g. 45 MB"
                    className="w-full mt-1.5 px-3 py-2 rounded-xl border border-theme-divider bg-theme-base text-sm focus:border-[#5E43F3] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-theme-tertiary uppercase">APK Download URL</label>
                <input
                  required
                  type="url"
                  value={releaseForm.apkUrl}
                  onChange={e => setReleaseForm({...releaseForm, apkUrl: e.target.value})}
                  placeholder="https://..."
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-theme-divider bg-theme-base text-sm focus:border-[#5E43F3] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-theme-tertiary uppercase">Min Android Version</label>
                <input
                  required
                  value={releaseForm.minAndroidVersion}
                  onChange={e => setReleaseForm({...releaseForm, minAndroidVersion: e.target.value})}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-theme-divider bg-theme-base text-sm focus:border-[#5E43F3] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-theme-tertiary uppercase">Release Notes</label>
                <textarea
                  required
                  rows={3}
                  value={releaseForm.releaseNotes}
                  onChange={e => setReleaseForm({...releaseForm, releaseNotes: e.target.value})}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-theme-divider bg-theme-base text-sm focus:border-[#5E43F3] outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isCurrent"
                  checked={releaseForm.isCurrent}
                  onChange={e => setReleaseForm({...releaseForm, isCurrent: e.target.checked})}
                  className="w-4 h-4 rounded text-[#5E43F3] focus:ring-[#5E43F3]"
                />
                <label htmlFor="isCurrent" className="text-sm font-medium text-theme-primary">
                  Set as Active Release (replaces current)
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-sm font-black shadow-md transition-all"
              >
                Publish Release
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
