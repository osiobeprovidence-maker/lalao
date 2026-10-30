import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyPaystackWebhookSignature } from "../../convex/lib/paystackWebhookSignature";

const secret = "local-test-secret";
const rawBody = new TextEncoder().encode('{"event":"charge.success","data":{"amount":12345}}');
const signature = createHmac("sha512", secret).update(rawBody).digest("hex");

assert.equal(await verifyPaystackWebhookSignature({ rawBody, secret, signature }), true, "accepts a valid Paystack HMAC");
assert.equal(await verifyPaystackWebhookSignature({ rawBody, secret, signature: signature.toUpperCase() }), true, "accepts uppercase hex");
assert.equal(await verifyPaystackWebhookSignature({ rawBody, secret, signature: `${signature.slice(0, -1)}0` }), false, "rejects a modified signature");
assert.equal(await verifyPaystackWebhookSignature({ rawBody, secret, signature: undefined }), false, "rejects a missing signature");
assert.equal(await verifyPaystackWebhookSignature({ rawBody, secret: "", signature }), false, "fails closed when the secret is unavailable");
assert.equal(await verifyPaystackWebhookSignature({ rawBody: new TextEncoder().encode("{} "), secret, signature }), false, "rejects a body changed after signing");

console.log("Paystack webhook signature tests passed.");
