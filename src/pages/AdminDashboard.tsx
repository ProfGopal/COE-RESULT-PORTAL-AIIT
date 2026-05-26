import { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { anyApi } from 'convex/server';
import DropZone from '../components/DropZone';
import type { AuthUser, StudentProfile, StudentRecord, UploadBatch } from '../types';

type AdminDashboardProps = {
  navigate: (path: string) => void;
  currentUser: AuthUser;
};

export default function AdminDashboard({ navigate, currentUser }: AdminDashboardProps) {
  const { signOut } = useAuthActions();
  const [status, setStatus] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<StudentRecord | null>(null);
  const [editGrade, setEditGrade] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editCredits, setEditCredits] = useState('');
  const [editSemester, setEditSemester] = useState('');

  const students = useQuery(anyApi.admin.listStudents) as StudentProfile[] | undefined;
  const records = useQuery(anyApi.admin.listRecords) as StudentRecord[] | undefined;
  const uploads = useQuery(anyApi.upload.listUploads) as UploadBatch[] | undefined;

  const ingestUpload = useMutation(anyApi.upload.ingestUpload);
  const clearStudentPassword = useMutation(anyApi.admin.clearStudentPassword);
  const deleteRecord = useMutation(anyApi.admin.deleteRecord);
  const updateRecord = useMutation(anyApi.admin.updateRecord);
  const deleteUploadBatch = useMutation(anyApi.admin.deleteUploadBatch);

  const handleUploadFiles = async (files: FileList | File[]) => {
    setStatus(null);
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        await ingestUpload({ filename: file.name, bytes, uploadedBy: currentUser.username ?? currentUser.name ?? 'admin' });
        setStatus(`Uploaded ${file.name} successfully.`);
      } catch (error: any) {
        setStatus(error?.message || `Upload failed for ${file.name}.`);
      }
    }
  };

  const handleRecordEdit = (record: StudentRecord) => {
    setSelectedRecord(record);
    setEditGrade(record.grade);
    setEditTitle(record.courseTitle);
    setEditCredits(record.credits);
    setEditSemester(record.semester);
  };

  const handleSaveRecord = async () => {
    if (!selectedRecord) return;
    try {
      await updateRecord({
        recordId: selectedRecord._id,
        courseTitle: editTitle,
        grade: editGrade,
        credits: editCredits,
        semester: editSemester,
      });
      setStatus('Record updated successfully.');
      setSelectedRecord(null);
    } catch (error: any) {
      setStatus(error?.message || 'Unable to update record.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
              <p className="text-slate-600">Full dataset control, file uploads, student access management, and real-time sync.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                Signed in as <span className="font-medium text-slate-900">{currentUser.username || currentUser.name}</span>
              </div>
              <button
                onClick={async () => {
                  await signOut();
                  navigate('/admin');
                }}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Master Uploads</h2>
                  <p className="text-slate-600">Upload Excel or CSV files to ingest full student records immediately.</p>
                </div>
              </div>

              <div className="mt-6">
                <DropZone onFiles={handleUploadFiles} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
              <h2 className="text-xl font-semibold">Upload history</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">File</th>
                      <th className="px-4 py-3">Records</th>
                      <th className="px-4 py-3">Uploaded</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {uploads && uploads.length > 0 ? (
                      uploads.map((batch) => (
                        <tr key={batch._id} className="hover:bg-slate-50">
                          <td className="px-4 py-4 font-medium text-slate-800">{batch.filename}</td>
                          <td className="px-4 py-4 text-slate-600">{batch.recordCount}</td>
                          <td className="px-4 py-4 text-slate-600">{new Date(batch.uploadedAt).toLocaleString()}</td>
                          <td className="px-4 py-4">
                            <button
                              onClick={async () => {
                                try {
                                  await deleteUploadBatch({ batchId: batch.batchId });
                                  setStatus(`Batch deleted: ${batch.filename}`);
                                } catch (error: any) {
                                  setStatus(error?.message || 'Unable to delete batch.');
                                }
                              }}
                              className="rounded-2xl bg-rose-500 px-4 py-2 text-sm text-white transition hover:bg-rose-600"
                            >
                              Delete batch
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          No upload batches yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
              <h2 className="text-xl font-semibold">Student access</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">SEN</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {students && students.length > 0 ? (
                      students.map((student) => (
                        <tr key={student._id} className="hover:bg-slate-50">
                          <td className="px-4 py-4 font-medium text-slate-800">{student.sen}</td>
                          <td className="px-4 py-4 text-slate-600">{student.name || '—'}</td>
                          <td className="px-4 py-4 text-slate-600">
                            {student.password_set ? 'Password set' : 'Password not set'}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={async () => {
                                try {
                                  await clearStudentPassword({ sen: student.sen });
                                  setStatus(`Password cleared for ${student.sen}.`);
                                } catch (error: any) {
                                  setStatus(error?.message || 'Unable to clear password.');
                                }
                              }}
                              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-700"
                            >
                              Clear password
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          No student records available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
              <h2 className="text-xl font-semibold">Dataset editor</h2>
              <p className="mt-2 text-slate-600">Select a record to update grade, course title, credits, or semester.</p>
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">SEN</th>
                      <th className="px-4 py-3">Course</th>
                      <th className="px-4 py-3">Grade</th>
                      <th className="px-4 py-3">Semester</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {records && records.length > 0 ? (
                      records.slice(0, 10).map((record) => (
                        <tr key={record._id} className="hover:bg-slate-50">
                          <td className="px-4 py-4 font-medium text-slate-800">{record.sen}</td>
                          <td className="px-4 py-4 text-slate-600">{record.courseTitle || '—'}</td>
                          <td className="px-4 py-4 text-slate-900">{record.grade || '—'}</td>
                          <td className="px-4 py-4 text-slate-600">{record.semester || '—'}</td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => handleRecordEdit(record)}
                              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-700"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          No dataset records available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedRecord ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
                <h2 className="text-xl font-semibold">Edit record</h2>
                <div className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Course Title</span>
                      <input
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-500"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Grade</span>
                      <input
                        value={editGrade}
                        onChange={(event) => setEditGrade(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-500"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Credits</span>
                      <input
                        value={editCredits}
                        onChange={(event) => setEditCredits(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-500"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Semester</span>
                      <input
                        value={editSemester}
                        onChange={(event) => setEditSemester(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-500"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleSaveRecord}
                      className="rounded-2xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-700"
                    >
                      Save changes
                    </button>
                    <button
                      onClick={() => setSelectedRecord(null)}
                      className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {status ? (
          <div className="rounded-3xl bg-slate-100 p-4 text-slate-700">{status}</div>
        ) : null}
      </div>
    </div>
  );
}
