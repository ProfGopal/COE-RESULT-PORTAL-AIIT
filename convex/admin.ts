import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const listStudents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('students').withIndex('by_sen').take(1000);
  },
});

export const listRecords = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('records').withIndex('by_uploadedAt').order('desc').take(1000);
  },
});

export const createRecord = mutation({
  args: {
    studentId: v.id('students'),
    sen: v.string(),
    studentName: v.string(),
    courseCode: v.string(),
    courseTitle: v.string(),
    grade: v.string(),
    credits: v.string(),
    semester: v.string(),
    batchId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('records', {
      studentId: args.studentId,
      sen: args.sen,
      studentName: args.studentName,
      courseCode: args.courseCode,
      courseTitle: args.courseTitle,
      grade: args.grade,
      credits: args.credits,
      semester: args.semester,
      cgpa: '',
      batchId: args.batchId,
      uploadedAt: Date.now(),
    });
    return true;
  },
});

export const updateRecord = mutation({
  args: {
    recordId: v.id('records'),
    courseTitle: v.string(),
    grade: v.string(),
    credits: v.string(),
    semester: v.string(),
  },
  handler: async (ctx, { recordId, courseTitle, grade, credits, semester }) => {
    await ctx.db.patch(recordId, {
      courseTitle,
      grade,
      credits,
      semester,
    });
    return true;
  },
});

export const deleteRecord = mutation({
  args: { recordId: v.id('records') },
  handler: async (ctx, { recordId }) => {
    await ctx.db.delete(recordId);
    return true;
  },
});

export const clearStudentPassword = mutation({
  args: { sen: v.string() },
  handler: async (ctx, { sen }) => {
    const student = await ctx.db.query('students').withIndex('by_sen', (q) => q.eq('sen', sen)).unique();
    if (!student) {
      throw new Error('Student not found.');
    }

    await ctx.db.patch(student._id, {
      password_set: false,
      password_hash: '',
    });

    if (student.studentUserId) {
      const sessions = await ctx.db
        .query('authSessions')
        .withIndex('userId', (q) => q.eq('userId', student.studentUserId!))
        .take(1000);
      for (const session of sessions) {
        const refreshTokens = await ctx.db
          .query('authRefreshTokens')
          .withIndex('sessionIdAndParentRefreshTokenId', (q) => q.eq('sessionId', session._id))
          .take(1000);
        for (const refreshToken of refreshTokens) {
          await ctx.db.delete(refreshToken._id);
        }
        await ctx.db.delete(session._id);
      }
    }
    return true;
  },
});

export const deleteUploadBatch = mutation({
  args: { batchId: v.string() },
  handler: async (ctx, { batchId }) => {
    const records = await ctx.db.query('records').withIndex('by_batchId', (q) => q.eq('batchId', batchId)).take(1000);
    for (const record of records) {
      await ctx.db.delete(record._id);
    }
    const upload = await ctx.db.query('uploads').withIndex('by_batchId', (q) => q.eq('batchId', batchId)).unique();
    if (upload) {
      await ctx.db.delete(upload._id);
    }
    return true;
  },
});
