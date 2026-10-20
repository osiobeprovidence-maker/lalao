/**
 * Playsole One OAuth 2.0 / OIDC Authentication Client
 * Conforms to RFC 7636 (PKCE), RFC 7009 (Token Revocation), and OIDC 1.0.
 * Specification: https://one.playsole.xyz/developers
 */

export const PLAYSOLE_CONFIG = {
  issuer: 'https://one.playsole.xyz',
  authorizeEndpoint: 'https://one.playsole.xyz/authorize',
  tokenEndpoint: 'https://one.playsole.xyz/token',
  userinfoEndpoint: 'https://one.playsole.xyz/userinfo',
  revokeEndpoint: 'https://one.playsole.xyz/revoke',
  clientId: (import.meta.env.VITE_PLAYSOLE_CLIENT_ID as string) || 'lalao',
  scopes: 'openid profile email',
  storageKey: 'lalao_playsole_session',
  pkceVerifierKey: 'playsole_pkce_verifier',
  authStateKey: 'playsole_auth_state',
};

export interface PlaysoleTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
}

export interface PlaysoleUserProfile {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  tenant_id?: string;
  mfa_enabled?: boolean;
  updated_at?: number;
}

export interface PlaysoleSession {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
  user: PlaysoleUserProfile;
}

/**
 * Base64URL encoder without padding
 */
function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate a cryptographically random PKCE code verifier (RFC 7636)
 */
function generateCodeVerifier(): string {
  const randomBytes = new Uint8Array(32);
  window.crypto.getRandomValues(randomBytes);
  return base64UrlEncode(randomBytes);
}

/**
 * Generate a SHA-256 PKCE code challenge from a verifier
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(hash);
}

/**
 * Generate a random CSRF state string
 */
function generateState(): string {
  const randomBytes = new Uint8Array(16);
  window.crypto.getRandomValues(randomBytes);
  return base64UrlEncode(randomBytes);
}

/**
 * Decode payload from JWT (id_token) safely without external deps
 */
export function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn('Failed to parse JWT payload', e);
    return null;
  }
}

/**
 * Get current Redirect URI based on window location
 */
export function getPlaysoleRedirectUri(): string {
  return `${window.location.origin}/auth/playsole/callback`;
}

/**
 * Initiate Playsole One Login
 * Redirects the user to Playsole's authorization screen with PKCE.
 */
export async function initiatePlaysoleLogin(options?: { prompt?: 'select_account' | 'consent' | 'login'; loginHint?: string }): Promise<void> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateState();
  const redirectUri = getPlaysoleRedirectUri();

  // Persist PKCE verifier and state in sessionStorage
  sessionStorage.setItem(PLAYSOLE_CONFIG.pkceVerifierKey, verifier);
  sessionStorage.setItem(PLAYSOLE_CONFIG.authStateKey, state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: PLAYSOLE_CONFIG.clientId,
    redirect_uri: redirectUri,
    scope: PLAYSOLE_CONFIG.scopes,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });

  if (options?.prompt) {
    params.set('prompt', options.prompt);
  }
  if (options?.loginHint) {
    params.set('login_hint', options.loginHint);
  }

  const authUrl = `${PLAYSOLE_CONFIG.authorizeEndpoint}?${params.toString()}`;
  window.location.href = authUrl;
}

/**
 * Direct token exchange via fetch using PKCE
 */
async function directTokenExchange(code: string, verifier: string, redirectUri: string): Promise<PlaysoleTokenResponse> {
  const tokenRes = await fetch(PLAYSOLE_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: PLAYSOLE_CONFIG.clientId,
      code_verifier: verifier,
    }),
  });

  if (!tokenRes.ok) {
    let errorDesc = 'Failed to exchange authorization code.';
    try {
      const errJson = await tokenRes.json();
      errorDesc = errJson.error_description || errJson.error || errorDesc;
    } catch {
      // ignore
    }
    throw new Error(errorDesc);
  }

  return await tokenRes.json();
}

