export function canAccessGroupChat(
  userId: string,
  creatorId: string,
  memberIds: readonly string[],
): boolean {
  return userId === creatorId || memberIds.includes(userId);
}

export function canDiscoverGroupCycle(
  userInterests: readonly string[],
  groupInterests: readonly string[],
): boolean {
  const normalizedUserInterests = new Set(userInterests.map((interest) => interest.trim().toLowerCase()));
  return groupInterests.some((interest) => normalizedUserInterests.has(interest.trim().toLowerCase()));
}
