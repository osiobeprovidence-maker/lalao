import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

interface RoomyProfileModalProps {
  profile: any;
  onClose: () => void;
}

export const RoomyProfileModal: React.FC<RoomyProfileModalProps> = ({ profile, onClose }) => {
  const [university, setUniversity] = useState(profile?.university || '');
  const [campus, setCampus] = useState(profile?.campus || '');
  const [budget, setBudget] = useState(profile?.budget?.toString() || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateProfile = useMutation(api.roomy.updateProfile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateProfile({
        university,
        campus,
        budget: budget ? parseInt(budget) : undefined,
        bio,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <h3 className="font-black text-lg text-neutral-900">Roomy Profile</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          <p className="text-sm text-neutral-500 mb-6">
            Complete your Roomy profile before posting a listing or contacting owners.
          </p>

          <form id="roomy-profile-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                University (Optional)
              </label>
              <input 
                type="text" 
                value={university}
                onChange={e => setUniversity(e.target.value)}
                placeholder="e.g. University of Benin"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Campus (Optional)
              </label>
              <input 
                type="text" 
                value={campus}
                onChange={e => setCampus(e.target.value)}
                placeholder="e.g. Ugbowo"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Monthly Budget (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">₦</span>
                <input 
                  type="number" 
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Bio / Lifestyle
              </label>
              <textarea 
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell potential roommates about yourself..."
                rows={4}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3] resize-none"
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-neutral-100 bg-neutral-50">
          <button
            type="submit"
            form="roomy-profile-form"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#5E43F3] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#4E34E0] disabled:opacity-50 cursor-pointer shadow-md"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5 stroke-[3]" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
