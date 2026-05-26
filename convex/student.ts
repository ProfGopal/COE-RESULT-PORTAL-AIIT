import { v } from 'convex/values';
import { query } from './_generated/server';

export const findStudentBySen = query({
  args: { sen: v.string() },
  handler: async (ctx, { sen }) => {
    return await ctx.db.query('students').withIndex('by_sen', (q) => q.eq('sen', sen)).unique();
  },
});

export const listStudentRecords = query({
  args: { studentId: v.id('students') },
  handler: async (ctx, { studentId }) => {
    return await ctx.db
      .query('records')
      .withIndex('by_studentId', (q) => q.eq('studentId', studentId))
      .take(1000);
  },
});
