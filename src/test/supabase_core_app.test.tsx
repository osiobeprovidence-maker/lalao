import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ApplicationProviders } from '../RootProviders';
import { AuthProvider } from '../context/AuthContext';
import { SUPABASE_CORE_EXPLORE_SECTIONS, SUPABASE_CORE_OPERATIONS } from '../components/core/SupabaseCoreApp';
import { useCurrentUserQuery } from '../hooks/useCurrentUserQuery';
import { SupabaseCoreApp } from '../components/core/SupabaseCoreApp';

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined },
});

let currentUserQueryError: Error | null = new Error('test not rendered');
function CoreProbe() {
  currentUserQueryError = useCurrentUserQuery().error;
  return <Routes><Route path="/app" element={<SupabaseCoreApp />} /></Routes>;
}

const html = renderToString(
  <ApplicationProviders
    supabaseConfigured
    convexUrl={undefined}
    AuthenticationProvider={AuthProvider}
    useAuthHook={() => ({})}
    Router={MemoryRouter}
    routerProps={{ initialEntries: ['/app'] }}
  >
    <CoreProbe />
  </ApplicationProviders>,
);

assert.equal(currentUserQueryError, null, 'the current-user provider selects the Supabase path without Convex');
assert.match(html, /Main navigation/, 'the actual core navigation renders without a Convex provider');
assert.match(html, /Home/);
assert.match(html, /Explore/);
assert.doesNotMatch(html, /Live Rooms/, 'Live Rooms is not a standalone main application destination');
assert.deepEqual(SUPABASE_CORE_EXPLORE_SECTIONS, ['People', 'Live Rooms'], 'Explore contains the people and Live Rooms views');
assert.match(html, /Notifications/);
assert.match(html, /Profile/);
assert.match(html, /Messages/);
assert.match(html, /Unavailable/, 'Convex-only messaging is isolated and honestly unavailable');
assert.deepEqual(SUPABASE_CORE_OPERATIONS.currentUser, { functionName: 'app-user', operation: 'getCurrentUser' });
assert.deepEqual(SUPABASE_CORE_OPERATIONS.feed, { functionName: 'app-social', operation: 'listFeedPosts' });
assert.deepEqual(SUPABASE_CORE_OPERATIONS.discover, { functionName: 'app-social', operation: 'getDiscoverablePeople' });
assert.deepEqual(SUPABASE_CORE_OPERATIONS.notifications, { functionName: 'app-social', operation: 'listNotifications' });
assert.deepEqual(SUPABASE_CORE_OPERATIONS.likePost, { functionName: 'app-social', operation: 'toggleLikePost' });
assert.deepEqual(SUPABASE_CORE_OPERATIONS.markNotificationRead, { functionName: 'app-social', operation: 'markNotificationRead' });
assert.deepEqual(SUPABASE_CORE_OPERATIONS.followPerson, { functionName: 'app-social', operation: 'toggleFollowUser' });

console.log('Supabase core app mounts without Convex, renders the real navigation, selects current-user/feed/social Edge Function routes, and isolates messaging.');
