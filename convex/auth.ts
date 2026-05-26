import { convexAuth } from '@convex-dev/auth/server';
import { ConvexCredentials } from '@convex-dev/auth/providers/ConvexCredentials';
import { internal } from './_generated/api';
import type { DataModel, Id } from './_generated/dataModel';

const StudentCredentials = ConvexCredentials<DataModel>({
  id: 'student',
  authorize: async (credentials, ctx) => {
    const sen = String(credentials.sen ?? credentials.identifier ?? '').trim();
    const password = String(credentials.password ?? '');
    const mode = String(credentials.mode ?? 'login');

    if (!sen || !password) {
      throw new Error('SEN and password are required.');
    }

    let userId: Id<'users'>;
    if (mode === 'register') {
      userId = await ctx.runMutation(internal.authHelpers.registerStudent, { sen, password });
    } else {
      userId = await ctx.runMutation(internal.authHelpers.loginStudent, { sen, password });
    }
    return { userId };
  },
});

const AdminCredentials = ConvexCredentials<DataModel>({
  id: 'admin',
  authorize: async (credentials, ctx) => {
    const username = String(credentials.username ?? '').trim();
    const password = String(credentials.password ?? '');

    const userId: Id<'users'> = await ctx.runMutation(internal.authHelpers.ensureAdmin, { username, password });
    return { userId };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [StudentCredentials, AdminCredentials],
});
