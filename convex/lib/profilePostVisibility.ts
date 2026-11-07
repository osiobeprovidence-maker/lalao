export function canViewProfilePost(
  post: { authorId: string; audience?: string },
  viewerId: string | null,
): boolean {
  return post.authorId === viewerId || post.audience === undefined || post.audience === "everyone";
}
