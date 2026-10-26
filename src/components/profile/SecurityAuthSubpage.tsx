import React, { useState } from 'react';
import { ArrowLeft, Phone, Check, Loader2 } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { ChangePhoneModal } from './ChangePhoneModal';
import { useMutation, useQuery } from 'convex/react';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';
import { auth } from '../../lib/firebase';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateCurrentUser,
} from 'firebase/auth';
import { initiatePlaysoleLogin } from '../../lib/playsoleAuth';

interface SecurityAuthSubpageProps {
  onBack: () => void;
}

export const SecurityAuthSubpage: React.FC<SecurityAuthSubpageProps> = ({ onBack }) => {
  const { currentUser, setCurrentUser, triggerShareToast } = useLalao();
  const [isChangePhoneOpen, setIsChangePhoneOpen] = useState(false);
  const [email, setEmail] = useState(currentUser.email || '');
  const [password, setPassword] = useState('');
  const [emailMode, setEmailMode] = useState<'sign_in' | 'create'>('sign_in');
  const [linkError, setLinkError] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkConfirmation, setLinkConfirmation] = useState('');
  const linkedMethods = useQuery(api.playsole.getMyAuthMethods) || [];
  const beginAuthLink = useMutation(api.playsole.beginAuthLink);

  const currentPhone = currentUser.phone || currentUser.phoneNumber;
  const firebaseProviders = auth.currentUser?.providerData.map((provider) => provider.providerId) || [];
  const hasFirebaseMapping = linkedMethods.some((method) => method.provider === 'firebase');
  const hasPlaysoleMapping = linkedMethods.some((method) => method.provider === 'playsole');
  const hasGoogle = hasFirebaseMapping && (firebaseProviders.includes('google.com') || linkedMethods.some((method) => method.provider === 'firebase' && method.methods?.includes('google.com')));
  const hasPassword = hasFirebaseMapping && (firebaseProviders.includes('password') || linkedMethods.some((method) => method.provider === 'firebase' && method.methods?.includes('password')));

  const completeFirebaseLink = async (challenge: string, secondaryToken: string) => {
    const convexUrl = import.meta.env.VITE_CONVEX_URL;
    if (!convexUrl) throw new Error('Authentication is temporarily unavailable. Please try again later.');
    const client = new ConvexHttpClient(convexUrl);
    client.setAuth(secondaryToken);
    await client.mutation(api.playsole.completeAuthLink, { challenge });
  };

  const restoreFirebaseSession = async (original: typeof auth.currentUser) => {
    try {
      if (original) await updateCurrentUser(auth, original);
      else await signOut(auth);
    } catch {
      setLinkError('The additional sign-in was verified, but your previous Firebase session could not be restored. Please sign in again.');
    }
  };

  const linkPlaysole = async () => {
    if (!window.confirm('Link Playsole One to this Lalao account? You will authenticate with Playsole next.')) return;
    setIsLinking(true);
    setLinkError('');
    try {
      const challenge = await beginAuthLink({ targetProvider: 'playsole' });
      await initiatePlaysoleLogin({ linkChallenge: challenge.token });
    } catch (error: any) {
      setLinkError(error?.message || 'Could not start Playsole linking.');
      setIsLinking(false);
    }
  };

  const linkGoogle = async () => {
    if (!window.confirm('Link Google to this Lalao account? You will authenticate with Google next.')) return;
    setIsLinking(true);
    setLinkError('');
    const originalFirebaseUser = auth.currentUser;
    try {
      const challenge = await beginAuthLink({ targetProvider: 'firebase' });
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      await completeFirebaseLink(challenge.token, await credential.user.getIdToken());
      setLinkConfirmation('Google sign-in is linked to this account.');
      triggerShareToast('Google sign-in linked');
    } catch (error: any) {
      setLinkError(error?.code === 'auth/credential-already-in-use'
        ? 'That Google account is already connected to another Lalao sign-in. Sign in to that account to recover or link it.'
        : error?.message || 'Google sign-in could not be linked.');
    } finally {
      await restoreFirebaseSession(originalFirebaseUser);
      setIsLinking(false);
    }
  };

  const linkEmailPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!window.confirm('Link this email/password sign-in to the current Lalao account?')) return;
    setIsLinking(true);
    setLinkError('');
    const originalFirebaseUser = auth.currentUser;
    try {
      const challenge = await beginAuthLink({ targetProvider: 'firebase' });
      const credential = emailMode === 'create'
        ? await createUserWithEmailAndPassword(auth, email.trim(), password)
        : await signInWithEmailAndPassword(auth, email.trim(), password);
      await completeFirebaseLink(challenge.token, await credential.user.getIdToken());
      setPassword('');
      setLinkConfirmation('Email and password sign-in is linked to this account.');
      triggerShareToast('Email and password sign-in linked');
    } catch (error: any) {
      setLinkError(error?.code === 'auth/email-already-in-use'
        ? 'This email already has a Firebase sign-in. Choose “Sign in to existing” and authenticate it before linking.'
        : error?.message || 'Email and password sign-in could not be linked.');
    } finally {
      await restoreFirebaseSession(originalFirebaseUser);
      setIsLinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-theme-surface animate-in fade-in duration-200">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-security-auth"
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            title="Back to Settings Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base text-theme-primary">Security & Authentication</h1>
            <p className="text-[11px] text-theme-tertiary">Linked sign-in methods & phone verification</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-full bg-theme-surface-hover hover:bg-theme-surface-active text-theme-primary text-xs font-bold transition-all cursor-pointer"
        >
          Done
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-xl mx-auto w-full pb-24">
        {/* Phone Authentication */}
        <div className="space-y-3">
          <div className="border-b border-theme-divider-light pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Sign-in methods</h3>
            <p className="text-[11px] text-theme-tertiary mt-0.5">Link another method only after authenticating it. Matching emails alone never connect accounts.</p>
          </div>

          <div className="rounded-2xl border border-theme-divider bg-theme-base p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-theme-primary">Playsole One</div>
                <div className="text-xs text-theme-tertiary">{hasPlaysoleMapping ? 'Linked to this Lalao account' : 'Not linked'}</div>
              </div>
              {!hasPlaysoleMapping && (
                <button type="button" onClick={linkPlaysole} disabled={isLinking} className="px-3 py-2 rounded-xl bg-[#5E43F3]/10 text-[#5E43F3] text-xs font-bold disabled:opacity-50">
                  {isLinking ? 'Opening…' : 'Link Playsole'}
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-theme-primary">Google</div>
                <div className="text-xs text-theme-tertiary">{hasGoogle ? 'Linked to this Lalao account' : 'Not linked'}</div>
              </div>
              {!hasGoogle && (
                <button type="button" onClick={linkGoogle} disabled={isLinking} className="px-3 py-2 rounded-xl bg-[#5E43F3]/10 text-[#5E43F3] text-xs font-bold disabled:opacity-50">
                  {isLinking ? 'Linking…' : 'Link Google'}
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-sm font-bold text-theme-primary">Email and password</div>
                  <div className="text-xs text-theme-tertiary">{hasPassword ? 'Linked to this Lalao account' : 'Not linked'}</div>
                </div>
                {!hasPassword && (
                  <div className="flex gap-1 rounded-lg bg-theme-surface p-1">
                    <button type="button" onClick={() => setEmailMode('sign_in')} className={`px-2 py-1 rounded-md text-[10px] font-semibold ${emailMode === 'sign_in' ? 'bg-theme-base text-theme-primary shadow-sm' : 'text-theme-tertiary'}`}>Sign in</button>
                    <button type="button" onClick={() => setEmailMode('create')} className={`px-2 py-1 rounded-md text-[10px] font-semibold ${emailMode === 'create' ? 'bg-theme-base text-theme-primary shadow-sm' : 'text-theme-tertiary'}`}>Create</button>
                  </div>
                )}
              </div>
              {!hasPassword && (
                <form onSubmit={linkEmailPassword} className="space-y-2">
                  <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full rounded-xl border border-theme-divider bg-theme-surface px-3 py-2.5 text-sm text-theme-primary" />
                  <input type="password" required minLength={6} autoComplete={emailMode === 'create' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border border-theme-divider bg-theme-surface px-3 py-2.5 text-sm text-theme-primary" />
                  <button type="submit" disabled={isLinking} className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#5E43F3] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                    {isLinking && <Loader2 className="w-4 h-4 animate-spin" />}
                    {emailMode === 'create' ? 'Create and link email sign-in' : 'Authenticate and link email sign-in'}
                  </button>
                </form>
              )}
            </div>

            {linkError && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{linkError}</p>}
            {linkConfirmation && <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400">{linkConfirmation}</p>}
            <p className="text-[11px] text-theme-tertiary">If a method belongs to another Lalao account, sign in to that account or use account recovery. Lalao will not move it automatically.</p>
          </div>
        </div>

        {/* Phone Authentication */}
        <div className="space-y-3">
          <div className="border-b border-theme-divider-light pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
              Phone Number & Login
            </h3>
            <p className="text-[11px] text-theme-tertiary mt-0.5">
              Your registered mobile number for authentication and OTP recovery
            </p>
          </div>

          <div className="rounded-2xl border border-theme-divider bg-theme-surface p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-theme-primary block truncate">
                  {currentPhone || 'No phone number linked'}
                </span>
                <p className="text-[11px] text-theme-tertiary mt-0.5">
                  {currentPhone ? 'Verified mobile authentication method' : 'Link a phone number to protect your account'}
                </p>
              </div>
            </div>

            <button
              id="btn-edit-phone-number"
              type="button"
              onClick={() => setIsChangePhoneOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#5E43F3]/10 text-[#5E43F3] hover:bg-[#5E43F3]/20 text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              {currentPhone ? 'Change' : 'Add Phone'}
            </button>
          </div>
        </div>

        {/* Security Summary Card */}
        <div className="space-y-3">
          <div className="border-b border-theme-divider-light pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
              Account Security Status
            </h3>
          </div>

          <div className="p-4 rounded-2xl bg-theme-base border border-theme-divider-light space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-bold text-theme-primary block">
                  Session Protected
                </span>
                <p className="text-[11px] text-theme-tertiary">
                  Secured with end-to-end token verification and encrypted local storage
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Phone Modal */}
      {isChangePhoneOpen && (
        <ChangePhoneModal
          currentPhone={currentPhone || undefined}
          onClose={() => setIsChangePhoneOpen(false)}
          onSuccess={(newPhone) => {
            setCurrentUser((prev) => ({
              ...prev,
              phone: newPhone,
              phoneNumber: newPhone,
              phoneVerified: true,
            }));
            triggerShareToast('Phone number successfully updated');
            setIsChangePhoneOpen(false);
          }}
        />
      )}
    </div>
  );
};
