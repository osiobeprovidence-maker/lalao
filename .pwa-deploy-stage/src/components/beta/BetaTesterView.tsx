import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { 
  Smartphone, 
  Download, 
  Bug, 
  MessageSquarePlus, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BetaTesterView: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, triggerShareToast } = useLalao();

  const settings = useQuery(api.beta.getBetaSettings);
  const currentRelease = useQuery(api.beta.getCurrentRelease);

  const submitFeedback = useMutation(api.beta.submitFeedback);

  const [activeTab, setActiveTab] = useState<'hub' | 'feedback'>('hub');
  
  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'bug' as 'bug' | 'suggestion' | 'general',
    feature: 'Feed',
    description: '',
    device: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.description) {
      triggerShareToast('Please provide a description');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await submitFeedback({
        testerName: currentUser?.name || 'Anonymous Tester',
        testerEmail: currentUser?.email || 'unknown@example.com',
        lalaoUsername: currentUser?.username || 'unknown',
        type: feedbackForm.type,
        feature: feedbackForm.feature,
        description: feedbackForm.description,
        device: feedbackForm.device || 'Unknown Device',
        priority: feedbackForm.priority,
      });
      setFeedbackSuccess(true);
      triggerShareToast('Feedback submitted successfully. Thank you!');
      setFeedbackForm({ ...feedbackForm, description: '' });
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const renderFeedbackForm = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-4">
        <button 
          onClick={() => setActiveTab('hub')}
          className="text-xs font-bold text-theme-secondary hover:text-theme-primary flex items-center gap-1 transition-colors"
        >
          <ChevronDown className="w-4 h-4 rotate-90" />
          Back to Hub
        </button>
      </div>

      <div className="bg-theme-surface border border-theme-divider rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Bug className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-theme-primary">Report an Issue</h2>
            <p className="text-xs text-theme-secondary mt-0.5">Found a bug or have a suggestion?</p>
          </div>
        </div>

        {feedbackSuccess ? (
          <div className="p-6 text-center border border-theme-divider rounded-2xl bg-emerald-500/5">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-black text-theme-primary">Feedback Submitted!</h3>
            <p className="text-xs text-theme-secondary mt-1">Thank you for helping improve LaLao.</p>
            <button
              onClick={() => setActiveTab('hub')}
              className="mt-6 px-5 py-2.5 rounded-xl bg-theme-base border border-theme-divider text-xs font-bold text-theme-primary hover:bg-theme-surface-hover transition-colors"
            >
              Return to Hub
            </button>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setFeedbackForm({...feedbackForm, type: 'bug'})}
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                  feedbackForm.type === 'bug' 
                    ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30'
                    : 'border-theme-divider bg-theme-base hover:bg-theme-surface-hover'
                }`}
              >
                <div className={`text-sm font-bold ${feedbackForm.type === 'bug' ? 'text-amber-600' : 'text-theme-primary'}`}>Bug</div>
              </div>
              <div
                onClick={() => setFeedbackForm({...feedbackForm, type: 'suggestion'})}
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                  feedbackForm.type === 'suggestion' 
                    ? 'border-[#5E43F3] bg-[#5E43F3]/5 ring-1 ring-[#5E43F3]/30'
                    : 'border-theme-divider bg-theme-base hover:bg-theme-surface-hover'
                }`}
              >
                <div className={`text-sm font-bold ${feedbackForm.type === 'suggestion' ? 'text-[#5E43F3]' : 'text-theme-primary'}`}>Suggestion</div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-bold text-theme-tertiary uppercase tracking-wider">Affected Feature</label>
              <select
                value={feedbackForm.feature}
                onChange={e => setFeedbackForm({...feedbackForm, feature: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-theme-divider bg-theme-base text-sm font-medium text-theme-primary focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3]/30 outline-none transition-all appearance-none"
              >
                <option value="Feed">Feed & Timeline</option>
                <option value="Profile">Profile</option>
                <option value="Messages">Messages & Chat</option>
                <option value="Pages">Pages & Businesses</option>
                <option value="Verification">Verification & Creator Hub</option>
                <option value="Wallet">Wallet & Payments</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-bold text-theme-tertiary uppercase tracking-wider">Description</label>
              <textarea
                required
                rows={4}
                value={feedbackForm.description}
                onChange={e => setFeedbackForm({...feedbackForm, description: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-theme-divider bg-theme-base text-sm font-medium text-theme-primary focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3]/30 outline-none transition-all resize-none"
                placeholder="Please describe the issue or your suggestion in detail..."
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingFeedback}
                className="w-full py-3.5 rounded-xl bg-theme-inverse hover:bg-theme-primary active:scale-[0.99] text-theme-text-inverse text-sm font-black shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmittingFeedback ? (
                  <div className="w-5 h-5 rounded-full border-2 border-theme-text-inverse/30 border-t-theme-text-inverse animate-spin" />
                ) : (
                  <span>Submit Feedback</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  const renderHub = () => (
    <div className="space-y-5 animate-in fade-in duration-300 pb-20">
      {/* Intro Header */}
      <div className="flex flex-col items-center justify-center text-center py-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5E43F3] to-[#4E34E0] shadow-lg shadow-[#5E43F3]/30 flex items-center justify-center mb-4">
          <Smartphone className="w-8 h-8 text-white stroke-[2]" />
        </div>
        <h1 className="text-2xl font-black text-theme-primary tracking-tight">LaLao Beta Testing</h1>
        <p className="text-sm text-theme-secondary mt-2 max-w-sm">
          Help us test LaLao, discover problems, suggest improvements, and help shape the product.
        </p>
      </div>

      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl border border-[#5E43F3]/20 bg-[#5E43F3]/5 flex flex-col items-center justify-center text-center gap-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#5E43F3] text-white flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="font-black text-theme-primary text-[15px]">You're a Beta Tester</div>
            <div className="text-[11px] text-[#5E43F3] font-medium mt-1">Thank you for participating!</div>
          </div>
        </div>

        <button
          onClick={() => {
            if (settings?.openLalaoUrl) {
              navigate(settings.openLalaoUrl);
            } else {
              navigate('/app');
            }
          }}
          className="p-5 rounded-3xl border-2 border-[#5E43F3] bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-[0.98] transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer shadow-md shadow-[#5E43F3]/20"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center">
            <ExternalLink className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="font-black text-white text-[15px]">Open LaLao App</div>
            <div className="text-[11px] text-white/80 font-medium mt-1">Go to the main application</div>
          </div>
        </button>
      </div>

      {/* APK Download Section */}
      <div className="bg-theme-surface border border-theme-divider rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-theme-base border border-theme-divider-strong flex items-center justify-center">
              <Download className="w-4 h-4 text-theme-primary" />
            </div>
            <h2 className="text-base font-black text-theme-primary">Download Latest APK</h2>
          </div>
          {currentRelease?.version && (
            <span className="px-2.5 py-1 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] text-[10px] font-bold">
              {currentRelease.version}
            </span>
          )}
        </div>

        {currentRelease === undefined ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-theme-divider-strong border-t-theme-primary rounded-full animate-spin" />
          </div>
        ) : currentRelease === null ? (
          <div className="py-6 text-center text-sm text-theme-secondary border-2 border-dashed border-theme-divider rounded-2xl">
            No active beta release available at the moment.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-theme-base border border-theme-divider/50">
                <div className="text-[10px] font-bold text-theme-tertiary uppercase">Version</div>
                <div className="text-sm font-black text-theme-primary mt-0.5">{currentRelease.version}</div>
              </div>
              <div className="p-3 rounded-xl bg-theme-base border border-theme-divider/50">
                <div className="text-[10px] font-bold text-theme-tertiary uppercase">Released</div>
                <div className="text-sm font-black text-theme-primary mt-0.5">
                  {new Date(currentRelease.releaseDate).toLocaleDateString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-theme-base border border-theme-divider/50">
                <div className="text-[10px] font-bold text-theme-tertiary uppercase">Size</div>
                <div className="text-sm font-black text-theme-primary mt-0.5">{currentRelease.fileSize}</div>
              </div>
              <div className="p-3 rounded-xl bg-theme-base border border-theme-divider/50">
                <div className="text-[10px] font-bold text-theme-tertiary uppercase">Reqs</div>
                <div className="text-sm font-black text-theme-primary mt-0.5">{currentRelease.minAndroidVersion}</div>
              </div>
            </div>
            
            {currentRelease.releaseNotes && (
              <div className="text-xs text-theme-secondary leading-relaxed bg-theme-base p-3.5 rounded-xl border border-theme-divider/50">
                <span className="font-bold text-theme-primary block mb-1">Release Notes:</span>
                {currentRelease.releaseNotes}
              </div>
            )}

            <button
              onClick={() => window.open(currentRelease.apkUrl, '_blank')}
              className="w-full py-3.5 rounded-xl bg-theme-inverse hover:bg-theme-primary active:scale-[0.99] text-theme-text-inverse text-sm font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download APK</span>
            </button>
          </div>
        )}
      </div>

      {/* Secondary Actions (Feedback & Community) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setActiveTab('feedback')}
          className="p-4 rounded-2xl border border-theme-divider bg-theme-surface hover:bg-theme-surface-hover transition-colors flex items-center gap-3 cursor-pointer text-left shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-theme-base border border-theme-divider-strong flex items-center justify-center shrink-0">
            <Bug className="w-5 h-5 text-theme-primary" />
          </div>
          <div>
            <div className="font-bold text-theme-primary text-sm">Report Issue</div>
            <div className="text-[11px] text-theme-secondary mt-0.5">Send a bug or suggestion</div>
          </div>
        </button>

        <button
          onClick={() => {
            if (settings?.betaCommunityUrl) {
              window.open(settings.betaCommunityUrl, '_blank');
            }
          }}
          className="p-4 rounded-2xl border border-theme-divider bg-theme-surface hover:bg-theme-surface-hover transition-colors flex items-center gap-3 cursor-pointer text-left shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-theme-base border border-theme-divider-strong flex items-center justify-center shrink-0">
            <MessageSquarePlus className="w-5 h-5 text-theme-primary" />
          </div>
          <div>
            <div className="font-bold text-theme-primary text-sm">Join Community</div>
            <div className="text-[11px] text-theme-secondary mt-0.5">Discuss with other testers</div>
          </div>
        </button>
      </div>

      {/* FAQs */}
      {settings?.faqs && settings.faqs.length > 0 && (
        <div className="pt-2">
          <h3 className="text-sm font-black text-theme-primary mb-3 px-1">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {settings.faqs.map((faq: any, idx: number) => (
              <div 
                key={idx}
                className="bg-theme-surface border border-theme-divider rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-theme-surface-hover/50"
                >
                  <span className="text-sm font-bold text-theme-primary">{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-theme-tertiary transition-transform duration-300 ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaqIndex === idx && (
                  <div className="p-4 pt-0 text-xs text-theme-secondary leading-relaxed border-t border-theme-divider/30 bg-theme-surface/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (!currentUser) {
    return (
      <div className="w-full flex flex-col min-h-screen bg-theme-base items-center justify-center p-6 text-center animate-in fade-in duration-200">
        <div className="w-20 h-20 rounded-3xl bg-[#5E43F3]/10 flex items-center justify-center mb-6">
          <Smartphone className="w-10 h-10 text-[#5E43F3] stroke-[2]" />
        </div>
        <h1 className="text-2xl font-black text-theme-primary tracking-tight mb-2">
          LaLao Beta Testing
        </h1>
        <p className="text-sm text-theme-secondary mb-8 max-w-sm">
          You need to be logged into your LaLao account to access the Beta Program and download test builds.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-8 py-3.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-[0.98] text-white text-sm font-black shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Log In to LaLao</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col min-h-full bg-theme-base animate-in fade-in duration-200">
      {/* ── STICKY TOP APP HEADER ── */}
      <div className="sticky top-0 z-20 bg-theme-base/95 backdrop-blur-md border-b border-theme-divider/80 px-4 py-3">
        <div className="flex items-center justify-between gap-3 mx-auto w-full max-w-[640px]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-theme-primary font-sans">
                Beta Tester
              </h1>
              <p className="text-[10px] text-theme-tertiary font-bold tracking-wide uppercase">
                Product Testing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="flex-1 w-full max-w-[640px] mx-auto px-4 py-6">
        {activeTab === 'hub' && renderHub()}
        {activeTab === 'feedback' && renderFeedbackForm()}
      </div>
    </div>
  );
};
