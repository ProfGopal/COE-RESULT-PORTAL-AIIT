import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(v.union(v.literal('admin'), v.literal('student'))),
    sen: v.optional(v.string()),
    studentId: v.optional(v.id('students')),
    username: v.optional(v.string()),
  })
    .index('email', ['email'])
    .index('phone', ['phone'])
    .index('by_sen', ['sen'])
    .index('by_role_and_username', ['role', 'username']),
  students: defineTable({
    sen: v.string(),
    name: v.string(),
    importedAt: v.number(),
    password_set: v.boolean(),
    password_hash: v.string(),
    studentUserId: v.optional(v.id('users')),
    cgpa: v.string(),
  }).index('by_sen', ['sen']),
  records: defineTable({
    studentId: v.id('students'),
    sen: v.string(),
    studentName: v.string(),
    courseCode: v.string(),
    courseTitle: v.string(),
    grade: v.string(),
    credits: v.string(),
    semester: v.string(),
    cgpa: v.string(),
    batchId: v.string(),
    uploadedAt: v.number(),
  })
    .index('by_studentId', ['studentId'])
    .index('by_batchId', ['batchId'])
    .index('by_uploadedAt', ['uploadedAt']),
  uploads: defineTable({
    batchId: v.string(),
    filename: v.string(),
    uploadedAt: v.number(),
    uploadedBy: v.string(),
    recordCount: v.number(),
  })
    .index('by_batchId', ['batchId'])
    .index('by_uploadedAt', ['uploadedAt']),
});
