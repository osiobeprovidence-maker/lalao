export interface PostCreationLocationContext {
  authorLocationSnapshot?: string;
  viewerLocation?: string;
}

export function resolvePostCreationLocation({
  authorLocationSnapshot,
}: PostCreationLocationContext): string {
  return authorLocationSnapshot?.trim() || "Local";
}
