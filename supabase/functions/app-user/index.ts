import { withLalaoAuth, type LalaoAuthContext } from '../_shared/withLalaoAuth.ts';
import { FIREBASE_ISSUER, parseProvisioningClaims } from '../_shared/currentUser.ts';
import { projectPublicUserProfile, publicUserProfileSelect } from '../_shared/publicUserProfile.ts';

function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };
type CloudinaryCleanupJob = { id: number; cloudinary_public_id: string; attempts: number };

function getCloudinaryConfig(): CloudinaryConfig | null {
  const env = (globalThis as typeof globalThis & {
    Deno?: { env: { get(name: string): string | undefined } };
  }).Deno?.env;
  const cloudName = env?.get('CLOUDINARY_CLOUD_NAME');
  const apiKey = env?.get('CLOUDINARY_API_KEY');
  const apiSecret = env?.get('CLOUDINARY_API_SECRET');
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

async function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string,
): Promise<string> {
  const value = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&') + apiSecret;
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function isOwnedCloudinaryAvatarUrl(url: string, cloudName: string, publicId: string): boolean {
  try {
    const parsed = new URL(url);
    const uploadPrefix = `/${cloudName}/image/upload/`;
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com' || !parsed.pathname.startsWith(uploadPrefix)) {
      return false;
    }
    const path = parsed.pathname.slice(uploadPrefix.length).split('/').filter(Boolean);
    if (/^v\d+$/.test(path[0] ?? '')) path.shift();
    const urlPublicId = path.join('/').replace(/\.[^/.]+$/, '');
    return urlPublicId === publicId;
  } catch {
    return false;
  }
}

async function processAvatarCleanup(
  admin: LalaoAuthContext['supabaseAdmin'],
  userId: string,
): Promise<boolean> {
  const { data: jobs, error: queryError } = await admin
    .from('lalao_avatar_cleanup_jobs')
    .select('id, cloudinary_public_id, attempts')
    .eq('user_id', userId)
    .is('completed_at', null)
    .order('created_at', { ascending: true })
    .limit(3);
  if (queryError) return true;
  if (!jobs?.length) return false;

  const config = getCloudinaryConfig();
  let pending = false;
  for (const job of jobs as CloudinaryCleanupJob[]) {
    let deleted = false;
    let lastError = 'cloudinary_delete_failed';
    if (!config) {
      lastError = 'cloudinary_server_configuration_missing';
    } else {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = await signCloudinaryParams(
        { public_id: job.cloudinary_public_id, timestamp },
        config.apiSecret,
      );
      const body = new URLSearchParams({
        public_id: job.cloudinary_public_id,
        api_key: config.apiKey,
        timestamp: String(timestamp),
        signature,
      });
      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
          { method: 'POST', body, signal: AbortSignal.timeout(8_000) },
        );
        if (response.ok) {
          const result: unknown = await response.json();
          deleted = Boolean(
            result &&
            typeof result === 'object' &&
            'result' in result &&
            ((result as { result?: unknown }).result === 'ok' ||
              (result as { result?: unknown }).result === 'not found')
          );
        }
      } catch {
        deleted = false;
      }
    }

    const { error: updateError } = await admin
      .from('lalao_avatar_cleanup_jobs')
      .update({
        attempts: job.attempts + 1,
        last_error: deleted ? null : lastError,
        completed_at: deleted ? new Date().toISOString() : null,
      })
      .eq('id', job.id)
      .eq('user_id', userId);
    if (!deleted || updateError) pending = true;
  }
  return pending;
}

