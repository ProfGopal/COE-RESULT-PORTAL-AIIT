import { FormEvent, useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';

type AdminLoginPageProps = {
  navigate: (path: string) => void;
};

export default function AdminLoginPage({ navigate }: AdminLoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { signIn } = useAuthActions();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    if (!username.trim() || !password.trim()) {
      setStatus('Enter both admin username and password.');
      return;
    }
    setBusy(true);
    try {
      await signIn('admin', { username: username.trim(), password: password.trim() });
      navigate('/admin');
    } catch (error: any) {
      setStatus(error?.message || 'Admin login failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Admin Login</h1>
          <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-900">
            Back
          </button>
        </div>
        <p className="mt-4 text-slate-600">
          Use the seeded admin username and password. The admin portal gives you complete CRUD access to students, records, and uploads.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-500"
              placeholder="admin"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-500"
              placeholder="Enter admin password"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sign in as Admin
          </button>
        </form>

        {status ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{status}</div> : null}
      </div>
    </div>
  );
}
