import { v } from 'convex/values';
import { internalMutation } from './_generated/server';
import type { Id } from './_generated/dataModel';
import values from './values';

async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password: string, passwordHash: string) {
  return (await hashPassword(password)) === passwordHash;
}

export const registerStudent = internalMutation({
  args: {
    sen: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { sen, password }): Promise<Id<'users'>> => {
    const student = await ctx.db.query('students').withIndex('by_sen', (q) => q.eq('sen', sen)).unique();
    if (!student) {
      throw new Error('SEN not found. Contact your administrator.');
    }
    if (student.password_set) {
      throw new Error('This SEN is already registered.');
    }

    const password_hash = await hashPassword(password);
    let user = await ctx.db.query('users').withIndex('by_sen', (q) => q.eq('sen', sen)).unique();
    let userId: Id<'users'>;
    if (user) {
      userId = user._id;
      await ctx.db.patch(userId, {
        role: 'student',
        sen,
        studentId: student._id,
        name: student.name || '',
        username: sen,
      });
    } else {
      userId = await ctx.db.insert('users', {
        role: 'student',
        sen,
        studentId: student._id,
        name: student.name || '',
        username: sen,
      });
    }

    await ctx.db.patch(student._id, {
      password_set: true,
      password_hash,
      studentUserId: userId,
    });
    return userId;
  },
});

export const loginStudent = internalMutation({
  args: {
    sen: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { sen, password }): Promise<Id<'users'>> => {
    const student = await ctx.db.query('students').withIndex('by_sen', (q) => q.eq('sen', sen)).unique();
    if (!student) {
      throw new Error('SEN not found. Contact your administrator.');
    }
    if (!student.password_set || !student.password_hash) {
      throw new Error('This SEN is not yet registered.');
    }
    if (!(await verifyPassword(password, student.password_hash))) {
      throw new Error('Invalid password.');
    }

    let user = await ctx.db.query('users').withIndex('by_sen', (q) => q.eq('sen', sen)).unique();
    if (user) {
      return user._id;
    }

    const userId = await ctx.db.insert('users', {
      role: 'student',
      sen,
      studentId: student._id,
      name: student.name || '',
      username: sen,
    });
    await ctx.db.patch(student._id, { studentUserId: userId });
    return userId;
  },
});

export const ensureAdmin = internalMutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { username, password }): Promise<Id<'users'>> => {
    if (username !== values.ADMIN_USERNAME || password !== values.ADMIN_PASSWORD) {
      throw new Error('Invalid admin credentials.');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_role_and_username', (q) => q.eq('role', 'admin').eq('username', username))
      .unique();
    if (user) {
      return user._id;
    }

    return await ctx.db.insert('users', {
      role: 'admin',
      username,
      name: values.ADMIN_NAME,
    });
  },
});
