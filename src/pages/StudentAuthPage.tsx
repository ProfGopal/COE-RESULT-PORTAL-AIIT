import { FormEvent, useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvex } from 'convex/react';
import { anyApi } from 'convex/server';

type StudentAuthPageProps = {
  navigate: (path: string) => void;
};

export default function StudentAuthPage({ navigate }: StudentAuthPageProps) {
  const [sen, setSen] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [awaiting, setAwaiting] = useState(false);
  const [mode, setMode] = useState<'lookup' | 'login' | 'register'>('lookup');

  const { signIn } = useAuthActions();
  const convex = useConvex();

  const handleLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    if (!sen.trim()) {
      setStatus('Enter your SEN number.');
      return;
    }
    setAwaiting(true);
    try {
      const student = await convex.query(anyApi.student.findStudentBySen, { sen: sen.trim() });
      if (!student) {
        setStatus('SEN not found. Ask admin to upload your record.');
        setMode('lookup');
      } else if (student.password_set) {
        setStudentName(student.name ?? 'Student');
        setMode('login');
      } else {
        setStudentName(student.name ?? 'Student');
        setMode('register');
      }
    } catch (error: any) {
      setStatus(error?.message || 'Unable to verify SEN.');
      setMode('lookup');
    } finally {
      setAwaiting(false);
    }
  };

  const handleSubmitPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    if (!sen.trim() || !password.trim()) {
      setStatus('Enter both your SEN and password.');
      return;
    }
    setAwaiting(true);
    try {
      await signIn('student', {
        sen: sen.trim(),
        password: password.trim(),
        mode: mode === 'register' ? 'register' : 'login',
      });
      navigate('/student');
    } catch (error: any) {
      setStatus(error?.message || 'Authentication failed.');
    } finally {
      setAwaiting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold">Student Portal</h1>
            <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-900">
              Back
            </button>
          </div>
          <p className="text-slate-600">
            Use your official SEN. If your account has not been activated, you can register once your enrollment data is uploaded.
          </p>

          {mode === 'lookup' ? (
            <form onSubmit={handleLookup} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">SEN Number</span>
                <input
                  value={sen}
                  onChange={(event) => setSen(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-500"
                  placeholder="Enter your SEN"
                />
              </label>
              <button
                type="submit"
                disabled={awaiting}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitPassword} className="space-y-4">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">SEN: <span className="font-medium text-slate-900">{sen}</span></p>
                <p className="text-sm text-slate-500">Name: <span className="font-medium text-slate-900">{studentName}</span></p>
                <p className="text-sm text-slate-500">Mode: <span className="font-medium text-slate-900">{mode === 'register' ? 'Create password' : 'Login'}</span></p>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-500"
                  placeholder="Enter a secure password"
                />
              </label>
              <button
                type="submit"
                disabled={awaiting}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mode === 'register' ? 'Create Password and Sign In' : 'Sign In'}
              </button>
            </form>
          )}

          {status ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{status}</p> : null}
        </div>
      </div>
    </div>
  );
}
