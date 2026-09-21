import { query } from "./_generated/server";

export default query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").order("desc").take(50);
    return posts.filter(p => p.text.includes("test video upload and stream"));
  },
});
