import React from 'react';
import { useNavigate } from 'react-router-dom';
import { brand } from '../../config/brand';
import { X } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export const AuthPromptModal: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthPromptOpen, authPromptMessage, closeAuthPrompt } = useLalao();
  const settings = useQuery((api as any).platformSettings.getBrandingSettings);

  if (!isAuthPromptOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-[360px] overflow-hidden rounded-[32px] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="relative px-6 py-8 text-center">
          <button
            type="button"
            onClick={closeAuthPrompt}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-900 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {settings?.authLogoUrl ? (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden">
              <img src={settings.authLogoUrl} alt="Authentication Logo" className="w-full h-full object-contain" />
            </div>
          ) : settings?.authWordmark ? (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#5E43F3]/10">
              <span className="lalao-wordmark text-[24px] text-[#5E43F3] leading-none translate-y-1">{settings.authWordmark}</span>
            </div>
          ) : (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#5E43F3]/10">
              <span className="lalao-wordmark text-[32px] text-[#5E43F3] leading-none translate-y-1">lalao</span>
            </div>
          )}

          <h2 className="mb-2 text-xl font-bold tracking-tight text-neutral-900">
            {authPromptMessage || 'Sign in to continue'}
          </h2>
          <p className="mb-8 text-[15px] leading-relaxed text-neutral-500">
            Join the community to interact with posts, pages, and other users.
          </p>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                closeAuthPrompt();
                navigate('/signup');
              }}
              className="flex w-full items-center justify-center rounded-full bg-[#5E43F3] px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-[#4d36d2] cursor-pointer"
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={() => {
                closeAuthPrompt();
                navigate('/login');
              }}
              className="flex w-full items-center justify-center rounded-full bg-neutral-100 px-6 py-3.5 text-[15px] font-bold text-neutral-900 transition hover:bg-neutral-200 cursor-pointer"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
