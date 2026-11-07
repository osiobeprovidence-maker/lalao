/** Resolve one token for the identity the user selected; never cross providers on failure. */
export async function getTokenForSelectedIdentity(options: {
  playsoleSelected: boolean;
  getPlaysoleToken: () => Promise<string | null>;
  getFirebaseToken: () => Promise<string | null>;
}): Promise<string | null> {
  if (options.playsoleSelected) return options.getPlaysoleToken();
  return options.getFirebaseToken();
}