export async function handlePlaysoleCallback(
  code: string,
  state: string,
  exchangeFn?: (args: { code: string; codeVerifier: string; redirectUri: string }) => Promise<{ tokens: PlaysoleTokenResponse; userProfile?: PlaysoleUserProfile }>
): Promise<PlaysoleSession> {
  const expectedState = sessionStorage.getItem(PLAYSOLE_CONFIG.authStateKey);
  const verifier = sessionStorage.getItem(PLAYSOLE_CONFIG.pkceVerifierKey);

  // Clean up single-use PKCE credentials
  sessionStorage.removeItem(PLAYSOLE_CONFIG.authStateKey);
  sessionStorage.removeItem(PLAYSOLE_CONFIG.pkceVerifierKey);

  if (!verifier) {
    throw new Error('PKCE verification error: Code verifier missing from session.');
  }

  if (expectedState && state && expectedState !== state) {
    throw new Error('Security verification failed: OAuth state mismatch.');
  }

  const redirectUri = getPlaysoleRedirectUri();

  let tokenData: PlaysoleTokenResponse;
  let userProfile: PlaysoleUserProfile = { sub: '' };

  if (exchangeFn) {
    let lastError: any = null;
    let serverResult: any = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        serverResult = await exchangeFn({ code, codeVerifier: verifier, redirectUri });
        break;
      } catch (serverErr: any) {
        lastError = serverErr;
        const msg = String(serverErr?.message || serverErr);
        if (msg.includes('Connection lost') && attempt === 1) {
          // Wait 500ms and retry once if the connection was briefly interrupted
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        break;
      }
    }

    if (!serverResult) {
      throw new Error(lastError?.message || 'Server failed to exchange Playsole authorization code.');
    }

    tokenData = serverResult.tokens;
    if (serverResult.userProfile) {
      userProfile = serverResult.userProfile;
    }
  } else {
    tokenData = await directTokenExchange(code, verifier, redirectUri);
  }

  // Fetch or decode user profile if not already provided by backend
  if (!userProfile.sub) {
  try {
    const userinfoRes = await fetch(PLAYSOLE_CONFIG.userinfoEndpoint, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    if (userinfoRes.ok) {
      userProfile = await userinfoRes.json();
    } else {
      const decoded = decodeJwtPayload<any>(tokenData.id_token);
      if (decoded) {
        userProfile = {
          sub: decoded.sub,
          email: decoded.email,
          email_verified: decoded.email_verified,
          name: decoded.name,
          picture: decoded.picture,
          tenant_id: decoded.tenant_id,
        };
      }
    }
  } catch (err) {
    console.warn('Could not fetch userinfo, falling back to id_token claims', err);
    const decoded = decodeJwtPayload<any>(tokenData.id_token);
    if (decoded) {
      userProfile = {
        sub: decoded.sub,
        email: decoded.email,
        email_verified: decoded.email_verified,
        name: decoded.name,
        picture: decoded.picture,
        tenant_id: decoded.tenant_id,
      };
    }
  }
  }

  const session: PlaysoleSession = {
    accessToken: tokenData.access_token,
    idToken: tokenData.id_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
    user: userProfile,
  };

  savePlaysoleSession(session);
  return session;
}

/**
 * Persist Playsole session to localStorage and emit change event
 */
export function savePlaysoleSession(session: PlaysoleSession): void {
  localStorage.setItem(PLAYSOLE_CONFIG.storageKey, JSON.stringify(session));
  window.dispatchEvent(new Event('playsole_auth_changed'));
}

/**
 * Retrieve saved Playsole session from localStorage
 */
export function getPlaysoleSession(): PlaysoleSession | null {
  try {
    const stored = localStorage.getItem(PLAYSOLE_CONFIG.storageKey);
    if (!stored) return null;
    return JSON.parse(stored) as PlaysoleSession;
  } catch {
    return null;
  }
}

/**
 * Refresh Playsole Access/ID Token if near expiration
 */
export async function refreshPlaysoleTokenIfNeeded(): Promise<string | null> {
  const session = getPlaysoleSession();
  if (!session) return null;

  // If token is still valid for > 60 seconds, reuse current id_token
  const isExpiringSoon = session.expiresAt - Date.now() < 60 * 1000;
  if (!isExpiringSoon) {
    return session.idToken;
  }

  // Refresh token required
  if (!session.refreshToken) {
    return session.idToken;
  }

  try {
    const res = await fetch(PLAYSOLE_CONFIG.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: session.refreshToken,
        client_id: PLAYSOLE_CONFIG.clientId,
      }),
    });

    if (!res.ok) {
      console.warn('Failed to refresh Playsole token');
      return session.idToken;
    }

    const tokenData: PlaysoleTokenResponse = await res.json();
    session.accessToken = tokenData.access_token;
    if (tokenData.id_token) session.idToken = tokenData.id_token;
    if (tokenData.refresh_token) session.refreshToken = tokenData.refresh_token;
    session.expiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;

    savePlaysoleSession(session);
    return session.idToken;
  } catch (err) {
    console.warn('Token refresh error:', err);
    return session.idToken;
  }
}

/**
 * Revoke Playsole tokens (RFC 7009) and clear local session
 */
export async function logoutPlaysole(): Promise<void> {
  const session = getPlaysoleSession();
  if (session?.refreshToken) {
    try {
      await fetch(PLAYSOLE_CONFIG.revokeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: PLAYSOLE_CONFIG.clientId,
          token: session.refreshToken,
          token_type_hint: 'refresh_token',
        }),
      });
    } catch (e) {
      console.warn('Playsole revocation failed:', e);
    }
  }

  localStorage.removeItem(PLAYSOLE_CONFIG.storageKey);
  window.dispatchEvent(new Event('playsole_auth_changed'));
}
