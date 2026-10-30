/** Return a server-generated per-record revision strictly newer than the prior row. */
export function nextRecentSearchShadowRevision(previousRevision: number, now = Date.now()): number {
  if (!Number.isFinite(previousRevision) || previousRevision < 0 || !Number.isFinite(now) || now < 0) {
    throw new Error("Recent-search revisions must be finite non-negative numbers.");
  }
  return Math.max(Math.floor(now), Math.floor(previousRevision) + 1);
}

/** Convex document IDs are never reused, so deletion can permanently outrank every prior sync. */
export function deleteRecentSearchShadowRevision(lastRevision: number): number {
  if (!Number.isFinite(lastRevision) || lastRevision < 0) {
    throw new Error("Recent-search revisions must be finite non-negative numbers.");
  }
  return Math.floor(lastRevision) + 1;
}
