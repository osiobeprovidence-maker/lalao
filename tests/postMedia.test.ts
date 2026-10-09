import assert from "node:assert/strict";
import test from "node:test";

import { resolvePostMediaUrl } from "../src/utils/postMedia.ts";

test("preserves an existing media URL when the storage reference is unavailable", () => {
  assert.equal(
    resolvePostMediaUrl({
      mediaUrl: "https://cdn.example/post.jpg",
      mediaStorageId: undefined,
      getUrl: () => undefined,
    }),
    "https://cdn.example/post.jpg",
  );
});

test("falls back to the authoritative Convex storage reference", () => {
  const storageUrl = "https://convex.example/files/post.jpg";

  assert.equal(
    resolvePostMediaUrl({
      mediaUrl: undefined,
      mediaStorageId: "storage_id_123",
      getUrl: () => storageUrl,
    }),
    storageUrl,
  );
});

test("keeps the existing URL when Cloudinary is the failing source", () => {
  const storageUrl = "https://convex.example/files/original-post.jpg";

  assert.equal(
    resolvePostMediaUrl({
      mediaUrl: storageUrl,
      mediaStorageId: "storage_id_123",
      getUrl: () => storageUrl,
    }),
    storageUrl,
  );
});
