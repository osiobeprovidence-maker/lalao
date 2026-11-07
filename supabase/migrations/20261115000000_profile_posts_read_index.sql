CREATE INDEX IF NOT EXISTS idx_posts_profile_author_order
  ON public."posts" ("authorId", "createdAt" DESC, _id DESC);
