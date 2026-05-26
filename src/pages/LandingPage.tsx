type LandingPageProps = {
  navigate: (path: string) => void;
};

export default function LandingPage({ navigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-lg">
        <div className="space-y-6 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">AIIT Student Result Portal</h1>
          <p className="mx-auto max-w-2xl text-slate-600">
            Choose your entry point. Students can register and login with an enrolled SEN after admin uploads their master dataset. Admins can manage uploads, student access, and the dataset in real time.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate('/student')}
              className="rounded-2xl bg-slate-900 px-6 py-4 text-white transition hover:bg-slate-700"
            >
              Student Portal
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
