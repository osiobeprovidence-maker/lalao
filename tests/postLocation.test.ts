import assert from "node:assert/strict";
import test from "node:test";

import { resolvePostCreationLocation } from "../src/utils/postLocation.ts";

test("keeps each author's posting location independent of another viewer's location", () => {
  const userBPost = resolvePostCreationLocation({
    authorLocationSnapshot: "Warri",
    viewerLocation: "Udu",
  });
  const userAPost = resolvePostCreationLocation({
    authorLocationSnapshot: "Udu",
    viewerLocation: "Warri",
  });

  assert.equal(userBPost, "Warri");
  assert.equal(userAPost, "Udu");
});

test("uses a clean post creation snapshot and never substitutes a viewer location", () => {
  assert.equal(
    resolvePostCreationLocation({
      authorLocationSnapshot: "  Warri  ",
      viewerLocation: "Udu",
    }),
    "Warri",
  );
});
