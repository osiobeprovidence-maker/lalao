import React, { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../context/AuthContext';

export const PENDING_REFERRAL_KEY = 'lalao.pendingReferralCode';

/**
 * Landing page for referral links (`/referral/<CODE>`): remembers the code and
 * sends the visitor to sign up.
 */
export const ReferralLanding: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const normalized = (code || '').trim().toUpperCase();
    if (normalized) {
      try {
        localStorage.setItem(PENDING_REFERRAL_KEY, normalized);
      } catch {
        // Private mode: the code simply will not survive the signup redirect.
      }
    }
    navigate('/signup', { replace: true });
  }, [code, navigate]);

  return null;
};

/**
 * Attaches a remembered referral code to the signed-in user. Mounted once at
 * the app root, so it also covers users who finish signing up in another tab.
 */
export const ReferralCapture: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const registerReferral = useMutation(api.rewards.registerReferral);
  const attemptedCode = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let code: string | null = null;
    try {
      code = localStorage.getItem(PENDING_REFERRAL_KEY);
    } catch {
      code = null;
    }

    if (!code || attemptedCode.current === code) return;
    attemptedCode.current = code;

    registerReferral({ code })
      .then(() => {
        try {
          localStorage.removeItem(PENDING_REFERRAL_KEY);
        } catch {
          // Ignore storage failures; the backend is already idempotent.
        }
      })
      .catch(() => {
        // Leave the code in place so a later session can retry.
        attemptedCode.current = null;
      });
  }, [isAuthenticated, registerReferral]);

  return null;
};
