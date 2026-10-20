import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUser } from "./social";

export const getCart = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    if (!user) return [];

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return Promise.all(cartItems.map(async (item) => {
      const product = await ctx.db.get(item.productId);
      if (!product) return null;
      
      const page = await ctx.db.get(product.pageId);

      return {
        id: item._id,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions,
        addedAt: new Date(item.createdAt).toISOString(),
        storeId: page?._id,
        storeName: page?.name || "Unknown Store",
        product: {
          id: product._id,
          name: product.name,
          price: product.price,
          currency: product.currency,
          image: product.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
          category: product.category,
          inStock: product.inStock,
        }
      };
    })).then(results => results.filter(Boolean));
  },
});

export const addToCart = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    selectedOptions: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    // Check if product already in cart
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + args.quantity,
      });
    } else {
      await ctx.db.insert("cartItems", {
        userId: user._id,
        productId: args.productId,
        quantity: args.quantity,
        selectedOptions: args.selectedOptions,
        createdAt: Date.now(),
      });
    }
  },
});

export const updateCartQuantity = mutation({
  args: {
    cartItemId: v.id("cartItems"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    if (args.quantity <= 0) {
      await ctx.db.delete(args.cartItemId);
    } else {
      await ctx.db.patch(args.cartItemId, { quantity: args.quantity });
    }
  },
});

export const removeFromCart = mutation({
  args: {
    cartItemId: v.id("cartItems"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    await ctx.db.delete(args.cartItemId);
  },
});

export const clearCart = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthedUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const item of cartItems) {
      await ctx.db.delete(item._id);
    }
  },
});
