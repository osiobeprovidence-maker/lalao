declare module 'npm:@supabase/server@1' {
  type QueryResult<T> = { data: T | null; error: { code?: string; message?: string } | null };
  interface PostgrestQuery<T> extends PromiseLike<QueryResult<T>> {
    eq(column: string, value: unknown): PostgrestQuery<T>;
    in(column: string, values: unknown[]): PostgrestQuery<T>;
    limit(count: number): PostgrestQuery<T>;
    order(column: string, options?: { ascending?: boolean }): PostgrestQuery<T>;
    maybeSingle(): PostgrestQuery<Record<string, unknown>>;
  }
  interface AdminClient {
    from<T = Record<string, unknown>[]>(table: string): {
      select(columns: string): PostgrestQuery<T>;
    };
    rpc<T = unknown>(name: string, args: Record<string, unknown>): PromiseLike<QueryResult<T>>;
  }
  interface UserContext {
    userClaims?: Record<string, unknown>;
    jwtClaims?: Record<string, unknown>;
    supabaseAdmin: AdminClient;
  }
  interface PublicContext {
    supabase: unknown;
    supabaseAdmin?: AdminClient;
  }
  export function withSupabase(
    options: { auth: 'user' },
    handler: (request: Request, context: UserContext) => Promise<Response>,
  ): (request: Request) => Promise<Response>;
  export function withSupabase(
    options: { auth: 'none' },
    handler: (request: Request, context: PublicContext) => Promise<Response>,
  ): (request: Request) => Promise<Response>;
}

declare module 'npm:@supabase/supabase-js@2.118.0' {
  export function createClient(url: string, key: string, options?: Record<string, unknown>): any;
}

declare module 'npm:jose@6.2.14' {
  export function createRemoteJWKSet(url: URL, options?: Record<string, unknown>): any;
  export function decodeJwt(token: string): Record<string, unknown>;
  export function decodeProtectedHeader(token: string): Record<string, unknown>;
  export function jwtVerify(token: string, key: any, options?: Record<string, unknown>): Promise<{ payload: Record<string, unknown>; protectedHeader: Record<string, unknown> }>;
}