export default {
  fetch: withLalaoAuth(async (request, context) => {
    if (request.method !== 'POST') return jsonError('Method not allowed.', 405);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError('Invalid request.', 400);
    }
    const supportedOperations = [
      'getCurrentUser', 'createUserRecord', 'updateName', 'updateProfile', 'updatePronouns',
      'updateLocation', 'updateInterests', 'completeOnboardingStep', 'updatePhoneSetup',
      'updateUserProfile', 'createAvatarUploadSignature', 'updateNotificationPrefs', 'joinWaitlist',
      'getUserByUsername', 'updateUserPhone',
    ];
    if (!body || typeof body !== 'object' || !supportedOperations.includes(String((body as { operation?: unknown }).operation))) {
      return jsonError('Unsupported user operation.', 400);
    }

    try {
      const admin = context.supabaseAdmin;
      if ((body as { operation: string }).operation === 'createUserRecord') {
        const provisioning = parseProvisioningClaims(context.principal);
        const { data: userId, error } = await admin.rpc('ensure_lalao_user_for_identity', {
          p_issuer: provisioning.issuer,
          p_subject: provisioning.subject,
          p_email: provisioning.email,
          p_email_verified: provisioning.emailVerified,
          p_name: provisioning.name,
          p_avatar_url: provisioning.avatarUrl,
          p_method: provisioning.method,
        });
        if (error || typeof userId !== 'string') {
          if (error?.code === '23505' && error.message.includes('A Lalao account may already use this email')) {
            return jsonError('A Lalao account may already use this email. Sign in to that account first, then link this sign-in method from Security & Authentication.', 409);
          }
          return jsonError('Could not prepare your Lalao profile. Please try again.', 500);
        }
        return Response.json(userId);
      }

      const operation = (body as { operation: string }).operation;
      const currentUser = context.currentUser;
      if (!currentUser || typeof currentUser._id !== 'string') {
        return jsonError('Lalao profile not found.', 404);
      }
      if (operation === 'getCurrentUser') return Response.json(currentUser);

      if (operation === 'getUserByUsername') {
        const payload = (body as { payload?: unknown }).payload;
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          return jsonError('Invalid public profile request.', 400);
        }
        const fields = payload as Record<string, unknown>;
        if (
          Object.keys(fields).length !== 1 ||
          typeof fields.username !== 'string'
        ) {
          return jsonError('Invalid public profile request.', 400);
        }

        const { data, error } = await admin
          .from('users')
          .select(publicUserProfileSelect)
          .eq('username', fields.username)
          .maybeSingle();
        if (error) return jsonError('Could not load this public profile. Please try again.', 500);
        return Response.json(projectPublicUserProfile(data as Record<string, unknown> | null));
      }

      if (operation === 'joinWaitlist') {
        const payload = (body as { payload?: unknown }).payload;
        if (payload !== undefined && (
          !payload ||
          typeof payload !== 'object' ||
          Array.isArray(payload) ||
          Object.keys(payload).length > 0
        )) {
          return jsonError('Invalid waitlist request.', 400);
        }
        const { data, error } = await admin.rpc('join_lalao_user_waitlist', {
          p_user_id: currentUser._id,
        });
        if (error) {
          if (error.code === 'P0002') return jsonError('User not found.', 404);
          if (error.code === 'P0001') return jsonError('User is not country restricted.', 409);
          if (error.code === '22023') return jsonError('Waitlist profile details are incomplete.', 400);
          return jsonError('Could not join the waitlist. Please try again.', 500);
        }
        if (typeof data !== 'string') return jsonError('Could not join the waitlist. Please try again.', 500);
        return Response.json(data);
      }

      if (operation === 'updateNotificationPrefs') {
        const payload = (body as { payload?: unknown }).payload;
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          return jsonError('Invalid notification preferences.', 400);
        }
        const fields = payload as Record<string, unknown>;
        if (
          Object.keys(fields).length !== 1 ||
          !Object.prototype.hasOwnProperty.call(fields, 'prefs') ||
          !fields.prefs ||
          typeof fields.prefs !== 'object' ||
          Array.isArray(fields.prefs)
        ) {
          return jsonError('Invalid notification preferences.', 400);
        }
        const prefs = fields.prefs as Record<string, unknown>;
        const allowedPreferences = new Set([
          'messages', 'cycles', 'likes', 'comments', 'follows', 'mentions', 'desktop',
        ]);
        if (Object.entries(prefs).some(([key, value]) => !allowedPreferences.has(key) || typeof value !== 'boolean')) {
          return jsonError('Invalid notification preferences.', 400);
        }
        const { error } = await admin.rpc('update_lalao_user_notification_preferences', {
          p_user_id: currentUser._id,
          p_prefs: prefs,
        });
        if (error) {
          if (error.code === 'P0002') return jsonError('Lalao profile not found.', 404);
          if (error.code === '22023') return jsonError('Invalid notification preferences.', 400);
          return jsonError('Could not update notification preferences. Please try again.', 500);
        }
        return Response.json(null);
      }

      if (operation === 'createAvatarUploadSignature') {
        const config = getCloudinaryConfig();
        if (!config) return jsonError('Profile photo uploads are unavailable.', 503);
        const userId = currentUser._id;
        if (!/^[A-Za-z0-9_-]+$/.test(userId)) return jsonError('Profile photo uploads are unavailable.', 503);
        const folder = `avatars/${userId}`;
        const publicId = `${folder}/${crypto.randomUUID()}`;
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = await signCloudinaryParams({ public_id: publicId, timestamp }, config.apiSecret);
        return Response.json({
          signature,
          timestamp,
          apiKey: config.apiKey,
          cloudName: config.cloudName,
          publicId,
        });
      }

      if (operation === 'updatePhoneSetup') {
        const payload = (body as { payload?: unknown }).payload;
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          return jsonError('Invalid phone setup.', 400);
        }
        const fields = payload as Record<string, unknown>;
        if (
          Object.keys(fields).some((key) => !['phoneNumber', 'countryCode', 'countryName', 'phoneCountryCode'].includes(key)) ||
          typeof fields.phoneNumber !== 'string' || !/^\+[1-9]\d{7,14}$/.test(fields.phoneNumber) ||
          typeof fields.countryCode !== 'string' || typeof fields.countryName !== 'string' ||
          typeof fields.phoneCountryCode !== 'string'
        ) return jsonError('Invalid phone setup.', 400);

        const allowedCallingCodes: Record<string, string> = { NG: '234', KE: '254', GH: '233' };
        const expectedCallingCode = allowedCallingCodes[fields.countryCode];
        if (expectedCallingCode && (
          fields.phoneCountryCode !== expectedCallingCode || !fields.phoneNumber.startsWith(`+${expectedCallingCode}`)
        )) {
          return jsonError('Phone number country does not match the selected country.', 400);
        }
        const { data: duplicate, error: duplicateError } = await admin
          .from('users')
          .select('_id')
          .or(`phone.eq.${fields.phoneNumber},phoneNumber.eq.${fields.phoneNumber}`)
          .neq('_id', currentUser._id)
          .limit(1)
          .maybeSingle();
        if (duplicateError) return jsonError('Could not validate this phone number. Please try again.', 500);
        if (duplicate) return jsonError('This phone number is already linked to another account.', 409);

        const accessStatus = ['NG', 'KE', 'GH'].includes(fields.countryCode) ? 'available' : 'country_restricted';
        const { error: updateError } = await admin.from('users').update({
          phone: fields.phoneNumber,
          phoneNumber: fields.phoneNumber,
          countryCode: fields.countryCode,
          countryName: fields.countryName,
          phoneCountryCode: fields.phoneCountryCode,
          phoneSetupCompleted: true,
          phoneVerified: false,
          accessStatus,
          updatedAt: Date.now(),
        }).eq('_id', currentUser._id);
        if (updateError) return jsonError('Could not save your phone number. Please try again.', 500);
        return Response.json(accessStatus);
      }

      const payload = (body as { payload?: unknown }).payload;
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return jsonError('Invalid profile update.', 400);
      if (operation === 'updateUserProfile') {
        const fields = payload as Record<string, unknown>;
        const allowedFields = new Set([
          'name', 'username', 'bio', 'locationName', 'avatarUrl',
          'avatarCloudinaryPublicId', 'publicIdentityType', 'dateOfBirth', 'birthDateVisibility',
          'avatarStorageId',
        ]);
        if (Object.keys(fields).some((field) => !allowedFields.has(field))) {
          return jsonError('Invalid profile update.', 400);
        }
        if (Object.prototype.hasOwnProperty.call(fields, 'avatarStorageId')) {
          return jsonError('Convex Storage avatars are not available through the Supabase profile backend.', 409);
        }
        for (const field of ['name', 'username', 'bio', 'locationName', 'avatarUrl', 'dateOfBirth']) {
          if (Object.prototype.hasOwnProperty.call(fields, field) && typeof fields[field] !== 'string') {
            return jsonError('Invalid profile update.', 400);
          }
        }
        if (Object.prototype.hasOwnProperty.call(fields, 'avatarCloudinaryPublicId')) {
          const publicId = fields.avatarCloudinaryPublicId;
          const folder = `avatars/${currentUser._id}/`;
          if (
            typeof publicId !== 'string' ||
            !publicId.startsWith(folder) ||
            publicId.length <= folder.length ||
            typeof fields.avatarUrl !== 'string'
          ) {
            return jsonError('Invalid profile update.', 400);
          }
          const config = getCloudinaryConfig();
          if (!config) return jsonError('Profile photo updates are unavailable.', 503);
          if (!isOwnedCloudinaryAvatarUrl(fields.avatarUrl, config.cloudName, publicId)) {
            return jsonError('Invalid profile update.', 400);
          }
        }
        if (Object.prototype.hasOwnProperty.call(fields, 'publicIdentityType')
          && !['display_name', 'username', 'both'].includes(String(fields.publicIdentityType))) {
          return jsonError('Invalid profile update.', 400);
        }
        if (Object.prototype.hasOwnProperty.call(fields, 'birthDateVisibility')
          && !['public', 'age_only', 'private'].includes(String(fields.birthDateVisibility))) {
          return jsonError('Invalid profile update.', 400);
        }

        const { data, error } = await admin.rpc('update_lalao_user_profile', {
          p_user_id: currentUser._id,
          p_payload: fields,
        });
        if (error) {
          if (error.code === '23505' && error.message === 'Username already taken') return jsonError(error.message, 409);
          if (error.code === 'P0002') return jsonError('Lalao profile not found.', 404);
          if (error.code === '55000') return jsonError('This profile photo uses legacy storage and cannot be replaced yet.', 409);
          if (error.code === '22023') return jsonError('Invalid profile update.', 400);
          return jsonError('Could not update your Lalao profile. Please try again.', 500);
        }
        const avatarCleanupPending = await processAvatarCleanup(admin, currentUser._id);
        return Response.json({ userId: data, avatarCleanupPending });
      }

      if (operation === 'updateUserPhone') {
        const payload = (body as { payload?: unknown }).payload;
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          return jsonError('Invalid phone update.', 400);
        }
        const fields = payload as Record<string, unknown>;
        if (
          Object.keys(fields).length !== 1 ||
          typeof fields.phoneNumber !== 'string'
        ) {
          return jsonError('Invalid phone update.', 400);
        }
        const { error } = await admin.rpc('update_lalao_user_phone', {
          p_user_id: currentUser._id,
          p_phone_number: fields.phoneNumber,
        });
        if (error) {
          if (error.code === '23505') return jsonError(error.message, 409);
          if (error.code === 'P0002') return jsonError('Lalao profile not found.', 404);
          if (error.code === '22023') return jsonError('Invalid phone number.', 400);
          return jsonError('Could not update your phone number. Please try again.', 500);
        }
        return Response.json(null);
      }

      const { data, error } = await admin.rpc('update_lalao_user_onboarding', {
        p_user_id: currentUser._id,
        p_operation: operation,
        p_payload: payload as Record<string, unknown>,
      });
      if (error) {
        if (error.code === '23505' && error.message === 'Username already taken') return jsonError(error.message, 409);
        if (error.code === 'P0002') return jsonError('Lalao profile not found.', 404);
        return jsonError('Could not update your Lalao profile. Please try again.', 500);
      }
      return Response.json(data);
    } catch {
      // Do not return PostgREST errors, request contents, JWTs, or database values.
      return jsonError('Could not load your Lalao profile. Please try again.', 500);
    }
  }, { allowUnmappedProvisioning: true }),
};
