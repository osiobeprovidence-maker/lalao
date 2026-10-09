import { internalMutation } from "./_generated/server";

export const deleteDummyPages = internalMutation({
  args: {},
  handler: async (ctx) => {
    const pagesToDelete = [
      "lalao",
      "thismyinvite",
      "my_events",
      "test_sub_page",
      "jointheq"
    ];

    const pages = await ctx.db.query("pages").collect();
    let deleted = 0;

    for (const p of pages) {
      if (
        pagesToDelete.includes(p.username?.toLowerCase() || "") || 
        p.name === "JOINTHEQ" || 
        p.name === "Test Sub Page"
      ) {
        if (p.username !== "roomy") {
          await ctx.db.delete(p._id);
          deleted++;
        }
      }
    }
    return `Deleted ${deleted} dummy pages.`;
  }
});
