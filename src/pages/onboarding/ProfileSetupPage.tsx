import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowRight, Loader2, User } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';

export const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatar(url);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!username) {
      setUsername(val.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!username.trim()) { setError('Please choose a username.'); return; }
    setError('');
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsLoading(false);
    navigate('/onboarding/location');
  };

  return (
    <OnboardingLayout step={2} totalSteps={5} title="Set up your profile" subtitle="Tell your community who you are." backTo="/onboarding/account-type">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar upload */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-3xl overflow-hidden border-2 border-dashed border-neutral-200 hover:border-[#5E43F3] bg-neutral-50 hover:bg-indigo-50/40 transition-all cursor-pointer group flex items-center justify-center"
          >
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-neutral-400 group-hover:text-[#5E43F3] transition-colors">
                <User className="w-8 h-8" />
                <span className="text-[10px] font-bold">Add photo</span>
              </div>
            )}
            <div className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-[#5E43F3] flex items-center justify-center shadow-lg border-2 border-white">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          <p className="text-xs text-neutral-400 font-medium">Tap to upload photo</p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Providence Osiobe"
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] transition-all"
          />
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">Username</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold select-none">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, '').replace(/[^a-z0-9_.]/g, ''))}
              placeholder="yourhandle"
              className="w-full pl-7 pr-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] transition-all"
            />
          </div>
          <p className="text-[11px] text-neutral-400 pl-1">Letters, numbers, underscores and dots only</p>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">Bio</label>
            <span className="text-[11px] text-neutral-400">{bio.length}/150</span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 150))}
            placeholder="Tell your community a bit about yourself..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#5E43F3]/25 disabled:opacity-60 cursor-pointer"
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /><span>Saving...</span></>
          ) : (
            <><span>Continue</span><ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </form>
    </OnboardingLayout>
  );
};
