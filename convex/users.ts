import { mutation, query } from "./_generated/server";
import { v } from "convex/values"; //validator

export const syncUser = mutation({
  //when using mutation there are two fields args and handler
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  //handler is the function that will be called when the mutation is called it checks if the user exists and if not it inserts the user
  handler: async (ctx, args) => {
    //ctx The Convex context, which provides access to Convex APIs (e.g., database operations).
    //check if the user exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    if (!existingUser) {
      //insert the user to users db table
      await ctx.db.insert("users", {
        userId: args.userId,
        email: args.email,
        name: args.name,
        isPro: false,
      });
    }
  },
});
export const getUser = query({
  args: {
    userId: v.string(), // the id of the user which we are going to get
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return null;
    }
    //get the user from the users db table
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user) return null;

    return user;
  },
});
