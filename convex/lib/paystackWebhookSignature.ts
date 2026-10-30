const isHexDigest = (value: string): boolean => /^[0-9a-f]{128}$/i.test(value);

function constantTimeHexEqual(left: string, right: string): boolean {
  if (!isHexDigest(left) || !isHexDigest(right)) return false;
  let difference = 0;
  const normalizedRight = right.toLowerCase();
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.toLowerCase().charCodeAt(index) ^ normalizedRight.charCodeAt(index);
  }
  return difference === 0;
}

/** Verifies Paystack's x-paystack-signature over the unmodified request body. */
export async function verifyPaystackWebhookSignature(args: {
  rawBody: Uint8Array;
  secret: string;
  signature?: string | null;
}): Promise<boolean> {
  const { rawBody, secret, signature } = args;
  if (!secret || !signature || !isHexDigest(signature)) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, rawBody);
  const expected = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return constantTimeHexEqual(expected, signature);
}
