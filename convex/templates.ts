import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        name: v.string(),
        thumbnail: v.string(),
        snapshot: v.any(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        return await ctx.db.insert("templates", {
            name: args.name,
            thumbnail: args.thumbnail,
            snapshot: args.snapshot,
        });
    },
});

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("templates").collect();
    },
});

export const get = query({
    args: { id: v.id("templates") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});


export const seedMany = mutation({
    args: {
      templates: v.array(
        v.object({
          name: v.string(),
          thumbnail: v.string(),
          snapshot: v.any(),
        })
      ),
    },
    handler: async (ctx, args) => {
    
  
      const existing = await ctx.db.query("templates").collect();
      if (existing.length > 0) {
        return "Templates already seeded";
      }
  
      for (const template of args.templates) {
        await ctx.db.insert("templates", template);
      }
  
      return "Seeded templates successfully";
    },
  });
  
  