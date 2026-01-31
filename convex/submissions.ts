import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const CORRECT_ANSWERS = [2, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1];
const TOTAL_QUESTIONS = 20;

export const submitQuiz = mutation({
  args: {
    studentName: v.string(),
    telegramHandle: v.string(),
    answers: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    let score = 0;
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      if (args.answers[i] === CORRECT_ANSWERS[i]) {
        score++;
      }
    }

    await ctx.db.insert("submissions", {
      studentName: args.studentName,
      telegramHandle: args.telegramHandle,
      answers: args.answers,
      score,
      totalQuestions: TOTAL_QUESTIONS,
      submittedAt: Date.now(),
    });

    return score;
  },
});

export const getSubmissions = query({
  args: {},
  handler: async (ctx) => {
    const submissions = await ctx.db.query("submissions").collect();
    submissions.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.submittedAt - a.submittedAt;
    });
    return submissions;
  },
});
