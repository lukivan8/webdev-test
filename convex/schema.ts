import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  submissions: defineTable({
    studentName: v.string(),
    telegramHandle: v.string(),
    answers: v.array(v.number()),
    score: v.number(),
    totalQuestions: v.number(),
    submittedAt: v.number(),
  }),
});
