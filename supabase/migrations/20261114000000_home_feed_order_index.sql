CREATE INDEX IF NOT EXISTS idx_posts_feed_created_id
  ON public."posts" ("createdAt" DESC, "_id" DESC);
