const constantTimeHexEqual = (left: string, right: string): boolean => {
  if (!/^[0-9a-f]{64}$/i.test(left) || !/^[0-9a-f]{64}$/i.test(right)) return false;
  let difference = left.length ^ right.length;
  const normalizedRight = right.toLowerCase();
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ normalizedRight.charCodeAt(index);
  return difference === 0;
};

/** Verify Batch's current V2 signatures and the existing legacy signed-header format. */
export async function verifyBachsWebhookSignature(args: {
  rawBody: string;
  secret: string;
  signatureV2?: string | null;
  legacySignature?: string | null;
  legacyTimestamp?: string | null;
  nowMs?: number;
  toleranceSeconds?: number;
}): Promise<boolean> {
  const { rawBody, secret } = args;
  if (!secret) return false;
  let timestampText = args.legacyTimestamp || '';
  let signatures = args.legacySignature ? [args.legacySignature] : [];
  if (args.signatureV2) {
    const parts = args.signatureV2.split(',').map((part) => part.trim());
    timestampText = parts.find((part) => part.startsWith('t='))?.slice(2) || '';
    signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  }
  const timestamp = Number(timestampText);
  const nowMs = args.nowMs ?? Date.now();
  const tolerance = args.toleranceSeconds ?? 300;
  if (!timestampText || !Number.isInteger(timestamp) || Math.abs(nowMs / 1000 - timestamp) > tolerance || signatures.length === 0) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestampText}.${rawBody}`));
  const expected = Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return signatures.some((signature) => constantTimeHexEqual(expected, signature));
}
