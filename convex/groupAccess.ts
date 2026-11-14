export function canAccessGroupChat(
  userId: string,
  creatorId: string,
  memberIds: readonly string[],
): boolean {
  return userId === creatorId || memberIds.includes(userId);
}

export function isAvailableChatroom(
  status: "active" | "inactive" | undefined,
  visibility: "public" | "private_discoverable" | "private_hidden" | undefined,
  isMember: boolean,
): boolean {
  if (status === "inactive") return false;
  return (visibility ?? "private_discoverable") === "public" || isMember;
}

export function canDiscoverGroupCycle(
  userInterests: readonly string[],
  groupInterests: readonly string[],
): boolean {
  const normalizedUserInterests = new Set(userInterests.map((interest) => interest.trim().toLowerCase()));
  return groupInterests.some((interest) => normalizedUserInterests.has(interest.trim().toLowerCase()));
}
