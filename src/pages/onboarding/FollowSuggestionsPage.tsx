import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, UserCheck } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';
import { SEED_USERS, SEED_PAGES } from '../../data/seedData';

const SUGGESTED_USERS = Object.values(SEED_USERS).slice(0, 6);
const SUGGESTED_PAGES = SEED_PAGES.slice(0, 4);

export const FollowSuggestionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [followedPages, setFollowedPages] = useState<Set<string>>(new Set());

  const toggleUser = (id: string) => {
    setFollowedUsers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePage = (id: string) => {
    setFollowedPages((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalFollowed = followedUsers.size + followedPages.size;

  return (
    <OnboardingLayout step={5} totalSteps={5} title="Follow suggestions" subtitle="Connect with people and pages near you to get started." backTo="/onboarding/interests">
      <div className="space-y-6">
        {/* People near you */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-neutral-600 uppercase tracking-widest">People Near You</h3>
          <div className="space-y-2">
            {SUGGESTED_USERS.map((user) => {
              const isFollowing = followedUsers.has(user.id);
              return (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100/70 transition-colors">
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm text-neutral-900 truncate">{user.name}</p>
                      {user.badge && (
                        <span className="text-[10px] font-black text-neutral-500 bg-neutral-200 px-1 py-0.5 rounded-md shrink-0">{user.badge}</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 truncate">@{user.username}</p>
                    {user.bio && <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{user.bio}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleUser(user.id)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border-2 transition-all cursor-pointer ${
                      isFollowing
                        ? 'border-[#5E43F3] bg-[#5E43F3] text-white'
                        : 'border-neutral-200 bg-white text-neutral-800 hover:border-[#5E43F3]/40'
                    }`}
                  >
                    {isFollowing ? (
                      <span className="flex items-center gap-1"><Check className="w-3 h-3 stroke-[3]" /> Following</span>
                    ) : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Pages */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-neutral-600 uppercase tracking-widest">Popular Pages</h3>
          <div className="space-y-2">
            {SUGGESTED_PAGES.map((page) => {
              const isFollowing = followedPages.has(page.id);
              return (
                <div key={page.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100/70 transition-colors">
                  <img src={page.avatar} alt={page.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm text-neutral-900 truncate">{page.name}</p>
                      <span className="text-[10px] font-black text-neutral-500 bg-neutral-200 px-1 py-0.5 rounded-md shrink-0">{page.badge}</span>
                    </div>
                    <p className="text-xs text-neutral-500">{page.followersCount.toLocaleString()} followers · {page.category}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePage(page.id)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border-2 transition-all cursor-pointer ${
                      isFollowing
                        ? 'border-[#5E43F3] bg-[#5E43F3] text-white'
                        : 'border-neutral-200 bg-white text-neutral-800 hover:border-[#5E43F3]/40'
                    }`}
                  >
                    {isFollowing ? (
                      <span className="flex items-center gap-1"><Check className="w-3 h-3 stroke-[3]" /> Following</span>
                    ) : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-2.5 pt-2">
          <button
            id="btn-onboard-finish"
            type="button"
            onClick={() => navigate('/app')}
            className="w-full py-4 rounded-2xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#5E43F3]/25 cursor-pointer"
          >
            {totalFollowed > 0 ? (
              <><UserCheck className="w-5 h-5" /><span>Following {totalFollowed} · Enter Lalao</span></>
            ) : (
              <><span>Skip & Enter Lalao</span><ArrowRight className="w-5 h-5" /></>
            )}
          </button>
          {totalFollowed === 0 && (
            <p className="text-center text-xs text-neutral-400">You can always find people to follow later in Discover</p>
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
};
