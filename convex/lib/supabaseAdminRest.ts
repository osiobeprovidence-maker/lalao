export type SupabaseAdminConfig = {
  url: string;
  serviceRoleKey: string;
};

export type SupabaseShadowEnvironment = {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_RECENT_SEARCHES_SHADOW?: string;
};

type FetchLike = typeof fetch;

export class SupabaseRestError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message);
    this.name = "SupabaseRestError";
  }
}

export function recentSearchShadowRetryDelayMs(attempt: number): number | null {
  const delays = [1_000, 5_000, 30_000, 120_000];
  if (!Number.isInteger(attempt) || attempt < 0) return null;
  return delays[attempt] ?? null;
}

function localSupabaseUrl(value: string): URL {
  const url = new URL(value);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (!localHosts.has(url.hostname) || url.protocol !== "http:") {
    throw new Error("Supabase migration adapter only permits an HTTP loopback URL.");
  }
  return url;
}

export function isSupabaseRecentSearchShadowEnabled(env: SupabaseShadowEnvironment): boolean {
  return env.SUPABASE_RECENT_SEARCHES_SHADOW === "true"
    && Boolean(env.SUPABASE_URL)
    && Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
}

export class SupabaseAdminRestClient {
  private readonly baseUrl: string;

  constructor(
    private readonly config: SupabaseAdminConfig,
    private readonly fetcher: FetchLike = fetch,
    private readonly requestTimeoutMs = 5_000,
  ) {
    if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs <= 0) {
      throw new Error("Supabase request timeout must be a positive finite number.");
    }
    if (!config.serviceRoleKey) throw new Error("Supabase service role key is required on the server.");
    this.baseUrl = localSupabaseUrl(config.url).toString().replace(/\/$/, "");
  }

  async upsert(table: "users", rows: Record<string, unknown>[], conflictColumn: "_id"): Promise<void> {
    this.validateIdentifier(table);
    this.validateIdentifier(conflictColumn);
    const url = new URL(`${this.baseUrl}/rest/v1/${table}`);
    url.searchParams.set("on_conflict", conflictColumn);
    await this.request(url, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
  }

  async applyRecentSearchShadow(operation: {
    id: string;
    userId: string;
    revision: number;
    deleted: boolean;
    record?: Record<string, unknown>;
  }): Promise<void> {
    if (!Number.isSafeInteger(operation.revision) || operation.revision < 0) {
      throw new Error("Recent-search shadow revision must be a non-negative safe integer.");
    }
    if (!operation.deleted && (!operation.record
      || operation.record._id !== operation.id
      || operation.record.userId !== operation.userId
      || operation.record.timestamp !== operation.revision)) {
      throw new Error("Recent-search shadow row must match its ID, owner, and revision.");
    }
    const url = new URL(`${this.baseUrl}/rest/v1/rpc/apply_recent_search_shadow`);
    await this.request(url, {
      method: "POST",
      body: JSON.stringify({
        p_search_id: this.validateConvexId(operation.id),
        p_user_id: this.validateConvexId(operation.userId),
        p_revision: operation.revision,
        p_deleted: operation.deleted,
        p_record: operation.record ?? null,
      }),
    });
  }

  private validateIdentifier(value: string): void {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new Error("Invalid Supabase table or column name.");
  }

  private validateConvexId(value: string): string {
    if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid Convex document ID.");
    return value;
  }

  private async request(url: URL, init: RequestInit): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    let response: Response;
    try {
      response = await this.fetcher(url, {
        ...init,
        signal: controller.signal,
        headers: {
          apikey: this.config.serviceRoleKey,
          Authorization: `Bearer ${this.config.serviceRoleKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          ...init.headers,
        },
      });
    } catch {
      // Fetch errors can include URLs or implementation details. Keep them out of action logs.
      throw new SupabaseRestError("Local Supabase REST request failed (network or timeout).", true);
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      // Do not echo provider response bodies; they may contain request or user data.
      throw new SupabaseRestError(
        `Local Supabase REST request failed (${response.status}).`,
        response.status === 429 || response.status >= 500,
      );
    }
  }
}
