import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { resolveCurrentUser, type CurrentUserRepository } from './currentUser.ts';
import { verifyLalaoJwt, type VerifiedLalaoPrincipal } from './verifyLalaoJwt.ts';

type AdminClient = ReturnType<typeof createClient>;
export type LalaoAuthContext = {
  supabaseAdmin: AdminClient;
  principal: VerifiedLalaoPrincipal;
  currentUser: Record<string, unknown> | null;
};
type Handler = (request: Request, context: LalaoAuthContext) => Promise<Response>;

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-max-age': '86400',
};

function responseWithCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(CORS_HEADERS)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function unauthorized(): Response {
  return Response.json({ error: 'Unauthorized.' }, { status: 401, headers: CORS_HEADERS });
}

function bearerFrom(request: Request): string | null {
  const value = request.headers.get('authorization');
  if (!value || value.includes(',') || !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/i.test(value)) return null;
  return value.slice(7);
}

async function requestedOperation(request: Request): Promise<string | null> {
  if (request.method !== 'POST') return null;
  try {
    const body: unknown = await request.clone().json();
    return body && typeof body === 'object' && !Array.isArray(body)
      && typeof (body as { operation?: unknown }).operation === 'string'
      ? (body as { operation: string }).operation : null;
  } catch { return null; }
}

function createServiceClient(): AdminClient {
  const env = (globalThis as typeof globalThis & { Deno: { env: { get(name: string): string | undefined } } }).Deno.env;
  const url = env.get('SUPABASE_URL');
  const key = env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Supabase server configuration is unavailable.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export function withLalaoAuth(
  handler: Handler,
  options: { allowUnmappedProvisioning?: boolean } = {},
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    const token = bearerFrom(request);
    if (!token) return unauthorized();

    let principal: VerifiedLalaoPrincipal;
    try { principal = await verifyLalaoJwt(token); }
    catch { return unauthorized(); }

    // Privileged database capability is created only after cryptographic verification.
    let admin: AdminClient;
    try { admin = createServiceClient(); }
    catch { return responseWithCors(Response.json({ error: 'Authentication service is unavailable.' }, { status: 503 })); }

    const repository: CurrentUserRepository = {
      async findLinkedUserIds(issuer, subject) {
        const { data, error } = await admin.from('authIdentities').select('userId').eq('issuer', issuer).eq('subject', subject).limit(2);
        if (error) throw error;
        return (data ?? []).map((row) => typeof row.userId === 'string' ? row.userId : '');
      },
      async findLegacyUserIds(tokenIdentifier) {
        const { data, error } = await admin.from('users').select('_id').eq('tokenIdentifier', tokenIdentifier).limit(2);
        if (error) throw error;
        return (data ?? []).map((row) => typeof row._id === 'string' ? row._id : '');
      },
      async findUserById(userId) {
        const { data, error } = await admin.from('users').select('*').eq('_id', userId).maybeSingle();
        if (error) throw error;
        return data;
      },
    };

    try {
      const identity = await resolveCurrentUser(principal, repository);
      if (identity.status !== 200) return responseWithCors(Response.json(identity.body, { status: identity.status }));
      const currentUser = identity.body && '_id' in identity.body && typeof identity.body._id === 'string'
        ? identity.body : null;
      if (!currentUser) {
        const operation = await requestedOperation(request);
        const mayProvisionVerifiedIdentity = options.allowUnmappedProvisioning === true
          && operation === 'createUserRecord' && (
          principal.provider === 'firebase'
          || (principal.provider === 'playsole' && (!principal.email || principal.emailVerified))
        );
        if (!mayProvisionVerifiedIdentity) {
          return responseWithCors(Response.json({ error: 'Lalao profile not found.' }, { status: 404 }));
        }
      }
      return responseWithCors(await handler(request, { supabaseAdmin: admin, principal, currentUser }));
    } catch {
      return responseWithCors(Response.json({ error: 'Could not authenticate your Lalao account. Please try again.' }, { status: 500 }));
    }
  };
}
