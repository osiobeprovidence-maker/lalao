import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useOptionalConvexAction, useOptionalConvexMutation } from '../context/OptionalConvexClientContext';
import { ApplicationProviders } from '../RootProviders';
import { ConvexAppBoundary } from '../components/common/ConvexAppBoundary';
import { getApplicationBackendMode, shouldUseSupabaseBackend } from '../lib/backendMode';
import { useCurrentUserQuery } from '../hooks/useCurrentUserQuery';
import { LoginPage } from '../pages/auth/LoginPage';
import { SignUpPage } from '../pages/auth/SignUpPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { OTPVerifyPage } from '../pages/auth/OTPVerifyPage';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { validateSupabasePublicConfig } from '../lib/supabase';
import { SupabaseCoreApp } from '../components/core/SupabaseCoreApp';

// ThemeProvider reads browser storage during render; keep this test isolated
// from the host environment while exercising the real provider composition.
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined },
});

assert.equal(getApplicationBackendMode(true, undefined), 'supabase');
assert.equal(getApplicationBackendMode(true, 'https://example.convex.cloud'), 'supabase', 'a stale Convex URL does not select the application backend');
assert.equal(getApplicationBackendMode(false, undefined), 'unavailable');
assert.equal(shouldUseSupabaseBackend(true), true, 'configured Supabase remains the default route for supported operations');
assert.equal(validateSupabasePublicConfig(undefined, 'sb_publishable_test'), false, 'missing Supabase URL is rejected');
assert.equal(validateSupabasePublicConfig('https://your-project.supabase.co', 'your-supabase-publishable-key'), false, 'example placeholders are rejected');
assert.equal(validateSupabasePublicConfig('https://project.supabase.co', 'sb_publishable_test'), true, 'a valid URL and publishable key are accepted');

let currentUserError: Error | null | undefined;
let convexAuthActionAvailable: boolean | null = null;
let convexUserMutationAvailable: boolean | null = null;
const RootProbe = () => {
  currentUserError = useCurrentUserQuery().error;
  const auth = useAuth();
  convexAuthActionAvailable = useOptionalConvexAction(api.emails.sendOtpEmail) !== null;
  convexUserMutationAvailable = useOptionalConvexMutation(api.users.createUserRecord) !== null;
  return <div>Supabase application shell {auth.isLoading ? 'authentication loading' : 'authentication ready'}</div>;
};

const HookMustNotRun = () => {
  // With no Convex provider, this actual hook throws if its feature subtree is
  // accidentally rendered. A successful shell render proves the boundary held.
  useQuery(api.users.getCurrentUser, {});
  throw new Error('Convex hook ran inside an unavailable feature boundary');
};

const renderInSupabaseRoot = (children: React.ReactNode) => renderToString(
  <ApplicationProviders
    supabaseConfigured
    convexUrl="https://stale-but-ignored.convex.cloud"
    AuthenticationProvider={AuthProvider}
    useAuthHook={useAuth}
    Router={MemoryRouter}
    routerProps={{ initialEntries: ['/app'] }}
  >
    {children}
  </ApplicationProviders>,
);

const shell = renderInSupabaseRoot(
  <>
    <RootProbe />
    <ConvexAppBoundary>
      <HookMustNotRun />
    </ConvexAppBoundary>
  </>,
);

const actualApp = renderInSupabaseRoot(
  <Routes><Route path="/app" element={<SupabaseCoreApp />} /></Routes>,
);
assert.match(actualApp, /Main navigation/, 'the actual /app route mounts with a stale Convex URL and no Convex client');
assert.match(actualApp, /Loading Lalao|Sign in to see your Lalao feed/, 'the supported application screen is rendered');

assert.match(shell, /authentication loading/, 'the existing Firebase and Playsole authentication context is mounted');
assert.equal(currentUserError, null, 'configured Supabase selects the existing app-user current-user path');
assert.equal(convexAuthActionAvailable, false, 'Convex-only email actions are unavailable without a client');
assert.equal(convexUserMutationAvailable, false, 'Supabase signup does not depend on a Convex user mutation');
assert.match(shell, /Supabase application shell/);
assert.match(shell, /Lalao app<!-- --> is unavailable/);
assert.match(shell, /cannot be opened in Supabase-only mode/);
assert.doesNotMatch(shell, /Convex URL Missing/);

const login = renderInSupabaseRoot(<LoginPage />);
assert.match(login, /Sign in with Google/);
assert.match(login, /Playsole sign-in unavailable/);
const signup = renderInSupabaseRoot(<SignUpPage />);
assert.match(signup, /Create your account/);
assert.match(signup, /Continue with Google/);
const forgotPassword = renderInSupabaseRoot(<ForgotPasswordPage />);
assert.match(forgotPassword, /Reset password/);
const otp = renderInSupabaseRoot(<OTPVerifyPage />);
assert.match(otp, /Email verification unavailable/);

const missingConfig = renderToString(
  <ApplicationProviders
    supabaseConfigured={false}
    convexUrl="https://stale.convex.cloud"
    AuthenticationProvider={AuthProvider}
    useAuthHook={useAuth}
    Router={MemoryRouter}
    routerProps={{ initialEntries: ['/app'] }}
  >
    <SupabaseCoreApp />
  </ApplicationProviders>,
);
assert.match(missingConfig, /Configure a valid Supabase project URL and public publishable key/);

console.log('Supabase provider shell mounts without a Convex client, keeps its auth-provider slot, and blocks Convex-only hooks.');
