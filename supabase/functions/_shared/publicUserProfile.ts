import { resolveLalaoUserVerification } from './currentUser.ts';

const publicProfileFields = [
  '_id',
  'name',
  'username',
  'avatarUrl',
  'bio',
  'pronouns',
  'userType',
  'locationName',
  'followersCount',
  'followingCount',
  'publicIdentityType',
  'birthDateVisibility',
  'verificationTier',
  'creatorCategory',
  'creatorType',
  'mangaPublisherName',
  'mangaCreatorAbout',
  'shortMovieStudioName',
  'shortMovieCreatorAbout',
  'creatorLevel',
] as const;

export const publicUserProfileSelect = [
  ...publicProfileFields,
  'dateOfBirth',
  'verificationStatus',
  'verificationExpiresAt',
  'suspended',
  'creatorAccountStatus',
].join(',');

function calculateAge(dateOfBirth: string, now: Date): number | null {
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime()) || birthDate > now) return null;

  let age = now.getFullYear() - birthDate.getFullYear();
  if (
    now.getMonth() < birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function projectPublicUserProfile(
  user: Record<string, unknown> | null,
  now = new Date(),
): Record<string, unknown> | null {
  if (!user || user.suspended === true) return null;

  const profile: Record<string, unknown> = {};
  for (const field of publicProfileFields) {
    if (user[field] !== undefined) profile[field] = user[field];
  }

  const avatar = typeof user.avatarUrl === 'string' ? user.avatarUrl : '';
  profile.avatarUrl = avatar;
  profile.avatar = avatar;
  if (typeof user.locationName === 'string') profile.location = user.locationName;

  if (user.birthDateVisibility === 'public' && typeof user.dateOfBirth === 'string') {
    profile.dateOfBirth = user.dateOfBirth;
  } else if (user.birthDateVisibility === 'age_only' && typeof user.dateOfBirth === 'string') {
    const age = calculateAge(user.dateOfBirth, now);
    if (age !== null) profile.age = age;
  }

  Object.assign(profile, resolveLalaoUserVerification(user, now.getTime()));

  if (user.creatorAccountStatus === 'suspended' || user.creatorAccountStatus === 'closed') {
    for (const field of [
      'creatorCategory',
      'creatorType',
      'mangaPublisherName',
      'mangaCreatorAbout',
      'shortMovieStudioName',
      'shortMovieCreatorAbout',
      'creatorLevel',
    ]) {
      delete profile[field];
    }
  }

  return profile;
}
