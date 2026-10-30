import assert from "node:assert/strict";
import {
  recentSearchShadowRetryDelayMs,
  SupabaseAdminRestClient,
  SupabaseRestError,
  isSupabaseRecentSearchShadowEnabled,
} from "../../convex/lib/supabaseAdminRest";

assert.equal(isSupabaseRecentSearchShadowEnabled({}), false, "shadow writes stay disabled by default");
assert.equal(isSupabaseRecentSearchShadowEnabled({
  SUPABASE_RECENT_SEARCHES_SHADOW: "true",
  SUPABASE_URL: "http://127.0.0.1:54321",
}), false, "shadow writes require a server service-role key");
assert.equal(isSupabaseRecentSearchShadowEnabled({
  SUPABASE_RECENT_SEARCHES_SHADOW: "true",
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_SERVICE_ROLE_KEY: "local-test-key",
}), true, "shadow writes require an explicit local opt-in and server key");

const captured: Array<{ url: URL; init: RequestInit }> = [];
const fakeFetch: typeof fetch = async (input, init = {}) => {
  captured.push({ url: new URL(input.toString()), init });
  return new Response(null, { status: 204 });
};

const client = new SupabaseAdminRestClient({
  url: "http://127.0.0.1:54321",
  serviceRoleKey: "synthetic-local-service-key",
}, fakeFetch);

await client.upsert("users", [{ _id: "user_local", tokenIdentifier: "firebase|local" }], "_id");
const syncEvent = {
  id: "search_local",
  userId: "user_local",
  revision: 100,
  deleted: false,
  record: { _id: "search_local", userId: "user_local", timestamp: 100, query: "synthetic" },
};
await client.applyRecentSearchShadow(syncEvent);
await client.applyRecentSearchShadow(syncEvent);
await client.applyRecentSearchShadow({ id: "search_local", userId: "user_local", revision: 101, deleted: true });

assert.equal(captured.length, 4, "adapter sends the user upsert and ordered idempotent RPC events");
assert.equal(captured[0].url.pathname, "/rest/v1/users");
assert.equal(captured[0].url.searchParams.get("on_conflict"), "_id");
assert.match(String(new Headers(captured[0].init.headers).get("Authorization")), /^Bearer synthetic-local-service-key$/);
assert.equal(captured[1].url.pathname, "/rest/v1/rpc/apply_recent_search_shadow");
assert.equal(captured[1].init.method, "POST");
assert.deepEqual(JSON.parse(String(captured[1].init.body)), {
  p_search_id: "search_local",
  p_user_id: "user_local",
  p_revision: 100,
  p_deleted: false,
  p_record: { _id: "search_local", userId: "user_local", timestamp: 100, query: "synthetic" },
});
assert.equal(captured[2].init.body, captured[1].init.body, "replaying a sync uses the same stable ID and revision");
assert.deepEqual(JSON.parse(String(captured[3].init.body)), {
  p_search_id: "search_local",
  p_user_id: "user_local",
  p_revision: 101,
  p_deleted: true,
  p_record: null,
});

assert.throws(() => new SupabaseAdminRestClient({ url: "https://project.supabase.co", serviceRoleKey: "not-used" }, fakeFetch), /loopback URL/);
assert.throws(() => new SupabaseAdminRestClient({ url: "http://127.0.0.1:54321", serviceRoleKey: "" }, fakeFetch), /required on the server/);
assert.throws(() => new SupabaseAdminRestClient({ url: "http://127.0.0.1:54321", serviceRoleKey: "local-key" }, fakeFetch, 0), /positive finite number/);

const failingClient = new SupabaseAdminRestClient({
  url: "http://localhost:54321",
  serviceRoleKey: "synthetic-local-service-key",
}, (async () => new Response("private provider detail", { status: 500 })) as typeof fetch);
await assert.rejects(
  failingClient.applyRecentSearchShadow({ id: "search_local", userId: "user_local", revision: 100, deleted: true }),
  (error: Error) => error instanceof SupabaseRestError
    && error.retryable
    && error.message === "Local Supabase REST request failed (500)."
    && !error.message.includes("private provider detail"),
);

const permanentFailureClient = new SupabaseAdminRestClient({
  url: "http://localhost:54321",
  serviceRoleKey: "synthetic-local-service-key",
}, (async () => new Response("private provider detail", { status: 400 })) as typeof fetch);
await assert.rejects(
  permanentFailureClient.applyRecentSearchShadow({ id: "search_local", userId: "user_local", revision: 100, deleted: true }),
  (error: Error) => error instanceof SupabaseRestError && !error.retryable,
);

assert.deepEqual(
  [0, 1, 2, 3, 4].map(recentSearchShadowRetryDelayMs),
  [1_000, 5_000, 30_000, 120_000, null],
  "transient failures receive four bounded retries; permanent errors and exhausted attempts are not retried",
);
assert.equal(recentSearchShadowRetryDelayMs(-1), null);

const timeoutClient = new SupabaseAdminRestClient({
  url: "http://localhost:54321",
  serviceRoleKey: "synthetic-local-service-key",
}, (_input: RequestInfo | URL, init: RequestInit = {}) => new Promise<Response>((_resolve, reject) => {
  init.signal?.addEventListener("abort", () => reject(new Error("private URL and request body")), { once: true });
}), 5);
await assert.rejects(
  timeoutClient.applyRecentSearchShadow({ id: "search_local", userId: "user_local", revision: 100, deleted: true }),
  (error: Error) => error.message === "Local Supabase REST request failed (network or timeout)." && !error.message.includes("private URL"),
);

console.log("Supabase server REST adapter tests passed.");
