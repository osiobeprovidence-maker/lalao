import React, { useState } from 'react';
import { X, Lightbulb, Loader2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface SuggestCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuggestCommunityModal: React.FC<SuggestCommunityModalProps> = ({
  isOpen,
  onClose,
}) => {
  const submitSuggestion = useMutation(api.community.submitSuggestion);

  const [communityName, setCommunityName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [reason, setReason] = useState('');
  const [website, setWebsite] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!communityName.trim() || !description.trim()) {
      setErrorMsg('Community name and description are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await submitSuggestion({
        communityName: communityName.trim(),
        description: description.trim(),
        category: category.trim() || undefined,
        location: location.trim() || undefined,
        website: website.trim() || undefined,
        reason: reason.trim() || undefined,
        additionalInfo: additionalInfo.trim() || undefined,
      });
      setIsSuccess(true);
    } catch (e: any) {
      const errorText = typeof e.data === 'string' ? e.data : (e.data?.message || e.message);
      setErrorMsg(errorText || 'Failed to submit suggestion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCommunityName('');
    setDescription('');
    setCategory('');
    setLocation('');
    setReason('');
    setWebsite('');
    setAdditionalInfo('');
    setErrorMsg(null);
    setIsSuccess(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5E43F3]/10 flex items-center justify-center">
              <Lightbulb className="w-4.5 h-4.5 text-[#5E43F3]" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-950 text-base">Suggest a Community</h2>
              <p className="text-[11px] text-neutral-500">This is not community creation</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <Lightbulb className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="font-bold text-lg text-neutral-950 mb-2">Suggestion Submitted</h3>
            <p className="text-sm text-neutral-500 max-w-xs">
              Your community suggestion has been submitted for review. We'll notify you when there's an update.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-2.5 bg-[#5E43F3] text-white font-bold text-sm rounded-full hover:bg-[#4E34E0] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <p className="text-xs text-neutral-500 leading-relaxed">
                Know a community that should be on Lalao? Suggest it for review. This does not create the community — our team will review your suggestion.
              </p>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Community Name */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Community Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  placeholder="e.g. Warri Developers Community"
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  What is this community about? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose, topic, and activities of this community..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] bg-white"
                >
                  <option value="">Select a category</option>
                  <option value="Technology">Technology</option>
                  <option value="Arts & Culture">Arts & Culture</option>
                  <option value="Sports">Sports</option>
                  <option value="Education">Education</option>
                  <option value="Business">Business</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Health & Wellness">Health & Wellness</option>
                  <option value="Social">Social</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Music">Music</option>
                  <option value="Food & Drink">Food & Drink</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Warri, Delta State"
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3]"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Why should Lalao add this community?
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this community would be valuable on Lalao..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] resize-none"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Community link / website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3]"
                />
              </div>

              {/* Additional Info */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Anything else?
                </label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Any other details that might help..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-neutral-100 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={handleClose}
                className="px-4 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !communityName.trim() || !description.trim()}
                className="px-5 py-2.5 bg-[#5E43F3] text-white text-sm font-bold rounded-full hover:bg-[#4E34E0] disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Submitting...' : 'Suggest Community'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
