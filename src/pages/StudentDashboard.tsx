import { useEffect, useMemo } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { anyApi } from 'convex/server';
import type { AuthUser, StudentRecord } from '../types';

type StudentDashboardProps = {
  navigate: (path: string) => void;
  currentUser: AuthUser;
};

type SemesterSummary = {
  label: string;
  records: StudentRecord[];
  courseCount: number;
  credits: number;
};

function parseCredits(value: string | undefined): number {
  const parsed = Number.parseFloat(String(value ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCredits(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getSemesterLabel(value: string | undefined): string {
  const normalized = String(value ?? '').trim();
  return normalized && normalized !== '-' ? normalized : 'Semester not specified';
}

function getSemesterSortValue(label: string): number {
  const match = label.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
}

export default function StudentDashboard({ navigate, currentUser }: StudentDashboardProps) {
  const { signOut } = useAuthActions();
  const records = useQuery(
    anyApi.student.listStudentRecords,
    currentUser.studentId ? { studentId: currentUser.studentId } : 'skip',
  );
  const userQuery = useQuery(anyApi.viewer.currentUser);

  const summary = useMemo(() => {
    const typedRecords = (records ?? []) as StudentRecord[];
    const courseRecords = typedRecords.filter((row) => row.courseCode?.trim());
    const cgpaRow = typedRecords.find((row) => row.cgpa && !row.courseCode);
    const semesterMap = new Map<string, StudentRecord[]>();

    for (const record of courseRecords) {
      const semester = getSemesterLabel(record.semester);
      semesterMap.set(semester, [...(semesterMap.get(semester) ?? []), record]);
    }

    const semesters: SemesterSummary[] = Array.from(semesterMap.entries())
      .map(([label, semesterRecords]) => ({
        label,
        records: semesterRecords,
        courseCount: semesterRecords.length,
        credits: semesterRecords.reduce((total, record) => total + parseCredits(record.credits), 0),
      }))
      .sort((left, right) => {
        const semesterDiff = getSemesterSortValue(left.label) - getSemesterSortValue(right.label);
        return semesterDiff || left.label.localeCompare(right.label);
      });

    return {
      cgpa: cgpaRow?.cgpa ?? '',
      count: typedRecords.length,
      courseCount: courseRecords.length,
      totalCredits: courseRecords.reduce((total, record) => total + parseCredits(record.credits), 0),
      semesters,
    };
  }, [records]);

  useEffect(() => {
    if (userQuery?.role !== 'student') {
      navigate('/student');
    }
  }, [userQuery, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Student Dashboard</h1>
              <p className="text-slate-600">Welcome back, {currentUser.name ?? currentUser.sen}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                SEN: <span className="font-medium text-slate-900">{currentUser.sen}</span>
              </div>
              <button
                onClick={async () => {
                  await signOut();
                  navigate('/student');
                }}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Your Results</h2>
                <p className="text-slate-600">This view is filtered to your SEN only and updates live.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-72">
                <div className="rounded-md bg-slate-100 px-4 py-3">
                  <p className="text-slate-500">Total credits</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {formatCredits(summary.totalCredits)}
                  </p>
                </div>
                <div className="rounded-md bg-slate-100 px-4 py-3">
                  <p className="text-slate-500">Completed courses</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{summary.courseCount}</p>
                </div>
              </div>
            </div>

            {summary.semesters.length ? (
              <div className="mt-6 space-y-8">
                {summary.semesters.map((semester) => (
                  <section key={semester.label} className="border-t border-slate-200 pt-5 first:border-t-0 first:pt-0">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-base font-semibold text-slate-900">{semester.label}</h3>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="rounded-md bg-slate-100 px-3 py-2 text-slate-700">
                          {semester.courseCount} courses completed
                        </span>
                        <span className="rounded-md bg-slate-100 px-3 py-2 text-slate-700">
                          {formatCredits(semester.credits)} credits
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Course Code</th>
                            <th className="px-4 py-3">Course Title</th>
                            <th className="px-4 py-3">Grade</th>
                            <th className="px-4 py-3">Credits</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {semester.records.map((record) => (
                            <tr key={record._id} className="hover:bg-slate-50">
                              <td className="px-4 py-4 font-medium text-slate-800">{record.courseCode || '-'}</td>
                              <td className="px-4 py-4 text-slate-600">{record.courseTitle || '-'}</td>
                              <td className="px-4 py-4 text-slate-900">{record.grade || '-'}</td>
                              <td className="px-4 py-4 text-slate-600">{record.credits || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-md bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No records found yet. Ask the admin to upload your master file.
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold">Quick summary</h3>
              <div className="mt-4 space-y-3 text-slate-700">
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <span>SEN</span>
                  <span className="text-right font-medium text-slate-900">{currentUser.sen}</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <span>Name</span>
                  <span className="text-right font-medium text-slate-900">{currentUser.name || '-'}</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <span>Records</span>
                  <span className="font-medium text-slate-900">{summary.count}</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <span>Courses completed</span>
                  <span className="font-medium text-slate-900">{summary.courseCount}</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <span>Total credits completed</span>
                  <span className="font-medium text-slate-900">{formatCredits(summary.totalCredits)}</span>
                </div>
                <div className="flex justify-between gap-4 pt-3">
                  <span>CGPA</span>
                  <span className="font-semibold text-slate-900">{summary.cgpa || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
