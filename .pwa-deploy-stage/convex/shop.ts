import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// 1. Get products for a specific page
export const getProductsByPage = query({
  args: { pageId: v.string() },
  handler: async (ctx, args) => {
    // We normalize the ID just in case
    const normalizedPageId = ctx.db.normalizeId("pages", args.pageId);
    if (!normalizedPageId) return [];
    
    const products = await ctx.db
      .query("products")
      .withIndex("by_page", (q) => q.eq("pageId", normalizedPageId))
      .collect();

    // Map to ShopProduct frontend format
    return products.map(product => ({
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      category: product.category || 'Uncategorized',
      image: product.image || '',
      inStock: product.inStock,
      pageId: product.pageId,
      createdAt: product.createdAt,
    }));
  },
});

// 2. Add product (Only owner can add)
export const addProduct = mutation({
  args: {
    pageId: v.id("pages"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    currency: v.string(),
    category: v.optional(v.string()),
    inStock: v.boolean(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found");

    if (page.ownerId !== user._id) {
      throw new Error("Unauthorized: Only the page owner can add products.");
    }

    const now = Date.now();
    const productId = await ctx.db.insert("products", {
      pageId: args.pageId,
      name: args.name,
      description: args.description,
      price: args.price,
      currency: args.currency,
      category: args.category,
      inStock: args.inStock,
      image: args.image,
      createdAt: now,
      updatedAt: now,
    });

    return productId;
  },
});

// 3. Delete product (Only owner can delete)
export const deleteProduct = mutation({
  args: {
    pageId: v.id("pages"),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found");

    if (page.ownerId !== user._id) {
      throw new Error("Unauthorized: Only the page owner can delete products.");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    if (product.pageId !== args.pageId) {
      throw new Error("Product does not belong to this page");
    }

    await ctx.db.delete(args.productId);
  },
});
