import { action, query } from "./_generated/server";
import { v } from "convex/values";

export const uploadImage = action({
    args: {
        file: v.bytes(),
        contentType: v.string(),
    },
    handler: async (ctx, args) => {
        const blob = new Blob([args.file], { type: args.contentType });
        const storageId = await ctx.storage.store(blob);
        return { storageId };
    },
});

export const getImageUrl = query({
    args: {
        storageId: v.string(),
    },
    handler: async (ctx, args) => {

        const url = await ctx.storage.getUrl(args.storageId);
        if (!url) {
            throw new Error("Failed to resolve image URL");
        }
        return url;
    },
});
