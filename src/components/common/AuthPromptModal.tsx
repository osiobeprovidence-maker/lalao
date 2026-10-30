import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { brand } from '../../config/brand';
import { X } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export const AuthPromptModal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthPromptOpen, authPromptMessage, authPromptRedirect, closeAuthPrompt } = useLalao();
  const settings = useQuery((api as any).platformSettings.getBrandingSettings);

  if (!isAuthPromptOpen) return null;

  // Preserve the destination the visitor was trying to reach. Only relative,
  // same-origin paths are allowed to prevent open redirects.
  const requestedRedirect = authPromptRedirect || `${location.pathname}${location.search}`;
  const redirect =
    requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//')
      ? requestedRedirect
      : '/app';
  const loginPath = `/login?redirect=${encodeURIComponent(redirect)}`;
  const signupPath = `/signup?redirect=${encodeURIComponent(redirect)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-[360px] overflow-hidden rounded-[32px] bg-theme-surface shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="relative px-6 py-8 text-center">
          <button
            type="button"
            onClick={closeAuthPrompt}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-theme-surface-hover text-theme-tertiary transition hover:bg-theme-surface-active hover:text-theme-primary cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {settings?.authLogoUrl ? (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#5E43F3]/10">
              <img src={settings.authLogoUrl} alt="Authentication Logo" className="w-3/5 h-3/5 object-contain" />
            </div>
          ) : settings?.authWordmark ? (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#5E43F3]/10">
              <span className="lalao-wordmark text-[14px] text-[#5E43F3] leading-none translate-y-0.5">{settings.authWordmark}</span>
            </div>
          ) : (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#5E43F3]/10">
              <span className="lalao-wordmark text-[18px] text-[#5E43F3] leading-none translate-y-0.5">lalao</span>
            </div>
          )}

          <h2 className="mb-2 text-xl font-bold tracking-tight text-theme-primary">
            {authPromptMessage || 'Sign in to continue'}
          </h2>
          <p className="mb-8 text-[15px] leading-relaxed text-theme-tertiary">
            Join the community to interact with posts, pages, and other users.
          </p>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                closeAuthPrompt();
                navigate(signupPath);
              }}
              className="flex w-full items-center justify-center rounded-full bg-[#5E43F3] px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-[#4d36d2] cursor-pointer"
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={() => {
                closeAuthPrompt();
                navigate(loginPath);
              }}
              className="flex w-full items-center justify-center rounded-full bg-theme-surface-hover px-6 py-3.5 text-[15px] font-bold text-theme-primary transition hover:bg-theme-surface-active cursor-pointer"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
