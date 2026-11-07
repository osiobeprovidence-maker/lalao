/** Require a verified Convex identity before issuing a temporary storage upload URL. */
export async function requireAuthenticatedUploadIdentity(ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Authentication is required to upload or resolve media.");
  return identity;
}
