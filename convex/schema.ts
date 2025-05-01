import { defineSchema , defineTable} from "convex/server";
import { v } from "convex/values";//validator
export default defineSchema({
    users:defineTable({
        userId:v.string(),//clerkId
        email:v.string(),
       name:v.string(),
       isPro:v.boolean(),
        proSince:v.optional(v.number()),
        lemonSqueezyCustomerId:v.optional(v.string()),
        lemonSqueezyOrderId:v.optional(v.string()),
    }).index("by_user_id",["userId"]),//to get this information by userId
    codeExecution:defineTable({
        userId:v.string(),
        language:v.string(),
        code:v.string(),
       output:v.optional(v.string()),
       error:v.optional(v.string()),
    }).index("by_user_id",["userId"]),//to get this easily information by userId
    snippets:defineTable({
        userId:v.string(),
        title:v.string(),
        language:v.string(),
        code:v.string(),
        userName:v.string(),//stores user's name for easy access
    }).index("by_user_id",["userId"]),//to get this easily information by userId
    snippetComments:defineTable({
        snippetId:v.id("snippets"),
        userId:v.string(),
        userName:v.string(),//stores user's name for easy access
        content:v.string(),//this will store HTML content
    }).index("by_snippet_id",["snippetId"]),//to get this easily information by userId
    stars:defineTable({
        snippetId:v.id("snippets"),
        userId:v.id("users"),
    })
    .index("by_snippet_id",["snippetId"])
    .index("by_user_id",["userId"])
    .index("by_snippet_id_and_user_id",["snippetId","userId"]),
})