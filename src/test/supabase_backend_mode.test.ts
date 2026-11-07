import assert from 'node:assert/strict';
import { shouldUseSupabaseBackend } from '../lib/backendMode';

assert.equal(shouldUseSupabaseBackend(false), false, 'missing Supabase config disables application data access');
assert.equal(shouldUseSupabaseBackend(true), true, 'configured Supabase is the default backend');
assert.equal(shouldUseSupabaseBackend(true, ''), true, 'empty deployment flag uses configured Supabase');
assert.equal(shouldUseSupabaseBackend(true, 'supabase'), true, 'explicit Supabase flag selects Supabase');
assert.equal(shouldUseSupabaseBackend(true, 'convex'), true, 'a legacy flag cannot route configured data to Convex');
assert.equal(shouldUseSupabaseBackend(true, 'unknown'), true, 'unknown override cannot route configured data to Convex');

console.log('Supabase backend policy tests passed (required Supabase and ignored legacy overrides).');
